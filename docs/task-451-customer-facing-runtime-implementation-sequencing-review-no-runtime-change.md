# Task451 - Customer-Facing Runtime Implementation Sequencing Review / No Runtime Change

Task451 defines a future implementation sequence for the customer-facing
runtime branch if the user later provides explicit authorization.

This task is documentation-only. It does not grant approval to implement
runtime code, fixtures, tests, API routes, database access, provider sending, or
AI/RAG work.

## Purpose

The purpose of Task451 is to define how a future customer-facing local-only
runtime spike should be sequenced and split into small, reviewable, fail-closed
tasks if explicit user authorization is later obtained.

This is a sequencing review, not permission to execute the sequence.

## Non-Authorization Statement

Task451 is not runtime approval.

Task451 does not authorize:

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

Current status remains `NO-GO` unless the user explicitly authorizes the next
single task through the Task435 runtime decision prompt, Task445 fixture/test
authorization prompt, or an equally explicit scoped authorization packet.

## Relationship to Task429-Task450

Task429-Task450 created the customer-facing runtime readiness package:

- authorization and decision gates,
- skeleton implementation specs,
- fixture/test readiness,
- runtime risk register,
- mitigation traceability,
- branch-level readiness closure.

Task451 adds a future sequencing plan. It does not replace the authorization
gate.

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

Future work must continue to enforce:

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

## Implementation Sequencing Method

Future implementation should proceed one small task at a time.

Each step must have:

- explicit user authorization,
- exact file scope,
- exact command scope,
- clear forbidden scope,
- evidence required before starting,
- evidence required after completion,
- stop conditions,
- PM review before the next step.

No step should combine route/controller, resolver, DB, fixtures, tests, and
provider behavior in one task.

## Future Implementation Sequencing Table

| Step ID | Purpose | Required prerequisite | Required explicit authorization | Allowed scope if authorized | Forbidden scope | Evidence required before starting | Evidence required after completion | Stop condition | Related prior task references | Current status now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEQ-001 | Confirm authorization evidence. | Task450 closure accepted. | User selects exact runtime option and file/command scope. | Documentation of authorization only. | Runtime/code/test/DB/provider/AI. | Task435-style approval packet. | Recorded authorization evidence. | Approval ambiguous. | Task429-436, Task450 | Not authorized in Task451 |
| SEQ-002 | Add route/controller skeleton. | SEQ-001. | Specific route/controller skeleton task. | Minimal route/controller stub that delegates to resolver or safe placeholder. | Resolver logic, DB, repository, fixtures, tests, provider, AI/RAG. | Exact file scope and no-DB/no-provider/no-AI statement. | Diff review and check results. | Controller directly queries DB or emits raw data. | Task437, Task443 | Not authorized in Task451 |
| SEQ-003 | Add resolver skeleton. | SEQ-002 accepted by PM. | Specific resolver skeleton task. | Minimal resolver interface and fail-closed behavior. | DB/repository, projection details, provider, AI/RAG. | Resolver boundary approval. | Diff review and no-bypass evidence. | Resolver bypasses customerAccessContext. | Task438, Task443 | Not authorized in Task451 |
| SEQ-004 | Add customerAccessContext skeleton. | SEQ-003 accepted by PM. | Specific access-context skeleton task. | Interface for organization/channel/token/link context and fail-closed output. | Persistence lookup, DB, raw identity trust, provider, AI/RAG. | Identity boundary approval. | Diff review and boundary summary. | Token/link or raw channel id becomes identity. | Task439, Task443 | Not authorized in Task451 |
| SEQ-005 | Add projection DTO / service skeleton. | SEQ-004 accepted by PM. | Specific projection skeleton task. | Allow-list DTO shell and forbidden-field guard shape. | Raw object spreading, DB, provider, AI/RAG. | Projection field-map approval. | Diff review and forbidden-field summary. | Raw internal data can pass through. | Task440, Task443 | Not authorized in Task451 |
| SEQ-006 | Add response envelope / generic safe-deny skeleton. | SEQ-005 accepted by PM. | Specific envelope/safe-deny skeleton task. | Generic response wrapper and safe-deny shape. | Resource-specific deny reasons, DB, provider, AI/RAG. | Safe-deny contract approval. | Diff review and equivalence summary. | Deny response leaks existence. | Task441, Task443 | Not authorized in Task451 |
| SEQ-007 | Chain integration review. | SEQ-002 through SEQ-006 accepted. | Specific integration review task. | Review-only or minimal wiring if explicitly allowed. | DB/repository, provider, AI/RAG, broad refactor. | All skeleton scopes accepted. | No-bypass evidence. | Any layer bypass appears. | Task442-443 | Not authorized in Task451 |
| SEQ-008 | Add synthetic fixtures. | Fixture authorization from Task445. | Explicit fixture-only or fixture+test approval. | Named synthetic fixture files only. | Production data, secrets, DB, provider, AI/RAG. | Synthetic-only packet. | Sensitive fixture scan. | Fixture data looks real or sensitive. | Task444-446 | Not authorized in Task451 |
| SEQ-009 | Add minimal unit / contract tests. | Test authorization from Task445. | Explicit test approval and exact command scope. | Named unit/contract tests only. | API/browser/smoke, DB/repository, provider, AI/RAG. | Test-scope packet. | Test result and sensitive scan. | Test touches forbidden runtime. | Task444-446 | Not authorized in Task451 |
| SEQ-010 | Fixture/test sensitive scan. | SEQ-008 or SEQ-009. | Explicit scan command approval if beyond docs scan. | Named scan command only. | New scripts/CI unless authorized. | Exact scan command. | Scan result. | Actual sensitive data found. | Task444-448 | Not authorized in Task451 |
| SEQ-011 | API / browser / smoke tests. | Unit/contract branch accepted. | Separate explicit API/browser/smoke approval. | Named API/browser/smoke task only. | DB/shared/prod/provider/AI unless separately approved. | Exact command and environment boundary. | Safe test summary. | Command targets shared/prod or sends provider. | Task447-450 | Not authorized in Task451 |
| SEQ-012 | DB / repository / persistence. | Runtime skeleton accepted and separate DB plan. | Separate explicit persistence approval. | Named repository/persistence task only. | DDL/migration/provider/AI unless separately approved. | DB boundary and local-only approval. | Code review and safe evidence. | DB target unclear or shared/prod. | Task447-450 | Not authorized in Task451 |
| SEQ-013 | Provider sending. | Access/runtime read path is stable and separate product approval exists. | Separate explicit provider approval. | Named provider task only. | Silent sends, broad notifications, AI/RAG. | Provider sandbox/disable evidence. | No-send or controlled-send evidence. | Any unapproved outbound action. | Task447-450 | Not authorized in Task451 |
| SEQ-014 | AI / RAG / vector DB. | Permission-aware RAG plan and separate AI approval. | Separate explicit AI/RAG approval. | Named AI/RAG task only. | Raw DB/vector access, cross-tenant retrieval, provider sends. | Retrieval policy and data minimization approval. | Redaction/permission evidence. | Any unfiltered retrieval or sensitive prompt. | Guardrails, Task447-450 | Not authorized in Task451 |

## Recommended Smallest Safe First Runtime Task If Explicitly Authorized

This section is not authorization. Recommended order does not mean execution.

If the user later explicitly authorizes Option B / local-only runtime skeleton
work, the smallest safe first runtime task should be:

```text
route/controller skeleton only
```

That task must not include:

- real resolver logic,
- DB access,
- repository access,
- fixtures,
- tests,
- provider sending,
- AI/RAG/vector DB,
- raw customer data,
- mutation of official state.

Even after that first task, PM must review the result before giving the next
single task. A completed first task does not authorize the next layer by
default.

## Forbidden / Bad Sequencing Patterns

Do not sequence work this way:

- implement DB / repository first,
- implement provider sending first,
- implement AI / RAG / vector DB first,
- let controller directly query DB,
- let resolver bypass customerAccessContext,
- let projection bypass customerAccessContext,
- let envelope bypass projection,
- use different safe-deny responses that leak resource existence,
- use production data to create fixtures,
- add tests / smoke / browser tests without authorization,
- combine route/controller + resolver + DB + tests in one task,
- treat "go ahead", "continue", or "start runtime" as sufficient
  authorization.

## Evidence Required Before Each Step

Before each future step, PM/Codex must have:

- exact step ID,
- exact file scope,
- exact command scope,
- explicit user authorization,
- forbidden-scope acknowledgement,
- sensitive data boundary,
- organization isolation boundary,
- provider/AI/DB boundary,
- stop conditions.

## Evidence Required After Each Step

After each future step, PM/Codex must report:

- changed files,
- whether scope stayed within authorization,
- whether runtime behavior changed,
- whether DB/provider/AI/browser/smoke was touched,
- sensitive scan result when applicable,
- check/test result only if the command was authorized,
- PM review status,
- next step remains unauthorized until separately approved.

## NO-GO / CONDITIONAL-GO / GO Impact

Current status remains `NO-GO`.

`CONDITIONAL-GO` may only authorize one named step with exact file and command
scope.

`GO` for one step does not authorize:

- the full runtime branch,
- fixtures,
- tests,
- API/browser/smoke coverage,
- DB/repository,
- provider sending,
- AI/RAG/vector DB,
- shared/prod/Zeabur runtime access.

## Security / Privacy / Organization Isolation Boundaries

Future sequencing must preserve:

- organization isolation,
- customer-visible data policy,
- internal data policy,
- allow-list-first projection,
- sensitive data redaction,
- generic safe-deny,
- no resource existence leakage,
- no production data,
- no raw internal payloads,
- no shared/prod/Zeabur access.

## Customer Channel Identity Boundary Notes

Future sequencing must preserve:

- token/link is not customer identity,
- raw channel id is not customer identity,
- `line_user_id` is not global identity,
- identity must be scoped by organization and channel,
- customerAccessContext owns the access decision,
- projection does not expose raw channel ids.

## SaaS / Entitlement / Usage Boundary Notes

Future sequencing must preserve:

- entitlement is not permission,
- subscription/entitlement denial must not leak resource existence,
- usage tracking must not store unnecessary sensitive payload,
- customer-facing runtime does not imply billing/subscription/seat/usage
  runtime,
- Task451 does not implement SaaS entitlement or usage runtime.

## Explicit Non-goals

Task451 does not:

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

Task451 verification should include:

- `git diff --check`,
- sensitive scan on this document,
- `npm run check`,
- `npm run admin:check`.

Task451 must not run:

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

Task451 completion reporting should include:

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
