# Task 496 - Engineer Mobile Workbench Assignment Permission Rule Design

## Status

Task 496 is docs-only.

It defines future assignment permission rules for Engineer Mobile Workbench. It does not implement runtime behavior.

## Current Baseline

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Task 483 completed the real permission / assignment design packet.

Task 494 recommended Model B: engineer profile linked to platform user as Phase 1 target design.

Task 495 defined organization scope / active organization policy.

Actual auth/session runtime remains unimplemented.

Real assignment permission runtime remains unimplemented.

Task 496 is docs-only and does not authorize runtime implementation.

## Why Assignment Permission Is Separate

Auth identity answers: who logged in?

Organization scope answers: which organization context is active?

Assignment permission answers: can this actor view or operate this appointment / dispatch visit?

Assignment permission must not be decided by client-supplied `engineerId` or `organizationId`.

Organization membership is not appointment access.

Admin / supervisor permission should not automatically become engineer own-task access.

Entitlement / seat billing is not appointment permission.

## Assignment Permission Subject

Future subject should be built from server-side data only.

Candidate subject fields:

- authenticated engineer actor
- linked engineer profile reference
- organization scope reference
- role hints
- status such as active, disabled, or suspended
- assignment eligibility
- contractor/vendor relationship, if applicable

Subject must not use:

- client-supplied `engineerId`
- raw LINE user id
- customer channel identity
- token/link identity alone
- full user record
- all organization memberships by default

## Assignment Permission Object

Future object should represent the target appointment / dispatch visit without leaking full data before allow.

Candidate object fields:

- appointment / dispatch visit reference
- case reference only as internal linkage
- organization scope reference
- assigned engineer reference
- status
- scheduled time window
- current visit outcome
- dispatch assignment state

Engineer mobile client must not directly use the object to infer or retrieve:

- full Case data
- full Field Service Report data
- internal note
- billing / settlement data
- audit log
- AI raw payload

## Allow Rule Candidates

Proposal-only allow rules:

- engineer is active
- engineer belongs to server-side organization scope
- appointment / dispatch visit belongs to the same organization scope
- appointment / dispatch visit is assigned to engineer profile
- appointment / dispatch visit is in a state where engineer access is allowed
- no other unfinished appointment conflict for the same Case, as future consistency guard
- read detail is allowed only after assignment allow
- status operation is allowed only for the current assigned appointment / dispatch visit
- completion submission is allowed only for the current assigned appointment / dispatch visit in allowed state

These rules are not runtime behavior in Task 496.

## Deny / Safe-deny Candidates

Potential deny cases:

- unauthenticated
- engineer disabled / suspended
- no active organization scope
- appointment not found
- appointment not in organization
- appointment assigned to another engineer
- appointment not assigned
- appointment already terminal
- Case has conflicting unfinished appointment
- cross organization
- customer / admin identity trying to use engineer workbench
- insufficient role / not engineer actor

External response should use generic safe-deny / response equivalence.

The response must not leak:

- whether appointment exists
- whether Case exists
- whether customer exists
- whether appointment belongs to another engineer
- organization membership details
- DB error details

## Status Operation Permission

Future status operation permission should distinguish:

- view task list
- view task detail
- mark arrived
- mark started
- submit completion
- submit unable to complete
- submit pending parts
- submit customer unavailable
- report cancellation / reschedule request as field report only

Engineers must not:

- formally reassign dispatch
- create new appointment
- manually select `finalAppointmentId`
- treat completion submission as formal Field Service Report

Arrived / started / completion submitted are appointment / dispatch visit layer operations.

Completion submission is not formal Field Service Report completion.

## Override / Exception Boundary

Admin / dispatcher / supervisor override is a future exception flow.

Override is not part of the engineer normal flow.

Override requires:

- permission
- reason
- audit
- bounded scope

Override must not:

- break one Case / one formal Field Service Report
- allow engineer client to bypass assignment permission
- turn customer service follow-up into engineer assignment permission
- let manual `finalAppointmentId` selection become normal engineer workflow

## Future DB / Repository Implications

Future assignment permission may need:

- appointment / dispatch visit repository
- engineer profile repository
- organization membership repository
- appointment state query
- Case unfinished appointment consistency guard

Any DB / repository / migration work requires future PM exact scope.

Task 496 does not create tables, add repository, or query DB.

## Future Verification Needs

Proposal-only future tests:

- assignment allow unit tests
- cross-organization deny tests
- assigned-to-other-engineer deny tests
- terminal appointment deny tests
- no resource enumeration tests
- `finalAppointmentId` not accepted from engineer tests
- duplicate unfinished appointment guard tests
- no DB/provider/AI in no-DB tasks tests

Task 496 does not create or execute tests.

## Future Task497 Recommendation

Proposal only:

`Task497 - Engineer Mobile Workbench Appointment State Operation Rule Design / No Runtime Change`

Reason:

- assignment permission defines whether operation is allowed
- separate state rules must define arrived / started / completion submitted / unable / pending parts / customer unavailable
- appointment / dispatch visit layer must remain separate from Case / Field Service Report layer

Task 496 does not authorize Task497 implementation.

## Explicit Non-goals

Task 496 does not:

- modify backend `src/`
- modify `admin/src/`
- add or modify route/controller/resolver/guard/projection/auth/boundary/service/repository
- wire `requireAuth` or `requireOrganizationAccess` to Engineer Mobile Workbench route
- add auth adapter runtime
- add actual auth/session validation
- add real permission decision
- add assignment lookup runtime
- add organization scope runtime
- add DB / repository
- add schema / migration / Migration020
- add fixtures / tests
- execute tests
- execute DB / migration / psql
- execute smoke/browser/API tests
- implement mobile UI / PWA
- implement upload / signature / object storage
- trigger provider sending
- call AI/RAG/vector database
- modify `package.json`
- modify inventory docs

## Migration / Schema Decision

No migration, schema, index, DB, or Migration020 change is included in Task 496.

## Runtime Decision

No runtime behavior is changed in Task 496.

Engineer Mobile Workbench remains skeleton-only with no actual auth/session validation and no real assignment permission runtime.
