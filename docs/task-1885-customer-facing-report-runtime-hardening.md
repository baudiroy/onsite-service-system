# Task1885 Customer-facing Report Runtime Hardening

Status: implemented and verified locally.

Scope:
- Harden the customer-facing service-report route runtime boundary after Task1884 audit wiring.
- Preserve the accepted app-level 404 stealth safe-deny semantics.
- Keep the work bounded to injected-dependency and static/synthetic tests.

Runtime hardening added:
- The service-report route now wraps projection request execution in a fail-closed boundary.
- Missing projection dependencies still return the generic `customerAccess.unavailable` envelope.
- Projection query failures remain sanitized and customer-invisible.
- Audit writer failures remain customer-invisible.
- Request IDs are propagated into sanitized access audit events when present.

Safe-deny envelope:
- HTTP status: 404.
- `status`: `deny`.
- `messageKey`: `customerAccess.unavailable`.
- `customerVisible`: `false`.
- `data`: `null`.
- No raw DB/client/provider/internal error text is exposed.

Boundary confirmations:
- No DB command execution.
- No SQL or migration execution.
- No migration execution.
- No seed execution.
- No deploy.
- No smoke test against public/shared/prod targets.
- No provider sending.
- No AI/RAG execution.
- No billing/settlement execution.
- No Completion Report / Field Service Report creation.
- No finalAppointmentId mutation.
- No customer-visible publication mutation.
- No admin frontend changes.
- No package or lockfile changes.
- No secrets printed or generated.

Verification:
- Added route tests for missing projection dbClient and projection query failure.
- Added static runtime hardening tests for imports, mutation boundaries, safe-deny behavior, DTO allowlist stability, and task documentation.
- Used synthetic injected dependencies only.
