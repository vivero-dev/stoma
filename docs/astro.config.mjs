import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

export default defineConfig({
  integrations: [
    starlight({
      title: "Stoma",
      description:
        "Declarative API gateway as a TypeScript library, built on Hono. Runs on Cloudflare Workers, Deno, Bun, Node.js, and any runtime Hono supports.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/HomeGrower-club/stoma",
        },
      ],
      customCss: ["./src/styles/custom.css"],
      editLink: {
        baseUrl:
          "https://github.com/HomeGrower-club/stoma/edit/main/docs/",
      },
      plugins: [
        starlightTypeDoc({
          entryPoints: [
            "../src/index.ts",
            "../src/policies/index.ts",
            "../src/config/index.ts",
            "../src/adapters/index.ts",
          ],
          tsconfig: "../tsconfig.docs.json",
          typeDoc: {
            entryPointStrategy: "expand",
            exclude: ["**/__tests__/**"],
            excludePrivate: true,
            excludeInternal: true,
          },
        }),
      ],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Concepts",
          autogenerate: { directory: "concepts" },
        },
        {
          label: "Policies",
          autogenerate: { directory: "policies" },
        },
        {
          label: "Cloudflare",
          autogenerate: { directory: "cloudflare" },
        },
        {
          label: "Recipes",
          autogenerate: { directory: "recipes" },
        },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        typeDocSidebarGroup,
      ],
    }),
  ],
});
