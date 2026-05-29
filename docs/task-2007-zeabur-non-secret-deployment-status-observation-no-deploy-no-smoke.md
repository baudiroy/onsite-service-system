# Task 2007 - Zeabur Non-secret Deployment Status Observation / No Deploy No Smoke

Date: 2026-05-29

## Scope

Task2007 records a non-secret Zeabur deployment status observation for the
explicitly approved service `onsite_service`.

This is observation and documentation only. It is not authorization to deploy,
redeploy, restart, rollback, run smoke, probe endpoints, inspect environment
variable values, connect to a database, run migrations, run seed, execute
provider calls, execute billing or payment behavior, execute AI/RAG providers,
publish customer-visible data, or mutate runtime state.

## User Approval

The approved target phrase was:

> I approve starting Task2007 for non-secret Zeabur deployment status
> observation against the explicitly named service: onsite_service. Do not
> deploy, do not inspect env values, do not run smoke, do not print secrets.

## Git Baseline

- Branch: `main`
- Local HEAD before observation:
  `8a3ab3e1c8c2f39f362cc27cfc9a1a5ca6d00f3c`
- `origin/main` before observation:
  `8a3ab3e1c8c2f39f362cc27cfc9a1a5ca6d00f3c`
- Local `main` equaled `origin/main` before observation: yes.

## Observation Source

- Source: non-secret Zeabur UI only.
- Target Zeabur service: `onsite_service`.
- Public endpoint was not opened or probed.
- Environment variable values were not opened, inspected, copied, or printed.
- Deployment, redeploy, restart, rollback, settings, and action controls were
  not clicked.

## Deployment Status Summary

| Field | Observation |
| --- | --- |
| Service found | Yes. |
| Target label visible | `onsite_service` was visible in the Zeabur UI. |
| Service/repository label visible | `onsite-service-system` was visible. |
| Repository visible | `baudiroy/onsite-service-system` was visible. |
| Deployment status | `運作中` / running. |
| Latest visible deployment time | `29m ago` / `29m 前`. |
| Latest visible deployment message | `Task2006 MVP trial go-no-go review`. |
| Visible deployed commit hash | Not visible in the observed UI surface. |
| Visible branch | Not visible in the observed UI surface. |
| Visible domain | `onsite-service-api.zeabur.app` was visible, but it was not opened or probed. |
| Baseline commit match | Exact hash match could not be confirmed because the deployed commit hash was not visible. |
| Baseline alignment note | The visible deployment message matched the local HEAD subject, but this is not a substitute for a visible commit-hash match. |

## Sanitized Status Notes

- The Zeabur UI showed the service status as running.
- The visible deployment message aligned by subject with the current local HEAD:
  `Task2006 MVP trial go-no-go review`.
- Exact deployed commit hash was not visible during this observation.
- Older visible relative times appeared in the UI, but no history entry was
  opened.
- Deploy/redeploy/restart/action controls were visible but not clicked.
- An environment variables area/control was visible by label only; it was not
  opened and no environment values were inspected.

## Explicit Non-actions

- No deploy.
- No redeploy.
- No restart.
- No rollback.
- No smoke.
- No endpoint probes.
- No `/healthz`.
- No environment value inspection.
- No DB connection.
- No SQL, migration, or seed.
- No provider sending.
- No billing provider, invoice, payment, or payment-method behavior.
- No AI/RAG provider execution.
- No secrets printed.
- No Zeabur service configuration changes.
- No runtime/source changes.
- No package, lockfile, test, or admin frontend changes.
- No Completion Report / Field Service Report behavior.
- No `finalAppointmentId` mutation.
- No customer-visible publication behavior.
- No organization isolation bypass.

## Recommendation

- Deployment status observation result: OK for non-secret observation only.
- The service was found and the visible status was running.
- The visible deployment message aligned by subject with the baseline commit,
  but the exact deployed commit hash was not visible.
- Do not infer exact deployed commit equivalence without a future approved
  observation that exposes a non-secret commit hash.
- Do not proceed to smoke or endpoint probes from this task.
- If the next step is needed, open a separate approved task that names the exact
  target and scope, for example:
  - approved non-secret commit/status observation if a commit hash is visible,
  - approved `/healthz` smoke against an exact URL,
  - or pause for business review.

## Stop Conditions Preserved

Future work must stop if:

- Target service is unclear.
- Secret values become visible.
- `DATABASE_URL` or any token/key/password/passphrase is visible.
- A deploy, redeploy, restart, rollback, settings change, or env change would be
  triggered.
- A DB, migration, seed, smoke, provider, billing, payment, AI/RAG, or
  customer-visible action would be triggered.
- A route or log exposes stack traces, SQL, raw DB rows, or secrets.
- Organization isolation risk appears.

## Non-authorization Statement

Task2007 does not authorize any runtime execution.

All future deployment, smoke, endpoint probe, DB, migration, seed, provider,
billing, payment, AI/RAG, customer-visible publication, Completion Report /
Field Service Report, or `finalAppointmentId` work remains gated by exact
PM/user approval.
