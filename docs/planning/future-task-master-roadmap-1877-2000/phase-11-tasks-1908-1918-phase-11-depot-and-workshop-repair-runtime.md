# Phase 11 — Depot and Workshop Repair Runtime

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1908–1918

Purpose:
- Support depot/workshop repair flows, workshop assignments, brand/service-provider/subcontractor access, and safe customer-visible filtering.

Gate:
- Proceed after dispatch/admin branch or PM explicit reprioritization.

Tasks:
- Task1908 — Depot Workshop Repair Readiness Inspection: Inspect depot/workshop docs, status model, access boundaries, and schema readiness.
- Task1909 — Depot Intake Repository Adapter / Injected DB Client: Implement depot intake repository adapter using injected dbClient and synthetic tests.
- Task1910 — Depot Repair Status Model Runtime Boundary: Implement bounded depot status model service without polluting formal Completion Report state.
- Task1911 — Workshop Assignment Service: Implement workshop assignment service with org/provider/subcontractor permission checks.
- Task1912 — Brand Service Provider Subcontractor Access Guard: Harden access guard for brand, service provider, and subcontractor visibility boundaries.
- Task1913 — Depot Repair Route Wiring / Permission Guard: Wire depot/workshop routes with permission guard and safe-deny envelopes.
- Task1914 — Depot Repair Customer-visible Data Filter: Implement data filter for depot information visible to customers and external parties.
- Task1915 — Depot Workshop Audit Log Boundary: Add audit boundary for depot status, assignment, and external-party access.
- Task1916 — Depot Workshop Smoke Readiness: Prepare smoke checklist and target prerequisites; no smoke execution.
- Task1917 — Depot Workshop DB-backed Smoke / Approved Target Only: Run minimal DB-backed depot/workshop smoke only after explicit target approval.
- Task1918 — Depot Workshop Branch Final Review: Close branch with docs/tests/security review and known limitations.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
