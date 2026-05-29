# Task2046 Customer-facing Service Report Attachment Visibility Contract / No DB No Smoke

## Current baseline

- Baseline commit before this task: `292b8cc5ba3cc1cd2541874b9807f27c33e6b273`
- Branch: `main`
- Upstream: `origin/main`
- Scope: Customer-facing service report `publicAttachments` visibility and metadata shaping only.

## Findings

A narrow runtime source change was necessary. Before this task, attachment shaping omitted attachments with explicit `customer_visible` / `customerVisible` false, but it did not require an explicit customer-visible/public signal and did not deny draft, deleted, rejected, hidden, private, internal, or revoked attachment states.

Task2046 now requires each attachment to pass an explicit customer-visible/public visibility guard before it can be mapped into the successful customer-facing DTO. Deny flags and deny states win over allow signals.

## Runtime change

`src/customerAccess/customerServiceReportProjectionService.js` now:

- Recognizes explicit allow signals such as `customer_visible`, `customerVisible`, `public`, `publiclyVisible`, `customerVisiblePolicyPassed`, and customer-visible/public/published visibility states.
- Denies attachments marked private, internal, hidden, draft, deleted, rejected, revoked, unpublished, disabled, denied, or non-public.
- Denies attachments with delete/reject timestamp markers.
- Continues to emit only `attachmentId`, `label`, and `mimeType` for accepted attachment items.
- Continues to omit malformed/empty accepted attachment items instead of emitting placeholders.

## Coverage added

The no-DB tests now explicitly cover:

- Direct projection service attachment filtering.
- Full mounted customer-facing service report route attachment filtering.
- Full mounted route and direct projection handler DTO equivalence when attachments are present.
- Existing synthetic app adapter/internal test route fixtures updated to mark accepted fixture attachments explicitly customer-visible.

Forbidden/internal attachment fields covered include:

- Storage key, bucket, object path, signed/private/raw URLs.
- Upload/download tokens.
- Checksum, etag, and internal file metadata.
- Uploader internal identity.
- Engineer-only, dispatcher, provider, and subcontractor attachment notes.
- Audit metadata and visibility workflow internals.
- Draft, deleted, rejected, internal, private, and implicit/non-public attachments.
- Raw phone/address/contact metadata embedded in attachment data.
- Billing, settlement, and cost metadata.
- `finalAppointmentId` and Completion Report / Field Service Report approval/publication workflow internals.

## Invalid Collection Behavior

The projection now handles these safely without placeholders:

- `publicAttachments` / `public_attachments` missing, null, non-array, empty array, or malformed array entries.
- Attachment entries without explicit customer-visible/public signal.
- Attachment entries with customer-visible signal but no allowed metadata fields.

In these cases, the service report DTO remains otherwise valid and simply omits `publicAttachments`.

## Behavior preserved

- Existing service report DTO allowlist fields remain unchanged.
- Existing safe-deny / not-found / projection failure envelopes remain unchanged.
- Existing response header / content-type behavior remains unchanged.
- Existing parameter guard and customer access context behavior remain unchanged.
- The full mounted route and direct projection handler still return matching sanitized DTOs.

## Explicit non-actions

- No DB connection.
- No SQL, migration, seed, or smoke execution.
- No endpoint probe or public/shared/prod target access.
- No Zeabur observation, deploy, restart, rollback, or env inspection.
- No provider, billing, AI, or storage provider execution.
- No file upload, file download, or signed URL generation.
- No Completion Report or Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior mutation outside attachment DTO visibility filtering.
- No route expansion or global app/server mount change.

## Verification

- `node --test tests/customerAccess/customerServiceReportProjectionService.unit.test.js tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js tests/customerAccess/customerAccessServerExplicitPoolFullRoute.integration.test.js tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js tests/customerAccess/customerAccessInternalTestRouteMount.unit.test.js tests/customerAccess/customerAccessRoutes.unit.test.js`
  - Result: PASS, 80/80 tests passing.
- `find tests/customerAccess -name '*.js' -print0 | xargs -0 node --test`
  - Result: PASS, 780/780 tests passing.
- `npm run check`
  - Result: PASS.
- `git diff --check`
  - Result: PASS.

## Safety notes

- This task is no-DB and no-smoke.
- All new coverage uses synthetic injected rows, clients, and in-process route harnesses only.
- No real database, Zeabur service, deployed endpoint, provider, billing, storage, or AI integration was touched.
