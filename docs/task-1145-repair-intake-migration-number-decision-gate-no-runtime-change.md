# Task1145 - Repair Intake Migration Number Decision Gate / No Runtime Change

## Status

Completed locally. Not staged.

This gate resolves the current migration number recommendation only as a proposal.

It does not create or modify migration files and does not authorize DB execution, SQL, migration dry-run, migration apply, `psql`, `db:migrate`, repository implementation, staging, or commit.

## Accepted Baseline

Task1144 is accepted.

Highest observed local migration number:

`025`

Observed gap:

`023` is missing from the local migration filename sequence.

Pre-existing untracked migration files:

- `020_create_survey_intents_and_event_outbox.sql`
- `021_create_data_correction_persistence_schema.sql`
- `022_create_engineer_mobile_read_model.sql`
- `024_create_brand_referral_contact_events.sql`
- `025_create_data_correction_decision_audit_events.sql`

`migrations/README.md` is tracked dirty and must not be modified by this task.

## Decision Rule

Do not fill the `023` gap without explicit project history confirmation.

Prefer the next monotonic candidate after the observed highest local number:

`026`

Because several migration files are untracked, candidate `026` is proposal-only until the migration inventory is committed or reconciled.

## Candidate Migration Filename

Proposal only:

`026_create_repair_intake_persistence_tables.sql`

This file is not created by Task1145.

## Risk Statement

Migration inventory is ambiguous because some migration files are untracked.

Future migration creation must not proceed until PM confirms whether untracked migrations `020`, `021`, `022`, `024`, and `025` are accepted, staged, committed, or intentionally local-only.

No migration number is final until inventory is reconciled.

## Future Prerequisites

- Explicit approval to create a migration file.
- Exact filename approval.
- Accepted schema fields.
- Disposable local/test DB authorization if dry-run is requested.
- Explicit prohibition on production, staging, and shared DB targets.
- Credential redaction rules.

## Fail-Closed Rule

- Generic `continue runtime` is not enough to create a migration.
- No SQL file creation is allowed without a bounded task.
- No DB command is allowed without a bounded task.
- No `psql` is allowed without a bounded task.
- No `db:migrate` is allowed without a bounded task.
- No full `DATABASE_URL`, token, secret, or credential value may be printed.
