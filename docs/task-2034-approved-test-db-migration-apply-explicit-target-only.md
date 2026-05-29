# Task2034 Approved Test DB Migration Apply / Explicit Target Only

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 22 - Migration and Seed Authorization Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2034-approved-test-db-migration-apply-explicit-target-only.md`
- Current synced baseline before this task: `f6b0a344011e842bb4d56322a6bc19b12a484e7d`
- Task2033 disposable DB migration dry-run was accepted and pushed before this task.
- Local `main` equaled `origin/main` before this task.
- Working tree had no tracked dirty changes before this task.
- Only the 7 held historical docs were untracked before this task and were not touched.

## Exact PM Approval Used

PM approved this exact apply scope:

```text
I approve running Task2034 migration apply against the explicitly named non-secret target: approved_test_postgres_task2034. Use disposable approved local/test PostgreSQL only. Apply migration range 001-026 only to this approved test target. Do not use Zeabur DB, shared DB, staging DB, or production DB. Do not print DATABASE_URL or secrets. Do not run seed. Do not run smoke. Do not probe endpoints.
```

## Approved Target

| Field | Value |
| --- | --- |
| Target label | `approved_test_postgres_task2034` |
| Target type | Disposable approved local/test PostgreSQL |
| Container label | `oss-task2034-postgres` |
| Migration range | `001-026` |
| Persistent/shared target used | No |
| Zeabur/shared/staging/production DB used | No |
| `DATABASE_URL` printed | No |
| Seed run | No |
| Smoke or endpoint probe run | No |

This task used a new disposable approved local/test target and did not reuse the cleaned-up Task2033 target.

## Migration Range Applied

Applied range: `001-026`.

Rationale:

- PM explicitly approved migration range `001-026`.
- Task2025 identifies the local `migrations/` directory as the current migration inventory.
- Task2033 confirmed the full local sequence `001-026` passed in a disposable dry-run.
- Task2034 approval was limited to an approved disposable local/test target only, with no seed and no smoke.

## Migration Files Applied

The apply executed these migrations inside the approved disposable local/test target only:

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

1. Checked the git baseline and Task2034 planning source.
2. Confirmed no existing `oss-task2034-postgres` container name collision.
3. Started a disposable approved local/test PostgreSQL container from an already-present local image.
4. Confirmed the disposable target accepted connections.
5. Ran the project migration runner against the approved disposable target with the connection value constructed in-process and not printed.
6. Queried only sanitized `schema_migrations` metadata for post-apply completion evidence.
7. Stopped the disposable approved PostgreSQL container after verification.
8. Verified the disposable container was removed.

`npm run db`, `psql`, seed, smoke, endpoint probes, and runtime startup were not run.

## Apply Result

Result: PASS.

All migration files in range `001-026` were applied successfully inside `approved_test_postgres_task2034` only. The migration runner reported completion after `026_create_repair_intake_persistence_tables.sql`.

This is not an apply to Zeabur, shared, staging, production, or any other persistent database. It does not prove any external DB applied state.

## Sanitized Post-apply Verification

Post-apply verification queried only migration bookkeeping metadata from the approved disposable local/test target:

| Check | Result |
| --- | --- |
| `schema_migrations` count | 26 |
| First recorded migration | `001_create_base_tables.sql` |
| Last recorded migration | `026_create_repair_intake_persistence_tables.sql` |

No customer data, organization data, provider data, billing data, credentials, secrets, or raw operational rows were printed.

## Cleanup Result

Cleanup result: PASS.

- The disposable approved PostgreSQL container was stopped.
- The container used `--rm`, and follow-up inspection found no remaining container with the Task2034 container label.
- No persistent DB target was retained by this task.

## Confirmed Non-actions

- No Zeabur DB, shared DB, staging DB, or production DB was used.
- No migration was applied to any persistent/shared target.
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

If PM accepts Task2034, sync the commit first. Proceed to Task2035 only with a separate explicit approved seed target and no-secret/no-smoke boundary.
