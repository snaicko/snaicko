-- AI Radar: schema iniziale
create extension if not exists vector with schema extensions;

-- Fonti -----------------------------------------------------------------
create table public.sources (
  id text primary key,
  name text not null,
  company text,                         -- azienda di default per i blog ufficiali
  kind text not null check (kind in ('rss', 'html_index')),
  url text not null,
  link_pattern text,                    -- solo html_index: regex dei link agli articoli
  max_items int not null default 12,
  active boolean not null default true
);

-- Notizie ---------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.sources(id),
  url text not null unique,
  title text not null,                  -- titolo originale (solo titolo, mai il testo)
  title_it text,
  summary_it text,                      -- riassunto originale in 3 righe
  search_text text,                     -- sintesi in inglese usata per l'embedding
  company text,
  models text[] not null default '{}',
  category text check (category in ('lancio', 'sicurezza', 'benchmark', 'policy', 'ricerca')),
  importance int check (importance between 1 and 5),
  status text not null default 'new' check (status in ('new', 'done', 'skipped', 'duplicate', 'failed')),
  attempts int not null default 0,
  embedding extensions.vector(384),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  alerted_at timestamptz
);
create index articles_feed_idx on public.articles (published_at desc) where status = 'done';
create index articles_embedding_idx on public.articles using hnsw (embedding extensions.vector_cosine_ops);

-- Estratto grezzo: serve solo al job di riassunto, viene cancellato subito dopo.
create table public.article_raw (
  article_id uuid primary key references public.articles(id) on delete cascade,
  excerpt text not null
);

-- Schede modello --------------------------------------------------------
create table public.models (
  id text primary key,                  -- slug
  name text not null,
  company text not null,
  tagline text,
  performance text,
  pricing text,
  context_window text,
  privacy text,
  strengths text[] not null default '{}',
  limits text[] not null default '{}',
  sources jsonb not null default '[]',  -- [{title, url, date}]
  embedding extensions.vector(384),
  updated_at timestamptz not null default now()
);

-- Dispositivi (nessun login: l'id casuale del dispositivo è l'unica chiave) -
create table public.devices (
  id uuid primary key,
  push_token text,
  companies text[] not null default '{}',
  topics text[] not null default '{}',
  alerts boolean not null default true,
  digest boolean not null default true,
  digest_hour_utc int not null default 7 check (digest_hour_utc between 0 and 23),
  last_digest_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.chat_usage (
  device_id uuid not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (device_id, day)
);

-- Sicurezza: l'app (anon) legge solo notizie pronte, schede e fonti ------
alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_raw enable row level security;
alter table public.models enable row level security;
alter table public.devices enable row level security;
alter table public.chat_usage enable row level security;

create policy "read sources" on public.sources for select to anon using (true);
create policy "read done articles" on public.articles for select to anon using (status = 'done');
create policy "read models" on public.models for select to anon using (true);

-- RPC dispositivo -------------------------------------------------------
create function public.upsert_device(
  p_id uuid, p_push_token text, p_companies text[], p_topics text[],
  p_alerts boolean, p_digest boolean, p_digest_hour_utc int
) returns void language sql security definer set search_path = public as $$
  insert into devices (id, push_token, companies, topics, alerts, digest, digest_hour_utc, updated_at)
  values (p_id, p_push_token, p_companies, p_topics, p_alerts, p_digest, p_digest_hour_utc, now())
  on conflict (id) do update set
    push_token = excluded.push_token, companies = excluded.companies, topics = excluded.topics,
    alerts = excluded.alerts, digest = excluded.digest,
    digest_hour_utc = excluded.digest_hour_utc, updated_at = now();
$$;

create function public.delete_device(p_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from chat_usage where device_id = p_id;
  delete from devices where id = p_id;
$$;

grant execute on function public.upsert_device, public.delete_device to anon;

-- Limite giornaliero della chat (solo service role) ----------------------
create function public.bump_chat_usage(p_device uuid) returns int
language sql security definer set search_path = public as $$
  insert into chat_usage (device_id, count) values (p_device, 1)
  on conflict (device_id, day) do update set count = chat_usage.count + 1
  returning count;
$$;
revoke execute on function public.bump_chat_usage from public, anon, authenticated;

-- Ricerca semantica su notizie + schede (solo service role) --------------
create function public.match_documents(
  query_embedding extensions.vector(384), match_count int default 8, min_similarity float default 0.78
) returns table (
  kind text, id text, title text, body text, url text, source text, doc_date timestamptz, similarity float
) language sql stable set search_path = public, extensions as $$
  select * from (
    select 'article' as kind, a.id::text, coalesce(a.title_it, a.title) as title, a.summary_it as body,
           a.url, s.name as source, a.published_at as doc_date,
           1 - (a.embedding <=> query_embedding) as similarity
    from articles a join sources s on s.id = a.source_id
    where a.status = 'done' and a.embedding is not null
    union all
    select 'model', m.id, m.name,
           concat_ws(E'\n', m.tagline, 'Prestazioni: ' || m.performance, 'Prezzo: ' || m.pricing,
             'Contesto: ' || m.context_window, 'Privacy e dati: ' || m.privacy,
             'Punti di forza: ' || array_to_string(m.strengths, '; '),
             'Limiti: ' || array_to_string(m.limits, '; ')),
           m.sources -> 0 ->> 'url', m.company, m.updated_at,
           1 - (m.embedding <=> query_embedding)
    from models m where m.embedding is not null
  ) d
  where d.similarity >= min_similarity
  order by d.similarity desc
  limit match_count;
$$;
revoke execute on function public.match_documents from public, anon, authenticated;

-- Duplicati tra fonti diverse (stessa notizia, titolo diverso) -----------
create function public.find_duplicate(
  p_embedding extensions.vector(384), p_exclude uuid, p_threshold float default 0.94
) returns uuid language sql stable set search_path = public, extensions as $$
  select id from articles
  where status = 'done' and id <> p_exclude and embedding is not null
    and published_at > now() - interval '4 days'
    and 1 - (embedding <=> p_embedding) >= p_threshold
  order by embedding <=> p_embedding limit 1;
$$;
revoke execute on function public.find_duplicate from public, anon, authenticated;
