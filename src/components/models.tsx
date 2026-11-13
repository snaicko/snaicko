import { useEffect, useState } from "react";

import { fetchModels, type ModelCard } from "@/lib/api";

export const MISSING = "Dato non ancora disponibile";

/** Righe della scheda, nell'ordine in cui compaiono in dettaglio e confronto. */
export const FIELDS: { key: "performance" | "pricing" | "context_window" | "privacy"; label: string; icon: string }[] = [
  { key: "performance", label: "Prestazioni", icon: "speedometer-outline" },
  { key: "pricing", label: "Prezzo", icon: "pricetag-outline" },
  { key: "context_window", label: "Finestra di contesto", icon: "albums-outline" },
  { key: "privacy", label: "Privacy e uso dei dati", icon: "lock-closed-outline" },
];

export function useModels() {
  const [models, setModels] = useState<ModelCard[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setError(false);
    fetchModels()
      .then(({ data, offline: off }) => { setModels(data); setOffline(off); })
      .catch(() => setError(true));
  }, [tick]);
  return { models, offline, error, reload: () => setTick((t) => t + 1) };
}
