# Task 089 - Smoke Fixture Inventory Query Explain / Local Performance Baseline

## 功能範圍

本任務在 dedicated local/test PostgreSQL 上，對 Task 080 inventory script 的代表性查詢模式建立 `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` baseline。

本任務只做 local/test DB performance baseline 與文件：

- 不新增 migration。
- 不新增 index。
- 不啟用 `pg_trgm`。
- 不修改 DB schema。
- 不修改 production API behavior。
- 不修改 inventory script behavior。
- 不做 cleanup。
- 不寫 delete / update SQL。
- 不呼叫 API delete / disable / unlink。
- 不讓 AI 參與 cleanup / fixture 判斷。

## Local / Test DB 使用方式

使用 Task 083～086 的 dedicated local/test PostgreSQL。

啟動與確認：

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

文件與 output 未輸出 `DATABASE_URL` 或 DB password。

## Fixture Setup

本次建立 non-sensitive marker-enabled smoke fixtures：

```bash
SMOKE_RUN_ID=manual-test-089-task028 API_BASE_URL=http://127.0.0.1:3000 npm run smoke:028
SMOKE_RUN_ID=manual-test-089-rbac API_BASE_URL=http://127.0.0.1:3000 npm run smoke:027e
SMOKE_RUN_ID=manual-test-089-line46 API_BASE_URL=http://127.0.0.1:3000 npm run smoke:046
```

結果：

- `smoke:028`: PASS，13 / 13。
- `smoke:027e`: PASS，12 / 12。
- `smoke:046`: PASS，9 / 9。

沒有使用真實客戶資料。
沒有 cleanup。
沒有輸出 token / password / `DATABASE_URL` / customer mobile / raw LINE user id。

## EXPLAIN Method

使用臨時 local helper：

```text
/private/tmp/task089_explain_inventory_baseline.js
```

此 helper：

- 從 repo `.env` 讀取 DB 連線，但不輸出 `DATABASE_URL`。
- 使用 parameterized query。
- 執行 `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`。
- 只輸出 plan summary，不輸出 raw SQL with sensitive values。
- 不執行 destructive SQL。

執行：

```bash
node /private/tmp/task089_explain_inventory_baseline.js
```

## Query Patterns Reviewed

本次 review 代表性 query patterns：

1. `cases_run_id_marker`
   - graph: multi-dispatch
   - filter: `SMOKE_RUN_ID=manual-test-089-task028`
   - 代表精準 marker 查詢。

2. `cases_broad_task_code`
   - graph: multi-dispatch
   - filter: `SMOKE_TASK_CODE=Task028`
   - 代表歷史 fixture broad scan。

3. `appointments_date_range`
   - graph: multi-dispatch
   - filter: `CREATED_FROM=2026-05-17T00:00:00Z`, `CREATED_TO=2026-05-18T00:00:00Z`
   - 代表 created_at range 查詢。

4. `roles_metadata_run_id`
   - graph: RBAC
   - filter: `SMOKE_RUN_ID=manual-test-089-rbac`
   - 代表 `roles.metadata->>'smokeRunId'` 查詢。

5. `role_permissions_related_roles`
   - graph: RBAC
   - filter: related roles
   - 代表 `role_permissions` 透過 related `roles` matching。

6. `user_roles_related_user_role`
   - graph: RBAC
   - filter: related users / roles
   - 代表 `user_roles` relationship matching。

7. `user_organizations_related_user_org`
   - graph: RBAC
   - filter: related users / organizations
   - 代表 `user_organizations` relationship matching。

8. `line_channels_run_id_marker`
   - graph: LINE
   - filter: `SMOKE_RUN_ID=manual-test-089-line46`
   - 代表 `line_channels` marker matching。

9. `customer_line_identities_display_marker`
   - graph: LINE
   - filter: `SMOKE_RUN_ID=manual-test-089-line46`
   - 代表 `customer_line_identities.display_name` marker matching。

## Baseline Findings

Local/test DB 資料量很小，所以所有查詢 execution time 都低於 1 ms。

| Query | Top node | Seq scan | Index scan | Execution time |
| --- | --- | --- | --- | ---: |
| cases_run_id_marker | Aggregate | yes | no | 0.120 ms |
| cases_broad_task_code | Aggregate | yes | no | 0.046 ms |
| appointments_date_range | Aggregate | yes | no | 0.036 ms |
| roles_metadata_run_id | Aggregate | yes | no | 0.052 ms |
| role_permissions_related_roles | Aggregate | yes | no | 0.182 ms |
| user_roles_related_user_role | Aggregate | yes | no | 0.110 ms |
| user_organizations_related_user_org | Aggregate | yes | no | 0.121 ms |
| line_channels_run_id_marker | Aggregate | yes | no | 0.039 ms |
| customer_line_identities_display_marker | Aggregate | yes | no | 0.030 ms |

觀察：

- 所有代表查詢在 local/test DB 都使用 Seq Scan。
- 這符合目前 inventory 的 `%marker%` substring matching 方式。
- 在小資料量 local/test DB 上，Seq Scan 成本極低，無法證明需要 index。
- Relationship graph 查詢雖有較高 estimated cost，但 actual execution time 仍低。

## Sequential Scan / Join Observations

### Multi-dispatch marker queries

`cases_run_id_marker` 與 `cases_broad_task_code` 都對 `cases` 做 Seq Scan。

原因：

- filter 使用 `LOWER(column) LIKE LOWER('%marker%')`。
- 普通 btree index 無法有效支援 leading wildcard substring search。

Local baseline：

- run id query actual rows: 2
- broad task code query actual rows: 4
- execution time: 0.120 ms / 0.046 ms

### Date range query

`appointments_date_range` 對 `appointments` 做 Seq Scan。

Local baseline：

- actual rows: 6
- execution time: 0.036 ms

在大型 DB 上，如果 date range 很寬，這類查詢可能需要 `created_at` index 或更嚴格 date range guard。

### RBAC relationship queries

`role_permissions_related_roles`：

- node types: Aggregate / Hash Join / Seq Scan / Hash
- scanned `role_permissions` and related `roles`
- execution time: 0.182 ms

`user_roles_related_user_role`：

- node types: Aggregate / Seq Scan
- scanned `user_roles` with related `users` / `roles`
- execution time: 0.110 ms

`user_organizations_related_user_org`：

- node types: Aggregate / Seq Scan
- scanned `user_organizations` with related `users` / `organizations`
- execution time: 0.121 ms

Local baseline 顯示 relationship query 正確可用，但在大資料量 DB 上可能比單表 marker matching 更重。

### Roles metadata query

`roles_metadata_run_id` 對 `roles` 做 Seq Scan。

Filter 包含：

- role key / name / description substring
- `metadata->>'smokeRunId' = <runId>`

Local baseline：

- actual rows: 1
- execution time: 0.052 ms

目前不需要 metadata expression index。若未來 roles fixture 或 inventory usage 增長，再另案評估。

### LINE graph queries

`line_channels_run_id_marker`：

- Seq Scan on `line_channels`
- actual rows: 1
- execution time: 0.039 ms

`customer_line_identities_display_marker`：

- Seq Scan on `customer_line_identities`
- actual rows: 1
- execution time: 0.030 ms

LINE graph baseline 正常，未輸出 raw LINE user id。

## Whether Future Index Is Needed Now

目前不建議新增 index。

原因：

- Local/test DB baseline 全部 execution time < 1 ms。
- 目前沒有 shared DB 慢查詢證據。
- 代表查詢使用 `%marker%` substring matching，普通 btree index 幫助有限。
- Trigram / GIN 需要 extension / migration / DB impact review。
- Inventory 是 operator 工具，不是 production request path。

未來只有在 shared DB read-only inventory 明顯變慢時，才應另案評估：

- `created_at` indexes for frequent date range inventory
- marker code/key/email exact or prefix lookup indexes
- roles metadata expression index
- `pg_trgm` + GIN for substring matching

## Why No Index / Migration Added

本任務只是 baseline。

新增 index 需要：

- migration
- deployment planning
- write overhead assessment
- storage impact review
- query plan evidence

目前 baseline 不足以支持新增 migration / index。

## Why No Cleanup

Performance baseline 不改 cleanup policy。

Inventory 仍維持：

- `cleanupSupported=false`
- `destructiveCleanupImplemented=false`
- shared Zeabur runtime 禁止 destructive cleanup
- 不 delete
- 不 update
- 不 unlink
- 不 disable
- 不呼叫 cleanup API
- RBAC graph high risk，只 inventory

## Redaction / Safety Confirmation

本次 output 未包含：

- `DATABASE_URL`
- DB password
- admin / regular / disabled user passwords
- password hash
- token
- secret
- customer mobile
- raw LINE user id
- channel secret / channel access token
- full payload / raw payload

EXPLAIN helper 只輸出 plan summary、table names、node types、row counts、execution time。

## Known Limitations

- Local/test DB 資料量很小，不能代表 shared DB 大資料量 performance。
- Baseline 沒有建立大量 fixture 壓測資料。
- 未執行 shared runtime EXPLAIN。
- 未測試 `pg_trgm` / GIN / expression index 效果。
- 未修改 inventory script guard 或 performance warning。
- EXPLAIN helper 是 `/private/tmp` 臨時工具，不是 production code path。

## 下一步 Task 090 建議

建議：

Task 090 - Inventory Strict Filter Guard Design

範圍：

- 設計 shared runtime broad query warning。
- 設計 maximum date range guard。
- 設計 `REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME` / `ALLOW_BROAD_INVENTORY`。
- 不實作 cleanup。
- 不新增 migration / index。

備選：

Task 090 - Smoke Fixture Inventory Large Fixture Performance Sandbox

僅在需要更多 performance evidence 時，在 isolated local DB 造非敏感測試資料做 query plan comparison，仍不碰 shared runtime cleanup。
