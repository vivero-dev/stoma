# Stoma Documentation

This directory contains the source code for the Stoma documentation website, built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

## Development

To run the documentation site locally:

```bash
cd docs
yarn install
yarn dev
```

This will start the Astro dev server and also watch for changes in the playground service worker and editor components.

## Building

To build the documentation for production:

```bash
cd docs
yarn build
```

The output will be in `docs/dist`.

## Structure

- `src/content/docs/`: The Markdown/MDX source files for the documentation.
- `src/components/`: React and Astro components used in the docs (e.g., Playground, Editor).
- `src/playground/`: Source for the browser-based gateway playground.
- `src/editor/`: Source for the interactive gateway config editor.

## API Reference

The API reference in `src/content/docs/api/` is automatically generated from the source code's JSDoc comments using `starlight-typedoc`. Do not edit these files manually.
