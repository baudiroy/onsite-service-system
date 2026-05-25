# Task 162 - Reverse LINE Binding Security / Abuse Case Review / No Runtime Change

## Background

Task162 reviews reverse LINE binding security and abuse cases.
It does not implement APIs, migrations, Admin UI, LINE push, or runtime behavior.

This review follows:

- Task158 product design,
- Task159 data model proposal,
- Task160 API contract,
- Task161 Admin UX / operator runbook.

The goal is to keep future existing Case reverse LINE binding fail-closed, scoped by organization and LINE channel, safe for customer privacy, and separate from survey delivery.

## No-runtime-change Statement

Task162 does not:

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

Reviewed current safety patterns and prior design notes:

- `src/services/CustomerInquiryService.js`
- `src/services/AuditService.js`
- `src/utils/errors.js`
- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`
- `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md`
- `docs/task-160-reverse-line-binding-api-contract-no-runtime-change.md`
- `docs/task-161-reverse-line-binding-admin-ux-operator-runbook-no-runtime-change.md`

Current useful patterns:

- public customer inquiry uses a generic verification failure response,
- inquiry audit metadata masks mobile / LINE user id,
- `RateLimitedError` already exists as an error class for future abuse control,
- audit service supports action, entity, before / after data, metadata, request id, IP, and user agent,
- existing LINE identity DTOs and Admin API client avoid returning raw LINE user id.

Task162 does not change these patterns.

## Threat Model Overview

Actors to consider:

- legitimate customer opening an invitation,
- customer service / Admin operator,
- malicious external user guessing tokens,
- customer with wrong Case information,
- user attempting to bind someone else's Case,
- user attempting to bind the wrong LINE account,
- operator accidentally generating an invitation for the wrong Case / channel,
- attacker with leaked invitation URL,
- repeated automation / brute force attempt,
- cross-organization or cross-channel misuse,
- future survey delivery resolver consuming binding state later.

Protected assets:

- Case ownership,
- Customer identity,
- LINE channel identity,
- token / token hash,
- customer contact information,
- raw LINE provider identifiers,
- audit integrity,
- future survey deliverability decisions.

Primary trust boundaries:

- Admin authenticated backend API,
- public invitation verification API,
- trusted LINE / LIFF / webhook context,
- audit/logging system,
- future survey delivery resolver.

## Abuse Scenarios

Key abuse scenarios:

1. Token guessing / brute force.
2. Leaked invitation URL.
3. Reusing a token after successful binding.
4. Using expired / revoked / blocked invitation.
5. Cross-organization token use.
6. Cross-channel LINE context use.
7. Submitting raw `lineUserId` from an untrusted form.
8. Binding one LINE account to another Customer's Case.
9. Active identity conflict across customers.
10. Shared phone / shared LINE account ambiguity.
11. Social engineering operator to regenerate a link.
12. Operator pasting token or raw LINE id into handoff notes.
13. Public error message revealing whether a Case exists.
14. Status endpoint revealing token after creation.
15. Audit payload storing raw proof / provider data.
16. Binding completion accidentally sending survey.
17. Binding completion mutating Case / Report completion state.
18. Late binding accidentally making pending survey deliverable without policy.

## Risk Classification Matrix

| Scenario | Risk | Expected Control | Runtime Priority |
| --- | --- | --- | --- |
| Token brute force | High | high-entropy token, hash-only storage, attempt limit, rate limit | Required before API |
| Leaked invitation URL | High | short TTL, one-time use, revoke, regenerate new token | Required before API |
| Token reuse | High | used status fail-closed | Required before API |
| Expired / revoked token | High | fail-closed generic public error | Required before API |
| Cross-org misuse | High | organization guard on Case / Customer / Channel / Invitation | Required before API |
| Cross-channel misuse | High | trusted LINE context must match invitation channel | Required before API |
| Raw `lineUserId` public submission | High | reject untrusted raw identity input | Required before API |
| Identity conflict | High | conflict status, no auto-link, supervisor escalation | Required before API |
| Shared phone / shared LINE | Medium | require extra proof / manual review | Required before rollout |
| Operator regeneration abuse | Medium | permission gate, audit, cooldown, reason code | Required before rollout |
| Public enumeration | High | generic failure response | Required before API |
| Token visible after creation | High | one-time display only, no status retrieval | Required before Admin UX |
| Unsafe audit payload | High | allow-list metadata, masked identifiers | Required before API |
| Survey coupling | Medium | binding does not trigger survey/send | Required before survey integration |

## Mitigation Design

Recommended controls:

- Store only token hash.
- Generate high-entropy one-time tokens.
- Return plaintext token / invitation URL once at creation only.
- Use short TTL with explicit expiration.
- Treat used / expired / revoked / blocked as terminal for public completion.
- Track attempt count and block after product-defined threshold.
- Rate-limit by invitation / token, IP or device summary, Case / Customer, and line channel.
- Use trusted LINE / LIFF context for raw provider identity.
- Reject untrusted public `lineUserId`.
- Validate same organization across Case, Customer, channel, invitation, and identity.
- Validate same line channel across invitation and trusted LINE context.
- Reject active identity conflict with another Customer.
- Use generic public error responses.
- Use safe reason codes for Admin / audit.
- Keep manual raw-ID operations separate from invitation UX.
- Never let binding API mutate Case completion, Field Service Report completion, `completedAt`, or `finalAppointmentId`.
- Never let binding API create survey intents or send survey messages.

## Fail-closed Rules

Future implementation should fail closed when:

- token is missing,
- token is malformed,
- token hash does not match,
- invitation is expired,
- invitation is revoked,
- invitation is used,
- invitation is blocked,
- attempt limit is exceeded,
- rate limit is exceeded,
- Case is missing or not scoped to invitation organization,
- Customer is missing or not scoped to invitation organization,
- LINE channel is missing, disabled, or not scoped to invitation organization,
- trusted LINE context is missing,
- trusted LINE context channel does not match invitation channel,
- public request provides raw `lineUserId` instead of trusted context,
- active identity is already linked to a different Customer,
- proof is ambiguous,
- audit write fails in a strict transaction design,
- any required validation cannot be completed.

Public fail-closed responses should not reveal which condition failed.

## Logging / Audit Safety

Recommended safe audit fields:

- action,
- organization id,
- invitation id,
- Case id if safe,
- Customer id if safe,
- line channel id,
- actor type,
- Admin actor id if applicable,
- safe reason code,
- attempt count summary,
- request id,
- timestamp.

Allowed masked values:

- masked LINE user id after trusted context exists,
- masked / summarized customer display label if product approves,
- channel code / channel label if safe for Admin.

Do not log:

- plaintext token,
- token hash unless explicitly internal-only and justified,
- customer mobile / phone / tel,
- raw LINE user id,
- raw LINE profile,
- raw webhook / LIFF payload,
- contact proof raw value,
- full request body,
- full Case / Customer / Report payload,
- credentials,
- environment values.

Audit events should be sufficient to investigate abuse without becoming a source of leaked identity material.

## Public Error Response Safety

Public endpoints should prefer generic responses:

```json
{
  "status": "unable_to_verify"
}
```

or:

```json
{
  "status": "unable_to_complete_binding"
}
```

Public response should not distinguish:

- token not found,
- token expired,
- token revoked,
- token used,
- Case not found,
- Customer not found,
- contact proof mismatch,
- channel mismatch,
- identity conflict,
- attempt limit exceeded.

Admin endpoints may show safe reason codes to authorized operators, but should still avoid raw identifiers and proof details.

## Conflict Escalation Runbook

When an identity conflict is detected:

1. Do not manually override with raw `lineUserId`.
2. Do not disclose which other Customer may already be linked.
3. Revoke the current invitation if token exposure is possible.
4. Review safe audit reason codes.
5. Confirm Case / Customer through approved internal process.
6. Escalate to supervisor if conflict involves another Customer or shared household / shared LINE scenario.
7. Regenerate only after the correct Case / Customer / channel is confirmed.
8. Keep handoff notes limited to status, reason code, and next action.

When blocked by attempt limit:

1. Do not immediately regenerate by default.
2. Check safe attempt count and reason code.
3. Confirm whether the customer is actually trying to bind.
4. Escalate suspicious patterns.
5. Follow product policy for cooldown / unblock / new invitation.

## Future Tests / Smoke Plan

Future backend tests:

- valid invitation verifies.
- expired invitation fails closed.
- revoked invitation fails closed.
- used invitation fails closed.
- malformed token fails closed.
- token brute force increments attempt count.
- attempt limit blocks.
- cross-organization token use fails.
- cross-channel token use fails.
- raw `lineUserId` in public request is rejected.
- existing identity conflict fails closed.
- ambiguous customer / Case proof fails closed.
- public errors remain generic.
- Admin errors include safe reason only.
- token is not returned after creation status read.
- raw LINE user id is not present in response or audit payload.
- binding does not create survey intent.
- binding does not send survey.
- binding does not mutate Case, Field Service Report, `completedAt`, or `finalAppointmentId`.

Future browser / Admin tests:

- no raw `lineUserId` input in invitation UI.
- conflict state shows safe reason.
- blocked state prevents casual regenerate until review.
- no survey send button.
- no sensitive data appears in DOM.
- token disappears after creation result is closed / refreshed.

These are future tests only. Task162 does not add tests or smoke scripts.

## Security Open Questions

Product / security decisions still needed:

1. Token entropy / format policy.
2. Token expiration duration.
3. Max attempts per invitation.
4. Rate limit scope:
   - token,
   - IP hash,
   - line identity,
   - Case / Customer.
5. Whether IP / device metadata may be stored.
6. Whether token hash is retained after use / expiry.
7. How long failed attempts are retained.
8. How shared phone / shared LINE account scenarios are handled.
9. How customer identity merges affect existing LINE bindings.
10. Whether completed Cases allow binding by default.
11. Whether pending survey deliverability after late binding is opt-in.
12. Which roles can resolve conflicts.
13. Whether manual unlink requires separate approval.
14. Whether smoke / internal / test invitations are no-op, blocked, or clearly flagged.

## Remaining Blockers

Before implementation:

- migration design approval,
- rate limit design,
- trusted LINE / LIFF identity capture design,
- audit allow-list finalization,
- conflict escalation policy,
- token retention / expiration policy,
- Admin UX approval,
- survey pending-channel policy,
- shared-runtime outbound policy,
- no-send test plan approval.

## Final Recommendation

Future reverse LINE binding should be treated as a security-sensitive identity flow.

Recommended posture:

- invitation-based,
- token hash only,
- one-time token display,
- short TTL,
- trusted LINE context only,
- generic public errors,
- safe Admin reason codes,
- strict same-organization / same-channel guards,
- no raw provider identifiers in public forms, responses, DOM, audit, or handoff,
- no coupling to Case completion, Field Service Report completion, or survey sending.

This keeps reverse LINE binding compatible with channel abstraction and future survey delivery without weakening core Case / Report invariants.

## Non-goals

Task162 does not design or implement:

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

Recommended verification for Task162:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
