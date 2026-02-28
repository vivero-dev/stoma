/**
 * Section definitions for llms.txt generation.
 *
 * Each section groups related docs pages that an LLM would want to
 * consume together.  The `patterns` array uses simple prefix matching
 * against the doc `id` (e.g. "getting-started/installation").
 */

import type { CollectionEntry } from "astro:content";

export interface Section {
  slug: string;
  label: string;
  description: string;
  patterns: string[];
  /** Include in llms-small.txt? Defaults to true. */
  small?: boolean;
}

export const SITE_TITLE = "Stoma";
export const SITE_URL = "https://stoma.vivero.dev";
export const PAGE_SEPARATOR = "\n\n---\n\n";

export const SECTIONS: Section[] = [
  {
    slug: "getting-started",
    label: "Getting Started",
    description:
      "Installation, quick start guide, local development setup, and interactive playground",
    patterns: ["getting-started/"],
  },
  {
    slug: "concepts",
    label: "Core Concepts",
    description:
      "Architecture, request lifecycle, policy system, upstream types, configuration reference, error handling, tracing, and glossary",
    patterns: ["concepts/"],
  },
  {
    slug: "policies",
    label: "Policy Reference",
    description:
      "Built-in policies: authentication, traffic control, resilience, transforms, observability, proxy, and mock",
    patterns: ["policies/"],
  },
  {
    slug: "policy-authoring",
    label: "Policy Authoring",
    description:
      "Writing custom policies: definePolicy SDK, patterns, cookbook, advanced techniques, cross-policy communication, testing, and store-backed policies",
    patterns: ["policy-authoring/"],
  },
  {
    slug: "deployment",
    label: "Deployment",
    description:
      "Deploy guides for Cloudflare Workers, Node.js, Docker, Kubernetes, and Bun",
    patterns: ["deploy/"],
  },
  {
    slug: "cloudflare",
    label: "Cloudflare",
    description:
      "Cloudflare-specific features: Service Bindings, KV rate limiting, and Durable Objects",
    patterns: ["cloudflare/"],
  },
  {
    slug: "guides",
    label: "Guides & Tutorials",
    description:
      "Step-by-step tutorials: JWT auth, OAuth2 with Supabase, caching, runtime adapters, config splitting, route scopes, testing, and type-safe bindings",
    patterns: ["guides/"],
  },
  {
    slug: "recipes",
    label: "Recipes",
    description:
      "Production-ready patterns: webhook firewall, cache + resilience, shadow release, and browser rendering",
    patterns: ["recipes/"],
  },
  {
    slug: "analytics",
    label: "Analytics",
    description: "Analytics pipeline architecture and policy instrumentation",
    patterns: ["analytics/"],
    small: false,
  },
  {
    slug: "api-reference",
    label: "API Reference",
    description:
      "Auto-generated TypeDoc API reference for all exports: createGateway, policies, adapters, config validation, types, and interfaces",
    patterns: ["api/"],
    small: false,
  },
];

/** Pages excluded from all llms.txt outputs (internal fragments). */
const EXCLUDED_PREFIXES = ["partials/"];

export function isIncluded(doc: CollectionEntry<"docs">): boolean {
  return (
    !doc.data.draft && !EXCLUDED_PREFIXES.some((p) => doc.id.startsWith(p))
  );
}

export function docsForSection(
  docs: CollectionEntry<"docs">[],
  section: Section
): CollectionEntry<"docs">[] {
  return docs.filter((doc) =>
    section.patterns.some((p) => doc.id.startsWith(p))
  );
}

export function renderDocs(docs: CollectionEntry<"docs">[]): string {
  const segments: string[] = [];
  for (const doc of docs) {
    const parts = [`# ${doc.data.title}`];
    if (doc.data.description) {
      parts.push(`> ${doc.data.description}`);
    }
    if (doc.body) {
      parts.push(doc.body);
    }
    segments.push(parts.join("\n\n"));
  }
  return segments.join(PAGE_SEPARATOR);
}
