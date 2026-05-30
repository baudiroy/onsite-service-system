# Task2168 Engineer Mobile Audit Writer Reuse Decision Packet / No Runtime Change

## Status

Task2168 is a docs-only decision packet. It decides how the future Engineer Mobile audit writer work should relate to the existing Customer Access audit writer result normalizer and injected writer adapter pattern.

No runtime, source, test, package, DB, provider, route, app/server, smoke, or production mount changes are authorized by this task.

## Current Engineer Mobile Audit Builder Baseline

Task2167 added the pure Engineer Mobile audit event builder skeleton:

- `src/engineerMobile/engineerMobileAuditEventBuilder.js`

Exported API:

- `buildEngineerMobileAuditEvent(input)`
- `SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES`
- `ENGINEER_MOBILE_AUDIT_EVENT_KEYS`
- `ENGINEER_MOBILE_AUDIT_METADATA_KEYS`

Result shape:

- valid: `{ ok: true, auditEvent }`
- invalid or malformed: `{ ok: false, reasonCode }`

Supported event types:

- `engineer_mobile.task_list.allow`
- `engineer_mobile.task_list.deny`
- `engineer_mobile.task_detail.allow`
- `engineer_mobile.task_detail.deny`
- `engineer_mobile.visit_action.allow`
- `engineer_mobile.visit_action.deny`
- `engineer_mobile.route_registration.success`
- `engineer_mobile.route_registration.failure`

Current state:

- no runtime integration
- no audit writer implementation
- no provider sending
- no DB execution
- no production mount activation

## Existing Customer Access Audit Writer Pattern

Observed existing files:

- `src/customerAccess/customerAccessAuditWriterResultNormalizer.js`
- `src/customerAccess/customerAccessAuditWriterAdapter.js`
- `src/customerAccess/customerAccessAuditPersistenceWriterAdapter.js`

Writer result normalizer pattern:

- normalizes writer results to `recorded`, `skipped`, or `failed`
- uses a narrow output key set:
  - `ok`
  - `status`
  - `auditWritten`
  - `persisted`
  - `reasonCode`
- supports safe reason codes
- treats malformed writer results as failed
- avoids raw error leakage

Injected writer adapter pattern:

- accepts `function writer(auditEvent)`
- has no global writer fallback
- missing or malformed writer returns safe failure
- writer throw/reject returns safe failure
- malformed writer result returns safe failure through the normalizer
- sanitizes audit event keys and metadata before writing
- does not mutate customer-facing response or route registration summary

Persistence writer adapter pattern:

- is injected repository only
- returns a writer function around an injected repository
- is optional and later-stage
- remains separate from basic writer result normalization

## Options Compared

### Option A: Reuse Customer Access modules directly

Pros:

- less code
- same behavior immediately
- no duplicate normalizer logic

Cons:

- imports Customer Access namespace into Engineer Mobile audit path
- confusing ownership and domain boundary
- future Engineer Mobile event-specific changes would require Customer Access-named module decisions
- makes later extraction to shared audit infrastructure less clear

### Option B: Create Engineer Mobile-specific thin wrapper modules using the same contract

Pros:

- clear Engineer Mobile domain boundary
- preserves the same safe result shape and behavior
- bounded, low-risk implementation
- easier to evolve Engineer Mobile event-specific validation
- avoids importing Customer Access runtime modules into Engineer Mobile
- leaves a future shared generic module refactor open

Cons:

- slight duplication
- must keep the contract aligned with Customer Access until a shared module exists

### Option C: Create a shared generic audit writer module now

Pros:

- clean long-term architecture
- eliminates duplicate domain normalizer logic
- could serve Customer Access, Engineer Mobile, and later audit domains

Cons:

- broader refactor
- higher regression risk
- would touch existing Customer Access module ownership
- not necessary before Engineer Mobile audit writer behavior is stabilized

## Recommendation

Recommended initial option: Option B.

Engineer Mobile should create Engineer Mobile-specific thin wrapper modules using the same contract and behavior as Customer Access writer result normalization and injected writer adapter.

Rationale:

- avoids importing Customer Access namespace into Engineer Mobile runtime
- preserves the same safe result shape
- keeps the work bounded and low-risk
- avoids refactoring stable Customer Access code during Engineer Mobile branch work
- allows a future shared generic audit module after multiple domains stabilize

This recommendation is only a planning decision. It does not authorize implementation.

## Future Task2169 Candidate

Recommended next exact task:

Engineer Mobile Audit Writer Result Normalizer Skeleton / No Runtime Integration No Provider No DB

Expected future files:

- `src/engineerMobile/engineerMobileAuditWriterResultNormalizer.js`
- `tests/engineerMobile/engineerMobileAuditWriterResultNormalizer.unit.test.js`
- `tests/engineerMobile/engineerMobileAuditWriterResultNormalizerBoundary.static.test.js`

Expected behavior:

- mirror Customer Access `recorded` / `skipped` / `failed` statuses
- use Engineer Mobile namespace and reason code constants
- normalize valid recorded writer result to:
  - `ok: true`
  - `status: "recorded"`
  - `auditWritten: true`
  - `persisted: true`
- normalize skipped writer result to safe skipped output
- normalize failed or malformed writer result to safe failed output
- do not leak raw writer result, raw error, SQL, token, provider, request, response, or private fields
- do not integrate runtime
- do not send provider
- do not touch DB

## Future Task2170 Candidate

Candidate follow-up after Task2169:

Engineer Mobile Injected Audit Writer Adapter Skeleton / No Runtime Integration No Provider No DB

Expected future files:

- `src/engineerMobile/engineerMobileAuditWriterAdapter.js`
- `tests/engineerMobile/engineerMobileAuditWriterAdapter.unit.test.js`
- `tests/engineerMobile/engineerMobileAuditWriterAdapterBoundary.static.test.js`

Expected behavior:

- accept `function writer(auditEvent)`
- validate/sanitize Engineer Mobile audit events from `buildEngineerMobileAuditEvent`
- normalize writer result through Engineer Mobile writer result normalizer
- missing writer returns safe failure
- writer throw/reject returns safe failure
- malformed writer result returns safe failure
- no global fallback
- no runtime integration
- no provider sending
- no DB execution

## Deferred Shared Generic Module Option

A future shared audit writer module can be reconsidered after both Customer Access and Engineer Mobile have stable writer contracts.

Future shared refactor should be separately authorized and should include:

- compatibility tests for Customer Access
- compatibility tests for Engineer Mobile
- no behavior changes to existing audit result shapes
- no DB/provider/runtime integration changes

Task2168 does not authorize this refactor.

## Explicit Non-Goals

Task2168 does not authorize:

- source/runtime changes
- test changes
- package changes
- Engineer Mobile audit runtime integration
- audit writer implementation
- audit result normalizer implementation
- provider sending
- DB execution
- DB connection creation
- migration apply or dry-run
- SQL execution
- `psql`
- `DATABASE_URL`
- env, Zeabur, or secrets inspection
- route/controller/global mount changes
- production mount activation
- app/server/public routes changes
- Customer Access changes
- shared generic audit refactor
- smoke or endpoint probes
- server/listener startup
- AI/RAG/provider/model calls
- admin frontend work
- billing/payment work

The 7 held historical docs remain out of scope and must remain untracked and untouched.

## Expected Verification

Docs-only verification:

```bash
git diff --check -- docs/task-2168-engineer-mobile-audit-writer-reuse-decision-packet-no-runtime-change.md
git status --short --branch
```

Node tests are not expected because Task2168 is docs-only and no source/test files should change.
