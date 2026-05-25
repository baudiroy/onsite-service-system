# Task741 - Multi Official LINE Channel Config Allowed-flow Policy

Status: completed.

Scope: pure module / no API / no DB / no provider runtime.

## Goal

Create a pure deterministic policy helper for multi official LINE channel configuration and allowed-flow decisions. The helper validates channel metadata, purpose, status, allowed flows, and channel-level AI / RAG flags without creating webhook, identity binding, Case Binding, provider, entitlement, audit, AI / RAG, or DB runtime.

## Files Changed

- `src/brandChannel/multiLineChannelPolicy.js`
- `tests/brandChannel/multiLineChannelPolicy.unit.test.js`
- `docs/task-741-multi-official-line-channel-config-allowed-flow-policy-no-api-no-db.md`
- `docs/design/brand-official-line-channel-integration.md`

## Implemented

- Added canonical purposes:
  - `customer_service`
  - `repair_intake`
  - `service_status`
  - `sales_membership`
  - `regional_service`
  - `dealer_channel`
  - `campaign`
  - `unknown`
- Added canonical statuses:
  - `active`
  - `paused`
  - `disabled`
  - `archived`
  - `unknown`
- Added safe metadata normalization for:
  - `organization_id`
  - `brand_id`
  - `line_channel_id`
  - channel name
  - purpose
  - status
  - owner department
  - allowed flows
  - default language
  - message template key
  - `knowledge_base_id`
  - AI / RAG enabled flag
- Added deterministic allowed-flow evaluation.
- Missing scope, unknown purpose, unknown status, unknown flow, and non-active channel statuses fail closed.
- Campaign, sales / membership, and dealer channels cannot directly allow case query / customer access flows.
- Repair intake and service status case-related flows return `verification_and_case_binding_required` and never direct case-data access.
- Brand Knowledge AI flow is allowed only when channel AI / RAG is enabled and `knowledge_base_id` is present.
- Results contain only a safe decision, `reasonKey`, `requiredNextStep`, sanitized metadata, and explicit no-runtime safeguards.

## Not Implemented

- No brand channel table.
- No DB / migration / DDL.
- No API route, controller, service, repository, or DTO behavior.
- No LINE webhook, signature verification, provider adapter, SMS, App push, or customer messaging runtime.
- No identity verification or Case Binding runtime.
- No permission / audit writer runtime.
- No entitlement / billing runtime.
- No Brand AI / RAG runtime or provider call.
- No usage tracking runtime.
- No reports, admin UI, smoke tests, package, config, token, or secret changes.

## Verification

Planned verification:

- `node --test tests/brandChannel/multiLineChannelPolicy.unit.test.js`
- `node --test tests/brandChannel/*.js`
- `npm run check`
- `git diff --check -- src/brandChannel/multiLineChannelPolicy.js tests/brandChannel/multiLineChannelPolicy.unit.test.js docs/task-741-multi-official-line-channel-config-allowed-flow-policy-no-api-no-db.md docs/design/brand-official-line-channel-integration.md`
