import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import {
  docsForSection,
  isIncluded,
  PAGE_SEPARATOR,
  renderDocs,
  SECTIONS,
  SITE_TITLE,
} from "../llms-sections";

export const prerender = true;

export const GET: APIRoute = async () => {
  const allDocs = (await getCollection("docs")).filter(isIncluded);
  allDocs.sort((a, b) => a.id.localeCompare(b.id));

  const smallSections = SECTIONS.filter((s) => s.small !== false);
  const segments: string[] = [
    `<SYSTEM>This is an abridged version of the ${SITE_TITLE} documentation, with API reference and non-essential content removed. For the full documentation, see /llms-full.txt.</SYSTEM>`,
  ];

  for (const section of smallSections) {
    const docs = docsForSection(allDocs, section);
    if (docs.length > 0) {
      segments.push(renderDocs(docs));
    }
  }

  // Also include the index/about page if it exists
  const indexDoc = allDocs.find((d) => d.id === "index");
  const aboutDoc = allDocs.find((d) => d.id === "about");
  const extras = [indexDoc, aboutDoc].filter(Boolean) as typeof allDocs;
  if (extras.length > 0) {
    segments.unshift(renderDocs(extras));
  }

  return new Response(segments.join(PAGE_SEPARATOR), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
