# Task 163 - Reverse LINE Binding Implementation Readiness Gate / No Runtime Change

## Background

Task163 reviews implementation readiness for reverse LINE binding.
It does not implement APIs, migrations, Admin UI, LINE / LIFF flows, LINE push, or runtime behavior.

This task aggregates Tasks158-162 and decides whether the reverse LINE binding design package is ready for future implementation planning.

## No-runtime-change Statement

Task163 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- add tests,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- implement invitation APIs,
- implement token generation,
- implement LIFF / LINE trusted context,
- implement Admin UI,
- send LINE / APP / SMS / email,
- implement survey runtime,
- write survey intents or event outbox rows,
- implement AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Reviewed reverse LINE binding design package:

- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`
- `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md`
- `docs/task-160-reverse-line-binding-api-contract-no-runtime-change.md`
- `docs/task-161-reverse-line-binding-admin-ux-operator-runbook-no-runtime-change.md`
- `docs/task-162-reverse-line-binding-security-abuse-case-review-no-runtime-change.md`

Static review confirms the package covers:

- product flow,
- data model proposal,
- API contract,
- Admin UX / operator runbook,
- security / abuse review,
- survey compatibility,
- non-goals and no-runtime boundaries.

## Source-of-truth Index

Current reverse LINE binding source-of-truth package:

| Task | Document | Use as |
| --- | --- | --- |
| Task158 | `task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md` | Product flow / identity boundary / survey compatibility |
| Task159 | `task-159-reverse-line-binding-data-model-proposal-no-migration.md` | Future data model proposal, no migration file |
| Task160 | `task-160-reverse-line-binding-api-contract-no-runtime-change.md` | Future API contract and redaction policy |
| Task161 | `task-161-reverse-line-binding-admin-ux-operator-runbook-no-runtime-change.md` | Future Admin UX and operator runbook |
| Task162 | `task-162-reverse-line-binding-security-abuse-case-review-no-runtime-change.md` | Threat model, abuse cases, fail-closed rules |

No single one of these files is a runtime implementation approval.
Together they are a design package for future planning only.

## Readiness Gate Inventory

Design items currently covered:

- existing Case can be bound to LINE after Case creation,
- binding is invitation-based,
- binding is customer-level with optional Case context,
- raw LINE user id is not a global identity,
- scope remains `organization_id + line_channel_id + line_user_id`,
- token is hash-only in storage,
- invitation statuses are proposed,
- Admin API and public API surfaces are proposed,
- trusted LINE / LIFF context is required for raw provider identity,
- Admin UX should use invitation flow rather than raw-ID manual entry,
- conflict / blocked runbook exists,
- security abuse cases are identified,
- survey coupling is explicitly disallowed.

Items not implemented:

- migration file for `line_binding_invitations`,
- DB apply / dry-run,
- token generation,
- rate limiting,
- invitation APIs,
- public verify / complete APIs,
- trusted LINE / LIFF context,
- Admin UI,
- audit action runtime,
- no-send tests,
- live LINE / APP / SMS / email delivery,
- survey runtime integration.

## Readiness Classification

Current classification:

- ready for design freeze: yes,
- ready for migration proposal planning: yes, if user explicitly chooses that branch,
- ready for migration file authoring: not yet,
- ready for migration apply / dry-run: no,
- ready for API implementation: no,
- ready for Admin UI implementation: no,
- ready for LINE / LIFF runtime: no,
- ready for survey delivery coupling: no,
- ready for outbound messaging: no.

The design package is coherent enough to support a future implementation plan.
It is not an implementation authorization.

## Implementation Phase Proposal

If the user later chooses implementation planning, use phased execution:

### Phase 1 - Design freeze / handoff

- freeze Tasks158-163 as the design package,
- mark open questions,
- define implementation branch options,
- still no runtime change.

### Phase 2 - Migration proposal / no migration file

- draft detailed DDL proposal for `line_binding_invitations`,
- review constraints / indexes / retention,
- decide DB vs service-layer same-org guard,
- no migration file yet.

### Phase 3 - Migration file authoring / no apply

- create migration file only after approval,
- no DB apply,
- no local dry-run without explicit approval packet.

### Phase 4 - API repository / service implementation

- token hash generation,
- invitation lifecycle repository,
- public verify / complete service,
- trusted LINE context boundary,
- audit allow-list,
- no outbound sending.

### Phase 5 - Admin UI implementation

- invitation status panel,
- create / revoke / regenerate UX,
- no raw LINE user id in invitation flow,
- no survey send button.

### Phase 6 - Trusted LINE / LIFF runtime

- channel-scoped identity proof,
- no raw provider id in public form,
- test / smoke only in no-send mode.

### Phase 7 - Survey resolver compatibility

- only after survey runtime policy is approved,
- binding may affect pending-channel delivery eligibility if policy allows,
- no direct survey send from binding API.

## No-go Conditions

Do not start implementation if any of these are true:

- no explicit implementation branch approval,
- no migration branch decision,
- token TTL / attempt policy undecided,
- trusted LINE / LIFF context undecided,
- rate limit policy undecided,
- audit redaction allow-list undecided,
- Admin permission model undecided,
- shared-runtime outbound policy undecided,
- user asks only to "continue" without specifying implementation branch,
- migration apply / dry-run approval packet is missing,
- implementation would require printing or storing sensitive values in docs / logs.

## Go Conditions For Implementation Planning Only

Implementation planning can start when:

- user explicitly chooses reverse LINE binding implementation planning,
- Tasks158-163 are accepted as source design,
- no runtime implementation is expected in that planning task,
- migration / API / Admin / LINE runtime remain separate branches,
- sensitive data policy remains in force.

Planning-only tasks may cover:

- DDL proposal,
- repository/service design,
- API implementation plan,
- Admin UI implementation plan,
- trusted LINE / LIFF integration plan,
- no-send test plan.

## Go Conditions For Runtime Implementation

Runtime implementation requires explicit approval for the specific slice:

- migration file authoring,
- local-only dry-run if DDL is involved,
- backend API implementation,
- Admin UI implementation,
- trusted LINE / LIFF runtime,
- no-send smoke / tests.

Before runtime:

- token entropy / TTL / attempt policy must be finalized,
- rate limit policy must be implementable,
- audit allow-list must be approved,
- trusted LINE / LIFF identity source must be selected,
- DB schema must exist or be approved for creation,
- no shared apply / no outbound sending boundary must be reaffirmed,
- survey coupling must remain disabled unless separately approved.

## Readiness Matrix

| Area | Design artifact | Current status | Blocks migration? | Blocks API implementation? | Blocks Admin implementation? | Blocks LINE/LIFF runtime? | Blocks survey coupling? | Required next approval | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Product flow | Task158 | Ready for planning | No | No | No | No | No | Design freeze | Invitation-based existing Case binding |
| Data model | Task159 | Proposed only | Yes | Yes | Yes | Yes | Yes | Migration proposal branch | No migration file yet |
| Token policy | Tasks159/160/162 | Direction set, details open | Yes | Yes | Yes | Yes | Yes | Token TTL / entropy / attempts | Hash-only, one-time token |
| Status lifecycle | Tasks159/161/162 | Proposed | Yes | Yes | Yes | No | Yes | Status enum confirmation | pending/used/expired/revoked/blocked |
| API endpoints | Task160 | Proposed | No | Yes | Yes | Yes | Yes | API implementation branch | No runtime routes |
| Public verify/complete | Tasks160/162 | Proposed | No | Yes | Yes | Yes | Yes | Trusted context decision | Generic public errors |
| Admin invitation lifecycle | Tasks160/161 | Proposed | No | Yes | Yes | No | Yes | Admin UX branch | Create/revoke/regenerate |
| Auth/permission | Tasks160/161 | Proposed | No | Yes | Yes | No | No | Permission policy | May need future `line.binding.manage` |
| Rate limit / attempts | Tasks159/162 | Proposed | Yes | Yes | No | Yes | No | Abuse policy | Required before public API |
| Audit/logging | Tasks160/162 | Proposed | No | Yes | Yes | Yes | Yes | Audit allow-list | Safe reason codes only |
| Admin UX | Task161 | Proposed | No | No | Yes | No | Yes | Admin implementation branch | No UI implementation yet |
| Conflict runbook | Tasks161/162 | Proposed | No | Yes | Yes | No | Yes | Ops policy | Supervisor escalation for identity conflict |
| Trusted LINE/LIFF context | Tasks158/160/162 | Required, not designed in detail | No | Yes | Yes | Yes | Yes | LINE/LIFF design branch | Do not accept raw public `lineUserId` |
| Survey compatibility | Tasks158/160/161/162 | Guardrails set | No | No | No | No | Yes | Survey policy branch | Binding does not send survey |
| Tests/smoke | Tasks160/161/162 | Plan only | No | Yes | Yes | Yes | Yes | Test implementation branch | No tests added yet |
| Rollout/rollback | Task163 | Not yet detailed | Yes | Yes | Yes | Yes | Yes | Rollout plan | Needed before runtime |

## Freeze / Next-step Recommendation

Recommendation:

- Freeze Tasks158-163 as the reverse LINE binding design package after Task163.
- Do not proceed directly to runtime.
- Default next safe task should be Task164 - Reverse LINE Binding Design Freeze / Implementation Handoff / No Runtime Change.

Alternative if the user explicitly wants implementation planning:

- Task164 - Reverse LINE Binding Migration Proposal / No Migration.

The default should remain design freeze because the package is coherent but still has unresolved runtime policies.

## Remaining Blockers

Remaining blockers:

- no migration proposal freeze,
- no migration file,
- no DB apply / dry-run approval,
- token TTL / entropy / attempts not finalized,
- rate limit implementation not designed,
- trusted LINE / LIFF context not designed in detail,
- audit allow-list not implemented,
- Admin permission split not finalized,
- Admin UI not implemented,
- no backend API implementation,
- no no-send tests,
- no rollout / rollback plan,
- survey pending-channel policy not approved,
- shared-runtime outbound policy not approved.

## Final Recommendation

Task158-163 provide a solid design package for reverse LINE binding.

The project is ready to freeze the design and create an implementation handoff.
It is not ready for runtime implementation, migration apply, local dry-run, LINE / LIFF integration, or survey coupling.

Keep the next step docs-only unless the user explicitly selects a planning branch.

## Non-goals

Task163 does not design or implement:

- backend runtime,
- Admin frontend runtime,
- API clients,
- migration files,
- schema / indexes,
- smoke tests,
- token generation,
- rate limit middleware,
- LIFF integration,
- webhook binding runtime,
- LINE push,
- APP push,
- SMS / email,
- survey sending,
- survey intent / event outbox writes,
- AI automatic decisions,
- inventory docs changes,
- destructive cleanup.

## Verification

Recommended verification for Task163:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
