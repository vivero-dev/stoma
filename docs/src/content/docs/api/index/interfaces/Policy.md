---
editUrl: false
next: false
prev: false
title: "Policy"
---

Defined in: src/policies/types.ts:21

A Policy is a named Hono middleware with metadata.
Policies are the building blocks of gateway pipelines.

## Properties

### handler

> **handler**: `MiddlewareHandler`

Defined in: src/policies/types.ts:25

The Hono middleware handler

***

### name

> **name**: `string`

Defined in: src/policies/types.ts:23

Unique policy name (e.g. "jwt-auth", "rate-limit")

***

### priority?

> `optional` **priority**: `number`

Defined in: src/policies/types.ts:27

Policy priority — lower numbers execute first. Default: 100.
