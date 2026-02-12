---
editUrl: false
next: false
prev: false
title: "PolicyConfig"
---

Defined in: src/policies/types.ts:31

Base configuration shared by all policies

## Extended by

- [`MetricsReporterConfig`](/api/index/interfaces/metricsreporterconfig/)
- [`TimeoutConfig`](/api/policies/interfaces/timeoutconfig/)
- [`RetryConfig`](/api/policies/interfaces/retryconfig/)
- [`IpFilterConfig`](/api/policies/interfaces/ipfilterconfig/)
- [`GeoIpFilterConfig`](/api/policies/interfaces/geoipfilterconfig/)
- [`RateLimitConfig`](/api/policies/interfaces/ratelimitconfig/)
- [`JwtAuthConfig`](/api/policies/interfaces/jwtauthconfig/)
- [`OAuth2Config`](/api/policies/interfaces/oauth2config/)
- [`RbacConfig`](/api/policies/interfaces/rbacconfig/)
- [`RequestLogConfig`](/api/policies/interfaces/requestlogconfig/)
- [`OverrideMethodConfig`](/api/policies/interfaces/overridemethodconfig/)
- [`AssignAttributesConfig`](/api/policies/interfaces/assignattributesconfig/)
- [`RequestTransformConfig`](/api/policies/interfaces/requesttransformconfig/)
- [`ResponseTransformConfig`](/api/policies/interfaces/responsetransformconfig/)
- [`AssignMetricsConfig`](/api/policies/interfaces/assignmetricsconfig/)
- [`CircuitBreakerConfig`](/api/policies/interfaces/circuitbreakerconfig/)
- [`CacheConfig`](/api/policies/interfaces/cacheconfig/)
- [`SslEnforceConfig`](/api/policies/interfaces/sslenforceconfig/)
- [`RequestLimitConfig`](/api/policies/interfaces/requestlimitconfig/)
- [`InterruptConfig`](/api/policies/interfaces/interruptconfig/)
- [`DynamicRoutingConfig`](/api/policies/interfaces/dynamicroutingconfig/)
- [`HttpCalloutConfig`](/api/policies/interfaces/httpcalloutconfig/)
- [`LatencyInjectionConfig`](/api/policies/interfaces/latencyinjectionconfig/)
- [`RequestValidationConfig`](/api/policies/interfaces/requestvalidationconfig/)
- [`JsonThreatProtectionConfig`](/api/policies/interfaces/jsonthreatprotectionconfig/)
- [`RegexThreatProtectionConfig`](/api/policies/interfaces/regexthreatprotectionconfig/)
- [`TrafficShadowConfig`](/api/policies/interfaces/trafficshadowconfig/)
- [`AssignContentConfig`](/api/policies/interfaces/assigncontentconfig/)
- [`JsonValidationConfig`](/api/policies/interfaces/jsonvalidationconfig/)
- [`ResourceFilterConfig`](/api/policies/interfaces/resourcefilterconfig/)
- [`GenerateJwtConfig`](/api/policies/interfaces/generatejwtconfig/)
- [`JwsConfig`](/api/policies/interfaces/jwsconfig/)
- [`GenerateHttpSignatureConfig`](/api/policies/interfaces/generatehttpsignatureconfig/)
- [`VerifyHttpSignatureConfig`](/api/policies/interfaces/verifyhttpsignatureconfig/)

## Properties

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: src/policies/types.ts:33

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>
