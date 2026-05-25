# Task767 - Brand Referral Migration 024 Disposable DB Dry-run Result Template / No DB Execution

Status: completed

Scope: future dry-run result template only / no DB execution / no migration modification / no runtime change

## Summary

Task767 creates a redacted, auditable result template for any future explicitly approved disposable local/test DB dry-run of `migrations/024_create_brand_referral_contact_events.sql`.

This task does not connect to a DB, does not use psql, does not run `db:migrate`, does not run DDL, does not dry-run, does not apply, and does not execute SQL. It also does not modify `migrations/024_create_brand_referral_contact_events.sql`.

The template is a reporting artifact only. It does not authorize dry-run execution.

## Future Dry-run Result Template

Use the following template only after a separate task explicitly approves a disposable local/test DB target and the exact dry-run command.

### 1. Authorization Reference

- Authorization task id:
- Approval source:
- Approved migration file: `migrations/024_create_brand_referral_contact_events.sql`
- Approved command:
- Approved target type: disposable local/test DB only
- Confirmation that target is not shared, production, staging, or Zeabur shared runtime:
- Confirmation that no real customer data is present:
- Confirmation that `DATABASE_URL` and credentials were not printed:

### 2. Disposable DB Target Confirmation

- Target label:
- Target owner:
- Disposable lifecycle:
- Local/test evidence:
- Shared/prod/staging/Zeabur exclusion evidence:
- Runtime traffic disabled:
- Provider sending disabled:
- LINE/SMS/App push/webhook/email sending disabled:
- AI/RAG disabled:
- Audit/contact writer disabled:
- Identity verification disabled:
- Case Binding disabled:
- Repair intake and Case creation disabled:

### 3. Migration File Integrity

- Migration path: `migrations/024_create_brand_referral_contact_events.sql`
- File hash/check:
- File unchanged since Task765:
- Creates only `brand_referral_contact_events`:
- Safe columns only:
- No seed data:
- No unsafe columns:

### 4. Command Envelope Placeholder

Do not paste credentials or full environment variables.

- Command family:
- Sanitized command summary:
- Working directory:
- Environment source summary:
- Credential printing avoided:
- `DATABASE_URL` printing avoided:

### 5. Sanitized Success / Failure Summary

- Result: success / failure / stopped before execution
- Exit status summary:
- Error category, if any:
- Redacted error summary:
- Did the command stop before unsafe execution:
- Were any credentials, tokens, secrets, or full PII printed: no / yes, stop and redact

### 6. Created Objects Checklist

- `brand_referral_contact_events` table:
- `id` column:
- `organization_id` column:
- `brand_id` column:
- `source_channel` column:
- `referral_source` column:
- `entry_context` column:
- `line_channel_id` column:
- `event_type` column:
- `reason_key` column:
- `result_status` column:
- `request_id` column:
- `created_at` column:
- `retention_until` column:
- `deleted_at` column:

### 7. Index Checklist

- `organization_id, created_at` index:
- `organization_id, brand_id, created_at` index:
- `organization_id, source_channel, created_at` index:
- `organization_id, request_id` index:
- `organization_id, retention_until` index:
- `organization_id, deleted_at` index:
- No cross-organization lookup index:
- No index on raw sensitive values:

### 8. Rollback Readiness

- Rollback comments reviewed:
- Rollback would drop only objects created by migration 024:
- No destructive shared-data assumptions:
- Rollback not executed in dry-run result task unless separately approved:

### 9. Stop Conditions Review

State whether any stop condition occurred:

- missing disposable local/test DB confirmation
- unexpected migration target
- command tries to run more than migration 024
- unsafe logs
- credential printing
- `DATABASE_URL` printing
- token or secret output
- provider traffic
- LINE/SMS/App push/webhook/email sending
- AI/RAG runtime
- audit/contact writer runtime
- identity verification runtime
- Case Binding runtime
- repair intake or Case creation runtime
- shared, production, staging, or Zeabur target

### 10. Sensitive-output Review

The future report must not include:

- `DATABASE_URL`
- credentials
- token
- secret
- LINE access token
- LINE channel secret
- raw `line_user_id`
- full phone
- full address
- full customer name
- provider payload
- AI payload
- SQL logs with secrets
- full runtime payloads
- full customer payload
- customer case data
- internal note
- billing or settlement internal data
- cross-organization data

If any such value appears, the dry-run result must be stopped, redacted, and re-reported without exposing the value.

## Non-effects

Task767 does not implement:

- DB connection
- psql
- `db:migrate`
- DDL execution
- dry-run
- apply
- SQL execution
- migration file modification
- repository
- audit writer
- contact writer
- runtime persistence
- route behavior change
- public response body change
- permission runtime
- entitlement runtime
- identity verification
- Case Binding
- repair intake creation
- Case creation
- provider, LINE, SMS, App push, webhook, or email runtime
- AI/RAG runtime
- admin UI
- smoke or integration test
- package changes

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralMigration024DryRunResultTemplate.static.test.js
test -f docs/task-767-brand-referral-migration-024-disposable-db-dry-run-result-template-no-db-execution.md
git diff --check -- docs/task-767-brand-referral-migration-024-disposable-db-dry-run-result-template-no-db-execution.md tests/brandChannel/brandReferralMigration024DryRunResultTemplate.static.test.js docs/design/brand-official-line-channel-integration.md
```
