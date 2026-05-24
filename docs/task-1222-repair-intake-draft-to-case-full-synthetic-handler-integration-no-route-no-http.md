# Task1222 - Repair Intake Draft-To-Case Full Synthetic Handler Integration / No Route No HTTP

## Purpose

Task1222 adds a full synthetic integration test proving the complete non-HTTP Repair Intake draft-to-Case chain works from injected session/body/source input to a safe public-shaped output.

## Complete Synthetic Chain Validated

```text
synthetic handler input
-> Task1221 synthetic handler
-> Task1220 request context resolver
-> Task1217 controller adapter
-> Task1214 orchestrator
-> Task1213 authorization gate
-> Task1212 application service
-> Task1211 repository consumer
-> Task1208 repository contract boundary
-> Task1216 presenter
-> safe public-shaped result
```

## Added Files

- `tests/repairIntake/repairIntakeDraftToCaseFullSyntheticHandlerIntegration.unit.test.js`
- `docs/task-1222-repair-intake-draft-to-case-full-synthetic-handler-integration-no-route-no-http.md`

## Verified Scenarios

- Valid session/body input, allowed authorization, repository success, and safe public success output.
- Invalid session context stops before controller adapter, permission resolver, or repository.
- Body-provided organization/actor override attempts do not replace session-derived values.
- Denied authorization does not call repository and returns safe public denied.
- Repository skipped/no-case returns safe public not-created.
- Repository throw with sensitive raw message returns generic safe public unavailable.
- Unsafe input fields are stripped before permission resolver and repository.
- Execution order remains context resolver -> controller adapter -> permission resolver -> application service -> repository -> presenter.
- Original synthetic input, session context, request body, and draft input remain unchanged.

## Non-Goals

- No route registration.
- No controller folder integration.
- No HTTP framework request/response object.
- No app/server mount.
- No DB execution.
- No migration.
- No provider sending.
- No Admin runtime.
- No AI/RAG runtime.
- No billing or settlement runtime.
- No customer-visible runtime rollout.
- No real auth/session/JWT runtime.
- No token parsing.
- No JWT verification.

## Future Continuation

- Next task may update a branch checkpoint/static inventory for Task1220 through Task1222.
- Actual route/controller/API exposure remains blocked until separate PM approval.

## Worktree Boundary

Task1222 files may remain untracked/unstaged unless PM separately asks to stage or commit. Task1210 staged 13-path set must remain unchanged, and unrelated dirty tracked files must not be touched.
