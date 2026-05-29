# Task2062 - Customer-Facing Report Projection Malformed Row Container Guard

Status: completed

## Scope

- Hardened customer-facing service report projection only.
- No DB, migration, route, controller, repository query, smoke, Zeabur, provider, admin, AI, billing, settlement, payment, or package changes.
- The 7 held historical untracked docs were left untouched.

## Runtime Contract

- The projection now only treats direct plain row objects as valid public report rows.
- Malformed row inputs fail closed with the existing safe unavailable convention:
  - `status: "deny"`
  - `messageKey: "customerAccess.unavailable"`
  - `customerVisible: false`
  - `data: null`
  - `error.messageKey: "customerAccess.unavailable"`
- Null, undefined, arrays, strings, numbers, booleans, Date objects, Error objects, Buffer-like objects, Promise/thenable values, and class instances are denied before publication/mapping.
- Unsafe wrapper containers are not unwrapped or interpreted. Approved fields nested inside `row`, `rows`, `data`, `payload`, `result`, `report`, `reportRow`, `serviceReport`, `raw`, `rawRow`, or `dbRow` remain unavailable.

## Regression Preservation

- Existing customer-facing serviceReport DTO allowlist remains unchanged.
- `serviceSummary` remains sourced only from `approved_service_summary`.
- `completionTime` remains sourced only from `completion_time`.
- `publicAttachments` items remain limited to `attachmentId`, `label`, and `mimeType`.
- No raw malformed row, wrapper, internal, debug, provider, identity, storage, SQL, stack, token, or authorization values are serialized into the response.

## Verification

- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerFacingReportRuntimeHardening.static.test.js`
- `git diff --check`
- `git status --short --branch`
