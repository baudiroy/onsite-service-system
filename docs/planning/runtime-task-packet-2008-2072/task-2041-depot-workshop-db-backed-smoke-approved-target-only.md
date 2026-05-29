# DRAFT PM Task Specification — Task2041: Depot Workshop DB-backed Smoke / Approved Target Only

## Status

- Draft only.
- Not authorization to execute.
- Must not be run unless PM explicitly assigns this exact task or batch.
- DB / migration / seed / deploy / smoke / provider / billing / AI execution requires separate explicit approval.
- GitHub sync standing approval applies only after PM accepts completed commits.

## Phase

Phase 23 — DB-backed Runtime Smoke by Branch

## Goal

Run DB-backed smoke only after DB/migration/seed target is explicitly approved.

## Allowed scope

- Follow only the scope explicitly assigned by PM when this task is activated.
- Keep reporting sanitized.
- Do not infer execution approval from roadmap placement.

## Required outcome

- Create or update the task-specific document when executed.
- Preserve all project invariants and hard gates.
- Use synthetic/injected dependencies unless an exact approved target is provided.
- Produce a separate commit and completion report for this task only.

## Explicit hard stop

Stop immediately and report if any of the following becomes necessary:

- exact target required
- no destructive fixture smoke
- no provider / billing / AI
- no customer-visible publish unless scoped
- no finalAppointmentId mutation unless scoped
- Any real secret value is needed.
- Any task outside this exact task appears necessary.
- Any implementation would violate project invariants.

## Explicit approval phrase requirement

This draft does not authorize execution. If execution is required, PM/user must provide an exact approval phrase naming `<TARGET_NAME>`, `<TARGET_URL>`, or `<DB_TARGET_NAME>` as applicable. No real secret values may be written here.

## Tests/checks expected

When activated, run the safest relevant checks:

- `git status --short`
- `git diff --check`
- Relevant targeted tests if this task changes tests/source.
- Available project check. If `npm` is unavailable, run the package-equivalent syntax/static check and report clearly.

## Commit instructions

- Commit only files for this exact task.
- Use one task per commit.
- Suggested commit message: `Task2041 depot workshop db-backed smoke`
- Do not push until PM acceptance. Standing GitHub sync approval applies only after PM accepts the commit.

## Completion report requirements

- Files changed.
- Commit hash.
- Tests/checks run.
- Result.
- Summary.
- Final git status.
- Whether local main is ahead of origin/main and by how many commits.
- Confirmation no prohibited DB/migration/seed/deploy/smoke/provider/billing/AI/secrets actions occurred.
- Confirmation the 7 held historical docs were untouched.

## Global restrictions inherited from README

- Do not print `DATABASE_URL`, `JWT_SECRET`, tokens, private keys, provider keys, billing provider secrets, OpenAI keys, R2 keys, LINE secrets, Zeabur secrets, or passwords.
- Do not force push.
- Do not touch the 7 held historical untracked docs.
- Do not bypass organization isolation.
- Do not mutate `finalAppointmentId`.
- Do not create, approve, publish, revoke, or mutate Completion Report / Field Service Report unless a future exact task explicitly scopes it.
- Do not create unfiltered customer-visible publication behavior.
- Do not treat LINE as global identity.
- Do not execute provider sending unless explicitly scoped.
- Do not execute billing provider / invoice / payment / payment method collection unless explicitly scoped.
- Do not execute AI/RAG provider calls unless explicitly scoped.
