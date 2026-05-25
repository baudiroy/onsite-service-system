# Task1042 — Repair Intake Draft-to-Case IdempotencyPort Adapter Seam / No Repository No DB

## Accepted Status

- 本 task 以「純 seam」方式完成，僅新增 idempotency port adapter 與其對應單元測試。
- 未修改既有 API route/mount、controller、application service、或其他 runtime wire-up。
- 未接觸 DB/repository 實作、無 migration、無 providers/provider send、無 admin/client UI。

## Implemented Runtime Surface

- 新增 `createRepairIntakeIdempotencyPortAdapter(options)` 工廠
- 新增 `findExistingDraftToCaseResult(input)` 與 `recordDraftToCaseResult(input)` methods
- 以 injected `idempotencyStore` 依賴注入 `findExistingDraftToCaseResult` / `recordDraftToCaseResult`
- 工廠層 fail-closed 參數驗證 (`idempotencyStore` 與方法存在性)
- 輸入與輸出 sanitize（不外洩敏感欄位）
- store 例外/拒絕時回傳 sanitized failure envelope

## Current Local/Uncommitted State

- 已有大量 pre-existing patch stack，仍保留，不清理、不 revert、不 stash、不 rebase：
  - 這是跨任務積累的既有工作樹，不因 Task1042 重新改動。
- Task1042 相關狀態（僅新增）：
  - `src/repairIntake/repairIntakeIdempotencyPortAdapter.js`
  - `tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js`
  - `docs/task-1042-repair-intake-draft-to-case-idempotency-port-adapter-seam-no-repository-no-db.md`
- `git diff --cached --name-only` 預期仍為空（除非你先前有 staging 這些以外的檔案）。

## Explicit Non-Goals / Forbidden Areas Confirmed

- no global route mount / production runtime registration
- no DB / SQL / migration / psql / `db:migrate`
- no repository-backed writer
- no API shape change
- no admin
- no provider/API/LINE/SMS/email/webhook
- no AI/RAG
- no billing/settlement/payment/invoice
- no repo cleanup/stage/revert/reset/stash

## Required Verification Commands

```bash
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js
git diff -- docs/task-1042-repair-intake-draft-to-case-idempotency-port-adapter-seam-no-repository-no-db.md
git diff --check -- src/repairIntake/repairIntakeIdempotencyPortAdapter.js tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js docs/task-1042-repair-intake-draft-to-case-idempotency-port-adapter-seam-no-repository-no-db.md
git status --short -- src/repairIntake/repairIntakeIdempotencyPortAdapter.js tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js docs/task-1042-repair-intake-draft-to-case-idempotency-port-adapter-seam-no-repository-no-db.md
git diff --cached --name-only
```

## Required Completion Report Format

```text
Task1042 completed locally.
Implemented files:
- src/repairIntake/repairIntakeIdempotencyPortAdapter.js
- tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js
- docs/task-1042-repair-intake-draft-to-case-idempotency-port-adapter-seam-no-repository-no-db.md

Verification:
- node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js -> PASS
- no repo-wide cleanup/stage/commit/revert/reset/stash performed for this task
- only allowed scope touched for this task
```

## Acceptance Criteria

Task1042 is acceptable only if:

- pure injected idempotency seam adapter is added
- unit test for adapter passes
- no production runtime mount/API shape change
- no DB / SQL / migration / repository-backed writer changes
- Task989–Task1041 docs are read-only for this task (no edits required by this bounded item)
- no files outside scope are staged

## Task1042A — Verification Gap Closure / No Code Change

### Exact allowed files

- `docs/task-1042-repair-intake-draft-to-case-idempotency-port-adapter-seam-no-repository-no-db.md`

### Required behavior

- 不新增或修改 `src/**`、`tests/**`、runtime/migration/admin/db 相關檔案。
- 補齊 Task1042 的驗證與完成回報：
  - Task1042 來源/測試/文件都存在
  - 主要驗證命令為 PASS
  - `git diff --cached --name-only` 為空（若使用者先前未 staging）

### Required verification commands

```bash
node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js
node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js
node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js
git diff --name-only
git diff --cached --name-only
```

### Verification evidence

- `node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js` → PASS
- `node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js` → PASS
- `node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js` → PASS
- `node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js` → PASS
- `node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js` → PASS
- `git diff --cached --name-only` → `PASS` (no staged files in this branch context)

### Completion report format (Task1042A)

```text
Task1042A completed locally.
Production source modified during Task1042A: no.
Task1042 acceptance gap closed by doc-only update.
Task1042 source/test status:
- src/repairIntake/repairIntakeIdempotencyPortAdapter.js exists
- tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js exists
- docs/task-1042-repair-intake-draft-to-case-idempotency-port-adapter-seam-no-repository-no-db.md exists and updated
Verification:
- node --test tests/repairIntake/repairIntakeIdempotencyPortAdapter.unit.test.js -> PASS
- node --test tests/repairIntake/repairIntakeFullPortAdaptersInjectedRuntimeChain.integration.test.js -> PASS
- node --test tests/repairIntake/repairIntakeAuditWriterApplicationService.integration.test.js -> PASS
- node --test tests/repairIntake/repairIntakeAuditWriterPortAdapterBoundary.static.test.js -> PASS
- node --test tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js -> PASS
- git diff --name-only: reviewed
- git diff --cached --name-only: no output / no staging
```
