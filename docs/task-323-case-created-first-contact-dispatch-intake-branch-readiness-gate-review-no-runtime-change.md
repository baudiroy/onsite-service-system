# Task 323 - Case-created First Contact / Dispatch Intake Branch Readiness Gate Review / No Runtime Change

## Scope And Non-goals

This document closes the docs-only readiness review for the Case-created First Contact / Dispatch Intake branch covering Task320 through Task322.

It confirms that the branch has documented:

- first-contact workflow boundaries,
- contact attempt log / contact history boundaries,
- `dispatch_intake_draft` data boundaries,
- AI First-call Intake Assistant escalation boundaries,
- no-runtime constraints.

Task323 is not:

- SMS sending runtime,
- LINE sending or binding runtime,
- Web link or Web form runtime,
- AI call runtime,
- AI provider integration,
- human call workflow runtime,
- contact attempt log runtime,
- `dispatch_intake_draft` runtime,
- official dispatch data write runtime,
- appointment runtime,
- dispatch runtime,
- recording access runtime,
- permission / entitlement / usage runtime,
- audit runtime,
- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- DB / DDL execution,
- AI / RAG runtime,
- test / smoke / fixture change,
- package change.

No runtime implementation is approved by this document.

## Why This Readiness Gate Follows Task320-Task322

The branch started after `docs/PROJECT_GUARDRAILS.md` added the Case-created First Contact / Dispatch Intake Contact Workflow guardrail.

Task320 converted that guardrail into a workflow boundary matrix.

Task321 narrowed the data boundary between contact attempts, draft intake, confirmed dispatch data, and restricted recordings.

Task322 narrowed the AI escalation boundary for a future AI First-call Intake Assistant.

Task323 reviews whether the docs-only branch has enough boundary coverage to pause without implying runtime approval.

## Task320-Task322 Summary

### Task320 - First-contact / Dispatch-intake Workflow Boundary Matrix

Task320 documented the future channel / actor workflow:

- Case created,
- SMS first contact,
- SMS link click,
- LINE binding attempt / success / failure,
- Web link / Web form fallback,
- AI first-call attempt / completion / escalation,
- human call attempt / completion,
- App / Email contact attempt,
- `dispatch_intake_draft`,
- dispatcher / CS confirmation,
- official dispatch data transition.

It made clear that AI cannot decide or commit official data, and that runtime is not allowed.

### Task321 - Contact Attempt Log / Dispatch Intake Draft Data Boundary

Task321 documented the data boundary:

- contact attempt log is not official dispatch data,
- contact history is not a raw provider payload archive,
- `dispatch_intake_draft` is not confirmed dispatch data,
- call recording metadata and call recording content must be separated,
- raw provider payloads and raw recording payloads must not be stored by default,
- draft-to-official transition requires future human / authorized confirmation.

### Task322 - AI First-call Intake Assistant Escalation Boundary

Task322 documented the AI-specific boundary:

- AI first-call intake is low-risk only,
- AI cannot create or update appointments,
- AI cannot promise appointment, quote, compensation, settlement, fee consent, warranty, repair result, or case outcome,
- AI must hand off high-risk, complaint, dispute, ambiguous, safety, legal, fee, or customer-requested-human situations,
- AI output can only become draft or escalation note candidate.

## Branch Readiness Checklist

| Readiness item | Covered by | Current status | Runtime approved? |
| --- | --- | --- | --- |
| Case created -> SMS first contact | Guardrail update, Task320 | Future workflow boundary documented | No |
| SMS guides LINE binding | Guardrail update, Task320 | Future channel intent documented | No |
| Web link fallback | Guardrail update, Task320 | Future fallback boundary documented | No |
| AI first-call low-risk-only boundary | Task322 | Escalation and wording safety documented | No |
| Human handoff triggers | Task322 | Handoff triggers documented | No |
| Contact attempt log / contact history | Task320, Task321 | Metadata and minimization boundary documented | No |
| `dispatch_intake_draft` vs confirmed dispatch data | Task320, Task321 | Draft-to-official boundary documented | No |
| Call recording metadata vs restricted content | Task320, Task321, Task322 | Separation and restricted access boundary documented | No |
| Data Access Control | Task320, Task321, Task322 | Required future gate documented | No |
| Audit readiness | Task320, Task321, Task322 | Required future gate documented | No |
| SaaS usage tracking readiness | Task320, Task321, Task322 | Future usage boundary documented | No |
| Customer-visible vs internal-only separation | Task320, Task321, Task322 | Future privacy boundary documented | No |
| Safe deny / non-enumeration | Task320, Task321, Task322 | Required for customer-facing and identity flows | No |
| AI advisory-only boundary | Task320, Task321, Task322 | AI cannot commit official outcomes | No |

## Guardrail Alignment Review

This branch aligns with `docs/PROJECT_GUARDRAILS.md` because it preserves:

- one Case as the core workflow anchor,
- appointment / dispatch data as official only after authorized workflow,
- LINE as an important channel but not the only customer entry,
- customer channel identity scope,
- Data Access Control,
- customer-visible vs internal-only separation,
- sensitive data masking,
- safe deny / non-enumeration,
- audit readiness,
- SaaS usage tracking,
- AI advisory-only boundaries,
- no AI auto-decision.

Specifically:

- AI must not promise formal appointment, quote, compensation, settlement, fee consent, warranty, repair result, or case outcome.
- AI must not commit official dispatch data.
- High-risk, complaint, dispute, ambiguous, legal, safety, fee, or customer-requested-human situations must hand off to a person.
- `dispatch_intake_draft` must be confirmed by CS / dispatcher before becoming official dispatch data.
- All contact attempts should become future contact history.
- Call recordings should not be generally searchable or generally case-visible.
- Organization isolation must apply to all contact, channel, draft, recording, and dispatch data.
- Customer-facing flows must not expose internal notes, raw channel identifiers, audit internals, billing internal data, or AI raw payloads.

## Explicit Pause Decision

The Case-created First Contact / Dispatch Intake branch may pause after Task323 unless PM / product requests a specific additional docs-only closure item.

This pause is appropriate because the branch now has docs-only coverage for:

- workflow boundaries,
- data boundaries,
- AI escalation boundaries,
- privacy and recording boundaries,
- runtime forbidden boundaries,
- future implementation gates.

The pause does not approve any runtime work.

## Future-only Items List

Possible future tasks, each requiring explicit approval:

- contact attempt schema proposal,
- contact history retention policy,
- `dispatch_intake_draft` schema proposal,
- draft review / edit / reject / confirm workflow,
- provider sending design for SMS / LINE / Email / App,
- Web link / Web form customer fallback design,
- AI first-call eligibility policy,
- AI first-call provider / private / local model decision,
- human handoff workflow,
- call recording metadata schema,
- restricted recording access policy,
- audit taxonomy for contact / intake / recording,
- SaaS usage taxonomy for contact and AI calls,
- safe deny / non-enumeration policy,
- customer-visible copy policy,
- runtime authorization packet for any implementation.

## Runtime Forbidden Confirmation

Task323 does not allow:

- SMS sending runtime,
- LINE sending runtime,
- LINE binding runtime,
- Web link runtime,
- Web form runtime,
- AI call runtime,
- AI provider integration,
- human call workflow runtime,
- contact attempt log runtime,
- contact history runtime,
- `dispatch_intake_draft` runtime,
- official dispatch data write runtime,
- appointment runtime,
- Case runtime,
- dispatch runtime,
- recording access runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- audit runtime,
- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- DB connection,
- DDL,
- psql,
- `npm run db:migrate`,
- Migration020 dry-run or apply,
- AI / RAG runtime,
- tests / smoke / fixtures change,
- package change,
- inventory docs change.

## Non-goals

Task323 must not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API behavior,
- add or modify migrations / schema / indexes,
- connect to DB,
- execute DDL,
- run psql,
- run `npm run db:migrate`,
- execute Migration020 dry-run or apply,
- add SMS / LINE / Email / App sending,
- add Web link or customer self-service runtime,
- add AI call or AI provider runtime,
- add human handoff runtime,
- add contact log runtime,
- add dispatch intake runtime,
- add appointment / Case / dispatch runtime,
- add AI / RAG runtime,
- add permission / entitlement / usage / audit runtime,
- modify tests / smoke / fixtures / package.json,
- modify inventory docs.

## Future Implementation Gate

Before any runtime work can begin, a future task must explicitly approve:

- exact backend files / layers,
- exact Admin files / layers, if any,
- API contract changes, if any,
- migration / schema / index changes, if any,
- DB / DDL permission, if any,
- provider sending scope,
- channel identity verification rules,
- contact attempt schema,
- `dispatch_intake_draft` schema,
- human handoff workflow,
- AI eligibility and escalation policy,
- recording metadata / content policy,
- Data Access Control and organization isolation checks,
- audit log requirements,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task323 is a docs-only readiness gate and branch closure review.

It confirms that the Case-created First Contact / Dispatch Intake branch can pause after Task323, unless PM / product asks for another specific docs-only closure item.

It does not approve first-contact runtime, dispatch-intake runtime, SMS / LINE / Email / App sending, Web link runtime, AI call runtime, human handoff runtime, contact log runtime, official dispatch data writes, recording access runtime, DB / DDL, API changes, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.
