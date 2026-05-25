# SaaS Plan Entitlement and Add-ons Future Design

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

This document complements `docs/design/saas-trial-usage-billing.md` by defining how feature entitlement and add-on packaging should treat brand official LINE, Brand Knowledge AI, multiple LINE channels, high-cost providers, and Enterprise custom capabilities.

## Separation of Concepts

The platform must keep these concepts separate:

- Plan: the organization-level commercial package, such as Basic, Professional, Business, or Enterprise.
- Subscription: the organization's commercial status, such as trial, active, past due, cancelled, or expired.
- Entitlement: whether an organization has a feature or limit.
- Permission: whether a user may perform an action.
- Seat: which type of internal user is allocated.
- Usage: measured consumption of provider, AI, storage, report, export, API, or other cost-bearing capability.
- Add-on: optional module attached to a plan or Enterprise contract.

Having an entitlement does not grant user permission. Having permission does not bypass entitlement, organization scope, Data Access Control, audit log, or safety rules.

## Default Packaging Principle

High-cost or high-risk features should not be included in Basic by default.

Examples:

- brand official LINE webhook
- multiple LINE channels
- Brand Knowledge AI
- brand knowledge / RAG
- deep customer-service routing
- advanced brand reports
- provider-specific adapters
- AI call
- Cloud AI / RAG retrieval
- large file storage
- scheduled reports
- API / Webhook access

Basic may include foundational workflow and verification capabilities. Professional and Enterprise may add richer workflows, reporting, and integration capabilities. Enterprise add-ons can carry custom limits, provider configuration, governance, and support obligations.

## Brand Official LINE Packaging

Brand official LINE integration should be packaged as an add-on or Enterprise feature unless explicitly included in a higher plan.

### Basic Capability

Basic may include:

- brand source recognition
- `brand_id`
- `source_channel`
- `referral_source`
- repair intake link
- customer verification
- Case Binding
- Customer Access after verification
- contact history
- audit log

Basic should not include brand official LINE webhook, Brand Knowledge AI/RAG, multiple LINE channels, channel purpose / allowed flow management, channel-specific templates, channel-specific knowledge bases, deep customer-service routing, provider adapter customization, brand channel usage analytics, channel-level audit management, or brand-specific reports / templates beyond basic messaging.

### Professional Capability

Professional may include:

- multi-brand settings
- brand-specific repair entry
- brand-specific customer-facing templates
- brand case source statistics
- brand category and quality reports
- brand settlement categorization

Professional may include richer brand customer-facing templates, reporting, and categorization, but full brand official LINE webhook, Brand Knowledge AI/RAG, and multiple LINE channels should remain add-on or Enterprise unless explicitly packaged otherwise.

Professional may support limited brand channel administration, such as source reporting or template selection, only when it does not include full webhook ownership, channel-specific Brand Knowledge AI/RAG, multi-channel provider routing, or channel-level usage / audit governance.

### Enterprise / Add-on Capability

Enterprise or add-on may include:

- brand official LINE webhook
- multiple LINE channels
- channel purpose / allowed flow configuration
- channel-specific templates
- channel-specific Brand Knowledge AI / RAG binding
- channel-level usage tracking
- channel-level audit
- brand LINE rich menu integration
- brand official LINE issue triage
- Brand Knowledge AI
- brand knowledge / RAG
- brand-specific reports and referral analysis
- brand channel-level usage tracking
- custom handoff / escalation
- stronger audit, permission, AI/RAG, and provider governance

Add-on features require entitlement, user permission, audit log, provider governance, and usage / cost attribution before runtime. No plan may grant unverified case-data access.

Multi official LINE channel support should be packaged as Professional-limited administration or Enterprise / add-on depth depending on scope. Any capability that manages multiple `line_channel_id` values, webhook routing, channel-specific knowledge bases, AI enablement, provider ownership, channel-level usage tracking, or channel-level audit should not be enabled for Basic by default.

## Feature Keys

Future feature keys may include:

- `brand_source_tracking`
- `brand_repair_intake_link`
- `brand_case_binding`
- `brand_customer_access`
- `brand_message_templates`
- `brand_source_reporting`
- `brand_quality_reporting`
- `brand_settlement_reporting`
- `brand_official_line_webhook`
- `multi_line_channel`
- `brand_line_channel_management`
- `brand_line_channel_allowed_flow`
- `brand_line_channel_templates`
- `brand_line_channel_knowledge_binding`
- `brand_line_channel_usage_tracking`
- `brand_line_channel_audit`
- `brand_line_rich_menu`
- `brand_issue_triage`
- `brand_knowledge_base`
- `brand_knowledge_rag`
- `brand_knowledge_ai`
- `brand_deep_customer_service_routing`
- `brand_referral_analysis`
- `brand_channel_usage_tracking`

## Usage Tracking

Brand integration may produce usage that should be attributable to organization, brand, channel, and provider when applicable:

- LINE webhook events
- LINE push messages
- channel-specific template sends
- channel-specific Brand Knowledge AI requests
- channel-specific RAG retrieval
- SMS fallback
- customer access sessions
- verification attempts
- Brand Knowledge AI requests
- RAG retrieval count
- AI token usage
- report generation
- referral analysis exports
- template sending
- customer-service handoff events

Usage tracking is not audit log. Both may be needed.

## Enterprise Contract

Enterprise contract may customize:

- number of brands
- number of LINE channels
- provider ownership model
- included LINE / SMS / AI quota
- RAG document volume
- brand template count
- custom reports
- custom data retention
- support and incident response
- SSO and advanced audit requirements

Enterprise customization must not bypass organization isolation, Data Access Control, permission, audit log, AI/RAG safety, provider secret governance, or customer-visible data rules.

Task747 keeps brand referral runtime adoption paused until explicit approval gates are granted. Brand official LINE webhook, multiple LINE channel management, channel-specific templates, Brand Knowledge AI/RAG, channel-level usage tracking, and channel audit remain Professional / Enterprise / add-on candidates and must not be enabled as Basic defaults.

Task754 keeps Brand Referral public route mount paused until explicit API and entitlement approval. Future route exposure must not bypass entitlement, permission, organization scope, audit/contact decisions, or usage tracking decisions.

## Future Runtime Tasks

- plan entitlement model for brand features
- brand add-on entitlement resolver
- brand channel usage metering
- channel-level cost attribution
- multi official LINE channel entitlement guard
- channel purpose / allowed flow entitlement guard
- channel-specific template entitlement guard
- channel-specific knowledge base / RAG entitlement guard
- feature availability guard for brand official LINE webhook
- Brand Knowledge AI entitlement and usage guard
- brand report entitlement guard
- Enterprise add-on configuration audit log
- plan / entitlement smoke coverage

## Non-goals

This design does not implement pricing runtime, billing runtime, invoice runtime, payment runtime, subscription runtime, usage metering runtime, entitlement runtime, LINE provider runtime, AI/RAG runtime, API, DB schema, migration, smoke test, or package changes.
