# Task1834 - Engineer Mobile Runtime Bootstrap Integrated Persistence Writer Wiring No DB

## Scope

Task1834 updates the Engineer Mobile visit action runtime bootstrap so callers may inject a synthetic `persistencePort` and have the bootstrap compose the accepted integrated persistence writer.

Allowed files:

- `src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.js`
- `tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrapBoundary.static.test.js`
- `docs/task-1834-engineer-mobile-runtime-bootstrap-integrated-persistence-writer-wiring-no-db.md`

## Runtime Shape

The bootstrap remains a pure CommonJS module. It imports only:

- `./engineerMobileVisitActionApplicationService`
- `./engineerMobileVisitActionInjectedMountAdapter`
- `./engineerMobileVisitActionTransitionWriterAdapter`
- `./engineerMobileVisitActionAuditWriterAdapter`
- `./engineerMobileVisitActionIntegratedPersistenceWriter`

The factory preserves the existing shape and safely accepts:

- `transitionWriter`
- `auditWriter`
- `patchWriter`
- `auditEventWriter`
- `persistencePort`
- `mountTarget`
- `basePath`
- `now`

Writer precedence:

- Direct `transitionWriter` wins first.
- If direct `transitionWriter` is absent and `persistencePort` is provided, the bootstrap creates the integrated persistence writer and exposes it to the application service as the transition writer source.
- If `persistencePort` is absent, injected `patchWriter` can still create the transition writer adapter.
- Direct `auditWriter` wins first.
- When `persistencePort` is used and no direct `auditWriter` exists, the integrated persistence writer builds the audit event together with the transition persistence payload; no separate audit event writer is created.
- If `persistencePort` is absent, injected `auditEventWriter` can still create the audit writer adapter.

The bootstrap result exposes only a sanitized writer source summary:

- `direct`
- `integrated_persistence_writer`
- `patch_writer_adapter`
- `audit_event_writer_adapter`
- `missing`

Bootstrap does not call direct writers, patch writer, audit event writer, or `persistencePort` during bootstrap. Writer calls happen only later when the bootstrapped service handles an accepted synthetic visit action.

## Boundary

- No DB
- No SQL
- No migration
- No global mount
- No route registration
- No Express import
- No repository import
- Injected dependencies only
- Injected writers only
- Injected patch writer only
- Injected audit event writer only
- Injected persistence port only
- No real persistence implementation
- No audit log persistence implementation
- No provider sending
- No completion report creation
- No completion report approval
- No completion report publication
- No finalAppointmentId mutation
- No customer-visible publication

## Verification Plan

- Unit tests cover existing direct writer behavior, existing patch/audit-event writer adapter behavior, `persistencePort` integrated writer composition, writer precedence, no bootstrap-time writer calls, service-only bootstrap, mounted handler behavior, sanitized output, and non-mutation.
- Static boundary tests enforce allowed imports and forbidden runtime patterns.
- Practical chain verification should include Task1834 runtime bootstrap tests plus accepted application service, transition writer adapter, audit writer adapter, integrated persistence writer, and persistence port writer adapter tests.
