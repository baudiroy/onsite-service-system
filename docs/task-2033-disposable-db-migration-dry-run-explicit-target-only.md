# Task2033 Disposable DB Migration Dry-run / Explicit Target Only

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2033-disposable-db-migration-dry-run-explicit-target-only.md`
- Current synced baseline before this task: `10d5a1b6ff0791cb99aea79bfae09abde484ec72`
- Local `main` equaled `origin/main` before this task.
- Working tree had no tracked dirty changes before this task.
- Only the 7 held historical docs were untracked before this task and were not touched.

## Explicit Approval Used

PM approved this exact dry-run scope:

```text
I approve running Task2033 disposable DB migration dry-run against the explicitly named non-secret target: disposable_local_postgres_task2033. Use disposable local/test PostgreSQL only. Do not use Zeabur DB, shared DB, staging DB, or production DB. Do not print DATABASE_URL or secrets. Do not apply migration to any persistent/shared target. Do not run seed. Do not run smoke. Do not probe endpoints.
```

## Target

| Field | Value |
| --- | --- |
| Target label | `disposable_local_postgres_task2033` |
| Target type | Disposable local/test PostgreSQL |
| Container label | `oss-task2033-postgres` |
| Persistent/shared target used | No |
| Zeabur/shared/staging/production DB used | No |
| `DATABASE_URL` printed | No |
| Seed run | No |
| Smoke or endpoint probe run | No |

## Migration Range Selected

Selected range: full local migration sequence `001-026`.

Rationale:

- Task2025 identifies the current local `migrations/` directory as the active migration inventory.
- A fresh disposable PostgreSQL target has no applied state, so the safest validation is the full lexicographic local sequence.
- Task2026 permits a future fresh-disposable full local sequence rehearsal when explicitly approved.
- Task2028 requires exact target and no-secret handling before any migration execution; Task2033 approval supplied an explicit disposable target label and dry-run-only boundary.

## Migration Files Attempted

The dry-run attempted and applied these migrations inside the disposable target only:

1. `001_create_base_tables.sql`
2. `002_create_cases.sql`
3. `003_create_case_activity_tables.sql`
4. `004_update_attachment_foundation.sql`
5. `005_update_message_foundation.sql`
6. `006_create_dispatch_appointment_tables.sql`
7. `007_dispatch_assignment_auditability.sql`
8. `008_create_field_service_tables.sql`
9. `009_create_billing_settlement_tables.sql`
10. `010_create_notification_tables.sql`
11. `011_create_ai_jobs.sql`
12. `012_create_line_integration_tables.sql`
13. `013_add_organization_scope.sql`
14. `014_add_ai_job_scope.sql`
15. `015_update_audit_log_entity_type_constraint.sql`
16. `016_add_cases_closed_at.sql`
17. `017_update_audit_log_entity_type_constraint_user_role.sql`
18. `018_add_visit_result_fields_to_appointments.sql`
19. `019_add_final_appointment_id_to_field_service_reports.sql`
20. `020_create_survey_intents_and_event_outbox.sql`
21. `021_create_data_correction_persistence_schema.sql`
22. `022_create_engineer_mobile_read_model.sql`
23. `023_engineer_mobile_visit_action_persistence_fields.sql`
24. `024_create_brand_referral_contact_events.sql`
25. `025_create_data_correction_decision_audit_events.sql`
26. `026_create_repair_intake_persistence_tables.sql`

## Sanitized Commands Run

No command output printed a real `DATABASE_URL`, credentials, tokens, passwords, provider keys, private keys, Zeabur secrets, or other secrets.

Sanitized command classes:

1. Checked the git baseline and migration planning docs.
2. Started Docker Desktop because the Docker daemon was not already running.
3. Confirmed no existing `oss-task2033-postgres` container name collision.
4. Started a disposable local PostgreSQL container from an already-present local image.
5. Confirmed the disposable PostgreSQL target accepted connections.
6. Ran the project migration runner against the disposable target with the connection value constructed in-process and not printed.
7. Stopped the disposable PostgreSQL container after the dry-run.
8. Verified the disposable container was removed.

The first in-sandbox local connection attempt failed with local network `EPERM` before the migration could connect. The same command was then rerun with local connection permission against the same disposable target and completed successfully.

## Dry-run Result

Result: PASS.

All migration files in range `001-026` were applied successfully inside the disposable local/test PostgreSQL target. The run ended with the migration runner reporting completion.

This is not an apply to any persistent, shared, staging, Zeabur, or production database. It does not prove any external DB applied state.

## Cleanup Result

Cleanup result: PASS.

- The disposable PostgreSQL container was stopped.
- The container used `--rm`, and follow-up inspection found no remaining container with the Task2033 container label.
- No persistent DB target was left behind by this task.

## Confirmed Non-actions

- No Zeabur DB, shared DB, staging DB, or production DB was used.
- No persistent/shared migration apply was performed.
- No `DATABASE_URL`, credential, token, password, private key, provider key, Zeabur secret, or billing/AI secret was printed.
- No seed command was run.
- No smoke test was run.
- No endpoint probe was run.
- No `/healthz` request was made.
- No deploy, redeploy, restart, or rollback was performed.
- No Zeabur env value was inspected or changed.
- No provider, billing, or AI execution was performed.
- No runtime source, package, lockfile, or admin frontend file was modified.
- No Completion Report / FSR behavior was created, approved, published, revoked, or mutated.
- No `finalAppointmentId` behavior was selected, inferred, exposed, or mutated.
- No customer-visible publication behavior was created.
- The 7 held historical untracked docs were not touched.

## Recommendation

If PM accepts Task2033, the next safe step is Task2034 only with a separately explicit approved test DB target, exact migration range, and no-secret/no-seed/no-smoke boundary.
