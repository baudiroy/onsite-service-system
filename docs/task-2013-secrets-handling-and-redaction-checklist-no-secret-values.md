# Task2013 Secrets Handling and Redaction Checklist / No Secret Values

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 20 - Staged Runtime Authorization and Matrix Planning
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2013-secrets-handling-and-redaction-checklist-no-secret-values.md`
- This document is no-secret-values planning only.
- This document does not authorize inspecting, printing, copying, generating, validating, rotating, or storing real secrets.

## Secret Classes Covered

| Secret class | Examples by variable/name only | Handling rule | Redaction expectation | Stop condition |
| --- | --- | --- | --- | --- |
| Database connection | `DATABASE_URL` | Never print value; user-managed/manual entry only | Replace any accidental value with `[REDACTED_DATABASE_URL]` | Stop if a real connection string is visible or required |
| Auth/session | `JWT_SECRET`, session tokens, cookies | Never print value; generation must happen outside Codex unless future task explicitly scopes a local command and no value is shown | `[REDACTED_AUTH_SECRET]`, `[REDACTED_TOKEN]` | Stop if token/cookie/secret appears in UI, logs, or command output |
| LINE provider | `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN` | Variable names only; no provider sending | `[REDACTED_LINE_SECRET]` | Stop if secret value is visible or provider execution is needed |
| SMS/email/app providers | SMS keys, email SMTP/API keys, app push keys, webhook tokens | Variable names only; manual entry by user | `[REDACTED_PROVIDER_SECRET]` | Stop if credential, recipient secret, or webhook token is visible |
| Billing provider | Billing API keys, webhook signing secrets, payment tokens | Variable names only; no invoice/payment/payment method execution | `[REDACTED_BILLING_SECRET]` | Stop if card/bank/payment token or billing secret is visible |
| AI/OpenAI | `OPENAI_API_KEY`, AI provider keys, model provider tokens | Variable names only; no provider calls | `[REDACTED_AI_KEY]` | Stop if key, raw sensitive prompt, or customer-private source text is visible without scope |
| R2/storage | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, signed URLs | Variable names only; signed URLs treated as sensitive unless future task says otherwise | `[REDACTED_STORAGE_SECRET]`, `[REDACTED_SIGNED_URL]` | Stop if storage secret, bucket credential, or signed URL value is visible |
| Zeabur env vars | Zeabur service env values, generated DB credentials, deployment tokens | Do not inspect values; user enters/sees values manually | `[REDACTED_ZEABUR_SECRET]` | Stop if env value panel exposes actual values |
| Private keys/passwords | SSH private keys, passphrases, user/admin passwords, GitHub tokens | Never print/copy/cat/store; public keys/fingerprints only when explicitly scoped | `[REDACTED_PRIVATE_KEY]`, `[REDACTED_PASSWORD]` | Stop if private key, passphrase, or password field content is visible |

## Required Operating Rules

- Values are never printed in chat, docs, screenshots, logs, commits, command output summaries, or PM reports.
- Only variable names may be documented.
- Secret entry is manual by the user in the destination UI or environment manager.
- Codex must not ask the user to paste secret values into chat.
- Codex must stop if a secret value is visible in Chrome, terminal, logs, screenshots, or a file.
- Codex must not open `.env` or deployment env-value screens unless a future exact task scopes a non-secret inspection method.
- Codex must not cat private keys, tokens, passwords, connection strings, or env files containing real values.
- Logs must be treated as secret-bearing until proven otherwise; if logs are inspected in a future task, the task must define a redaction-safe method.
- Screenshots must not show secret values, env values, password fields, token fields, connection strings, private keys, signed URLs, card/bank data, or QR-like secret material.
- Secret generation commands must not reveal generated values in chat or docs.

## Redaction Pattern Expectations

- Full value redaction is required; partial masking is not enough for private keys, tokens, passwords, connection strings, API keys, or signed URLs.
- Safe reports may include variable names, target labels, environment class, status class, and whether a secret was provided manually.
- Unsafe reports include raw values, prefixes/suffixes of secrets, screenshots of secret fields, copy/paste buffers, or command output containing credentials.
- If accidental exposure occurs, stop and report that a secret exposure happened without repeating the secret; ask the user to rotate the exposed secret outside Codex.

## Manual Entry Checklist

- User opens the target UI manually when secret entry is required.
- User enters/pastes the secret without sending it to Codex chat.
- Codex waits or looks away from secret value fields when necessary.
- Codex reports only variable names configured, not values.
- Codex does not verify secrets by printing them.
- Any post-entry verification must be non-secret, such as status labels, service boot state, or sanitized provider readiness.

## Completion Report Secret-Safety Template

Use this template for future secret-adjacent tasks:

```text
Secret safety report:
- Secret values printed: no
- Secret values inspected: no
- Secret values stored in repo/docs/chat: no
- Variables referenced by name only: <LIST_VARIABLE_NAMES_OR_NONE>
- User manual entry required: <YES_OR_NO>
- Screenshots/logs contained secrets: no
- If a value appeared, task stopped before repeating it: <YES_OR_NOT_APPLICABLE>
```

## Non-Actions Confirmed

- No real secret values were inspected or printed for this checklist.
- No provider, billing, AI, storage, DB, Zeabur env, deploy, smoke, endpoint probe, migration, or seed action was performed.

## Recommended Next Step

Proceed to Task2014 as a no-smoke branch-to-smoke dependency matrix.
