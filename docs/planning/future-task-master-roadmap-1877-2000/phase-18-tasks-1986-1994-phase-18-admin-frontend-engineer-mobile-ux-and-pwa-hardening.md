# Phase 18 — Admin Frontend, Engineer Mobile UX, and PWA Hardening

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1986–1994

Purpose:
- Prepare admin frontend and engineer mobile UX for operational use while preserving backend authority and permission boundaries.

Gate:
- Proceed when backend APIs are stable enough to avoid rework.

Tasks:
- Task1986 — Admin Frontend Deployment Readiness Inspection: Inspect admin app build/env/deploy readiness without deploy.
- Task1987 — Admin API Client Boundary Hardening: Harden frontend API client safe handling of auth, errors, requestId, and org scope.
- Task1988 — Engineer Mobile UX Readiness Inspection: Inspect mobile UX/PWA needs against existing backend route behavior.
- Task1989 — Engineer Mobile Action UI Wiring / No New Backend Scope: Wire UI to approved backend route without new backend semantics.
- Task1990 — Engineer Mobile Offline and Retry Boundary: Plan/implement bounded retry/offline behavior without duplicate unsafe actions.
- Task1991 — Admin Frontend Zeabur Deploy Checklist: Create admin frontend deployment checklist and env handling; no deploy unless approved.
- Task1992 — Admin Frontend Smoke / Approved Target Only: Run minimal approved admin frontend smoke after deploy approval.
- Task1993 — Frontend Security and Customer Data Exposure Review: Review frontend for sensitive field exposure, route guards, and token handling.
- Task1994 — Frontend Branch Final Review: Close frontend/UX branch with docs/tests/release evidence.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
