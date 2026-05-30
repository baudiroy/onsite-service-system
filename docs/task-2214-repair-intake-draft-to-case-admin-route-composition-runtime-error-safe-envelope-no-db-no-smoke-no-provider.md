# Task2214 Repair Intake Draft-to-Case Admin Route Composition Runtime Error Safe Envelope

## Scope

- Added focused safe-error coverage for the existing admin/injected Repair Intake draft-to-case route composition path.
- Made one narrow runtime source change in `src/routes/repairIntakeDraftToCase.routes.js`.
- No route was exposed, mounted, expanded, or moved.
- No DB, repository, migration, env, Zeabur, smoke, endpoint, server/listener, provider, AI/RAG, admin frontend, billing, Customer Access, Engineer Mobile, or package work was performed.

## Error Boundary Inspected and Changed

- Existing route composition and HTTP mount adapter paths already returned sanitized registration summaries for disabled routes, missing runtime ports, and mount/composition failures.
- The narrow remaining admin route boundary was `createExpressSubmitHandler()` in `src/routes/repairIntakeDraftToCase.routes.js`.
- Before Task2214, unexpected errors thrown while building or invoking the admin submit handler were passed to `next(error)`.
- Task2214 changes only that catch path to return a fixed `503` safe envelope when a response object is available.

## Final Safe Error Behavior

- Disabled route registration remains fail-closed and sanitized.
- Missing injected runtime ports remain fail-closed and sanitized.
- Route composition or mount exceptions return sanitized registration summaries without raw exception text.
- Permission middleware failure remains permission-gated and does not expose raw request or secret details.
- Malformed request-like input returns a fixed unavailable envelope:
  - `ok: false`
  - `status: unavailable`
  - `messageKey: repair_intake_draft_to_case.admin_route_unavailable`
  - `reasonCode: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR`
  - `caseId: null`
  - `repairIntakeDraftId: null`
- Successful admin route composition remains unchanged.

## Tests Added

- `tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSafeError.unit.test.js`

The focused test proves disabled registration, missing ports, composition/mount exceptions, permission middleware failure, malformed request-like input, and successful admin route composition remain sanitized or unchanged.

## Runtime Authorization Boundary

Task2214 does not authorize Task2215 or any public/open route exposure. PM must authorize one exact task at a time.
