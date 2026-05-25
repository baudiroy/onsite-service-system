# Task739 - Multi Official LINE Channels per Brand Design Baseline

Status: completed.

Scope: docs-only / design baseline / no runtime change.

## Goal

Document that the platform must support multiple official LINE channels under the same brand or organization. A LINE channel is an entry channel, not brand identity and not customer identity.

## Files Changed

- `docs/PROJECT_SHORT_INSTRUCTION.md`
- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/brand-official-line-channel-integration.md`
- `docs/design/saas-plan-entitlement-and-add-ons.md`
- `docs/task-739-multi-official-line-channels-per-brand-design-baseline-docs-only-no-runtime.md`

## Design Decisions

- The system must not assume one brand has only one `line_channel_id`.
- A future brand LINE channel concept should include `organization_id`, `brand_id`, `line_channel_id`, channel name, channel purpose, status, owner department, allowed flow, default language, message template, `knowledge_base_id`, AI / RAG enablement, usage tracking, and channel audit log.
- `line_user_id` remains scoped by `organization_id + line_channel_id + line_user_id`.
- Customer identity must not be silently merged across channels, providers, brands, or organizations.
- Cross-channel customer identity merge requires verification, permission, conflict handling, and audit log.
- Channel purposes include `customer_service`, `repair_intake`, `service_status`, `sales_membership`, `regional_service`, `dealer_channel`, and `campaign`.
- Campaign, sales, membership, and dealer channels must not become implicit case-query or customer-access channels.
- Brand Knowledge AI / RAG is channel-level and may use only the channel-authorized `knowledge_base_id` and allowed scope.
- Customer-facing case data still requires identity verification and Case Binding regardless of entry channel.
- Basic keeps referral, verification, Case Binding, and basic customer access only.
- Multi-LINE-channel management, webhook routing, channel-specific templates, channel-specific Brand Knowledge AI / RAG, channel-level usage tracking, channel audit, reports, and deep routing are Professional / Enterprise / add-on capabilities, not Basic defaults.

## Non-runtime Decision

No runtime adoption was performed.

This task did not implement brand channel tables, migrations, LINE webhook adapters, signature verification, provider routing, customer identity binding, Case Binding, channel templates, Brand AI / RAG, entitlement checks, usage metering, reports, channel audit writer, API, admin UI, smoke tests, or package changes.

## Future Runtime Tasks

- brand channel data model / migration design
- channel purpose / allowed flow runtime guard
- customer channel identity multi-LINE-channel scope guard
- brand channel source tracking
- channel-specific message templates
- channel-specific Brand Knowledge AI / RAG binding
- channel-level usage tracking and cost attribution
- channel-level audit log
- Enterprise / add-on entitlement guard
- permission and smoke coverage

## Verification

Planned verification:

- `grep -Ei "multiple LINE|multi.*LINE|line_channel_id|organization_id|line_user_id|channel purpose|allowed flow|knowledge_base_id|usage tracking|channel audit" docs/design/brand-official-line-channel-integration.md`
- `grep -Ei "Basic|Professional|Enterprise|Add-on|multiple LINE|multi.*LINE|channel-level|Brand Knowledge AI|RAG|entitlement" docs/design/saas-plan-entitlement-and-add-ons.md`
- `git diff --check -- docs/PROJECT_SHORT_INSTRUCTION.md docs/PROJECT_GUARDRAILS.md docs/design/brand-official-line-channel-integration.md docs/design/saas-plan-entitlement-and-add-ons.md docs/task-739-multi-official-line-channels-per-brand-design-baseline-docs-only-no-runtime.md`
