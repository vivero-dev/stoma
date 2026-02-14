---
editUrl: false
next: false
prev: false
title: "Mutation"
---

> **Mutation** = [`HeaderMutation`](/api/index/interfaces/headermutation/) \| [`BodyMutation`](/api/index/interfaces/bodymutation/) \| [`StatusMutation`](/api/index/interfaces/statusmutation/) \| [`AttributeMutation`](/api/index/interfaces/attributemutation/)

Defined in: [src/core/protocol.ts:205](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/core/protocol.ts#L205)

A discrete modification to apply to the request or response.
Discriminated on `type`.

Designed to map cleanly to ext_proc `HeaderMutation`, `BodyMutation`,
and Envoy dynamic metadata.
