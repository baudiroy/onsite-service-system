# Task 735 — Engineer Mobile Workbench Completion Submission Injected Source-data Runtime Slice / No DB

## Scope

This task adds a minimal injected runtime boundary for:

- `POST /engineer-mobile-workbench/tasks/:taskId/completion-submissions`

The endpoint accepts only source-data submission input when an explicit completion-submission provider is injected.

## Changes

- Added `engineerMobileWorkbenchCompletionSubmissionService` to build safe completion-submission source-data responses from authenticated request scope.
- `EngineerMobileWorkbenchController.submitCompletion` now delegates to the completion-submission service only when safe submission options are explicitly injected.
- The Workbench router factory now recognizes injected completion-submission providers while preserving default skeleton behavior.
- Added runtime coverage for:
  - scoped submission input,
  - forbidden client authority fields stripped before provider input,
  - invalid result status denial,
  - missing auth denial before provider execution,
  - provider error fail-closed behavior,
  - controller default skeleton behavior,
  - controller injected submission response,
  - Workbench route factory submission path,
  - central router mounted Workbench submission path.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No provider sending, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload runtime, formal Field Service Report mutation, final appointment inference, billing/settlement mutation, customer-facing report publication, or audit runtime was added.
- Default Engineer Mobile Workbench completion-submission behavior remains skeleton-only unless a submission source is explicitly injected.

## Guardrails Preserved

- Completion submission requires authenticated `organizationId`, `engineerId`, route task id, and an allowed result status.
- Missing auth and invalid result statuses are denied before submission provider execution.
- Submission output is allow-listed and minimal.
- `finalAppointmentId`, formal Field Service Report content, billing/settlement amount, raw binary data, raw phone, raw LINE identity, internal notes, audit log content, tokens, secrets, and AI raw payload fields do not appear in provider input or output.
- The submitted data remains appointment-level source data and does not create or complete a formal Field Service Report.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchTaskStatusOperationRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchContextRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchTaskListRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js`: PASS, 42 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 141 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1655 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 141 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1655 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
