# Task 085 - smoke:027e Marker Compatibility / Role Key Constraint Fix

## 功能範圍

本任務修正 `smoke:027e` 的 smoke fixture marker compatibility，讓 marker-enabled role key 符合現有 `roles_default_role_key_check`。

本任務只做 smoke / inventory label 層級的小修：

- 不改 DB constraint
- 不新增 migration
- 不改 production RBAC behavior
- 不改 auth behavior
- 不改 smoke 驗證邏輯
- 不做 cleanup
- 不做 delete / update / unlink / disable
- 不做 AI 自動判斷

## Role Key Constraint

`roles.role_key` constraint:

```sql
CONSTRAINT roles_default_role_key_check CHECK (
    role_key IN (
        'admin',
        'customer_service',
        'dispatch_manager',
        'engineer',
        'auditor',
        'system'
    )
    OR role_key ~ '^[a-z][a-z0-9_]*$'
)
```

The custom smoke role key must therefore:

- start with a lowercase letter
- contain only lowercase letters, digits, and underscores
- not contain hyphens

## Failure Cause From Task 084

Before this fix, `smoke:027e` generated:

```js
roleKey: `task027e-limited-${shortSmokeRunId}`
```

`shortSmokeRunId` preserves hyphens, so a run id like `manual-test-084-027e-db` produced a role key with hyphens.

That failed the DB constraint:

```text
new row for relation "roles" violates check constraint "roles_default_role_key_check"
```

Task 084 also showed that direct `npm run smoke:027e` did not load `.env`, so `DATABASE_URL` was unavailable unless the shell explicitly exported it.

## Chosen Fix

The fix is smoke-only and minimal:

1. `scripts/smoke/027e_permission_regular_user_smoke.js` now loads `.env` via `dotenv.config(...)`.
2. The fixture role key converts the short smoke run id to an underscore-safe form:

```js
const roleKeySafeSmokeRunId = shortSmokeRunId.replace(/-/g, '_');

roleKey: `task027e_limited_${roleKeySafeSmokeRunId}`
```

Example:

```text
SMOKE_RUN_ID=manual-test-085-027e
role_key=task027e_limited_manual_test_085
```

This matches `^[a-z][a-z0-9_]*$`.

## smokeMarker Helper

`scripts/smoke/helpers/smokeMarker.js` was not changed.

Reason:

- The compatibility issue is specific to `roles.role_key`.
- Other smoke fixtures safely use hyphenated marker fields for organization code, dispatch unit code, customer names, case descriptions, LINE channel code, and smoke prefixes.
- Keeping the conversion local to `smoke:027e` avoids unintended changes to smoke:028 / 029 / 046 / 047 / 071.

## smoke:027e Re-run Result

Local/test DB and API were used:

```bash
brew services start postgresql@16
npm run db:migrate
npm run db:seed
PORT=3000 npm run dev
SMOKE_RUN_ID=manual-test-085-027e API_BASE_URL=http://127.0.0.1:3000 npm run smoke:027e
```

Result:

- PASS
- 12 / 12 passed

The role fixture was created successfully:

```text
roleKey: task027e_limited_manual_test_085
```

The smoke verified:

- admin login
- limited fixture role creation through `DATABASE_URL`
- organization A / B creation
- dispatch unit A / B creation
- regular user create response hides password hash
- role assignment and organization membership
- regular user login
- regular user cannot read global audit logs
- regular user cannot read global notification APIs
- regular user sees only own organization dispatch units
- regular user cannot cross organization
- disabled user cannot login and user responses hide password hash

No DB URL, token, password, password hash, or full payload was printed.

## RBAC Inventory Result

Command:

```bash
DRY_RUN=1 SMOKE_RUN_ID=manual-test-085-027e npm run smoke:cleanup:inventory
```

Result:

- PASS
- `destructiveCleanupImplemented=false`
- `cleanupSupported=false`

Entity summary:

| Entity | Count | Risk |
| --- | ---: | --- |
| organizations | 2 | high |
| dispatch_units | 2 | medium |
| audit_logs | 1 | medium |
| roles | 1 | high |
| role_permissions | 3 | high |
| users | 2 | high |
| user_roles | 1 | high |
| user_organizations | 1 | high |

Representative labels:

- Role:
  - `task027e_limited_manual_test_085 | Task 027E Limited Smoke Role manual-test-085-027e | Task027E smoke manual-test-085-027e limited regular user fixture role`
- Role permissions:
  - `task027e_limited_manual_test_085 | audit_logs.read | ...`
  - `task027e_limited_manual_test_085 | notifications.read | ...`
  - `task027e_limited_manual_test_085 | dispatch_units.manage | ...`
- Users:
  - `task027e-disabled-manual-test-085@example.com | Task027E Disabled User manual-test-085-027e | customer_service | inactive`
  - `task027e-regular-a-manual-test-085@example.com | Task027E Regular User Updated manual-test-085-027e | customer_service | active`
- User role:
  - `task027e-regular-a-manual-test-085@example.com | Task027E Regular User Updated manual-test-085-027e | task027e_limited_manual_test_085 | ...`
- User organization:
  - `Task027E smoke manual-test-085-027e regular user org A membership | task027e-regular-a-manual-test-085@example.com | Task027E Regular User Updated manual-test-085-027e | task027e-manual-test-085-027e-org-a | Task 027E Organization A manual-test-085-027e | ...`

## Inventory Label Tuning

The inventory script was tuned to make RBAC relationship rows easier to inspect manually.

Changed relationship labels:

- `role_permissions`
  - now includes related `role_key` and `permission_key`
- `user_roles`
  - now includes related user email / display name and role key
- `user_organizations`
  - now includes role note, user email / display name, organization code / name

These are safe fields and do not include:

- password
- password hash
- token
- secret
- `DATABASE_URL`
- full payload

## Redaction / Safety Confirmation

Confirmed:

- `DATABASE_URL` was not printed.
- admin / regular / disabled user passwords were not printed.
- password hashes were not printed.
- tokens / secrets were not printed.
- full payload was not printed.
- inventory output remained read-only.
- `cleanupSupported=false`.
- `destructiveCleanupImplemented=false`.

## Why No Cleanup

Cleanup remains out of scope.

RBAC fixtures are high risk because they touch:

- roles
- role_permissions
- users
- user_roles
- user_organizations
- organizations
- dispatch_units

Future cleanup, if any, must be a separate local / CI isolated DB task with dry-run, dependency order, explicit environment guards, and no shared Zeabur destructive cleanup.

## Why No DB Constraint Change

The production constraint is valid and intentional. Smoke fixture data should conform to production constraints, not weaken them.

This task changes only the smoke fixture role key format.

## Known Limitations

- The role key safe id uses `shortSmokeRunId`, so long run ids are truncated in `role_key`.
- The full `smokeRunId` remains available in role name, description, metadata, organization codes/names, user emails/display names, and membership note.
- Reusing the same `SMOKE_RUN_ID` can still collide with unique role/user/org codes.
- Local/test fixture rows remain in the local DB. No cleanup was performed.

## Next Task Suggestion

Recommended next task:

**Task 086 - RBAC Smoke Inventory Runbook / Relationship Label Review**

Suggested scope:

- Re-run `smoke:027e` with a fresh unique run id.
- Capture full inventory output for RBAC graph.
- Review if relationship labels are enough for manual inspection.
- Document high-risk cleanup boundaries for RBAC fixtures.
- Keep cleanup unsupported.
