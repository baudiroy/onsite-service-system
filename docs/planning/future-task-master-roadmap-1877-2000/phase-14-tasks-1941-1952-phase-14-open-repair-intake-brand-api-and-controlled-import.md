# Phase 14 — Open Repair Intake, Brand API, and Controlled Import

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1941–1952

Purpose:
- Support open intake forms, brand/service-provider APIs, and Excel/CSV imports while protecting draft boundaries, dedupe, and identity separation.

Gate:
- Proceed after Repair Intake runtime is stable and PM approves external intake expansion.

Tasks:
- Task1941 — Open Repair Intake Readiness Inspection: Inspect open intake docs, anonymous/brand API scenarios, and draft boundaries.
- Task1942 — Open Intake Public Draft Route / Safe Boundary: Implement public draft intake route with rate/validation/safe-deny considerations.
- Task1943 — Brand API Intake Contract / No Auto Case: Define brand API intake contract that creates drafts only, not formal Cases.
- Task1944 — Excel CSV Import Staging Runtime Boundary: Implement controlled import staging behavior without direct Case creation.
- Task1945 — Import Deduplication Candidate Guard: Ensure import dedupe remains candidate-based until explicit confirmation.
- Task1946 — Open Intake Abuse and Rate-limit Guard: Add backend-level abuse controls and safe error envelopes.
- Task1947 — Open Intake Reporter Customer Billing DTO Guard: Harden external intake DTO separation for reporter/customer/billing contacts.
- Task1948 — Open Intake Audit Log Boundary: Audit source, import, dedupe, and draft creation decisions.
- Task1949 — Open Intake Smoke Readiness / No Smoke: Prepare smoke checklist and target prerequisites; no smoke execution.
- Task1950 — Open Intake DB-backed Smoke / Approved Target Only: Run minimal approved open-intake smoke without provider sending.
- Task1951 — Open Intake Runtime Hardening: Harden validation, idempotency, duplicate retries, and sanitized failures.
- Task1952 — Open Intake Branch Final Review: Close branch after docs/tests/security/risk review.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
