# Task 714 - Engineer Mobile Read Model Schema Proposal and Static Guard / No DB / No Migration

## Summary

Task 714 added an Engineer Mobile read model schema proposal and static guard.

Added:

- `docs/design/engineer-mobile-read-model-schema-proposal.md`
- `tests/engineerMobile/engineerMobileReadModelSchemaProposal.static.test.js`

## Proposal Boundary

The proposal defines future read-side row shape, conceptual source concepts, safe fields, forbidden fields, invariants, query boundaries, and conceptual index needs for Engineer Mobile task list/detail read models.

It does not authorize:

- DB connection
- SQL execution
- migration / DDL
- schema or index creation
- app/server/routes/controllers changes
- provider sending
- AI/RAG runtime
- UI work

## Static Guard

The static test reads the proposal document and verifies:

- the proposal exists
- status says no migration / no DB execution
- source concepts are documented
- required read model fields are present
- forbidden fields include raw phone/address/LINE id, token, secret, and final appointment fields
- organization scope and assigned engineer invariants are present
- appointment-specific detail invariant is present
- masked contact and safe address invariants are present
- read-only no Case / Appointment / Field Service Report mutation invariant is present
- task detail is not a Field Service Report
- query boundary requires `executable:false`, placeholders, and no interpolation
- future DB execution requires separate authorization
- conceptual indexes are documented
- Task692 / Task709 / Task713 references are present
- no real-looking credential or DB URL examples are present

## Runtime Boundary

Task 714 did not change:

- `src/`
- `admin/src/`
- app / server / routes / controllers
- real DB client or SQL executor
- migrations / schema / indexes
- package files
- smoke / browser scripts
- guardrails / short instruction
- design README or task indexes

## Future Tasks

- Add executable query specs only after explicit DB/runtime approval.
- Add DB-backed repository adapter only in a separate bounded task.
- Add migration or DB view design only after a separate migration task.
- Add local disposable DB dry-run only after explicit local-only approval.
