---
editUrl: false
next: false
prev: false
title: "PolicyConfig"
---

Defined in: [packages/gateway/src/policies/types.ts:88](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L88)

Base configuration shared by all policies

## Extended by

- [`MetricsReporterConfig`](/api/index/interfaces/metricsreporterconfig/)
- [`ServerTimingConfig`](/api/index/interfaces/servertimingconfig/)
- [`GenerateHttpSignatureConfig`](/api/policies/interfaces/generatehttpsignatureconfig/)
- [`GenerateJwtConfig`](/api/policies/interfaces/generatejwtconfig/)
- [`JwsConfig`](/api/policies/interfaces/jwsconfig/)
- [`JwtAuthConfig`](/api/policies/interfaces/jwtauthconfig/)
- [`OAuth2Config`](/api/policies/interfaces/oauth2config/)
- [`RbacConfig`](/api/policies/interfaces/rbacconfig/)
- [`VerifyHttpSignatureConfig`](/api/policies/interfaces/verifyhttpsignatureconfig/)
- [`AssignMetricsConfig`](/api/policies/interfaces/assignmetricsconfig/)
- [`RequestLogConfig`](/api/policies/interfaces/requestlogconfig/)
- [`CircuitBreakerConfig`](/api/policies/interfaces/circuitbreakerconfig/)
- [`LatencyInjectionConfig`](/api/policies/interfaces/latencyinjectionconfig/)
- [`RetryConfig`](/api/policies/interfaces/retryconfig/)
- [`TimeoutConfig`](/api/policies/interfaces/timeoutconfig/)
- [`CacheConfig`](/api/policies/interfaces/cacheconfig/)
- [`DynamicRoutingConfig`](/api/policies/interfaces/dynamicroutingconfig/)
- [`GeoIpFilterConfig`](/api/policies/interfaces/geoipfilterconfig/)
- [`HttpCalloutConfig`](/api/policies/interfaces/httpcalloutconfig/)
- [`InterruptConfig`](/api/policies/interfaces/interruptconfig/)
- [`IpFilterConfig`](/api/policies/interfaces/ipfilterconfig/)
- [`JsonThreatProtectionConfig`](/api/policies/interfaces/jsonthreatprotectionconfig/)
- [`RateLimitConfig`](/api/policies/interfaces/ratelimitconfig/)
- [`RegexThreatProtectionConfig`](/api/policies/interfaces/regexthreatprotectionconfig/)
- [`RequestLimitConfig`](/api/policies/interfaces/requestlimitconfig/)
- [`ResourceFilterConfig`](/api/policies/interfaces/resourcefilterconfig/)
- [`SslEnforceConfig`](/api/policies/interfaces/sslenforceconfig/)
- [`TrafficShadowConfig`](/api/policies/interfaces/trafficshadowconfig/)
- [`AssignAttributesConfig`](/api/policies/interfaces/assignattributesconfig/)
- [`AssignContentConfig`](/api/policies/interfaces/assigncontentconfig/)
- [`JsonValidationConfig`](/api/policies/interfaces/jsonvalidationconfig/)
- [`OverrideMethodConfig`](/api/policies/interfaces/overridemethodconfig/)
- [`RequestValidationConfig`](/api/policies/interfaces/requestvalidationconfig/)
- [`RequestTransformConfig`](/api/policies/interfaces/requesttransformconfig/)
- [`ResponseTransformConfig`](/api/policies/interfaces/responsetransformconfig/)

## Properties

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>
