# Task445 - Customer-Facing Fixture/Test Implementation Authorization Spec / No Runtime Change

Task445 defines the future authorization conditions required before any
customer-facing synthetic fixture or minimal test implementation may begin.

This task is documentation-only. It does not authorize runtime work, does not
create fixtures, does not create tests, does not run tests beyond verification
commands, and does not add code, DB changes, API changes, provider sending, or
AI/RAG work.

## Purpose

The purpose is to define how PM/Codex must obtain explicit user authorization
before moving from the Task444 fixture/test spec into any fixture or test
implementation.

Task445 answers:

- which authorization questions PM must ask,
- which outcomes are possible,
- what each outcome allows and forbids,
- what evidence must be recorded,
- when Codex must stop.

## Non-Authorization Statement

Task445 is not runtime approval.

Task445 does not authorize:

- backend `src/` changes,
- admin `src/` changes,
- new tests,
- modified tests,
- new fixtures,
- modified fixtures,
- test execution,
- API tests,
- browser tests,
- smoke tests,
- fixture generation,
- test generation,
- DB access,
- repository access,
- DDL,
- migration,
- provider sending,
- LINE/SMS/Email/App/survey sending,
- AI provider / RAG / vector DB,
- shared/prod/Zeabur runtime access.

Task445 only defines future fixture/test implementation authorization
conditions.

## Relationship to Task444

Task444 defined safe future fixture/test design principles:

- synthetic-only fixtures,
- no production data,
- no real token/secret,
- no full phone/address,
- no raw channel id,
- no raw provider payload,
- pure unit / contract-level tests only unless separately authorized,
- no DB/network/provider/AI/browser/API/smoke unless separately authorized.

Task445 defines how to ask for permission before implementing any of that.

## Mandatory Future Customer-Facing Flow

Any future authorized fixture/test work must preserve:

```text
request
-> route/controller
-> resolver
-> customerAccessContext
-> projection DTO / projection service
-> response envelope or generic safe-deny
```

Future fixture/test authorization must not weaken:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not bypass customerAccessContext.
- Envelope must not bypass projection.
- Safe-deny must not leak resource existence.
- Response equivalence must be preserved.
- Projection must be allow-list first.
- Unknown fields must default to deny.
- Forbidden fields must default to deny.
- Token/link must not be treated as customer identity.
- `line_user_id` must not be treated as global identity.
- Raw internal data must not be output.
- Case, Appointment, Field Service Report, complaint, billing, settlement,
  identity, token, link, or audit state must not be mutated.
- DB must not be queried.
- Provider sending must not be triggered.
- AI provider / RAG / vector DB must not be called.

## Required Explicit Authorization Questions

Before future fixture/test implementation, PM must ask and record:

- Does the user authorize adding synthetic fixtures?
- Does the user authorize adding minimal unit/contract tests?
- Does the user authorize modifying existing tests?
- Does the user authorize running a specific test command?
- Are API/browser/smoke tests explicitly prohibited?
- Is DB/repository access explicitly prohibited?
- Is provider sending explicitly prohibited?
- Is AI/RAG/vector DB explicitly prohibited?
- Are fixtures confirmed synthetic-only?
- Is production data explicitly prohibited?
- Are real token/secret values explicitly prohibited?
- Are full phone/address values explicitly prohibited?
- Are raw channel ids and raw provider payloads explicitly prohibited?
- Which exact files may be created or modified?
- Which exact commands may be run?
- Which files and commands remain forbidden?

If any answer is unclear, the outcome is `NO-GO`.

## Authorization Outcome Types

### NO-GO

No fixture or test implementation may begin.

Use when:

- authorization is missing or ambiguous,
- allowed files are not named,
- allowed commands are not named,
- production data is not clearly prohibited,
- DB/provider/AI/browser/API/smoke boundaries are unclear,
- sensitive fixture policy is unclear.

### FIXTURE-ONLY CONDITIONAL-GO

Only synthetic fixture implementation may begin.

This does not authorize:

- tests,
- test execution,
- API/browser/smoke tests,
- DB/repository access,
- provider sending,
- AI/RAG/vector DB,
- production data.

### TEST-ONLY CONDITIONAL-GO

Only minimal unit/contract test implementation may begin.

This does not authorize:

- fixture creation unless separately approved,
- API/browser/smoke tests,
- DB/repository access,
- provider sending,
- AI/RAG/vector DB,
- production data.

### FIXTURE-AND-TEST CONDITIONAL-GO

Only the named synthetic fixtures and named minimal unit/contract tests may be
implemented.

This does not authorize:

- API/browser/smoke tests,
- DB/repository access,
- provider sending,
- AI/RAG/vector DB,
- production data,
- unrelated test rewrites.

## Outcome Scope and Limits

Every conditional go applies only to the next named single task and exact file
scope.

No outcome authorizes the whole customer-facing runtime branch.

No outcome authorizes DB, provider sending, AI/RAG/vector DB, shared/prod/Zeabur
access, or production data by implication.

## PM Fixture/Test Authorization Prompt Draft

PM may paste the following prompt to the user in a future conversation:

```text
目前 customer-facing fixture/test branch 仍是 NO-GO。
Task444-445 只定義 fixture/test 設計與授權條件，尚未授權建立 fixtures 或 tests。

請明確選擇一個選項：

A：不授權 fixtures/tests，繼續 docs-only。
B：只授權新增 synthetic fixtures，不授權 tests。
C：只授權新增 minimal unit/contract tests，不授權 fixtures。
D：授權 synthetic fixtures + minimal unit/contract tests。
E：暫停 customer-facing fixture/test branch。

若選 B / C / D，請逐項確認：
1. 只使用 synthetic data。
2. 不使用 production data。
3. 不使用 real token / secret / DATABASE_URL。
4. 不使用完整手機 / 完整地址。
5. 不使用 raw channel id / raw provider payload。
6. 不執行 DB / repository access。
7. 不執行 API / browser / smoke tests，除非另行明確授權。
8. 不觸發 provider sending / LINE / SMS / Email / App / survey。
9. 不呼叫 AI provider / RAG / vector DB。
10. 請列出允許新增或修改的確切檔案。
11. 請列出允許執行的確切指令。

請直接回覆 A / B / C / D / E，以及必要 scope。
```

This prompt is only a draft. It does not create authorization by itself.

## Future Fixture/Test Authorization Matrix

| Candidate action | Requires explicit authorization | Default status now | Still prohibited unless separately approved | Evidence required |
| --- | --- | --- | --- | --- |
| Add synthetic fixtures | Yes | Not authorized in Task445 | Production data, real secrets, raw ids | Exact fixture paths and synthetic policy |
| Modify existing fixtures | Yes | Not authorized in Task445 | Broad fixture rewrites | Exact fixture paths and reason |
| Add minimal unit/contract tests | Yes | Not authorized in Task445 | DB/network/provider/AI calls | Exact test paths and command |
| Modify existing tests | Yes | Not authorized in Task445 | Unrelated test changes | Exact test paths and reason |
| Run test command | Yes | Not authorized in Task445 | Broad/unknown commands | Exact command |
| Run API tests | Yes | Not authorized in Task445 | API tests without separate approval | Exact API test command |
| Run browser tests | Yes | Not authorized in Task445 | Browser tests without separate approval | Exact browser command |
| Run smoke tests | Yes | Not authorized in Task445 | Smoke tests without separate approval | Exact smoke command |
| Use DB/repository | Yes | Not authorized in Task445 | DB/repository by default | Separate DB authorization |
| Provider sending | Yes | Not authorized in Task445 | Any sending by default | Separate provider authorization |
| AI/RAG/vector DB | Yes | Not authorized in Task445 | Any model/retrieval call by default | Separate AI/RAG authorization |

## Required Evidence Record Fields

Before future implementation, the evidence record must include:

- selected option A / B / C / D / E,
- user statement summary,
- conversation reference,
- exact allowed fixture files,
- exact allowed test files,
- exact allowed commands,
- forbidden files,
- forbidden commands,
- synthetic-only confirmation,
- no-production-data confirmation,
- no-real-token/secret confirmation,
- no-full-phone/address confirmation,
- no-raw-channel-id/provider-payload confirmation,
- no DB/repository confirmation,
- no provider sending confirmation,
- no AI/RAG/vector DB confirmation,
- test type confirmation,
- sensitive scan requirement,
- completion report requirements.

## Default Prohibited Items

The following remain prohibited by default:

- production data,
- real token,
- real secret,
- actual `DATABASE_URL`,
- full phone number,
- full address,
- raw channel id,
- raw provider payload,
- DB access,
- repository access,
- API/browser/smoke tests,
- provider sending,
- AI provider,
- RAG,
- vector DB,
- shared/prod/Zeabur runtime,
- fixture/test changes outside the exact approved paths.

## Stop Conditions

Codex must stop before any future fixture/test implementation if:

- fixture/test implementation is not explicitly authorized,
- the selected option is missing or ambiguous,
- allowed files are not named,
- allowed commands are not named,
- a fixture would require production data,
- a fixture would require real token/secret/customer/channel data,
- a test would require DB access,
- a test would require network access,
- a test would require provider sending,
- a test would require AI provider / RAG / vector DB,
- a test would require browser/API/smoke execution without separate approval,
- sensitive scan finds actual secrets or customer data,
- organization isolation cannot be represented safely,
- customer channel identity scoping cannot be represented safely,
- response equivalence cannot be asserted safely.

## Security / Privacy / Organization Isolation Boundaries

Future fixture/test authorization must preserve:

- organization scope,
- scoped customer channel identity,
- no global `line_user_id` identity assumption,
- no cross-tenant data reuse,
- no cross-channel data reuse,
- generic safe-deny,
- no raw internal data output,
- no sensitive data in test logs or completion reports.

## Customer Channel Identity Boundary Notes

Future fixtures/tests may only use sanitized, synthetic, scoped placeholders.

Rules:

- Token/link is not customer identity.
- `line_user_id` is not global identity.
- Channel identity must be scoped by organization and channel.
- Phone/address must not be used as silent identity recovery.
- Deny-by-default applies when identity context is missing or ambiguous.

## SaaS / Entitlement / Usage Boundary Notes

Future fixtures/tests should preserve:

- permission and entitlement as separate concepts,
- entitlement denial as a generic safe-deny compatible scenario,
- usage tracking as future observability, not access permission,
- plan/subscription status as a possible upstream gate, not a reason to weaken
  data minimization or safe-deny behavior.

## Explicit Non-goals

Task445 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
- add or modify customerAccessContext / projection / response envelope /
  safe-deny runtime,
- add or modify tests / fixtures / smoke / browser tests,
- run tests,
- generate fixtures,
- generate tests,
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
- approve runtime,
- approve fixtures,
- approve tests.

## Verification Plan

For Task445, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, fixture generation, test generation, test
command, or migration commands for Task445.

## Completion Report Checklist

Codex completion report must include:

- modified files,
- whether the task was docs-only,
- implementation summary,
- not implemented items,
- verification results,
- whether `docs/PROJECT_GUARDRAILS.md` was violated,
- whether any table / API / permission / audit log / smoke test changed,
- whether any tests / fixtures changed,
- whether tests were executed,
- whether sensitive data / token / secret / personal data / LINE logic was
  touched,
- whether customer channel identity / organization isolation / SaaS-ready /
  entitlement / seat billing / usage billing / AI add-on / Enterprise SSO was
  affected,
- future tasks listed only, without expanding implementation scope.
