# Task1096 - Repair Intake Route Mount Decision Packet / No Runtime Change

## Status

Completed locally. Not staged.

## Decision Packet Status

Task1095 authorization gate was accepted by PM.

This packet is not runtime wiring and not route mount approval.

Global app/server/routes remain untouched.

The current phase still has:

- No global route mount.
- No production route registration.
- No listen/server startup.
- No DB.
- No migration.
- No SQL.
- No real repository implementation.
- No repository writer.
- No API shape or OpenAPI expansion.
- No admin, provider, AI/RAG, or billing work.

## Candidate Route Surface

Candidate base path:

- `/repair-intake`

Candidate plan route:

- `POST /repair-intake/drafts/:draftId/case/plan`

Candidate submit route:

- `POST /repair-intake/drafts/:draftId/case/submit`

Expected HTTP method:

- `POST`

These are candidate paths only. They are not registered production routes.

## Decision Questions

Before any future bounded route mount task can be assigned, PM/user must answer:

- Should Repair Intake draft-to-case be mounted under public routes, internal routes, admin routes, or a new route group?
- Which auth/session/org/tenant context source should supply runtime context?
- Which permission source should supply `canCreateCaseFromRepairIntakeDraft`?
- Should route response use current sanitized envelopes exactly, or require an API/DTO review first?
- Should the route remain behind a feature flag or entitlement gate?
- Should real repository contracts be wired now, or remain synthetic until DB authorization?
- What is the rollback plan?

## Future Route-Mount Task Prerequisites

Any future bounded route-mount task must include:

- exact route file or app injection point
- exact allowed files
- explicit route mount authorization
- decided auth/session/org/tenant context source
- decided permission source
- accepted response envelope contract
- test plan
- rollback verification plan

Without these, future route mount work must fail closed.

## Hard Blockers

Route mount remains blocked by:

- no real repository implementation
- no repository writer
- no DB schema
- no migration
- no transaction boundary
- no production auth/session/org integration
- no API shape or OpenAPI approval
- no provider approval
- no admin approval
- no AI/RAG approval
- no billing approval

## Fail-Closed Rule

A future generic "continue runtime" request is not enough to mount routes.

Route mount requires explicit user approval that names the target and scope.

Do not infer route mount authorization from this decision packet.

## Local Worktree Warning

Task989 through Task1096 files remain local and uncommitted unless staged outside this task.

The existing tracked dirty stack is pre-existing and must not be cleaned, reverted, restaged, reset, or stashed blindly.

`git diff --cached --name-only` must remain empty.

## Boundaries Held

- No production source files modified.
- No tests modified.
- No migrations.
- No admin changes.
- No package changes.
- No existing docs modified.
- No global route mount.
- No production route registration.
- No listen/server startup.
- No DB, SQL, migration, psql, or db:migrate.
- No real repository implementation.
- No repository writer.
- No imports from `src/repositories/**` or `src/db/**`.
- No API shape or OpenAPI expansion.
- No provider sending.
- No AI/RAG.
- No billing, settlement, payment, or invoice changes.
- No staging, cleanup, revert, reset, or stash.

## Verification

Required commands:

```bash
git diff --name-only
git diff --cached --name-only
```

Results are recorded in the completion report.
