-- Da eseguire UNA volta nell'SQL Editor di Supabase dopo il deploy delle funzioni.
-- Sostituisci <PROJECT_REF> e <CRON_SECRET> (lo stesso valore impostato nei secrets).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('ai-radar-ingest', '0 * * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/ingest',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb, timeout_milliseconds := 150000);
$$);

select cron.schedule('ai-radar-digest', '10 * * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/notify',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb, timeout_milliseconds := 60000);
$$);
