# Task 087 - Smoke Fixture Inventory Read-only Operator Guide / Shared Runtime Policy

## 功能範圍

這份文件是 smoke fixture inventory 的操作指南，整合 Task 080～086 的 inventory-only 工具、sample review、LINE graph review 與 RBAC graph review，並補充 Task 091～096 的 shared strict guard、`broadQueryWarnings`、historical marker collision warning 與 operator handoff note。

## Documentation Source of Truth

Current source of truth for smoke fixture inventory operator handoff：

```text
docs/task-087-smoke-fixture-inventory-read-only-operator-guide-shared-runtime-policy.md
```

Task 087 guide is the current stable source of truth for smoke fixture inventory operator handoff. Current execution, review, and reporting should rely on this guide.

Task 094～102 已完成 marker collision review、warning implementation、verification、runbook consolidation、safe output template、verification matrix、quickstart、dry-run review 與 read-only command verification。Current handoff flow is considered finalized for the current read-only inventory scope.

Freeze does not mean the code can never change. Freeze means no more inventory docs expansion is expected unless a real behavior or policy change occurs.

目前 freeze 範圍：

- read-only inventory operator handoff。
- shared runtime strict guard interpretation。
- `broadQueryWarnings` interpretation。
- safe output handoff template。
- marker collision operator guidance。
- pre-run / post-run checklist。
- no-cleanup shared runtime boundary。

其他 Task 080～102 文件可作為：

- historical context
- design background
- verification evidence
- implementation record

若舊 task 文件與本 Task 087 guide 有差異，operator handoff、safe output template、matrix、warning interpretation 與 masking expectation 以本文件為準。

舊 task 文件可能包含當時的 test context、sample output、temporary notes。這些內容是 evidence，不一定是目前 operator handoff 的最新規則。目前執行與交接以本文件的最新 quickstart / matrix / warning / template 為準。

Only reopen inventory docs when there is a real behavior / policy reason, such as exact mode, marker generation, matching behavior, cleanup policy, redaction policy, or shared runtime policy changing.

## Operator Quickstart

新操作者最少應確認：

1. Confirm target runtime：shared Zeabur / local / CI。
2. Confirm `DRY_RUN=1`。
3. Prefer fresh `SMOKE_RUN_ID` for single-run review。
4. 若使用 broad task code 或 date range，在 shared strict runtime 必須確認 `ALLOW_BROAD_INVENTORY=1` 或符合 bounded range guard。
5. Review `broadQueryWarnings`。
6. Review counts / createdAt range / safe summary only。
7. Do not paste full `sampleLabels`。
8. Do not paste raw JSON output。
9. Confirm `cleanupSupported=false` and `destructiveCleanupImplemented=false`。
10. Never cleanup shared runtime。

Safety reminders：

- `ALLOW_BROAD_INVENTORY=1` is not cleanup permission。
- Inventory result is not cleanup authority。
- Warning is not failure, but requires operator attention。
- Shared runtime must remain read-only。
- No sensitive output should be pasted into reports。

## Recommended Reading Order

1. `Operator Quickstart`
2. `Shared Zeabur Runtime Policy`
3. `Shared Strict Command Patterns`
4. `Verification Matrix`
5. `Warning Matrix`
6. `Admin Handoff Safe Output Template`
7. `Masking Guidance`
8. `Environment Note`
9. `Task Docs Index`
10. Historical design notes / task-specific evidence only when deeper context is needed

## Task Docs Index

| Task / document | Purpose | Current status | Use as | Operator should rely on? |
|---|---|---|---|---|
| Task 073 - Browser Smoke Cleanup Test Data Lifecycle Planning | Early smoke lifecycle and cleanup-risk planning | Historical | Design background | No, background only |
| Task 074 - Smoke Fixture Marker Standardization | Marker standardization direction and no-cleanup boundary | Historical | Design background | No, background only |
| Task 075 - Smoke Fixture Marker Backfill Planning for API Smokes | Backfill planning for API smoke markers | Historical | Design background | No, background only |
| Task 076 - Backfill Smoke 029 / 028 Smoke Run Id Marker | Multi-dispatch marker backfill record | Historical | Implementation evidence | No, evidence only |
| Task 077 - Backfill Smoke 046 / 047 Smoke Run Id Marker | LINE graph marker backfill record | Historical | Implementation evidence | No, evidence only |
| Task 078 - Backfill Smoke 027E Smoke Run Id Marker | RBAC smoke marker backfill record | Historical | Implementation evidence | No, evidence only |
| Task 079 - Smoke Fixture Cleanup Inventory Dry-run Planning | Inventory-only / dry-run safety planning | Historical | Design background | No, background only |
| Task 080 - Smoke Fixture Inventory Script Minimal Implementation | First inventory-only script implementation | Historical | Implementation record | No, evidence only |
| Task 081 - Smoke Fixture Inventory Runbook / Sample Output Review | Early runbook and sample output review | Superseded by Task 087 | Verification evidence | No, evidence only |
| Task 082 - Smoke Fixture Inventory Live DB Sample Review / Label Tuning | Live sample review and label tuning | Historical | Verification evidence | No, evidence only |
| Task 083 - Smoke Fixture Inventory Local DB Connectivity / Seeded Sample Review | Dedicated local/test DB verification | Historical | Verification evidence | No, evidence only |
| Task 084 - Smoke Fixture Inventory Additional Graph Sample Review | LINE / RBAC graph sample review | Historical | Verification evidence | No, evidence only |
| Task 085 - Smoke 027E Marker Compatibility / Role Key Constraint Fix | RBAC smoke marker compatibility fix record | Historical | Implementation evidence | No, evidence only |
| Task 086 - RBAC Smoke Inventory Runbook / Relationship Label Review | RBAC graph relationship label review | Historical | Verification evidence | No, evidence only |
| Task 087 - Smoke Fixture Inventory Read-only Operator Guide / Shared Runtime Policy | Current operator guide and handoff source | Current | Primary source of truth | Yes |
| Task 088 - Smoke Fixture Inventory Index / Performance Review Planning | Index / performance planning | Historical | Design background | No, background only |
| Task 089 - Smoke Fixture Inventory Query Explain / Local Performance Baseline | Local EXPLAIN baseline | Historical | Performance evidence | No, evidence only |
| Task 090 - Inventory Strict Filter Guard Design | Strict guard / warning design | Historical | Design background | No, background only |
| Task 091 - Inventory Strict Filter Guard Minimal Implementation | Guard / warning implementation record | Historical | Implementation evidence | No, evidence only |
| Task 092 - Inventory Strict Filter Guard Runbook / Manual Verification Review | Manual verification of guard behavior | Historical | Verification evidence | No, evidence only |
| Task 093 - Inventory Strict Filter Guard Live DB Verification | Live DB verification of guard behavior | Historical | Verification evidence | No, evidence only |
| Task 094 - Smoke Fixture Inventory Historical Marker Collision Review | Marker collision design review | Historical | Design background | No, background only |
| Task 095 - Inventory Marker Collision Warning Minimal Implementation | Marker collision warning implementation record | Historical | Implementation evidence | No, evidence only |
| Task 096 - Inventory Marker Collision Warning Runbook / Verification Review | Warning and guard verification | Historical | Verification evidence | No, evidence only |
| Task 097 - Operator Runbook Consolidation / Admin Handoff Note | Consolidated into Task 087 | Merged | Merged runbook content | Use Task 087 |
| Task 098 - Admin Handoff Examples / Safe Output Template | Safe output template added to Task 087 | Merged | Merged template content | Use Task 087 |
| Task 099 - Verification Matrix / Docs Consistency Review | Matrix and consistency notes added to Task 087 | Merged | Merged matrix content | Use Task 087 |
| Task 100 - Documentation Index / Operator Quickstart | Source-of-truth, quickstart, reading order, and docs index added to Task 087 | Merged | Merged quickstart content | Use Task 087 |
| Task 101 - Operator Quickstart Dry-run Review | Documentation-only walkthrough verified Task 087 usability | Historical | Verification evidence | Use Task 087 |
| Task 102 - Operator Quickstart Read-only Command Verification | Read-only command verification confirmed Task 087 handoff flow | Historical | Verification evidence | Use Task 087 |

## Pre-run Checklist

Before running inventory:

- Confirm correct environment：shared Zeabur / local / CI。
- Confirm `DRY_RUN=1`。
- Confirm `DATABASE_URL` exists but never paste value。
- Confirm shared strict mode flags if using shared runtime。
- Prefer `SMOKE_RUN_ID`。
- Avoid too-short prefix。
- Avoid open-ended date range。
- Avoid broad task code unless `ALLOW_BROAD_INVENTORY=1` is intentional。
- Confirm command will run inventory-only。
- Confirm no cleanup command is being executed。

## Post-run Handoff Checklist

After running inventory:

- Report PASS / rejected as expected / environment issue。
- Summarize `broadQueryWarnings`。
- Summarize counts only if safe。
- Summarize createdAt range。
- Confirm `cleanupSupported=false`。
- Confirm `destructiveCleanupImplemented=false`。
- Confirm no delete / update / unlink / disable performed。
- Confirm no sensitive output pasted。
- Use safe output template。
- Do not paste raw JSON / full `sampleLabels` / raw payload。

本文件只說明 read-only inventory：

- 用於人工盤點 smoke fixtures / historical markers / possible fixture graph。
- Inventory output 是人工 review aid，不是 cleanup plan。
- Inventory result 不代表 cleanup permission。
- 不產生 delete / update / unlink / disable plan。
- 不做 cleanup。
- 不刪資料。
- 不更新資料。
- 不 unlink。
- 不 disable。
- 不修改 DB schema。
- 不修改 backend API。
- 不讓 AI 參與 cleanup / fixture 判斷。

## Inventory Script

Script path：

```text
scripts/smoke/cleanup/inventory_smoke_fixtures.js
```

NPM script：

```bash
npm run smoke:cleanup:inventory
```

固定輸出旗標：

```text
mode=inventory-only
dryRun=true
destructiveCleanupImplemented=false
cleanupSupported=false
```

Script 只連 DB 做 read-only inventory，不呼叫 cleanup API，也不執行 delete / update / unlink / disable。

## Required Env

必填：

```text
DRY_RUN=1
DATABASE_URL
```

至少提供一個 filter：

```text
SMOKE_RUN_ID
SMOKE_TASK_CODE
SMOKE_PREFIX
CREATED_FROM / CREATED_TO
```

`DATABASE_URL` 只供 script 連線 DB 使用，永遠不得輸出到 log、文件或錯誤訊息。

## Guard Behavior

缺少 `DRY_RUN=1` 時拒絕：

```text
This inventory script is read-only and requires DRY_RUN=1. No cleanup is implemented.
```

缺少 filters 時拒絕：

```text
Refusing to run inventory without SMOKE_RUN_ID, SMOKE_TASK_CODE, SMOKE_PREFIX, or CREATED_FROM/CREATED_TO.
```

缺少 `DATABASE_URL` 時拒絕，且不輸出 `DATABASE_URL`。

即使 filter 合法，output 仍會固定顯示：

```text
cleanupSupported=false
destructiveCleanupImplemented=false
```

## Common Commands

### By Run Id

用於已知單次 smoke run 的精準盤點。

```bash
DRY_RUN=1 SMOKE_RUN_ID=<run-id> npm run smoke:cleanup:inventory
```

### By Task Code

用於同一類 smoke fixture 的廣泛盤點。

```bash
DRY_RUN=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task061 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task046 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task047 npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task027E npm run smoke:cleanup:inventory
DRY_RUN=1 SMOKE_TASK_CODE=Task071 npm run smoke:cleanup:inventory
```

### By Prefix

用於已知 marker prefix，但不知道完整 run id 時。

```bash
DRY_RUN=1 SMOKE_PREFIX="Task071 browser-smoke" npm run smoke:cleanup:inventory
```

### By Date Range

用於歷史 fixture 掃描。

```bash
DRY_RUN=1 CREATED_FROM=2026-05-17T00:00:00Z CREATED_TO=2026-05-18T00:00:00Z npm run smoke:cleanup:inventory
```

在大型 shared DB 上，避免只用 date range 做廣泛查詢，除非確實需要人工盤點歷史資料。

## Shared Strict Command Patterns

Shared runtime 建議明確帶：

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1
```

### Fresh SMOKE_RUN_ID Inventory

用於單次 smoke run review。Task 096 驗證過 fresh run id 可以在 shared strict mode 通過，且 output 會帶 `SMOKE_RUN_ID` marker collision warning。

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_RUN_ID=<fresh-run-id> npm run smoke:cleanup:inventory
```

預期：

- command PASS。
- `broadQueryWarnings` 包含 `SMOKE_RUN_ID` marker collision warning。
- `mode=inventory-only`。
- `dryRun=true`。
- `cleanupSupported=false`。
- `destructiveCleanupImplemented=false`。

### Broad Task Code Inventory

用於盤點同一類 task code 的 historical fixtures。Shared strict mode 下，只有 `SMOKE_TASK_CODE` 時必須明確加 `ALLOW_BROAD_INVENTORY=1`。

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 ALLOW_BROAD_INVENTORY=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
```

`ALLOW_BROAD_INVENTORY=1` 只代表允許 broad inventory，不代表允許 cleanup。

預期：

- command PASS。
- `broadQueryWarnings` 包含 shared-runtime broad warning。
- `broadQueryWarnings` 包含 task-code historical fixture warning。
- `cleanupSupported=false`。
- `destructiveCleanupImplemented=false`。

### Bounded Date Range Inventory

用於 bounded historical scan。日期區間必須完整且符合 `INVENTORY_MAX_DATE_RANGE_DAYS`。

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=<from> CREATED_TO=<to> npm run smoke:cleanup:inventory
```

預期：

- command PASS if bounded date range 符合 guard。
- `broadQueryWarnings` 包含 date-range broad scan warning。
- `cleanupSupported=false`。
- `destructiveCleanupImplemented=false`。

### Rejected Guard Examples

以下 shared strict cases 應拒絕，且錯誤訊息應包含 `No cleanup was performed.`。

```bash
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_TASK_CODE=Task028 npm run smoke:cleanup:inventory
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=<from> npm run smoke:cleanup:inventory
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 CREATED_FROM=<from> CREATED_TO=<too-wide-to> npm run smoke:cleanup:inventory
DRY_RUN=1 INVENTORY_SHARED_RUNTIME=1 REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1 SMOKE_PREFIX=Task npm run smoke:cleanup:inventory
```

拒絕原因：

- only task code without `ALLOW_BROAD_INVENTORY=1`。
- open-ended date range。
- too-wide date range。
- short prefix。

## Supported Fixture Graphs

### Multi-dispatch

相關 smokes：

- `smoke:028`
- `smoke:029`
- `smoke:071:browser`

主要 entities：

- organizations
- dispatch_units
- customers
- cases
- dispatch_assignments
- appointments
- field_service_reports
- case_messages
- audit_logs

### LINE

相關 smokes：

- `smoke:046`
- `smoke:047`

主要 entities：

- organizations
- line_channels
- customers
- cases
- customer_line_identities
- audit_logs

注意：inventory 不使用 raw `line_user_id` 當 filter，也不輸出 raw LINE user id。

### RBAC

相關 smoke：

- `smoke:027e`

主要 entities：

- roles
- role_permissions
- users
- user_roles
- user_organizations
- organizations
- dispatch_units
- audit_logs

RBAC graph 是最高風險 fixture graph，只能 inventory，不得 cleanup。

## Output Interpretation

Output 是 JSON summary。

Top-level 欄位：

- `mode`: 固定 `inventory-only`
- `dryRun`: 固定 `true`
- `destructiveCleanupImplemented`: 固定 `false`
- `cleanupSupported`: 固定 `false`
- `filters`: 本次使用的查詢條件
- `environment`: 只顯示安全資訊，例如 `hasDatabaseUrl=true` 與 `databaseUrlRedacted=true`
- `warning`: 固定提醒 inventory-only 與 shared runtime 禁止 destructive cleanup
- `broadQueryWarnings`: operator attention signals；warning 不是 failure，也不是 cleanup plan
- `entities`: entity summaries

每個 entity summary：

- `entityType`: entity 名稱
- `table`: DB table 名稱
- `riskLevel`: `low` / `medium` / `high`
- `count`: 符合條件的筆數
- `sampleIds`: 最多 5 筆 sample ids
- `sampleLabels`: 最多 5 筆安全 label
- `createdAtMin`: 最早建立時間
- `createdAtMax`: 最晚建立時間
- `dependencyWarning`: 依賴或 cleanup 風險提醒
- `cleanupSupported`: 固定 `false`
- `skipped`: 是否跳過 table
- `skipReason`: table / column 不支援時的原因

`query_failed` 代表該 table 查詢失敗。錯誤訊息必須 redacted，不得包含 `DATABASE_URL`、token、secret、password 或 payload。

## `broadQueryWarnings` Interpretation

`broadQueryWarnings` 是 operator attention signal，不是 command failure。出現 warning 時，operator 應更仔細 review counts、safe sample summaries、`createdAtMin` / `createdAtMax` 與 task context。

可能 warning：

- `SMOKE_RUN_ID` marker collision warning：提醒 safe text columns 使用 substring matching，prefix-like run ids 可能命中 sibling 或 historical fixtures。
- shared-runtime broad warning：提醒 shared runtime 查詢可能偏廣，優先使用 `SMOKE_RUN_ID` 或加 bounded date range。
- task-code historical fixture warning：提醒 `SMOKE_TASK_CODE` 會命中同 task 的歷史 fixtures。
- date-range broad scan warning：提醒 date-range-only inventory 可能掃到許多 non-smoke records。
- short prefix warning：提醒 `SMOKE_PREFIX` 太短可能命中不相關資料。

Warning 不會改變 query matching behavior，也不表示 cleanup allowed。只要 output 仍顯示：

```text
mode=inventory-only
dryRun=true
cleanupSupported=false
destructiveCleanupImplemented=false
```

就代表本工具仍只提供 read-only inventory。

## Verification Matrix

本 matrix 對齊 Task 080～098 的 inventory-only policy、Task 091～093 strict guard、Task 094～096 marker collision review / warning，以及 Task 097～098 operator handoff guidance。

| Scenario | Required env / filters | Shared strict expected result | Local/test expected result | Expected `broadQueryWarnings` | Cleanup boundary | Notes |
|---|---|---|---|---|---|---|
| Fresh `SMOKE_RUN_ID` inventory | `DRY_RUN=1`, `SMOKE_RUN_ID=<run-id>` | Allowed | Allowed | `SMOKE_RUN_ID` marker collision warning | Not allowed; inventory-only | `SMOKE_RUN_ID` matching still uses substring matching on safe text fields except structured metadata such as roles metadata. |
| `SMOKE_TASK_CODE` only without `ALLOW_BROAD_INVENTORY` | `DRY_RUN=1`, `SMOKE_TASK_CODE=Task028` | Rejected | Allowed with warning | If allowed: task-code historical fixture warning; shared runtime also adds shared-runtime broad warning | Not allowed | Shared strict rejects broad task-code-only inventory unless explicitly allowed. |
| `SMOKE_TASK_CODE` with `ALLOW_BROAD_INVENTORY=1` | `DRY_RUN=1`, `ALLOW_BROAD_INVENTORY=1`, `SMOKE_TASK_CODE=Task028` | Allowed | Allowed | Shared runtime broad warning + task-code historical fixture warning in shared runtime; task-code warning in local/test | Not allowed | `ALLOW_BROAD_INVENTORY=1` only allows broad read-only inventory. |
| Bounded `CREATED_FROM` + `CREATED_TO` | `DRY_RUN=1`, complete date range | Allowed if range is within guard limit | Allowed | Shared runtime broad warning + date-range broad scan warning in shared runtime; date-range warning in local/test | Not allowed | Date range should stay narrow and should be reviewed manually. |
| Open-ended `CREATED_FROM` only | `DRY_RUN=1`, `CREATED_FROM=<from>` | Rejected | Allowed with warning | If allowed: date-range broad scan warning; shared runtime may add shared-runtime broad warning before DB inventory only when not rejected | Not allowed | Shared strict requires both `CREATED_FROM` and `CREATED_TO`. |
| Too-wide date range | `DRY_RUN=1`, complete date range exceeding `INVENTORY_MAX_DATE_RANGE_DAYS` | Rejected | Allowed with warning | If allowed: date-range broad scan warning; shared runtime may add shared-runtime broad warning before DB inventory only when not rejected | Not allowed | Guard exists to reduce broad shared-runtime scans, not to improve matching precision. |
| Valid long `SMOKE_PREFIX` | `DRY_RUN=1`, `SMOKE_PREFIX=<long-prefix>` | Allowed if prefix length meets guard | Allowed | Shared-runtime broad warning in shared runtime; usually no prefix warning if length is sufficient | Not allowed | Prefix inventory is broader than run id inventory; review sample summaries and createdAt range. |
| Too-short `SMOKE_PREFIX` | `DRY_RUN=1`, `SMOKE_PREFIX=<short>` | Rejected on shared runtime | Allowed with short prefix warning in local/test | If allowed: short prefix warning; shared runtime rejects before DB inventory | Not allowed | Default minimum prefix length is controlled by `INVENTORY_MIN_PREFIX_LENGTH`. |
| No filters | `DRY_RUN=1` only | Rejected | Rejected | Not applicable | Not allowed | At least one filter is required before DB inventory. |
| `DRY_RUN` missing or not `1` | Any filter, missing `DRY_RUN=1` | Rejected | Rejected | Not applicable | Not allowed | Inventory script refuses without `DRY_RUN=1`. |
| `DATABASE_URL` missing | `DRY_RUN=1` plus valid filter, no DB URL | Rejected / cannot run DB inventory | Rejected / cannot run DB inventory | Built warnings may exist before DB connection, but DB inventory cannot run | Not allowed | Never document or paste any real `DATABASE_URL` value. |
| `ALLOW_BROAD_INVENTORY=1` misunderstood as cleanup permission | `ALLOW_BROAD_INVENTORY=1` with broad filters | Inventory may be allowed, cleanup still forbidden | Inventory may be allowed, cleanup still forbidden | Broad warnings remain expected | Not allowed | This flag only permits broad read-only inventory; it never permits cleanup. |

Safe output reminder:

- Handoff should summarize counts, warnings, createdAt range, cleanup flags, and command result.
- Do not paste raw JSON output.
- Do not paste full sampleLabels.
- Do not paste payloads or credentials.
- Do not turn inventory result into cleanup checklist.

## Warning Matrix

| Warning type | Trigger | Meaning | Operator action | Is failure? | Does it allow cleanup? |
|---|---|---|---|---|---|
| `SMOKE_RUN_ID` marker collision warning | `SMOKE_RUN_ID` is present | Safe text fields use substring matching, so prefix-like run ids may match sibling or historical fixtures | Review safe sample summaries, createdAt range, and task context before interpreting counts | No | No |
| Shared-runtime broad warning | Shared runtime inventory without `SMOKE_RUN_ID` | Query may be broad on shared runtime | Prefer `SMOKE_RUN_ID`, or add bounded `CREATED_FROM` / `CREATED_TO` | No | No |
| Task-code historical fixture warning | `SMOKE_TASK_CODE` is present without `SMOKE_RUN_ID` | Task-code inventory can match historical fixtures for the same task | Treat result as historical / broad inventory and review createdAt range | No | No |
| Date-range broad scan warning | Date range is used without run id, task code, or prefix | Date-only inventory can scan many non-smoke records | Keep range narrow and review output manually | No | No |
| Short prefix warning | Short `SMOKE_PREFIX` is used and allowed by runtime policy | Prefix may match unrelated records | Prefer `SMOKE_RUN_ID` or a longer prefix | No | No |
| Generic broad query warning | Any broad-filter situation represented by the shared-runtime / task-code / date-range / short-prefix warnings | Operator attention is required before interpreting counts | Summarize warning in handoff and avoid cleanup interpretation | No | No |

Warnings are operator attention signals. They are not failures, not cleanup permission, and not a reason to ignore manual review. Warning interpretation should use safe sample summaries, `createdAtMin` / `createdAtMax`, and task context. Full `sampleLabels` should not be pasted into handoff output.

## Guard Consistency Notes

- Shared runtime strict guard is intentionally stricter than local/test behavior.
- Shared strict guard reduces the chance of overly broad inventory being misused on shared runtime; it does not improve matching precision.
- `ALLOW_BROAD_INVENTORY=1` only allows broad read-only inventory. It does not allow cleanup.
- Inventory matching still uses substring matching for safe text columns. Task 095 only added a warning.
- Exact mode is not implemented.
- `INVENTORY_EXACT_SMOKE_RUN_ID` does not exist.
- `cleanupSupported=false` remains the expected output boundary.
- `destructiveCleanupImplemented=false` remains the expected output boundary.
- Shared Zeabur runtime remains read-only inventory only: no delete, update, unlink, disable, API cleanup, DB cleanup, or AI cleanup decision.

## Cross-document Consistency Review

Task 099 reviewed the Task 080～098 smoke fixture inventory docs for consistency. The current documented policy is:

- No document should imply inventory can cleanup shared runtime.
- No document should imply `ALLOW_BROAD_INVENTORY=1` grants cleanup permission.
- No document should imply `SMOKE_RUN_ID` is full-field exact matching.
- No document should imply Task 095 implemented exact mode.
- No document should encourage full `sampleLabels` in admin handoff reports.
- No document should recommend destructive cleanup on shared runtime.
- No document should contain actual `DATABASE_URL`, password, token, customer mobile, raw LINE user id, or raw payload values.

No runtime code change is required for this consistency note. If future docs drift from these points, update the docs first and keep shared runtime cleanup disabled.

Task 099 did not find a policy contradiction that required changing runtime behavior. Older task files may still contain safe sample-output excerpts or verification evidence from their original review context; for current operator handoff, this Task 087 guide is the source of truth for safe summary reporting and masking expectations.

## Risk Levels

### Low

低風險只代表在 isolated DB 中相對容易盤點，不代表 shared runtime 可以刪。

- appointments
- dispatch_assignments
- field_service_reports
- smoke-created cases / customers in isolated DB

### Medium

- line_channels
- customer_line_identities
- audit_logs
- timeline / case messages
- dispatch_units when referenced by cases / users

Audit logs 與 timeline messages 可能有 retention concerns，仍不支援 cleanup。

### High

- organizations
- users
- roles
- role_permissions
- user_roles
- user_organizations
- seed admin
- core permissions
- default roles

High 類預設只 inventory。尤其 RBAC graph 不得在 shared runtime 自動清理。

## Shared Zeabur Runtime Policy

Shared Zeabur runtime 只能做 read-only inventory。

禁止：

- destructive cleanup
- delete
- update
- unlink
- disable
- API cleanup
- DB cleanup
- 以 customer mobile 作為 cleanup 條件
- 以 raw LINE user id 作為 cleanup 條件
- AI cleanup decision

即使 output 顯示 `riskLevel=low`，也不得在 shared runtime 自動刪資料。

如果 shared runtime 上需要處理 smoke fixture：

1. 先用 `SMOKE_RUN_ID` / `SMOKE_TASK_CODE` / `SMOKE_PREFIX` / date range 做 read-only inventory。
2. 人工 review prefix、createdAt、sample labels、dependency warnings。
3. 另行決定是否需要人工營運處理。
4. 不使用本 inventory script 做 cleanup。

## Local / CI Isolated DB Policy

Local / CI isolated DB 可以用於 inventory 與未來 cleanup planning。

目前 cleanup 仍未實作。

未來若另案評估 cleanup，至少必須符合：

- isolated DB only
- `DRY_RUN=1` first
- explicit `ALLOW_SMOKE_DB_CLEANUP=1` only if future cleanup exists
- strict `SMOKE_RUN_ID`
- dependency ordering
- transaction strategy
- protection for seed admin
- protection for core permissions
- protection for default roles
- hard refusal for shared Zeabur runtime

Task 087 不實作 cleanup，也不設計 destructive SQL。

## Redaction / Safety

Inventory output 不得包含：

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

Inventory query 只搜尋 safe text fields 與安全關聯 label，例如：

- code / name
- organization code / name
- customer name
- model no
- problem description
- note / description
- display name
- channel id
- role key
- email
- roles metadata `smokeRunId` / `smokePrefix`

不使用 unsafe fields 當 filter。

Reporting guidance：

- 不貼 `DATABASE_URL`。
- 不貼 password / password hash。
- 不貼 token / secret。
- 不貼 customer mobile / phone / tel。
- 不貼 raw LINE user id。
- 不貼 LINE channel secret / access token。
- 不貼 full payload / raw payload。
- `sampleLabels` 如有疑慮應遮蔽，或只回報 safe summary。

回報時優先摘要：

- command PASS / rejected as expected / environment issue。
- `broadQueryWarnings` 是否符合預期。
- entity counts 的安全摘要。
- `createdAtMin` / `createdAtMax` 的安全摘要。
- cleanup boundary flags 是否仍為 false。

## Admin Handoff Safe Output Template

Inventory handoff 是安全摘要，不是 raw output dump。Inventory result 是人工 review aid，不是 cleanup authority。

Handoff report 不得貼：

- full sampleLabels。
- raw payload。
- credentials。
- customer mobile / phone / tel。
- raw LINE user id。
- `DATABASE_URL` value。
- token / secret / password value。
- 任何可能含個資或內部敏感資訊的完整欄位。

若 sampleLabels 有助於判斷，只能改成 masked / summarized form，例如：

```text
sample summary: Task028 smoke fixtures were present across organizations, cases, appointments, and field_service_reports.
sample summary: labels matched the requested task code and expected smoke graph shape.
sample summary: labels included prefix-like sibling markers, so treat the result as broad inventory.
```

### Copyable Safe Handoff Template

```text
Task <task-number> inventory verification complete.

Scope:
- Runtime: <shared Zeabur / local / CI>
- Mode: inventory-only
- Dry run: true
- Filter type: <SMOKE_RUN_ID / SMOKE_TASK_CODE with ALLOW_BROAD_INVENTORY / bounded date range>
- Filter value: <masked or safe summary only>

Result:
- Command: <PASS / rejected as expected / environment issue>
- Matched table groups: <count summary only>
- Total matched rows: <count only if safe>
- createdAt range: <createdAtMin> ~ <createdAtMax>
- broadQueryWarnings:
  - <summarized warning 1>
  - <summarized warning 2>

Cleanup boundary:
- cleanupSupported=false
- destructiveCleanupImplemented=false
- No delete / update / unlink / disable performed

Safety:
- No DATABASE_URL pasted
- No credentials pasted
- No customer mobile pasted
- No raw LINE user id pasted
- No raw payload pasted
- sampleLabels not pasted, or only masked/summarized

Interpretation:
- Inventory output is a human review aid.
- Prefix-like run ids may collide with sibling or historical fixtures.
- Counts should be interpreted with sample label / createdAt / task context review.
- ALLOW_BROAD_INVENTORY=1 does not grant cleanup permission.

Next step:
- <recommended next task or no action>
```

### Example 1 - Fresh SMOKE_RUN_ID Inventory

```text
Task 098 inventory verification complete.

Scope:
- Runtime: shared Zeabur
- Mode: inventory-only
- Dry run: true
- Filter type: SMOKE_RUN_ID
- Filter value: generated timestamp run id, suffix masked

Result:
- Command: PASS
- Matched table groups: multi-dispatch fixture groups were present
- Total matched rows: summarized counts only
- createdAt range: safe timestamp range reviewed
- broadQueryWarnings:
  - SMOKE_RUN_ID marker collision warning was present

Cleanup boundary:
- cleanupSupported=false
- destructiveCleanupImplemented=false
- No delete / update / unlink / disable performed

Safety:
- No DATABASE_URL pasted
- No credentials pasted
- No customer mobile pasted
- No raw LINE user id pasted
- No raw payload pasted
- sampleLabels not pasted

Interpretation:
- Inventory output is a human review aid.
- Prefix-like run ids may collide with sibling or historical fixtures.
- Counts were interpreted with createdAt and task context review.
- No cleanup permission was granted.

Next step:
- No runtime action. Continue with documentation or manual review only.
```

### Example 2 - Broad Task Code Inventory

```text
Task 098 broad Task028 inventory review complete.

Scope:
- Runtime: shared Zeabur
- Mode: inventory-only
- Dry run: true
- Filter type: SMOKE_TASK_CODE with ALLOW_BROAD_INVENTORY=1
- Filter value: Task028

Result:
- Command: PASS
- Matched table groups: summarized historical Task028 fixture groups only
- Total matched rows: count summary only
- createdAt range: safe timestamp range reviewed
- broadQueryWarnings:
  - shared-runtime broad inventory warning was present
  - task-code historical fixture warning was present

Cleanup boundary:
- cleanupSupported=false
- destructiveCleanupImplemented=false
- No delete / update / unlink / disable performed

Safety:
- No DATABASE_URL pasted
- No credentials pasted
- No customer mobile pasted
- No raw LINE user id pasted
- No raw payload pasted
- sampleLabels summarized only

Interpretation:
- ALLOW_BROAD_INVENTORY=1 allowed broad read-only inventory only.
- ALLOW_BROAD_INVENTORY=1 does not grant cleanup permission.
- Counts may include historical fixtures for the same task code.

Next step:
- Manual review only; no cleanup.
```

### Example 3 - Rejected Guard

```text
Task 098 shared strict guard review complete.

Scope:
- Runtime: shared Zeabur
- Mode: inventory-only
- Dry run: true
- Filter type: rejected shared strict guard cases
- Filter value: env values not pasted

Result:
- Command: rejected as expected
- Rejected cases:
  - only task code without ALLOW_BROAD_INVENTORY=1
  - open-ended date range
  - short prefix
- broadQueryWarnings:
  - not applicable because rejected guard stopped execution before DB inventory

Cleanup boundary:
- cleanupSupported=false
- destructiveCleanupImplemented=false
- No delete / update / unlink / disable performed

Safety:
- No DATABASE_URL pasted
- No credentials pasted
- No customer mobile pasted
- No raw LINE user id pasted
- No raw payload pasted
- full env command with sensitive values not pasted

Interpretation:
- Shared strict guard behaved as expected.
- Rejection is a safety result, not a smoke failure.

Next step:
- Use SMOKE_RUN_ID, add a bounded date range, or explicitly set ALLOW_BROAD_INVENTORY=1 for broad inventory.
```

### Example 4 - Environment Issue

```text
Task 098 environment issue note.

Scope:
- Runtime: local
- Mode: smoke verification
- Dry run: not applicable to the smoke command itself
- Filter type: not applicable
- Filter value: not pasted

Result:
- Command: environment issue
- Summary: sandboxed Node fetch was blocked with EPERM for local API calls, while local API availability was otherwise confirmed.
- Full stack trace: not pasted

Cleanup boundary:
- No inventory cleanup was attempted
- No delete / update / unlink / disable performed

Safety:
- No credentials pasted
- No token pasted
- No full env output pasted
- No raw payload pasted

Interpretation:
- Treat this as an execution environment issue first.
- Do not immediately classify it as a smoke regression.
- Rerun with an execution mode that allows local API access when appropriate.

Next step:
- Retry smoke verification with approved local API access, then report PASS / FAIL from the rerun.
```

## Unsafe Handoff Examples To Avoid

不要這樣回報：

- 不要貼整段 JSON output。
- 不要貼 full sampleLabels。
- 不要貼 raw payload。
- 不要貼完整 env command if it contains `DATABASE_URL` or other sensitive values。
- 不要貼 customer mobile / phone / tel。
- 不要貼 raw LINE user id。
- 不要把 inventory result 轉成 cleanup checklist。
- 不要說 `ALLOW_BROAD_INVENTORY=1` 允許 cleanup。
- 不要貼 full stack trace if it may contain paths, env values, credentials, or raw payload。

## Masking Guidance

- `SMOKE_RUN_ID` 通常可貼；如果含內部命名、客戶資訊、案件資訊或 vendor hint，應 mask。
- `sampleLabels` 預設不貼；必要時只貼 masked pattern 或 summarized form。
- `createdAtMin` / `createdAtMax` 可安全摘要。
- counts 通常可貼。
- table names 通常可貼。
- env variable names 可貼，但 values 不一定可貼。
- `DATABASE_URL` value 永遠不可貼。
- token / password / secret value 永遠不可貼。
- customer mobile / phone / tel value 永遠不可貼。
- raw LINE user id value 永遠不可貼。

## Environment Note

若 sandboxed Node `fetch` 出現 `EPERM` blocking local API calls，先確認是否為 execution environment 限制。

Task 096 曾遇到：

- dev server 已啟動。
- `curl` 可打到 local API。
- sandboxed Node `fetch` 對 local API 回 `EPERM`。

這類情況不應直接判定為 smoke regression。可改用允許 local API access 的執行方式重跑 smoke，並在回報中標註為 execution-environment issue。

## Known Limitations

- Inventory 是人工 review aid，不是 cleanup plan。
- 歷史 fixtures 若沒有 marker，可能只能用 task prefix 或 date range 輔助盤點。
- `SMOKE_RUN_ID` text matching 會做 substring matching，prefix-like run ids 可能互相命中。
- 大型 shared DB 不建議只用 date range 查詢，除非必要。
- 部分 audit / timeline marker 若藏在未支援的 structured payload 內，可能不會被 inventory 命中。
- `role_permissions` / `user_roles` / `user_organizations` matching 依賴 related roles / users / organizations。
- cleanup unsupported，且 destructive cleanup not implemented。

## Marker Collision Guidance

目前 inventory matching 行為維持相容 historical fixtures 的策略：

- safe text columns 使用 substring matching。
- `roles.metadata` 的 `smokeRunId` 可 exact matching，但只涵蓋 roles graph 的一部分。
- `role_permissions` / `user_roles` / `user_organizations` 透過 related role / user / organization rows matching。

因此 prefix-like run ids 可能互相命中，例如：

```text
manual-test-084-027e
manual-test-084-027e-db
```

當 operator 使用 `SMOKE_RUN_ID`、`SMOKE_TASK_CODE` 或 `SMOKE_PREFIX` 盤點時，應檢查：

- `sampleLabels` 是否都符合目標 run / task。
- `createdAtMin` / `createdAtMax` 是否落在合理時間。
- task context 是否符合該 smoke graph。
- `SMOKE_RUN_ID` / `SMOKE_TASK_CODE` / `SMOKE_PREFIX` 之間是否可能互為 prefix 或 broad match。

如果 sample labels 出現 sibling run id 或明顯跨 task context，應將 output 視為 broad inventory，不應視為 exact single-run inventory。

## Run Id Naming Guidance

優先使用 smoke helper 產生的 generated run id。手動命名時建議使用 timestamp + random suffix，例如：

```text
20260517-211638-f412ca
```

避免：

- 手動建立互為 prefix 的 run id。
- 太短 prefix。
- `manual-test-foo` 與 `manual-test-foo-db` 這類 sibling pattern。
- 只靠短 `SMOKE_PREFIX` 在 shared runtime 做盤點。

較好的操作方式：

- 查單次 run 時優先使用完整 `SMOKE_RUN_ID`。
- 查 task 歷史資料時使用 `SMOKE_TASK_CODE` 並加 `ALLOW_BROAD_INVENTORY=1`。
- 查時間區間時使用 bounded `CREATED_FROM` / `CREATED_TO`。
- 若需要對 shared runtime 做 broad inventory，必須在回報中明確寫出這只是 read-only inventory。

## When To Use Which Filter

Use `SMOKE_RUN_ID` when:

- 已知單次 smoke run id。
- 需要精準盤點一組 fixture graph。

Use `SMOKE_TASK_CODE` when:

- 想盤點某一類 smoke，例如 Task028、Task046、Task027E。
- 可以接受較廣泛結果。

Use `SMOKE_PREFIX` when:

- 已知 marker prefix，例如 `Task071 browser-smoke`。
- 不知道完整 run id。

Use `CREATED_FROM` / `CREATED_TO` when:

- 需要掃描歷史 fixtures。
- 沒有可靠 marker。

Avoid date range alone when:

- DB 很大。
- shared runtime 上可能有大量非 smoke records。
- 沒有明確人工 review 目的。

## Operator Checklist

Before running:

- Confirm this is inventory-only.
- Confirm `DRY_RUN=1`.
- Confirm target runtime：local / CI isolated DB 或 shared Zeabur runtime。
- Confirm shared runtime 是否需要 `INVENTORY_SHARED_RUNTIME=1` 與 `REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME=1`。
- Confirm at least one filter.
- Confirm `DATABASE_URL` is available but will not be printed.
- Prefer `SMOKE_RUN_ID` over broad filters.
- For broad inventory on shared strict runtime, require `ALLOW_BROAD_INVENTORY=1`.
- Do not run cleanup commands.

After running:

- Confirm `mode=inventory-only`.
- Confirm `dryRun=true`.
- Confirm `destructiveCleanupImplemented=false`.
- Confirm `cleanupSupported=false`.
- Review `broadQueryWarnings`.
- Review `count`, `sampleIds`, `sampleLabels`, `createdAtMin`, `createdAtMax`.
- Review `riskLevel` and `dependencyWarning`.
- Treat high-risk RBAC rows as inventory-only.
- Do not cleanup shared runtime.
- Do not paste sensitive output.
- Record command result as PASS / rejected as expected / environment issue.

## 為何仍不做 Cleanup

Smoke fixture graph 橫跨 case workflow、dispatch、appointments、Field Service Report、LINE identities、audit logs、roles、users、permissions 與 organization memberships。

在 shared runtime 中，自動 cleanup 有誤刪真實或半真實資料的風險。RBAC graph 更可能影響登入與權限。現階段只提供 read-only inventory，讓操作人員能安全辨識 smoke-created fixtures。

## Task 097 Consolidation Note

Task 097 consolidates this operator runbook after Task 094～096:

- Task 094 reviewed historical marker collision risk.
- Task 095 added `SMOKE_RUN_ID` marker collision warning to `broadQueryWarnings`.
- Task 096 verified the warning, shared strict guards, cleanup boundary, and redaction-safe reporting.

This document remains documentation-only / runbook-only. It does not change runtime behavior, query behavior, smoke marker generation, schema, index, API, auth, RBAC, or cleanup policy.

## Task 098 Safe Output Template Note

Task 098 adds admin handoff safe output examples:

- Safe handoff principles.
- Copyable safe output template.
- Fresh `SMOKE_RUN_ID` inventory example.
- Broad task-code inventory example.
- Rejected guard example.
- Environment issue example.
- Unsafe handoff examples to avoid.
- Masking guidance.

This remains documentation-only / template-only. It does not change runtime behavior, inventory matching behavior, exact mode, smoke marker generation, schema, index, API, auth, RBAC, or cleanup policy.

## Task 099 Verification Matrix Note

Task 099 adds verification and warning matrices plus cross-document consistency notes:

- Filter / guard / warning / expected result matrix.
- `broadQueryWarnings` matrix.
- Shared strict versus local/test guard consistency notes.
- Safe output reminder near the matrices.
- Cross-document consistency review summary for Task 080～098 inventory docs.

This remains documentation-only. It does not change runtime behavior, inventory query behavior, exact mode, smoke marker generation, schema, index, API, auth, RBAC, or cleanup policy.

## Task 100 Documentation Index / Quickstart Note

Task 100 adds the documentation index and operator quickstart:

- Documentation source-of-truth note.
- Operator quickstart.
- Recommended reading order.
- Task 080～099 docs index.
- Pre-run checklist.
- Post-run handoff checklist.
- Historical context warning.
- Safety reminder near the quickstart.

This remains documentation-only / quickstart-only. It does not change runtime behavior, inventory query behavior, exact mode, smoke marker generation, schema, index, API, auth, RBAC, or cleanup policy.

## Task 101 Quickstart Dry-run Review Note

Task 101 reviewed the guide from a new operator perspective:

- Documentation source of truth was clear.
- Operator quickstart was clear.
- Fresh `SMOKE_RUN_ID` inventory review flow was clear.
- Broad task-code inventory review flow was clear.
- Rejected guard handoff flow was clear.
- No documentation changes were needed.

This remained documentation-only / dry-run review. It did not change runtime behavior, inventory query behavior, exact mode, smoke marker generation, schema, index, API, auth, RBAC, or cleanup policy.

## Task 102 Read-only Command Verification Note

Task 102 verified the quickstart with read-only commands:

- `npm run check`: PASS.
- Read-only `SMOKE_RUN_ID` inventory: PASS.
- Output remained `mode=inventory-only`.
- `dryRun=true`.
- `cleanupSupported=false`.
- `destructiveCleanupImplemented=false`.
- `SMOKE_RUN_ID` marker collision warning was present.
- Rejected guard checks passed:
  - only task code without `ALLOW_BROAD_INVENTORY=1`.
  - open-ended date.
  - short prefix.
- No sensitive output was pasted.
- No cleanup was performed.

This remained read-only verification. It did not change runtime behavior, inventory query behavior, exact mode, smoke marker generation, schema, index, API, auth, RBAC, or cleanup policy.

## Task 103 Finalization / Freeze Note

Task 103 finalizes the current smoke fixture inventory operator handoff.

Stable handoff status:

- Task 087 guide is the stable operator handoff source of truth for the current read-only inventory scope.
- Operator should rely on this guide for current execution and reporting.
- Older task docs remain historical context, design background, verification evidence, or implementation records only.
- Inventory docs expansion should pause after Task 103 unless a real behavior / policy change occurs.

Freeze does not mean the code can never change. Freeze means the current documentation set is stable for the current read-only inventory behavior and should not keep expanding without a concrete reason.

Conditions that justify reopening inventory docs:

1. exact mode is formally designed or implemented.
2. `INVENTORY_EXACT_SMOKE_RUN_ID` or equivalent mechanism is added.
3. smoke marker generation changes.
4. canonical delimiter marker is designed or implemented.
5. inventory query matching behavior changes.
6. shared runtime cleanup policy changes.
7. `cleanupSupported` or `destructiveCleanupImplemented` behavior changes.
8. production API / auth / RBAC becomes coupled to inventory handoff.
9. a new marker collision type appears and the current warning / matrix is insufficient.
10. a real operator still significantly misunderstands the guide.
11. security / privacy redaction policy changes.
12. shared Zeabur runtime policy changes.

Explicit non-goals:

- This finalization does not mean cleanup is allowed.
- `ALLOW_BROAD_INVENTORY=1` does not grant cleanup permission.
- `SMOKE_RUN_ID` matching is not exact across all columns.
- exact mode does not exist.
- `INVENTORY_EXACT_SMOKE_RUN_ID` does not exist.
- destructive cleanup is not implemented.
- full `sampleLabels` should not be pasted.
- raw JSON output should not be pasted.
- shared runtime must not be mutated.
- inventory result must not be treated as a cleanup checklist.

## 下一步 Task 104 建議

建議下一步：

Task 104 - Return To Product Mainline Planning

原因：

- Smoke fixture inventory operator handoff is now finalized for the current read-only scope.
- Inventory docs expansion should pause unless real behavior or policy changes occur.
- Next work should return to product / system mainline planning.

Possible product mainline directions:

- Admin workflow polish.
- Case / appointment / field service report consistency review.
- Channel abstraction for future app support.
- Existing case reverse LINE binding design.
- Post-completion customer satisfaction survey flow design.

Do not start those product tasks inside this Task 103 finalization note.
