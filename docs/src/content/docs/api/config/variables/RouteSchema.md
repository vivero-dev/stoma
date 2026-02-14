---
editUrl: false
next: false
prev: false
title: "RouteSchema"
---

> `const` **RouteSchema**: `ZodObject`\<\{ `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `methods`: `ZodOptional`\<`ZodArray`\<`ZodEnum`\<\{ `DELETE`: `"DELETE"`; `GET`: `"GET"`; `HEAD`: `"HEAD"`; `OPTIONS`: `"OPTIONS"`; `PATCH`: `"PATCH"`; `POST`: `"POST"`; `PUT`: `"PUT"`; \}\>\>\>; `path`: `ZodString`; `pipeline`: `ZodObject`\<\{ `policies`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `handler`: `ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>; `name`: `ZodString`; `priority`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>\>\>; `upstream`: `ZodDiscriminatedUnion`\<\[`ZodObject`\<\{ `headers`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodString`\>\>; `rewritePath`: `ZodOptional`\<`ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>\>; `target`: `ZodString`; `type`: `ZodLiteral`\<`"url"`\>; \}, `$strip`\>, `ZodObject`\<\{ `rewritePath`: `ZodOptional`\<`ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>\>; `service`: `ZodString`; `type`: `ZodLiteral`\<`"service-binding"`\>; \}, `$strip`\>, `ZodObject`\<\{ `handler`: `ZodFunction`\<`$ZodFunctionArgs`, `$ZodFunctionOut`\>; `type`: `ZodLiteral`\<`"handler"`\>; \}, `$strip`\>\], `"type"`\>; \}, `$strip`\>; \}, `$strip`\>

Defined in: [src/config/schema.ts:78](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/config/schema.ts#L78)
