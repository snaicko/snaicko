export const colors = {
  bg: "#07080C",
  surface: "#10121A",
  surface2: "#191C27",
  line: "#272B38",
  text: "#F4F5EF",
  dim: "#A0A6B4",
  accent: "#C8FF2E",
  onAccent: "#0A0D00",
  violet: "#7B5CFF",
  danger: "#FF6B5E",
};

export const fonts = { bold: "SpaceGrotesk_700Bold", medium: "SpaceGrotesk_500Medium" };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export type Category = "lancio" | "sicurezza" | "benchmark" | "policy" | "ricerca";

export const CATEGORIES: { id: Category; label: string; color: string; icon: string }[] = [
  { id: "lancio", label: "Lanci", color: "#C8FF2E", icon: "rocket-outline" },
  { id: "sicurezza", label: "Sicurezza", color: "#FF6B5E", icon: "shield-checkmark-outline" },
  { id: "benchmark", label: "Benchmark", color: "#4DD6FF", icon: "stats-chart-outline" },
  { id: "policy", label: "Policy", color: "#FFC53D", icon: "document-text-outline" },
  { id: "ricerca", label: "Ricerca", color: "#B79CFF", icon: "flask-outline" },
];

export const COMPANIES: { id: string; label: string }[] = [
  { id: "anthropic", label: "Anthropic" },
  { id: "openai", label: "OpenAI" },
  { id: "google", label: "Google" },
  { id: "meta", label: "Meta" },
  { id: "mistral", label: "Mistral" },
  { id: "huggingface", label: "Hugging Face" },
];

export const categoryOf = (id?: string | null) => CATEGORIES.find((c) => c.id === id);
export const companyLabel = (id?: string | null) => COMPANIES.find((c) => c.id === id)?.label ?? null;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

export const timeAgo = (iso: string) => {
  const h = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3600000));
  if (h < 1) return "ora";
  if (h < 24) return `${h} h fa`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d} g fa` : formatDate(iso);
};
