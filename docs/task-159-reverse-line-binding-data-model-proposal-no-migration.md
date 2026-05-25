# Task 159 - Reverse LINE Binding Data Model Proposal / No Migration

## Background

Task159 proposes the future data model for existing Case reverse LINE binding based on Task158.

The purpose is to define future tables / fields / constraints / indexes / audit posture before any migration is authored.

This task does not create a migration file, modify schema, implement APIs, send LINE messages, add LIFF flow, or change runtime behavior.

## No-migration / No-runtime Statement

Task159 does not:

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
- implement token generation,
- implement LINE binding API,
- implement LIFF callback,
- implement webhook runtime,
- send LINE / APP / SMS / email,
- implement survey runtime,
- write survey intents or event outbox rows,
- implement AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Reviewed for schema conventions and identity boundaries:

- `migrations/001_create_base_tables.sql`
- `migrations/002_create_cases.sql`
- `migrations/012_create_line_integration_tables.sql`
- `src/repositories/CustomerLineIdentityRepository.js`
- `src/services/CustomerLineIdentityService.js`
- `src/services/LineService.js`
- `src/services/CustomerInquiryService.js`
- `src/mappers/lineMapper.js`
- `docs/future-existing-case-to-line-binding-memo.md`
- `docs/task-118-reverse-line-binding-survey-delivery-compatibility-design.md`
- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`

## Current Schema Convention Review

Current conventions:

- primary keys use `uuid DEFAULT gen_random_uuid()`,
- important operational rows use `organization_id`,
- soft-delete / inactive history commonly uses nullable timestamp columns such as `deleted_at` or `unlinked_at`,
- timestamps generally use `timestamptz`,
- uniqueness for active rows commonly uses partial unique indexes,
- sensitive provider values are masked in DTOs,
- audit-sensitive records should not rely on destructive cascade deletion,
- multi-organization LINE identity scope must remain `organization_id + line_channel_id + line_user_id`.

Current LINE-related schema:

- `line_channels` belongs to one organization.
- `customer_line_identities` links customer / organization / channel / line user identity.
- active `customer_line_identities` uniqueness is scoped by `line_channel_id + line_user_id`.
- `line_events` records channel-scoped inbound events and safe linked customer / case references.

Task159 does not change existing tables.

## Proposed `line_binding_invitations` Table

Future table concept:

```text
line_binding_invitations
- id uuid primary key
- organization_id uuid not null
- line_channel_id uuid not null
- case_id uuid nullable
- customer_id uuid not null
- token_hash text not null
- status text not null
- expires_at timestamptz not null
- used_at timestamptz nullable
- revoked_at timestamptz nullable
- created_by_user_id uuid nullable
- created_at timestamptz not null
- updated_at timestamptz not null
- attempt_count integer not null default 0
- last_attempt_at timestamptz nullable
- last_failure_reason text nullable
- used_customer_line_identity_id uuid nullable
```

Recommended `status` values:

- `pending`
- `used`
- `expired`
- `revoked`
- `blocked`

Recommended semantics:

- `pending`: invitation can still be used if not expired and attempt policy allows.
- `used`: invitation was successfully verified and linked.
- `expired`: invitation passed its allowed window.
- `revoked`: invitation was manually or automatically revoked.
- `blocked`: invitation is no longer usable because of abuse / conflict policy.

Token requirements:

- store token hash only,
- never store plaintext token,
- token must be high entropy,
- token must be one-time use,
- token must expire,
- token must not be logged,
- token must not be returned again after creation.

## Relationship To `customer_line_identities`

`line_binding_invitations` should not replace `customer_line_identities`.

Responsibilities:

- `line_binding_invitations` records the verification / invitation lifecycle.
- `customer_line_identities` remains the durable channel identity link.
- successful invitation use creates or links a `customer_line_identity`.
- `used_customer_line_identity_id` can explain which identity resulted from invitation use.

Rules:

- invitation organization must match customer organization.
- invitation organization must match line channel organization.
- when `case_id` is present, Case organization must match invitation organization.
- successful identity must match the invitation `organization_id` and `line_channel_id`.
- raw `line_user_id` should not be stored in invitation rows.

## Case-specific vs Customer-specific Design

### Case-specific invitation

Pros:

- clear operational context,
- easy Admin explanation from Case detail,
- good for post-completion survey / inquiry context,
- audit can show why binding was requested.

Cons:

- same Customer with multiple Cases may need repeated invitations unless policy treats success as customer-level binding,
- completed / closed Case policy must be defined.

### Customer-specific invitation

Pros:

- one binding can support multiple Cases,
- cleaner customer identity model,
- less repeated customer friction.

Cons:

- weaker link to the exact Case that prompted invitation,
- Admin may need extra context to explain why invitation was created.

### Recommendation

Use a hybrid:

- invitation has required `customer_id`,
- invitation may include nullable `case_id`,
- successful binding creates customer-level `customer_line_identity`,
- `case_id` remains context / audit / policy input,
- add a separate `case_line_bindings` table later only if product needs explicit per-Case consent, revocation, or eligibility history.

## Verification / Anti-abuse Fields

Recommended fields:

- `attempt_count`
- `last_attempt_at`
- `last_failure_reason`
- `status`
- `expires_at`
- `used_at`
- `revoked_at`

Recommended runtime policy, not implemented here:

- increment attempt count on failed verification,
- block or revoke after too many failures,
- use generic failure responses,
- avoid storing customer-provided raw proof beyond what is necessary,
- store safe reason codes rather than raw values,
- avoid IP / device metadata unless privacy policy approves it.

Suggested safe `last_failure_reason` codes:

- `token_invalid`
- `token_expired`
- `token_used`
- `token_revoked`
- `attempt_limit`
- `contact_check_failed`
- `channel_scope_mismatch`
- `case_customer_mismatch`
- `identity_conflict`

Do not store raw mobile, raw LINE user id, plaintext token, full request payload, provider payload, or credentials in invitation rows.

## Constraint / Index Proposal

Future migration should consider:

### Constraints

- `status` check constraint.
- `token_hash` not blank.
- `expires_at > created_at`.
- `used_at IS NULL OR used_at >= created_at`.
- `revoked_at IS NULL OR revoked_at >= created_at`.
- `attempt_count >= 0`.
- `case_id` nullable but, if present, must reference `cases(id)`.
- `customer_id` references `customers(id)`.
- `line_channel_id` references `line_channels(id)`.
- no destructive `ON DELETE CASCADE` for audit-sensitive invitation records.

### Indexes

- unique index on `token_hash`.
- index on `organization_id, line_channel_id, status, expires_at`.
- index on `case_id`.
- index on `customer_id`.
- index on `status`.
- index on `expires_at`.
- optional partial index for pending invitations:

```text
organization_id, line_channel_id, expires_at
WHERE status = 'pending'
```

### Same-organization consistency

Same-organization consistency may need runtime guards or composite foreign keys.

Required invariant:

- invitation organization,
- Case organization,
- Customer organization,
- LINE channel organization,
- resulting customer LINE identity organization,

must all match.

Recommendation:

- enforce same-organization checks in service layer at runtime,
- consider composite FK strategy only in a dedicated migration design task if existing schema supports it cleanly.

## Audit / Event Options

Preferred conservative approach:

- use existing safe audit/activity mechanism first,
- do not create a new binding-event table unless existing audit cannot represent events safely.

Events to audit safely:

- invitation created,
- invitation used,
- invitation revoked,
- invitation expired,
- verification failed,
- identity conflict,
- attempt limit reached.

Audit must not store:

- raw line user id,
- plaintext token,
- raw mobile / phone,
- full payload,
- provider credentials,
- channel secret,
- access token.

If future audit/event table is needed, a separate design task should define it.

## Survey Compatibility

Reverse LINE binding data model should support future survey delivery without coupling binding to survey trigger.

Rules:

- binding invitation table should not directly reference `survey_intents` in the first model,
- delivery resolver should look up customer / contact channel identity at send time,
- `used_at` and `used_customer_line_identity_id` can help explain why a pending-channel survey later became deliverable,
- survey idempotency key must not change,
- finalAppointmentId must not change,
- completion timestamps must not change,
- no survey sending inside binding transaction by default,
- no raw LINE id in survey intent / event outbox payload.

Future resolver may use binding state as eligibility input only after survey policy allows it.

## Admin UX Data Implications

Future Admin UI may need:

- current binding status,
- pending invitation count / latest invitation status,
- expired / revoked / used status,
- conflict state,
- masked LINE identity only,
- created_by / created_at,
- revoke / regenerate controls with permission,
- safe audit summary.

Admin UI must not show:

- plaintext token after creation,
- raw line user id,
- raw mobile in unsafe handoff,
- provider payload,
- survey send button in binding UI.

Future UI should prefer:

- "not linked",
- "invitation pending",
- "linked",
- "expired",
- "revoked",
- "conflict / manual review required".

## Retention / Privacy Questions

Open questions:

1. How long should expired invitations be retained?
2. How long should used invitations be retained?
3. Should token hash be deleted after expiry or retained for replay prevention?
4. Should failed attempts be retained?
5. How should failure reason / audit details be redacted?
6. Is IP / device metadata allowed at all?
7. Can a customer request unlink / delete?
8. How should shared phone or shared LINE account cases be handled?
9. How should duplicate customer records be handled?
10. How should smoke / internal / test invitations be suppressed or retained?
11. Should completed Cases allow new binding invitations?
12. Should revoked invitations remain visible to Admin forever or within a retention window?

## Remaining Blockers

Before creating a migration:

- product must decide token lifetime,
- product must decide invitation target semantics,
- product must decide contact verification factor,
- product must decide attempt limits,
- product must decide retention policy,
- security review must approve token hashing / redaction policy,
- ops must approve whether late binding can affect pending survey deliverability,
- migration approval must be explicit,
- shared apply policy must remain separate.

## Final Recommendation

Future model should start with:

- `line_binding_invitations`,
- required `organization_id`,
- required `line_channel_id`,
- required `customer_id`,
- nullable `case_id`,
- hashed token only,
- explicit lifecycle status,
- expiration / use / revoke timestamps,
- attempt tracking,
- optional `used_customer_line_identity_id`,
- existing audit system for events.

Do not create `case_line_bindings` initially unless product explicitly needs per-Case consent / revocation / eligibility history.

## Non-goals

Task159 does not:

- create migration 021 or any migration file,
- modify Migration 020,
- change existing LINE identity runtime,
- implement token generation,
- implement verification API,
- implement Admin UI,
- implement LIFF,
- send LINE messages,
- implement survey runtime,
- change survey trigger,
- change finalAppointmentId behavior,
- introduce AI automatic decisions.

## Verification Summary

Task159 verification:

- `npm run check`: required and expected.
- `npm run admin:check`: required and expected.
- `git diff --check`: required and expected.
- sensitive scan: required and expected.

No smoke test is required because this is documentation-only data model design.

## Next Task Recommendation

Recommended Task160:

`Task 160 - Reverse LINE Binding API Contract Design / No Runtime Change`

Suggested scope:

- docs-only,
- based on Task158 / Task159,
- design future API endpoints for invitation creation, token verification, callback completion, revoke, regenerate, and status reads,
- no implementation,
- no migration,
- no LINE push,
- no Admin UI.
