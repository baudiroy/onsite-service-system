# Task2014 Branch-to-Smoke Dependency Matrix / No Smoke

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 20 - Staged Runtime Authorization and Matrix Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2014-branch-to-smoke-dependency-matrix-no-smoke.md`
- This document is no-smoke planning only.
- This document does not authorize smoke execution, endpoint probes, DB access, migration, seed, deploy, Zeabur observation, provider execution, billing execution, AI execution, or secret handling.

## Branch Dependency Matrix

| Branch | Current no-DB status | Route availability status if known | DB / migration dependency | Seed / test data dependency | Auth / admin / customer token dependency | Public safe-deny smoke dependency | DB-backed allow-path smoke dependency | Provider / billing / AI dependency | Stop conditions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Engineer Mobile | No-DB/runtime route work and branch closure are documented; DB-backed smoke remains gated. | Runtime route wiring and public safe-deny behavior were previously documented; current task does not re-observe live route state. | Migration 023 apply gate remains paused; DB-backed visit-action smoke depends on approved DB target. | Seed/test data must be separate and explicitly approved if needed. | Engineer identity/organization scope required for authenticated allow-path checks. | Future Task2019 and related public safe-deny tasks require exact target URL. | Task1871 and future Task2037 require exact target, DB target, and non-destructive fixture scope. | No provider/billing/AI dependency for first safe-deny; provider/billing/AI remain forbidden. | Stop if target URL, DB target, engineer identity, organization scope, or fixture policy is unclear. |
| Customer-facing Report | Customer projection, route boundary, publication guards, and hardening are documented; customer-visible allow behavior remains gated. | Customer-facing route safe-deny/status semantics were documented; current task does not probe endpoints. | DB-backed report projection smoke depends on approved DB target and publication state. | Customer/report fixture data must be scoped; seed must be separately approved. | Customer identity/link scope required; LINE must not be treated as global identity. | Future Task2020 requires exact public target and route family. | Future Task2038 and customer-visible allow-path smoke require exact customer scope and data filters. | AI/provider not required for smoke; customer-visible publication behavior remains separately gated. | Stop if customer identity, org scope, publication state, or data filter is ambiguous. |
| Repair Intake | Draft repository/service/route readiness and branch final review are documented; DB-backed smoke remains gated. | Repair intake route boundary documented; current task does not probe public routes. | DB-backed draft-to-case path depends on approved DB target; migration/seed remain separate. | Draft/case fixture and duplicate-candidate setup require exact scope. | Admin/operator identity scope may be required for route checks. | Future Task2021 requires exact target and expected safe-deny behavior. | Task1894 and future Task2039 require exact DB target and fixture boundary. | Provider/billing/AI not needed for first smoke; formal case creation remains outside generic approval. | Stop if smoke would create formal case, mutate customer-visible state, or require unapproved DB writes. |
| Admin Dispatch | Repository/service/route guard, organization isolation, audit, smoke readiness, and branch final review are documented. | Admin dispatch permission route exists in docs; current task does not test endpoint reachability. | DB-backed assignment/status smoke depends on approved DB target. | Dispatch appointment fixture and admin scope must be explicit. | Admin token/role and organization scope required; credentials must not be printed. | Future Task2022 requires exact target and permission-deny route scope. | Task1906 and future Task2040 require exact admin identity, DB target, and allowed operations. | Billing/provider/AI not required; no invoice/payment behavior allowed. | Stop if admin role, organization scope, DB target, or assignment mutation boundary is unclear. |
| Depot Workshop | Depot/workshop repository/status/assignment/access/audit readiness and final review are documented. | Depot/workshop route wiring is documented; current task does not probe endpoints. | DB-backed depot/workshop smoke depends on approved DB target. | Depot repair fixture and customer-visible data filter scope must be explicit. | Role/service-provider/subcontractor identity and org scope may be required. | Future Task2023 requires exact public target and safe-deny route family. | Task1917 and future Task2041 require exact DB target and non-destructive fixture scope. | Provider/billing/AI not required; customer-visible data filter remains a hard boundary. | Stop if access role, org scope, repair fixture, or customer-visible filter is ambiguous. |
| SaaS Entitlement | Entitlement model, usage boundary, trial guard, billing separation, permission contract, audit, and smoke readiness are documented. | SaaS entitlement route/status availability is not rechecked here. | DB-backed entitlement smoke depends on approved DB target and tenant/plan scope. | Tenant/plan/test data setup must be exact; seed separate if needed. | Admin/tenant identity and organization scope required. | Future safe-deny tasks may include SaaS route categories with exact target approval. | Task1927 and future Task2042 require clarified SaaS smoke semantics plus exact target/DB scope. | Billing provider calls, invoices, payments, and payment methods remain forbidden unless separately approved. | Stop if Task1927 semantics, tenant scope, billing mode, or DB target is unclear. |

## Gated Smoke Tasks

Already identified pre-2000 gates:

- Task1871 - Engineer Mobile DB-backed Runtime Smoke / Approved Target Only.
- Task1894 - Repair Intake DB-backed Smoke / Approved Target Only.
- Task1906 - Admin Dispatch Smoke / Approved Target Only.
- Task1917 - Depot Workshop DB-backed Smoke / Approved Target Only.
- Task1927 - SaaS Admin Runtime Smoke or MVP readiness gate requiring clarification.

Future public/safe-deny smoke planning/execution gates:

- Task2018-Task2024: public healthz and public safe-deny smoke sequence and consolidation.
- These tasks still require exact target URL/name before any smoke or endpoint probe.

Future DB-backed smoke gates:

- Task2037-Task2048: DB-backed smoke by branch, cross-branch organization isolation, customer-visible data filters, audit, permission deny matrix, consolidation, and runtime gate review.
- These tasks require approved DB target, fixture/data policy, identity scope, and no-secret reporting.

## Dependency Rules

- Public safe-deny smoke may happen before DB-backed smoke only with exact target approval.
- DB-backed read-only smoke requires approved DB target and read-only route list.
- DB-backed write smoke requires approved DB target, fixture scope, allowed write operations, and cleanup/rollback expectations.
- Customer-visible allow-path smoke requires exact customer identity scope and data filter confirmation.
- Admin permission smoke requires exact admin role, organization scope, and credential handling outside Codex secrets.
- No smoke category authorizes deploy, DB migration, seed, provider sending, billing, AI, `finalAppointmentId` mutation, or Completion Report / FSR behavior.

## Recommended Next Step

Proceed to Task2015 as a no-execution runtime gate consolidation review. Do not start Task2016 or any smoke task from this matrix.
