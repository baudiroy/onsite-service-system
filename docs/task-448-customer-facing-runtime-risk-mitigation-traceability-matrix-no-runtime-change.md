# Task448 - Customer-Facing Runtime Risk Mitigation Traceability Matrix / No Runtime Change

Task448 maps the Task447 customer-facing runtime risk register to future
mitigations, acceptance evidence, implementation gates, and authorization
dependencies.

This task is documentation-only. It does not grant approval to implement
runtime code, fixtures, tests, API routes, database access, provider sending, or
AI/RAG work.

## Purpose

The purpose of Task448 is to create a traceability matrix from:

```text
risk -> mitigation -> evidence -> future gate
```

The matrix supports future PM/Codex review before any customer-facing
local-only runtime spike or fixture/test task is considered.

## Non-Authorization Statement

Task448 is not runtime approval.

Task448 does not authorize:

- local-only runtime spike,
- backend `src/` changes,
- admin `src/` changes,
- API / route / controller / resolver / repository changes,
- customerAccessContext runtime,
- projection runtime,
- response envelope runtime,
- safe-deny runtime,
- fixtures,
- tests,
- smoke tests,
- browser tests,
- test execution,
- DB access,
- repository access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider,
- RAG,
- vector DB,
- shared/prod/Zeabur runtime access.

All runtime status in this document is `Not authorized in Task448`.

## Relationship to Task429-Task447

Task429-Task436 established the local-only runtime spike authorization packet
and closure boundary.

Task437-Task443 established future skeleton implementation specifications and
closed that spec mini-branch.

Task444-Task446 established future fixture/test design, explicit
authorization, and readiness closure with `NO-GO` status.

Task447 established the customer-facing runtime risk register.

Task448 maps those risk items to mitigation and evidence requirements. It does
not create that evidence beyond documentation evidence.

## Mandatory Future Customer-Facing Flow

Future authorized work must preserve:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Traceability planning must not weaken:

- controller must not bypass resolver,
- resolver must not bypass customerAccessContext,
- projection must not bypass customerAccessContext,
- envelope must not bypass projection,
- safe-deny must not leak resource existence,
- response equivalence must be preserved,
- projection must be allow-list first,
- unknown fields must default to deny,
- forbidden fields must default to deny,
- token/link must not be treated as customer identity,
- `line_user_id` must not be treated as global identity,
- raw internal data must never be output,
- Case / Appointment / Field Service Report / complaint / billing /
  settlement / identity / token / link / audit state must not be mutated,
- DB must not be queried unless a future persistence/repository task is
  separately authorized,
- provider sending must not occur,
- AI provider / RAG / vector DB must not be called.

## Traceability Matrix Method

Each matrix row maps one Task447 risk item to:

- required mitigation,
- future acceptance evidence,
- required gate before implementation,
- related future skeleton layer,
- related future fixture/test category,
- authorization dependency,
- stop condition,
- review owner / reviewer role,
- current runtime status.

The matrix is intentionally conservative. When evidence is missing, status must
remain `NO-GO`.

## Mitigation Coverage Summary

Mitigations with docs-level support:

- mandatory customer-facing flow,
- no-bypass boundary,
- generic safe-deny,
- response equivalence,
- allow-list-first projection,
- unknown/forbidden field default deny,
- token/link not identity,
- `line_user_id` not global identity,
- no DB/provider/AI in pre-runtime branch,
- synthetic-only fixture policy,
- explicit authorization gate.

Mitigations still requiring runtime evidence:

- route/controller only calls resolver,
- resolver creates and enforces customerAccessContext,
- projection uses only customerAccessContext-approved data,
- envelope wraps projection or safe-deny only,
- runtime never emits raw internal fields,
- runtime does not mutate official state.

Mitigations requiring future fixtures/tests:

- no-bypass chain tests,
- safe-deny response equivalence tests,
- allow-list projection tests,
- unknown/forbidden field deny tests,
- token/link non-identity tests,
- organization isolation tests,
- no DB/provider/AI call tests.

Mitigations requiring separate explicit approval:

- any runtime file changes,
- any fixtures,
- any tests,
- any test execution,
- any API/browser/smoke coverage,
- any DB/repository access,
- any provider sending,
- any AI/RAG/vector DB access,
- any shared/prod/Zeabur access.

Mitigations that must keep status `NO-GO` if absent:

- safe-deny equivalence,
- organization isolation,
- customer channel identity scoping,
- allow-list-first projection,
- no raw internal data,
- no mutation,
- no DB/provider/AI execution,
- explicit scope and command authorization.

## Evidence Type Classification

Task448 can only produce documentation evidence.

Evidence types:

- Documentation evidence: current task output. Produced by Task448.
- Authorization evidence: future explicit user/PM approval packet. Not produced
  by Task448.
- Code review evidence: future review of implementation files. Not produced by
  Task448.
- Fixture/test evidence: future synthetic fixtures and minimal unit/contract
  tests. Not produced by Task448.
- Sensitive scan evidence: current documentation scan only; future fixture/code
  scans require authorization. Runtime evidence is not produced by Task448.
- Runtime log evidence: not produced by Task448.
- Audit evidence: not produced by Task448.
- DB/migration evidence: not produced by Task448 and must not be produced in
  this task.

## Customer-Facing Runtime Risk Mitigation Traceability Matrix

| Risk ID | Risk category | Related Task447 risk item | Required mitigation | Future acceptance evidence | Required gate before implementation | Related future skeleton layer | Related future fixture/test category, if any | Authorization dependency | Stop condition | Review owner / reviewer role | Runtime status now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFR-001 | Authorization risk | Ambiguous approval may start work. | Require exact next single-task approval with file and command scope. | Recorded authorization packet. | PM/user explicit scope gate. | All layers | Authorization matrix review | User + PM approval | Missing exact files or commands. | PM + Codex | Not authorized in Task448 |
| CFR-002 | Scope creep risk | Docs-only expands into implementation. | Restrict touched files to the named doc. | Git diff path review. | Docs-only scope gate. | All layers | No test category | User + PM approval for any non-doc work | Any non-doc diff. | Codex reviewer | Not authorized in Task448 |
| CFR-003 | Layer bypass risk | Chain boundary is skipped. | Enforce request -> controller -> resolver -> context -> projection -> envelope. | Code review plus no-bypass unit tests. | Runtime skeleton gate. | Controller/resolver/context/projection/envelope | No-bypass chain tests | Runtime + test approval | Direct raw response or skipped layer. | Backend reviewer | Not authorized in Task448 |
| CFR-004 | Existence leakage risk | Deny cases differ. | Generic safe-deny and response equivalence. | Safe-deny equivalence tests. | Safe-deny contract gate. | Envelope/safe-deny | Response equivalence tests | Runtime + test approval | Distinguishable missing/forbidden/expired result. | Security reviewer | Not authorized in Task448 |
| CFR-005 | Raw internal data exposure risk | Raw object reaches response. | Allow-list-only projection. | Forbidden-field and allow-list tests. | Projection field-map gate. | Projection DTO/service | Allow-list and forbidden-field tests | Runtime + test approval | Raw object spread or internal field output. | Security + backend reviewer | Not authorized in Task448 |
| CFR-006 | Customer-visible data policy risk | Internal data enters customer surface. | Separate customer-visible projection from internal records. | Customer-visible field map review. | Projection policy gate. | Projection DTO/service | Customer-visible field tests | Runtime + test approval | Internal-only field in customer DTO. | Product + security reviewer | Not authorized in Task448 |
| CFR-007 | Organization isolation risk | Access path omits organization scope. | Require organization-scoped access context. | Same-org/cross-org tests. | Access-context gate. | Resolver/customerAccessContext | Organization isolation tests | Runtime + test approval | Missing organization filter or scope. | Security reviewer | Not authorized in Task448 |
| CFR-008 | Customer channel identity risk | Raw channel identity is trusted. | Resolve identity only through scoped access context. | Identity-scoping tests and code review. | Identity resolver gate. | Resolver/customerAccessContext | Channel identity tests | Runtime + test approval | Raw channel id used as authority. | Security + channel reviewer | Not authorized in Task448 |
| CFR-009 | Token/link misuse risk | Link possession becomes identity. | Treat token/link as access input, not identity. | Token/link non-identity tests. | Token/link lifecycle gate. | Resolver/customerAccessContext | Token/link tests | Runtime + test approval | Link bypasses identity/context policy. | Security reviewer | Not authorized in Task448 |
| CFR-010 | `line_user_id` global identity misuse risk | LINE id is treated globally. | Scope LINE identity by organization and channel. | Identity lookup review. | Channel identity gate. | Resolver/customerAccessContext | LINE scope tests | Runtime + test approval | Global LINE identity lookup. | Security + channel reviewer | Not authorized in Task448 |
| CFR-011 | DB / repository accidental access risk | Pre-runtime task touches DB. | Keep docs/spec branch DB-free. | Command review and import/path review. | DB-free preflight gate. | All layers | No DB call tests if authorized later | Separate DB approval | DB client, repository import, or DB command appears. | Codex reviewer | Not authorized in Task448 |
| CFR-012 | Mutation risk | Read path mutates official state. | Make customer-facing access read-only by default. | Mutation guard tests. | Mutation boundary gate. | Controller/resolver/service | No-mutation tests | Runtime + test approval | Writes to Case/Appointment/FSR/complaint/billing/settlement/identity/token/link/audit. | Backend reviewer | Not authorized in Task448 |
| CFR-013 | Provider sending risk | Access path sends notification. | Forbid provider calls in access branch. | Provider-call absence review/tests. | Provider boundary gate. | Controller/service | No-provider tests | Separate provider approval | LINE/SMS/Email/App/survey send path appears. | Integration reviewer | Not authorized in Task448 |
| CFR-014 | AI / RAG / vector DB risk | Access path calls model/retrieval. | Forbid AI/RAG/vector DB in branch. | AI/RAG import absence review/tests. | AI boundary gate. | All layers | No-AI/RAG tests | Separate AI/RAG approval | Model, RAG, embedding, or vector call appears. | AI/security reviewer | Not authorized in Task448 |
| CFR-015 | Fixture/test contamination risk | Fixture includes real-looking sensitive data. | Synthetic-only fixture policy and sensitive scan. | Fixture scan and review. | Fixture authorization gate. | Fixtures/tests | Fixture sensitive scan | Fixture/test approval | Real-looking sensitive fixture data. | QA + security reviewer | Not authorized in Task448 |
| CFR-016 | Production data risk | Shared/prod data copied into artifact. | No shared/prod/Zeabur access. | Command review and sensitive scan. | Production-data prohibition gate. | All layers | Synthetic-only fixture tests | User + PM approval forbidding prod data | Any production data source used. | PM + security reviewer | Not authorized in Task448 |
| CFR-017 | Sensitive data / token / secret risk | Secret or personal data appears in output. | Use placeholders and scan every artifact. | Sensitive scan evidence. | Redaction gate. | All layers | Sensitive scan check | Scope-specific approval | Actual secret, full phone/address, or raw id appears. | Security reviewer | Not authorized in Task448 |
| CFR-018 | Audit/logging overreach risk | Audit captures raw payload. | Log masked summaries only. | Audit payload code review. | Audit event gate. | Audit/security event layer | Audit redaction tests | Separate audit runtime approval | Raw sensitive payload in audit. | Security reviewer | Not authorized in Task448 |
| CFR-019 | Entitlement / usage / SaaS boundary risk | Entitlement is treated as permission. | Check entitlement and user permission separately. | Access policy review/tests. | Entitlement boundary gate. | Resolver/customerAccessContext | Entitlement-denied tests | Runtime + test approval | Entitlement shortcut bypasses permission. | SaaS/security reviewer | Not authorized in Task448 |
| CFR-020 | Support / complaint / follow-up auto-creation risk | Read path creates workflow records. | Separate read access from follow-up mutation. | Route scope review. | Mutation/workflow gate. | Controller/service | No-mutation tests | Separate workflow approval | Any auto-created complaint/follow-up/support task. | Product + backend reviewer | Not authorized in Task448 |
| CFR-021 | Billing / settlement internal data leakage risk | Customer projection exposes internal commercial data. | Customer fee projection must be separate and allow-listed. | Billing/settlement forbidden-field tests. | Billing data boundary gate. | Projection DTO/service | Forbidden-field tests | Runtime + test approval | Internal billing/settlement field appears. | Finance + security reviewer | Not authorized in Task448 |
| CFR-022 | Migration020 / DB migration accidental execution risk | Migration command runs. | Migration020 remains paused; no DB commands. | Command review. | Migration no-apply gate. | N/A | No test category | Separate DDL approval | DB/DDL/migration command appears. | PM + DB reviewer | Not authorized in Task448 |
| CFR-023 | Shared / prod / Zeabur runtime access risk | Verification hits shared runtime. | Keep verification local/docs-only unless approved. | Command/env review. | Shared-runtime no-access gate. | All layers | No test category | Separate shared-runtime approval | Shared/prod/Zeabur target used. | PM + security reviewer | Not authorized in Task448 |

## NO-GO / CONDITIONAL-GO / GO Impact

Future status must remain `NO-GO` when:

- any high-risk mitigation lacks evidence,
- exact files or commands are not named,
- safe-deny equivalence is unspecified,
- organization isolation is unspecified,
- customer channel identity boundary is unspecified,
- projection allow-list is incomplete,
- DB/provider/AI/RAG/vector DB boundary is unclear,
- production-data prohibition is unclear.

`CONDITIONAL-GO` may authorize only the next named single minimal task, such as
one skeleton file, one fixture file, or one test file, with exact allowed
commands.

`GO` does not authorize the full runtime branch by implication. DB, migration,
provider sending, AI/RAG/vector DB, production data, shared runtime,
API/browser/smoke tests, fixtures, tests, and runtime all need explicit scope
when relevant.

## Required Evidence Before Any Runtime Task

Before any future runtime task, the packet should include:

- authorization evidence,
- exact file scope,
- exact command scope,
- chain preservation statement,
- safe-deny equivalence requirement,
- allow-list projection requirement,
- organization isolation requirement,
- customer channel identity requirement,
- mutation boundary,
- DB/provider/AI/RAG/vector DB prohibition or explicit separate approval,
- production-data prohibition,
- sensitive scan plan,
- expected review owner,
- stop conditions.

## Security / Privacy / Organization Isolation Boundaries

Security and privacy evidence must show:

- customer-facing output is allow-listed,
- internal-only data is denied,
- denied/missing/cross-scope resources are equivalent,
- organization scope is required,
- raw internal data is not emitted,
- sensitive fields are not present in docs/fixtures/tests/output,
- no shared/prod data is used.

## Customer Channel Identity Boundary Notes

Customer channel identity evidence must show:

- token/link is not identity,
- raw channel id is not identity,
- `line_user_id` is not global identity,
- identity is scoped by organization and channel,
- customerAccessContext owns access decision inputs,
- projection does not expose raw channel ids.

## SaaS / Entitlement / Usage Boundary Notes

SaaS evidence must show:

- entitlement and permission checks remain separate,
- subscription/entitlement denial does not leak resource existence,
- usage tracking does not store raw sensitive payload,
- Task448 does not implement entitlement, usage, billing, subscription, seat,
  or plan runtime.

## Explicit Non-goals

Task448 does not:

- implement runtime,
- implement fixtures,
- implement tests,
- execute tests,
- implement API,
- implement route/controller,
- implement resolver,
- implement repository,
- implement customerAccessContext,
- implement projection,
- implement response envelope,
- implement safe-deny,
- touch DB,
- touch migration,
- run Migration020,
- run browser/API/smoke,
- send providers,
- call AI/RAG/vector DB,
- modify package files,
- modify localization files,
- modify inventory docs,
- access shared/prod/Zeabur runtime.

## Verification Plan

Task448 verification should include:

- `git diff --check`,
- sensitive scan on this document,
- `npm run check`,
- `npm run admin:check`.

Task448 must not run:

- DB commands,
- DDL,
- migration commands,
- API tests,
- browser tests,
- smoke tests,
- fixture generation,
- test generation,
- test commands,
- provider commands,
- AI/RAG/vector DB commands.

## Completion Report Checklist

Task448 completion reporting should include:

- modified files,
- docs-only confirmation,
- implementation summary,
- what was not implemented,
- verification results,
- whether `docs/PROJECT_GUARDRAILS.md` was violated,
- whether tables / API / permissions / audit log / smoke tests were changed,
- whether tests / fixtures were added or changed,
- whether tests were executed,
- whether sensitive data / token / secret / personal data / LINE logic was
  touched,
- whether customer channel identity / organization isolation / SaaS-ready /
  entitlement / seat billing / usage billing / AI add-on / Enterprise SSO was
  affected,
- future task notes, if any, without expanding implementation scope.
