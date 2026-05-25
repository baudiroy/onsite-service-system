# Task 854 — ISO27001-aligned System Controls Roadmap Baseline / Docs Only / No Runtime

## Goal

Create an ISO27001-aligned system controls roadmap for platform-level technical controls only. Map existing guardrails, identify missing control areas, and define future bounded runtime task candidates without implementing runtime.

## Scope

Updated documentation only:

- `docs/PROJECT_SHORT_INSTRUCTION.md`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/iso27001-system-controls-roadmap.md`
- `docs/task-854-iso27001-system-controls-roadmap-baseline-docs-only-no-runtime.md`

No backend, admin frontend, API, database, migration, smoke test, provider, AI/RAG runtime, permission runtime, audit runtime, package, deployment, or secret/config behavior was changed.

## Design Decisions

- The roadmap is ISO27001-aligned technical control planning, not a claim of certification and not a replacement for a full ISMS.
- The full module source lives in `docs/design/iso27001-system-controls-roadmap.md`.
- `docs/PROJECT_GUARDRAILS.md` contains only a concise formal principle and cross-reference.
- `docs/PROJECT_SHORT_INSTRUCTION.md` contains only one short hard-boundary sentence.

## Covered Roadmap Areas

The roadmap explicitly covers:

- data classification
- field-level visibility
- export control
- file access control
- AI retrieval guard
- provider secret management
- audit log viewer
- access review report
- incident evidence
- backup / restore evidence

## Priority

Foundational runtime first:

1. data classification
2. field-level visibility
3. export control
4. file access control
5. AI retrieval guard
6. provider secret management

Admin / audit UI later:

1. audit log viewer
2. access review report
3. incident evidence log
4. backup / restore evidence report

## Non-goals

This task did not:

- modify runtime behavior.
- modify API/DTO/route shape.
- modify DB schema, migration, seed, DDL, or psql usage.
- modify provider sending, AI/RAG runtime, LINE/SMS/App push, storage, or credentials.
- modify permission runtime or audit runtime.
- add smoke/integration tests.
- introduce token, secret, LINE access token, AI provider secret, full PII, raw payload, credential, or production data.

## Verification

Executed commands:

```bash
test -f docs/design/iso27001-system-controls-roadmap.md # PASS
grep -Ei "data classification|field-level visibility|export control|file access control|AI retrieval guard|provider secret|audit log viewer|access review|incident evidence|backup|restore" docs/design/iso27001-system-controls-roadmap.md # PASS
git diff --check -- docs/PROJECT_GUARDRAILS.md docs/design/iso27001-system-controls-roadmap.md docs/task-854-iso27001-system-controls-roadmap-baseline-docs-only-no-runtime.md PROJECT_SHORT_INSTRUCTION.md tests/docs/iso27001SystemControlsRoadmap.static.test.js # PASS
git diff --check -- docs/PROJECT_SHORT_INSTRUCTION.md docs/PROJECT_GUARDRAILS.md docs/design/iso27001-system-controls-roadmap.md docs/task-854-iso27001-system-controls-roadmap-baseline-docs-only-no-runtime.md # PASS
wc -m docs/PROJECT_SHORT_INSTRUCTION.md # 3295 chars
```

No static docs test was added because this task did not find a need to create a new docs test for a docs-only roadmap baseline.
