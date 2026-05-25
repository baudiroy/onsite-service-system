# Task 860 — ISO Controls Provider Secret Management Guard Baseline / Pure Module / No Provider Runtime

## Goal

Create a pure provider-secret management guard module that detects and blocks unsafe secret-like keys or values in config-like objects, and produces safe redaction and audit-intent metadata.

This task does not read environment variables, provider config, files, logs, prompts, runtime traffic, or real credentials.

## Scope

Changed files:

- `src/security/providerSecretGuard.js`
- `tests/security/providerSecretGuard.unit.test.js`
- `docs/design/iso27001-system-controls-roadmap.md`
- `docs/task-860-iso-controls-provider-secret-management-guard-baseline-no-provider-runtime.md`

## Runtime Boundary

The new module is pure and deterministic. It does not access:

- database
- environment variables
- filesystem
- network
- provider APIs
- config files
- logs
- prompts
- runtime traffic
- LINE / SMS / App push
- AI / RAG runtime
- repositories, controllers, routes, or services

## Safety Decisions

- Unsafe key patterns include token, secret, credential, password, apiKey, accessToken, refreshToken, privateKey, channelSecret, webhookSecret, databaseUrl, aiProviderKey, lineAccessToken.
- Unsafe value patterns include common bearer tokens, AI-like keys, Slack-style tokens, JWT-like strings, DB URLs, private key blocks, and long base64-like secrets.
- Redaction replaces unsafe values with stable placeholders only.
- Unknown config-like fields fail safe and are redacted unless explicitly allow-listed.
- Decision results include safe `reasonKey`, redacted value, count summary, and auditIntent metadata only.
- No raw secret value, token prefix/suffix, DB URL, full credential, prompt, payload, or secret substring is returned.

## Non-goals

This task did not:

- read `.env`, provider config files, logs, prompts, runtime traffic, or real secrets.
- add API routes, DTOs, controllers, services, or repositories.
- add DB schema, migrations, seed data, DDL, or psql usage.
- change permission runtime or audit runtime.
- connect to provider sending, AI/RAG runtime, logging runtime, or boot config.
- add smoke or integration tests.
- introduce token, secret, DB URL, LINE access token, AI provider secret, full PII, raw payload, credential, prompt, or production data.

## Verification

Executed commands:

```bash
node --test tests/security/providerSecretGuard.unit.test.js # PASS, 7 passed / 0 failed
npm run check # PASS
git diff --check -- src/security/providerSecretGuard.js tests/security/providerSecretGuard.unit.test.js docs/task-860-iso-controls-provider-secret-management-guard-baseline-no-provider-runtime.md docs/design/iso27001-system-controls-roadmap.md # PASS
```
