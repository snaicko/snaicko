// Testi di privacy e supporto: unica fonte per l'app e per le pagine web (npm run legal -> docs/).
// DA COMPILARE prima della pubblicazione (vedi SETUP.md):
export const OWNER_NAME = "[NOME E COGNOME O RAGIONE SOCIALE]";
export const SUPPORT_EMAIL = "support@example.com";
export const UPDATED = "13 novembre 2026";

export type Section = { h: string; p: string[] };
export type Doc = { title: string; intro: string; sections: Section[] };

export const privacy: Doc = {
  title: "Informativa sulla privacy",
  intro: `AI Radar è pensata per funzionare senza sapere chi sei: non c'è registrazione, non chiediamo nome, email o numero di telefono, non ci sono pubblicità né strumenti di tracciamento. Ultimo aggiornamento: ${UPDATED}.`,
  sections: [
    {
      h: "Titolare del trattamento",
      p: [`${OWNER_NAME}. Per qualsiasi richiesta: ${SUPPORT_EMAIL}.`],
    },
    {
      h: "Dati che restano solo sul tuo dispositivo",
      p: [
        "Le notizie salvate tra i preferiti, gli interessi scelti, le impostazioni e la copia delle ultime notizie per la lettura offline sono memorizzati solo sul tuo dispositivo.",
        "La cronologia della chat resta in memoria finché l'app è aperta e non viene salvata.",
      ],
    },
    {
      h: "Dati inviati ai nostri server",
      p: [
        "Identificativo casuale del dispositivo: un codice generato dall'app al primo avvio, non collegato alla tua identità, al tuo Apple ID o ad altri identificativi del telefono.",
        "Se attivi le notifiche: il token di notifica push, le aziende e i temi che segui e le tue preferenze di notifica (alert, digest e orario). Servono solo a inviarti le notifiche che hai chiesto.",
        "Se usi la chat: la domanda e gli ultimi messaggi della conversazione vengono inviati al server per generare la risposta. Non li conserviamo. Registriamo soltanto quante domande ha fatto il tuo identificativo in un dato giorno, per applicare un limite d'uso.",
        "Come per ogni servizio online, l'infrastruttura può registrare per breve tempo dati tecnici (indirizzo IP, data e ora della richiesta) per sicurezza e diagnostica.",
      ],
    },
    {
      h: "Fornitori che trattano i dati per nostro conto",
      p: [
        "Supabase: ospita il database e le funzioni server.",
        "Anthropic: elabora le domande della chat tramite l'API di Claude per generare le risposte. Anthropic tratta questi contenuti secondo i propri termini per l'uso dell'API e può conservarli per un periodo limitato per finalità di sicurezza.",
        "Expo e Apple: recapitano le notifiche push tramite il token del dispositivo.",
        "Non vendiamo dati e non li condividiamo con terzi per finalità pubblicitarie.",
      ],
    },
    {
      h: "Consiglio sull'uso della chat",
      p: ["Non inserire nella chat dati personali o riservati: non servono per ottenere una risposta."],
    },
    {
      h: "Base giuridica e conservazione",
      p: [
        "Trattiamo i dati per fornirti il servizio che richiedi (notifiche, chat) e, per i dati tecnici, per il legittimo interesse a mantenere il servizio sicuro.",
        "Le preferenze di notifica restano finché non le disattivi o cancelli i dati. I contatori d'uso della chat vengono rimossi quando cancelli i dati.",
      ],
    },
    {
      h: "Cancellazione dei dati e diritti",
      p: [
        "In Impostazioni > Cancella i miei dati elimini subito tutto ciò che è sul dispositivo e tutto ciò che i nostri server associano al tuo identificativo (token di notifica, interessi, contatori della chat).",
        `Puoi inoltre esercitare i diritti previsti dal GDPR (accesso, rettifica, cancellazione, limitazione, opposizione, reclamo al Garante per la protezione dei dati personali) scrivendo a ${SUPPORT_EMAIL}.`,
      ],
    },
    {
      h: "Contenuti e fonti",
      p: [
        "L'app mostra riassunti originali generati automaticamente e rimanda sempre all'articolo della fonte. I link aprono siti di terzi, che applicano le proprie informative.",
      ],
    },
    {
      h: "Minori",
      p: ["L'app non è rivolta a minori di 13 anni e non raccoglie consapevolmente i loro dati."],
    },
    {
      h: "Modifiche",
      p: ["Se questa informativa cambia, aggiorniamo la data in alto e, per modifiche rilevanti, lo segnaliamo nell'app."],
    },
  ],
};

export const support: Doc = {
  title: "Supporto",
  intro: `Hai un problema o un suggerimento? Scrivi a ${SUPPORT_EMAIL}: rispondiamo di solito entro tre giorni lavorativi.`,
  sections: [
    {
      h: "Cos'è AI Radar",
      p: [
        "Un'app che raccoglie le novità sull'intelligenza artificiale da blog ufficiali e testate, le riassume in italiano in tre righe, ne valuta l'importanza e ti permette di fare domande su modelli e aziende.",
      ],
    },
    {
      h: "I riassunti sono affidabili?",
      p: [
        "Sono generati automaticamente da un modello AI a partire dalle fonti e possono contenere errori o omissioni. Ogni notizia ha il link all'articolo originale: per decisioni importanti verifica sempre lì.",
      ],
    },
    {
      h: "Perché la chat dice che non lo sa?",
      p: [
        "La chat risponde solo con le notizie e le schede presenti nel nostro archivio e cita sempre le fonti. Se l'archivio non contiene la risposta, lo dice invece di inventare.",
      ],
    },
    {
      h: "Non ricevo le notifiche",
      p: [
        "Controlla che siano attive in Impostazioni dell'app e in Impostazioni di iOS > Notifiche > AI Radar. Gli alert arrivano solo per le notizie ad alta importanza sui temi che segui; il digest arriva una volta al giorno all'orario scelto.",
      ],
    },
    {
      h: "L'app funziona offline?",
      p: ["Sì: vedi le ultime notizie caricate e quelle salvate. Chat e aggiornamenti richiedono la connessione."],
    },
    {
      h: "Come cancello i miei dati?",
      p: ["Impostazioni > Cancella i miei dati. L'operazione è immediata e non si può annullare."],
    },
    {
      h: "Segnalare un errore in una notizia o in una scheda",
      p: [`Scrivi a ${SUPPORT_EMAIL} indicando il titolo della notizia o il nome del modello: correggiamo il prima possibile.`],
    },
  ],
};
