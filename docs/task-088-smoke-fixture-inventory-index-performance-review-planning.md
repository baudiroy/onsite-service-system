# Task 088 - Smoke Fixture Inventory Index / Performance Review Planning

## 功能范围

本任务针对 `scripts/smoke/cleanup/inventory_smoke_fixtures.js` 的 read-only inventory 查询方式做 index / performance / shared runtime query safety planning。

本任务只做规划与文件：

- 不新增 migration。
- 不新增 index。
- 不启用 `pg_trgm`。
- 不修改 DB schema。
- 不修改 production API behavior。
- 不修改 inventory script 行为。
- 不做 cleanup。
- 不写 delete / update SQL。
- 不让 AI 参与 cleanup / fixture 判断。

## 当前 Inventory Query Behavior

Inventory script：

```text
scripts/smoke/cleanup/inventory_smoke_fixtures.js
```

NPM command：

```bash
npm run smoke:cleanup:inventory
```

固定模式：

```text
mode=inventory-only
dryRun=true
destructiveCleanupImplemented=false
cleanupSupported=false
```

### Required Guards

Script 目前要求：

- `DRY_RUN=1`
- `DATABASE_URL`
- 至少一个 filter：
  - `SMOKE_RUN_ID`
  - `SMOKE_TASK_CODE`
  - `SMOKE_PREFIX`
  - `CREATED_FROM` / `CREATED_TO`

缺少 guard 时会拒绝执行。

### Marker Filters

目前 marker filters：

- `SMOKE_RUN_ID`
- `SMOKE_TASK_CODE`
- `SMOKE_PREFIX`

对 safe text columns 使用：

```sql
LOWER(column::text) LIKE LOWER('%marker%')
```

这能支援历史 fixture 与不同 marker 写法，但在 large shared DB 上可能造成 sequential scan。

### Date Range Filters

`CREATED_FROM` / `CREATED_TO` 使用 `created_at` 范围：

```sql
created_at >= $createdFrom
created_at <= $createdTo
```

若 table 没有 `created_at`，该 entity 会 skipped。

### Safe Text Columns

目前会搜寻的 safe text columns 包含：

- organizations: `organization_code`, `organization_name`
- dispatch_units: `code`, `name`
- customers: `customer_name`
- cases: `case_no`, `model_no`, `problem_description`
- dispatch_assignments: `assignment_note`
- appointments: `note`, `reschedule_reason`, `incomplete_reason`, `next_action`, `visit_result`
- field_service_reports: `diagnosis_result`, `repair_action`, `repair_result`, `engineer_note`
- case_messages: `sender_display_name`, `body_text`
- audit_logs: `actor_display_name`, `action`, `entity_type`
- line_channels: `channel_code`, `channel_name`, `channel_id`
- customer_line_identities: `display_name`
- roles: `role_key`, `name`, `description`
- users: `email`, `display_name`
- user_organizations: `role_note`

明确不使用 unsafe fields：

- customer mobile / phone / tel
- raw LINE user id
- password / password_hash
- token / secret
- payload / raw payload
- `DATABASE_URL`

### Role Metadata Matching

`roles` 支援 metadata matching：

- `metadata->>'smokeRunId' = SMOKE_RUN_ID`
- `metadata->>'smokePrefix' LIKE SMOKE_TASK_CODE / SMOKE_PREFIX`

`SMOKE_RUN_ID` 对 metadata 是精准等于，其他 safe text fields 仍是 substring matching。

### Relationship Matching

RBAC relationship tables 没有直接 marker text 时，会透过 related rows 匹配：

- `role_permissions` 透过 related `roles`
- `user_roles` 透过 related `users` / `roles`
- `user_organizations` 透过 related `users` / `organizations`

这些 query 使用 `EXISTS` subquery，适合 inventory correctness，但在 large DB 上可能比单表 marker 查找更重。

## Performance Risk 盘点

### 1. ILIKE / Substring Matching on Text Columns

目前使用 `LOWER(column) LIKE LOWER('%marker%')`。这类 query 在一般 btree index 上通常无法有效利用前缀索引。

潜在高成本字段：

- organization code / name
- dispatch unit code / name
- customer name
- case `problem_description`
- appointment note / incomplete reason
- field service report diagnosis / repair text
- line channel code / name
- user email / display name
- role name / description

其中长文本字段如 `problem_description`、appointment note、service report text、case message body，如果 table 变大，substring scan 成本会增加。

### 2. Date Range Only Query

只使用 `CREATED_FROM` / `CREATED_TO` 时，script 会对所有支援 `created_at` 的 entities 做范围查询。

在 large shared DB 上，若时间跨度很大，可能扫描大量非 smoke records。

风险：

- output count 很大，不利人工 review。
- 查询时间增长。
- 可能影响 shared runtime DB。

### 3. Broad Task Code Query

例如：

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

这类 query 会匹配所有历史 Task028 marker。若 smoke 长期执行，结果可能非常多。

风险：

- 盘点范围过宽。
- 与 date range 搭配不足时，人工 review 成本高。
- substring matching 可能命中 prefix-like records。

### 4. Relationship Graph Query

RBAC graph：

- `role_permissions`
- `user_roles`
- `user_organizations`

这些 tables 依赖 related role / user / organization marker matching。

风险：

- 需要 EXISTS subquery。
- 若 roles/users/organizations 量大，query planning 成本会上升。
- RBAC graph 是 high risk，只能 inventory，不应 cleanup。

### 5. JSON Metadata Query

目前 roles metadata 支援：

```sql
metadata->>'smokeRunId'
metadata->>'smokePrefix'
```

风险：

- 若 future smoke 大量使用 role metadata，且没有 expression index，metadata scan 可能变慢。
- 目前只有 roles 使用 metadata marker，范围可控。

## Shared Runtime Query Guard 建议

本任务不实作 guard，只提出未来可考虑的方向。

### Avoid Broad Date-range Only Queries

Shared runtime 上应避免只用很宽的 date range。

未来可考虑：

- `INVENTORY_MAX_DATE_RANGE_DAYS=7` 或 `30`
- 若只有 `CREATED_FROM` / `CREATED_TO`，超过最大跨度就拒绝或 warning
- 若没有 task/run/prefix marker，要求 operator 明确确认

### Warn When Query Is Broad

未来 script 可在以下情境输出 warning：

- 只有 date range filter
- 只有 broad `SMOKE_TASK_CODE`
- `SMOKE_TASK_CODE` 未搭配 date range
- `SMOKE_PREFIX` 太短
- `SMOKE_RUN_ID` 缺失且 shared runtime flag 为 true

建议 warning 文案方向：

```text
This inventory query may be broad. Prefer SMOKE_RUN_ID or add CREATED_FROM/CREATED_TO.
```

### Future Runtime Flags

未来可考虑新增：

- `MAX_ROWS`
- `INVENTORY_MAX_DATE_RANGE_DAYS`
- `REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1`
- `ALLOW_BROAD_INVENTORY=1`
- `SHARED_RUNTIME=1`

第一版不实作，避免改变当前 operator workflow。

### Keep Sample Limits

目前 `sampleIds` / `sampleLabels` 最多 5 笔，建议保留。

未来若 count 很大，可考虑：

- 增加 top-level `broadQueryWarning`
- 增加 per-entity `sampleLimit`
- 增加 `countOnly` mode

但这些都应另案评估。

## Future Index Candidates

本任务不新增 index、不新增 migration。

以下仅为 future consideration。

### Marker Code / Name Fields

如果 shared DB inventory 变慢，可优先评估常见 marker fields。

可能候选：

- `organizations(organization_code)`
- `dispatch_units(code)`
- `line_channels(channel_code)`
- `roles(role_key)`
- `users(email)`

这些字段通常已有业务上的查找价值，且 smoke marker 常写入 code/key/email。

注意：目前 script 多使用 `%marker%` substring matching。普通 btree index 对 `%...%` 帮助有限，但对未来改成 prefix matching 或 exact matching 可能有帮助。

### created_at Fields

如果 date range inventory 常用，可评估：

- `organizations(created_at)`
- `customers(created_at)`
- `cases(created_at)`
- `appointments(created_at)`
- `field_service_reports(created_at)`
- `line_channels(created_at)`
- `roles(created_at)`
- `users(created_at)`
- `audit_logs(created_at)`

是否需要 index 应以实际 query plan 与 table size 决定。

### JSON Metadata Expression Index

若未来 roles metadata marker 查找频繁，可考虑：

```sql
CREATE INDEX ... ON roles ((metadata->>'smokeRunId'));
```

或针对 `smokePrefix` 建 expression index。

目前不新增，因为：

- marker inventory 不是核心 production path。
- roles table 当前 smoke fixture 量有限。
- expression index 需要 migration 与 DB impact review。

### Trigram / GIN Indexes

对于 `%marker%` substring matching，未来可考虑 PostgreSQL `pg_trgm` + GIN index。

可能适用：

- long text marker fields
- `problem_description`
- notes
- service report text fields

但目前不要引入：

- 不启用 `pg_trgm`
- 不新增 extension migration
- 不新增 trigram index

原因：

- extension 与 index 都有 DB 影响。
- 需要真实慢查询证据。
- shared runtime 上新增 index 必须经过 migration / deploy 风险评估。

## Operator Performance Guidance

推荐 filter 优先顺序：

1. `SMOKE_RUN_ID`
2. `SMOKE_PREFIX`
3. `SMOKE_TASK_CODE`
4. `CREATED_FROM` / `CREATED_TO`

### Prefer SMOKE_RUN_ID

已知 run id 时，优先使用：

```bash
DRY_RUN=1 SMOKE_RUN_ID=<run-id> npm run smoke:cleanup:inventory
```

这是最适合人工 review 单次 fixture graph 的方式。

### Use SMOKE_PREFIX for Known Text Prefix

已知 prefix 但不知道完整 run id 时：

```bash
DRY_RUN=1 SMOKE_PREFIX="Task071 browser-smoke" npm run smoke:cleanup:inventory
```

建议搭配 date range，避免长期历史结果过多。

### Use SMOKE_TASK_CODE Carefully

Task code 是 broad filter。

建议：

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task027E CREATED_FROM=2026-05-17T00:00:00Z CREATED_TO=2026-05-18T00:00:00Z npm run smoke:cleanup:inventory
```

如果只用 `SMOKE_TASK_CODE`，operator 应预期可能命中历史 fixtures。

### Use Date Range As Narrowing Filter

Date range 适合辅助缩小范围，不适合作为 large shared DB 上的唯一 filter。

避免：

```bash
DRY_RUN=1 CREATED_FROM=2025-01-01T00:00:00Z npm run smoke:cleanup:inventory
```

建议：

- 明确 `CREATED_TO`
- 控制跨度
- 搭配 task code / prefix
- 避开高峰时间跑 broad inventory

### Broad Query Runbook

如果必须在 shared runtime 上做 broad scan：

1. 记录原因。
2. 先确认是 read-only inventory。
3. 使用最小必要 date range。
4. 避开业务高峰。
5. 只读取 JSON output。
6. 不把 output 当 cleanup 指令。
7. 不执行任何 delete / update / unlink / disable。

## 为什么本任务不新增 Migration / Index

本任务只做 planning，因为目前：

- Inventory script 是辅助工具，不是 production request path。
- 尚未有 shared DB 慢查询证据。
- 新 index 会增加 migration、storage、write overhead 与 deploy 风险。
- `pg_trgm` / GIN index 需要 extension 与 DB impact review。
- 对 `%marker%` substring matching 的优化需要先确认真实 query pattern。

未来只有在 shared DB inventory 明显变慢，且 query plan 显示瓶颈时，才应另案评估 index。

## 为什么仍不做 Cleanup

Performance planning 与 cleanup 是不同问题。

即使 future index 让 inventory 更快，也不代表可以清资料。

Cleanup 仍维持：

- shared Zeabur runtime 禁止 destructive cleanup。
- inventory script 不 delete / update / unlink / disable。
- cleanup unsupported。
- RBAC graph high risk，只 inventory。
- AI 不参与 cleanup / fixture 判断。

## 已知限制

- 当前 script 使用 substring matching，可能在大型 DB 上变慢。
- `SMOKE_TASK_CODE` 与 `SMOKE_PREFIX` 可能命中历史 fixtures。
- date range only 可能扫描大量非 smoke records。
- related matching for RBAC graph 比单表 marker matching 更重。
- roles metadata query 目前没有 dedicated expression index。
- 当前任务不提供 EXPLAIN ANALYZE 数据。
- 当前任务不修改 script guard，也不新增 performance warning。

## 下一步 Task 089 建议

建议：

Task 089 - Smoke Fixture Inventory Query Explain / Local Performance Baseline

范围：

- 在 local/test DB 用 non-sensitive fixture data 跑 `EXPLAIN` / `EXPLAIN ANALYZE`。
- 记录各 filter pattern 的 query plan。
- 不新增 index。
- 不跑 shared runtime destructive actions。
- 不做 cleanup。

备选：

Task 089 - Inventory Strict Filter Guard Design

范围：

- 只设计 shared runtime broad query warning / date range limit。
- 不实作 cleanup。
