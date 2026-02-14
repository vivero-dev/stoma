---
editUrl: false
next: false
prev: false
title: "UpstreamConfig"
---

> **UpstreamConfig**\<`TBindings`\> = [`UrlUpstream`](/api/index/interfaces/urlupstream/) \| [`ServiceBindingUpstream`](/api/index/interfaces/servicebindingupstream/)\<`TBindings`\> \| [`HandlerUpstream`](/api/index/interfaces/handlerupstream/)

Defined in: [src/core/types.ts:173](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/core/types.ts#L173)

Upstream target — where the request is forwarded.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, constrains [ServiceBindingUpstream.service](/api/index/interfaces/servicebindingupstream/#service).
