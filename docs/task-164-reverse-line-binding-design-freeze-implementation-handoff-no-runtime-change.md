# Task 164 - Reverse LINE Binding Design Freeze / Implementation Handoff / No Runtime Change

## Background

Task164 freezes the reverse LINE binding design package and prepares implementation handoff.
It does not implement APIs, migrations, Admin UI, LINE / LIFF flows, LINE push, or runtime behavior.

This freeze covers Tasks158-163 and marks the current reverse LINE binding design package as stable for future planning.

## No-runtime-change Statement

Task164 does not:

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

Reviewed and frozen as the current reverse LINE binding design package:

- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`
- `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md`
- `docs/task-160-reverse-line-binding-api-contract-no-runtime-change.md`
- `docs/task-161-reverse-line-binding-admin-ux-operator-runbook-no-runtime-change.md`
- `docs/task-162-reverse-line-binding-security-abuse-case-review-no-runtime-change.md`
- `docs/task-163-reverse-line-binding-implementation-readiness-gate-no-runtime-change.md`

Task164 does not replace those files. It provides a stable handoff index and a freeze boundary.

## Source-of-truth Index

| Area | Source document | Current use |
| --- | --- | --- |
| Product flow | Task158 | Existing Case can be invited into verified LINE binding without requiring LINE-origin Case creation |
| Identity scope | Task158 | `organization_id + line_channel_id + line_user_id` remains the identity scope |
| Data model | Task159 | `line_binding_invitations` proposal, no migration file |
| API contract | Task160 | Admin invitation lifecycle and public verify / complete contract |
| Admin UX | Task161 | Future invitation panel and operator runbook |
| Security | Task162 | Threat model, abuse cases, fail-closed rules |
| Readiness gate | Task163 | Implementation readiness classification and blocker matrix |

Future implementers should treat Task164 plus Tasks158-163 as the reverse LINE binding handoff package.

## Freeze Scope

Frozen for current design:

- invitation-based reverse LINE binding,
- customer-level identity binding with optional Case invitation context,
- raw LINE user id is not a global identity,
- organization + LINE channel scope is mandatory,
- token must be high entropy, one-time, and hash-only in storage,
- plaintext token / invitation URL may be shown once only at creation,
- future statuses include pending / used / expired / revoked / blocked,
- public errors should be generic,
- Admin errors should use safe reason codes,
- raw LINE user id must not be accepted from untrusted public form input,
- trusted LINE / LIFF / webhook context is required for provider identity,
- Admin invitation UX must be separate from manual raw-ID operational linking,
- binding does not complete Case / Report,
- binding does not alter `finalAppointmentId`,
- binding does not create survey intent,
- binding does not send survey,
- binding does not send LINE push by default.

## Freeze Non-approval Statement

Freeze means the current design package is stable enough to reference.

Freeze does not mean:

- migration is approved,
- migration file should be authored,
- DB dry-run is approved,
- DB apply is approved,
- runtime APIs are approved,
- Admin UI implementation is approved,
- LINE / LIFF runtime is approved,
- LINE push is approved,
- survey runtime is approved,
- survey delivery is approved,
- shared runtime mutation is approved,
- secrets or raw provider identifiers may be logged.

General wording such as "continue", "next", or "go ahead" must not be treated as migration / DB / runtime approval.

## Implementation Handoff Checklist

Before any implementation task, confirm:

- which branch is being selected:
  - migration proposal,
  - migration file authoring,
  - API implementation,
  - Admin UI implementation,
  - trusted LINE / LIFF integration,
  - no-send test / smoke,
  - survey compatibility resolver,
  - product mainline return;
- whether the task is docs-only or runtime;
- whether migration file creation is explicitly allowed;
- whether DB dry-run / apply is explicitly allowed;
- whether shared runtime is excluded;
- token TTL / attempt policy;
- rate limit policy;
- audit allow-list;
- trusted LINE / LIFF identity source;
- role / permission model;
- no outbound sending boundary;
- no survey coupling boundary;
- sensitive output rules.

If any answer is missing, keep the task docs-only.

## Implementation Phase Handoff

Recommended phase order:

1. Design handoff QA.
2. Migration proposal / no migration file.
3. Migration file authoring / no apply.
4. Local-only dry-run only with explicit approval packet.
5. Backend invitation repository / service.
6. Admin invitation lifecycle APIs.
7. Public verify / complete APIs.
8. Trusted LINE / LIFF context implementation.
9. Admin invitation UX.
10. No-send integration / browser tests.
11. Survey pending-channel compatibility only if separately approved.
12. Outbound delivery only after product / privacy / provider approval.

Each phase should preserve no raw LINE user id in public payloads and no survey sending from binding flows.

## Remaining Blockers

Still unresolved:

- migration proposal not frozen,
- migration file not authored,
- no DB apply / dry-run approval,
- token entropy / TTL / attempt limit not finalized,
- rate limit mechanism not selected,
- trusted LINE / LIFF context not designed in detail,
- audit allow-list not implemented,
- Admin permission split not finalized,
- manual raw-ID operational tool policy not finalized,
- customer-facing copy / privacy wording not finalized,
- completed Case binding policy not finalized,
- survey pending-channel late-binding policy not approved,
- shared-runtime outbound policy not approved,
- no runtime tests.

## Reopen Conditions

Reopen reverse LINE binding docs if:

1. Product flow changes.
2. Data model changes.
3. API endpoint contract changes.
4. Admin UX requirement changes.
5. Security review finds a new gap.
6. Trusted LINE / LIFF approach changes.
7. `customer_line_identities` schema changes.
8. Survey resolver compatibility changes.
9. Product chooses case-specific binding only.
10. Product chooses customer-level binding only.
11. Raw LINE id handling policy changes.
12. Admin manual link tool policy changes.
13. Privacy / legal retention policy changes.
14. User approves implementation and a design gap is discovered.

Do not reopen just to restate already frozen constraints.

## Future Implementer Reading Order

Recommended order:

1. Task164 freeze / handoff.
2. Task163 readiness gate.
3. Task162 security / abuse review.
4. Task158 product design.
5. Task159 data model proposal.
6. Task160 API contract.
7. Task161 Admin UX / runbook.
8. Existing `customer_line_identities` schema / service.
9. Existing LINE channel / webhook code.
10. Existing Admin `CustomerLineIdentitiesPanel`.

Important reminders:

- Do not start from API code alone.
- Do not start from the existing manual raw-ID Admin tool.
- Do not implement token generation without the security gate.
- Do not implement Admin UX without API / data model decisions.
- Do not send LINE messages from binding creation by default.
- Do not couple binding completion directly to survey sending.

## Task165 Recommendation

Default recommended next task:

```text
Task165 - Reverse LINE Binding Handoff QA / Next Branch Selection / No Runtime Change
```

Scope:

- docs-only,
- QA Tasks158-164 handoff consistency,
- confirm freeze wording does not imply implementation approval,
- choose next branch:
  - stay paused / docs-only,
  - migration proposal,
  - API implementation planning,
  - Admin UX planning,
  - product mainline return.

Alternative only if the user explicitly chooses migration planning:

```text
Task165 - Reverse LINE Binding Migration Proposal / No Migration
```

Scope:

- docs-only migration proposal,
- draft future `line_binding_invitations` DDL,
- no migration file,
- no apply,
- no runtime.

## Final Recommendation

Freeze Tasks158-164 as the reverse LINE binding design and handoff package.

The project is ready for a docs-only QA / next-branch selection task.
It is not ready for migration file authoring, DB dry-run, runtime API implementation, Admin UI implementation, trusted LINE / LIFF runtime, LINE push, or survey coupling.

## Non-goals

Task164 does not design or implement:

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

Recommended verification for Task164:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
