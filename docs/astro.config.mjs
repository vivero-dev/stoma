import path from "node:path";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import mermaid from 'astro-mermaid';
import llmTxt from 'starlight-llms-txt'
import demoApiPlugin from './vite-plugin-demo-api';

export default defineConfig({
  site: "https://stoma.opensource.homegrower.club/",
  markdown: {
    syntaxHighlight: "shiki",
  },
  vite: {
    plugins: [demoApiPlugin()],
    resolve: {
      alias: {
        "@examples": path.resolve(
          new URL(".", import.meta.url).pathname,
          "../packages/gateway/examples",
        ),
      },
    },
  },
  integrations: [
    react(),
    starlight({
      title: "Stoma",
      description:
        "Declarative API gateway as a TypeScript library. Runs on Cloudflare Workers, Node.js, Deno, Bun, and any JavaScript runtime.",
      favicon: "/favicon.ico",
      head: [
        {
          tag: "meta",
          attrs: {
            property: "twitter:image",
            content: "/og_image.jpg",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "twitter:card",
            content: "summary_large_image",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "/og_image.jpg",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:width",
            content: "1200",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:height",
            content: "630",
          },
        },
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
        // llmTxt(),
        starlightTypeDoc({
          entryPoints: [
            "../packages/gateway/src/index.ts",
            "../packages/gateway/src/policies/index.ts",
            "../packages/gateway/src/config/index.ts",
            "../packages/gateway/src/adapters/index.ts",
          ],
          tsconfig: "../packages/gateway/tsconfig.docs.json",
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
          label: "About",
          autogenerate: { directory: "about" },
        },
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
          label: "Analytics",
          autogenerate: { directory: "analytics" },
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
    mermaid({
      theme: 'forest',
      autoTheme: true
    }),

  ],
});
