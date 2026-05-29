# Phase 8 — Customer-facing Completion Report Publication

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1877–1886

Purpose:
- Expose safe customer-visible repair results through filtered publication views without allowing customers to create, approve, publish, or mutate formal FSR/Completion Report data.

Gate:
- Proceed only after Engineer Mobile branch closure and PM approval for customer-facing runtime.

Tasks:
- Task1877 — Customer-facing Report Publication Readiness Inspection / No Runtime: Inspect existing customer-facing report docs, routes, resolver boundaries, publication state, and DTO requirements. Produce no runtime changes.
- Task1878 — Customer Access Resolver Runtime Wiring / No DB Migration: Wire the customer access resolver into the runtime boundary using existing guards; no schema changes and no customer-visible report projection yet.
- Task1879 — Customer-facing Report Projection Service / Filtered DTO Only: Implement filtered projection service for customer-visible report fields only; no formal FSR mutation, approval, or publication.
- Task1880 — Customer-facing Report Route / Safe Deny / No Raw Case Data: Add customer-facing route returning safe envelopes and generic deny responses; never expose raw Case rows or internal notes.
- Task1881 — Customer-facing Report Publication State Guard: Enforce publication state rules so only published/allowed views are visible; no creation or approval behavior.
- Task1882 — Customer Identity Link Resolver / LINE Not Global Identity: Implement/strengthen identity link resolver so LINE is one channel identifier, not a global customer identity.
- Task1883 — Customer-facing Report Zeabur Route Smoke / Approved Target Only: Run minimal approved customer-facing route smoke only after target approval; no fixture/destructive smoke.
- Task1884 — Customer-facing Report Audit Log Boundary: Record safe audit entries for customer report access without exposing customer-sensitive or internal data.
- Task1885 — Customer-facing Report Runtime Hardening: Harden safe-deny, requestId propagation, sanitized errors, permission edge cases, and DTO stability.
- Task1886 — Customer-facing Report Branch Final Review: Review branch acceptance, invariants, tests, docs, Zeabur behavior, and remaining risk before closure.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
