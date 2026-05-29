# Task2009 Zeabur Service Deployment Observation Matrix / No Deploy

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 20 - Staged Runtime Authorization and Matrix Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2009-zeabur-service-deployment-observation-matrix-no-deploy.md`
- This is observation planning only.
- This document does not authorize Zeabur observation, deployment, redeploy, restart, rollback, endpoint probing, smoke, DB access, migration, seed, or environment value inspection.

## Known Non-Secret Inputs

- Service name: `onsite_service`
- Repo: `baudiroy/onsite-service-system`
- Expected branch: `main`
- Known non-secret public domain from prior observation: `onsite-service-api.zeabur.app`
- Latest synced repository baseline before Phase 20 execution: `fb972e3be68d694b8686f7a42f9de0186dbbe7bd`

## Observation Matrix

| Service name | Repo | Branch | Expected commit | Visible deployed commit | Deployment status | Observation source | Allowed observation only | Forbidden actions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `onsite_service` | `baudiroy/onsite-service-system` | `main` | Use the PM-accepted and GitHub-synced commit named by the future observation task; current pre-batch baseline was `fb972e3be68d694b8686f7a42f9de0186dbbe7bd` | Unknown until a future approved non-secret observation; prior UI may not expose commit hash | Unknown until a future approved non-secret observation | Zeabur UI service overview only, if future task explicitly authorizes observation | Service existence, service name, repo name, branch label if visible, non-secret domain, non-secret deployment status label, non-secret timestamp, non-secret commit/message if visible | Deploy, redeploy, restart, rollback, opening actions menus for changes, modifying config, inspecting env values, copying secrets, probing endpoints, running smoke, DB/migration/seed, provider/billing/AI |
| Backend public domain reference | `baudiroy/onsite-service-system` | `main` | Same as service row | Not applicable unless Zeabur UI exposes it without probing | Not applicable | Prior non-secret observation and docs-only matrix | Record domain string as known non-secret metadata only | Do not open the domain, do not call `/healthz`, do not send any HTTP request, do not infer runtime health from domain presence |
| PostgreSQL service, if present in project | Not applicable | Not applicable | Not applicable | Not applicable | Unknown and not observed in this task | Future explicitly scoped non-secret service list only | Service label/existence only if a future task permits it | Do not inspect credentials, connection strings, variables, logs containing secrets, DB console, SQL, migrations, or seed state |

## Commit Visibility Note

Zeabur non-secret UI may show a deployment message, timestamp, branch, or status while not exposing the deployed commit hash. If the commit hash is not visible without entering secret-bearing or action-bearing screens, the observation result must say `not visible` instead of claiming that the deployed commit matches GitHub.

## Safe Observation Rules For A Future Task

- Exact service name must be supplied by the user or PM before observation.
- Observation must remain read-only and non-secret.
- Environment variable screens may be listed as present only if visible from safe navigation, but values must not be opened, copied, read, screenshotted, or printed.
- Logs must not be opened if they may contain secrets unless a future task explicitly defines a redaction-safe log inspection method.
- Public domain visibility is not a smoke result. A domain string alone does not prove `/healthz`, safe-deny behavior, DB connectivity, or route readiness.
- Any deploy, redeploy, restart, rollback, config change, env change, DB operation, or endpoint probe requires a separate explicit task.

## Recommended Next Step

Proceed to Task2010 as a no-smoke target approval matrix. Do not observe Zeabur from this task.
