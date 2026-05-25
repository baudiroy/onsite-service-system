# Task 161 - Reverse LINE Binding Admin UX / Operator Runbook / No Runtime Change

## Background

Task161 designs the future Admin UX and operator runbook for existing Case reverse LINE binding.

It follows:

- Task158 product design,
- Task159 data model proposal,
- Task160 API contract design.

The future UX should help an authorized operator create and manage safe binding invitations without exposing raw LINE identifiers, raw tokens after creation, customer contact values in handoff, or survey delivery controls.

## No-runtime-change Statement

Task161 does not:

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

Reviewed current Admin LINE / customer UX:

- `admin/src/components/CustomerLineIdentitiesPanel.tsx`
- `admin/src/api/customerLineIdentities.ts`
- `admin/src/pages/CaseManagementPage.tsx`
- `admin/src/pages/CustomerAdminPage.tsx`
- `admin/src/pages/LineChannelAdminPage.tsx`
- `admin/src/pages/CustomerInquiryPreviewPage.tsx`
- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`
- `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md`
- `docs/task-160-reverse-line-binding-api-contract-no-runtime-change.md`

Current observations:

- Case detail and Customer detail both render `CustomerLineIdentitiesPanel`.
- The panel lists masked LINE identities and safe channel labels.
- The current panel includes a manual Admin operational link form that accepts `lineUserId`.
- Customer forms explicitly say they do not edit raw `lineUserId`.
- API client sanitizes identity responses and ignores sensitive keys.
- LINE Channel Admin page does not expose channel secret / access token.
- Customer inquiry preview has a LINE inquiry preview path, but it is not a verified reverse-binding UX.

## Current Admin UX Review

Current `CustomerLineIdentitiesPanel` is acceptable as an operational foundation, but it is not the recommended future reverse-binding UX.

Current strengths:

- permission-gated with `line.read` / `line.manage`,
- displays masked LINE user id,
- filters LINE channels by organization when possible,
- clears manual `lineUserId` input after submit,
- avoids query string / localStorage / sessionStorage storage for `lineUserId`,
- backend remains source of organization-scope validation,
- response sanitizer drops sensitive fields.

Current limitations for reverse binding:

- manual Admin link flow accepts raw `lineUserId`,
- it does not create invitation tokens,
- it does not support invitation status,
- it does not support revoke / regenerate,
- it does not indicate customer self-service progress,
- it does not distinguish manual operational linking from verified customer invitation binding,
- it should not be used as the future default customer-facing reverse-binding workflow.

Future reverse binding should add a separate invitation panel or mode rather than turning the manual raw-ID form into the primary workflow.

## Future Admin Status Display Design

Recommended Case / Customer detail status states:

- `not_linked`: no active customer LINE identity and no pending invitation.
- `pending_invitation`: invitation exists and can still be used.
- `linked`: active customer LINE identity exists.
- `expired_invitation`: latest invitation expired.
- `revoked_invitation`: latest invitation was revoked.
- `used_invitation`: invitation was used and identity is linked.
- `blocked`: invitation is blocked by attempt / abuse policy.
- `conflict`: binding attempt hit active identity conflict or scope mismatch.
- `unknown`: status could not be loaded.

Recommended display:

```text
LINE Binding
- Status: Pending invitation
- Channel: Service LINE / channelCode summary
- Expires: 2026-xx-xx xx:xx
- Attempts: safe count summary
- Last issue: safe reason code
```

For linked state:

```text
LINE Binding
- Status: Linked
- Channel: Service LINE / channelCode summary
- LINE User: masked only
- Linked at: timestamp
```

Status display must not show:

- raw LINE user id,
- customer mobile / phone / tel,
- plaintext token,
- token hash,
- raw provider payload,
- full Customer / Case payload,
- credentials.

## Invitation Creation UX Design

Recommended placement:

- Case detail: "LINE binding invitation" panel near customer snapshot / communication section.
- Customer detail: customer-level binding status and invitations.
- Keep the existing manual `CustomerLineIdentitiesPanel` as an operational tool, but clearly separate it from verified invitation binding.

Recommended create flow:

1. Operator opens Case or Customer detail.
2. Panel shows current linked / pending / expired / revoked / conflict status.
3. Operator clicks "Create LINE binding invitation".
4. Modal confirms:
   - target Case / Customer safe summary,
   - organization summary,
   - selected LINE channel,
   - expiration window,
   - delivery / copy method.
5. Operator creates invitation.
6. UI shows one-time invitation link / QR placeholder only in creation result.
7. After the modal closes or page reloads, token cannot be retrieved again.

Recommended form fields:

- LINE channel selection from safe channel list.
- Expiration window from a controlled option set.
- Optional safe operator note.
- Optional verification policy label.

Fields not allowed:

- raw `lineUserId`,
- plaintext token input,
- token hash,
- customer mobile copy field,
- raw LINE profile data,
- survey send toggle,
- force survey deliverable toggle.

Recommended creation copy:

- "Create a one-time LINE binding invitation for this customer."
- "The invite link is shown only once."
- "This does not send a LINE message by itself."
- "This does not trigger a survey."
- "The customer must complete verification before binding is active."

## Revoke / Regenerate UX Design

### Revoke

Use revoke when:

- invitation was sent to the wrong person,
- customer requests a new link,
- operator suspects token exposure,
- Case / Customer context is no longer valid,
- attempt policy suggests blocking further use.

UX requirements:

- confirmation modal,
- safe reason code selection,
- no deletion,
- status becomes revoked,
- old token cannot be used,
- audit event is written in future runtime.

Recommended copy:

- "Revoke this invitation? The existing link will stop working."
- "Revoking does not unlink an already linked LINE identity."
- "Revoking does not send a notification."

### Regenerate

Use regenerate when:

- pending invitation expired,
- customer lost the link,
- operator wants a new token after revocation,
- product policy allows a fresh invitation.

UX requirements:

- create a new invitation,
- revoke old pending invitation if applicable,
- show new link / QR only once,
- preserve old invitation history,
- avoid reusing or revealing old token.

Recommended copy:

- "Generate a new invitation. The previous pending invitation will no longer be usable."
- "The new link is shown only once."

## Conflict / Blocked State Operator Runbook

### Conflict

Possible reasons:

- LINE identity already linked to another Customer.
- Invitation token was opened in the wrong LINE channel.
- Case / Customer / channel organization mismatch.
- Customer entered proof that does not match policy.
- Shared customer contact data creates ambiguity.

Operator action:

- Do not manually override with raw `lineUserId`.
- Verify Case / Customer ownership through approved internal process.
- Check masked identity summary and channel label only.
- Revoke invitation if it may be exposed.
- Create a new invitation only after scope is confirmed.
- Escalate to supervisor if identity conflict involves another Customer.

### Blocked

Possible reasons:

- too many failed attempts,
- repeated token mismatch,
- suspected social engineering,
- abnormal channel / IP / device pattern,
- product-defined security lock.

Operator action:

- Do not regenerate immediately unless policy allows.
- Review safe audit reason codes.
- Confirm customer through existing approved contact procedure.
- Escalate if the same LINE identity appears across unrelated customers.
- Keep raw identifiers out of handoff notes.

## Role / Permission Design

Recommended permissions:

- `line.read`: view masked linked identity and invitation status.
- `line.manage`: create, revoke, regenerate invitations and manage manual operational identity links.
- `cases.read`: view Case context.
- `customers.read`: view Customer context.
- future `line.binding.manage`: optional finer permission if the manual raw-ID operational tool must be separated from invitation lifecycle.

Recommended visibility:

- read-only users can see status and safe timestamps,
- manage users can create / revoke / regenerate invitations,
- manual raw-ID link form remains restricted and clearly labeled as an operational tool,
- no role can see token hash,
- no role can retrieve plaintext token after creation result,
- no role can trigger survey sending from binding panel.

## User-facing / Operator Copy Design

Recommended operator copy:

- "LINE binding is optional and does not change Case completion."
- "This invitation lets the customer verify and link their LINE identity."
- "The link is shown only once. Create a new invitation if it is lost."
- "Do not paste customer phone, raw LINE user id, token, or full payload into handoff notes."
- "Linked LINE identity is shown masked."
- "Binding does not send survey messages."

Avoid copy that implies:

- LINE binding is required to complete a Case,
- one appointment creates one formal report,
- operator can choose `finalAppointmentId`,
- operator can manually approve survey delivery,
- invitation creation sends LINE push automatically,
- `ALLOW_BROAD_INVENTORY` or inventory concepts apply here,
- raw LINE user id should be requested from customers.

## Survey Compatibility UX

Admin reverse binding UX must stay separate from post-completion survey runtime.

Rules:

1. Creating an invitation does not create survey intent.
2. Revoking or regenerating an invitation does not create survey intent.
3. Completing binding does not create survey intent.
4. Binding panel does not show a "send survey" button.
5. Binding panel does not make pending survey deliverable by manual operator action.
6. Future survey delivery resolver may use linked identity later if product policy allows.
7. Admin UI may eventually show a safe note such as "This customer has a linked LINE channel for future eligible communications."
8. Admin UI must not show raw LINE user id in survey context.

This keeps survey source of truth at first successful Case / Field Service Report completion transition.

## Future API / Data Dependencies

Future Admin UX depends on:

1. `line_binding_invitations` migration.
2. Invitation create API.
3. Invitation list / detail API.
4. Revoke API.
5. Regenerate API.
6. Token verification API.
7. Binding complete API.
8. Audit events.
9. Role / permission policy.
10. Rate limit / attempt limit.
11. Trusted LINE / LIFF context implementation.
12. Safe masked identity mapper.
13. Admin API client functions.
14. Admin UI state model.
15. Operator copy and training policy.

Task161 does not implement any of these dependencies.

## Future Tests / Smoke Plan

Future Admin UI tests:

- not-linked status displays.
- pending invitation status displays.
- linked status displays masked identity only.
- expired / revoked / conflict status displays safe reason.
- create invitation modal has no raw LINE id field.
- create invitation modal shows one-time link result only.
- status reload does not reveal token.
- revoke confirmation works.
- regenerate creates a new invitation flow.
- no survey send button exists.
- no manual raw `lineUserId` input in reverse-binding invitation flow.
- permission-based visibility works.

Future browser smoke:

- Admin creates invitation in local/test no-send mode.
- UI shows one-time link / QR placeholder safely.
- Status refresh works.
- Plaintext token is not visible after close / reload.
- Raw LINE id / customer mobile / raw payload are not present in DOM.
- No LINE push is sent.
- No survey sending is triggered.
- Revoke and regenerate update safe status only.

These are future tests only. Task161 does not add tests or smoke scripts.

## Remaining Blockers

Before implementation:

- approve migration design for `line_binding_invitations`,
- decide local-only dry-run / migration authoring path,
- define token TTL and regeneration policy,
- define trusted LINE / LIFF identity capture architecture,
- define rate limit mechanism,
- define audit retention policy,
- decide whether manual raw-ID operational tool should remain visible next to invitation UX,
- decide customer-facing copy and privacy wording,
- decide whether completed Cases can create binding invitations,
- define survey pending-channel reevaluation policy,
- define shared-runtime outbound policy.

## Final Recommendation

Add a future invitation-focused Admin panel separate from the current manual `CustomerLineIdentitiesPanel`.

Recommended UX posture:

- show safe binding status,
- let authorized operators create / revoke / regenerate invitations,
- show invitation token / URL once only,
- never display raw LINE user id,
- never accept raw LINE user id in the reverse-binding invitation UX,
- keep manual raw-ID linking as a restricted operational tool if needed,
- keep survey delivery separate,
- keep Case / Report completion independent from LINE binding.

## Non-goals

Task161 does not design or implement:

- backend runtime,
- Admin frontend runtime,
- API clients,
- migration files,
- schema / indexes,
- smoke tests,
- token generation,
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

Recommended verification for Task161:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
