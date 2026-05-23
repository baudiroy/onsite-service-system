# Task 600 - PM Continuation Handoff after Customer Access Resolver Runtime Skeleton Readiness

## Scope

Task600 is a docs-only PM continuation handoff for the Customer Access Resolver runtime skeleton readiness branch.

Task600 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test code changes.
- no fixture changes.
- no API.
- no route / controller.
- no DTO / projection.
- no DB.
- no migration.
- no provider sending.
- no AI.

Task600 does not authorize implementation.

## Current Branch / Module

Branch / module:

```text
customer-facing service report / customer access resolver runtime skeleton readiness branch
```

Current status:

```text
STATIC BASELINE CLOSED / RUNTIME SKELETON NOT AUTHORIZED / API RUNTIME NO-GO
```

## Accepted Task Summary

Accepted branch work:

- Task574 through Task578: Customer Access Resolver static baseline established and closed.
- Task579: runtime authorization packet completed.
- Task580 through Task582: pure function skeleton proposal, readiness gate, and exact implementation packet completed.
- Task583 through Task584: unit test plan and exact implementation packet completed.
- Task585 through Task586: response envelope proposal and exact implementation packet completed.
- Task587 through Task589: authorization reviews completed.
- Task590 through Task592: explicit authorization packets completed.
- Task593: resolver skeleton final go / no-go review completed; result NO-GO.
- Task594: unit test final go / no-go review completed; result NO-GO.
- Task595: response envelope final go / no-go review completed; result NO-GO.
- Task596: runtime skeleton authorization request draft completed; explicitly marked as non-current authorization.
- Task597: runtime skeleton branch PM handoff completed.
- Task598: runtime skeleton final scope lock completed.
- Task599: explicit user authorization review completed; result is that explicit user authorization has not been granted.

## Latest Accepted Result

Task599 accepted.

Current explicit authorization status:

```text
NO EXPLICIT USER AUTHORIZATION FOR RUNTIME SKELETON HAS BEEN GRANTED YET.
```

Generic phrases such as "continue", "go ahead", "可以", "繼續", "下一步", "請給下一個 task", or "請繼續開發" do not authorize runtime.

Runtime skeleton remains blocked until the user explicitly authorizes the exact `src/` file change.

## Current No-go Boundaries

The following remain not authorized:

- No resolver runtime.
- No `src/customerAccess/customerAccessResolver.js`.
- No `resolveCustomerAccess`.
- No unit test file.
- No `tests/customerAccess/customerAccessResolver.unit.test.js`.
- No response envelope helper.
- No `src/customerAccess/customerAccessResponseEnvelope.js`.
- No API / route / controller.
- No DTO / projection.
- No repository / service.
- No DB / SQL / DDL / psql.
- No migration draft / dry-run / apply.
- No provider sending / LINE / SMS / Email / App push.
- No survey runtime.
- No billing / settlement runtime.
- No AI / RAG / vector DB.
- No package.json change.
- No smoke / browser / API / full test suite.

## Future Exact Runtime Skeleton Path if Later Authorized

If the user later gives explicit exact authorization, the first runtime skeleton path must be:

```text
src/customerAccess/customerAccessResolver.js
```

The future implementation must be:

- single file only.
- pure function only.
- deterministic input to decision output.
- side-effect free.
- fail-closed by default.
- no DB / repository / route / controller / DTO / projection.
- no provider / AI / RAG.
- no audit log write.
- no file storage access.
- no Field Service Report write.
- no appointment write.
- no publication state write.
- no customer identity write.
- no `finalAppointmentId` modification.

## Future Exact Authorization Wording

Future authorization wording example:

```text
我明確授權 Codex 在 Task601 建立 src/customerAccess/customerAccessResolver.js。
本次只允許 pure function skeleton，不允許 API / DB / migration / provider / AI。
允許執行 node --check src/customerAccess/customerAccessResolver.js 與 git diff --check -- src/customerAccess/customerAccessResolver.js。
```

This is a future wording example only.

It is not current authorization.

## Mandatory Invariants

Any future work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver / envelope cannot create, approve, or publish a Field Service Report.
- Resolver / envelope cannot modify completion source-data.
- Resolver / envelope cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Suggested Next Steps for New PM

If the user has not explicitly authorized runtime:

- continue with no-runtime guard / planning only.
- do not issue a runtime implementation task.
- do not create `src/customerAccess/customerAccessResolver.js`.

If the user explicitly authorizes the exact `src/` change:

- PM may issue Task601 with the exact file and exact commands only.

Candidate future task:

```text
Task601 - Customer Access Resolver Pure Function Skeleton / Exact Files Only / No API / No DB
```

Task601 can only be issued after the user explicitly authorizes the exact `src/` change.

Task600 does not start Task601.

## Non-goals

Task600 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task599 documents.

Task600 does not run:

- `npm test`.
- `npm run test`.
- `npm run smoke`.
- `npm run db:migrate`.
- `psql`.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- `node --check src/customerAccess/customerAccessResolver.js`.
- `node --check src/customerAccess/customerAccessResponseEnvelope.js`.
- DB / migration / API / browser / provider sending commands.

## Task600 Allowed Verification

Task600 may only run:

```bash
git diff --check -- docs/task-600-pm-continuation-handoff-after-customer-access-resolver-runtime-skeleton-readiness-no-runtime-change.md
```

## Guardrails Review

Task600 remains aligned with `PROJECT_GUARDRAILS.md`:

- documentation-only.
- no runtime behavior change.
- no schema or migration change.
- no API change.
- no permission runtime change.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime change.
- no organization isolation runtime change.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
