# Task2231 - Repair Intake Draft-to-Case Controller/API Boundary Checkpoint

Status: checkpoint only

This checkpoint records the accepted Repair Intake draft-to-case boundary hardening from Task2226 through Task2230. It does not authorize or implement any additional runtime, DB, repository, provider, smoke, route, public-open, or rollout behavior.

## Accepted outcomes

- Task2226 added the application service injected-port failure normalizer. Injected port thrown, rejected, malformed, and non-object outputs now normalize to safe failure envelopes, unsafe injected-port fields are denied, success output remains explicitly shaped, and input/port-result objects are not mutated.
- Task2227 added the application service injected-port failure static guard. The guard freezes the injected-port-only boundary, fail-closed port guards, unsafe denylist, explicit success envelopes, and Task2226 test/doc evidence.
- Task2228 added the controller adapter application-service failure normalizer. The controller adapter now fails closed on thrown, rejected, null, array, non-object, and unsafe application-service results while preserving existing allowed success output.
- Task2229 added the controller adapter failure static guard. The guard freezes `callService(method, input)`, the sanitized `CONTROLLER_APPLICATION_SERVICE_FAILED` and `CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID` paths, unsafe scalar/array filtering, top-level forbidden field filtering, explicit success shaping, and API module inheritance of controller adapter normalization.
- Task2230 added the API module safe-controller boundary static guard. The guard freezes API module imports, injected application-service validation, construction through `createRepairIntakeDraftCaseControllerAdapter()`, safe request/output sanitizers, no raw request/body/draftInput/service-result spreading, and no runtime/DB/provider coupling.

## Current hardening status

- The application service remains injected-port based.
- Injected port failures and malformed outputs are normalized safely.
- The controller adapter fails closed on thrown, rejected, malformed, null, and non-object application-service results.
- The controller adapter strips, ignores, or drops unsafe service-result fields before controller-facing output.
- The API module builds injected application-service handlers through the controller adapter and safe controller path.
- The API module does not bypass controller adapter normalization.
- Raw request, body, draftInput, and service output are not passed through wholesale.
- Success paths remain explicitly shaped.
- Boundary guards now cover the application service, controller adapter, and API module layers.

## Current non-authorized scope

- No DB or repository transaction behavior is authorized.
- No concrete repository implementation change is authorized.
- No audit persistence behavior is authorized.
- No SQL, migration, schema, migration dry-run, or migration apply work is authorized.
- No route changes are authorized.
- No public, open, or customer route expansion is authorized.
- No smoke, endpoint probe, server/listener startup, shared runtime, deploy, staging, production, `/healthz`, or rollout work is authorized.
- No provider sending is authorized, including LINE, SMS, email, app push, or webhook.
- No auth/session middleware change is authorized.
- No rate-limit middleware change is authorized.
- No payload-size/body-parser middleware change is authorized.
- No permission model, role expansion, or organization isolation source change is authorized.
- No AI/RAG/OpenAI/vector DB work is authorized.
- No admin frontend work is authorized.
- No billing, settlement, payment, or invoice work is authorized.
- No Customer Access or Engineer Mobile behavior change is authorized.
- No package dependency change is authorized.

## Held docs

The 7 held historical untracked docs remain outside this checkpoint scope and must stay untouched unless PM explicitly authorizes them.
