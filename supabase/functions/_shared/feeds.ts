export type Source = {
  id: string; name: string; company: string | null; kind: "rss" | "html_index";
  url: string; link_pattern: string | null; max_items: number;
};
export type FeedItem = { url: string; title: string; excerpt: string; published_at: string };

const UA = "AIRadarBot/1.0 (news aggregator; summaries with link to source)";
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

const get = async (url: string) => {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export const clean = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(lt|gt|amp|quot|apos|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(x?)([0-9a-f]+);/gi, (_, x, n) => String.fromCodePoint(parseInt(n, x ? 16 : 10)))
    .replace(/&(lt|gt|amp|quot|apos|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/\s+/g, " ").trim();

const tag = (xml: string, names: string[]) => {
  for (const n of names) {
    const m = xml.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"));
    if (m) return m[1];
  }
  return "";
};

export const normalizeUrl = (raw: string, base?: string) => {
  try {
    const u = new URL(raw.trim(), base);
    u.hash = "";
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|ref$|source$)/.test(k)) u.searchParams.delete(k);
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
};

const toDate = (s: string) => {
  const t = Date.parse(clean(s));
  return Number.isNaN(t) ? null : t;
};

export function parseFeed(xml: string, max: number): FeedItem[] {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  const out: FeedItem[] = [];
  for (const b of blocks) {
    const href = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)/i)?.[1] ??
      b.match(/<link[^>]*href=["']([^"']+)/i)?.[1] ?? clean(tag(b, ["link", "guid", "id"]));
    const url = normalizeUrl(href);
    const title = clean(tag(b, ["title"]));
    const ts = toDate(tag(b, ["pubDate", "published", "dc:date", "updated"])) ?? Date.now();
    if (!url || !title || Date.now() - ts > MAX_AGE_MS) continue;
    out.push({
      url, title,
      // L'estratto serve solo come input al riassunto e non viene mai mostrato né conservato.
      excerpt: clean(tag(b, ["description", "summary", "content:encoded", "content"])).slice(0, 1500),
      published_at: new Date(ts).toISOString(),
    });
    if (out.length >= max) break;
  }
  return out;
}

const meta = (html: string, key: string) =>
  html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)`, "i"))?.[1] ??
  html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i"))?.[1] ?? "";

/** Siti senza RSS: legge i link dalla pagina indice e i metadati (og:*) delle pagine nuove. */
async function parseIndex(src: Source, known: (urls: string[]) => Promise<Set<string>>): Promise<FeedItem[]> {
  const html = await get(src.url);
  const pattern = new RegExp(src.link_pattern ?? ".");
  const urls = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"'#?]+)["']/g)) {
    if (!pattern.test(m[1])) continue;
    const u = normalizeUrl(m[1], src.url);
    if (u) urls.add(u);
    if (urls.size >= src.max_items) break;
  }
  const seen = await known([...urls]);
  const fresh = [...urls].filter((u) => !seen.has(u));
  const items = await Promise.all(fresh.map(async (url): Promise<FeedItem | null> => {
    try {
      const page = await get(url);
      const title = clean(meta(page, "og:title") || tag(page, ["title"]));
      const ts = toDate(meta(page, "article:published_time") ||
        (page.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? ""));
      // Senza data affidabile non possiamo distinguere una notizia nuova da una pagina vecchia.
      if (!title || ts === null || Date.now() - ts > MAX_AGE_MS) return null;
      return {
        url, title,
        excerpt: clean(meta(page, "og:description") || meta(page, "description")).slice(0, 1500),
        published_at: new Date(ts).toISOString(),
      };
    } catch {
      return null;
    }
  }));
  return items.filter((i): i is FeedItem => i !== null);
}

export async function fetchSource(src: Source, known: (urls: string[]) => Promise<Set<string>>) {
  return src.kind === "rss" ? parseFeed(await get(src.url), src.max_items) : await parseIndex(src, known);
}
