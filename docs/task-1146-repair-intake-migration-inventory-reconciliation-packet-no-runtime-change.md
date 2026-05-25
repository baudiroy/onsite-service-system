# Task1146 - Repair Intake Migration Inventory Reconciliation Packet / No Runtime Change

## Status

Completed locally. Not staged.

This packet documents migration inventory ambiguity only.

It does not authorize migration creation, migration modification, DB execution, SQL, migration dry-run, migration apply, `psql`, `db:migrate`, repository implementation, repository writer, staging, or commit.

## Accepted Baseline

Task1144 and Task1145 are accepted.

Highest observed local migration number:

`025`

Missing `023` should not be filled without project-history confirmation.

Candidate Repair Intake migration remains proposal-only:

`026_create_repair_intake_persistence_tables.sql`

## Current Ambiguous Migration Inventory

`migrations/README.md` is tracked dirty and untouched.

These migration files are currently untracked locally:

- `020_create_survey_intents_and_event_outbox.sql`
- `021_create_data_correction_persistence_schema.sql`
- `022_create_engineer_mobile_read_model.sql`
- `024_create_brand_referral_contact_events.sql`
- `025_create_data_correction_decision_audit_events.sql`

`023` is absent locally.

## Reconciliation Questions

- Are untracked migrations `020`, `021`, `022`, `024`, and `025` accepted project files that should be staged and committed first?
- Is `023` intentionally skipped, missing, or reserved in another branch?
- Should Repair Intake use `026` only after `020`, `021`, `022`, `024`, and `025` are accepted into the migration inventory?
- Should `migrations/README.md` be reconciled before any new migration?
- Which migration set is the source of truth for the next migration proposal?

## Recommended Safe Sequence

1. Reconcile and stage the existing migration inventory in a separate bounded task if PM accepts those files.
2. Reserve `026` only after inventory reconciliation.
3. Create the Repair Intake migration proposal file only after an explicit migration-file task.
4. Run any disposable DB dry-run only after explicit disposable local/test DB authorization.

## Fail-Closed Rules

- No migration creation while inventory is ambiguous.
- No DB command.
- No filling `023`.
- No staging untracked migrations without an explicit allowlist.
- No modifying `migrations/README.md` without an explicit allowlist.
- No full `DATABASE_URL`, token, secret, or credential value may be printed.

## Future Bounded Task Candidates

- Existing migration inventory staging readiness review.
- Migration README reconciliation packet.
- Repair Intake migration file proposal, no DB apply.
- Disposable DB dry-run authorization.

## Local Git Warning

Task1146 doc remains untracked and unstaged.

`git diff --cached --name-only` must remain empty.

Existing unrelated dirty and untracked migration stack remains untouched.
