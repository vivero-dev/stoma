---
editUrl: false
next: false
prev: false
title: "UpstreamConfig"
---

> **UpstreamConfig**\<`TBindings`\> = [`UrlUpstream`](/api/index/interfaces/urlupstream/) \| [`ServiceBindingUpstream`](/api/index/interfaces/servicebindingupstream/)\<`TBindings`\> \| [`HandlerUpstream`](/api/index/interfaces/handlerupstream/)

Defined in: [src/core/types.ts:173](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/types.ts#L173)

Upstream target — where the request is forwarded.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type, constrains [ServiceBindingUpstream.service](/api/index/interfaces/servicebindingupstream/#service).
