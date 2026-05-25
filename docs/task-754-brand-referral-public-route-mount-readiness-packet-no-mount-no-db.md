# Task754 - Brand Referral Public Route Mount Readiness Packet

Status: completed

Scope: docs and static guard / no public route mount / no DB

## Goal

Prepare the explicit readiness gate for a future public route mount of Brand Referral guarded normalization. This task does not mount any public or global route. It records the route contract, required approval gates, and static guardrails before API exposure.

## Changed Files

- `docs/task-754-brand-referral-public-route-mount-readiness-packet-no-mount-no-db.md`
- `tests/brandChannel/brandReferralPublicRouteMountReadiness.static.test.js`
- `docs/design/brand-official-line-channel-integration.md`
- `docs/design/saas-plan-entitlement-and-add-ons.md`

## Current Closed Slice

Task748-753 close the current Brand Referral route-adapter path:

- source / channel policy is deterministic and pure
- request normalization is safe and metadata-only
- synthetic app/API adapter is guard-first when configured
- route-style adapter exists but is not globally mounted
- route-style adapter reports `mounted: false` and `publicRouteMounted: false`
- no public route is exposed
- no DB, migration, audit/contact persistence, provider, webhook, LINE, AI/RAG, identity verification, Case Binding, repair intake, or Case creation runtime exists in this slice

## Future Public Route Contract

A future public route mount, if separately approved, must remain:

- guard-first
- normalization-only
- organization-scoped
- permission-checked
- entitlement-checked
- no customer case-data disclosure
- no identity verification grant
- no Case Binding grant
- no repair intake draft creation unless separately approved
- no Case creation unless separately approved
- no audit/contact persistence unless separately approved
- no provider/webhook/LINE/SMS/App call unless separately approved
- no AI/RAG call unless separately approved

The future public route must not expose stack traces, SQL, token, secret, LINE access token, channel secret, raw LINE id, full phone/address, provider payload, AI payload, full customer payload, credential, or DB URL-like values.

## Required Approval Gates Before Public Mount

Before any future task may change global app/server/router files or expose this adapter as a public route, PM must explicitly approve:

- API route path and HTTP method
- allowed global mount files
- permission guard source
- entitlement guard source
- organization scope source
- request/response DTO contract
- audit/contact logging decision
- DB / migration decision
- repair intake handoff decision
- identity verification and Case Binding decision
- provider / LINE / webhook / SMS / App decision
- AI/RAG decision
- smoke / integration coverage
- admin UI impact
- package impact
- error redaction policy
- usage tracking / billing impact

No general "continue" instruction should be treated as approval for public route mount, DB writes, audit/contact persistence, repair intake creation, identity verification, Case Binding, provider calls, AI/RAG calls, smoke changes, or admin UI changes.

## Static Guard Expectations

The readiness guard checks:

- current route adapter still reports `mounted: false`
- current route adapter still reports `publicRouteMounted: false`
- current global app/server/route entry files do not import or mount the Brand Referral route adapter
- readiness docs mention API, permission, entitlement, audit, DB/migration, provider/LINE/webhook, AI/RAG, smoke, and admin gates
- unsafe output remains forbidden

## Explicit Non-goals

Task754 does not implement public route, DB, audit/contact persistence, verification, Case Binding, repair intake, webhook, provider adapter, real entitlement service, Brand AI/RAG, reports, admin UI, package changes, smoke tests, or migrations.
