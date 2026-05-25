# Task 160 - Reverse LINE Binding API Contract / No Runtime Change

## Background

Task160 defines the future API contract for existing Case reverse LINE binding.
It builds on:

- Task158 existing Case reverse LINE binding product design,
- Task159 reverse LINE binding data model proposal,
- the current LINE channel and customer identity conventions,
- the future survey delivery requirement that customer channel binding may happen before or after Case completion.

The purpose is to define route boundaries, request / response shapes, auth rules, redaction, audit semantics, and future test coverage before any runtime API is implemented.

## No-runtime-change Statement

Task160 does not:

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
- implement invitation creation,
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

Reviewed API and identity conventions:

- `src/routes/index.js`
- `src/routes/public.routes.js`
- `src/routes/line.routes.js`
- `src/controllers/CustomerInquiryController.js`
- `src/controllers/LineController.js`
- `src/services/CustomerLineIdentityService.js`
- `src/validators/customerInquiryValidators.js`
- `src/validators/lineValidators.js`
- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`
- `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md`

Current conventions:

- Admin APIs live under `/api/v1/admin/...`.
- Public customer inquiry APIs live under `/api/v1/public/...`.
- LINE webhook APIs live under `/api/v1/line/webhook/:channelCode`.
- Admin LINE channel and customer identity APIs use permission middleware such as `line.read` and `line.manage`.
- Current `customer_line_identities` DTOs mask LINE user ids.
- Current manual Admin identity linking accepts `lineUserId`; future reverse binding should not copy that as the customer-facing contract.

## Current API Convention Review

Current relevant routes include:

```text
POST /api/v1/public/case-inquiry
POST /api/v1/public/line-case-inquiry
POST /api/v1/line/webhook/:channelCode
GET  /api/v1/admin/customers/:customerId/line-identities
POST /api/v1/admin/customers/:customerId/line-identities
DELETE /api/v1/admin/customers/:customerId/line-identities/:identityId
```

Important distinction:

- Existing public inquiry routes are read-style customer lookup flows.
- Existing Admin `line-identities` routes are manual operational tools.
- Future reverse binding should be an invitation / verification flow, not a direct public raw-LINE-id linking endpoint.

## API Surface Proposal

Recommended future split:

- Admin invitation lifecycle endpoints under `/api/v1/admin/...`.
- Public/customer verification endpoints under `/api/v1/public/...`.
- Trusted LINE / LIFF identity capture handled through a channel-specific trusted context, not by accepting raw `lineUserId` from an untrusted browser form.

### Admin Invitation Creation

Recommended endpoint:

```text
POST /api/v1/admin/cases/:caseId/line-binding-invitations
```

Purpose:

- create a short-lived one-time invitation for an existing Case and Customer,
- select the LINE channel to bind against,
- return a one-time invitation URL / token only at creation time if product policy allows,
- write safe audit metadata.

Auth:

- require authenticated Admin user,
- require organization-scoped access to the Case,
- require LINE management or equivalent customer communication permission,
- require `line_channel_id` belongs to the same organization as the Case / Customer.

Request body concept:

```json
{
  "lineChannelId": "<uuid>",
  "expiresAt": "<iso timestamp, optional>",
  "expiresInMinutes": 1440,
  "verificationMode": "case_contact",
  "note": "optional safe operator note"
}
```

Request body must not accept:

- `lineUserId`,
- raw LINE profile payload,
- plaintext token chosen by Admin,
- customer mobile as a stored invitation field,
- provider credentials,
- survey trigger fields.

Response concept:

```json
{
  "id": "<invitation id>",
  "caseId": "<case id>",
  "customerId": "<customer id>",
  "lineChannelId": "<line channel id>",
  "status": "pending",
  "expiresAt": "<iso timestamp>",
  "createdAt": "<iso timestamp>",
  "invitationUrl": "<one-time returned URL, creation response only>",
  "tokenReturnedOnce": true
}
```

Creation response may include the one-time invitation URL / token only if the runtime stores only a token hash and never persists plaintext token.
Status reads must not return the token again.

### Admin Status

Recommended endpoints:

```text
GET /api/v1/admin/cases/:caseId/line-binding-invitations
GET /api/v1/admin/line-binding-invitations/:invitationId
```

Purpose:

- inspect pending / used / expired / revoked / blocked invitations,
- support operator handoff without exposing secrets,
- show whether the Case / Customer already has an active LINE identity for the target channel.

Response should include:

- invitation id,
- status,
- case id,
- customer id,
- line channel id / safe channel label,
- createdAt,
- expiresAt,
- usedAt if used,
- revokedAt if revoked,
- attempt count summary,
- last failure reason code if safe,
- linked identity id if used,
- masked linked identity summary.

Response must not include:

- plaintext token,
- token hash,
- raw LINE user id,
- customer mobile / phone / tel,
- full customer payload,
- full Case payload,
- raw provider payload.

### Admin Revoke

Recommended endpoint:

```text
POST /api/v1/admin/line-binding-invitations/:invitationId/revoke
```

Purpose:

- invalidate a pending invitation,
- preserve audit trail,
- avoid destructive deletion.

Request body concept:

```json
{
  "reason": "customer_requested_new_link"
}
```

Expected behavior:

- pending invitation becomes `revoked`,
- already used invitation cannot be reused or deleted,
- revoked invitation cannot be completed,
- response returns safe status only.

### Admin Regenerate

Recommended endpoint:

```text
POST /api/v1/admin/line-binding-invitations/:invitationId/regenerate
```

Recommended behavior:

- revoke the old pending invitation,
- create a new invitation row with a new token hash,
- return the new invitation URL / token only once,
- preserve audit trail linking old and new invitation ids.

Regenerate should not reveal the old token and should not mutate a `used` invitation into pending again.

### Customer Token Verification

Recommended endpoint:

```text
POST /api/v1/public/line-binding-invitations/verify
```

Purpose:

- verify whether an invitation token can proceed,
- return only safe, minimal context for customer confirmation,
- avoid confirming whether a Case / mobile / token exists when verification fails.

Request body concept:

```json
{
  "token": "<one-time invitation token>",
  "caseNo": "<optional customer-entered case number>",
  "contactProof": "<optional customer-entered proof, policy-defined>"
}
```

Response success concept:

```json
{
  "status": "ready_for_binding",
  "invitationId": "<id or opaque reference>",
  "caseSummary": {
    "caseNoMasked": "<safe case number summary>",
    "serviceType": "<safe summary if allowed>"
  },
  "customerSummary": {
    "displayNameMasked": "<safe summary if allowed>"
  },
  "lineChannelSummary": {
    "channelName": "<safe channel label>"
  },
  "expiresAt": "<iso timestamp>"
}
```

Failure response should be generic:

```json
{
  "status": "unable_to_verify"
}
```

Public failure should not reveal whether the token, Case, Customer, or contact proof was the failing part.

### Customer Binding Completion

Recommended endpoint:

```text
POST /api/v1/public/line-binding-invitations/complete
```

Purpose:

- complete binding after token verification and trusted channel identity capture,
- create or link a `customer_line_identity`,
- mark the invitation as used,
- return a safe linked status.

Request body concept:

```json
{
  "token": "<one-time invitation token>",
  "verificationNonce": "<short-lived verification reference>",
  "lineContextProof": "<trusted LINE / LIFF context proof>"
}
```

The endpoint must not accept raw `lineUserId` as an ordinary untrusted browser field.
The LINE identity must be derived from a trusted LINE / LIFF / webhook-backed context for the specific `line_channel_id`.

Response success concept:

```json
{
  "status": "linked",
  "customerLineIdentityId": "<id>",
  "lineUserIdMasked": "<masked>",
  "caseId": "<case id>",
  "customerId": "<customer id>"
}
```

Completion must be transactional:

- validate invitation is pending and unexpired,
- validate attempt policy,
- validate organization / Case / Customer / channel consistency,
- resolve trusted LINE identity for the same channel,
- reject active identity conflict with a different Customer,
- create or link `customer_line_identity`,
- mark invitation used,
- write audit.

Completion must not:

- create survey intents,
- enqueue survey events,
- send LINE messages,
- update Case completion state,
- update Field Service Report state,
- alter `finalAppointmentId`,
- alter `completedAt`.

## Public vs Admin Auth Boundary

Admin endpoints:

- require Admin authentication,
- require organization access,
- require suitable LINE/customer communication permission,
- may return operational reason codes if safe.

Public/customer endpoints:

- must not require Admin authentication,
- must use token / proof / trusted LINE context,
- must be rate-limited,
- must return generic failure messages,
- must not expose internal IDs unless product confirms they are safe for this flow.

Trusted LINE context boundary:

- raw `lineUserId` may exist inside trusted server-side LINE / LIFF verification internals,
- raw `lineUserId` must not be accepted from plain public form input,
- raw `lineUserId` must not be returned in API responses or handoff notes.

## Error Behavior / Fail-closed Rules

Future implementation should fail closed for:

- invalid token,
- expired token,
- revoked token,
- used token,
- blocked token,
- attempt limit exceeded,
- Case not found,
- Customer not found,
- Case / Customer organization mismatch,
- LINE channel organization mismatch,
- trusted LINE context channel mismatch,
- active LINE identity already linked to another Customer,
- ambiguous customer identity,
- missing required proof,
- token hash mismatch,
- concurrent completion race.

Admin errors may use safe specific codes such as:

- `invitation_expired`
- `invitation_revoked`
- `invitation_used`
- `organization_mismatch`
- `identity_conflict`
- `attempt_limit_exceeded`

Public errors should usually collapse to:

- `unable_to_verify`
- `unable_to_complete_binding`

Error responses must not include raw request body, raw provider payload, customer mobile, raw LINE user id, token, token hash, credentials, or full Case / Customer payload.

## Rate Limit / Abuse Guards

Future implementation should include layered controls:

- per-token attempt limit,
- per-invitation attempt count and blocked status,
- per-IP / device / session rate limit,
- per-Case / Customer invitation creation limit,
- per-line-channel abnormal attempt monitoring,
- generic public failure response,
- safe audit reason codes,
- optional cooldown before regeneration.

Attempt counters should record safe reason codes only.
They must not store raw proof values or full request payloads.

## Response Redaction Policy

Never return:

- plaintext token after creation response,
- token hash,
- raw LINE user id,
- LINE channel secret / access token,
- customer mobile / phone / tel,
- raw provider profile,
- raw webhook / LIFF payload,
- full Case payload,
- full Customer payload,
- full Field Service Report payload,
- credentials, secrets, or environment values.

Allowed response summaries:

- invitation id,
- status,
- masked or summarized customer display label,
- masked case number if product approves,
- line channel label / id for Admin,
- masked LINE user id only after successful binding,
- timestamps,
- safe reason code.

## Audit Contract

Recommended audit actions:

- `line_binding_invitation.created`
- `line_binding_invitation.viewed` optional
- `line_binding_invitation.verification_attempted`
- `line_binding_invitation.verification_failed`
- `line_binding_invitation.used`
- `line_binding_invitation.revoked`
- `line_binding_invitation.regenerated`
- `line_binding_invitation.conflict_detected`
- `line_binding_invitation.blocked_due_to_attempt_limit`

Audit payload should include:

- organization id,
- invitation id,
- case id if safe,
- customer id if safe,
- line channel id,
- actor type (`admin`, `customer`, `system`),
- actor id for Admin if available,
- safe reason code,
- timestamp,
- request id if available.

Audit payload must not include:

- plaintext token,
- token hash unless explicitly internal-only and justified,
- raw LINE user id,
- customer mobile,
- raw provider payload,
- full request body,
- credentials,
- full Case / Customer / Report payload.

## Survey Compatibility

Reverse LINE binding should remain compatible with post-completion survey design:

1. Binding completion does not create a survey intent.
2. Binding completion does not enqueue `case.service_completion.first_transitioned`.
3. Binding completion does not send survey messages.
4. Binding completion does not update `completedAt`.
5. Binding completion does not update `finalAppointmentId`.
6. Future survey delivery resolver may observe a newly linked `customer_line_identity` and re-evaluate pending-channel survey intents separately.
7. Survey delivery resolver must use channel abstraction and must not require the Case to have originally been created from LINE.
8. Existing Case reverse binding can happen before or after Case completion.

This keeps the binding API separate from survey trigger source of truth.

## Future Test / Smoke Plan

Future implementation tests should cover:

- Admin creates invitation for same-organization Case / Customer / LINE channel.
- Admin creation rejects cross-organization Case / channel mismatch.
- Admin creation rejects attempts to supply raw `lineUserId`.
- Admin status read does not return plaintext token or token hash.
- Admin revoke marks invitation unusable.
- Admin regenerate revokes old invitation and returns only the new token once.
- Public verify succeeds for valid pending token and safe proof.
- Public verify fails generically for invalid / expired / revoked / used / blocked token.
- Public verify fails generically for wrong case/contact proof.
- Binding complete succeeds with trusted LINE context and pending token.
- Binding complete rejects untrusted raw `lineUserId` form input.
- Binding complete rejects active identity conflict with another Customer.
- Binding complete rejects channel mismatch.
- Binding complete marks invitation used once.
- Reused token fails.
- Attempt count / blocked status behaves as expected.
- Responses exclude raw LINE user id, customer mobile, token hash, raw payloads, and credentials.
- Binding completion does not create survey intent or outbox event.
- Binding completion does not modify Case / Report completion fields.

These are future tests only. Task160 does not add tests or smoke scripts.

## Remaining Blockers Before Runtime Implementation

Runtime implementation should wait for:

- migration design approval for `line_binding_invitations`,
- explicit migration authoring task,
- no-apply / dry-run policy for any future migration,
- token TTL and proof policy decision,
- trusted LINE / LIFF context architecture,
- rate limit implementation choice,
- audit event finalization,
- Admin UX design,
- customer-facing copy / privacy policy,
- survey pending-channel reevaluation policy,
- shared-runtime outbound policy.

## Final Recommendation

Use an invitation-based API split:

- Admin creates and manages short-lived invitations.
- Customer verifies token with safe proof.
- Binding completion derives LINE identity from trusted channel context.
- Raw `lineUserId` is never accepted from an untrusted public form.
- Tokens are stored as hashes and returned only once at creation.
- Binding APIs do not trigger survey sending or alter Case / Report completion state.

This keeps existing Case reverse LINE binding compatible with channel abstraction, survey delivery, and the one Case / one formal Field Service Report model.

## Non-goals

Task160 does not design or implement:

- database schema changes,
- migration files,
- runtime APIs,
- token generation code,
- LIFF integration,
- webhook binding runtime,
- LINE push,
- APP push,
- SMS / email,
- survey sending,
- survey intent / event outbox writes,
- Admin UI,
- smoke tests,
- AI automatic decisions,
- inventory docs changes,
- destructive cleanup.

## Verification

Recommended verification for Task160:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
