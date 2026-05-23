# Task659 - Data Correction Governance Orchestrator / Injected Writers / No DB / No API

## Scope

Task659 adds a bounded orchestrator for Data Correction / Amendment Governance phase-1 services.

This orchestrator coordinates existing injected-writer services behind a single action router. It does not connect to API, DB, repositories, providers, notification runtime, AI, RAG, or smoke tests.

## Added Service

`src/dataCorrection/dataCorrectionGovernanceOrchestrator.js`

Exported API:

- `runDataCorrectionGovernanceAction(input, options)`
- `DATA_CORRECTION_GOVERNANCE_ACTIONS`

Supported action types:

- `data_correction_request`
- `pre_departure_apply`
- `post_departure_freeze`
- `unable_to_complete_result`
- `follow_up_proposal`

## Routing Behavior

The orchestrator routes to:

- `processDataCorrectionRequest` for baseline policy/request behavior.
- `applyPreDepartureCorrection` for pre-departure non-phone operational corrections.
- `handlePostDepartureCorrectionFreeze` for post-departure manual handling metadata.
- `recordUnableToCompleteAppointmentResult` for arrived unable-to-complete terminal appointment results.
- `proposeFollowUpAppointment` for follow-up appointment draft/proposal metadata.

Unknown or missing actions safe-deny.

## Safe Envelope

The orchestrator returns safe envelope-like metadata:

- `handled`
- `actionType`
- `status`
- `decision`
- `result`
- `safeMessageKey`

It sanitizes downstream result envelopes and strips sensitive keys/values from its output.

The orchestrator does not expose:

- raw phone
- raw address
- raw LINE user id
- token / secret / password
- internal note raw value
- AI raw payload
- raw writer errors
- `finalAppointmentId`
- full request payload

## Explicit Boundaries

Task659 does not:

- Apply phone changes.
- Send SMS / LINE / App / Email.
- Create a formal appointment.
- Create a Field Service Report.
- Modify `finalAppointmentId`.
- Persist audit/contact/dispatch/follow-up records.
- Add API routes or controllers.
- Add DB access, migrations, or repository calls.

Phone correction remains re-verification required.

Post-departure correction remains manual contact / dispatch note / audit metadata.

Unable-to-complete appointment result remains an injected-writer result only and does not create a Field Service Report.

Follow-up proposal remains a draft/proposal only and does not create a formal appointment.

## Tests

Added:

- `tests/dataCorrection/dataCorrectionGovernanceOrchestrator.unit.test.js`

Coverage includes:

- Missing input safe-deny.
- Unknown action safe-deny.
- `data_correction_request` routes to request service behavior.
- `pre_departure_apply` routes to pre-departure service and calls correction writer for allowed non-phone correction.
- Phone correction does not call correction writer and returns re-verification required.
- Post-departure apply attempt does not call correction writer and routes to manual handling metadata.
- `post_departure_freeze` calls freeze writers for departed correction.
- `unable_to_complete_result` calls appointment result writer for arrived assigned engineer.
- `follow_up_proposal` calls follow-up draft writer for supported terminal source appointment.
- Downstream writer failure does not leak raw error.
- Output excludes raw phone / address / LINE id / token / secret / internal / AI payload.
- Output excludes `finalAppointmentId`.
- Input object is not mutated.
- Import boundary excludes DB, repository, provider, notification runtime, AI, RAG, and vector imports.

## Non-goals

Task659 does not:

- Add or modify APIs.
- Add or modify controllers or routes.
- Add DB queries, repositories, transactions, migrations, or schema.
- Add real persistence.
- Add real audit log, contact log, dispatch note, appointment result, or follow-up draft writers.
- Add Engineer Mobile, dispatch UI, or admin UI.
- Send LINE, SMS, Email, App push, AI calls, or provider notifications.
- Add smoke tests.
- Touch shared runtime or production data.

## Future Tasks

Recommended follow-up tasks:

1. Add API/controller wrapper only after explicit scope approval.
2. Add real permission runtime integration.
3. Add repository-backed persistence for each approved action.
4. Add real audit/contact/dispatch writers.
5. Add Engineer Mobile and dispatch UI surfaces.
6. Add integration and smoke coverage once API and DB slices are approved.
