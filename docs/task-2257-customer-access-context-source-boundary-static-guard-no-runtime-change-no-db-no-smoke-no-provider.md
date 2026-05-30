# Task2257 - Customer Access Context Source Boundary Static Guard

## Summary

This task adds a focused static guard for Customer Access context source boundaries. It is a no-runtime-change guard and does not change customer-facing runtime behavior, routes, DTOs, resolvers, handlers, repositories, DB, provider behavior, smoke coverage, package files, or runtime behavior.

## Added Guard

- `tests/customerAccess/customerAccessContextSourceBoundary.static.test.js`

The guard reads source, test, and doc text only. It does not import Customer Access runtime modules, execute DB code, start a server/listener, call providers, inspect env/Zeabur, or run smoke traffic.

## Static Boundary Coverage

- Confirms trusted Customer Access context sources stay explicit: `customerAccessContext`, `syntheticCustomerAccessContext`, and middleware `customerAccessContextInput`.
- Confirms raw request containers such as headers, body, query, cookies, session, user, provider payload, debug, and env fields are not accepted as trusted context sources.
- Confirms raw internal identifiers and customer-controlled internal fields are not trusted as access context, including appointment/completion/report/actor/engineer/role/permission/debug/internal markers.
- Confirms Customer Access context output remains normalized and minimized.
- Confirms customer identity/contact/address and visible data remain allowlisted/scoped.
- Confirms LINE/provider identifiers remain scoped and cannot become broad global identity.
- Confirms organization isolation and permission/access context remain represented.
- Confirms missing, malformed, conflicting, ambiguous, unauthorized, and cross-scope context stays safe-deny / generic unavailable.
- Confirms safe-deny does not reveal existence of Case/report data.
- Confirms context/resolver files do not add unsafe runtime DB, provider sending, AI/RAG/OpenAI/vector DB, billing/settlement/payment/invoice, app/server/listener, env/Zeabur/secret, network, or route dependencies.
- Confirms the new static guard itself imports only `node:assert/strict`, `node:fs`, `node:path`, and `node:test`.

## No Runtime Change

No runtime/source behavior changed. The Customer Access context provider, context middleware, request context resolver, HTTP context adapter, resolver, routes, DTOs, repositories, DB access, audit persistence, providers, smoke coverage, package files, and migrations were not modified.

## Forbidden Scope Not Touched

- No Customer Access route/API/DTO/projection/resolver behavior changes.
- No customer-facing report runtime behavior changes.
- No helper runtime wiring.
- No DB commands, SQL execution, SQL runtime construction, transactions, migrations, migration dry-run/apply, DATABASE_URL, Zeabur, or env inspection.
- No repository implementation behavior or audit persistence behavior changes.
- No route mount/open/public route behavior changes.
- No smoke test execution, endpoint probes, server/listener startup, shared runtime, deploy, staging/prod traffic, or `/healthz`.
- No provider sending: LINE, SMS, email, app push, or webhook.
- No auth/session middleware changes.
- No rate limiting or payload-size/body-parser middleware changes.
- No permission model, role expansion, or organization isolation source changes.
- No AI/RAG/OpenAI/vector DB.
- No admin frontend.
- No billing/settlement/payment/invoice.
- No Repair Intake runtime behavior.
- No Engineer Mobile behavior.
- No package dependency changes.

## Held Docs

The 7 held historical untracked docs remain untouched, unstaged, and untracked.

## Verification

- `node --test tests/customerAccess/customerAccessContextSourceBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessResolverSafeDenyBehavior.static.test.js`
- `node --test tests/customerAccess/customerFacingProjectionAllowlist.static.test.js`
- `node --test tests/customerAccess/customerServiceReportSafeEnvelopePresenterBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessProductionMountBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`
