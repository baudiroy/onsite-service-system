# Task452 - Customer-Facing Runtime Implementation Sequencing Closure / No Runtime Change

Task452 closes the Task451 customer-facing runtime implementation sequencing
review.

This task is documentation-only. It confirms that future sequencing has been
planned, while runtime, fixtures, tests, DB, provider sending, and AI/RAG work
remain unauthorized.

## Purpose

The purpose of Task452 is to close the future implementation sequencing review
from Task451 and preserve the current `NO-GO` status.

Task452 does not approve execution of the sequence.

## Non-Authorization Statement

Task452 is not runtime approval.

Task452 does not authorize:

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

## Relationship to Task429-Task451

Task429-Task450 established the customer-facing runtime branch readiness
package.

Task451 added the future implementation sequencing review:

- which step should happen first,
- what each step may include if authorized,
- what each step must exclude,
- what evidence is needed before and after each step,
- why "continue" or "go ahead" is not enough authorization.

Task452 closes that sequencing review without starting implementation.

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

## Task451 Sequencing Review Summary

Task451 defined a future sequence:

1. Authorization evidence confirmation.
2. Route/controller skeleton.
3. Resolver skeleton.
4. customerAccessContext skeleton.
5. Projection DTO / projection service skeleton.
6. Response envelope / generic safe-deny skeleton.
7. Chain integration.
8. Synthetic fixtures.
9. Minimal unit / contract tests.
10. Fixture/test sensitive scan.
11. API/browser/smoke tests, prohibited by default and separately authorized.
12. DB/repository/persistence, prohibited by default and separately authorized.
13. Provider sending, prohibited by default and separately authorized.
14. AI/RAG/vector DB, prohibited by default and separately authorized.

Each row in Task451 remains `Not authorized in Task451`.

## Current Status: NO-GO

Current status is `NO-GO`.

No future sequencing row may be executed until the user explicitly authorizes a
single next task with exact file and command scope.

## Why Implementation Remains Not Authorized

Implementation remains unauthorized because:

- the user has not selected a Task435 runtime decision option,
- the user has not selected a Task445 fixture/test authorization option,
- no exact runtime file scope has been approved,
- no exact fixture/test file scope has been approved,
- no exact command scope has been approved,
- DB/repository/provider/AI/RAG/vector DB boundaries remain prohibited by
  default,
- only documentation evidence exists.

## Accepted Future Safe Sequencing Order

If future authorization is granted, the accepted safe order is:

1. Authorization evidence confirmation.
2. Route/controller skeleton.
3. Resolver skeleton.
4. customerAccessContext skeleton.
5. Projection DTO / projection service skeleton.
6. Response envelope / generic safe-deny skeleton.
7. Chain integration.
8. Synthetic fixtures.
9. Minimal unit / contract tests.
10. Fixture/test sensitive scan.
11. API/browser/smoke tests only if separately authorized.
12. DB/repository/persistence only if separately authorized.
13. Provider sending only if separately authorized.
14. AI/RAG/vector DB only if separately authorized.

This order is planning guidance, not approval.

## Recommended Smallest Safe First Runtime Task If Explicitly Authorized

This is not authorization.

The smallest safe first runtime task, if explicitly authorized by the user,
should be:

```text
route/controller skeleton only
```

It must not include:

- real resolver logic,
- DB access,
- repository access,
- fixtures,
- tests,
- provider sending,
- AI/RAG/vector DB,
- raw customer data,
- mutation of official state.

After that task, PM review is required before the next single task can be
planned.

## Forbidden Sequencing Patterns Summary

Forbidden sequencing patterns:

- DB / repository first,
- provider sending first,
- AI / RAG / vector DB first,
- controller directly queries DB,
- resolver bypasses customerAccessContext,
- projection bypasses customerAccessContext,
- envelope bypasses projection,
- safe-deny uses different responses that leak existence,
- production data is used for fixtures,
- tests / smoke / browser tests are added without authorization,
- one task combines route/controller + resolver + DB + tests,
- "go ahead", "continue", or "start runtime" is treated as authorization.

## Evidence Requirements Before / After Runtime Tasks

Before each runtime task:

- exact task ID,
- exact file scope,
- exact command scope,
- explicit user authorization,
- forbidden scope,
- security/privacy boundary,
- organization isolation boundary,
- provider/AI/DB boundary,
- stop conditions.

After each runtime task:

- changed files,
- scope compliance,
- check results,
- sensitive scan result if applicable,
- runtime behavior summary,
- confirmation that DB/provider/AI/browser/smoke boundaries were not crossed
  unless explicitly authorized,
- PM review before the next step.

## Evidence Requirements Before Fixture/Test Tasks

Before fixture/test tasks:

- Task445-style authorization,
- exact fixture/test file scope,
- exact command scope,
- synthetic-only confirmation,
- no production data,
- no real token/secret values,
- no full phone/address values,
- no raw channel ids,
- no raw provider payloads,
- no DB/repository access,
- no API/browser/smoke tests unless separately authorized,
- no provider sending,
- no AI/RAG/vector DB.

## What Remains Unimplemented

The following remain unimplemented:

- runtime chain,
- route/controller,
- resolver,
- customerAccessContext,
- projection,
- response envelope / safe-deny,
- fixtures,
- tests,
- API/browser/smoke tests,
- DB/repository/persistence,
- provider sending,
- AI/RAG/vector DB.

## Next PM Decision Options

PM may next choose:

1. Ask the user using the Task435 runtime decision prompt.
2. Ask the user using the Task445 fixture/test authorization prompt.
3. Pause the customer-facing runtime branch.
4. Prepare PM continuation handoff if context is getting long.

Even if the user later authorizes a direction, that authorization may only start
the next named single minimal task. It does not enable the whole runtime branch,
fixtures branch, or tests branch.

## Security / Privacy / Organization Isolation Boundaries

Future work must preserve:

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

Future work must preserve:

- token/link is not customer identity,
- raw channel id is not customer identity,
- `line_user_id` is not global identity,
- identity must be scoped by organization and channel,
- customerAccessContext owns the access decision,
- projection does not expose raw channel ids.

## SaaS / Entitlement / Usage Boundary Notes

Future work must preserve:

- entitlement is not permission,
- subscription/entitlement denial must not leak resource existence,
- usage tracking must not store unnecessary sensitive payload,
- customer-facing runtime does not imply billing/subscription/seat/usage
  runtime,
- Task452 does not implement SaaS entitlement or usage runtime.

## Explicit Non-goals

Task452 does not:

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

Task452 verification should include:

- `git diff --check`,
- sensitive scan on this document,
- `npm run check`,
- `npm run admin:check`.

Task452 must not run:

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

Task452 completion reporting should include:

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
