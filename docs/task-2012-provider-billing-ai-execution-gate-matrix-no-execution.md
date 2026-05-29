# Task2012 Provider / Billing / AI Execution Gate Matrix / No Execution

## Current Baseline

- Date: 2026-05-29
- Phase: Phase 20 - Staged Runtime Authorization and Matrix Planning
- Baseline at task start: `b17eb2f5ecf1848e0bd6c1f3aa0893cff9e16b54`
- Planning source: `docs/planning/runtime-task-packet-2008-2072/task-2012-provider-billing-ai-execution-gate-matrix-no-execution.md`
- This document is no-execution planning only.
- This document does not authorize provider sending, billing provider calls, invoice creation, payment creation, payment method collection, AI/RAG provider calls, storage provider execution, DB access, smoke, endpoint probes, deployment, or secret handling.

## Gate Matrix

| Capability | Default status | Required exact approval phrase | Required target / environment | Sandbox / prod distinction | Secret handling | Allowed sanitized output | Stop conditions | Audit requirements | Rollback / disable requirements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LINE provider sending | Forbidden unless explicitly scoped | `I approve LINE provider sending for <MESSAGE_TYPE> against <TARGET_ENVIRONMENT> and <TARGET_RECIPIENT_SCOPE> only. Do not print secrets.` | Exact channel/environment, recipient scope, message type, and sending limit | Sandbox/test recipient approval is separate from real customer sending | User enters/maintains LINE secrets outside Codex; Codex may document variable names only | Message category, target environment label, count, provider result class, redacted request id | Stop if real customer recipient is ambiguous, secret is visible, send limit is missing, or webhook side effects are unclear | Record who approved, target scope, message type, sanitized provider result, and no-secret confirmation | Disable sending path or remove provider env manually if rollback is needed; do not rotate secrets from Codex |
| SMS / Email / App / webhook provider sending | Forbidden unless explicitly scoped | `I approve <PROVIDER_TYPE> sending for <MESSAGE_TYPE> against <TARGET_ENVIRONMENT> and <TARGET_RECIPIENT_SCOPE> only. Do not print secrets.` | Exact provider, environment, recipient scope, payload type, and send count | Sandbox/test recipients only unless production customer sending is explicitly named | Provider keys/passwords/tokens are never printed; manual entry only | Provider type, target label, count, status class, redacted correlation id | Stop if recipient scope, send count, provider account, or payload content is ambiguous | Approval record, provider type, sanitized outcome, no-secret confirmation | Disable provider switch or clear env manually by user if needed |
| Billing provider | Forbidden unless explicitly scoped | `I approve billing provider sandbox execution for <BILLING_ACTION> against <TARGET_ENVIRONMENT> only. No production charge, no secrets printed.` | Exact billing provider, account/environment, action, tenant/org, and sandbox/prod status | Sandbox billing is separate from production billing; production requires a stronger production billing gate | Billing secrets never printed; manual entry only | Provider action name, sandbox/prod label, sanitized result id/class | Stop if action could create real charge, provider mode is unclear, or secret appears | Approval record, tenant/org scope, sanitized billing event, no real charge confirmation | Disable provider integration, revoke sandbox object, or manual provider dashboard cleanup as scoped |
| Invoice creation | Forbidden unless explicitly scoped | `I approve invoice creation for <TENANT_OR_CUSTOMER_SCOPE> in <TARGET_ENVIRONMENT> only. Billing provider execution remains <ENABLED_OR_DISABLED>.` | Exact tenant/customer, environment, invoice type, draft/final status | Draft/sandbox invoice is separate from production/final invoice | No provider secret printing; invoice values may be reported only if non-sensitive and explicitly scoped | Invoice status, non-sensitive id/class, target label | Stop if invoice would become customer-visible or payable unexpectedly | Audit invoice creation intent, approver, target scope, and sanitized id | Void/delete draft only if explicitly scoped and allowed by provider/system |
| Payment creation | Forbidden unless explicitly scoped | `I approve payment creation in <SANDBOX_OR_PRODUCTION> for <TARGET_SCOPE> only. Do not print secrets.` | Exact payment provider, target environment, amount/currency policy, payer scope | Sandbox payment is separate from production payment; production requires payment-specific approval | Payment secrets and card data are never handled by Codex | Sanitized status class and provider reference class only | Stop if real money, payer, amount, or provider mode is ambiguous | Audit approval, target, amount policy, sanitized result, no-card-data confirmation | Refund/void path must be explicitly scoped; no automatic rollback |
| Payment method collection | Forbidden unless explicitly scoped | `I approve payment method collection setup for <TARGET_SCOPE> in <SANDBOX_OR_PRODUCTION> only. Codex must not handle card or bank data.` | Exact provider, tenant/customer scope, hosted collection method, environment | Sandbox setup is separate from production collection | Codex must never view, type, store, or print card/bank data | Hosted setup status only; no payment data | Stop if UI asks Codex to handle payment data, secret, or customer financial data | Audit hosted collection configuration and no-card-data confirmation | Disable hosted collection or detach method only with explicit task |
| AI/RAG provider calls | Forbidden unless explicitly scoped | `I approve AI/RAG provider call for <USE_CASE> against <TARGET_ENVIRONMENT> only. Do not print secrets or customer-sensitive source content.` | Exact provider, model/use case, data source scope, environment, and output destination | Local/synthetic evaluation differs from real provider call; production customer data requires separate gate | AI keys never printed; prompts/source snippets must be redacted as scoped | Provider call count, model label, redacted prompt category, sanitized output class | Stop if customer/private data scope is unclear, key is visible, prompt cannot be redacted, or output may mutate business state | Audit use case, data source class, model/provider, redaction status, no-mutation confirmation | Disable provider env or feature flag manually; no auto-learning or auto-business action rollback |
| R2 / storage provider | Forbidden unless explicitly scoped | `I approve storage provider operation <ACTION> for <BUCKET_OR_SCOPE> in <TARGET_ENVIRONMENT> only. Do not print secrets.` | Exact account/bucket/scope, action, object class, environment | Test bucket and production bucket are separate gates | Storage keys never printed; signed URLs treated as sensitive unless explicitly scoped | Object class, target label, count, sanitized result | Stop if bucket/env is ambiguous, object may expose customer data, or signed URL would be printed | Audit object scope, action, result class, and no-secret confirmation | Delete/revoke/expire objects or signed URLs only with explicit approval |

## Distinctions That Must Not Be Collapsed

- Provider readiness is not provider execution.
- Billing metadata is not invoice creation, payment creation, payment method collection, or real charging.
- AI advisory design is not AI provider execution.
- Storage readiness is not object upload, deletion, public exposure, or signed URL generation.
- Sandbox approval does not authorize production.
- A docs-only planning task does not authorize outbound effects.

## Global Stop Conditions

- Any real secret value becomes visible.
- Any target environment, provider account, recipient, payer, customer, tenant, bucket, or model scope is ambiguous.
- Any action may contact a real customer, charge money, send a provider message, expose customer-visible data, or mutate official business state without exact approval.
- Any task would require DB, migration, seed, smoke, endpoint probe, deploy, restart, rollback, `finalAppointmentId` mutation, or Completion Report / FSR behavior.

## Recommended Next Step

Proceed to Task2013 as a no-secret-values checklist. Do not execute any provider, billing, AI, or storage action from this matrix.
