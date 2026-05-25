# Task435 - Customer-Facing Runtime Spike User Decision Packet / No Runtime Change

Task435 prepares a user decision packet that PM can use later to ask whether
the user wants to authorize a customer-facing local-only runtime spike.

This task is documentation-only. It does not collect approval, does not
authorize runtime work, does not start a local-only runtime spike, and does not
add code, tests, fixtures, DB changes, API changes, provider sending, or
AI/RAG work.

## Purpose

The purpose is to translate the Task429-Task434 authorization readiness
framework into a neutral decision packet for a future PM/user conversation.

Task435 helps PM ask a clear question later. It is not the answer to that
question.

## Non-Authorization Statement

Task435 is not runtime approval.

Task435 does not authorize:

- backend `src/` changes,
- route/controller implementation,
- resolver implementation,
- customerAccessContext implementation,
- projection DTO / projection service implementation,
- response envelope / generic safe-deny implementation,
- repository implementation,
- API implementation,
- tests,
- fixtures,
- smoke/browser/API tests,
- scan script / CI,
- DB access,
- DDL,
- migration,
- Migration020 dry-run/apply,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task435 only creates a future PM decision packet.

## Relationship to Task429-Task434

Task429-Task434 created the authorization readiness framework:

- Task429: authorization question template,
- Task430: runtime spike task breakdown,
- Task431: future file touch plan,
- Task432: preflight readiness gate,
- Task433: authorization evidence record template,
- Task434: authorization readiness closure.

Task435 packages those artifacts into user-facing decision options. It still
does not approve runtime.

## Current Status: NO-GO

Current status remains `NO-GO`.

Reasons:

- Task429-Task434 are complete, but they are readiness artifacts only.
- No runtime authorization has been obtained.
- No local-only runtime spike has been approved.
- No single next runtime task has been approved.
- No backend file scope has been approved.
- No tests, fixtures, API smoke, browser smoke, DB, migration, provider, AI, or
  RAG work has been approved.

## Mandatory Future Customer-Facing Flow

Any future authorized task must preserve:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Rules:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not bypass customerAccessContext.
- Envelope must not bypass projection.
- No layer may output raw internal data.
- No layer may mutate Case, Appointment, Field Service Report, complaint,
  billing, settlement, identity, token, link, or audit state.
- No provider sending is allowed.
- No AI provider / RAG / vector DB is allowed.

## User Decision Options

### Option A - Continue Docs-only Planning

What it means:

- Continue design, QA, traceability, or readiness documentation only.
- No runtime implementation.

What it does not authorize:

- backend `src/`,
- API,
- tests or fixtures,
- DB / migration,
- provider sending,
- AI/RAG/vector DB.

Required explicit user statement:

```text
I choose Option A. Continue docs-only planning only.
```

Next single task if selected:

- PM may propose another docs-only planning or closure task.

### Option B - Authorize One Local-only Route/Controller Skeleton Task

What it means:

- Authorize exactly one local-only route/controller skeleton task.
- The task must name allowed files and commands.
- It must preserve the mandatory flow and must not implement provider, DB, AI,
  RAG, mutation, or data exposure behavior.

What it does not authorize:

- resolver implementation unless explicitly included,
- customerAccessContext implementation unless explicitly included,
- projection service implementation unless explicitly included,
- tests / fixtures / smoke unless separately authorized,
- DB / migration,
- provider sending,
- AI/RAG/vector DB,
- shared/prod/Zeabur access,
- production data.

Required explicit user statement:

```text
I choose Option B. I authorize only one local-only route/controller skeleton task.
Allowed files: [fill in exact paths].
Allowed commands: [fill in exact commands].
No DB, no migration, no provider sending, no AI/RAG/vector DB, no production data, no shared/prod/Zeabur.
```

Next single task if selected:

- Implement the named route/controller skeleton only, if all required
  confirmations are complete.

### Option C - Authorize One Resolver Skeleton Task

What it means:

- Authorize exactly one local-only resolver skeleton task.
- This usually requires a route/controller skeleton to already exist, unless PM
  and the user explicitly choose to adjust the order.

What it does not authorize:

- route/controller skeleton unless explicitly included,
- customerAccessContext implementation unless explicitly included,
- projection implementation unless explicitly included,
- tests / fixtures / smoke unless separately authorized,
- DB / migration,
- provider sending,
- AI/RAG/vector DB,
- shared/prod/Zeabur access,
- production data.

Required explicit user statement:

```text
I choose Option C. I authorize only one local-only resolver skeleton task.
Allowed files: [fill in exact paths].
Allowed commands: [fill in exact commands].
The ordering is acceptable because [route/controller exists or order is intentionally adjusted].
No DB, no migration, no provider sending, no AI/RAG/vector DB, no production data, no shared/prod/Zeabur.
```

Next single task if selected:

- Implement the named resolver skeleton only, if all required confirmations are
  complete.

### Option D - Pause Customer-facing Runtime Spike and Choose Another Docs-only Branch

What it means:

- Keep customer-facing runtime spike in NO-GO.
- Continue another docs-only product, security, PM handoff, or readiness branch.

What it does not authorize:

- runtime implementation,
- backend `src/`,
- tests or fixtures,
- DB / migration,
- provider sending,
- AI/RAG/vector DB.

Required explicit user statement:

```text
I choose Option D. Pause customer-facing runtime spike and continue another docs-only branch.
```

Next single task if selected:

- PM may propose another docs-only branch task.

### Option E - Explicitly Decline Runtime and Keep NO-GO

What it means:

- Runtime remains explicitly declined.
- PM and Codex should not ask to implement customer-facing runtime unless the
  user reopens the branch later.

What it does not authorize:

- any runtime implementation,
- backend `src/`,
- tests or fixtures,
- DB / migration,
- provider sending,
- AI/RAG/vector DB.

Required explicit user statement:

```text
I choose Option E. Runtime is declined. Keep customer-facing runtime spike NO-GO.
```

Next single task if selected:

- No runtime task. PM may propose non-runtime work if the user wants to continue.

## Option-by-Option Scope Table

| Option | Meaning | Next task | Runtime allowed? | DB/provider/AI allowed? |
| --- | --- | --- | --- | --- |
| A | Continue docs-only planning | Docs-only task | No | No |
| B | One route/controller skeleton | Named single skeleton task | Only if fully scoped | No |
| C | One resolver skeleton | Named single skeleton task | Only if fully scoped | No |
| D | Pause runtime and choose another docs-only branch | Docs-only task | No | No |
| E | Decline runtime | No runtime task | No | No |

## Statements That Are Not Authorization

The following must not be treated as runtime authorization:

- "continue",
- "next task",
- "go ahead",
- "可以做",
- "照 PM 規劃做",
- "繼續開發",
- "開始 runtime",
- any vague statement that does not answer the scope items one by one.

If a statement does not identify the option, allowed paths, allowed commands,
local-only scope, environment, exclusions, and still-prohibited items, the gate
remains `NO-GO`.

## Required Confirmations for Any Runtime Option

Before Option B or C can become `CONDITIONAL-GO` or `GO`, the user must confirm:

- local-only only,
- disposable local/test environment exists,
- shared / prod / Zeabur excluded,
- no production data,
- backend `src/` change allowed only for the named task,
- allowed file path scope,
- allowed commands,
- no DB / migration,
- no provider sending,
- no AI / RAG / vector DB,
- no tests / fixtures / smoke unless separately authorized,
- no raw token, secret, channel id, complete phone, complete address, raw
  provider payload, or production data,
- organization isolation and customer channel identity boundaries remain
  fail-closed.

## PM Decision Prompt Draft

PM may paste the following prompt to the user in a future conversation:

```text
目前 customer-facing local-only runtime spike 仍是 NO-GO。
Task429-435 只完成授權前準備文件，尚未取得任何 runtime 授權。

請明確選擇一個選項：

Option A：繼續 docs-only planning。
Option B：授權一個 local-only route/controller skeleton task。
Option C：授權一個 local-only resolver skeleton task，但須確認 route/controller 已存在或明確調整順序。
Option D：暫停 customer-facing runtime spike，改做其他 docs-only branch。
Option E：明確拒絕 runtime，維持 NO-GO。

若選 Option B 或 C，請逐項確認：
1. 僅限 local-only。
2. 使用 disposable local/test environment。
3. shared / prod / Zeabur 全部排除。
4. 不使用 production data。
5. 只允許你列出的單一 task。
6. 只允許你列出的檔案路徑。
7. 只允許你列出的指令。
8. 不授權 DB / DDL / migration / Migration020 dry-run/apply。
9. 不授權 provider sending / LINE / SMS / Email / App / survey。
10. 不授權 AI provider / RAG / vector DB。
11. 不授權 tests / fixtures / smoke，除非你另行明確列出。
12. 不處理或輸出 token / secret / DATABASE_URL / raw channel id / 完整手機 / 完整地址 / raw provider payload / production data。

請直接回覆 Option A / B / C / D / E，以及必要 scope。
```

This prompt is only a draft. It does not create authorization by itself.

## Still-Prohibited Items

The following remain prohibited unless separately and explicitly approved:

- DB / DDL / migration / Migration020 dry-run/apply,
- shared / prod / Zeabur runtime access,
- production data,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- secrets / tokens / actual `DATABASE_URL`,
- raw channel ids,
- complete phone numbers,
- complete addresses,
- raw provider payloads,
- Inventory docs changes,
- mutation of Case / Appointment / Field Service Report / complaint / billing /
  settlement / identity / token / link / audit state from the customer-facing
  chain.

## Security / Privacy / Organization Isolation Boundaries

Future runtime authorization must preserve:

- organization scope on every lookup,
- customer channel identity scoped by organization and channel,
- no global `line_user_id` identity assumption,
- no cross-tenant lookup,
- no cross-channel lookup,
- generic safe-deny for missing, unauthorized, expired, or mismatched access,
- no raw internal data output,
- no sensitive data in logs or responses.

Customer-facing projection work must not expose internal-only fields, audit log
details, billing internal data, settlement internal data, AI raw payload, or
provider payloads.

## SaaS / Entitlement / Usage Boundary Notes

Future runtime authorization must preserve:

- permission and entitlement as separate concepts,
- organization-level entitlement checks where applicable,
- user permission checks where applicable,
- usage tracking as future observability, not access permission,
- plan and subscription status as future gates, not a reason to weaken data
  minimization or safe-deny behavior.

Enterprise, AI add-on, usage billing, seat billing, and SSO considerations must
not weaken organization isolation, sensitive data redaction, or customer-visible
data policy.

## Explicit Non-goals

Task435 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
- add or modify tests / fixtures / smoke / browser tests,
- add scan script / CI,
- modify `package.json`,
- modify localization files / message catalogs,
- add or modify DB schema / migration / index,
- execute DB / DDL / psql / `npm run db:migrate` / Migration020 dry-run/apply,
- trigger provider sending / LINE / SMS / Email / App / survey,
- call AI provider / RAG / vector DB,
- access shared / prod / Zeabur runtime,
- process or output token / secret / actual `DATABASE_URL` / raw channel id /
  complete phone / complete address / production data,
- modify Inventory docs,
- approve runtime.

## Verification Plan

For Task435, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, or migration commands for Task435.

## Completion Report Checklist

Codex completion report must include:

- modified files,
- whether the task was docs-only,
- implementation summary,
- not implemented items,
- verification results,
- whether `docs/PROJECT_GUARDRAILS.md` was violated,
- whether any table / API / permission / audit log / smoke test changed,
- whether sensitive data / token / secret / personal data / LINE logic was
  touched,
- whether customer channel identity / organization isolation / SaaS-ready /
  entitlement / seat billing / usage billing / AI add-on / Enterprise SSO was
  affected,
- future tasks listed only, without expanding implementation scope.
