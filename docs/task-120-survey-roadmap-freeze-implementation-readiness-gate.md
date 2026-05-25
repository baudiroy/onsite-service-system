# Task 120 - Survey Roadmap Freeze / Implementation Readiness Gate

## Background And Constraints

Task 120 freezes the current survey design documentation expansion after Tasks 110 through 119.

Task 120 is documentation-only:

- no migration,
- no schema or index change,
- no runtime behavior change,
- no API change,
- no survey sending,
- no notification sending,
- no LINE / APP / SMS / email delivery,
- no Admin UI,
- no AI automatic decision,
- no inventory docs expansion.

Freeze does not mean implementation is approved.

Freeze means no more survey docs expansion is expected unless a real product, policy, architecture, privacy, or runtime behavior change occurs.

## Frozen Survey Design Scope

The following design areas are considered stable for the current pre-implementation phase:

- first-transition survey trigger source of truth,
- Case-level survey context,
- completed report `finalAppointmentId` stability,
- repeat completion no-side-effect boundary,
- survey intent / event outbox proposal,
- migration readiness blockers,
- survey policy / suppression / eligibility layers,
- delivery resolver / channel selection boundary,
- survey content / versioning / template boundary,
- survey response ownership,
- Admin read-only visibility boundary,
- reverse LINE / APP binding compatibility,
- AI risk radar advisory-only boundary.

## Source Documents

Current survey design source sequence:

1. `docs/task-110-post-completion-survey-trigger-first-transition-design.md`
2. `docs/task-111-survey-intent-event-outbox-schema-proposal-and-transaction-boundary-design.md`
3. `docs/task-112-survey-intent-event-outbox-migration-readiness-review.md`
4. `docs/task-113-survey-policy-suppression-eligibility-design.md`
5. `docs/task-114-survey-delivery-resolver-channel-selection-design.md`
6. `docs/task-115-survey-content-versioning-template-contract-design.md`
7. `docs/task-116-survey-response-intake-feedback-ownership-design.md`
8. `docs/task-117-admin-survey-visibility-role-dashboard-design.md`
9. `docs/task-118-reverse-line-binding-survey-delivery-compatibility-design.md`
10. `docs/task-119-ai-risk-radar-survey-feedback-boundary-design.md`
11. `docs/task-120-survey-roadmap-freeze-implementation-readiness-gate.md`

Task 087 inventory guide remains frozen and is unrelated to survey docs expansion.

Upstream behavior dependencies:

- Task 104 defines Case / appointment / Field Service Report consistency.
- Task 105 defines backend-owned final appointment inference contract.
- Task 106 implements backend inference when `finalAppointmentId` is omitted.
- Task 107 simplifies Admin completion payload so backend is source of truth.
- Task 108 covers no eligible completed visit Admin error path.
- Task 109 hardens repeat completion so completed reports reject repeat completion before side effects.

## Non-negotiable Invariants

Any future survey implementation must preserve:

- one Case = one formal Field Service Report,
- one Case may have multiple appointments / visits,
- survey is Case-level post-completion context,
- appointment history may be referenced but does not create multiple formal reports,
- `finalAppointmentId` is backend / system resolved,
- completed report `finalAppointmentId` is stable,
- repeat completion conflict creates no survey side effects,
- no eligible completed visit rejection creates no survey side effects,
- delivery retry does not create a new first-transition trigger,
- AI is advisory only,
- LINE is the current major channel candidate, but survey trigger, intent, resolver, and completion core remain channel-agnostic,
- raw LINE user id and customer mobile are not survey payload data.

## Implementation Readiness Gate

Before migration or runtime work begins, all gates below must be satisfied.

### Product Policy Gate

Decide:

- feature flag and default-disabled behavior,
- survey feature default state,
- surveyable Case types,
- survey target contact policy,
- legacy no-appointment policy,
- smoke / internal / test suppression policy,
- opt-out policy,
- expiration policy,
- resend / reminder policy,
- high-risk complaint manual follow-up policy.

### Schema Gate

Finalize:

- survey intent table scope,
- event outbox table scope,
- organization scope,
- lifetime idempotency strategy,
- outbox lock / retry fields,
- safe payload allow-list,
- retention / archival strategy,
- response table exclusion or inclusion for the migration being proposed.
- historical completed Case / Report backfill policy.

Default recommendation:

- no automatic backfill,
- no real outbound survey for historical completions,
- no historical delivery without explicit product policy approval.

### Transaction Gate

Choose:

- strict atomic completion + survey intent + outbox write,
- or completion-first recovery model.

If completion-first recovery is chosen, define:

- missing intent detector,
- safe backfill rule,
- dedupe,
- no real outbound before policy gates.

Also finalize organization-scoped uniqueness and lifetime idempotency. Soft delete must not bypass first-completion idempotency.

### Delivery Gate

Finalize:

- delivery resolver states,
- channel priority,
- no-channel behavior,
- reverse LINE / APP binding behavior,
- pending-channel expiration / delivery window,
- opt-out precedence,
- not deliverable / suppressed / manual follow-up semantics.

### Content And Response Gate

Finalize:

- initial survey version strategy,
- draft / published / retired lifecycle,
- response ownership,
- duplicate response policy,
- free-text redaction,
- complaint / callback review workflow,
- survey response retention.

### Admin And AI Gate

Finalize:

- Admin role visibility,
- full feedback text permission,
- audit requirement for sensitive views,
- dashboard privacy / small-count suppression,
- AI redaction and prompt-injection policy,
- AI learning signal minimization,
- human approval requirements.

### Outbox Operations Gate

Finalize:

- `organization_id` scope,
- `occurred_at`,
- `lock_expires_at`,
- retry / backoff,
- poison / dead status,
- duplicate worker safety,
- `last_error` redaction and max length,
- processed / failed event retention,
- no provider raw payload in outbox.

### Privacy / Retention / Export Gate

Finalize:

- survey intent retention,
- outbox retention,
- delivery log retention,
- feedback text retention,
- AI summary retention,
- redaction policy,
- export policy,
- audit policy for sensitive views.

### Test / Rollout Gate

Prepare:

- migration proposal review,
- rollback plan,
- rollout plan,
- runtime feature flag plan,
- runtime feature flag,
- smoke/internal suppression tests,
- no-real-outbound guarantee for shared runtime and smoke/internal/test cases,
- first-transition idempotency tests,
- repeat completion no-event tests,
- no eligible completed visit no-event tests,
- channel abstraction tests,
- redaction tests,
- Admin permission tests,
- AI no-auto-action tests.
- safe logs / metrics / alerting for duplicate intent or outbox failures.

## Explicit Non-goals After Freeze

The freeze does not allow:

- migration 020,
- schema changes,
- runtime survey intent creation,
- outbox worker,
- delivery resolver implementation,
- notification sending,
- LINE push,
- APP push,
- SMS / email delivery,
- Admin survey UI,
- manual survey send,
- manual final appointment picker,
- AI automatic decision,
- survey response intake,
- reverse LINE binding implementation,
- historical completed Case backfill,
- survey link / token generation,
- notification template seed,
- survey content seed,
- delivery attempt table,
- provider delivery logs,
- response intake endpoint,
- webhook intake,
- customer contact schema change,
- opt-out schema change,
- Admin dashboard / export,
- manual follow-up workflow,
- AI prompt pipeline,
- AI model call,
- AI storage,
- AI-generated official note,
- historical survey response import,
- shared-runtime real outbound delivery,
- inventory docs expansion.

No survey roadmap task may weaken Task 109 repeat-completion conflict guard or allow repeat completion to create intent, outbox, delivery, notification, or survey response side effects.

## Reopen Conditions

Reopen survey docs only if:

1. Product policy changes.
2. Survey trigger source of truth changes.
3. Completion flow changes.
4. `finalAppointmentId` behavior changes.
5. Event outbox architecture changes.
6. Channel abstraction changes.
7. Reverse LINE / APP binding policy changes.
8. Privacy / redaction policy changes.
9. Admin role permission model changes.
10. AI scope changes.
11. Survey response ownership changes.
12. A future migration proposal finds a contradiction.
13. Real operator / developer confusion remains after following the docs.
14. Legacy no-appointment survey default changes.
15. Smoke / internal / test suppression policy changes.
16. Channel strategy changes, including APP becoming primary or SMS / email being removed.
17. Pending-channel expiration or reverse binding policy changes.
18. Contact target policy changes.
19. Notification / delivery log boundary changes.
20. Event outbox atomicity strategy changes.
21. Migration proposal changes tenant scope, uniqueness, or soft delete behavior.
22. Repeat completion behavior changes.
23. Admin UI proposes manual send, resend, override, export, or final appointment picker.
24. Legal / privacy / security review requires payload, retention, or redaction changes.
25. Real outbound delivery is being considered.

## Recommended Next Step

Do not jump directly to survey runtime implementation.

Recommended next task after freeze:

- Task 121 - Survey Intent / Event Outbox Migration 020 Proposal Review / No-Apply Gate

Task 121 should still be review-first. It may draft and review a future migration proposal, columns, constraints, indexes, rollback / rollout checklist, and test plan, but it must not create or apply migration 020 until a later task explicitly approves implementation.

## Task 120 Decision

Survey design docs are frozen for the current pre-implementation phase.

The project should now pause survey documentation expansion and only proceed toward migration / runtime after the implementation readiness gates are satisfied.

## ChatGPT Design Review Integration

The project ChatGPT branch reviewed Task 120 as part of the Codex / ChatGPT workflow.

Review outcome:

- Survey roadmap freeze is appropriate after Tasks 110 through 119.
- The wording was corrected from LINE-only to channel-agnostic with LINE as the current major channel candidate.
- Upstream Task 104 through 109 dependencies were added.
- Readiness gates now include feature flag/default disabled, historical backfill, contact target, pending-channel expiration, outbox operations, privacy/retention/export, smoke no-real-outbound guarantee, and rollout/rollback/observability.
- Explicit non-goals and reopen conditions were expanded.
- Task 121 is framed as migration proposal review / no-apply gate, not migration implementation.
