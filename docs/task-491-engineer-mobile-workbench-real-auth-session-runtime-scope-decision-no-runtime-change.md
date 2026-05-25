# Task 491 - Engineer Mobile Workbench Real Auth Session Runtime Scope Decision

## Status

Task 491 is docs-only.

It records the scope decision packet for future actual Engineer Mobile Workbench auth/session runtime. It does not implement runtime behavior.

## Current Baseline

Current runtime remains skeleton-only.

Endpoints still return `501 Not Implemented`.

Task 489 completed the actual auth/session preflight review.

Task 490 implemented only the request context bridge skeleton.

No `requireAuth`, `AuthService`, or `OrganizationAccessService` is used by Engineer Mobile Workbench runtime yet.

Actual auth/session validation remains unimplemented.

## Why Actual Auth / Session Needs A Scope Decision

Existing auth path may use repository-backed services.

DB/repository implications must not be introduced accidentally.

Engineer Mobile Workbench must not trust client-supplied `engineerId` or `organizationId`.

Actual auth/session should establish identity context only. Assignment permission remains separate.

LINE must not be required for task management.

Provider sending and AI/RAG must remain outside auth/session.

The next runtime step must choose whether to stay no-DB, wire existing middleware, introduce a workbench-specific adapter, or defer for repository-backed identity design.

## Scope Options

### Option A - Keep no-DB request context bridge only

Characteristics:

- lowest risk
- no actual login/session validation
- keeps endpoints 501
- useful only as skeleton preparation
- not enough for real task access

This is the current Task490 state.

### Option B - Wire existing requireAuth middleware to routes

Characteristics:

- may create actual auth/session behavior
- may imply `AuthService` / repository-backed DB path
- requires exact route file scope
- requires explicit acceptance of DB/repository implications if existing middleware uses DB
- must not return task data
- must still keep permission/projection skeleton unless separately scoped

This option should not be selected unless PM accepts the middleware behavior and dependency profile.

### Option C - Implement Workbench-specific auth/session adapter

Characteristics:

- may be safer long-term
- could wrap existing request user context if available
- must not duplicate auth logic unsafely
- may still need DB/repository if identity lookup is required
- requires separate design and exact files

This option may be useful if route-level middleware is too broad or exposes behavior that is not appropriate for the engineer mobile surface.

### Option D - Design repository-backed engineer identity lookup separately

Characteristics:

- applies if actual engineer identity cannot be established without DB
- DB/repository must be separately scoped
- no migration unless separately scoped
- must preserve organization isolation
- must keep assignment permission separate

This option should be used if the team decides actual engineer identity must be resolved from persisted user, membership, role, or assignment data.

## Decision Matrix

| Option | Runtime change? | DB risk | Files likely touched | Pros | Risks | Recommended now? |
| --- | --- | --- | --- | --- | --- | --- |
| Option A - keep bridge only | No further runtime change | None | None, current state already exists | Lowest risk, preserves skeleton-only boundary | Not enough for real task access | Yes if no DB authorization |
| Option B - wire `requireAuth` | Yes | Medium/high if middleware loads user/permission data through repositories | Route file and possibly auth boundary docs/tests | Reuses existing auth pattern | Can accidentally introduce DB-backed behavior and endpoint behavior changes | Only after explicit PM scope and DB/repository implication review |
| Option C - workbench adapter | Yes | Depends on adapter design | Auth boundary and possibly context helper | Can tailor mobile workbench identity boundary | Risk of duplicating auth logic or drifting from platform auth | Good candidate after deeper design |
| Option D - repository-backed identity lookup | Yes | High by design | Auth boundary, service/repository, tests, docs | Can model engineer identity and organization scope explicitly | Requires DB/test strategy and stricter permissions | Not without explicit DB/repository scope |

Recommended decision:

- If there is no DB authorization, stay with Option A or continue docs-only review.
- If actual auth is required, choose Option B or Option C only after PM explicitly scopes DB/repository risk or confirms the selected path does not require DB.

## Required Evidence Before Option B Or C

Before Option B or Option C, PM should require evidence for:

- exact files
- whether `requireAuth` uses DB
- whether route middleware changes endpoint behavior
- whether tests are needed
- whether existing user context contains organization scope
- whether engineer role can be distinguished
- whether customer user and engineer user are distinct
- how safe-deny is handled
- how request id / error envelope is preserved

Without this evidence, actual auth/session runtime should not proceed.

## Non-negotiable Boundaries

Future auth/session runtime must preserve these boundaries:

- no client-supplied `engineerId` identity
- no client-supplied `organizationId` identity
- token/link is not identity by itself
- raw LINE id is not global identity
- customer channel identity is not engineer identity
- entitlement is not permission
- auth/session is not assignment permission
- auth/session must not return task data
- auth/session must not mutate Case / Appointment / Field Service Report
- auth/session must not create Field Service Report draft
- auth/session must not trigger provider sending
- auth/session must not call AI/RAG

## Future Task492 Proposal

Proposal only:

`Task492 - Engineer Mobile Workbench Existing Auth Middleware Deep-Dive / No Runtime Change`

Reason:

- before wiring `requireAuth`, inspect exact current middleware behavior and DB/repository dependency
- avoid accidentally introducing DB-backed auth path without explicit scope
- keep task docs-only unless PM later scopes actual runtime

Task491 does not authorize Task492 implementation.

## Explicit Non-goals

Task 491 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary/service/repository
- add actual auth/session validation
- add real permission decision
- add real projection data
- add fixtures / tests
- execute tests
- add DB / migration / Migration020
- execute DB / migration / psql
- execute smoke/browser/API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Migration / Schema Decision

No migration, schema, index, DB, or Migration020 change is included in Task 491.

## Runtime Decision

No runtime behavior is changed in Task 491.

Engineer Mobile Workbench remains skeleton-only with no actual auth/session validation.
