# Task 094 - Smoke Fixture Inventory Historical Marker Collision Review

## 功能範圍

本任務 review smoke fixture inventory 目前使用 substring matching 的限制，尤其是 historical marker collision / prefix-like run id collision 風險，並提出未來 exact marker mode 或 safer matching 策略。

本任務只做 review / design / 文件：

- 不修改 inventory script matching behavior。
- 不新增 exact mode。
- 不修改 smoke marker generation。
- 不新增 migration。
- 不新增 index。
- 不修改 DB schema。
- 不修改 production API / auth / RBAC behavior。
- 不修改 smoke 驗證邏輯。
- 不做 cleanup。
- 不做 AI 自動判斷。

## Current Matching Behavior

Inventory script：

```text
scripts/smoke/cleanup/inventory_smoke_fixtures.js
```

目前支援 filters：

- `SMOKE_RUN_ID`
- `SMOKE_TASK_CODE`
- `SMOKE_PREFIX`
- `CREATED_FROM`
- `CREATED_TO`

### Safe Text Columns

對一般 safe text columns，目前使用 substring matching：

```sql
LOWER(column::text) LIKE LOWER('%marker%')
```

這適用於：

- organization code / name
- dispatch unit code / name
- customer name
- case no / model no / problem description
- dispatch assignment note
- appointment note / reschedule reason / incomplete reason / next action / visit result
- field service report text fields
- case message sender / body
- audit log actor / action / entity type
- line channel code / name / channel id
- LINE identity display name
- role key / name / description
- user email / display name
- user organization membership note

這種設計的好處是可以支援歷史 fixtures 與多欄位 marker，但缺點是 prefix-like run ids 可能互相命中。

### Roles Metadata

`roles.metadata` 對 `smokeRunId` 有 exact matching：

```sql
metadata->>'smokeRunId' = SMOKE_RUN_ID
```

但 `metadata->>'smokePrefix'` 對 `SMOKE_TASK_CODE` / `SMOKE_PREFIX` 仍使用 substring matching。

### Relationship Tables

`role_permissions`、`user_roles`、`user_organizations` 本身不一定有 marker text，inventory 透過 related rows matching：

- `role_permissions`：透過 related `roles`
- `user_roles`：透過 related `users` 或 `roles`
- `user_organizations`：透過 `role_note`、related `users` 或 related `organizations`

其中 related `roles.metadata->>'smokeRunId'` 可 exact match；但 related role key / name / description、user email / display name、organization code / name 仍是 substring matching。

### 容易出現 Prefix Collision 的欄位

最容易發生 collision 的欄位是含 run id 的 safe text fields：

- `organization_code`
- `dispatch_units.code`
- `customer_name`
- `cases.model_no`
- `cases.problem_description`
- `dispatch_assignments.assignment_note`
- `appointments.note`
- `appointments.incomplete_reason`
- `field_service_reports.diagnosis_result`
- `field_service_reports.repair_action`
- `field_service_reports.repair_result`
- `line_channels.channel_code`
- `line_channels.channel_name`
- `customer_line_identities.display_name`
- `users.email`
- `users.display_name`
- `roles.role_key`
- `roles.name`
- `roles.description`
- `user_organizations.role_note`

## Known Collision / Prefix-like Run Id Example

Task 084 觀察到：

```text
SMOKE_RUN_ID=manual-test-084-027e
```

可能命中：

```text
manual-test-084-027e-db
```

原因：

- safe text columns 使用 substring matching。
- `manual-test-084-027e` 是 `manual-test-084-027e-db` 的 prefix。
- inventory 為了支援歷史 marker 與多欄位搜尋，目前未完全 exact match。

這不是資料安全洩漏，因為：

- output 仍只列 safe fields。
- customer mobile / raw LINE user id / token / password / DATABASE_URL / payload 不會輸出。
- script 仍是 read-only inventory。
- cleanup 不支援。

但它會影響人工盤點精準度：

- count 可能高於單一 run 的實際 fixture graph。
- sample labels 可能混入 prefix-like sibling run。
- operator 需要人工辨識 sample labels / createdAt / task prefix。

## Impact Analysis

### Accuracy Impact

Prefix collision 主要造成 false positive，不會造成 false negative。

例如查 `manual-test-084-027e` 時，可能列出 `manual-test-084-027e-db` rows。這會讓 inventory 看起來比單一 run 更大，但 sample labels 通常能看出差異。

### Safety Impact

目前影響是盤點精準度，不是安全邊界破壞：

- 不會 cleanup。
- 不會 delete / update。
- 不會 unlink / disable。
- 不會用 unsafe fields matching。
- 不輸出敏感欄位。

### Operational Impact

Operator 若用手動指定 run id，應避免建立互為 prefix 的 run ids。若已經存在 prefix collision，建議搭配：

- sampleLabels 人工 review
- createdAt range
- task code / smoke prefix
- known smoke run context

## Safer Matching Options

### Option 1 - 維持現況 + Operator Guidance

內容：

- 不改 inventory script。
- 不改 marker generation。
- 在 operator guide / future task 文件中提示 prefix collision 風險。
- 要求 future `SMOKE_RUN_ID` 使用較不容易互為 prefix 的格式。

優點：

- 不影響歷史 fixtures。
- 不改查詢結果。
- 不需 migration / index。
- 最低風險。

缺點：

- prefix-like run ids 仍可能互相命中。
- 精準度仰賴 operator review。

適用：

- 目前階段。
- shared runtime read-only inventory。
- historical fixture review。

### Option 2 - Run Id Exact Marker Mode

可能新增 env：

```text
INVENTORY_EXACT_SMOKE_RUN_ID=1
```

設計方向：

- 對支援 exact marker 的欄位使用 exact matching。
- `roles.metadata->>'smokeRunId'` 已可 exact match。
- 對 safe text columns 嘗試 delimiter pattern，例如：
  - `[smokeRunId:manual-test-xxx]`
  - `<manual-test-xxx>`
  - full field value exact where applicable

優點：

- 可降低 prefix collision。
- 對新格式 marker 可提高精準度。

缺點：

- 歷史 fixture marker 格式不一致，可能漏資料。
- 多數 table 沒有 structured metadata。
- 需要清楚區分 exact mode 與 legacy substring mode。

目前不建議立即實作。

### Option 3 - Structured Metadata-first Matching

設計方向：

- 優先使用 structured metadata exact match。
- 目前 `roles.metadata->>'smokeRunId'` 已是代表案例。
- 未來若 cases / appointments / dispatch assignments / reports 有 metadata 欄位，可逐步支援。

優點：

- 最乾淨的 exact matching。
- 可避免 text marker collision。

缺點：

- 多數既有 table 沒 metadata 欄位。
- 需要 schema / migration 評估。
- 不適合本階段。

### Option 4 - Generated Canonical Smoke Marker Delimiter

未來所有 smoke-created safe text marker 可加入固定 delimiter：

```text
[smokeRunId:manual-test-xxx]
[smokeTask:Task028]
```

Inventory 可搜尋 exact delimiter string：

```text
[smokeRunId:<run-id>]
```

優點：

- 不需要每個 table 都有 metadata。
- 對 future fixtures 可大幅降低 prefix collision。
- 保留 text-field marker strategy。

缺點：

- historical fixtures 無法完全回補。
- 需要修改各 smoke marker generation。
- UI / text fields 會多固定 delimiter，需確認是否可接受。

### Option 5 - Inventory Output Collision Warning

未來可在 output 中加入 warning，例如：

```text
SMOKE_RUN_ID uses substring matching on safe text fields; prefix-like run ids may match related fixtures. Prefer unique run ids.
```

更進階可檢查 sampleLabels 是否包含更長 prefix-like pattern：

- query run id：`manual-test-084-027e`
- sample label 出現：`manual-test-084-027e-db`
- output 加 collision warning

優點：

- 低風險。
- 不改查詢結果。
- 不改 schema。
- 對 operator 有直接提醒。

缺點：

- 只提醒，不提高查詢精準度。
- prefix-like pattern detection 需要小心避免 false alarm。

此選項適合作為 Task 095 的最小實作方向。

## Recommended Phased Approach

### 第一階段 - 現在

維持 existing matching，不改 code behavior。

Operator guidance：

- 優先使用完整 `SMOKE_RUN_ID`。
- 手動指定 `SMOKE_RUN_ID` 時避免互為 prefix。
- 建議格式保留 timestamp + random suffix。
- 若手動 run id 類似 `manual-test-084-027e`，不要再建立 `manual-test-084-027e-db` 這類 suffix run id。
- Broad task code / date range inventory 只作人工 review aid。

### 第二階段 - Task 095 可考慮

新增 warning，不改查詢結果：

```text
SMOKE_RUN_ID uses substring matching on safe text fields; prefix-like run ids may match related fixtures. Prefer unique non-prefix run ids.
```

或在偵測 sample labels 可能包含 prefix-like sibling run id 時，加入 output warning。

Task 095 scope 應限制為：

- warning only。
- no cleanup。
- no schema change。
- no migration / index。
- no exact mode。
- no query behavior change。

### 第三階段 - Future Canonical Marker

若未來 smoke fixture lifecycle 需要更高精準度，可評估：

- canonical delimiter marker，例如 `[smokeRunId:...]`
- exact marker mode
- structured metadata expansion

但這些都應另案處理，且需要和 historical fixture compatibility 一起設計。

## Operator Guidance

建議：

- 使用 generated run id 或 timestamp + random suffix。
- 避免手動 run id 互為 prefix。
- 查單次 run 時用 `SMOKE_RUN_ID`，並人工檢查 sample labels 是否都含同一 run id。
- 如果 sample labels 出現更長 sibling run id，將結果視為 broad inventory，而不是 single-run exact inventory。
- 對 shared runtime，只做 read-only inventory。
- 不以 inventory 結果直接作 cleanup 指令。

避免：

- 使用太短 run id。
- 使用 `manual-test-foo` 後又使用 `manual-test-foo-db`。
- 只用 date range 在 shared runtime 做大範圍盤點。
- 將 `ALLOW_BROAD_INVENTORY=1` 誤解為 cleanup permission。

## 為何不改 Code

本任務不改 inventory script behavior，原因：

- 目前 substring matching 是刻意支援 historical fixtures 與多欄位 marker 的相容策略。
- exact mode 若未設計好，可能漏掉歷史 fixtures。
- delimiter marker 需要各 smoke scripts 配合，不適合單點改 inventory。
- Task 093 已確認 read-only guard 與 warnings 正常，現在最重要的是文件化 collision risk。

## 為何不新增 Schema / Index / Migration

本任務是 matching strategy review，不是 schema work。

不新增：

- metadata 欄位。
- expression index。
- trigram / GIN index。
- migration。

未來若要 structured metadata 或 exact marker mode，應另案做 schema / compatibility review。

## 為何不做 Cleanup

Prefix collision review 只影響 inventory 精準度，不應導向 cleanup。

Shared Zeabur runtime 仍禁止 destructive cleanup。Local / CI cleanup 也仍未實作。Inventory output 仍是人工 review aid，不是 delete / update / unlink / disable plan。

## Redaction / Safety

本 review 不新增任何 unsafe matching。

Inventory 仍不得輸出：

- `DATABASE_URL`
- customer mobile / phone / tel
- raw LINE user id
- password / password hash
- token / secret
- LINE channel secret / access token
- full payload / raw payload

Inventory 仍不得以 customer mobile 或 raw LINE user id 作 cleanup marker 或 matching condition。

## Known Limitations

- Historical fixtures 已存在，不會被本任務回填 delimiter 或 metadata。
- Prefix-like run ids 仍可能在 substring matching 中互相命中。
- `roles.metadata->>'smokeRunId'` exact matching 只涵蓋 roles graph 的一部分。
- Relationship tables 會繼承 related rows 的 substring matching 行為。
- Operator 仍需人工 review sample labels / createdAt / task context。

## Next Task 095 Suggestion

建議 Task 095 做 `Inventory Marker Collision Warning Minimal Implementation`：

- 在 `SMOKE_RUN_ID` inventory output 加入 generic collision warning。
- 可選：偵測 sample labels 是否包含 prefix-like sibling run id pattern。
- 不改查詢結果。
- 不新增 exact mode。
- 不新增 migration / index。
- 不做 cleanup。
- 驗證 `npm run check` 與基本 inventory guard commands。
