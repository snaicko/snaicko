# PROGRESS – AI Radar

Ultimo aggiornamento: 13 novembre 2026. Branch: `claude/ai-radar-ios-app-6gxove`.

## Stato delle fasi

| Fase | Stato | Dove |
|---|---|---|
| 1. Setup, schema, raccolta notizie, feed | codice completo | `supabase/migrations`, `supabase/functions/ingest`, `_shared/feeds.ts`, `src/app/(tabs)/index.tsx` |
| 2. Riassunti e tag con Claude, dettaglio | codice completo | `ingest/index.ts` (Haiku 5.5), `src/app/article/[id].tsx` |
| 3. Chat RAG con fonti | codice completo | `supabase/functions/chat`, `src/app/(tabs)/chat.tsx` |
| 4. Schede modello e confronto | codice completo | `seed.sql`, `ingest` (aggiornamento schede), `src/app/model/[id].tsx`, `src/app/compare.tsx` |
| 5. Notifiche e onboarding | codice completo | `supabase/functions/notify`, `_shared/push.ts`, `src/lib/push.ts`, `src/app/onboarding.tsx` |
| 6. Grafica, icona, testi App Store | completo | `assets/`, `docs/appstore.md`, `docs/privacy.md`, `docs/support.md` |

## Cosa è stato verificato

- `npx tsc --noEmit`: nessun errore.
- `npx expo export --platform ios`: il bundle iOS viene generato.
- `deno check` sulle tre Edge Functions: nessun errore di tipo.
- Parser delle fonti provato dal vivo su anthropic.com/news e su RSS/Atom di esempio.
- Tutte le schermate aperte in anteprima web con dati finti (onboarding, feed, dettaglio, modelli,
  confronto, chat, impostazioni): nessun errore in console.

## Cosa NON è stato verificato (serve il tuo ambiente)

- Nessuna esecuzione reale contro Supabase e l'API Claude: migrazione SQL, funzioni, cron e push
  non sono mai stati eseguiti. Primo passo dopo il setup: lanciare `ingest` a mano e leggere la risposta.
- Gli URL dei feed in `seed.sql` (tranne Anthropic) non erano raggiungibili dall'ambiente di sviluppo:
  il campo `errors` della risposta di `ingest` dice quali correggere. Meta AI e Mistral usano la
  lettura della pagina indice (`html_index`) e sono i più fragili.
- Nessuna build nativa né test su iPhone/simulatore (Dynamic Type, VoiceOver, aptica, push).
- Soglie di ricerca semantica (`min_similarity` 0.78, duplicati 0.94 in `match_documents` /
  `find_duplicate`): valori di partenza, da tarare sui dati veri.

## Cosa manca

- Schede modello: complete solo per Claude (prezzi dal listino). GPT, Gemini, Llama e Mistral sono
  schede di famiglia con campi vuoti ("Dato non ancora disponibile") che si riempiono con le notizie.
  Per averle subito complete vanno compilate a mano in `seed.sql` o dalla dashboard.
- Screenshot per l'App Store.
- `OWNER_NAME` e `SUPPORT_EMAIL` in `src/content/legal.ts` (poi `npm run legal`).
- Valori in `eas.json` (`ascAppId`, `appleTeamId`) e `extra.eas.projectId` in `app.json` (`eas init`).

## Come riprendere

1. Leggi `SETUP.md` e completa i passi 2–3.
2. `npm install && npx tsc --noEmit` per controllare che tutto compili.
3. Lancia `ingest` con curl (vedi SETUP) e sistema le fonti che danno errore.
4. `npx expo start` e prova feed → dettaglio → chat.

## Decisioni prese

- Nessun login: un UUID casuale per dispositivo; il server lo conosce solo per notifiche e limite chat.
- Preferiti, interessi e cache offline in AsyncStorage (nessun dato utente nel database).
- Embedding `gte-small` nell'Edge Runtime (nessuna chiave extra). È un modello inglese: si indicizza
  `search_text` in inglese e la domanda viene riscritta in inglese da Haiku prima della ricerca.
- L'estratto dell'articolo sta in `article_raw` solo fino al riassunto, poi viene cancellato.
- Job: `claude-haiku-5-5`. Chat: `claude-opus-5-5` (modificabile con il secret `CHAT_MODEL`).
