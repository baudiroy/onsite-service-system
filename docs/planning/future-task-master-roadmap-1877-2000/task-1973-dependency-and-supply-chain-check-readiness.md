# DRAFT PM Task Specification

Status:
- Draft only.
- Not authorization to execute.
- Must not be run unless PM explicitly assigns this exact task.
- Any DB, migration, seed, deploy, smoke, provider, billing, AI/RAG, customer-visible publication, or production action requires separate explicit approval.

Global guardrails:
- One Case = one formal Completion Report / Field Service Report.
- Customer-facing report is a filtered publication view only.
- Appointment lifecycle and finalAppointmentId remain backend/system-owned.
- Organization isolation is mandatory.
- Permissions and audit logs must be preserved.
- AI/RAG is advisory unless explicitly scoped.
- LINE must not be hard-coded as global identity.
- Do not print DATABASE_URL, JWT_SECRET, tokens, private keys, provider keys, passwords, or Zeabur secrets.
- Do not touch provider integrations unless this exact task scopes them.
- Do not run DB/migration/seed/deploy/smoke unless this exact task explicitly allows it and PM/user approval is present.
- Do not touch held historical untracked docs.


## Task1973 — Dependency and Supply Chain Check Readiness

Phase: Phase 16 — Security, ISO27001 Readiness, and Compliance Hardening

Purpose:
- Prepare dependency check approach and non-disruptive remediation plan.

Allowed work:
- Inspect repository/docs/runtime evidence relevant to this task and produce a concise report or planning document.

Explicitly forbidden work:
- Do not expand beyond this task into adjacent modules or phases.
- Do not push unless PM/user separately approves.
- Do not modify unrelated files or held historical untracked docs.
- Do not print secrets or sensitive values.
- Do not implement runtime changes unless this exact task explicitly says to implement.

Suggested verification:
- Run targeted tests relevant to changed files.
- Run `npm run check` when available; if unavailable, run documented equivalent syntax/static checks and report clearly.
- Confirm no forbidden DB/migration/seed/deploy/provider action occurred unless explicitly approved by this task.

Completion report must include:
- Files changed.
- Commit hash if committed.
- Tests/checks run and results.
- Summary of behavior implemented or inspected.
- Confirmation of global guardrails.
- Recommendation for the next task, without executing it.
