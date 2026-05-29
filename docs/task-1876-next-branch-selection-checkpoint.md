# Task1876 Next Branch Selection Checkpoint

## Current Engineer Mobile branch state

- `main` is synchronized with `origin/main` at `319825f82ac4ffdc6f6f7161e39de1d1af8849cb`.
- Engineer Mobile visit action no-DB release checkpoint scope is closed.
- Public backend `/healthz` returned `200`.
- Public unauthenticated Engineer Mobile visit-action probes returned `403` safe deny and not `404`.
- SQL repository adapter is implemented with injected `dbClient` only.
- Repository contract hardening is complete.
- Audit boundary is locked.
- requestId propagation is hardened.
- Task1874 Zeabur release checkpoint is accepted and pushed.
- Task1875 branch final review is accepted and pushed.

## Remaining gated Engineer Mobile items

- Task1869: apply migration 023 only to an explicitly named and approved target.
- Task1871: run DB-backed runtime smoke only against an explicitly named and approved target.
- Migration 023 has not been applied to Zeabur/shared/prod DB.
- No seed has been run.
- No DB-backed smoke has been run.
- Seed/admin/test data decisions remain separate approval gates if needed.
- Provider sending remains deferred.

## Candidate branch comparison

| Candidate | Business value | Readiness | Primary risk | Gate impact | Notes |
| --- | --- | --- | --- | --- | --- |
| Customer-facing Completion Report publication | High | Medium | Customer-visible data filtering and publication permission boundaries | Can start with inspection/no-runtime work | Complements Engineer Mobile completion work and validates safe customer-facing projection before provider sending. |
| Repair Intake to Case runtime | High | Medium | Case-domain mutation and migration/transaction coupling | Likely needs DB/runtime gates soon | Valuable, but more likely to touch formal Case creation paths and existing Case invariants. |
| Admin / Dispatch / Operations runtime | Medium/high | Medium | Broad operational workflow scope creep | Can start bounded, but risks expanding across admin UI/runtime | Useful after the customer-facing/publication boundary is clarified. |
| Depot / Workshop Repair runtime | Medium | Lower/medium | New workflow surface and possible schema requirements | Likely needs additional design and DB gating | Good future branch, not the best immediate MVP continuity from Engineer Mobile. |
| SaaS / Entitlement / Billing MVP | High | Lower | Billing/entitlement correctness and provider/payment boundaries | Requires stronger product and security gates | Important but should not be mixed with field-service runtime closure. |
| AI / RAG Assistance Layer | Medium/future | Lower | Permission-aware retrieval, provider keys, customer-visible AI risk | Must remain design-first, no provider execution | Valuable later, but not the next runtime branch. |
| Open Repair Intake / Brand API / Controlled Import | Medium/high | Medium | External intake validation, abuse controls, tenant mapping | Needs careful API and data ownership gates | Strong future candidate after core customer-visible report policy is settled. |
| Customer AI / Portal / LINE-safe channel integration | Medium/future | Lower | Customer-visible AI/channel identity and provider sending risk | Requires provider/channel guardrails first | Should wait until customer-visible data policy and publication path are more mature. |

## Recommendation

Recommended next branch: Customer-facing Completion Report publication.

Reasoning:

- It is the highest-value continuation from Engineer Mobile visit-action work because it connects field execution progress to customer-visible service outcomes.
- It can start with read-only inspection and resolver boundary work before any customer-visible publication smoke.
- It validates safe customer-visible data filtering without requiring provider sending, billing provider work, or AI provider execution.
- It keeps the remaining Engineer Mobile DB gates isolated: Task1869 and Task1871 can stay blocked until explicit migration/smoke target approvals.
- It reinforces existing invariants around one Case = one formal Completion Report / Field Service Report and keeps `finalAppointmentId` backend/system-owned.

## Proposed next batch

If PM accepts this recommendation, propose:

- Task1877 — Customer-facing Report Publication Readiness Inspection / No Runtime
- Task1878 — Customer Access Resolver Runtime Wiring / No DB Migration

Hard stop before:

- DB/migration work
- customer-visible publication smoke
- provider sending
- billing provider work
- AI provider execution
- schema mutation

Task1877 should be inspection-only and should confirm the current Completion Report / Field Service Report model, customer-visible field policy, route/read-model boundaries, permission model, and publication gates.

Task1878 should be bounded resolver wiring only if Task1877 finds a safe existing path. It must not run DB migration, create customer-visible publication, provider-send, mutate `finalAppointmentId`, or bypass organization isolation.

## Explicit non-goals

- No migration apply.
- No DB-backed smoke.
- No provider sending.
- No billing provider.
- No AI provider execution.
- No admin frontend deploy.
- No Completion Report schema mutation.
- No Completion Report / Field Service Report creation, approval, or publication.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior in Task1876.
- No Zeabur deploy or env changes.

## Planning-only confirmations

- Task1876 is docs-only.
- No runtime source changes.
- No test changes.
- No DB connection.
- No SQL execution.
- No migration dry-run or apply.
- No seed.
- No smoke.
- No Zeabur access or deploy.
- No provider sending.
- No secrets printed.
- No Completion Report / Field Service Report behavior.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior.
- The 7 held historical untracked docs were untouched.
