# Task 084 - Smoke Fixture Inventory Additional Graph Sample Review

## 功能範圍

本任務在 dedicated local/test PostgreSQL 環境中補跑 LINE graph 與 RBAC graph 的 marker-enabled smoke，並用 Task 080 inventory-only script review live entity counts、sample labels、risk levels、skipped table behavior。

本任務不做：

- cleanup
- DB delete / update
- API delete / disable / unlink 當 cleanup
- migration 檔案變更
- backend schema / API / auth / RBAC behavior 變更
- smoke 驗證邏輯變更
- AI 自動判斷

## Local / Test DB 使用方式

本任務沿用 Task 083 建立的 local/test PostgreSQL。

PostgreSQL was started with:

```bash
brew services start postgresql@16
```

The configured DB target was confirmed as local without printing `DATABASE_URL`:

```json
{
  "hasDatabaseUrl": true,
  "hostClass": "local",
  "portProvided": true,
  "databaseNameProvided": true,
  "databaseUrlRedacted": true
}
```

Local API server:

```bash
PORT=3000 npm run dev
```

The local API server was stopped after the smoke / inventory review.

## Migration / Seed

Migration was re-run and all migrations were already applied:

```bash
npm run db:migrate
```

Result:

- PASS
- All migrations `001` through `019` were skipped as already applied

Seed was re-run:

```bash
npm run db:seed
```

Result:

- PASS

No DB URL, DB password, user password, token, or secret was printed.

## Smoke Fixtures Created

### LINE Graph

Task046:

```bash
SMOKE_RUN_ID=manual-test-084-line46 API_BASE_URL=http://127.0.0.1:3000 npm run smoke:046
```

Result:

- PASS
- 9 / 9 passed
- Created organization, LINE channel, customer, case, and customer LINE identity
- Raw LINE user id remained masked in smoke output

Task047:

```bash
SMOKE_RUN_ID=manual-test-084-line47 API_BASE_URL=http://127.0.0.1:3000 npm run smoke:047
```

Result:

- PASS
- 11 / 11 passed
- Created org A / B, channel A / B, customer A / B, case A / B, and customer LINE identity
- The unlink verification was product behavior validation, not cleanup
- Raw LINE user id remained masked in smoke output

Task046 DB fallback was not executed because Admin API identity linking worked in the local/test environment.

### RBAC Graph

First attempt:

```bash
SMOKE_RUN_ID=manual-test-084-027e API_BASE_URL=http://127.0.0.1:3000 npm run smoke:027e
```

Result:

- FAIL
- The script did not receive `DATABASE_URL`, so it could not create the limited role
- It still created partial marker rows for organizations, dispatch units, users, and related login / audit state

Second attempt loaded `DATABASE_URL` from `.env` without printing it:

```bash
SMOKE_RUN_ID=manual-test-084-027e-db API_BASE_URL=http://127.0.0.1:3000 npm run smoke:027e
```

Result:

- FAIL
- The limited role insert failed because the generated role key violates the current `roles_default_role_key_check`
- The current role constraint allows default keys or `^[a-z][a-z0-9_]*$`, but the smoke-generated role key contains hyphens
- It created partial marker rows for organizations and dispatch units before failing

No RBAC smoke logic was changed in this task.

## Inventory Commands

Known smokeRunIds:

```bash
DRY_RUN=1 SMOKE_RUN_ID=manual-test-084-line46 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_RUN_ID=manual-test-084-line47 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_RUN_ID=manual-test-084-027e npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_RUN_ID=manual-test-084-027e-db npm run smoke:cleanup:inventory
```

Task code filters:

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task046 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task047 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task027E npm run smoke:cleanup:inventory
```

All inventory commands remained read-only and returned:

- `destructiveCleanupImplemented: false`
- `cleanupSupported: false`

## LINE Graph Inventory Review

### Task046 / `manual-test-084-line46`

| Entity | Count | Risk |
| --- | ---: | --- |
| organizations | 1 | high |
| customers | 1 | low |
| cases | 1 | low |
| line_channels | 1 | medium |
| customer_line_identities | 1 | medium |

Representative labels:

- `task046-smoke-org-manual-test-084-line46 | Task046 LINE Inquiry Fixture Organization manual-test-084-line46`
- `Task046 Test Customer manual-test-084-line46`
- `TW-... | T046-manual-test-084 | Task046 smoke manual-test-084-line46 LINE inquiry fixture case`
- `task046-line-channel-manual-test-084-line46 | Task046 LINE Inquiry Test Channel manual-test-084-line46 | task046-channel-manual-test-084-line46`
- `Task046 LINE Fixture User manual-test-084-line46`

Review:

- Labels are sufficient to identify task, smokeRunId, channel, customer, case, and identity display name.
- Raw LINE user id is not present.
- Customer mobile is not present.
- Channel secret / access token are not present.

### Task047 / `manual-test-084-line47`

| Entity | Count | Risk |
| --- | ---: | --- |
| organizations | 2 | high |
| customers | 2 | low |
| cases | 2 | low |
| line_channels | 2 | medium |
| customer_line_identities | 1 | medium |

Representative labels:

- `task047-org-b-manual-test-084-line47 | Task047 Organization B manual-test-084-line47`
- `task047-org-a-manual-test-084-line47 | Task047 Organization A manual-test-084-line47`
- `Task047 Test Customer B manual-test-084-line47`
- `Task047 Test Customer A manual-test-084-line47`
- `TW-... | T047-B-manual-test-084 | Task047 smoke manual-test-084-line47 LINE identity admin API smoke B`
- `TW-... | T047-A-manual-test-084 | Task047 smoke manual-test-084-line47 LINE identity admin API smoke A`
- `task047-line-b-manual-test-084-line47 | Task047 LINE Channel B manual-test-084-line47 | task047-channel-b-manual-test-084-line47`
- `task047-line-a-manual-test-084-line47 | Task047 LINE Channel A manual-test-084-line47 | task047-channel-a-manual-test-084-line47`
- `Task047 LINE Fixture User manual-test-084-line47`

Review:

- Labels are sufficient to identify org A / B, channel A / B, customer A / B, case A / B, and identity display name.
- Raw LINE user id is not present.
- Customer mobile is not present.
- Channel secret / access token are not present.

## RBAC Graph Inventory Review

RBAC smoke did not complete, so this task reviewed partial marker rows only.

### `manual-test-084-027e`

Because `SMOKE_RUN_ID` matching for safe text columns uses substring matching, `manual-test-084-027e` also matched some `manual-test-084-027e-db` rows. This is safe but imprecise when one run id is a prefix of another. Future live reviews should use unique non-prefix run ids.

Observed non-zero entities:

| Entity | Count | Risk |
| --- | ---: | --- |
| organizations | 4 | high |
| dispatch_units | 4 | medium |
| audit_logs | 1 | medium |
| users | 2 | high |

Representative labels:

- `task027e-manual-test-084-027e-db-org-b | Task 027E Organization B manual-test-084-027e-db`
- `task027e-manual-test-084-027e-db-du-b | Task 027E Dispatch Unit B manual-test-084-027e-db`
- `Task027E Regular User manual-test-084-027e | auth.login_success | user`
- `task027e-disabled-manual-test-084@example.com | Task027E Disabled User manual-test-084-027e | customer_service | inactive`
- `task027e-regular-a-manual-test-084@example.com | Task027E Regular User Updated manual-test-084-027e | customer_service | active`

Review:

- User labels are sufficient to identify task and fixture user.
- Organization / dispatch unit labels are sufficient to identify task and smokeRunId.
- Passwords, password hashes, token, and `DATABASE_URL` are not present.
- No roles / role_permissions / user_roles / user_organizations were available from a completed RBAC fixture because the smoke failed before role creation / assignment.

### `manual-test-084-027e-db`

Observed non-zero entities:

| Entity | Count | Risk |
| --- | ---: | --- |
| organizations | 2 | high |
| dispatch_units | 2 | medium |

Review:

- Partial fixture labels are sufficient for org / dispatch unit manual inspection.
- No password, token, password hash, or `DATABASE_URL` is present.
- No completed RBAC role graph was available due to the role key constraint failure.

## Label Tuning

No inventory script changes were made in Task 084.

Task 083 appointment label tuning remains in place. LINE graph labels were already clear enough for manual inventory. RBAC output exposed a smoke compatibility issue, but changing smoke:027e behavior is outside this task.

## Skipped Table / Query Failed Behavior

The local migrated DB contained all configured inventory tables.

Observed:

- No skipped tables for the tested filters.
- No table-level `query_failed`.
- No top-level DB error.

Expected behavior remains:

- missing table -> `table_not_found`
- no supported filter columns -> `no_supported_filter_columns`
- created-at filter without `created_at` -> `created_at_column_not_found`
- table query failure -> `query_failed` with redacted detail

## Redaction / Safety Confirmation

Confirmed:

- No `DATABASE_URL` in inventory output.
- No customer mobile in inventory output.
- No raw LINE user id in inventory output.
- No LINE channel secret / access token in inventory output.
- No password / password hash in inventory output.
- No token / secret in inventory output.
- No full payload in inventory output.
- `cleanupSupported` stayed `false`.
- `destructiveCleanupImplemented` stayed `false`.

LINE smoke logs only printed masked LINE user ids.

## Why Cleanup Still Is Not Implemented

This task is inventory review only.

Even in local/test DB, cleanup remains out of scope because the graph can include:

- cases / customers / appointments / reports
- LINE channels / customer LINE identities
- audit logs / timeline messages
- users / roles / permissions

Shared Zeabur runtime must never run destructive cleanup. Any future cleanup task must be separate, opt-in, isolated to local / CI DB, guarded by dry-run and environment checks, and ordered by dependencies.

## Known Limitations

- Task046 DB fallback path was not executed because Admin API identity linking worked.
- RBAC `smoke:027e` did not complete due to:
  - first run missing `DATABASE_URL`
  - second run role key check constraint failure
  - partial fixture collisions from the first failed run
- No complete `roles` / `role_permissions` / `user_roles` / `user_organizations` inventory sample was produced.
- `SMOKE_RUN_ID` text matching is substring-based for safe text columns, so prefix-like run ids can match related suffix run ids.
- Local/test fixture rows remain in local DB. No cleanup was performed.

## Next Task Suggestion

Recommended next task:

**Task 085 - smoke:027e Marker Compatibility / Role Key Constraint Fix Planning**

Suggested scope:

- Review `smoke:027e` role key generation against `roles_default_role_key_check`.
- Plan or implement a minimal smoke-only marker adjustment so role keys use underscore-safe format while preserving `SMOKE_RUN_ID` in safe text fields / metadata.
- Re-run RBAC smoke in local/test DB.
- Re-run inventory for a completed RBAC graph.
- Keep cleanup unsupported.
