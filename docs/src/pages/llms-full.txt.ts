import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { isIncluded, renderDocs, SITE_TITLE } from "../llms-sections";

export const prerender = true;

export const GET: APIRoute = async () => {
  const docs = (await getCollection("docs")).filter(isIncluded);
  docs.sort((a, b) => a.id.localeCompare(b.id));

  const body = [
    `<SYSTEM>This is the complete developer documentation for ${SITE_TITLE}.</SYSTEM>`,
    "",
    renderDocs(docs),
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
