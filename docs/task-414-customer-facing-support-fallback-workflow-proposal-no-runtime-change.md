# Task414 — Customer-Facing Support Fallback Workflow Proposal / No Runtime Change

Task414 proposes the future customer-facing support fallback workflow boundary
for generic safe-deny, unavailable links, customer help requests,
issue/follow-up entry points, and support-assisted handling.

This task is documentation-only. It is not a runtime kickoff and does not
authorize support workflow runtime, API, DB, provider sending, case creation,
complaint closure, link reissue runtime, or AI runtime.

## Current Baseline

Task414 follows the Task370-413 customer-facing no-runtime baseline.

Already accepted:

- Customer-facing pure utilities and pure unit tests.
- Runtime entry gate decision packet.
- Route/controller contract proposal.
- Resolver contract proposal.
- Customer channel identity persistence proposal.
- Token/link lifecycle proposal.
- Audit/security event model proposal.
- Audit/security event permission matrix proposal.
- Generic safe-deny localization/message key proposal.
- Safe-deny test matrix proposal.
- Runtime readiness consolidation cutline.
- Rate-limit / abuse protection proposal.

Current state remains:

- no customer-facing runtime,
- no support workflow runtime,
- no case / complaint / follow-up runtime,
- no link reissue runtime,
- no route/controller/API implementation,
- no resolver runtime,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no localization/message catalog runtime,
- no repository / DB access,
- no migration / schema / index,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task414 does not authorize support workflow runtime, API, DB, provider sending,
case creation, complaint closure, or link reissue.

## Support Fallback Principles

Customer-facing support fallback exists to safely guide customers when the
system cannot show a resource or when a customer needs help. It must not become
a permission bypass or an existence oracle.

Principles:

- External fallback wording must remain generic.
- Fallback wording must not reveal token expired / revoked / not found.
- Fallback wording must not reveal whether a Case exists.
- Fallback wording must not reveal whether an Appointment exists.
- Fallback wording must not reveal whether a Field Service Report exists.
- Fallback wording must not reveal whether a Customer exists.
- Fallback wording must not reveal whether a channel identity exists.
- Support fallback must not replace resolver authorization.
- Support fallback must not bypass customerAccessContext.
- Support fallback must not let support staff bypass organization isolation,
  permission, consent, or customer visible data policy.
- Support fallback must not automatically create, close, reopen, or modify a
  Case, Appointment, Field Service Report, complaint, issue, or follow-up.

## Future Fallback Entry Scenarios

The scenarios below are future proposals only. Task414 does not implement any
runtime.

| Scenario | Future customer-facing behavior | Support boundary | No-runtime note |
| --- | --- | --- | --- |
| Generic safe-deny after invalid access | Show generic help/support fallback without exact denial reason. | Support must verify scope and identity before accessing data. | Proposal only. |
| Customer cannot view service report | Offer generic help path without confirming report existence. | Support cannot infer existence from customer-facing denial reason. | Proposal only. |
| Customer cannot view appointment summary | Offer generic help path without confirming appointment existence. | Support must use internal permissioned lookup, not customer-facing error text. | Proposal only. |
| Customer wants to report unresolved issue | Accept generic issue/follow-up entry without granting broader access. | Must not auto-close or auto-change case/report state. | Proposal only. |
| Customer wants link reissued | Provide generic support path. | Link reissue requires future separate permission, verification, consent, and audit. | Proposal only. |
| Customer disputes completion | Route to future follow-up/escalation proposal. | Must not auto-reopen, auto-close, or overwrite report. | Proposal only. |
| Customer leaves low score / complaint / negative feedback | Acknowledge generically and route to future follow-up/escalation proposal. | Must not hide, modify, or close complaint automatically. | Proposal only. |
| Customer asks for human support | Provide generic support path. | Human support must remain permission-scoped and audit-ready. | Proposal only. |

## Generic Customer-Facing Acknowledgement

Issue/follow-up submission acknowledgement must be generic.

It must not:

- confirm that a Case exists,
- confirm that a Field Service Report exists,
- confirm that an Appointment exists,
- confirm that a Customer exists,
- promise that a formal Case has been created,
- promise that a complaint has been accepted as formally resolved,
- promise that a support agent has verified the customer,
- promise that a link will be reissued,
- automatically create a formal Case,
- automatically close a complaint,
- automatically close a follow-up,
- automatically hide or downgrade negative feedback.

Future acknowledgement should communicate only that the submitted information
was received or that the customer can contact support through a safe channel,
subject to future verified workflow design.

## Support Agent Verification Boundary

Before support staff handles a future fallback request, the workflow must
enforce:

- organization scope,
- role / permission,
- purpose-bound access,
- customer identity verification,
- channel identity verification or fallback verification,
- minimum necessary data access,
- customer visible data policy,
- internal data policy,
- sensitive data masking,
- audit/security event candidates where appropriate.

Support staff must not:

- directly see raw token,
- directly see raw channel id,
- use customer-facing denial reason to determine whether a resource exists,
- bypass organization isolation,
- bypass permission,
- bypass customer consent/contact policy,
- view complete sensitive data unless needed and authorized,
- expose internal note, audit log, AI raw payload, billing/settlement internal
  data, engineer internal comments, supervisor review, or vendor reconciliation
  rules to the customer.

Support staff views should be future-designed as internal permissioned
workflows, not as customer-facing route behavior.

## Link Reissue Fallback Boundary

Link reissue is a separate high-risk future workflow.

It requires future design for:

- specific reissue permission,
- route family / purpose,
- resource eligibility,
- organization scope,
- customer channel identity,
- verification state,
- consent/contact policy,
- rate-limit / abuse risk,
- audit/security event candidate,
- safe external messaging.

Rules:

- Do not reissue a full access link because a customer claims identity.
- Do not reveal expired / revoked / malformed / missing token state.
- Do not reveal whether a link was previously valid.
- Do not reveal whether a Case, Appointment, Report, Customer, or channel
  identity exists.
- Do not let link reissue bypass resolver or customerAccessContext.
- Do not let link reissue bypass rate-limit / abuse policy.
- Do not use raw token or raw channel id in customer-facing messages.

Task414 does not implement link reissue.

## Complaint / Unresolved Issue Boundary

Customer reports of unresolved issues, low scores, negative feedback,
complaints, or callback requests should be handled as future follow-up /
escalation design, not as automatic state changes.

Future workflow may create:

- follow-up candidate,
- escalation candidate,
- support review candidate,
- supervisor visibility candidate,
- redispatch evaluation candidate,
- customer feedback review candidate.

AI may assist with:

- summary,
- classification,
- risk flagging,
- duplicate pattern review,
- suggested support note draft.

AI must not:

- hide negative feedback,
- modify rating,
- close complaint,
- close follow-up,
- modify Case status,
- modify Appointment status,
- modify Field Service Report status,
- reopen or close a report,
- agree to customer fees,
- decide refund, compensation, or settlement outcome.

Future complaint/follow-up handling must preserve contact history and audit
design.

## Customer-Facing Service Report Boundary

Support fallback must not alter the Field Service Report invariant.

Rules:

- One Case equals one formal Field Service Report.
- Customer-facing service report remains a projection, not raw internal report.
- Support fallback does not create appointment-level formal reports.
- Support fallback does not override finalAppointmentId.
- Support fallback does not reopen or recomplete a completed report.
- Support fallback does not expose internal report fields.

Customer-facing report output must not include:

- internal note,
- audit log,
- AI raw payload,
- raw provider payload,
- billing internal data,
- settlement internal data,
- engineer internal comments,
- supervisor review,
- vendor reconciliation rules,
- raw token,
- raw channel id,
- complete phone number,
- complete address.

## Provider / Channel Boundary

Channels are contact or delivery surfaces, not authorization by themselves.

Principles:

- LINE is not the only support fallback.
- SMS, Email, App, Web Link, and future phone-assisted flows must fit the same
  customer access model.
- LINE / SMS / Email / App / Web Link cannot replace resolver authorization.
- `line_user_id` is not global identity.
- Raw channel id must not appear in customer-facing output.
- Provider delivery success does not prove identity authorization.
- Provider delivery failure must not expose internal denial reason.

Task414 does not add LINE/SMS/Email/App/survey sending. Future notification or
outbox work requires separate explicit authorization.

## Audit / Rate-Limit / AI Boundary

Support fallback may create future audit/security event candidates, but Task414
does not implement them.

Future candidates:

- support_fallback_requested,
- support_fallback_acknowledged,
- issue_follow_up_submitted,
- link_reissue_requested,
- link_reissue_denied,
- customer_completion_dispute_submitted,
- customer_negative_feedback_escalation_candidate,
- support_overreach_prevented,
- repeated_fallback_abuse_suspected.

Repeated fallback attempts may become future abuse candidates, but external
response must remain generic.

AI boundary:

- AI may use only masked, minimized, permission-filtered metadata.
- AI must not read raw token.
- AI must not read complete phone number or complete address.
- AI must not read raw provider payload.
- AI must not read internal note full text.
- AI must not read audit/security event full text.
- AI must not decide reissue / revoke / merge / unlink.
- AI must not close a Case.
- AI must not close a complaint.
- AI must not modify official records without human review or deterministic
  business logic.

## Current-Stage Strategy

Current-stage decision:

- document the support fallback workflow boundary,
- keep customer-facing runtime blocked,
- keep support workflow runtime blocked,
- keep case/complaint/follow-up runtime blocked,
- keep link reissue runtime blocked,
- keep audit/security event persistence blocked,
- keep DB/migration/schema blocked,
- keep provider sending blocked,
- keep AI runtime blocked.

Future implementation should start only after explicit runtime authorization
and should be local-only unless separately approved.

## Future Task Candidates

Future candidates only:

- support fallback wording checklist,
- support verification workflow proposal,
- link reissue workflow proposal,
- complaint/follow-up escalation workflow proposal,
- break-glass support access proposal,
- support fallback audit/security event schema proposal,
- local-only support fallback integration test plan after explicit runtime
  authorization.

These are not implemented by Task414.

## Explicit Non-goals

Task414 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify test files,
- add or modify smoke tests,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- implement support workflow runtime,
- implement case runtime,
- implement complaint runtime,
- implement follow-up runtime,
- implement link reissue runtime,
- implement API / route / controller runtime,
- implement resolver runtime,
- implement permission runtime,
- implement audit/security event tables,
- implement audit/security event query runtime,
- implement repository access,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- add audit write / log runtime / worker,
- trigger LINE/SMS/Email/App/survey/provider sending,
- call AI provider, RAG, vector DB, prompt, worker, or model runtime,
- add file/photo/signature/document storage runtime,
- add billing/settlement/inventory runtime,
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Decision

Task414 records a future customer-facing support fallback workflow proposal
only.

Decision summary:

- Support fallback must be generic externally and permission-scoped internally.
- Support fallback must not reveal token, resource, identity, consent, or
  binding state.
- Support fallback must not replace resolver or customerAccessContext.
- Link reissue requires a separate future permission/verification/audit design.
- Issue/follow-up acknowledgement must not confirm case/report existence.
- Complaint or unresolved issue handling must not auto-close or auto-modify
  official records.
- DB/API/runtime/provider/localization/smoke/browser work remains blocked.

## Verification Plan

For Task414 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only proposal.

## Redaction Note

This document contains policy terms such as token, secret, raw channel id,
phone, address, provider payload, `DATABASE_URL`, `line_user_id`, and Zeabur
only as examples of data or runtime boundaries that must not be exposed or
touched without authorization. It does not include credentials, database URLs,
access tokens, secrets, complete customer phone numbers, complete customer
addresses, raw channel identifiers, raw provider payloads, verification codes,
or production data details.
