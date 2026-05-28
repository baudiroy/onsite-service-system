# Task1812 - Engineer Mobile Visit Action Injected Mount Adapter / No Global Mount

## Status

Implemented locally.

## Scope

Task1812 adds a bounded injected mount adapter for the Engineer Mobile visit action HTTP handler. The adapter mounts only onto an explicit synthetic `mountTarget` passed by the caller and does not change any global app, server, controller, route index, DB, provider, or persistence wiring.

Touched files:

- `src/engineerMobile/engineerMobileVisitActionInjectedMountAdapter.js`
- `tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapter.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapterBoundary.static.test.js`

## Runtime Shape

The module exports:

- `createEngineerMobileVisitActionInjectedMountAdapter`
- `ENGINEER_MOBILE_VISIT_ACTION_INJECTED_MOUNT_ADAPTER_KIND`

The factory accepts:

- `mountTarget`
- `visitActionService`
- `basePath`

The module imports only:

- `./engineerMobileVisitActionHttpHandlerAdapter`

## Behavior

The adapter creates the Task1810 HTTP handler adapter with the injected `visitActionService` and registers exactly one POST handler for:

- default path: `/engineer-mobile/appointments/:appointmentId/actions/:action`
- custom valid `basePath`: `${basePath}/appointments/:appointmentId/actions/:action`

Supported synthetic mount target forms:

- `mountTarget.post(path, handler)`
- `mountTarget.route(path).post(handler)`
- `mountTarget.register({ method, path, handler })`

Returned summary is sanitized and contains only stable metadata:

- `kind`
- `ok`
- `mounted`
- `reasonCode`
- `routes`
- `mountStyle`

Failure reason codes:

- `mount_target_required`
- `unsupported_mount_target`

Invalid custom `basePath` values safely fall back to the default path.

## Boundary Confirmation

No DB
No migration
No global mount
No Express import
No route index change
No app/server change
Injected mount target only
Injected service only
No real persistence
No repository import
No provider sending
No completion report creation
No completion report approval
No completion report publication
No finalAppointmentId mutation
No customer-visible publication

Additional constraints preserved:

- No `listen` call.
- No `src/app.js`, `src/server.js`, or `routes/index.js` changes.
- No controller registration.
- No provider sending: LINE, SMS, email, webhook, or push.
- No AI or RAG behavior.
- No billing or settlement behavior.
- No admin UI behavior.
- No package or lockfile changes.
- No seed changes.
- No permission table migration.
- No Completion Report creation, approval, or publication.
- No Field Service Report creation, approval, or publication.
- No `finalAppointmentId` creation or mutation.
- No customer-visible publication.
- No touching the 7 held historical docs.

## Verification

Targeted verification:

```bash
node --test tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapterBoundary.static.test.js
```

Recommended chain verification:

```bash
node --test tests/engineerMobile/engineerMobileStartTravelActionPolicy.unit.test.js tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileArriveActionPolicy.unit.test.js tests/engineerMobile/engineerMobileArriveActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileStartWorkActionPolicy.unit.test.js tests/engineerMobile/engineerMobileStartWorkActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileFinishWorkActionPolicy.unit.test.js tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileRecordVisitResultActionPolicy.unit.test.js tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionPolicyRegistry.unit.test.js tests/engineerMobile/engineerMobileVisitActionPolicyRegistryBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionCommandPlanner.unit.test.js tests/engineerMobile/engineerMobileVisitActionCommandPlannerBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionApplicationService.unit.test.js tests/engineerMobile/engineerMobileVisitActionApplicationServiceBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapterBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapterBoundary.static.test.js
```
