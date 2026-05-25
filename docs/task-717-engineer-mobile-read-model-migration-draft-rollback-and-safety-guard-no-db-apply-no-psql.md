# Task 717 - Engineer Mobile Read Model Migration Draft Rollback and Safety Guard / No DB Apply / No psql

## Summary

Task 717 hardened the Engineer Mobile read model migration draft with a documentation-only rollback plan and a focused static safety guard.

Modified:

- `migrations/022_create_engineer_mobile_read_model.sql`

Added:

- `tests/engineerMobile/engineerMobileReadModelMigrationRollbackSafety.static.test.js`

## Rollback Plan Boundary

The rollback plan is intentionally documentation-only. It records that a future executable rollback requires a separate approved rollback task and should only target:

- `engineer_mobile_task_read_models`

The migration draft still does not authorize:

- DB connection
- SQL execution
- `psql`
- migration apply
- migration dry-run
- shared runtime apply
- production or staging apply
- active destructive DDL

## Safety Guard

The static guard verifies:

- authoring-only and not-applied comments remain present
- rollback plan exists
- rollback plan mentions `engineer_mobile_task_read_models`
- destructive rollback statements are not active SQL outside comments
- core tables are not actively altered or dropped
- the draft remains scoped to the Engineer Mobile read model table
- raw identity, credential, DB URL, seed data, and final appointment fields are absent

## Files Not Touched

Task 717 did not modify:

- `src/`
- `admin/src/`
- API routes/controllers beyond existing branch state
- `docs/design/`
- guardrails / short instruction / task indexes
- package files
- smoke or browser smoke tests
- other migration files

## Verification

Expected verification:

```bash
node --test tests/engineerMobile/engineerMobileReadModelMigrationRollbackSafety.static.test.js

git diff --check -- migrations/022_create_engineer_mobile_read_model.sql tests/engineerMobile/engineerMobileReadModelMigrationRollbackSafety.static.test.js docs/task-717-engineer-mobile-read-model-migration-draft-rollback-and-safety-guard-no-db-apply-no-psql.md
```

## Future Tasks

- Request explicit disposable DB authorization before any migration dry-run.
- Create an executable rollback migration only in a separately approved rollback task, if needed.
- Keep future runtime wiring separate from migration authoring and static validation.
