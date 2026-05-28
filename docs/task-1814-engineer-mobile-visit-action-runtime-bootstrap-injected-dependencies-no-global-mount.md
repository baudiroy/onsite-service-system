# Task1814 - Engineer Mobile Visit Action Runtime Bootstrap / Injected Dependencies / No Global Mount

## Status

Implemented locally.

## Scope

Task1814 adds a bounded runtime bootstrap factory for Engineer Mobile visit actions. It composes the accepted application service and injected mount adapter using only caller-provided dependencies. This is not global runtime rollout and does not modify any app, server, controller, route index, DB, repository, provider, or persistence wiring.

Touched files:

- `src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.js`
- `tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrapBoundary.static.test.js`

## Runtime Shape

The module exports:

- `createEngineerMobileVisitActionRuntimeBootstrap`
- `ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND`

The factory accepts:

- `transitionWriter`
- `auditWriter`
- `mountTarget`
- `basePath`

The module imports only:

- `./engineerMobileVisitActionApplicationService`
- `./engineerMobileVisitActionInjectedMountAdapter`

## Behavior

The bootstrap factory creates an Engineer Mobile visit action application service with injected `transitionWriter` and optional injected `auditWriter`.

When no `mountTarget` is provided, it returns a sanitized service-only bootstrap result:

- `kind`
- `ok`
- `reasonCode: service_only`
- `mounted: 0`
- `routes: []`
- `visitActionService`

When `mountTarget` is provided, it calls the injected mount adapter and registers exactly one POST handler through the synthetic target:

- `mountTarget.post(path, handler)`
- `mountTarget.route(path).post(handler)`
- `mountTarget.register({ method, path, handler })`

Successful mounted bootstrap results include:

- `kind`
- `ok`
- `reasonCode: mounted`
- `mounted`
- `routes`
- `mountSummary`
- `visitActionService`

Failed mount results remain sanitized and preserve stable reason codes:

- `mount_target_required`
- `unsupported_mount_target`

The bootstrap does not call `transitionWriter.write` or `auditWriter.record` during bootstrap. Writers are only used later when the bootstrapped service or mounted handler processes a caller-provided synthetic request.

## Boundary Confirmation

No DB
No migration
No global mount
No Express import
No route index change
No app/server change
Injected dependencies only
Injected writers only
Injected mount target only
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
node --test tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.unit.test.js tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrapBoundary.static.test.js
```

Recommended chain verification:

```bash
node --test tests/engineerMobile/engineerMobileStartTravelActionPolicy.unit.test.js tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileArriveActionPolicy.unit.test.js tests/engineerMobile/engineerMobileArriveActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileStartWorkActionPolicy.unit.test.js tests/engineerMobile/engineerMobileStartWorkActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileFinishWorkActionPolicy.unit.test.js tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileRecordVisitResultActionPolicy.unit.test.js tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionPolicyRegistry.unit.test.js tests/engineerMobile/engineerMobileVisitActionPolicyRegistryBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionCommandPlanner.unit.test.js tests/engineerMobile/engineerMobileVisitActionCommandPlannerBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionApplicationService.unit.test.js tests/engineerMobile/engineerMobileVisitActionApplicationServiceBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionHttpHandlerAdapterBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapter.unit.test.js tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapterBoundary.static.test.js tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.unit.test.js tests/engineerMobile/engineerMobileVisitActionRuntimeBootstrapBoundary.static.test.js
```
