# Task 158 - Existing Case Reverse LINE Binding Product Design / No Runtime Change

## Background

Task158 returns to the product mainline after the Task153 through Task157 first-transition hardening closure.

The goal is to design how an existing Case / Customer can bind a LINE identity after the Case has already been created, without implementing API, migration, Admin UI, LIFF, LINE push, survey runtime, or notification sending.

This is required because many real service Cases originate from phone, Admin entry, vendor feeds, or other non-LINE intake channels. Those Cases must still be able to move into LINE-assisted customer communication later.

## No-runtime-change Statement

Task158 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- add tests,
- add migration,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- implement LINE binding API,
- implement LIFF flow,
- implement Admin UI,
- send LINE / APP / SMS / email,
- implement survey runtime,
- implement survey sending,
- add AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Reviewed current model and prior design notes:

- `migrations/012_create_line_integration_tables.sql`
- `src/repositories/CustomerLineIdentityRepository.js`
- `src/services/CustomerLineIdentityService.js`
- `src/services/LineService.js`
- `src/services/CustomerInquiryService.js`
- `src/mappers/lineMapper.js`
- `src/routes/line.routes.js`
- `src/validators/lineValidators.js`
- `admin/src/components/CustomerLineIdentitiesPanel.tsx`
- `docs/future-existing-case-to-line-binding-memo.md`
- `docs/task-118-reverse-line-binding-survey-delivery-compatibility-design.md`

## Current LINE / Customer Identity Model Review

Current schema already has:

- `line_channels`
  - `organization_id`
  - channel code / name / provider identifiers
  - channel secret / access token storage
  - enabled flag
- `customer_line_identities`
  - `customer_id`
  - `organization_id`
  - `line_channel_id`
  - `line_user_id`
  - `display_name`
  - `linked_at`
  - `unlinked_at`
- `line_events`
  - organization/channel scope
  - raw event summary storage
  - linked customer / case references when available

Current uniqueness:

- active identity uniqueness is scoped by `line_channel_id + line_user_id`.
- repository lookup also includes `organization_id + line_channel_id + line_user_id`.

Current service behavior:

- `CustomerLineIdentityService` validates customer organization scope and LINE channel organization scope.
- existing linked identity owned by another customer is rejected.
- LINE identity DTOs return masked line user id, not raw value.
- audit records use masked line user id.
- `LineService` can create pending identities on follow / message before a customer is known.
- `CustomerInquiryService` supports both caseNo + mobile inquiry and channelCode + caseNo + lineUserId inquiry, using generic failure responses.

Current Admin behavior:

- Customer detail can list / create / unlink customer LINE identities.
- Admin panel shows masked LINE user id.
- Current manual link flow can accept a raw `lineUserId` value as Admin input. This is not the recommended future customer-facing reverse-binding flow.

## Product Flow Design

Recommended future reverse LINE binding flow:

1. Existing Case / Customer exists from phone, Admin entry, vendor, APP, or another non-LINE source.
2. Authorized Admin / customer service generates a binding invitation for the Case or Customer.
3. System creates a short-lived, one-time verification intent.
4. Customer opens the invitation through LINE / LIFF / web link / QR code / SMS link / customer-service guidance.
5. Customer proves possession of the intended Case / contact context.
6. System receives the LINE channel context and line user identity through trusted LINE / LIFF callback or webhook context.
7. System validates organization, LINE channel, Case, Customer, token, and verification answers.
8. System creates or links a `customer_line_identity` under the correct organization and LINE channel.
9. System records safe audit entries.
10. Existing Case can then use the bound customer/channel identity for future inquiry or notification policy, subject to later product rules.

The flow must not require the Case to have originated from LINE.

The flow must not make LINE binding required for Case completion, Field Service Report completion, billing, or survey trigger.

## Verification Design

`caseNo` alone is not enough.

Recommended verification factors:

- one-time invitation token,
- token bound to organization and intended Case / Customer,
- token expiration,
- optional partial contact verification such as masked phone digits or other contact proof,
- trusted LINE / LIFF channel context,
- rate limit / attempt limit,
- fail-closed response on ambiguity.

Recommended high-level options:

### Option A - Token First

Invitation link contains an opaque token. Customer opens it in LINE / LIFF context.

Verification:

- token exists,
- token hash matches,
- token is not expired,
- token is not used or revoked,
- token belongs to the same organization / channel / Case / Customer context,
- LINE identity is obtained from trusted LINE / LIFF context.

This is the preferred future option because it avoids using `caseNo` as the only lookup key.

### Option B - Token Plus Contact Check

Customer opens token link and also enters partial contact proof.

This is stronger for high-risk Cases, but product must decide UX friction.

### Option C - CaseNo Plus Contact Check

Customer enters caseNo and contact proof after entering LINE context.

This may be useful as a fallback but should be rate-limited and should not reveal whether the caseNo or contact proof was wrong.

## Identity Scope Contract

All reverse binding logic must preserve:

```text
organization_id + line_channel_id + line_user_id
```

Rules:

- raw `line_user_id` is not global identity.
- binding must resolve through the intended `line_channel_id`.
- channel must belong to the same organization as the Case / Customer.
- Case must belong to the same organization as the Customer.
- Customer must belong to the same organization as the channel.
- If any relationship is ambiguous or cross-organization, fail closed.
- Admin handoff / report / survey payload must not include raw `line_user_id`.

The future delivery resolver should use internal identity references and channel summaries, not raw provider identifiers.

## Case / Customer Relationship Policy

Task158 recommends customer-level binding with optional Case-level invitation context.

Meaning:

- Invitation may be generated from a specific Case.
- Successful binding links the Customer to a LINE identity.
- The Case that generated the invitation can be recorded as context / audit.
- Future inquiry can still require `caseNo` or authorized customer scope.
- If a Customer has multiple Cases, one successful customer-level LINE binding can support future customer communications according to policy.

Open product decision:

- whether to also create explicit future `case_line_bindings` rows for per-Case binding history.

Recommended default:

- start with customer-level identity binding,
- keep the invitation Case context for audit and future survey / notification decisions,
- add explicit Case-level binding table only if product needs per-Case revocation, consent, or channel eligibility history.

## Security / Abuse Risks

Risks:

1. Token leakage.
2. Token reuse.
3. Guessable caseNo / contact verification.
4. Cross-organization binding.
5. Cross-channel binding.
6. One LINE account attempting to bind to multiple unrelated customers.
7. Multiple LINE accounts attempting to bind to one customer.
8. Staff copying invitation to the wrong customer.
9. Replay from expired invitation.
10. Raw line user id leaking into logs, handoff, audit payload, or survey payload.
11. Binding state being used to send outbound notifications before consent / policy is ready.
12. Customer-visible inquiry exposing internal notes, billing internals, audit logs, AI raw payload, or engineer internal notes.

Mitigations:

- short-lived token,
- token hash storage only,
- one-time use,
- expiration and revocation,
- attempt limit,
- generic failure messages,
- same organization / channel / customer / case scope checks,
- trusted LINE / LIFF context for raw provider identity,
- safe audit with masked identity only,
- no raw IDs in UI / logs / handoff,
- manual review for conflicts,
- fail closed on ambiguity,
- no outbound sensitive payload.

## Survey Compatibility

Reverse LINE binding must remain separate from survey trigger.

Rules:

- Survey trigger remains Case-level first completion.
- Reverse LINE binding does not create first-transition events.
- Reverse LINE binding does not create survey intents.
- Reverse LINE binding does not change survey idempotency key.
- Reverse LINE binding does not change completedAt.
- Reverse LINE binding does not re-infer finalAppointmentId.
- Reverse LINE binding must not send survey immediately unless future resolver / sending policy explicitly allows it.
- No raw LINE id belongs in survey intent / outbox payload.
- Delivery resolver should check binding at send time.

Future policy may allow a previously created `pending_channel` survey intent to become deliverable after binding, but only if:

- the survey intent exists,
- it is not expired,
- it is not suppressed,
- customer/contact eligibility passes,
- opt-out policy passes,
- channel policy allows LINE delivery,
- delivery resolver is enabled.

Task158 does not implement any survey runtime behavior.

## Admin UX Future Design

Future Admin Case detail may show safe binding status:

- not linked,
- invitation pending,
- linked,
- revoked,
- expired,
- conflict / manual review required.

Future Admin may allow authorized users to:

- generate invitation,
- view invitation status,
- revoke invitation,
- regenerate invitation,
- see masked linked identity status,
- see safe audit history.

Admin must not:

- see raw LINE user id,
- manually set raw LINE user id through reverse binding flow,
- bypass verification,
- force-bind ambiguous identities,
- trigger survey sending through binding UI,
- expose token values after creation,
- expose customer mobile in unsafe handoff.

Existing Customer LINE identity management can remain a separate Admin operational tool, but reverse binding should be designed as a verified invitation flow rather than default manual raw-ID entry.

## Future Data Model Questions

Potential future tables / fields:

### `line_binding_invitations`

Possible fields:

- `id`
- `organization_id`
- `line_channel_id`
- `case_id`
- `customer_id`
- `token_hash`
- `status`
- `expires_at`
- `used_at`
- `revoked_at`
- `created_by_user_id`
- `created_at`
- `attempt_count`
- `last_attempt_at`
- `last_failure_reason`

### Optional `case_line_bindings`

Possible fields:

- `id`
- `organization_id`
- `case_id`
- `customer_id`
- `customer_line_identity_id`
- `source`
- `linked_at`
- `revoked_at`
- `created_at`

Open questions:

1. Should invitation be Case-specific, Customer-specific, or both?
2. Should one invitation bind only one Case or a customer-level identity?
3. Should completed Cases allow binding?
4. Should pending survey intents become deliverable after late binding?
5. How should multiple LINE accounts for one customer be handled?
6. How should one LINE account for multiple customers be handled?
7. Should token creation require active Case status?
8. Should invitation expiration vary by organization / brand / channel?
9. Should invitation attempts lock after repeated failure?
10. Should revocation unlink customer identity or only revoke invitation?

No migration is created in Task158.

## Future API / Runtime Task List

Future tasks, not implemented here:

1. Reverse LINE binding data model proposal / no apply.
2. Binding invitation token generation contract.
3. Binding verification API contract.
4. LINE / LIFF callback flow contract.
5. Admin read-only binding status UI design.
6. Admin invitation creation UI design.
7. Binding audit log design.
8. Reverse binding smoke / no-sensitive-output plan.
9. Survey pending-channel after binding policy review.
10. Channel abstraction resolver design for LINE / APP / SMS / email.

## Remaining Blockers

Before implementation:

- product must choose Case-level vs Customer-level binding semantics,
- token lifetime and verification factors must be decided,
- consent / opt-out / communication policy must be defined,
- channel fallback policy must be defined,
- migration approval must be explicit if new tables are added,
- sensitive logging / audit policy must be reviewed,
- LINE / LIFF provider integration must be scoped,
- survey delivery after late binding must remain separately approved.

## Final Recommendation

Adopt reverse LINE binding as a verified invitation flow.

Recommended default:

- generate invitation from a Case,
- bind Customer identity after token + trusted LINE context verification,
- keep Case context for audit,
- store token hash only,
- enforce organization/channel/customer/case scope,
- never treat raw line user id as a global identity,
- keep survey trigger and delivery resolver separate.

## Non-goals

Task158 does not:

- implement binding invitation tables,
- implement binding API,
- implement LIFF,
- implement LINE push,
- implement Admin UI,
- implement survey delivery,
- apply or dry-run Migration 020,
- change customer inquiry runtime,
- change existing Customer LINE identity Admin panel,
- expose raw provider identifiers,
- introduce AI decision-making.

## Verification Summary

Task158 verification:

- `npm run check`: required and expected.
- `npm run admin:check`: required and expected.
- `git diff --check`: required and expected.
- sensitive scan: required and expected.

No smoke test is required because this is documentation-only product design.

## Next Task Recommendation

Recommended Task159:

`Task 159 - Reverse LINE Binding Data Model Proposal / No Migration`

Suggested scope:

- docs-only,
- based on Task158 product design,
- propose future data model for binding invitations / token hash / status / audit,
- no migration file,
- no apply,
- no runtime implementation.
