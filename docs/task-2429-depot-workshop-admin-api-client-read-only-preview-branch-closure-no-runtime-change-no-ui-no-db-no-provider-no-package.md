# Task2429 - Depot Workshop Admin API Client Read-Only Preview Branch Closure

## Scope

Task2429 closes the Depot / Workshop admin API client read-only preview branch for this phase.

This is a docs-only closure task. It authorizes no UI implementation, no write behavior, no backend runtime work, no test behavior change, and no package changes.

## Accepted Outcomes

Task2426 added the bounded admin API client:

- `admin/src/api/depotWorkshop.ts`
- `previewDepotWorkshopAssignmentIntent(depotIntakeId, payload)`
- `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`

Task2427 aligned stale UI design and inventory guards to accept the read-only API client while preserving no UI/menu/write behavior.

Task2428 added the read-only preview API client portfolio static guard and froze the API client boundary before any UI page work.

## Current API Client Status

`admin/src/api/depotWorkshop.ts` exists.

`previewDepotWorkshopAssignmentIntent` exists.

The client targets `POST /api/v1/depot/repairs/:depotIntakeId/assignment-intent`.

The client uses the existing admin `apiRequest` helper.

`depotIntakeId` is encoded before it is placed in the request path.

The payload is plain-object only and cloned before request.

The response contract is limited to admin-safe read-only preview fields:

- `data.depotRepair`
- `repairOrderDraftSummary`
- `repairOrderTransitionPlanSummary`
- `repairOrderAuditIntentSummary`
- `repairOrderCustomerProjectionPreview`
- `meta.written: false`
- `writeRequired: false`
- safe `requestId`

## Current Non-Implementation Status

No Depot / Workshop admin UI page or component exists.

No menu or route implementation exists.

No write API client function exists.

No enabled write action button exists.

No package or package-lock changes were made.

No backend runtime/source behavior changed.

## Current Backend Blockers

Route write scope remains blocked by `depot_repair_route_write_scope_not_approved`.

`writePreparedAssignmentIntent` remains not route-wired.

Migration 028 has not been dry-run or applied.

No disposable DB target/tooling has been provided.

DB work remains paused.

The SQL repository adapter is fake-client tested only.

## Forbidden UI/API Behavior

This branch closure preserves the following forbidden behavior boundaries:

- no full helper-derived service objects
- no write action naming
- no provider sending
- no DB/admin migration controls
- no billing/payment/invoice controls
- no formal FSR / Completion Report behavior
- no `finalAppointmentId` display or mutation
- no raw customer private/contact/address/signature/photo fields
- no SQL/stack/token/password/secret/debug/provider/billing/AI/RAG payload display

## Closed For This Phase

The Depot / Workshop admin API client read-only preview branch is closed for this phase.

This closure authorizes no UI implementation, no write behavior, no backend runtime work, and no package changes.

Future UI page or menu implementation requires separate exact PM authorization.

## Non-Authorized Future Work

The following are non-authorized future work candidates only:

- admin UI read-only preview page implementation packet
- admin menu/route implementation packet
- route write-scope implementation packet
- DB dry-run / repository verification
- provider/notification sending
- billing/settlement/payment/invoice implementation
- smoke/staging/prod rollout

## Held Docs

The 7 held historical docs remain outside Task2429 scope and must stay untracked, untouched, and unstaged.
