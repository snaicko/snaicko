import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@^1.8.0";

// Job automatici: modello più economico. Chat: modello più capace (sovrascrivibile da secret).
export const JOB_MODEL = Deno.env.get("JOB_MODEL") ?? "claude-haiku-5-5";
export const CHAT_MODEL = Deno.env.get("CHAT_MODEL") ?? "claude-opus-5-5";

export const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

export const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
export { Anthropic };

// Embedding gte-small (384 dim) eseguito dentro l'Edge Runtime: nessuna chiave esterna.
// Il modello è in inglese: per questo indicizziamo `search_text` e traduciamo le domande.
declare const Supabase: { ai: { Session: new (m: string) => { run(t: string, o: unknown): Promise<number[]> } } };
const session = new Supabase.ai.Session("gte-small");
export const embed = (text: string) =>
  session.run(text.slice(0, 2000), { mean_pool: true, normalize: true });

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

export const isCron = (req: Request) => {
  const secret = Deno.env.get("CRON_SECRET");
  return !!secret && req.headers.get("x-cron-secret") === secret;
};

/** Chiamata a Claude con risposta JSON vincolata da schema. */
export async function claudeJson<T>(system: string, user: string, schema: Record<string, unknown>): Promise<T> {
  const res = await anthropic.messages.create({
    model: JOB_MODEL,
    max_tokens: 2000,
    system,
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason !== "end_turn") throw new Error(`claude stop_reason=${res.stop_reason}`);
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("claude: risposta vuota");
  return JSON.parse(text.text) as T;
}

export const COMPANIES = ["anthropic", "openai", "google", "meta", "mistral", "huggingface", "altro"] as const;
export const CATEGORIES = ["lancio", "sicurezza", "benchmark", "policy", "ricerca"] as const;
