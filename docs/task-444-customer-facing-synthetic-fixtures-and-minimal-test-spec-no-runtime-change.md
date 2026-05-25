# Task444 - Customer-Facing Synthetic Fixtures and Minimal Test Spec / No Runtime Change

Task444 defines a future specification for synthetic fixtures and minimal
unit/contract tests for the customer-facing skeleton chain.

This task is documentation-only. It does not authorize runtime work, does not
create fixtures, does not create tests, does not run tests beyond verification
commands, and does not add code, DB changes, API changes, provider sending, or
AI/RAG work.

## Purpose

The purpose is to define how future fixtures and minimal tests should be
designed if the customer-facing skeleton chain is later authorized.

Task444 answers:

- what future fixtures may represent,
- what future tests should prove,
- what data is forbidden in fixtures and test output,
- what evidence must appear in the future completion report,
- when Codex must stop instead of implementing.

## Non-Authorization Statement

Task444 is not runtime approval.

Task444 does not authorize:

- backend `src/` changes,
- admin `src/` changes,
- new tests,
- new fixtures,
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

Task444 only defines future synthetic fixture and minimal test design
boundaries.

## Relationship to Task437-Task443

Task437-Task442 defined future implementation specs for:

- route/controller,
- resolver,
- customerAccessContext,
- projection DTO / projection service,
- response envelope / generic safe-deny,
- skeleton chain integration.

Task443 closed that skeleton implementation spec mini-branch and kept current
status at `NO-GO`.

Task444 defines how future fixtures and minimal tests should be designed if the
skeleton chain is later authorized. It still does not approve runtime, fixtures,
or tests.

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

Future tests and fixtures must verify:

- Controller must not bypass resolver.
- Resolver must not bypass customerAccessContext.
- Projection must not bypass customerAccessContext.
- Envelope must not bypass projection.
- Safe-deny must not leak resource existence.
- Response equivalence is preserved.
- Projection is allow-list first.
- Unknown fields default to deny.
- Forbidden fields default to deny.
- Token/link is not customer identity.
- `line_user_id` is not global identity.
- Raw internal data is never output.
- Case, Appointment, Field Service Report, complaint, billing, settlement,
  identity, token, link, or audit state is not mutated.
- DB is not queried.
- Provider sending is not triggered.
- AI provider / RAG / vector DB is not called.

## Synthetic Fixture Design Principles

Future fixtures must be synthetic only.

Rules:

- No production data.
- No real token.
- No real secret.
- No actual `DATABASE_URL`.
- No real phone number.
- No real address.
- No raw channel id.
- No raw provider payload.
- No real customer data.
- No cross-organization data copied from any runtime.
- No full internal payloads.
- No fixture value that looks like a usable credential or customer identifier.

Synthetic fixtures should be small, explicit, and purpose-built for boundary
checks.

## Minimal Test Design Principles

Future tests should be pure unit / contract-level tests unless separately
authorized.

Rules:

- No DB.
- No network.
- No provider sending.
- No AI provider.
- No RAG.
- No vector DB.
- No browser test.
- No API test.
- No smoke test.
- No shared/prod/Zeabur access.
- No mutation of real Case / Appointment / Field Service Report data.

Any fixture/test implementation requires separate explicit authorization.

## Suggested Future Fixture Categories

Possible future synthetic fixture categories:

- valid same-organization placeholder,
- cross-organization denial placeholder,
- unknown resource placeholder,
- unverified channel identity placeholder,
- invalid token/link placeholder,
- expired token/link placeholder,
- entitlement-denied placeholder,
- projection forbidden-field placeholder,
- unknown-field placeholder,
- deny-by-default placeholder,
- response-equivalence placeholder.

These categories are suggestions only. They are not current fixture creation.

## Suggested Future Test Categories

Possible future minimal test categories:

- no-bypass chain tests,
- generic safe-deny tests,
- response equivalence tests,
- allow-list projection tests,
- unknown field default deny tests,
- forbidden field default deny tests,
- identity scoping tests,
- token/link non-identity tests,
- no mutation tests,
- no DB call tests,
- no repository call tests,
- no provider sending tests,
- no AI/RAG/vector DB call tests.

These categories are suggestions only. They are not current test creation.

## Future Fixture/Test Acceptance Criteria Matrix

| Area | Future fixture/test purpose | Allowed only if fixtures/tests explicitly authorized | Forbidden in fixture/test | Evidence expected in completion report |
| --- | --- | --- | --- | --- |
| Synthetic fixtures | Represent safe boundary cases. | Yes | Production/customer data. | Fixture file paths and synthetic statement. |
| No production data | Prove all fixture data is synthetic. | Yes | Shared/prod/Zeabur data. | No-production-data statement. |
| No real token/secret | Avoid usable credentials. | Yes | Real token, secret, `DATABASE_URL`. | Sensitive scan result. |
| No full phone/address | Avoid personal data leakage. | Yes | Real phone/address values. | Fixture redaction statement. |
| No raw channel id | Avoid raw provider/customer identity leakage. | Yes | Raw channel ids. | Channel id boundary statement. |
| Organization isolation | Validate same-org and cross-org outcomes. | Yes | Cross-tenant data reuse. | Organization fixture summary. |
| Customer channel identity scoping | Validate channel identity is scoped. | Yes | Global channel identity assumptions. | Identity scope summary. |
| Token/link non-identity | Prove link possession is not identity. | Yes | Treating token as customer. | Token/link boundary evidence. |
| Generic safe-deny | Deny outcomes collapse safely. | Yes | Detailed deny reasons. | Safe-deny assertions. |
| Response equivalence | Deny outcomes remain equivalent. | Yes | Status/message/timing leakage. | Equivalence assertions. |
| Allow-list-first | Only explicitly allowed fields appear. | Yes | Spreading raw objects. | Allow-list assertions. |
| Forbidden field default deny | Forbidden fields never appear. | Yes | Internal fields in output. | Forbidden-field assertions. |
| No DB access | Tests do not touch DB. | Yes | DB client/repository calls. | No DB evidence. |
| No provider sending | Tests do not send notifications. | Yes | LINE/SMS/Email/App/survey calls. | No provider evidence. |
| No AI/RAG/vector DB | Tests do not call model/retrieval. | Yes | AI provider/RAG/vector DB calls. | No AI/RAG evidence. |
| No browser/API/smoke | Keep tests unit/contract only. | Yes | Browser/API/smoke execution. | Test type evidence. |

## Sensitive Fixture Scan Expectations

Future fixture/test implementation must include a sensitive scan.

The scan should check for:

- actual `DATABASE_URL`,
- token,
- secret,
- API key,
- raw channel id,
- raw `line_user_id`,
- complete phone number,
- complete address,
- raw provider payload,
- production data indicators.

Matches that are policy terms must be documented as policy-only. Any actual
sensitive value is a stop condition.

## Security / Privacy / Organization Isolation Boundaries

Future fixtures and tests must preserve:

- organization scope,
- scoped customer channel identity,
- no global `line_user_id` identity assumption,
- no cross-tenant data reuse,
- no cross-channel data reuse,
- generic safe-deny,
- no raw internal data output,
- no sensitive data in test logs or completion reports.

## Customer Channel Identity Boundary Notes

Future fixtures should model customer channel identity only as sanitized,
synthetic, scoped placeholders.

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

## Stop Conditions

Codex must stop before any future fixture/test implementation if:

- fixtures/tests are not explicitly authorized,
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

## Explicit Non-goals

Task444 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify API / route / controller / resolver / repository,
- add or modify customerAccessContext / projection / response envelope /
  safe-deny runtime,
- add or modify tests / fixtures / smoke / browser tests,
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

For Task444, run:

```bash
git diff --check
npm run check
npm run admin:check
```

Also run a sensitive scan on this document to confirm it contains no actual
credential, token, secret, `DATABASE_URL`, complete phone, complete address, raw
channel id, raw provider payload, or production data.

Do not run DB, API, browser, smoke, fixture generation, test generation, or
migration commands for Task444.

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
- whether sensitive data / token / secret / personal data / LINE logic was
  touched,
- whether customer channel identity / organization isolation / SaaS-ready /
  entitlement / seat billing / usage billing / AI add-on / Enterprise SSO was
  affected,
- future tasks listed only, without expanding implementation scope.
