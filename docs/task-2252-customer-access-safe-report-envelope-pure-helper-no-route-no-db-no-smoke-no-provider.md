# Task2252 - Customer Access Safe Report Envelope Pure Helper

Status: pure helper only

This task adds a standalone Customer Access safe report envelope presenter and focused unit tests. It does not wire the helper into routes, resolvers, handlers, repositories, DB, providers, smoke, app/server, or runtime paths.

Current accepted base:
- `7fc83cf4eed577b0ab98ef5374d57de5d6189aed`

## Added Files

- `src/customerAccess/customerServiceReportSafeEnvelopePresenter.js`
- `tests/customerAccess/customerServiceReportSafeEnvelopePresenter.unit.test.js`

## Helper Contract

The helper accepts an already-safe customer-facing projection object, including either a flat projection or an already-shaped `serviceReport` / `data.serviceReport` object, and returns a new customer-facing envelope.

Allowed top-level output fields:

- `ok`
- `status`
- `messageKey`
- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

Allowed public attachment fields:

- `attachmentId`
- `label`
- `mimeType`

Denied, missing, unavailable, or malformed input returns a generic unavailable envelope:

- `ok: false`
- `status: deny`
- `messageKey: customerAccess.unavailable`

## Guardrails

- The helper returns a new object and does not mutate input.
- The helper omits blank, malformed, private, raw, internal, system, provider, AI/RAG, billing, settlement, payment, invoice, SQL, token, password, and secret fields.
- The helper does not import DB, repository implementations, providers, AI/RAG, billing, routes, app/server, env, or runtime modules.
- This task does not change Customer Access route/API/DTO/resolver behavior or customer-facing report runtime behavior outside adding the standalone pure helper.

## Verification Scope

- Run the new unit test directly.
- Re-run the Task2249 projection allowlist static guard.
- Re-run relevant Customer Access static guards named by PM.
- Run text diff hygiene and git status checks.
