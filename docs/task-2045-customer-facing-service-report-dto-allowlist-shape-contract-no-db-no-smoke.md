# Task2045 Customer-facing Service Report DTO Allowlist / Shape Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `8147b2e3db5cf03ecaf1bb85899bbbd93c584c29`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report successful DTO allowlist and shape contract only.

## Findings

No runtime source change was necessary. The projection service already constructs the successful customer-facing service report DTO through an explicit allowlist instead of passing through raw projection rows.

The accepted customer-facing DTO fields remain:

- Envelope: `status`, `messageKey`, `customerVisible`, `data`
- Data: `serviceReport`
- Service report: `customerReportReference`, `caseReference`, `serviceStatus`, `appointmentWindow`, `engineerDisplayName`, `serviceSummary`, `completionTime`, `publicAttachments`
- Public attachment item: `attachmentId`, `label`, `mimeType`

Optional service report fields are omitted when null, undefined, blank, or otherwise empty. Empty/invalid attachment data is omitted instead of producing placeholder values.

## Coverage added

The no-DB tests now explicitly cover successful DTO shape for:

- Direct projection service responses.
- Direct projection handler responses.
- Full mounted customer-facing service report route responses.
- Full mounted route and direct projection handler DTO equivalence.
- Null/empty optional field handling without placeholder output.
- Extra projection row fields being ignored by the customer-facing DTO.

The forbidden/internal leak coverage now includes sentinel values for:

- Raw SQL, query metadata, query config, connector internals, raw DB rows, debug markers, and stack text.
- Internal notes, engineer-only notes, dispatcher notes, service provider internal notes, and subcontractor internal notes.
- Provider payloads, webhook payloads, audit metadata, billing, settlement, cost, invoice, and payment fields.
- Organization-internal fields, unpublished/internal report fields, raw customer phone/address/contact internals.
- `finalAppointmentId` and Completion Report / Field Service Report approval/publication workflow internals.

## Behavior preserved

- Existing successful full-route sanitized DTO behavior remains unchanged.
- Existing direct projection handler sanitized DTO behavior remains unchanged.
- Existing safe-deny / not-found behavior remains unchanged.
- Existing parameter guard behavior remains unchanged.
- Existing access context source behavior remains unchanged.
- Existing response header / content-type contract remains unchanged.
- Existing projection failure envelope behavior remains unchanged.

## Explicit non-actions

- No runtime source changes.
- No DB connection.
- No SQL, migration, seed, or smoke execution.
- No endpoint probe or public/shared/prod target access.
- No Zeabur observation, deploy, restart, rollback, or env inspection.
- No provider, billing, or AI execution.
- No Completion Report or Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior mutation.
- No route expansion or global app/server mount change.

## Verification

- `node --test tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js`
  - Result: PASS, 63/63 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 777/777 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, or AI integration was touched.
