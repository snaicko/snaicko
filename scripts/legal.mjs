// Genera docs/privacy.md e docs/support.md (pagine web per l'App Store) da src/content/legal.ts.
import { writeFileSync } from "node:fs";
import { privacy, support } from "../src/content/legal.ts";

for (const [name, d] of [["privacy", privacy], ["support", support]]) {
  const md = [`# AI Radar – ${d.title}`, d.intro, ...d.sections.flatMap((s) => [`## ${s.h}`, ...s.p])].join("\n\n");
  writeFileSync(new URL(`../docs/${name}.md`, import.meta.url), md + "\n");
}
