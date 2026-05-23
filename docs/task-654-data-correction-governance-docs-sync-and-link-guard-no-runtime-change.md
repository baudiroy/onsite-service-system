# Task 654 - Data Correction Governance Docs Sync and Link Guard / No Runtime Change

## Summary

Task 654 syncs Data Correction / Amendment Governance Phase 1 into the three-layer documentation structure and adds a minimal docs link/static guard.

This task does not modify runtime source, API, DB, migration, permission runtime, audit runtime, provider runtime, AI/RAG runtime, admin frontend, smoke tests, package files, or generated task indexes.

## Files

- `docs/PROJECT_SHORT_INSTRUCTION.md`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/data-correction-amendment-governance.md`
- `docs/design/README.md`
- `docs/README.md`
- `tests/docs/dataCorrectionDocsLinks.static.test.js`
- `docs/task-654-data-correction-governance-docs-sync-and-link-guard-no-runtime-change.md`

## Short Instruction Update

The short instruction adds one compact hard-boundary sentence:

> Data correction / amendment must protect phone identity changes, engineer-departure freeze, audit trail, and one Case / one formal completion report invariants; phone changes require re-verification and post-departure operational changes must not silently overwrite dispatch data.

The short instruction remains under the 8000 character limit.

## Guardrails Update

`docs/PROJECT_GUARDRAILS.md` now includes a concise source-of-truth summary:

- Data correction / amendment governance is a formal data governance boundary.
- Phone changes require re-verification and must not directly overwrite phone / channel identity.
- Pre-departure non-phone repair / dispatch corrections may be allowed with permission and audit.
- Post-departure / route-started operational data must not be silently overwritten.
- After-arrival unable-to-complete cases should end the appointment in terminal state and later create follow-up appointment.
- Completion amendment must not create a second formal Field Service Report.
- Full module detail lives in `docs/design/data-correction-amendment-governance.md`.

## Design Doc

`docs/design/data-correction-amendment-governance.md` includes:

- status and scope
- non-scope
- Phone Change Re-verification Flow
- pre-departure correction rules
- engineer received task / reconfirm-required rule
- post-departure / route-started freeze
- after-arrival unable-to-complete terminal appointment states
- follow-up / second-dispatch appointment principle
- completion amendment / no second FSR principle
- roles and AI boundary
- data protection / customer-visible data policy
- completed runtime tasks Task652 and Task653
- future tasks

## Index Updates

- `docs/design/README.md` links the new design doc in the module index.
- `docs/README.md` links the new design doc from fast navigation.

## Static Test

`tests/docs/dataCorrectionDocsLinks.static.test.js` verifies:

- design doc exists
- short instruction contains the data correction boundary and stays under 8000 characters
- Guardrails links to the design doc
- design README links to the design doc
- docs README links to the design doc or design index
- design doc mentions Task652 and Task653
- design doc includes phone re-verification, post-departure freeze, unable-to-complete, follow-up appointment, and no second formal FSR
- updated docs do not contain credential-like values

## Verification

Expected targeted checks:

- `node --test tests/docs/dataCorrectionDocsLinks.static.test.js`
- `git diff --check -- docs/PROJECT_SHORT_INSTRUCTION.md docs/PROJECT_GUARDRAILS.md docs/design/data-correction-amendment-governance.md docs/design/README.md docs/README.md tests/docs/dataCorrectionDocsLinks.static.test.js docs/task-654-data-correction-governance-docs-sync-and-link-guard-no-runtime-change.md`
