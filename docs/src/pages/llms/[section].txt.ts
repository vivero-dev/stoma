import { getCollection } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";
import {
  docsForSection,
  isIncluded,
  renderDocs,
  SECTIONS,
  SITE_TITLE,
} from "../../llms-sections";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () => {
  return SECTIONS.map((s) => ({ params: { section: s.slug } }));
};

export const GET: APIRoute = async ({ params }) => {
  const section = SECTIONS.find((s) => s.slug === params.section);
  if (!section) {
    return new Response("Not found", { status: 404 });
  }

  const allDocs = (await getCollection("docs")).filter(isIncluded);
  allDocs.sort((a, b) => a.id.localeCompare(b.id));

  const docs = docsForSection(allDocs, section);

  const body = [
    `<SYSTEM>This is the "${section.label}" section of the ${SITE_TITLE} documentation. ${section.description}.</SYSTEM>`,
    "",
    renderDocs(docs),
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
