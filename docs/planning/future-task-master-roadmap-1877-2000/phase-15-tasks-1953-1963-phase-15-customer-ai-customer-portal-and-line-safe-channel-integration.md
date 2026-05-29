# Phase 15 — Customer AI, Customer Portal, and LINE-safe Channel Integration

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1953–1963

Purpose:
- Improve customer-facing assistance and portal/channel flows while ensuring LINE is not a global identity and AI remains advisory.

Gate:
- Proceed only after customer-facing report and AI guardrails are accepted.

Tasks:
- Task1953 — Customer AI Scope Readiness Inspection: Inspect customer AI scope, allowed data, and channel identity boundaries.
- Task1954 — Customer Portal Session Boundary: Implement/strengthen customer portal session boundary separate from LINE identity.
- Task1955 — LINE Channel Identity Link Guard: Harden LINE link/unlink and prevent LINE ID from becoming global identity.
- Task1956 — Customer AI FAQ Suggestion / No Mutation: Implement customer AI FAQ suggestions without modifying Case/Report data.
- Task1957 — Customer-visible Data Filter for AI: Ensure AI/customer portal only sees allowed published/filtered data.
- Task1958 — Customer Channel Audit Log Boundary: Audit customer portal/channel access and AI suggestion events.
- Task1959 — Customer Portal Route Smoke Readiness: Prepare portal route smoke checklist; no smoke execution.
- Task1960 — Customer Portal Approved-target Smoke: Run minimal approved portal smoke with no provider sending unless scoped.
- Task1961 — Customer AI Provider Gate / Explicit Approval Only: Gate any customer-facing AI provider call behind explicit approval and secrets handling.
- Task1962 — Customer Portal Runtime Hardening: Harden safe-deny, identity mismatch, stale link, and requestId propagation.
- Task1963 — Customer AI and Portal Branch Final Review: Review docs/tests/privacy/security and close branch.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
