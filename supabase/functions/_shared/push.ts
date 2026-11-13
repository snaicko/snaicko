import { db } from "./clients.ts";

export type Push = { to: string; title: string; body: string; data?: Record<string, unknown> };

/** Invia notifiche tramite Expo Push e rimuove i token non più validi. */
export async function sendPush(messages: Push[]) {
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(chunk.map((m) => ({ ...m, sound: "default" }))),
    });
    if (!res.ok) {
      console.error("expo push", res.status, await res.text());
      continue;
    }
    const { data } = await res.json() as { data?: { status: string; details?: { error?: string } }[] };
    const dead = chunk.filter((_, j) => data?.[j]?.details?.error === "DeviceNotRegistered").map((m) => m.to);
    if (dead.length) await db.from("devices").update({ push_token: null }).in("push_token", dead);
  }
}

export type Device = {
  id: string; push_token: string | null; companies: string[]; topics: string[];
  alerts: boolean; digest: boolean; digest_hour_utc: number; last_digest_at: string | null;
};

/** Interessi vuoti = segue tutto. */
export const matches = (d: Device, a: { company: string | null; category: string | null }) =>
  (d.companies.length === 0 || (!!a.company && d.companies.includes(a.company))) &&
  (d.topics.length === 0 || (!!a.category && d.topics.includes(a.category)));
