# Task2341 Repair Intake Draft-to-Case DB-Backed Fake Synthetic Portfolio Static Guard

## Scope

Task2341 adds a focused static portfolio guard for the accepted Repair Intake draft-to-case DB-backed fake/synthetic readiness branch after Task2314 through Task2340.

This is a no-runtime-change, source-reading static guard task. It does not change runtime, source, route, API, controller, DTO, projection, resolver, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, migration, package, provider, admin frontend, Customer Access, Engineer Mobile, billing, AI/RAG, smoke, endpoint, staging, production, deploy, env, Zeabur, or secrets behavior.

## Portfolio Coverage

The new guard freezes the accepted source-only portfolio:

- Task2314 DB-backed implementation authorization packet
- Task2315 DB-backed draft reader
- Task2316 draft reader static guard
- Task2317 DB-backed idempotency port
- Task2318 idempotency static guard
- Task2319 persistence seams checkpoint
- Task2320 case creator pre-transaction guard
- Task2321 case creator transaction skeleton
- Task2322 transaction static guard
- Task2323 transaction checkpoint
- Task2324 runtime ports factory DB-backed seam wiring
- Task2325 runtime ports factory static guard
- Task2326 DB-backed full synthetic chain
- Task2327 full synthetic chain checkpoint
- Task2328 full synthetic chain static guard
- Task2329 DB-backed fake/synthetic persistence branch closure
- Task2330 audit persistence authorization packet
- Task2331 audit event persistence contract and table-shape alignment
- Task2332 audit persistence fake-client wiring
- Task2333 audit fake-client static guard
- Task2334 runtime ports factory audit fake-client wiring
- Task2335 full synthetic chain with audit
- Task2336 full synthetic chain with audit static guard
- Task2337 audit fake-client branch closure
- Task2338 migration 026 disposable DB dry-run authorization packet
- Task2340 dry-run blocked checkpoint

## Current Frozen Boundaries

Task2341 records that the accepted portfolio remains bounded as follows:

- no real DB execution is authorized
- no migration apply or dry-run has completed
- migration 026 dry-run remains blocked because disposable local/test DB tooling was unavailable
- full synthetic chains use fake/injected clients only
- runtime ports factory remains explicit injected dependency based
- audit persistence fake-client path aligns to `repair_intake_audit_events`
- route remains admin/injected-only
- no public/open route expansion is authorized
- no production, staging, Zeabur, shared DB, app DB, provider, smoke, endpoint, server/listener, deploy, package, or package-lock work is authorized

## Static Guard

`tests/repairIntake/repairIntakeDraftToCaseDbBackedFakeSyntheticPortfolio.static.test.js` reads source, test, migration, and task documentation files as text only. It does not import or execute runtime modules, DB clients, migration code, server code, endpoint probes, providers, env access, Zeabur access, or package scripts.

The guard asserts:

- accepted Task2314 through Task2340 documentation remains visible
- current DB-backed source seams remain visible
- current static/unit fake/synthetic test artifacts remain visible
- migration 026 remains authoring-only and includes the expected Repair Intake tables
- route remains admin/injected-only
- public/open route expansion remains absent
- real DB execution, migration apply/dry-run completion, smoke/runtime rollout, provider sending, production/staging/Zeabur/shared DB usage, and package changes remain non-authorized

## Runtime Statement

- No DB commands were run.
- No SQL was executed against any database.
- No real DB connection was opened.
- No migration was created, dry-run, modified, or applied.
- Migration 026 was not applied.
- No `DATABASE_URL`, env, Zeabur, or secrets were inspected.
- No server/listener was started.
- No smoke test or endpoint probe was run.
- No provider sending occurred.
- No package or package-lock changes occurred.

Future implementation remains blocked until PM authorizes one exact bounded task.

## Held Docs

The same 7 held historical untracked docs remain outside Task2341 scope and must stay untouched unless PM explicitly authorizes that exact action.
