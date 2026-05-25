# Task 569 - Customer-Facing API Contract Static Test Planning

## Planning Conclusion

CUSTOMER-FACING API CONTRACT STATIC TEST PLANNING COMPLETE — NO TEST FILE OR RUNTIME AUTHORIZED

Task569 plans how a future static test could verify the Task568 customer-facing service report API contract proposal.

This task does not create a test file.

This task does not modify fixtures.

This task does not authorize API runtime.

This task does not authorize route, controller, resolver, DTO, repository, service, database, migration, provider sending, AI, RAG, or vector database work.

## Current Baseline Reference

Current branch status:

STATIC BASELINE COMPLETE / API RUNTIME NO-GO

Relevant completed baseline:

- Task565 publication state static test passed.
- Task566 static baseline closure completed.
- Task567 runtime readiness gate completed, but runtime is still not authorized.
- Task568 API contract proposal completed, but API runtime is still not authorized.

Task569 does not execute Task565 or any other test.

## Future Static Test File Proposal

Future test-only file proposal:

```text
tests/engineerMobileWorkbench/engineerMobileWorkbench.customerFacingApiContract.static.test.js
```

This is only a future proposal.

Task569 does not create this file.

Task569 does not execute `node --test`.

Task569 does not modify fixture markers.

## Future Test Import Boundary

Future static test should import only:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const fixture = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');
```

Future static test must not import:

- `src/` runtime.
- `admin/` runtime.
- API route / controller.
- repository / service.
- database connection.
- package script.
- provider client.
- AI / RAG module.
- vector database module.

## Proposed Static Assertions

### A. Endpoint Proposal Boundary

Future static test should verify:

- Preferred endpoint is Case-level read:
  - `GET /customer/cases/:caseId/service-report`.
- Endpoint proposal does not equal route implementation.
- Endpoint proposal does not imply controller runtime.
- Endpoint proposal does not imply DB query runtime.
- Endpoint proposal does not imply provider sending.
- Endpoint proposal does not imply customer-facing DTO runtime.

### B. Request Flow Boundary

Future static test should verify that the API contract requires this order:

```text
request
-> auth/session or customer channel identity context
-> organization scope resolution
-> customer identity verification
-> customer-to-Case linkage check
-> publication state check
-> customer-visible projection policy
-> DTO / response envelope
-> generic unavailable / safe-deny when not allowed
```

Future static test should verify bypass prohibitions:

- Controller must not bypass resolver.
- Resolver must not bypass organization scope.
- Publication state must not bypass identity / linkage.
- Projection must not bypass customer-visible policy.
- Denied / unavailable response must not leak Case / report / organization existence.

### C. Success Envelope Allow-list

Future static test should confirm success envelope allows only customer-visible fields such as:

- `caseId` or customer-visible Case reference.
- `publicationState`.
- `serviceSummary`.
- `serviceResult`.
- `completedAt`.
- `appointmentWindow`.
- `productSummary`.
- `technicianDisplayName`.
- `customerSafeSignatureStatus`.
- `followUp` customer-visible summary.

Future test should confirm success envelope must not contain:

- raw formal FSR row.
- raw completion submission.
- internal-only fields.
- unrestricted file references.
- raw binary photos or signatures.

### D. Safe-deny Envelope

Future static test should verify a generic unavailable / safe-deny envelope equivalent to:

```json
{
  "ok": false,
  "code": "SERVICE_REPORT_UNAVAILABLE",
  "message": "The service report is not available."
}
```

Future safe-deny test should cover:

- cross-organization access.
- wrong customer access.
- unverified identity.
- unlinked Case.
- unpublished report.
- internal-only source data.
- withheld / disputed state when not customer-visible.
- deleted / hidden / unavailable report.
- ambiguous identity.

Future safe-deny test should confirm no leakage of:

- Case existence.
- report existence.
- organization existence.
- customer linkage existence.
- unpublished draft existence.
- internal approval state.
- internal denial reason.

### E. Forbidden Fields Scan

Future static test should scan proposed envelope / fixture markers for forbidden fields:

- internal note.
- audit log.
- AI raw payload.
- internal billing / settlement data.
- engineer internal comment.
- supervisor review / approval data.
- provider raw payload.
- token / secret / `DATABASE_URL`.
- raw LINE identifiers.
- raw phone / address unless masked and explicitly customer-visible.
- cross-organization data.
- raw completion submission.
- raw engineer input.
- raw photos / signatures / binary refs without future file access policy.
- vendor rules / cost / margin / settlement formula.
- internal dispute notes.
- internal follow-up notes.
- unconfirmed dispatch suggestions.
- internal risk flags.

### F. FSR Invariant Assertions

Future static test should verify:

- Customer-facing API must not create a second formal FSR.
- Customer-facing report is a filtered publication view.
- API read must not create a formal FSR.
- API read must not approve a formal FSR.
- API read must not publish a formal FSR.
- API read must not modify completion source-data.
- API read must not modify `finalAppointmentId`.
- Completion submission must not be treated as Case completed.

### G. Identity / Channel Assertions

Future static test should verify:

- LINE is not global identity.
- `organization_id + line_channel_id + line_user_id` is insufficient alone.
- Phone alone cannot authorize.
- Address alone cannot authorize.
- LINE id alone cannot authorize.
- Access requires verified identity.
- Access requires organization scope.
- Access requires linked Case.
- Access requires publication allowed.

## Fixture Readiness Review

Current fixture marker support appears sufficient for broad static coverage of:

- publication state markers.
- DTO allow-list / forbidden-field markers.
- unavailable and safe-deny proposal markers.
- customer identity access fixtures.
- customer role boundary fixtures.
- customer channel identity scope fixtures.
- customer/Case linkage fixtures.
- customer access scenarios.
- formal FSR and customer-facing filtering invariant notes.

Current fixture marker support may not be sufficient for exact future API contract static test coverage of:

- endpoint proposal markers.
- success envelope `ok: true` marker.
- success envelope `data.serviceReport` marker.
- safe-deny envelope `ok: false` marker.
- safe-deny envelope `code: SERVICE_REPORT_UNAVAILABLE` marker.
- safe-deny envelope `message` marker.
- explicit future request-flow ordered-step markers.

Conclusion:

- If the future test only checks existing publication / DTO / identity / safe-deny markers, fixture extension may not be required.
- If the future test must verify exact Task568 API envelope shape and endpoint proposal markers, a separate fixture-only task should be created first.
- Task569 does not modify fixtures.

Suggested future fixture-only task:

- Customer-facing API contract fixture marker extension / fixture-only.

## Future Test Command Proposal

Future command proposal only, not executed by Task569:

```bash
node --test tests/engineerMobileWorkbench/engineerMobileWorkbench.customerFacingApiContract.static.test.js
```

## Non-goals

Task569 does not do any of the following:

- no test file creation.
- no fixture modification.
- no runtime implementation.
- no API / route / controller.
- no resolver implementation.
- no DTO implementation.
- no repository / DB query.
- no migration / SQL / DDL.
- no customer identity runtime.
- no provider sending.
- no LINE / SMS / Email / App push.
- no survey runtime.
- no billing / settlement runtime.
- no AI / RAG / vector DB.
- no `package.json` change.
- no tests executed.
- no existing document changes.

## Future Task Candidates

Future candidates only, not authorized by Task569:

- Customer-facing API contract fixture marker extension / fixture-only.
- Customer-facing API contract static test / test-only.
- Customer-facing safe-deny envelope static test / test-only.
- Customer-facing response envelope DTO contract refinement / no runtime.
- Customer-facing minimum vertical slice authorization gate / no runtime.

## Final Planning Statement

Task569 completes static test planning for the Task568 customer-facing service report API contract proposal.

CUSTOMER-FACING API CONTRACT STATIC TEST PLANNING COMPLETE — NO TEST FILE OR RUNTIME AUTHORIZED

Current status remains:

STATIC BASELINE COMPLETE / API RUNTIME NO-GO
