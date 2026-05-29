# Task 2004 - Secrets and Environment Variable Readiness Review / No Secrets Printed

## Scope

Task2004 defines an environment variable and secrets readiness review checklist
that reports variable names, readiness status, and ownership only.

This document is planning-only and readiness-only. It is not authorization to
inspect secret values, print secrets, ask the user to paste secrets into Codex
chat, set or modify environment variables, deploy, run DB commands, run
migrations, run seed, run smoke, execute provider calls, execute billing or
payment behavior, execute AI/RAG providers, publish customer-visible data, or
mutate runtime state.

## Purpose

- Define how to verify environment and secrets readiness by variable name,
  presence status, ownership, and deferral status only.
- Prevent printing `DATABASE_URL`, `JWT_SECRET`, provider keys, billing keys,
  AI keys, tokens, passwords, private keys, passphrases, or Zeabur secrets.
- Keep user-generated and platform-managed secrets outside Codex chat, docs,
  commits, PM reports, and logs.
- Separate backend env readiness from admin/frontend env readiness.
- Preserve provider, billing, AI/RAG, migration, seed, smoke, and deployment
  gates until a future task explicitly scopes them.

## Non-authorization Statement

This checklist is not authorization to inspect secret values.

This checklist is not authorization to set or modify environment variables.

This checklist is not authorization to deploy.

This checklist is not authorization to run DB, migration, seed, smoke, provider,
billing, payment, AI/RAG, or customer-visible actions.

Each future env or secret task still requires exact PM/user approval naming the
target service, variable names, allowed action, forbidden actions, and reporting
limits.

## Env Readiness Categories

| Category | Purpose | Default posture |
| --- | --- | --- |
| Required for backend boot | Variables needed for the backend process to start correctly. | Must be checked by name/status only. |
| Required for auth/security | Secret or policy values used for authentication and token behavior. | Secret values must be generated or entered outside Codex. |
| Required for DB connection | Platform or user-managed DB connection references. | Values must never be printed. |
| Required only for seed/admin bootstrap | Seed-only admin bootstrap values. | Deferred unless seed is separately approved. |
| Optional for initial smoke | Non-secret operational defaults for bounded smoke. | Can be placeholder or deferred if explicitly safe. |
| Provider-specific deferred | LINE, SMS, email, storage, webhook, or similar provider values. | Deferred unless provider task scopes them. |
| Billing-provider deferred | Billing, payment, invoice, and payment-method provider values. | Future/deferred; do not set yet without billing scope. |
| AI/RAG deferred | AI, RAG, embedding, or retrieval provider values. | Deferred unless AI/RAG task scopes them. |
| Admin/frontend deferred | Admin app public configuration values. | Separate from backend env and deferred for backend-only work. |

## Variable Names To Track By Name Only

The following names are tracked by name only. Do not record or reveal values.

| Variable name | Readiness category | Recommended status for first safe review |
| --- | --- | --- |
| `NODE_ENV` | Required for backend boot / optional operational default | `placeholder_allowed` when set to a non-secret production value. |
| `PORT` | Required for backend boot / platform runtime | `managed_by_platform_reference` or `placeholder_allowed`. |
| `APP_BASE_URL` | Required for backend boot / public URL reference | `unknown_needs_owner_decision` until exact domain is approved. |
| `CORS_ORIGIN` | Optional for initial smoke / frontend relation | `deferred` unless exact frontend/admin origin is known. |
| `LOG_LEVEL` | Optional for initial smoke | `placeholder_allowed` for a non-secret value. |
| `DATABASE_URL` | Required for DB connection | `managed_by_platform_reference`; value must not be printed. |
| `JWT_SECRET` | Required for auth/security | `generated_by_user_outside_codex`; value must not be printed. |
| `JWT_EXPIRES_IN` | Required for auth/security policy | `placeholder_allowed` for a non-secret duration. |
| `SEED_ADMIN_EMAIL` | Required only for seed/admin bootstrap | `deferred` until seed approval. |
| `SEED_ADMIN_PASSWORD` | Required only for seed/admin bootstrap | `generated_by_user_outside_codex`; deferred until seed approval. |
| `SEED_ADMIN_DISPLAY_NAME` | Required only for seed/admin bootstrap | `deferred` until seed approval. |
| `LINE_CHANNEL_SECRET` | Provider-specific deferred | `do_not_set_yet` unless LINE task scopes it. |
| `LINE_CHANNEL_ACCESS_TOKEN` | Provider-specific deferred | `do_not_set_yet` unless LINE task scopes it. |
| `OPENAI_API_KEY` | AI/RAG deferred | `do_not_set_yet` unless AI/RAG task scopes it. |
| `AI_PROVIDER` | AI/RAG deferred | `deferred` unless AI/RAG task scopes it. |
| `R2_ACCOUNT_ID` | Provider-specific deferred | `do_not_set_yet` unless R2 task scopes it. |
| `R2_ACCESS_KEY_ID` | Provider-specific deferred | `do_not_set_yet` unless R2 task scopes it. |
| `R2_SECRET_ACCESS_KEY` | Provider-specific deferred | `do_not_set_yet` unless R2 task scopes it. |
| `R2_BUCKET` | Provider-specific deferred | `deferred` unless R2 task scopes it. |
| `R2_SIGNED_URL_TTL_SECONDS` | Provider-specific deferred | `deferred` unless R2 task scopes it. |
| `VITE_API_BASE_URL` | Admin/frontend deferred | `deferred` for backend-only setup. |
| `BILLING_PROVIDER_KEY` | Billing-provider deferred conceptual placeholder | `do_not_set_yet`; future placeholder only. |
| `BILLING_WEBHOOK_SECRET` | Billing-provider deferred conceptual placeholder | `do_not_set_yet`; future placeholder only. |
| `PAYMENT_PROVIDER_SECRET` | Billing-provider deferred conceptual placeholder | `do_not_set_yet`; future placeholder only. |

Billing placeholder names above are future/deferred conceptual placeholders, not
current required variables, unless a later billing task introduces concrete
names.

## Readiness Status Model

Use only these labels when reporting env readiness:

- `required_present_name_only`: required variable appears configured by name, but
  the value was not inspected.
- `required_missing`: required variable name is absent or not yet configured.
- `deferred`: variable is intentionally not needed for the current phase.
- `placeholder_allowed`: a non-secret placeholder or policy value is acceptable.
- `generated_by_user_outside_codex`: user must generate the secret outside Codex
  and enter it directly into the platform or secret manager.
- `managed_by_platform_reference`: platform manages the secret or reference by
  name; value is not revealed.
- `do_not_set_yet`: variable should remain unset until a future scoped task.
- `unknown_needs_owner_decision`: owner must decide the target, domain, or
  service relationship.

## Rules

- Never print secret values.
- Never ask the user to paste secrets into Codex chat.
- Only report variable names, readiness status, owner, and deferral reason.
- `DATABASE_URL` should be managed by platform reference or user secret input,
  not printed.
- `JWT_SECRET` should be generated by the user outside Codex and pasted directly
  into the platform UI or secret manager.
- Provider, billing, and AI/RAG secrets remain deferred unless a future task
  scopes them.
- LINE must not be treated as global identity.
- Admin/frontend env remains separate from backend env.
- Seed/admin bootstrap requires separate seed approval.
- Env readiness review must not trigger deploy, redeploy, DB access, smoke,
  provider sending, billing, payment, AI/RAG, invoice, or customer-visible
  publication.

## Stop Conditions

Stop immediately and report if any of the following occurs or appears likely:

- A secret value is visible.
- A user attempts to paste a secret into Codex chat.
- Env value inspection would reveal `DATABASE_URL`, `JWT_SECRET`, provider keys,
  billing keys, AI keys, tokens, passwords, private keys, or passphrases.
- Env modification is required to continue.
- Deploy or redeploy would be triggered.
- DB, migration, seed, or smoke would be triggered.
- Provider, billing, payment, invoice, or AI/RAG action would be triggered.
- Customer-visible publication would be triggered.
- Organization isolation risk appears.

## Exact Approval Phrase Templates

Use these as templates only. Replace bracketed placeholders before any future
execution. Each template forbids printing values.

### Non-secret Env Name Readiness Inspection

I approve non-secret env readiness inspection for `[exact service name]` by
variable name and readiness status only. Do not reveal or copy values, do not
inspect secret values, do not modify env vars, do not deploy, do not run DB,
migration, seed, smoke, provider, billing, payment, AI/RAG, or
customer-visible actions.

### User-managed JWT_SECRET Generation Outside Codex

I will generate `JWT_SECRET` outside Codex and enter it directly into `[exact
platform/service UI]`. Codex must not see, print, store, copy, or validate the
secret value. Codex may only record the variable name and readiness status.

### Platform-managed DATABASE_URL Reference Verification By Name Only

I approve verifying that `DATABASE_URL` is connected to `[exact platform DB
reference name]` by name/reference status only. Do not reveal, copy, print, or
store the value. Do not connect to DB, run SQL, migrations, seed, or smoke.

### Future Provider Secret Setup

I approve future provider secret setup planning for `[exact provider and
service name]` by variable names only. Do not print provider secret values, do
not send provider traffic, do not deploy, and do not run DB, migration, seed,
smoke, billing, payment, AI/RAG, or customer-visible actions.

### Future Billing Provider Secret Setup

I approve future billing provider secret setup planning for `[exact billing
provider and service name]` by variable names only. Do not print billing
secrets, do not create invoices, do not create payments, do not collect payment
methods, do not deploy, and do not run DB, migration, seed, smoke, provider,
AI/RAG, or customer-visible actions.

## Relationship To Task2001, Task2002, And Task2003

- Task2001 governs smoke target matrix and exact target approval.
- Task2002 governs migration and seed authorization.
- Task2003 governs Zeabur deployment verification boundaries.
- Task2004 governs env and secrets readiness without values.

Task2004 must not be used to bypass Task2001, Task2002, or Task2003. Env
presence alone is not authorization to deploy, run smoke, connect to DB, apply
migrations, run seed, execute providers, execute billing, execute AI/RAG, or
publish customer-visible data.

## Explicit Non-goals

Task2004 does not:

- Modify runtime source.
- Modify tests.
- Modify package or lockfiles.
- Modify admin frontend.
- Open or inspect Zeabur environment variable values.
- Set or modify environment variables.
- Ask the user to paste secrets into Codex chat.
- Probe Zeabur public endpoints.
- Deploy or redeploy.
- Connect to any DB.
- Run DB, SQL, psql, migration, seed, runtime, smoke, provider, billing,
  payment, invoice, or AI/RAG commands.
- Print DATABASE_URL, JWT_SECRET, tokens, private keys, provider keys,
  passwords, LINE secrets, billing provider secrets, AI keys, Zeabur secrets, or
  passphrases.
- Mutate `finalAppointmentId`.
- Create, approve, publish, revoke, or mutate Completion Report / Field Service
  Report behavior.
- Create customer-visible publication behavior.
- Bypass organization isolation.
