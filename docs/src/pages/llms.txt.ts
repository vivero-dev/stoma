import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { isIncluded, SECTIONS, SITE_TITLE, SITE_URL } from "../llms-sections";

export const prerender = true;

export const GET: APIRoute = async () => {
  const docs = (await getCollection("docs")).filter(isIncluded);
  docs.sort((a, b) => a.id.localeCompare(b.id));

  const lines = [
    `# ${SITE_TITLE}`,
    "",
    "> Declarative API gateway as a TypeScript library. Runs on Cloudflare Workers, Node.js, Deno, Bun, and any JavaScript runtime.",
    "",
    "## Documentation Sets",
    "",
    `- [Complete documentation](${SITE_URL}/llms-full.txt): every page in the docs, including API reference`,
    `- [Abridged documentation](${SITE_URL}/llms-small.txt): core docs without API reference — fits smaller context windows`,
    "",
    "## Sections",
    "",
    "Focused documentation sets — load only what you need:",
    "",
  ];

  for (const section of SECTIONS) {
    lines.push(
      `- [${section.label}](${SITE_URL}/llms/${section.slug}.txt): ${section.description}`
    );
  }

  lines.push("", "## All Pages", "");

  for (const doc of docs) {
    const url = `${SITE_URL}/${doc.id}/`;
    lines.push(`- [${doc.data.title}](${url})`);
  }

  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
