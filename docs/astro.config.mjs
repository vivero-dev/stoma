import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

export default defineConfig({
  site: "https://opensource.homegrower.club/stoma",
  markdown: {
    syntaxHighlight: "shiki",
  },
  integrations: [
    react(),
    starlight({
      title: "Stoma",
      description:
        "Declarative API gateway as a TypeScript library, built on Hono. Runs on Cloudflare Workers, Deno, Bun, Node.js, and any runtime Hono supports.",
      favicon: "/favicon.ico",
      head: [
        {
          tag: "link",
          attrs: {
            rel: "icon",
            type: "image/png",
            sizes: "32x32",
            href: "/favicon-32x32.png",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "icon",
            type: "image/png",
            sizes: "16x16",
            href: "/favicon-16x16.png",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "apple-touch-icon",
            sizes: "180x180",
            href: "/apple-touch-icon.png",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "manifest",
            href: "/site.webmanifest",
          },
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/HomeGrower-club/stoma",
        },
      ],
      customCss: ["./src/styles/custom.css"],
      editLink: {
        baseUrl: "https://github.com/HomeGrower-club/stoma/edit/main/docs/",
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
          label: "Deployment",
          items: [
            { label: "Overview", link: "/deploy/" },
            { label: "Cloudflare Workers", link: "/deploy/cloudflare/" },
            { label: "Node.js", link: "/deploy/node/" },
            {
              label: "Docker",
              items: [
                { label: "Docker", link: "/deploy/docker/" },
                { label: "Docker Compose", link: "/deploy/docker/compose/" },
                { label: "Kubernetes", link: "/deploy/docker/kubernetes/" },
              ],
            },
            { label: "Bun", link: "/deploy/bun/" },
          ],
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
        {
          label: "Policy Authoring",
          autogenerate: { directory: "policy-authoring" },
        },
        typeDocSidebarGroup,
      ],
    }),
  ],
});
