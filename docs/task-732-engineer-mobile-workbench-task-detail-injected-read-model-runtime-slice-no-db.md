# Task 732 — Engineer Mobile Workbench Task Detail Injected Read Model Runtime Slice / No DB

## Scope

This task extends the Engineer Mobile Workbench injected read-model runtime slice from task list to task detail.

## Changes

- `EngineerMobileWorkbenchController.getTaskDetail` now delegates to the existing Engineer Mobile task-detail response builder when safe task detail options are injected.
- Workbench `taskId` route params are mapped to the existing Engineer Mobile `appointmentId` detail contract.
- The Workbench router factory passes the injected task source to both task list and task detail handlers.
- The existing Engineer Mobile task-detail service now supports sync object `getTaskDetail` providers in addition to existing async/detail/list/function forms.
- Added runtime coverage for:
  - safe detail success through controller,
  - missing auth denial before task source execution,
  - Workbench route factory detail path,
  - central router mounted Workbench detail path.

## Runtime Boundary

- No database connection is created.
- No migration was added or applied.
- No provider sending, LINE/SMS/App push, notification runtime, AI/RAG/vector runtime, file upload, completion submission, appointment mutation, Field Service Report mutation, or audit runtime was added.
- Default Engineer Mobile Workbench detail behavior remains skeleton-only unless a task source is explicitly injected.

## Guardrails Preserved

- Detail access is scoped by `organizationId`, `engineerId`, and appointment/task id.
- Missing auth is denied before task source execution.
- Detail output uses the existing Engineer Mobile safe detail allow-list.
- Internal notes, raw identity fields, tokens, secrets, raw binary data, and `finalAppointmentId` do not appear in output.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchTaskListRuntime.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbench.skeleton.test.js tests/engineerMobile/engineerMobileTaskDetailService.unit.test.js`: PASS, 26 passed / 0 failed.
- `node --test tests/engineerMobile/*.js tests/engineerMobileWorkbench/*.js`: PASS, 520 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1632 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
