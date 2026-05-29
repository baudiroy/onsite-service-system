# Phase 12 — SaaS Entitlement and Billing MVP

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1919–1928

Purpose:
- Make the platform SaaS-ready through tenant isolation, entitlement, usage metering, trial limits, billing-contact separation, and MVP readiness review without connecting payment providers yet.

Gate:
- Proceed after core workflow branches or PM explicit business priority decision.

Tasks:
- Task1919 — SaaS Entitlement Readiness Inspection: Inspect tenant/org/plan/permission/billing-contact docs and runtime gaps; no code changes.
- Task1920 — Organization Plan Entitlement Runtime Model: Implement bounded runtime model for organization plans and entitlements; no billing provider.
- Task1921 — Usage Metering Boundary / No Billing Provider: Implement usage metering boundary and tests without invoicing/payment integration.
- Task1922 — Trial Limit Guard: Add backend-enforced trial limits; do not rely on frontend-only controls.
- Task1923 — Billing Contact Separation Guard: Preserve billing_contact separation from customer/reporter/on-site contacts.
- Task1924 — SaaS Permission Contract Hardening: Harden permission tests for tenant/org/plan entitlement boundaries.
- Task1925 — SaaS Audit Log Boundary: Audit entitlement, trial, and usage-related decisions.
- Task1926 — SaaS Admin Runtime Smoke Readiness: Prepare approved-target smoke plan for SaaS admin flows; no smoke execution.
- Task1927 — SaaS MVP Readiness Review: Review whether SaaS MVP is operationally ready without billing provider.
- Task1928 — MVP Trial Operation Gate Review: Define go/no-go gate for limited trial operation, known risks, and required manual controls.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
