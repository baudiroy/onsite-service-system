# Phase 17 — Observability, Operations, Backup, and Disaster Recovery

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1976–1985

Purpose:
- Prepare operational visibility and safe maintenance practices for MVP trial operations.

Gate:
- Proceed after core runtime and security controls are sufficient for operational monitoring.

Tasks:
- Task1976 — Observability Readiness Inspection: Inspect logging, requestId, error envelope, healthz, and deployment logs.
- Task1977 — Structured Logging Boundary: Harden structured logs without secrets/raw SQL/customer-sensitive leakage.
- Task1978 — RequestId Propagation Contract: Ensure requestId propagation across routes/services/repositories.
- Task1979 — Health and Readiness Endpoint Review: Review /healthz and potential readiness checks without leaking internals.
- Task1980 — Operational Metrics Boundary / No External Provider: Define metrics boundary and tests without sending to external provider.
- Task1981 — Backup Verification Checklist / No Production Restore: Create backup verification checklist and dry-run rules.
- Task1982 — Maintenance Mode and Safe Degradation Plan: Plan/implement safe degradation behavior for DB/provider outages if scoped.
- Task1983 — Operational Runbook for Zeabur: Create Zeabur operations runbook: deploy, rollback, env changes, logs.
- Task1984 — On-call Triage and Error Taxonomy: Define triage categories and sanitized error code taxonomy.
- Task1985 — Operations Readiness Final Review: Review readiness for trial operations and remaining ops gaps.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
