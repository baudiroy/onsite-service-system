# Phase 9 — Repair Intake to Case Runtime

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1887–1897

Purpose:
- Convert repair intake drafts into formal Cases through controlled runtime paths while preserving draft/import/dedupe/reporter/customer/billing-contact separation.

Gate:
- Proceed only after customer-facing publication branch acceptance or PM explicit reprioritization.

Tasks:
- Task1887 — Repair Intake Runtime Readiness Inspection / No DB: Inspect existing Repair Intake draft, import, matching, duplicate, and draft-to-Case boundaries without runtime changes.
- Task1888 — Repair Intake Draft Repository SQL Adapter / Injected DB Client / No DB Execution: Implement injected-dbClient repository adapter for repair intake draft reads/writes using synthetic tests only.
- Task1889 — Repair Intake Draft-to-Case Service Runtime Wiring / No Route: Wire draft-to-Case application service internally without public route exposure and without DB execution.
- Task1890 — Repair Intake Duplicate Candidate Guard: Ensure duplicate candidates remain advisory until explicitly confirmed and cannot silently merge Cases.
- Task1891 — Repair Intake Draft-to-Case Route / Safe Runtime Boundary: Expose bounded route for accepted draft-to-Case behavior with permission, org isolation, and safe-deny responses.
- Task1892 — Repair Intake Reporter / Customer / Billing Contact DTO Guard: Harden DTO rules separating reporter, customer, billing_contact, and on-site contact override.
- Task1893 — Repair Intake Zeabur Route Smoke Readiness / No Smoke: Prepare target and smoke checklist only; do not run public/shared DB smoke.
- Task1894 — Repair Intake DB-backed Smoke / Approved Target Only: Run minimal DB-backed smoke only after explicit target approval; no destructive fixture smoke.
- Task1895 — Repair Intake Audit Log Boundary: Add audit boundary for intake decision, duplicate confirmation, and draft-to-Case conversion.
- Task1896 — Repair Intake Runtime Hardening: Harden idempotency, validation, sanitized failures, requestId propagation, and permission edges.
- Task1897 — Repair Intake Branch Final Review: Close branch after tests/docs/smoke evidence and remaining risks are accepted.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
