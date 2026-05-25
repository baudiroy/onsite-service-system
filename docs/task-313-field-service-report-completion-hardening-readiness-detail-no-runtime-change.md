# Task 313 - Field Service Report Completion Hardening Readiness Detail / No Runtime Change

## Scope And Non-goals

This document follows Task311 and Task312 and creates a docs-only implementation readiness detail packet for the second core MVP candidate: Field Service Report completion hardening.

Task313 does not approve implementation. It documents the invariants, concurrency questions, side-effect boundaries, and future gates that must be reviewed before any completion runtime work is considered.

This task is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- DB / DDL execution,
- Field Service Report completion runtime change,
- appointment runtime change,
- Case runtime change,
- finalAppointmentId runtime change,
- survey runtime,
- notification runtime,
- provider sending,
- complaint runtime,
- billing / settlement / quote runtime,
- AI / RAG runtime,
- test / smoke implementation,
- fixture change,
- package change.

Task313 does not modify backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, migrations, schema, indexes, smoke scripts, fixtures, package configuration, provider integrations, AI runtime, inventory documentation, or shared runtime data.

## Why This Follows Task312

Task312 documented Case / Appointment core workflow readiness. The next core candidate is Field Service Report completion hardening because completion is where the Case-level service result becomes official.

Field Service Report completion connects:

- one Case = one formal Field Service Report,
- multiple appointment / visit history,
- finalAppointmentId stability,
- Case completed state,
- repeat-completion guard,
- future survey first-transition context,
- future customer-visible service result summary,
- future billing / settlement evidence,
- future audit and evidence traceability,
- future AI-assisted completion summary boundaries.

If completion behavior is weak, downstream features may duplicate side effects, overwrite completed timestamps, choose the wrong final appointment, leak internal data, or treat a visit-level result as a new formal report.

Task313 keeps completion hardening as a future-only readiness packet.

## Core Completion Invariants To Protect

Future implementation must preserve these completion invariants:

1. One Case = one formal Field Service Report.
2. Field Service Report is the Case-level final completion summary, not one report per visit.
3. Repeat completion must be rejected before side effects.
4. First completion transition must have a concurrency-safe future design.
5. `finalAppointmentId` remains backend/system-owned.
6. `finalAppointmentId` must remain stable after completion.
7. Completion must not send survey, notification, billing, settlement, provider, or AI side effects unless explicitly approved in a future task.
8. Completion must not mutate complaint, callback, settlement, SaaS subscription, usage billing, report/export, or customer channel records unless explicitly approved in a future task.
9. Completion must not write AI draft content as official fact without human confirmation or deterministic business logic.
10. Completion must not expose internal-only data in customer-visible summaries.
11. Completion must preserve organization isolation and Data Access Control.
12. Legacy no-appointment compatibility, if retained, must be explicit and safe.

## Current Readiness Questions / Docs-only

Before any future completion hardening runtime task is approved, PM and engineering should answer the following questions.

### Completion Files Likely Needing Review

Future runtime work would likely require review of, but is not approved to modify in Task313:

- Field Service Report service and repository files.
- Case service and repository files.
- Appointment service and repository files.
- finalAppointmentId resolution logic.
- Field Service Report validators and route contracts.
- Case completion status transition logic.
- Timeline / activity / audit service files, if they participate in completion side effects.
- Admin completion handler and completion result display.
- Browser smoke and backend smoke scripts that cover completion, repeat completion, and final marker behavior.

Any future implementation task must include an explicit allowed file / layer list before editing.

### First-transition Concurrency Questions

Future implementation must evaluate whether completion is protected against concurrent first-completion requests.

Questions:

- Is the report row locked before completion state is evaluated?
- Is completion performed with a compare-and-set / conditional update pattern?
- Can two requests both observe a non-completed report before either writes completion state?
- Are report update, Case completion update, finalAppointmentId resolution, timeline, audit, and future side effects inside a safe transaction boundary?
- If a future survey/event/intent write fails, should completion roll back or should the event be retried separately?
- Is the first-transition result represented explicitly enough for future survey or audit event generation?

Task313 does not approve locking, transactions, repository changes, or DB work.

### Repeat-completion Guard Behavior To Preserve

Future work must preserve the existing policy that an already completed report cannot be completed again.

The repeat-completion guard should remain before:

- finalAppointmentId inference,
- report mutation,
- Case mutation,
- completed timestamp mutation,
- timeline / activity message creation,
- audit event creation,
- survey or future notification creation,
- billing or settlement side effects,
- AI or provider work.

Repeat completion must not:

- overwrite completed timestamps,
- re-infer finalAppointmentId,
- overwrite finalAppointmentId,
- create duplicate timeline / audit / event records,
- trigger future survey sending,
- create a second formal report,
- show false success in Admin UI.

Task313 does not modify this behavior.

### Side Effects That Must Remain Disabled Unless Approved

Completion must not automatically trigger the following without a future explicit task:

- survey creation or delivery,
- notification delivery,
- LINE / SMS / Email / App delivery,
- billing finalization,
- settlement finalization,
- quote approval,
- complaint closure,
- callback closure,
- customer channel binding,
- report/export generation,
- SaaS usage billing,
- AI official record writes,
- AI automated decisions.

Completion may become a source of truth for downstream future workflows only after the downstream workflow has its own approval gates, Data Access review, audit plan, and safety plan.

### Schema / Index / Constraint Questions

Future implementation should answer:

- Is the existing one-formal-report-per-Case uniqueness enough for completion hardening?
- Is an additional index needed for completion transition lookup?
- Is a DB-level guard needed for first-transition race protection?
- Should event or outbox uniqueness be tied to stable Case and report identity?
- How should legacy no-appointment completion remain compatible?
- Should completed timestamp stability be enforced at service level only, or with additional DB constraints?

Any schema, index, migration, DB, or DDL work requires separate explicit approval.

### Smoke / Regression Tests Needed If Future Implementation Is Approved

Future runtime work should include targeted tests or smoke coverage for:

- first completion succeeds once,
- repeat completion is rejected before side effects,
- completed timestamp remains stable after repeat attempt,
- Case completed timestamp remains stable after repeat attempt,
- finalAppointmentId remains stable after repeat attempt,
- different supplied finalAppointmentId cannot override completed report,
- duplicate formal Field Service Report cannot be created,
- no eligible completed visit is rejected before completion,
- cross-organization completion access is rejected,
- first-transition concurrency is protected, if the future implementation touches concurrency,
- customer-visible completion summary excludes internal-only data,
- Admin UI does not show false success after rejected repeat completion.

Task313 does not add or modify tests.

## Future-only Implementation Gate Checklist

Any future completion hardening runtime task must include explicit approval for:

1. PM approval.
2. Allowed file / layer list.
3. API contract approval.
4. Migration / schema / index approval, if needed.
5. DB / DDL approval, if needed.
6. Transaction / concurrency design approval.
7. Side-effect boundary approval.
8. Test / smoke approval.
9. Rollback / safety plan.
10. Organization isolation review.
11. Data Access Control review.
12. Audit readiness review.
13. Customer-visible / internal-only data review.
14. No provider sending confirmation unless explicitly approved.
15. No AI auto-decision confirmation.
16. No inventory docs expansion confirmation.

General statements such as "continue", "go ahead", "do next task", or "make progress" are not enough to approve runtime, DB, migration, provider sending, AI, or test changes.

## Risk Matrix / Future-only

`Runtime approved now` is `No` for every row.

| Risk | Affected invariant | Possible future mitigation | Requires transaction / locking? | Requires schema/index? | Requires API change? | Requires test/smoke? | Requires audit? | Runtime approved now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Repeat completion causes duplicate side effects. | Repeat completion must be rejected before side effects. | Keep already-completed guard before mutation, timeline, audit, provider, survey, and billing paths. | Future-only no / maybe | Future-only no | Future-only no / maybe | Future-only yes | Future-only yes | No |
| First completion race creates inconsistent report state. | First transition must be concurrency-safe. | Consider row lock, conditional update, or transaction boundary in a separate approved task. | Future-only yes | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Duplicate Field Service Report for same Case. | One Case = one formal Field Service Report. | Preserve report uniqueness invariant and duplicate active report guard. | Future-only maybe | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| finalAppointmentId is manually supplied or overwritten incorrectly. | finalAppointmentId remains backend/system-owned and stable. | Validate supplied values only before completion; block override after completion. | Future-only no / maybe | Future-only no / maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Appointment is not actually final but used as completion basis. | Completion must use the true eligible completed visit or legacy no-appointment path. | Keep eligibility tied to completed visit result and same Case scope. | Future-only no / maybe | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Completion triggers survey or notification without approval. | Completion side effects require explicit future approval. | Keep delivery and survey runtime disabled until separate gated task. | Future-only no | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Completion triggers billing or settlement without approval. | Billing / settlement must not be automatic completion side effects. | Keep financial finalization in a separate approved workflow with evidence and review gates. | Future-only no | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |
| Completion writes AI draft as official fact. | AI output and official records remain separated. | Require human confirmation or deterministic business rules before official writes. | Future-only no | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Cross-organization completion access. | Organization isolation and Data Access Control. | Enforce organization scope in service/repository/API and test cross-scope denial. | Future-only maybe | Future-only maybe | Future-only maybe | Future-only yes | Future-only yes | No |
| Engineer-visible or internal-only data leaks in completion summary. | Customer-visible/internal-only separation and role-based UX. | Use allow-listed customer-visible completion fields and field-level masking. | Future-only no / maybe | Future-only maybe | Future-only yes | Future-only yes | Future-only yes | No |

## Runtime Forbidden Confirmation

Task313 explicitly does not approve:

- backend runtime,
- Admin runtime,
- API changes,
- migration changes,
- schema changes,
- index changes,
- DB connection,
- DDL,
- `psql`,
- `db:migrate`,
- Migration 020 dry-run,
- Migration 020 apply,
- tests,
- smoke scripts,
- fixtures,
- package changes,
- Field Service Report completion runtime changes,
- appointment runtime changes,
- Case runtime changes,
- finalAppointmentId runtime changes,
- survey runtime,
- notification runtime,
- provider sending,
- complaint runtime,
- billing runtime,
- settlement runtime,
- quote runtime,
- AI / RAG runtime,
- inventory documentation changes.

## Conclusion

Task313 is a docs-only Field Service Report completion hardening readiness detail packet.

It does not approve completion runtime implementation.

Future implementation may use this packet to prepare a tightly scoped task, but the future task must still obtain explicit approval for allowed files, API contracts, schema or index changes, DB / DDL, transaction and concurrency design, side-effect boundaries, tests, Data Access, audit, rollback, safety, and sensitive data boundaries before any runtime work begins.
