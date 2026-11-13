# SETUP – cosa devi fornire tu

Tutto ciò che serve da parte tua è in questo file. Tempo stimato: 45–60 minuti.

## 1. Account necessari

| Cosa | Dove | Note |
|---|---|---|
| Apple Developer Program | https://developer.apple.com/programs/ | 99 $/anno, obbligatorio per l'App Store |
| Account Expo | https://expo.dev | gratuito; serve per EAS Build/Submit e le push |
| Progetto Supabase | https://supabase.com/dashboard | annota **Project ref**, **URL** e **anon/publishable key** |
| Chiave API Claude | https://platform.claude.com | resta solo nei secrets di Supabase, mai nell'app |

## 2. Backend Supabase

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push --include-seed        # schema + fonti + schede modello iniziali
npx supabase secrets set ANTHROPIC_API_KEY=<la tua chiave> CRON_SECRET=<stringa casuale lunga>
npx supabase functions deploy ingest chat notify
```

Se `--include-seed` non applica il seed, incolla `supabase/seed.sql` nell'SQL Editor.

Poi, nell'SQL Editor di Supabase, esegui `supabase/cron.sql` dopo aver sostituito `<PROJECT_REF>` e
`<CRON_SECRET>`: attiva il job orario delle notizie e quello del digest.

Primo popolamento manuale (ripeti 2–3 volte: elabora 24 notizie per esecuzione):

```bash
curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/ingest -H "x-cron-secret: <CRON_SECRET>"
```

La risposta elenca in `errors` le fonti non raggiungibili: per quelle, correggi `url` nella tabella
`sources` oppure metti `active = false`.

Secrets opzionali:

| Secret | Default | Effetto |
|---|---|---|
| `CHAT_MODEL` | `claude-opus-5-5` | modello della chat. `claude-fable-5-2` è il più capace in assoluto ma costa il doppio ed è più lento |
| `JOB_MODEL` | `claude-haiku-5-5` | modello dei job (il più economico) |
| `CHAT_DEVICE_DAILY_LIMIT` | `30` | domande al giorno per dispositivo |
| `CHAT_GLOBAL_DAILY_LIMIT` | `2000` | tetto giornaliero complessivo, protegge la spesa |

## 3. App

1. `cp .env.example .env` e inserisci URL e anon key di Supabase.
2. In `src/content/legal.ts` compila `OWNER_NAME` e `SUPPORT_EMAIL`, poi `npm run legal`.
3. In `app.json` cambia `ios.bundleIdentifier` (ora `com.snaicko.airadar`) se ne vuoi un altro.
   **Dopo la prima pubblicazione non si può più cambiare.**
4. `npx eas-cli login` e `npx eas-cli init` (scrive `extra.eas.projectId` in `app.json`: serve alle push).
5. In `eas.json` → `submit.production.ios` inserisci `ascAppId` (ID numerico dell'app in
   App Store Connect) e `appleTeamId`.
6. Alla prima build EAS chiede di creare certificati e **chiave push APNs**: rispondi sì.

## 4. Pagine web richieste dall'App Store

GitHub → Settings → Pages → Deploy from branch → cartella `/docs`. Otterrai:

- Privacy policy: `https://<utente>.github.io/<repo>/privacy`
- Supporto: `https://<utente>.github.io/<repo>/support`

(Il repository deve essere pubblico, oppure ospita i due file altrove.)

## 5. App Store Connect

Crea l'app (stesso bundle identifier) e copia i testi da `docs/appstore.md`, che contiene anche le
risposte per l'etichetta privacy e le note per il revisore. Servono screenshot 6,9" (1320×2868):
falli dal simulatore dopo la prima build.
