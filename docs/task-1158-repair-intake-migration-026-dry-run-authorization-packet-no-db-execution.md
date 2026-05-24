# Task1158 - Repair Intake Migration 026 Dry-Run Authorization Packet / No DB Execution

## Status

Completed locally. Not staged.

This packet prepares authorization requirements for a future dry-run only.

It does not authorize or execute DB connection, SQL execution, migration dry-run, migration apply, `psql`, `db:migrate`, staging, or commit.

## Accepted Baseline

Task1157 is accepted.

Migration proposal exists at:

`migrations/026_create_repair_intake_persistence_tables.sql`

Static boundary test passed for the proposal.

No DB execution has occurred.

## Dry-Run Target Requirements

- Target must be disposable local/test DB only.
- Production, staging, and shared DB targets are explicitly forbidden.
- Full `DATABASE_URL`, credentials, tokens, and secrets must never be printed.
- DB target proof must be sanitized, such as a redacted host/db label or local container name only.
- Any future dry-run target must be disposable or resettable without operational impact.

## Required Explicit Authorization Wording Before Future Dry-Run

Future dry-run must require user wording equivalent to:

- `I authorize a disposable local/test DB dry-run for migration 026.`
- `Do not use production/staging/shared DB.`
- `Do not print full DATABASE_URL or credentials.`
- `Do not apply migration to shared/runtime DB.`

## Future Dry-Run Command Envelope

Future task may list exact commands only after authorization.

Allowed command categories may include:

- sanitized pre-check of disposable DB identity;
- dry-run/check command against disposable DB;
- sanitized post-check of created schema objects;
- disposal/reset command for the disposable DB.

The future task must distinguish dry-run/check from apply.

Pre/post schema inspection must be sanitized and must not print credentials.

Rollback/dispose plan must be defined before any DB command.

## Stop Conditions

Stop before any DB command if:

- disposable DB proof is missing;
- DB target is ambiguous;
- credential output risk exists;
- command could hit staging, production, shared, or runtime DB;
- Task1157 static boundary test fails;
- migration file differs unexpectedly from the accepted Task1157 proposal;
- allowed command list is not exact.

## Verification Required Before Future Dry-Run

- Rerun `node --test tests/repairIntake/repairIntakeMigration026StaticBoundary.static.test.js`.
- Confirm `git diff --cached --name-only` is empty or explicitly controlled by the future task.
- Confirm migration file identity, optionally with a checksum if PM requests it.
- Do not run any DB command until a future dry-run authorization task is accepted.

## Local Git Warning

Task1158 doc remains untracked and unstaged.

`git diff --cached --name-only` must remain empty.
