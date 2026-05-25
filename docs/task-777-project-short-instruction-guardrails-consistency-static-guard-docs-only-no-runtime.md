# Task777 - Project Short Instruction and Guardrails Consistency Static Guard / Docs Only / No Runtime

Status: completed.

Scope: docs static guard only.

## Purpose

Task777 adds a focused static guard for the project-level instruction layer after the recent Brand Referral, Engineer Mobile, ISO controls, and Data Correction branch closures.

The guard checks that:

- `docs/PROJECT_SHORT_INSTRUCTION.md` exists and remains under 8000 characters.
- The short instruction points to `docs/PROJECT_GUARDRAILS.md` as the full source of truth and keeps module details under `docs/design/`.
- The short instruction preserves the core hard boundaries without duplicating full module design detail.
- `docs/PROJECT_GUARDRAILS.md` keeps source-of-truth references for Brand Official LINE / multi-channel identity, Brand Referral, Engineer Mobile Workbench, Data Correction / no silent overwrite, ISO controls, AI/RAG safety, and SaaS entitlement / add-on boundaries.
- The project-level docs do not contain real-looking DB URLs, tokens, secrets, raw LINE user ids, full mobile numbers, provider payloads, or credential-like values.
- The project-level docs do not imply Migration 022 / Migration 024 dry-run or apply authorization, Brand Referral persistence promotion, Engineer Mobile DB adoption, completion writes, Case Binding runtime, provider / webhook runtime, or AI/RAG runtime approval.

## Files Changed

- `tests/docs/projectShortInstructionGuardrailsConsistency.static.test.js`
- `docs/task-777-project-short-instruction-guardrails-consistency-static-guard-docs-only-no-runtime.md`

No changes were needed in:

- `docs/PROJECT_SHORT_INSTRUCTION.md`
- `docs/PROJECT_GUARDRAILS.md`

## Runtime Decision

No runtime behavior changed.

This task did not modify:

- backend `src/`
- admin `admin/src/`
- API routes, controllers, services, repositories, or middleware
- DB schema or migrations
- smoke tests
- package files
- provider / LINE / SMS / App push / webhook runtime
- identity verification / Case Binding runtime
- repair intake / completion write services
- audit writer / contact-log runtime
- AI/RAG runtime
- entitlement / billing runtime

## Verification

Required verification:

```bash
node --test tests/docs/projectShortInstructionGuardrailsConsistency.static.test.js
npm run check
git diff --check -- tests/docs/projectShortInstructionGuardrailsConsistency.static.test.js docs/task-777-project-short-instruction-guardrails-consistency-static-guard-docs-only-no-runtime.md docs/PROJECT_SHORT_INSTRUCTION.md docs/PROJECT_GUARDRAILS.md
```

## Notes

This task intentionally does not update the project instruction text because the current short instruction is already compact and under 8000 characters, and the guardrails already include the required source-of-truth references.

Future project-level instruction changes should keep this split:

- short instruction = compact hard boundaries only
- guardrails = formal non-negotiable source of truth
- design docs = detailed module workflows, states, fields, risks, and future tasks
