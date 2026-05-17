# Task 090 - Inventory Strict Filter Guard Design

## 功能範圍

本任務基於 Task 088 的 performance planning 與 Task 089 的 local EXPLAIN baseline，設計未來 shared runtime 上 `smoke:cleanup:inventory` 的 strict filter guard / broad query warning。

本任務只做 design / runbook / 文件：

- 不實作 cleanup。
- 不寫 delete / update SQL。
- 不呼叫 API delete / disable / unlink。
- 不新增 migration。
- 不新增 index。
- 不啟用 `pg_trgm`。
- 不修改 DB schema。
- 不修改 production API behavior。
- 不修改 inventory script behavior。
- 不修改 auth / RBAC behavior。
- 不修改 smoke 驗證邏輯。
- 不讓 AI 參與 cleanup / fixture 判斷。

## Current Guard Summary

目前 `scripts/smoke/cleanup/inventory_smoke_fixtures.js` 已有以下 guard：

1. `DRY_RUN=1` required

缺少時拒絕：

```text
This inventory script is read-only and requires DRY_RUN=1. No cleanup is implemented.
```

2. `DATABASE_URL` required

缺少時拒絕，且不輸出 `DATABASE_URL`。

3. At least one filter required

至少要有：

- `SMOKE_RUN_ID`
- `SMOKE_TASK_CODE`
- `SMOKE_PREFIX`
- `CREATED_FROM` / `CREATED_TO`

缺少時拒絕：

```text
Refusing to run inventory without SMOKE_RUN_ID, SMOKE_TASK_CODE, SMOKE_PREFIX, or CREATED_FROM/CREATED_TO.
```

4. Fixed no-cleanup output flags

Output 固定包含：

```text
mode=inventory-only
dryRun=true
destructiveCleanupImplemented=false
cleanupSupported=false
```

5. Redaction

目前 error handling 會 redacted：

- `DATABASE_URL`
- password
- token
- secret

Inventory query 也避開 unsafe fields，例如 customer mobile、raw LINE user id、password hash、payload。

## Why Strict Filter Guard Is Needed

Task 089 local EXPLAIN baseline 顯示：

- 代表查詢在 local/test DB 都很快，execution time < 1 ms。
- 代表查詢都觀察到 Seq Scan。
- Seq Scan 符合目前 `LOWER(column) LIKE LOWER('%marker%')` substring matching 行為。
- 大型 shared DB 上，broad task code 或 wide date range 可能掃描大量 rows。
- RBAC relationship query 透過 related roles / users / organizations，未來資料量大時可能比單表 marker 查詢更重。

因此 shared runtime 應加入更明確的 guard / warning 設計，避免 operator 無意間跑過寬的 read-only inventory。

## Proposed Env Flags

以下是未來 Task 091 可考慮實作的 env flags。本任務不實作。

### Shared Runtime Flag

建議使用：

```text
INVENTORY_SHARED_RUNTIME=1
```

或：

```text
SHARED_RUNTIME=1
```

建議採 `INVENTORY_SHARED_RUNTIME=1`，較不容易與其他 runtime 概念混淆。

用途：

- 明確告訴 inventory script 這次連的是 shared runtime。
- 啟用 shared runtime strict filter policy。
- 不代表允許 cleanup。

### Strict Filter Mode

建議使用：

```text
REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1
```

用途：

- 在 shared runtime 上拒絕 broad filters。
- 要求 `SMOKE_RUN_ID` 或足夠窄的 filter combination。

### Allow Broad Inventory Override

建議使用：

```text
ALLOW_BROAD_INVENTORY=1
```

用途：

- 只允許 read-only broad inventory。
- 不允許 cleanup。
- 應要求 warning 明確出現在 output。

建議第一版只讓 override 放行 broad task code / bounded date range，不放行過短 prefix 或超長 date range。

### Date Range Limit

建議使用：

```text
INVENTORY_MAX_DATE_RANGE_DAYS=7
```

預設可考慮 7 天。若 operator workflow 需要歷史盤點，可改 30 天，但應保守。

用途：

- 當只有 date range filter 時，限制最大跨度。
- 當 date range 搭配 broad task code 時，降低 shared runtime scan 風險。

## Date Range Guard Design

### Proposed Rules

1. `CREATED_FROM` / `CREATED_TO` 都存在時，計算天數跨度。
2. 若缺一邊，視為 open-ended date range，shared strict mode 下應拒絕。
3. 若只有 date range filter：
   - shared strict mode 下，跨度 <= max days 可 allow with warning。
   - 跨度 > max days 應 reject。
4. 若 date range 搭配 `SMOKE_TASK_CODE`：
   - shared strict mode 下，跨度 <= max days 可 allow with warning。
   - 跨度 > max days 應要求 `ALLOW_BROAD_INVENTORY=1` 或 reject。
5. 若有 `SMOKE_RUN_ID`：
   - date range 可作為 narrowing filter，不需因跨度拒絕，但可 warning 過寬。

### Suggested Default

```text
INVENTORY_MAX_DATE_RANGE_DAYS=7
```

Reason:

- Shared runtime 應以已知 run id 為主。
- Date-only scan 是人工歷史盤點的 fallback，不應成為常規入口。

## Broad Task Code Warning Design

`SMOKE_TASK_CODE` 是 broad filter，例如：

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

風險：

- 可能命中長期歷史 fixtures。
- 可能掃描很多 safe text columns。
- output 可能太大，不利人工 review。

Future behavior 建議：

- local/test DB：allow with warning。
- shared runtime + non-strict：allow with warning。
- shared runtime + strict：若只有 `SMOKE_TASK_CODE`，要求加 date range 或 `ALLOW_BROAD_INVENTORY=1`。
- shared runtime + strict + `SMOKE_TASK_CODE` + date range within max days：allow with warning。

Suggested warning:

```text
This inventory query may match historical fixtures because it uses only SMOKE_TASK_CODE. Prefer SMOKE_RUN_ID or add CREATED_FROM/CREATED_TO.
```

## Prefix Length Guard Design

`SMOKE_PREFIX` 可比 `SMOKE_TASK_CODE` 更精準，但若太短，也可能變成 broad query。

建議最小長度：

```text
INVENTORY_MIN_PREFIX_LENGTH=10
```

Rules:

- `SMOKE_PREFIX` trim 後少於 10 chars：
  - local/test DB：allow with warning。
  - shared runtime：reject。
- `SMOKE_PREFIX` >= 10 chars：
  - allow。
  - 若 shared strict mode 且沒有 date range，可 allow with warning。

Suggested error:

```text
SMOKE_PREFIX is too short for shared-runtime inventory. Use a longer prefix, SMOKE_RUN_ID, or add CREATED_FROM/CREATED_TO.
```

## Prefer Run Id

Shared runtime 最推薦：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 SMOKE_RUN_ID=<run-id> npm run smoke:cleanup:inventory
```

Reason:

- 最接近單次 fixture graph。
- 最容易人工 review。
- 最不容易命中歷史資料。

即使使用 `SMOKE_RUN_ID`，output 仍必須保留：

```text
cleanupSupported=false
destructiveCleanupImplemented=false
```

## Shared Runtime Decision Table

| Scenario | Shared runtime? | Filter | Suggested behavior |
| --- | --- | --- | --- |
| Known run id | yes | `SMOKE_RUN_ID` | Allow |
| Known run id + date range | yes | `SMOKE_RUN_ID` + date | Allow, optional warning if date range is wide |
| Only task code | yes | `SMOKE_TASK_CODE` | Warn; strict mode requires date range or `ALLOW_BROAD_INVENTORY=1` |
| Task code + 1 day date range | yes | `SMOKE_TASK_CODE` + bounded date | Allow with warning |
| Task code + 30 day date range | yes | broad but bounded | Allow only if max range allows it; otherwise require override or reject |
| Only date range 1 day | yes | date only | Allow with warning if within max days |
| Only date range 90 days | yes | date only | Reject in strict mode |
| Open-ended date range | yes | only `CREATED_FROM` or only `CREATED_TO` | Reject in strict mode |
| Prefix length < 10 | yes | short `SMOKE_PREFIX` | Reject |
| Prefix length >= 10 | yes | `SMOKE_PREFIX` | Allow with warning if no date range |
| No marker/date filter | yes/no | none | Already rejected |
| Broad task code | local/test | `SMOKE_TASK_CODE` | Allow with warning |
| Wide date range | local/test | date only | Allow with warning |

## Warning / Error Wording

Suggested warnings:

```text
This inventory query may be broad on shared runtime. Prefer SMOKE_RUN_ID or add CREATED_FROM/CREATED_TO.
```

```text
SMOKE_TASK_CODE can match historical fixtures. Prefer SMOKE_RUN_ID for a single run, or add a narrow CREATED_FROM/CREATED_TO range.
```

```text
Date-range-only inventory can scan many non-smoke records. Keep the range narrow and review output manually.
```

Suggested errors:

```text
Refusing broad shared-runtime inventory without ALLOW_BROAD_INVENTORY=1.
```

```text
Date range exceeds INVENTORY_MAX_DATE_RANGE_DAYS. Narrow the range or use SMOKE_RUN_ID.
```

```text
Open-ended date range is not allowed in shared-runtime strict mode. Provide both CREATED_FROM and CREATED_TO.
```

```text
SMOKE_PREFIX is too short for shared-runtime inventory. Use a longer prefix, SMOKE_RUN_ID, or add CREATED_FROM/CREATED_TO.
```

Suggested output field if implemented:

```json
{
  "broadQueryWarnings": [
    "This inventory query may match historical fixtures because it uses SMOKE_TASK_CODE without a date range."
  ]
}
```

## Future Task 091 Implementation Scope

If implemented, Task 091 should be limited to guard / warning behavior only.

Allowed:

- Add shared runtime flag parsing.
- Add strict filter decision function.
- Add warning output array.
- Add date range span validation.
- Add prefix length validation.
- Add manual command verification for guard cases.
- Keep output redacted.

Not allowed:

- cleanup.
- delete SQL.
- update SQL.
- API delete / disable / unlink cleanup.
- DB schema changes.
- migration.
- index.
- `pg_trgm`.
- production API behavior changes.
- auth / RBAC behavior changes.
- smoke validation logic changes.

Task 091 should preserve existing query behavior for allowed filters. It should only refuse or warn on broad filters.

## Why No Cleanup

Strict filter guard is about reducing read-only inventory query risk. It does not change cleanup policy.

Cleanup remains unsupported:

- shared Zeabur runtime 不做 destructive cleanup。
- inventory script 不 delete / update / unlink / disable。
- 不呼叫 cleanup API。
- RBAC graph high risk，只 inventory。
- AI 不參與 cleanup / fixture 判斷。

## Why No Index / Migration

Task 089 baseline did not show current local/test evidence requiring index.

Future index work would require:

- migration.
- DB storage / write overhead review.
- shared runtime query evidence.
- deployment planning.

This task only designs filter guard policy.

## Redaction / Safety

Future guard output must not print:

- `DATABASE_URL`
- DB password
- customer mobile
- raw LINE user id
- password
- password_hash
- token
- secret
- channel secret
- channel access token
- full payload / raw payload

Warnings should describe filter risk, not reveal sensitive values.

## Known Limitations

- This task does not implement guard logic.
- No shared runtime query was executed.
- No `EXPLAIN` was run in this task; Task 089 remains the local baseline.
- The proposed date range default of 7 days is a policy recommendation, not current behavior.
- `ALLOW_BROAD_INVENTORY=1` is proposed only for read-only inventory, not cleanup.

## Next Task 091 Suggestion

Task 091 - Inventory Strict Filter Guard Minimal Implementation

Suggested scope:

- Implement `INVENTORY_SHARED_RUNTIME=1`.
- Implement `REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1`.
- Implement `ALLOW_BROAD_INVENTORY=1` for read-only broad query override.
- Implement `INVENTORY_MAX_DATE_RANGE_DAYS`.
- Implement short prefix guard.
- Add `broadQueryWarnings` to output.
- Verify guard commands locally.
- Do not implement cleanup.
- Do not add migration / index.
