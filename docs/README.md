# Docs Index / 文件入口

This folder contains the project guardrails, module designs, and historical task notes for the onsite service / field service platform.

## Read First

| Purpose | File |
| --- | --- |
| Compact hard-boundary instruction for Codex / PM handoff | [PROJECT_SHORT_INSTRUCTION.md](./PROJECT_SHORT_INSTRUCTION.md) |
| Full project source of truth and non-negotiable guardrails | [PROJECT_GUARDRAILS.md](./PROJECT_GUARDRAILS.md) |
| Module-level design index | [design/README.md](./design/README.md) |
| Historical task branch index | [TASK_ARCHIVE_INDEX.md](./TASK_ARCHIVE_INDEX.md) |
| Full generated task file catalog | [TASK_FILE_CATALOG.md](./TASK_FILE_CATALOG.md) |

## Fast Navigation

| Need | Start Here |
| --- | --- |
| Understand current hard boundaries | [PROJECT_SHORT_INSTRUCTION.md](./PROJECT_SHORT_INSTRUCTION.md) then [PROJECT_GUARDRAILS.md](./PROJECT_GUARDRAILS.md) |
| Work on a module design | [design/README.md](./design/README.md) |
| Review data correction / amendment governance | [design/data-correction-amendment-governance.md](./design/data-correction-amendment-governance.md) |
| Find old task decisions by branch | [TASK_ARCHIVE_INDEX.md](./TASK_ARCHIVE_INDEX.md) |
| Find a specific task file by number/name | [TASK_FILE_CATALOG.md](./TASK_FILE_CATALOG.md) |
| Check whether runtime work is authorized | Current task request + guardrails; historical notes alone are not enough |

## Documentation Layers

1. Short instruction: concise hard boundaries under 8000 characters.
2. Project guardrails: full formal rules and highest-level source of truth.
3. Module design docs: detailed future design, flow, state, field direction, and future tasks.
4. Historical task notes: decision trail and evidence archive.

## Safety Reminder

Historical task notes do not automatically authorize runtime work. Future tasks must explicitly state whether backend `src/`, admin `src/`, API, DB migration, provider sending, AI/RAG runtime, permission logic, audit log, smoke test, or package changes are in scope.
