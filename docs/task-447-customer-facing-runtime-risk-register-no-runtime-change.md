# Task447 - Customer-Facing Runtime Risk Register / No Runtime Change

Task447 establishes a risk register for the customer-facing local-only runtime
spike branch before any runtime, fixture, or test implementation is authorized.

This task is documentation-only. It does not grant approval to implement
runtime code, fixtures, tests, API routes, database access, provider sending, or
AI/RAG work.

## Purpose

The purpose of Task447 is to consolidate the known customer-facing runtime,
fixture, test, security, privacy, and organization-isolation risks before any
future implementation task is considered.

This document supports future PM/Codex decisions by making the risk surface
explicit. It is not an approval artifact.

## Non-Authorization Statement

Task447 is not runtime approval.

Task447 does not authorize:

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

All runtime status in this document is `Not authorized in Task447`.

## Relationship to Task429-Task446

Task429-Task436 defined and closed the local-only runtime spike authorization
decision packet and decision gate.

Task437-Task443 defined and closed implementation specifications for the
customer-facing skeleton chain:

- route/controller,
- resolver,
- customerAccessContext,
- projection DTO / projection service,
- response envelope / generic safe-deny,
- skeleton chain integration.

Task444-Task446 defined and closed fixture/test readiness:

- synthetic fixtures and minimal test design,
- fixture/test implementation authorization conditions,
- fixture/test readiness closure with current status `NO-GO`.

Task447 gathers risk controls across those branches before any future
GO / CONDITIONAL-GO decision.

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

Risk analysis must not weaken:

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

## Risk Register Method

Each risk item records:

- Risk ID,
- Risk category,
- Risk description,
- Trigger / scenario,
- Potential impact,
- Required mitigation,
- Detection / review method,
- Stop condition,
- Related guardrail,
- Related task references,
- Runtime status now.

Every item uses the same runtime status:

```text
Not authorized in Task447
```

## Top Risks Summary

The highest-risk areas to resolve before runtime are:

1. Existence leakage.
   Customer-facing endpoints must not reveal whether a Case, Appointment,
   report, link, token, customer, channel identity, complaint, billing record,
   or settlement record exists.

2. Organization isolation bypass.
   Any customer-facing access path that omits organization scope or cross-tenant
   checks can expose data across tenants.

3. Customer channel identity misuse.
   Token/link possession or raw channel identity must not become a substitute
   for verified customer access context.

4. Raw internal data exposure.
   Projection must never pass through raw Case, Appointment, Field Service
   Report, complaint, billing, settlement, audit, provider, or AI payloads.

5. DB/provider/AI accidental execution.
   Pre-runtime tasks must not accidentally query DB, send notifications, call
   providers, or invoke AI/RAG/vector DB.

6. Fixture/test contamination.
   Future fixtures/tests must not introduce production data, real secrets, full
   customer identifiers, raw provider payloads, or broad runtime test behavior.

If any of these mitigations are incomplete, future runtime status should remain
`NO-GO`.

## Customer-Facing Runtime Risk Register

| Risk ID | Risk category | Risk description | Trigger / scenario | Potential impact | Required mitigation | Detection / review method | Stop condition | Related guardrail | Related task references | Runtime status now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CFR-001 | Authorization risk | Ambiguous user approval is treated as implementation approval. | User says "continue" without naming runtime scope. | Unauthorized runtime, tests, or DB work starts. | Require explicit next single-task authorization and exact file/command scope. | PM/Codex authorization packet review. | Missing exact scope. | No implied runtime approval. | Task429-436, Task445-446 | Not authorized in Task447 |
| CFR-002 | Scope creep risk | A docs-only task expands into code, API, fixture, or test work. | Risk review mentions implementation gaps. | Runtime changes without approval. | Keep future work as listed tasks only. | Git diff path review. | Any non-doc file change. | Docs-only means docs-only. | Task446 | Not authorized in Task447 |
| CFR-003 | Layer bypass risk | Controller, resolver, access context, projection, or envelope is bypassed. | Direct projection or raw response from controller. | Permission checks and masking are skipped. | Preserve mandatory chain and no-bypass tests when authorized. | Spec review and future unit/contract tests. | Any direct raw response path. | Mandatory future flow. | Task437-443 | Not authorized in Task447 |
| CFR-004 | Existence leakage risk | Safe-deny differs by missing, forbidden, expired, or cross-scope resource. | Different status, message, shape, timing, or field values. | Resource enumeration. | Generic safe-deny and response equivalence. | Future equivalence matrix and safe-deny tests. | Any distinguishable deny response. | No resource existence leakage. | Task441, Task444 | Not authorized in Task447 |
| CFR-005 | Raw internal data exposure risk | Raw domain object is spread into response. | Returning repository result or internal DTO directly. | Customer sees internal notes, audit, billing, settlement, provider, or AI data. | Allow-list projection only. | Field allow-list review and forbidden-field tests. | Any raw object spread. | Customer visible data policy. | Task440, Task444 | Not authorized in Task447 |
| CFR-006 | Customer-visible data policy risk | Customer-facing report exposes internal-only fields. | Report/timeline projection includes hidden status or note. | Privacy breach and support confusion. | Separate customer-facing projection from internal report. | Projection field map review. | Any internal-only field exposed. | Customer-visible vs internal separation. | Task353, Task373 | Not authorized in Task447 |
| CFR-007 | Organization isolation risk | Request lacks organization scope filter. | Link/token lookup or resolver path omits org boundary. | Cross-tenant data exposure. | Require organization-scoped customerAccessContext. | Future resolver/access-context tests. | Missing org filter in access path. | Tenant isolation. | Task364-375 | Not authorized in Task447 |
| CFR-008 | Customer channel identity risk | Channel identity is accepted without scoped verification. | Customer access trusts raw channel identifier. | Wrong customer sees case data. | Resolve through scoped identity and access context only. | Identity boundary review. | Raw channel id used as authority. | Channel identity must be scoped. | Task363, Task375 | Not authorized in Task447 |
| CFR-009 | Token/link misuse risk | Token or link possession is treated as customer identity. | Link grants direct access without verification or context. | Link leak grants unintended data access. | Token/link only contributes to access context; it is not identity. | Token/link lifecycle review. | Link bypasses identity/context policy. | Token/link is not identity. | Task367, Task407 | Not authorized in Task447 |
| CFR-010 | `line_user_id` global identity misuse risk | `line_user_id` is treated as globally unique. | Access lookup ignores organization/channel scope. | Cross-channel or cross-tenant identity collision. | Scope identity by organization and channel. | Identity model review. | Global line id lookup. | LINE not global identity. | Task158-166, Task363 | Not authorized in Task447 |
| CFR-011 | DB / repository accidental access risk | Pre-runtime branch touches repository or DB. | Test or helper uses repository for convenience. | Unauthorized DB access or data leakage. | No DB/repository before explicit task. | Diff review and command review. | Repository import or DB command appears. | No DB in pre-runtime branch. | Task444-446 | Not authorized in Task447 |
| CFR-012 | Mutation risk | Customer-facing read path mutates official state. | Access endpoint updates Case, Appointment, report, complaint, billing, settlement, identity, token, link, or audit state. | Data corruption or side effects. | Read-only projection; audit only if separately authorized. | Future mutation guard tests. | Any write in read path. | Customer-facing reads are side-effect constrained. | Task444 | Not authorized in Task447 |
| CFR-013 | Provider sending risk | Customer-facing access triggers LINE/SMS/Email/App/survey sending. | Notification helper called from read path. | Unapproved outbound communication. | No provider calls in access branch. | Provider stub/review in future tests. | Any send-capable call. | No provider sending. | Task444-446 | Not authorized in Task447 |
| CFR-014 | AI / RAG / vector DB risk | Runtime calls AI or retrieval during access. | Summary, recommendation, or RAG lookup added to projection. | Sensitive data sent externally or cross-tenant retrieval. | No AI/RAG/vector DB in branch unless separately authorized. | Import/path review. | Any model/retrieval call. | AI advisory and permission-aware only. | Task444-446 | Not authorized in Task447 |
| CFR-015 | Fixture/test contamination risk | Future fixtures include real-looking sensitive data. | Synthetic fixture uses real token-like or phone-like values. | Sensitive output or confusing test evidence. | Synthetic-only fixture policy and scan. | Sensitive scan and fixture review. | Real-looking credential or customer data. | No production data in fixtures. | Task444-446 | Not authorized in Task447 |
| CFR-016 | Production data risk | Shared/prod data is copied into docs, fixtures, tests, or output. | Developer inspects runtime for examples. | Customer/privacy leakage. | No shared/prod/Zeabur access. | Command review and scan. | Any production data source used. | No production data. | Task444-446 | Not authorized in Task447 |
| CFR-017 | Sensitive data / token / secret risk | Credential or customer identifier appears in file/log/output. | Pasted example includes actual secret, token, full phone, address, or raw channel id. | Credential or personal data leakage. | Use placeholders and scan outputs. | Sensitive scan. | Any actual secret/customer data. | No sensitive output. | Project guardrails | Not authorized in Task447 |
| CFR-018 | Audit/logging overreach risk | Audit design logs too much data. | Future security event stores raw request/provider payload. | Audit log becomes sensitive data leak. | Log masked summaries only. | Audit payload review. | Raw sensitive payload in audit. | Audit must be minimal and redacted. | Task366, Task408-409 | Not authorized in Task447 |
| CFR-019 | Entitlement / usage / SaaS boundary risk | Entitlement and permission checks are collapsed. | Organization entitlement is treated as user permission. | Feature exposure to unauthorized user. | Check entitlement and user permission separately. | Future access-context review. | Any single combined shortcut. | Entitlement is not permission. | Project guardrails, Task198-199 | Not authorized in Task447 |
| CFR-020 | Support / complaint / follow-up auto-creation risk | Customer-facing read path creates support records. | Error or problem report flow is mixed into access endpoint. | Unauthorized workflow mutation. | Keep read access separate from follow-up creation. | Route scope review. | Any auto-created follow-up in read path. | No mutation without explicit task. | Customer-facing completion design | Not authorized in Task447 |
| CFR-021 | Billing / settlement internal data leakage risk | Customer report exposes internal charges or settlement rules. | Projection uses internal billing/settlement object. | Commercial/privacy leakage. | Customer fee view must be separate and allow-listed. | Projection forbidden-field tests. | Internal billing or settlement field exposed. | Customer visible data policy. | Project guardrails, Task373 | Not authorized in Task447 |
| CFR-022 | Migration020 / DB migration accidental execution risk | Migration or DB command runs during docs/test branch. | Running broad migration/check command. | Schema or shared runtime changes. | Migration020 remains paused; no DB commands. | Command history review. | Any DDL/migration command. | No DDL without explicit approval. | Task150-151 | Not authorized in Task447 |
| CFR-023 | Shared / prod / Zeabur runtime access risk | Task uses shared runtime to verify behavior. | Browser/API/smoke/DB command hits shared service. | Production data exposure or side effects. | Local/docs-only verification only. | Command and env review. | Any shared/prod target. | No shared runtime access. | Task444-446 | Not authorized in Task447 |

## Risk Impact on Future GO / CONDITIONAL-GO / NO-GO

Future status should remain `NO-GO` when:

- any high-risk mitigation is incomplete,
- authorization is ambiguous,
- exact file scope is missing,
- exact command scope is missing,
- production-data prohibition is unclear,
- DB/repository boundary is unclear,
- provider-sending boundary is unclear,
- AI/RAG/vector DB boundary is unclear,
- safe-deny equivalence is not specified,
- organization isolation is not specified,
- customer channel identity boundary is not specified.

`CONDITIONAL-GO` may only authorize the next named single minimal task and only
within exact file and command scope.

`GO` does not mean the full runtime branch is enabled. DB, migration, provider
sending, AI provider, RAG, vector DB, production data, shared runtime access,
API/browser/smoke coverage, and fixture/test implementation each still require
separate explicit approval when relevant.

## Required Mitigations Before Any Runtime Task

Before any future customer-facing runtime task, the next packet must include:

- exact runtime file scope,
- exact command scope,
- no DB unless specifically authorized,
- no provider sending unless specifically authorized,
- no AI/RAG/vector DB unless specifically authorized,
- no production data,
- no shared/prod/Zeabur access,
- mandatory chain preservation,
- generic safe-deny behavior,
- response equivalence,
- allow-list projection,
- forbidden-field deny list,
- organization-scoped access context,
- customer channel identity scoping,
- mutation boundary,
- sensitive scan expectations,
- stop conditions.

## Security / Privacy / Organization Isolation Boundaries

Customer-facing access must be designed from least privilege:

- scope by organization,
- resolve customer access through a controlled access context,
- expose only customer-visible fields,
- default unknown fields to deny,
- default forbidden fields to deny,
- return generic safe-deny for denied/missing/expired/cross-scope resources,
- avoid raw internal payloads,
- avoid production data in fixtures/tests/docs,
- avoid shared/prod runtime verification.

## Customer Channel Identity Boundary Notes

Customer channel identity is scoped and contextual.

Rules:

- token/link possession is not customer identity,
- raw channel id is not customer identity,
- `line_user_id` is not global identity,
- LINE is not the only future customer channel,
- customer access context must own identity resolution,
- customer-facing projection must not expose raw channel ids.

## SaaS / Entitlement / Usage Boundary Notes

Future runtime must not collapse SaaS entitlement, subscription status, usage
limits, and user permission.

Rules:

- organization entitlement decides whether a feature is available,
- user permission decides whether the user or actor can use it,
- usage tracking must not store unnecessary sensitive payload,
- entitlement denial must not leak resource existence,
- Task447 does not implement entitlement, usage, billing, seat, plan, or
  subscription runtime.

## Explicit Non-goals

Task447 does not:

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

Task447 verification should include:

- `git diff --check`,
- sensitive scan on this document,
- `npm run check`,
- `npm run admin:check`.

Task447 must not run:

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

Task447 completion reporting should include:

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
