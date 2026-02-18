---
"@vivero/stoma": patch
---

# Docs updates only:

Add Open Graph meta tags and decouple docs deployment from package releases

- Add `og:image` and related OG headers to Starlight config
- Decouple `deploy-docs` CI job from npm publish — docs now deploy on any successful release job
