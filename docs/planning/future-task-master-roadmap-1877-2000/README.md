# Future Task Master Roadmap — Task1877 to Task2000

Status:
- Draft PM planning packet.
- Not authorization to execute.
- Complements the existing Task1865–1876 Engineer Mobile runtime packet.
- Each task must still be explicitly assigned and accepted by PM.
- Gates for DB, migration, seed, deploy, smoke, provider calls, billing, and AI/RAG cannot be skipped.

## Current baseline assumed before this packet

- Task1861 route wiring deployed and reachable.
- Zeabur `/healthz` returns 200.
- Unauthenticated Engineer Mobile route returns 403 safe deny, not 404.
- Task1864 migration 023 disposable local/test dry-run passed.
- Task1865–1876 packet covers Engineer Mobile branch completion.
- This packet starts after Task1876 or after PM explicitly reprioritizes.

## Execution principles

- One bounded task at a time unless PM explicitly authorizes a small batch that does not cross gates.
- Every task must produce a completion report.
- Every task that changes code or docs should be committed separately.
- Push requires explicit approval.
- DB/migration/seed/deploy/smoke/provider/billing/AI actions require separate explicit approval.
- Draft task files are not execution authorization.

## Phase roadmap

| Phase | Tasks | Purpose | Gate before next phase |
|---|---:|---|---|
| Phase 8 — Customer-facing Completion Report Publication | Task1877–1886 | Expose safe customer-visible repair results through filtered publication views without allowing customers to create, approve, publish, or mutate formal FSR/Completion Report data. | Proceed only after Engineer Mobile branch closure and PM approval for customer-facing runtime. |
| Phase 9 — Repair Intake to Case Runtime | Task1887–1897 | Convert repair intake drafts into formal Cases through controlled runtime paths while preserving draft/import/dedupe/reporter/customer/billing-contact separation. | Proceed only after customer-facing publication branch acceptance or PM explicit reprioritization. |
| Phase 10 — Admin Dispatch and Operations Runtime | Task1898–1907 | Enable internal operations for dispatch, appointment assignment, status transitions, and admin permission checks without breaking appointment lifecycle or org isolation. | Proceed after Repair Intake runtime branch or PM explicit reprioritization. |
| Phase 11 — Depot and Workshop Repair Runtime | Task1908–1918 | Support depot/workshop repair flows, workshop assignments, brand/service-provider/subcontractor access, and safe customer-visible filtering. | Proceed after dispatch/admin branch or PM explicit reprioritization. |
| Phase 12 — SaaS Entitlement and Billing MVP | Task1919–1928 | Make the platform SaaS-ready through tenant isolation, entitlement, usage metering, trial limits, billing-contact separation, and MVP readiness review without connecting payment providers yet. | Proceed after core workflow branches or PM explicit business priority decision. |
| Phase 13 — AI and RAG Assistance Layer | Task1929–1940 | Introduce advisory AI/RAG support for narrow fields and events without permitting AI to bypass permissions, mutate records, or expose sensitive/customer data. | Proceed only after core runtime and SaaS guardrails are stable enough to protect AI boundaries. |
| Phase 14 — Open Repair Intake, Brand API, and Controlled Import | Task1941–1952 | Support open intake forms, brand/service-provider APIs, and Excel/CSV imports while protecting draft boundaries, dedupe, and identity separation. | Proceed after Repair Intake runtime is stable and PM approves external intake expansion. |
| Phase 15 — Customer AI, Customer Portal, and LINE-safe Channel Integration | Task1953–1963 | Improve customer-facing assistance and portal/channel flows while ensuring LINE is not a global identity and AI remains advisory. | Proceed only after customer-facing report and AI guardrails are accepted. |
| Phase 16 — Security, ISO27001 Readiness, and Compliance Hardening | Task1964–1975 | Strengthen security controls, evidence, auditability, incident readiness, and ISO27001-aligned documentation without overclaiming certification. | Proceed after MVP workflows are stable enough to generate meaningful security evidence. |
| Phase 17 — Observability, Operations, Backup, and Disaster Recovery | Task1976–1985 | Prepare operational visibility and safe maintenance practices for MVP trial operations. | Proceed after core runtime and security controls are sufficient for operational monitoring. |
| Phase 18 — Admin Frontend, Engineer Mobile UX, and PWA Hardening | Task1986–1994 | Prepare admin frontend and engineer mobile UX for operational use while preserving backend authority and permission boundaries. | Proceed when backend APIs are stable enough to avoid rework. |
| Phase 19 — Billing Provider, Settlement, and Invoicing Gate | Task1995–2000 | Prepare billing provider and settlement/invoicing integration only after SaaS entitlement and usage metering are accepted. | Proceed only after SaaS MVP readiness review and explicit billing provider decision. |

## Global no-go boundaries

- Do not create or publish Completion Report / Field Service Report unless a task explicitly scopes formal report publication internals and PM approves.
- Do not mutate finalAppointmentId casually.
- Do not expose raw DB rows, secrets, SQL errors, internal notes, or customer-sensitive data.
- Do not hard-code LINE as global identity.
- Do not bypass organization isolation or permission checks.
- Do not run migrations against shared/prod DB from generic instructions.
- Do not run provider sending or real billing charges unless explicitly scoped and approved.

## Recommended order

- Phase 8 — Customer-facing Completion Report Publication (Task1877–1886)
- Phase 9 — Repair Intake to Case Runtime (Task1887–1897)
- Phase 10 — Admin Dispatch and Operations Runtime (Task1898–1907)
- Phase 11 — Depot and Workshop Repair Runtime (Task1908–1918)
- Phase 12 — SaaS Entitlement and Billing MVP (Task1919–1928)
- Phase 13 — AI and RAG Assistance Layer (Task1929–1940)
- Phase 14 — Open Repair Intake, Brand API, and Controlled Import (Task1941–1952)
- Phase 15 — Customer AI, Customer Portal, and LINE-safe Channel Integration (Task1953–1963)
- Phase 16 — Security, ISO27001 Readiness, and Compliance Hardening (Task1964–1975)
- Phase 17 — Observability, Operations, Backup, and Disaster Recovery (Task1976–1985)
- Phase 18 — Admin Frontend, Engineer Mobile UX, and PWA Hardening (Task1986–1994)
- Phase 19 — Billing Provider, Settlement, and Invoicing Gate (Task1995–2000)
