# Task 597 - Customer Access Resolver Runtime Skeleton Branch PM Handoff

## Scope

Task597 is a docs-only PM handoff for the customer access resolver runtime skeleton readiness branch.

Task597 is:

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
- no AI / RAG / vector DB.

Task597 does not authorize implementation.

## Current Branch / Module

Branch / module:

```text
customer-facing service report / customer access resolver runtime skeleton readiness branch
```

Current branch status:

```text
STATIC BASELINE CLOSED / RUNTIME SKELETON NOT AUTHORIZED / API RUNTIME NO-GO
```

## Completed Task Summary

Accepted branch work:

- Task574 through Task578: resolver static baseline closed.
- Task579: runtime authorization packet completed.
- Task580 through Task582: pure function skeleton proposal, readiness gate, and exact implementation packet completed.
- Task583 through Task584: unit test plan and exact implementation packet completed.
- Task585 through Task586: response envelope proposal and exact implementation packet completed.
- Task587 through Task589: authorization reviews completed.
- Task590 through Task592: explicit authorization packets completed.
- Task593: resolver skeleton final go / no-go review completed; result NO-GO.
- Task594: unit test final go / no-go review completed; result NO-GO.
- Task595: response envelope final go / no-go review completed; result NO-GO.
- Task596: runtime skeleton authorization request draft completed; explicitly non-current authorization.

## Latest Accepted Results

Latest accepted state:

- Task596 accepted.
- Authorization request draft completed.
- Draft explicitly marked non-current authorization.
- No runtime implementation authorized.
- No `src/` changes authorized.
- No `tests/` changes authorized.
- No `fixtures/` changes authorized.

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

## Active Invariants

Future work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver / envelope cannot create, approve, or publish a formal Field Service Report.
- Resolver / envelope cannot modify completion source-data.
- Resolver / envelope cannot modify finalAppointmentId.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Future Authorization Path

If the user explicitly wants to authorize the first runtime skeleton, a future task must include at least:

- exact task name.
- exact allowed file:

```text
src/customerAccess/customerAccessResolver.js
```

- exact forbidden files.
- exact allowed commands:

```bash
node --check src/customerAccess/customerAccessResolver.js
git diff --check -- src/customerAccess/customerAccessResolver.js
```

- explicit permission for `src/` modification.
- explicit ban on DB / migration / route / controller / provider / AI.
- explicit statement whether unit test and response envelope remain forbidden.
- explicit stop conditions.
- completion report followed by PM review.

Without that explicit task, runtime skeleton remains not authorized.

## Suggested Next Task Candidates

Candidates only; do not execute from Task597:

- Task598 - Customer Access Resolver Runtime Skeleton Final Scope Lock / No Runtime Change.
- Task599 - Customer Access Resolver Runtime Skeleton Explicit User Authorization Review / No Runtime Change.
- Task600 - PM Continuation Handoff after Customer Access Resolver Runtime Skeleton Readiness / No Runtime Change.

Task597 does not start Task598.

## Non-goals

Task597 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task596 documents.

Task597 does not run:

- tests.
- smoke tests.
- DB commands.
- migration commands.
- API commands.
- browser commands.
- provider sending commands.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- `node --check src/customerAccess/customerAccessResolver.js`.
- `node --check src/customerAccess/customerAccessResponseEnvelope.js`.

## Guardrails Review

Task597 remains aligned with `PROJECT_GUARDRAILS.md`:

- documentation-only.
- no runtime behavior change.
- no schema or migration change.
- no provider sending.
- no AI auto decision.
- no customer-facing endpoint implementation.
- no sensitive data output.
- no customer channel identity runtime change.
- no organization isolation runtime change.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
