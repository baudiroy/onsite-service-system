# Task 086 - RBAC Smoke Inventory Runbook / Relationship Label Review

## 功能範圍

本任務針對 `smoke:027e` 的 RBAC fixture graph 做 fresh local/test DB review，確認 Task 085 修正後：

- `role_key` marker 符合目前 DB constraint。
- `smoke:027e` 可成功建立完整 RBAC fixture graph。
- `smoke:cleanup:inventory` 可用 `SMOKE_RUN_ID` 盤點 roles / users / memberships。
- relationship sample labels 足夠人工辨識 fixture 關聯。
- RBAC fixture cleanup boundaries 明確文件化。

本任務不做 cleanup、不刪資料、不改 production RBAC behavior、不改 smoke 驗證邏輯。

## Local / Test DB 使用方式

本任務使用 dedicated local/test PostgreSQL，不使用 shared Zeabur runtime 做任何 cleanup。

執行方式：

```bash
brew services start postgresql@16
npm run db:migrate
npm run db:seed
PORT=3000 npm run dev
```

實際結果：

- `npm run db:migrate`: PASS，001～019 已 applied / skipped。
- `npm run db:seed`: PASS。
- local API server: `http://127.0.0.1:3000`。

執行與文件中未輸出 `DATABASE_URL` 或 DB password。

## Fresh SMOKE_RUN_ID

本次使用：

```text
manual-test-086-rbac
```

選用 fresh unique run id，避免 Task 084 / Task 085 的 prefix collision。

## smoke:027e Re-run Result

執行：

```bash
SMOKE_RUN_ID=manual-test-086-rbac API_BASE_URL=http://127.0.0.1:3000 npm run smoke:027e
```

結果：

- PASS，12 / 12。
- admin login 成功。
- limited role 透過 `DATABASE_URL` 建立成功。
- regular user / disabled user 建立成功。
- limited role assignment 與 organization A membership 建立成功。
- regular user 無法讀 global audit logs。
- regular user 無法讀 global notification APIs。
- regular user 只能看到自己 organization 的 dispatch units。
- regular user 無法跨 organization 讀 dispatch unit endpoint。
- disabled user 無法登入。
- user response 未顯示 password hash。

## Role Key Format Confirmation

目前 `roles.role_key` constraint 允許：

- default role keys，或
- `^[a-z][a-z0-9_]*$`

本次 fresh run 產生：

```text
task027e_limited_manual_test_086
```

確認符合 `^[a-z][a-z0-9_]*$`。

完整 `smokeRunId` 仍保留於 role name / description / metadata，例如：

- `Task 027E Limited Smoke Role manual-test-086-rbac`
- `Task027E smoke manual-test-086-rbac limited regular user fixture role`
- metadata `smokeRunId=manual-test-086-rbac`

## RBAC Inventory Command

執行：

```bash
DRY_RUN=1 SMOKE_RUN_ID=manual-test-086-rbac npm run smoke:cleanup:inventory
```

結果：

- PASS。
- `mode=inventory-only`
- `dryRun=true`
- `destructiveCleanupImplemented=false`
- `cleanupSupported=false`
- warning 固定顯示 inventory-only 與 shared Zeabur runtime 禁止 destructive cleanup。

## RBAC Entity Counts

本次 `manual-test-086-rbac` inventory 摘要：

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
| customers | 0 | low |
| cases | 0 | low |
| dispatch_assignments | 0 | low |
| appointments | 0 | low |
| field_service_reports | 0 | low |
| case_messages | 0 | medium |
| line_channels | 0 | medium |
| customer_line_identities | 0 | medium |

## Relationship Label Review

### roles

Sample label 包含：

- role key
- role name
- role description

範例：

```text
task027e_limited_manual_test_086 | Task 027E Limited Smoke Role manual-test-086-rbac | Task027E smoke manual-test-086-rbac limited regular user fixture role
```

足夠辨識 Task027E、smokeRunId 與 limited role fixture。

### role_permissions

Task 086 做了 safe label tuning，sample label 現在包含：

- role key
- role name
- permission key
- permission description
- role id
- permission id

範例：

```text
task027e_limited_manual_test_086 | Task 027E Limited Smoke Role manual-test-086-rbac | audit_logs.read | Read audit logs | <roleId> | <permissionId>
```

這足夠人工確認 limited role 被授予的 permission scope。

### users

Sample label 包含：

- email
- display name
- user type
- status

範例：

```text
task027e-regular-a-manual-test-086@example.com | Task027E Regular User Updated manual-test-086-rbac | customer_service | active
```

輸出未包含 password / password_hash / token。

### user_roles

Task 086 做了 safe label tuning，sample label 現在包含：

- user email
- user display name
- role key
- role name
- user id
- role id

範例：

```text
task027e-regular-a-manual-test-086@example.com | Task027E Regular User Updated manual-test-086-rbac | task027e_limited_manual_test_086 | Task 027E Limited Smoke Role manual-test-086-rbac | <userId> | <roleId>
```

這足夠人工確認 regular user 與 limited role 的關聯。

### user_organizations

Sample label 包含：

- membership role_note
- user email
- user display name
- organization code
- organization name
- user id
- organization id

範例：

```text
Task027E smoke manual-test-086-rbac regular user org A membership | task027e-regular-a-manual-test-086@example.com | Task027E Regular User Updated manual-test-086-rbac | task027e-manual-test-086-rbac-org-a | Task 027E Organization A manual-test-086-rbac | <userId> | <organizationId>
```

這足夠人工確認 regular user 只掛在 organization A。

### organizations / dispatch_units

Sample label 包含 code / name，例如：

- `task027e-manual-test-086-rbac-org-a | Task 027E Organization A manual-test-086-rbac`
- `task027e-manual-test-086-rbac-du-a | Task 027E Dispatch Unit A manual-test-086-rbac`

足夠辨識 org A / B 與 dispatch unit A / B。

### audit_logs

Sample label 包含：

- actor display name
- action
- entity type

範例：

```text
Task027E Regular User manual-test-086-rbac | auth.login_success | user
```

輸出未包含 raw payload 或 internal sensitive details。

## Label Tuning

本任務對 `scripts/smoke/cleanup/inventory_smoke_fixtures.js` 做了小型 safe label tuning：

- `role_permissions` 增加 role name 與 permission description。
- `user_roles` 增加 role name。

未調整 query filter。
未加入 unsafe fields。
未新增 cleanup mode。
未寫任何 delete / update / unlink / disable。

## Redaction / Safety Confirmation

本次 smoke 與 inventory output 確認未輸出：

- `DATABASE_URL`
- DB password
- admin / regular / disabled user passwords
- password hash
- API token
- secret
- full payload / raw payload
- customer mobile
- raw LINE user id

Inventory output 固定顯示：

- `cleanupSupported=false`
- `destructiveCleanupImplemented=false`

## RBAC High-risk Cleanup Boundaries

RBAC graph 為 high risk，包含：

- roles
- role_permissions
- users
- user_roles
- user_organizations
- organizations
- dispatch_units

Shared runtime rule：

- 不做 destructive cleanup。
- 不刪 roles。
- 不刪 users。
- 不刪 permissions。
- 不刪 role_permissions。
- 不刪 user_roles。
- 不刪 user_organizations。
- 不刪 organizations / dispatch_units。
- 不使用 API delete / disable / unlink 當 cleanup。
- 不使用 DB delete / update cleanup。

未來若要在 local / CI isolated DB 評估 cleanup，必須另外開 task，且至少符合：

- 必須是 isolated DB。
- 必須先 `DRY_RUN=1`。
- 必須顯式 `ALLOW_SMOKE_DB_CLEANUP=1`。
- 必須有 strict `SMOKE_RUN_ID`。
- 必須有 dependency ordering。
- 必須保護 seed admin / core permissions / default roles。
- 必須明確拒絕 shared Zeabur runtime。

## 為何仍不做 Cleanup

本階段目標是 inventory / relationship review。

RBAC fixture graph 涉及登入、權限、角色、組織 membership。即使資料有 marker，也不應在 shared runtime 或未隔離環境中自動清理。第一版只確認 inventory 能幫助人工盤點。

## 已知限制

- local/test smoke fixture rows 仍留在 local DB，未清理。
- `role_key` 使用 short run id，長 `SMOKE_RUN_ID` 會在 role key 中被截短；完整 run id 仍在 role metadata / name / description。
- 重複使用相同 `SMOKE_RUN_ID` 可能撞唯一值。
- Inventory label 是人工盤點輔助，不代表 cleanup plan。
- `audit_logs` 因 retention concern 仍只 inventory，不做 cleanup。

## 下一步 Task 087 建議

建議：

Task 087 - Smoke Fixture Inventory Read-only Operator Guide / Shared Runtime Policy

範圍：

- 整合 028 / 029 / 046 / 047 / 027e / 071 的 inventory operator guide。
- 明確列出 shared Zeabur runtime 只讀盤點流程。
- 定義何時可用 local / CI isolated DB。
- 保留 cleanup future design，但不實作 destructive cleanup。
