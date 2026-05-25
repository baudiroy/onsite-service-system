# Task 727 - Brand Official LINE / Brand Channel Integration Baseline

Status: completed

## Goal

Create a docs-only product architecture baseline for Brand Official LINE / Brand Channel Integration and add-on packaging.

## Scope

Changed files:

- `docs/PROJECT_SHORT_INSTRUCTION.md`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/README.md`
- `docs/design/brand-official-line-channel-integration.md`
- `docs/design/saas-plan-entitlement-and-add-ons.md`
- `docs/task-727-brand-official-line-channel-integration-baseline-docs-only-no-runtime.md`

## Design Summary

The baseline defines:

- Brand official LINE is a customer entry channel, not case identity.
- `line_user_id` must be scoped by `organization_id + line_channel_id + line_user_id`.
- Basic platform capability includes brand source recognition, referral/routing, repair intake, customer verification, Case Binding, contact history, and audit log.
- Advanced / Enterprise add-ons include brand official LINE webhook, brand knowledge / RAG, Brand Knowledge AI, multiple LINE channels, brand templates/reports, and deep customer-service routing.
- Brand official LINE requests should be triaged into brand product questions, new repair / installation requests, existing case inquiries, and complaints / disputes / high-risk issues.
- Brand Knowledge AI, Customer Case AI, and Internal Service AI have separate data boundaries.
- Unverified customers cannot query case data.
- Customer-visible case data requires verification and Case Binding.
- Future runtime work must be split into bounded tasks with explicit API, DB, migration, permission, audit, provider, AI/RAG, LINE/SMS, and smoke scope.

## Accepted Boundaries

- This task is docs-only.
- No runtime behavior was changed.
- No backend `src/`, admin `src/`, API, routes, controllers, services, repositories, DB schema, migration, provider runtime, LINE/SMS/App push runtime, AI/RAG runtime, smoke test, package file, or config file was changed.
- No token, secret, LINE access token, LINE channel secret, AI provider key, credential, full PII, raw payload, or provider setting was introduced.
- `PROJECT_GUARDRAILS.md` received a concise formal principle and cross-reference only.
- `PROJECT_SHORT_INSTRUCTION.md` received one short summary bullet only.

## Future Runtime Tasks

- brand source tracking / referral source runtime slice
- brand repair intake link generation
- customer verification and Case Binding for brand entry
- brand channel identity scope guard
- brand official LINE webhook adapter add-on
- LINE signature verification and provider adapter governance
- Brand Knowledge AI / RAG add-on
- brand-specific customer-facing message template
- brand referral report and usage tracking
- Enterprise plan entitlement guard
- brand issue triage and escalation workflow
- audit log and smoke coverage

## Verification

- `test -f docs/design/brand-official-line-channel-integration.md` - PASS.
- `grep -Ei "Basic|Professional|Enterprise|Add-on|brand official LINE|line_channel_id|line_user_id|organization_id|Case Binding|Brand Knowledge AI|Customer Case AI|unverified|audit|referral_source" docs/design/brand-official-line-channel-integration.md` - PASS.
- `grep -Ei "brand official LINE|Brand Knowledge AI|multi.*LINE|add-on|Enterprise|entitlement" docs/design/saas-plan-entitlement-and-add-ons.md` - PASS.
- `git diff --check -- docs/PROJECT_SHORT_INSTRUCTION.md docs/PROJECT_GUARDRAILS.md docs/design/brand-official-line-channel-integration.md docs/design/saas-plan-entitlement-and-add-ons.md docs/task-727-brand-official-line-channel-integration-baseline-docs-only-no-runtime.md` - PASS.
- `git diff --check -- docs/design/README.md` - PASS.
- `wc -m docs/PROJECT_SHORT_INSTRUCTION.md` - PASS, 3466 characters.
- Sensitive-value scan for literal credential assignments / DB URLs in touched docs - PASS.
