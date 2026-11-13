// Digest giornaliero: gira ogni ora e serve i dispositivi che hanno scelto quell'ora.
import { db, isCron, json } from "../_shared/clients.ts";
import { type Device, matches, type Push, sendPush } from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (!isCron(req)) return json({ error: "unauthorized" }, 401);
  const now = new Date();
  const { data: devices } = await db.from("devices").select("*")
    .eq("digest", true).eq("digest_hour_utc", now.getUTCHours()).not("push_token", "is", null)
    .or(`last_digest_at.is.null,last_digest_at.lt.${new Date(now.getTime() - 20 * 3600 * 1000).toISOString()}`);
  if (!devices?.length) return json({ sent: 0 });

  const { data: articles } = await db.from("articles")
    .select("id, title, title_it, company, category, importance")
    .eq("status", "done").gt("published_at", new Date(now.getTime() - 24 * 3600 * 1000).toISOString())
    .order("importance", { ascending: false }).order("published_at", { ascending: false }).limit(60);

  const messages: Push[] = [];
  const served: string[] = [];
  for (const d of devices as Device[]) {
    const top = (articles ?? []).filter((a) => matches(d, a)).slice(0, 3);
    if (!top.length) continue;
    messages.push({
      to: d.push_token!,
      title: "Il tuo radar di oggi",
      body: top.map((a) => `• ${a.title_it ?? a.title}`).join("\n"),
      data: { digest: true },
    });
    served.push(d.id);
  }
  await sendPush(messages);
  if (served.length) await db.from("devices").update({ last_digest_at: now.toISOString() }).in("id", served);
  return json({ sent: messages.length });
});
