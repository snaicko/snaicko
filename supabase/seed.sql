-- Fonti. Solo canali ufficiali e testate; nessun testo viene copiato.
insert into public.sources (id, name, company, kind, url, link_pattern, max_items) values
  ('anthropic', 'Anthropic', 'anthropic', 'html_index', 'https://www.anthropic.com/news', '^/news/[a-z0-9-]+$', 10),
  ('openai', 'OpenAI', 'openai', 'rss', 'https://openai.com/news/rss.xml', null, 12),
  ('deepmind', 'Google DeepMind', 'google', 'rss', 'https://deepmind.google/blog/rss.xml', null, 12),
  ('meta-ai', 'Meta AI', 'meta', 'html_index', 'https://ai.meta.com/blog/', '^(https://ai\.meta\.com)?/blog/[a-z0-9-]+/?$', 10),
  ('mistral', 'Mistral AI', 'mistral', 'html_index', 'https://mistral.ai/news', '^/news/[a-z0-9-]+$', 10),
  ('huggingface', 'Hugging Face', 'huggingface', 'rss', 'https://huggingface.co/blog/feed.xml', null, 10),
  ('arxiv-cs-ai', 'arXiv cs.AI', null, 'rss', 'https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=10', null, 10),
  ('the-verge', 'The Verge', null, 'rss', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', null, 10),
  ('techcrunch', 'TechCrunch', null, 'rss', 'https://techcrunch.com/category/artificial-intelligence/feed/', null, 10),
  ('ars-technica', 'Ars Technica', null, 'rss', 'https://arstechnica.com/ai/feed/', null, 10),
  ('mit-tr', 'MIT Technology Review', null, 'rss', 'https://www.technologyreview.com/topic/artificial-intelligence/feed', null, 10)
on conflict (id) do nothing;

-- Schede modello di partenza.
-- I campi lasciati a null compaiono nell'app come "dato non ancora disponibile" e vengono
-- compilati dal job quando arriva una notizia collegata. Prezzi Claude: listino API Anthropic.
insert into public.models (id, name, company, tagline, performance, pricing, context_window, privacy, strengths, limits, sources) values
  ('claude-fable-5-2', 'Claude Fable 5.2', 'anthropic',
   'Il modello Claude più capace disponibile al pubblico, per ragionamento e compiti lunghi.',
   null, '8 $ / 40 $ per milione di token (input / output)', '1M token',
   'Richiede la conservazione dei dati per 30 giorni; non disponibile in modalità zero data retention salvo autorizzazione.',
   '{"Ragionamento complesso","Compiti agentici di lunga durata"}',
   '{"Costo superiore alla fascia Opus","Risposte più lente sui compiti difficili"}',
   '[{"title":"Documentazione modelli Anthropic","url":"https://platform.claude.com/docs/en/about-claude/models/overview"}]'),
  ('claude-opus-5-5', 'Claude Opus 5.5', 'anthropic',
   'Il modello Opus corrente: alta capacità a costo inferiore rispetto alla generazione precedente.',
   null, '4 $ / 20 $ per milione di token (input / output)', '1M token', null,
   '{"Coding e lavoro agentico","Output fino a 128K token"}', '{}',
   '[{"title":"Documentazione modelli Anthropic","url":"https://platform.claude.com/docs/en/about-claude/models/overview"}]'),
  ('claude-sonnet-5-5', 'Claude Sonnet 5.5', 'anthropic',
   'Equilibrio tra velocità e capacità per l''uso quotidiano.',
   null, '2 $ / 10 $ per milione di token (input / output)', '1M token', null,
   '{"Velocità","Buon rapporto qualità/prezzo"}', '{}',
   '[{"title":"Documentazione modelli Anthropic","url":"https://platform.claude.com/docs/en/about-claude/models/overview"}]'),
  ('claude-haiku-5-5', 'Claude Haiku 5.5', 'anthropic',
   'Il modello Claude più economico e veloce, adatto a grandi volumi.',
   null, '0,10 $ / 0,50 $ per milione di token fino a 100K token di prompt', '1M token', null,
   '{"Costo molto basso","Latenza ridotta"}', '{"Meno adatto ai ragionamenti più complessi"}',
   '[{"title":"Documentazione modelli Anthropic","url":"https://platform.claude.com/docs/en/about-claude/models/overview"}]'),
  ('gpt', 'GPT (famiglia)', 'openai', 'La famiglia di modelli di punta di OpenAI.',
   null, null, null, null, '{}', '{}',
   '[{"title":"Documentazione modelli OpenAI","url":"https://platform.openai.com/docs/models"}]'),
  ('gemini', 'Gemini (famiglia)', 'google', 'La famiglia di modelli multimodali di Google.',
   null, null, null, null, '{}', '{}',
   '[{"title":"Documentazione modelli Gemini","url":"https://ai.google.dev/gemini-api/docs/models"}]'),
  ('llama', 'Llama (famiglia)', 'meta', 'I modelli a pesi aperti di Meta.',
   null, null, null, null, '{"Pesi scaricabili ed eseguibili in proprio"}', '{}',
   '[{"title":"Llama","url":"https://www.llama.com/"}]'),
  ('mistral', 'Mistral (famiglia)', 'mistral', 'I modelli dell''azienda europea Mistral AI.',
   null, null, null, null, '{}', '{}',
   '[{"title":"Documentazione modelli Mistral","url":"https://docs.mistral.ai/getting-started/models/"}]')
on conflict (id) do nothing;
