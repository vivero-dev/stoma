---
editUrl: false
next: false
prev: false
title: "PipelineSchema"
---

> `const` **PipelineSchema**: `ZodObject`\<\{ `policies`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `handler`: `ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>; `name`: `ZodString`; `priority`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>\>\>; `upstream`: `ZodDiscriminatedUnion`\<\[`ZodObject`\<\{ `headers`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodString`\>\>; `rewritePath`: `ZodOptional`\<`ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>\>; `target`: `ZodString`; `type`: `ZodLiteral`\<`"url"`\>; \}, `$strip`\>, `ZodObject`\<\{ `rewritePath`: `ZodOptional`\<`ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>\>; `service`: `ZodString`; `type`: `ZodLiteral`\<`"service-binding"`\>; \}, `$strip`\>, `ZodObject`\<\{ `handler`: `ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>; `type`: `ZodLiteral`\<`"handler"`\>; \}, `$strip`\>\], `"type"`\>; \}, `$strip`\>

Defined in: [src/config/schema.ts:50](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/config/schema.ts#L50)
