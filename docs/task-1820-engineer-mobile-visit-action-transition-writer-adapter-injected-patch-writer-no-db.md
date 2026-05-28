# Task1820 Engineer Mobile Visit Action Transition Writer Adapter / Injected Patch Writer Only / No DB

Status: local runtime slice.

## Scope

Task1820 adds a pure Engineer Mobile visit action transition writer adapter. The adapter converts a sanitized `transitionIntent` into a safe patch envelope with the accepted Task1818 patch builder, then delegates that envelope to an injected synthetic `patchWriter.write` function.

Allowed files:

- `src/engineerMobile/engineerMobileVisitActionTransitionWriterAdapter.js`
- `tests/engineerMobile/engineerMobileVisitActionTransitionWriterAdapter.unit.test.js`
- `tests/engineerMobile/engineerMobileVisitActionTransitionWriterAdapterBoundary.static.test.js`
- `docs/task-1820-engineer-mobile-visit-action-transition-writer-adapter-injected-patch-writer-no-db.md`

## Runtime Behavior

The adapter exports:

- `createEngineerMobileVisitActionTransitionWriterAdapter`
- `ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND`

The module imports only `./engineerMobileVisitActionTransitionPatchBuilder`.

Factory shape:

```js
createEngineerMobileVisitActionTransitionWriterAdapter({
  patchWriter,
  now,
})
```

Returned adapter shape:

```js
{
  kind,
  write(transitionIntent)
}
```

The adapter validates that `patchWriter.write` exists, calls `buildEngineerMobileVisitActionTransitionPatch({ transitionIntent, now })`, preserves patch-builder denial `reasonCode` values, and calls `patchWriter.write(patchEnvelope)` exactly once only after the patch builder succeeds.

Accepted patch writer success variants:

- `undefined`
- `null`
- `true`
- `{ ok: true }`
- `{ accepted: true }`
- `{ written: true }`
- `{ persisted: true }`

Patch writer failure and thrown errors return sanitized `patch_write_failed`. Missing writer returns `patch_writer_required`.

## Boundary Confirmation

- No DB
- No migration
- No global mount
- No route registration
- No Express import
- No repository import
- Injected patch writer only
- No real persistence implementation
- No provider sending
- No completion report creation
- No completion report approval
- No completion report publication
- No finalAppointmentId mutation
- No customer-visible publication

Additional non-goals:

- No SQL execution or psql.
- No controller changes.
- No `src/app.js`, `src/server.js`, or route index changes.
- No listen call.
- No smoke test.
- No LINE, SMS, email, webhook, push, AI, RAG, billing, settlement, admin UI, package, lockfile, seed, or permission table changes.
- No Completion Report, Field Service Report, customer publication, or final appointment mutation workflow.
- No staging, commit, push, cleanup, reset, stash, revert, or held historical docs changes.

## Sanitization

The adapter does not expose raw patch writer results, raw errors, stack traces, SQL or DB metadata, provider payloads, customer data, report draft fields, customer-visible publication fields, Completion Report or Field Service Report fields, or final appointment mutation fields.

The adapter does not mutate the provided `transitionIntent` and protects returned safe results from patch writer payload mutation.
