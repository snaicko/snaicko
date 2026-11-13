import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const configured = !!url && !!key;

// Nessun login: il client usa solo la chiave pubblica, protetta dalle policy RLS.
export const supabase = createClient(url || "https://example.supabase.co", key || "missing", {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

export type Article = {
  id: string; url: string; title: string; title_it: string | null; summary_it: string | null;
  company: string | null; models: string[]; category: string | null; importance: number | null;
  published_at: string; source: string;
};
export type ModelSource = { title: string; url: string; date?: string };
export type ModelCard = {
  id: string; name: string; company: string; tagline: string | null; performance: string | null;
  pricing: string | null; context_window: string | null; privacy: string | null;
  strengths: string[]; limits: string[]; sources: ModelSource[]; updated_at: string;
};
export type ChatSource = {
  n: number; kind: "article" | "model"; id: string; title: string; url: string | null; source: string; date: string;
};
export type ChatReply = { answer: string; sources: ChatSource[]; unknown: boolean };

const ARTICLE_COLS =
  "id,url,title,title_it,summary_it,company,models,category,importance,published_at,sources(name)";
const MODEL_COLS =
  "id,name,company,tagline,performance,pricing,context_window,privacy,strengths,limits,sources,updated_at";
const PAGE = 25;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toArticle = ({ sources, ...row }: any): Article => ({ ...row, source: sources?.name ?? "" });

/** Legge dalla rete e, se la rete non c'è, ripiega sull'ultima copia salvata. */
async function cached<T>(cacheKey: string | null, load: () => Promise<T>): Promise<{ data: T; offline: boolean }> {
  try {
    const data = await load();
    if (cacheKey) AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
    return { data, offline: false };
  } catch (e) {
    const saved = cacheKey ? await AsyncStorage.getItem(cacheKey) : null;
    if (saved) return { data: JSON.parse(saved) as T, offline: true };
    throw e;
  }
}

export type FeedFilter = { companies?: string[]; categories?: string[]; before?: string };

export function fetchFeed(filter: FeedFilter, cacheKey: string | null) {
  return cached(filter.before ? null : cacheKey, async () => {
    let q = supabase.from("articles").select(ARTICLE_COLS).eq("status", "done")
      .order("published_at", { ascending: false }).limit(PAGE);
    if (filter.companies?.length) q = q.in("company", filter.companies);
    if (filter.categories?.length) q = q.in("category", filter.categories);
    if (filter.before) q = q.lt("published_at", filter.before);
    const { data, error } = await q;
    if (error) throw error;
    return data.map(toArticle);
  });
}
export const FEED_PAGE = PAGE;

export async function fetchArticle(id: string): Promise<Article | null> {
  const { data, error } = await supabase.from("articles").select(ARTICLE_COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toArticle(data) : null;
}

export async function fetchRelated(modelId: string): Promise<Article[]> {
  const { data, error } = await supabase.from("articles").select(ARTICLE_COLS).eq("status", "done")
    .contains("models", [modelId]).order("published_at", { ascending: false }).limit(5);
  if (error) throw error;
  return data.map(toArticle);
}

export function fetchModels() {
  return cached("airadar:models", async () => {
    const { data, error } = await supabase.from("models").select(MODEL_COLS).order("company").order("name");
    if (error) throw error;
    return data as ModelCard[];
  });
}

export async function askChat(
  question: string, history: { role: "user" | "assistant"; content: string }[], deviceId: string,
): Promise<ChatReply> {
  const res = await fetch(`${url}/functions/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ question, history, device_id: deviceId }),
  });
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error("server_error");
  return res.json();
}

export type DevicePrefs = {
  companies: string[]; topics: string[]; alerts: boolean; digest: boolean; digestHour: number;
};

export async function syncDevice(deviceId: string, pushToken: string | null, p: DevicePrefs) {
  const local = new Date();
  local.setHours(p.digestHour, 0, 0, 0);
  const { error } = await supabase.rpc("upsert_device", {
    p_id: deviceId, p_push_token: pushToken, p_companies: p.companies, p_topics: p.topics,
    p_alerts: p.alerts, p_digest: p.digest, p_digest_hour_utc: local.getUTCHours(),
  });
  if (error) throw error;
}

export async function deleteDevice(deviceId: string) {
  const { error } = await supabase.rpc("delete_device", { p_id: deviceId });
  if (error) throw error;
}
