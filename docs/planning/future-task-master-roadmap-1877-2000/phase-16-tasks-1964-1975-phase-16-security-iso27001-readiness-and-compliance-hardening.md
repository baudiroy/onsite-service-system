# Phase 16 — Security, ISO27001 Readiness, and Compliance Hardening

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1964–1975

Purpose:
- Strengthen security controls, evidence, auditability, incident readiness, and ISO27001-aligned documentation without overclaiming certification.

Gate:
- Proceed after MVP workflows are stable enough to generate meaningful security evidence.

Tasks:
- Task1964 — Security Control Inventory Readiness Inspection: Map implemented controls to security inventory and identify gaps; no runtime change.
- Task1965 — Organization Isolation Evidence Packet: Create/strengthen tests/evidence for organization isolation across key modules.
- Task1966 — Permission Matrix Contract Hardening: Harden permission matrix tests and docs for roles, brands, providers, subcontractors.
- Task1967 — Audit Log Coverage Review and Gap Fixes: Review audit coverage and implement bounded missing audit events.
- Task1968 — Secret Handling and Env Exposure Static Guards: Add static guards against secret printing, env leakage, and unsafe logs.
- Task1969 — Data Retention and Customer-visible Data Policy Packet: Document and enforce retention/customer-visible filtering where currently implemented.
- Task1970 — Backup and Restore Procedure Readiness: Prepare backup/restore procedure checklist; no production restore.
- Task1971 — Incident Response Runbook Draft: Create incident response runbook and escalation checklist.
- Task1972 — Security Headers and CORS Hardening: Harden security headers/CORS config within approved runtime boundary.
- Task1973 — Dependency and Supply Chain Check Readiness: Prepare dependency check approach and non-disruptive remediation plan.
- Task1974 — ISO27001 Evidence Index / Not Certification Claim: Create evidence index aligned to ISO27001-style controls without claiming certification.
- Task1975 — Security Branch Final Review: Review security readiness, gaps, and deferred actions.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
