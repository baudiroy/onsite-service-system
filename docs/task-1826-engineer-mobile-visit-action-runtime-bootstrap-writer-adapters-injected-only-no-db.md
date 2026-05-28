# Task1826 - Engineer Mobile Visit Action Runtime Bootstrap Writer Adapters Injected Only No DB

## Scope

Task1826 updates the Engineer Mobile visit action runtime bootstrap so it can compose accepted injected writer adapters when synthetic writer sources are provided.

Allowed files:

- `src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.js`
- `tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrapBoundary.static.test.js`
- `docs/task-1826-engineer-mobile-visit-action-runtime-bootstrap-writer-adapters-injected-only-no-db.md`

## Runtime Shape

The bootstrap remains a pure CommonJS module. It imports only:

- `./engineerMobileVisitActionApplicationService`
- `./engineerMobileVisitActionInjectedMountAdapter`
- `./engineerMobileVisitActionTransitionWriterAdapter`
- `./engineerMobileVisitActionAuditWriterAdapter`

The factory preserves the existing direct-writer behavior and accepts optional injected synthetic writer sources:

- `transitionWriter`
- `auditWriter`
- `patchWriter`
- `auditEventWriter`
- `mountTarget`
- `basePath`
- `now`

Direct `transitionWriter` takes precedence over `patchWriter`. Direct `auditWriter` takes precedence over `auditEventWriter`. When direct writers are absent, the bootstrap can compose a transition writer adapter from injected `patchWriter`, and an audit writer adapter from injected `auditEventWriter`.

Bootstrap does not call direct writers, patch writer, or audit event writer during bootstrap. Writer calls happen only later when the bootstrapped service handles an accepted synthetic visit action.

The bootstrap result exposes only a sanitized writer source summary:

- `direct`
- `patch_writer_adapter`
- `audit_event_writer_adapter`
- `missing`

It does not expose writer internals, patch payloads, audit event payloads, raw errors, DB details, provider details, or customer data in the bootstrap result.

## Boundary

- No DB
- No migration
- No global mount
- No Express import
- No route index change
- No app/server change
- Injected dependencies only
- Injected writers only
- Injected patch writer only
- Injected audit event writer only
- No real persistence
- No real audit persistence
- No repository import
- No provider sending
- No completion report creation
- No completion report approval
- No completion report publication
- No finalAppointmentId mutation
- No customer-visible publication

## Verification Plan

- Unit tests cover direct writer preservation, adapter-created transition writer, adapter-created audit writer, direct-writer precedence, missing writer summary, mounted handler behavior, no bootstrap-time writer calls, sanitized output, and non-mutation.
- Static boundary tests enforce allowed imports and forbidden runtime patterns.
- Practical chain verification should include Task1826 runtime bootstrap tests plus the accepted application service, transition writer adapter, and audit writer adapter tests.
