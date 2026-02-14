---
editUrl: false
next: false
prev: false
title: "UpstreamSchema"
---

> `const` **UpstreamSchema**: `ZodDiscriminatedUnion`\<\[`ZodObject`\<\{ `headers`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodString`\>\>; `rewritePath`: `ZodOptional`\<`ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>\>; `target`: `ZodString`; `type`: `ZodLiteral`\<`"url"`\>; \}, `$strip`\>, `ZodObject`\<\{ `rewritePath`: `ZodOptional`\<`ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>\>; `service`: `ZodString`; `type`: `ZodLiteral`\<`"service-binding"`\>; \}, `$strip`\>, `ZodObject`\<\{ `handler`: `ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>; `type`: `ZodLiteral`\<`"handler"`\>; \}, `$strip`\>\], `"type"`\>

Defined in: [src/config/schema.ts:44](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/config/schema.ts#L44)
