# Brand Official LINE / Brand Channel Integration Future Design

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

This document defines product, identity, channel, AI, entitlement, audit, and future runtime boundaries for brand official LINE and brand channel integration. It does not authorize webhook, provider adapter, LINE signature verification, RAG, Brand AI, entitlement runtime, report runtime, or customer-service routing implementation.

## Core Position

Brand official LINE is a customer entry channel, not case identity.

The platform may receive traffic from brand official LINE, brand website, SMS, QR code, official app, dealer portal, or other brand entry points. Those channels may route users into platform repair intake or customer access flows, but customer-facing case data must not be disclosed until identity verification and Case Binding succeed.

## Capability Split

### Basic Platform Capability

Basic platform capability may include:

- brand source recognition
- `brand_id`
- `source_channel`
- `referral_source`
- brand repair intake link or platform repair intake link
- entry link / context where applicable
- customer phone verification
- case number plus partial phone verification when appropriate
- Case Binding
- Customer Access basic inquiry after verification
- contact history
- audit log

These capabilities support routing and verification without requiring deep brand official LINE webhook integration.

### Advanced / Enterprise Add-on

Advanced or Enterprise add-on capability may include:

- brand official LINE webhook integration
- LINE signature verification and channel-level provider adapter
- brand LINE rich menu, repair button, and case inquiry entry
- brand official LINE issue triage
- brand knowledge base / Brand Knowledge RAG
- Brand Knowledge AI
- multiple LINE channels
- brand-specific customer-facing templates
- brand-specific reports and referral analysis
- brand-specific customer-service handoff / escalation
- brand channel-level usage tracking
- stronger provider governance, permission, audit, AI/RAG safety, and data controls

These capabilities have higher cost and higher security risk. They must not be included in Basic by default.

## Suggested Plan Layering

### Basic / Starter

Basic may include:

- brand source recognition
- `brand_id`, `source_channel`, `referral_source`
- platform or brand-specific repair intake links
- customer phone verification
- Case Binding
- Customer Access basic inquiry
- contact history and audit log

Basic should not include brand official LINE webhook, brand RAG, Brand Knowledge AI, multiple brand LINE channels, or deep customer-service routing.

### Professional

Professional may include:

- multi-brand settings
- brand-specific repair entry
- brand-specific customer-facing message template
- brand case source statistics
- brand category reporting
- brand service quality reporting
- brand settlement categorization

Professional may support richer brand customer-facing templates, but full brand official LINE webhook and Brand AI should remain add-on unless explicitly packaged otherwise.

### Enterprise / Add-on

Enterprise or add-on packages may include:

- Brand Official LINE Integration Add-on
- Brand Knowledge AI / RAG Add-on
- multiple LINE channel support
- brand-specific templates and reports
- deep customer-service routing
- brand-specific escalation / complaint handoff
- channel-level usage tracking
- Enterprise permission, audit, provider, and AI governance controls

## Brand Official LINE Triage

When a customer enters from brand official LINE, the system should classify the request before deciding which flow applies:

1. Brand product / official information question.
2. New repair / installation request.
3. Existing case inquiry / reschedule / missing data / completion issue.
4. Complaint / dispute / high-risk issue.

Brand product questions may use brand-authorized knowledge base and Brand Knowledge AI. New repair or installation requests may route to Repair Intake. Existing case inquiries must route through verification and Case Binding before any customer-visible case data is shown. Complaints, disputes, and high-risk issues should create escalation / complaint record and route to human handling. AI must not determine liability, promise compensation, approve quote / settlement, or close complaint in these flows.

## Identity and Case Binding Boundary

The platform must treat brand official LINE identity as channel identity only.

Rules:

- `line_user_id` is not global identity.
- LINE identity must be scoped by `organization_id + line_channel_id + line_user_id`.
- `customer_channel_identity` or equivalent customer binding must not be created from LINE id alone.
- Brand official LINE entry does not prove the user owns a Case.
- Unverified customers cannot query case data.
- Unverified customers cannot query case progress, appointments, missing information requests, customer-facing completion report, issue / dispute status, or any other customer-visible case data.
- Customer-visible case data requires verification and Case Binding.
- Verification may use phone verification, token, case number plus partial phone verification, or existing trusted LINE / App identity.
- Do not push full case details to uncertain channel identity.
- All verification, binding, referral, contact, failure, and exception events should be auditable.
- Cross-organization and cross-tenant case access is forbidden even when a LINE id or phone number appears similar across channels.

## Multiple Official LINE Channels per Brand

A brand or organization may operate multiple official LINE channels. The platform must not assume a single `brand_id` maps to a single `line_channel_id`.

Each future brand LINE channel concept should be able to carry:

- `organization_id`
- `brand_id`
- `line_channel_id`
- channel name
- channel purpose
- status
- owner department
- allowed flow
- default language
- message template
- `knowledge_base_id`
- AI / RAG enablement
- usage tracking
- channel audit log

The LINE channel is an entry channel, not brand identity and not customer identity. `line_user_id` must remain scoped by `organization_id + line_channel_id + line_user_id`. The platform must not silently merge customer identity across LINE channels, providers, brands, or organizations. If a future workflow needs to merge customer identity across channels, it must require verification, permission, conflict handling, and audit log.

### Channel Purposes and Allowed Flow

Future channel purposes may include:

- `customer_service`: brand FAQ, repair routing, verification entry, and human handoff.
- `repair_intake`: repair / installation intake, verification, Case Binding, and customer-facing case access after verification.
- `service_status`: appointment confirmation, reschedule, missing information, completion report access, and issue reporting after verification.
- `sales_membership`: product or membership routing; it may guide users to repair intake but must not directly query case data.
- `regional_service`: region-specific repair intake or service information within organization / brand scope.
- `dealer_channel`: dealer or partner entry with limited referral / intake flow.
- `campaign`: campaign or event routing only; it must not create formal Case records or query case data without an explicit future approved workflow.

Each channel may execute only its allowed flow. Being under the same brand does not grant access to every brand case workflow. Campaign, sales, membership, and dealer channels must not become implicit case-query or customer-access channels.

### Channel-level Knowledge, Template, Usage, and Audit

Brand Knowledge AI / RAG should be channel-level when used from brand official LINE. A channel may bind to a specific `knowledge_base_id`, language, product line, template set, AI enablement flag, and allowed scope. Brand Knowledge AI may use only the knowledge base and scope authorized for that channel; it must not read customer case data, another channel's knowledge base, internal service notes, or cross-organization data.

Channel-specific templates and message flows should follow the channel purpose. A service-status channel may use appointment or completion templates after verification; a campaign channel may use referral templates only. Channel-level usage tracking and audit should attribute provider events, template sends, AI / RAG requests, verification attempts, customer access, and escalation to the correct organization, brand, channel, and provider.

### Customer Case Data Boundary Across Channels

No brand LINE channel can provide customer-facing case data until identity verification and Case Binding have succeeded. This applies to case progress, appointment status, reschedule, missing information, customer-facing completion report, issue reporting, dispute status, and other customer-visible case data.

Verification and Case Binding must be repeated or revalidated when channel context is uncertain, cross-channel identity is ambiguous, provider scope changes, or customer identity conflicts are detected.

## Data Visibility Boundary

Brand official LINE must not expose the following to unverified users or unauthorized brand-side users:

- internal notes
- raw audit log content
- AI raw payload
- internal dispatch reason
- billing / settlement internal data
- engineer internal comments
- supervisor review
- unconfirmed appointment suggestions
- unconfirmed quote / settlement information
- `finalAppointmentId`
- full PII, including full phone values, full addresses, full customer names, signatures, or unmasked photos
- provider secrets
- raw LINE user ids
- cross-customer data
- cross-organization data

Customer-facing case data must follow customer visible data policy and data minimization.

## AI Layering

### Brand Knowledge AI

Brand Knowledge AI may answer:

- brand product information
- warranty and official process
- FAQ
- low-risk official troubleshooting
- repair preparation guidance
- official service channel information

Its sources must be brand-authorized knowledge base / approved RAG source. It must not freely guess brand policy, pricing, warranty, authorized service relationships, compensation, or liability.

Brand Knowledge AI must not read customer case data, case progress, appointment data, customer-facing reports, internal notes, billing / settlement internals, or customer identity binding records.

### Customer Case AI

Customer Case AI may answer only verified customer's own customer-visible case data, such as:

- case status
- confirmed appointment
- missing information request
- customer-facing completion report
- issue reporting
- satisfaction survey status

Customer Case AI must not read or output internal notes, internal billing/settlement data, AI raw payload, supervisor review, unconfirmed suggestions, or cross-customer data.

### Internal Service AI

Internal Service AI may support customer service, dispatch, supervisor, finance, or admin workflows according to role permission and organization scope. It may summarize, suggest, classify, or flag risk, but it must not approve quote, settlement, compensation, liability, formal case status, or complaint closure.

Internal Service AI outputs must not expose internal data to customers, unverified brand official LINE users, or roles outside their organization / case relationship / field-level visibility scope.

## Audit and Contact History

The following should be traceable in future runtime:

- brand entry source
- `brand_id`
- `source_channel`
- `referral_source`
- verification attempt
- verification success / failure
- Case Binding success / failure
- LINE / App / SMS / Web contact attempt
- customer access after verification
- brand AI answer source summary
- escalation / handoff
- complaint routing
- permission denied
- cross-scope denied

Audit log and contact history must remain organization-scoped and tenant-isolated. They must not contain tokens, secrets, LINE access tokens, LINE channel secrets, full phone values, full addresses, raw LINE user ids, raw provider payloads, AI raw sensitive payloads, or full customer payloads.

Brand referral / routing records do not by themselves verify identity or grant case-data access. Future runtime tasks must explicitly mark API, DB / migration, permission, audit, provider, LINE, and AI/RAG scope before implementation.

## Future Runtime Tasks

- brand source tracking / referral source runtime slice
- brand repair intake link generation
- customer verification and Case Binding for brand entry
- brand channel identity scope guard
- brand official LINE webhook adapter add-on
- LINE signature verification and provider adapter governance
- Brand Knowledge AI / RAG add-on
- brand channel model and multi-LINE-channel configuration
- channel purpose / allowed flow guard
- customer channel identity multi-LINE-channel scope guard
- channel-specific message templates
- channel-specific Brand Knowledge AI / RAG binding
- channel-level usage tracking and cost attribution
- channel-level audit log
- brand-specific customer-facing message template
- brand referral report and usage tracking
- Enterprise plan entitlement guard
- brand issue triage and escalation workflow
- audit log and smoke coverage

Task735 starts the future runtime baseline with a pure deterministic referral source policy helper only. It normalizes safe referral metadata and does not implement webhook, identity verification, Case Binding, contact / audit persistence, entitlement, provider, or AI/RAG runtime.

Task736 adds a pure deterministic brand channel triage policy baseline only. It classifies safe intent hints into brand product question, repair intake, existing case inquiry, complaint / dispute, high-risk, or unknown routes, but does not implement AI/RAG classification, webhook, verification, Case Binding, complaint workflow, audit persistence, provider routing, or case-data access runtime.

Task737 adds a pure integration guard for the Task735 referral policy and Task736 triage policy. Referral metadata may inform routing, but it never grants identity, Case Binding, case-data access, AI final decisions, or provider/audit/runtime side effects.

Task735-738 close the Brand Channel Basic pure-policy branch. The branch contains only deterministic source recognition, deterministic triage, and pure composition guards; it does not implement API, DB, migration, provider, webhook, verification, Case Binding, audit persistence, entitlement, Brand AI/RAG, reports, templates, or customer access runtime.

Task739 adds the multiple official LINE channels per brand design baseline. The accepted design is that one brand or organization may operate multiple LINE channels, each with its own purpose, allowed flow, template, knowledge base, AI / RAG enablement, usage tracking, and audit boundary. It remains docs-only and does not implement brand channel tables, provider adapters, webhook routing, identity binding runtime, entitlement runtime, Brand AI/RAG, usage metering, reports, or channel audit writer.

Task741 adds a pure deterministic multi-LINE-channel config and allowed-flow policy helper. It can normalize safe channel metadata and decide whether a requested flow is allowed, denied, or requires verification / Case Binding, but it does not implement API, DB, migration, webhook, provider, identity binding, Case Binding, audit persistence, entitlement, Brand AI/RAG runtime, usage metering, reports, or admin UI.

Task742 adds a pure integration guard proving referral metadata, brand channel triage, and multi-LINE-channel allowed-flow policy compose safely. Multi-channel configuration may influence routing, but it never grants identity, Case Binding, customer access, direct case-data access, webhook, provider, entitlement, audit, usage, or AI/RAG runtime.

Task739-743 close the Multi Official LINE Channels per Brand docs/pure-policy branch. The accepted boundary covers multiple official LINE channels per brand, channel purpose / allowed flow, scoped `line_user_id`, channel-level Brand Knowledge AI / RAG boundary, and customer-facing case data access through verification plus Case Binding. This branch does not implement API, DB, migration, provider, webhook, LINE signature verification, identity binding, Case Binding, entitlement, audit writer, usage tracking, reports, admin UI, or AI/RAG runtime.

Task744 starts the Basic brand referral intake request-normalizer baseline with a pure deterministic helper only. It sanitizes request-like input into safe referral metadata and explicit no-runtime grants, but it does not implement API, webhook, identity verification, Case Binding, repair intake creation, contact / audit persistence, entitlement, provider, usage tracking, reports, admin UI, or AI/RAG runtime.

Task745 adds a pure integration guard proving the Task744 request normalizer composes safely with Task735 referral source policy, Task736 triage policy, and Task741 multi-LINE-channel allowed-flow policy. Request-like input may influence safe routing metadata, but it still never grants identity, Case Binding, intake creation, audit writing, customer access, direct case-data access, webhook, provider, entitlement, or AI/RAG runtime.

Task735-746 close the Basic Brand Referral pure-policy branch. The accepted boundary covers source recognition, triage, multi-channel allowed-flow policy, request normalizer, integration guards, and static closure before API adoption. This branch does not implement API, DB, migration, provider, webhook, LINE signature verification, identity verification, Case Binding, repair intake creation, audit writer, contact log, entitlement, usage tracking, reports, admin UI, or AI/RAG runtime.

Task747 is the runtime adoption readiness packet for this branch. It preserves the no-runtime pause point and requires explicit approval gates before any future API, DB / migration, permission, audit / contact log, repair intake, verification, Case Binding, provider / LINE / webhook, AI/RAG, entitlement, admin UI, package, or smoke adoption slice.

Task748-749 close the Basic Brand Referral API normalization-only slice. The accepted runtime boundary is a synthetic app/API adapter that returns a safe normalized referral envelope only; it does not mount a route and does not implement DB, Case creation, repair intake draft creation, identity verification, Case Binding, audit / contact persistence, provider, webhook, entitlement, usage tracking, reports, admin UI, or AI/RAG runtime.

Task748-751 close the Basic Brand Referral guarded API normalization slice. The accepted boundary is a synthetic app/API adapter with an injected access guard that must allow the request before normalized referral output is trusted. It remains a normalization-only envelope and does not mount a public route. It does not implement DB, Case creation, repair intake draft creation, identity verification, Case Binding, audit / contact persistence, provider, webhook, entitlement service, usage tracking, reports, admin UI, or AI/RAG runtime.

Task752-753 close the Basic Brand Referral route-adapter slice. The accepted boundary is a synthetic route-style adapter that composes the guarded normalization path. It remains guard-first and normalization-only, and it does not mount a public or global route. It does not implement DB, Case creation, repair intake draft creation, identity verification, Case Binding, audit / contact persistence, provider, webhook, entitlement service, usage tracking, reports, admin UI, or AI/RAG runtime.

Task754 records the public route mount readiness gate: future public route mount requires explicit API, permission, entitlement, audit, DB / migration, provider / LINE / webhook, AI/RAG, smoke, admin, and package approval. Task755 then mounts a narrow guarded-normalization-only route at `POST /api/v1/public/brand-referral/normalize` under the existing public router. Task756 closes that slice with a static guard: the route is mounted once, fails closed without injected access guard context, returns only the no-runtime referral normalization envelope, and still does not implement DB, Case creation, repair intake, identity verification, Case Binding, audit / contact writing, provider / LINE / webhook, entitlement service, admin, package, smoke, or AI/RAG runtime.

Task757 adds a pure Brand Referral audit/contact intent builder. It creates safe, redacted intent metadata for future audit/contact persistence, but it does not write audit logs, write contact logs, persist DB records, create Cases, create repair intake drafts, verify identity, bind Cases, call providers, call LINE/webhook, use entitlement runtime, or call AI/RAG.

Task757-759 close the audit/contact intent side-channel branch. The accepted boundary is intent-only: route adapter callers may request an internal top-level `auditIntent`, but the public response body remains unchanged and no audit/contact writer, DB, repair intake, Case creation, identity verification, Case Binding, provider / LINE / webhook, entitlement service, admin, package, smoke, or AI/RAG runtime is implemented.

Task760 records the audit/contact persistence readiness gate. Any future persistence requires explicit DB schema, migration, repository, transaction, writer, permission, retention, redaction, smoke, rollback, and public route behavior approval before audit/contact intent may be written.

Task761 adds a schema proposal only for future `brand_referral_contact_events` audit/contact persistence. It defines safe metadata fields, organization-scoped lookup expectations, retention and redaction boundaries, and forbidden persisted values, but it creates no migration, no DB schema, no repository, no audit/contact writer, and no runtime persistence.

Task762 records the migration authorization packet for future `brand_referral_contact_events`. It defines approval gates, dry-run guards, rollback expectations, and forbidden columns, but creates no migration file, runs no DDL, uses no psql, opens no DB connection, performs no dry-run, and has no apply.

Task763 records a migration draft plan for future `brand_referral_contact_events` with DO NOT RUN pseudo-SQL, safe columns, organization-scoped indexes, and rollback outline. It creates no migration file, runs no DDL, uses no psql, opens no DB connection, performs no dry-run, and has no apply.

Task764 records the final preflight gate before any future `brand_referral_contact_events` migration file creation. A future task must explicitly name the migration filename and number before any SQL file is created; Task764 itself creates no migration file, runs no DDL, uses no psql, opens no DB connection, performs no dry-run, and has no apply.

Task765 creates the no-apply migration file `migrations/024_create_brand_referral_contact_events.sql` for future `brand_referral_contact_events` metadata only. The file is authoring-only: no DB connection, no DDL execution, no psql, no dry-run, no apply, and no repository or writer runtime are introduced.

Task766 records the disposable local/test DB dry-run authorization packet for `migrations/024_create_brand_referral_contact_events.sql`. It authorizes no DB execution, no psql, no `db:migrate`, no DDL, no dry-run, no apply, no SQL execution, and no runtime behavior; any future dry-run must separately prove a disposable local/test DB target and keep provider, LINE/SMS/App/webhook/email, AI/RAG, audit/contact writer, identity verification, Case Binding, repair intake, and Case creation runtime disabled.

Task767 adds a redacted disposable DB dry-run result template for `migrations/024_create_brand_referral_contact_events.sql`. It is a reporting template only: no DB execution, no psql, no `db:migrate`, no DDL, no dry-run, no apply, no SQL execution, and no migration modification are authorized.

Task768 records repository/writer runtime readiness for future `brand_referral_contact_events` persistence. The future design requires injected synthetic DB boundaries, safe `auditIntent` input, safe migration 024 columns only, fail-closed writer behavior, and route response stability; Task768 itself introduces no repository, no writer, no DB connection, no route wiring, and no audit/contact persistence runtime.

Task770-771 close the injected audit/contact writer path for the Brand Referral public route. The accepted boundary is optional injected writer plumbing only: the writer may receive safe `auditIntent` metadata in tests, the public response body remains unchanged, no default writer is configured, writer failures are redacted, and real DB, repository wiring, provider / LINE / webhook, identity verification, Case Binding, repair intake, entitlement, smoke, admin UI, package, and AI/RAG runtime remain out of scope.

Task769-772 close the audit/contact writer runtime-adjacent branch. The accepted branch contains an injected-only repository/writer, fake DB unit tests, optional injected route plumbing, and static closure guards. It still does not use a real DB, configure a default writer, change public response shape, run Migration 024, call providers, verify identity, bind Cases, create repair intake or Case records, add entitlement runtime, add admin UI, add smoke tests, or call AI/RAG.

Task735-773 close the current Brand Referral normalization and audit-contact checkpoint. Completed work includes docs/static design, pure referral/channel policies, request normalization, guarded public normalization route, auditIntent side-channel, Migration 024 authoring-only SQL/no-apply file, injected fake-DB writer, optional injected route writer path, and closure guards. The branch remains paused before any DB dry-run/apply, real persistence, identity verification, Case Binding, repair intake handoff, provider/webhook delivery, entitlement/billing integration, admin UI, smoke tests, or AI/RAG runtime.

Task779-780 close the public route HTTP behavior slice. The accepted boundary covers app-like handler unit coverage for `POST /api/v1/public/brand-referral/normalize`: the route fails closed without an injected guard, allow/deny/malformed cases remain safe, no `app.listen` or server start is used, no DB or provider runtime is touched, and the public response body remains closed and normalization-only.

Task781 closes the Migration 024 no-DB checkpoint across Task760-767 migration readiness artifacts, the Task769-772 injected writer branch, and the Task779-780 public route HTTP behavior coverage. Migration 024 remains authoring-only: no DB connection, no psql, no `db:migrate`, no DDL, no dry-run, no apply, and no persistence promotion. The public route remains normalization-only, and the writer remains injected-only with no default real DB configuration.

## Task727-734 Docs-static Branch Closure

Tasks 727-734 close the Brand Official LINE / Brand Channel docs-static mini-branch before runtime. The accepted boundary is:

- Basic keeps brand source recognition, referral / routing, repair intake link, verification, Case Binding, Customer Access after verification, contact history, and audit log.
- Professional / Enterprise / add-on capabilities cover brand official LINE webhook, LINE signature verification, provider adapter customization, Brand Knowledge AI/RAG, multiple LINE channels, deep customer-service routing, brand usage analytics, advanced reports, and advanced templates.
- Brand official LINE is a customer entry channel only, not case identity.
- `line_user_id` must be scoped by `organization_id + line_channel_id + line_user_id`.
- Unverified users cannot query case data; verified disclosure requires verification plus Case Binding.
- Brand product questions, repair intake, existing case inquiries, and complaint / dispute / high-risk issues are triaged separately.
- Brand Knowledge AI, Customer Case AI, and Internal Service AI remain separately bounded.
- Referral, contact, and audit trail requirements are documented and must not include raw sensitive values.
- Future runtime requires explicit API, DB / migration, permission, audit, provider, LINE, AI/RAG, and entitlement scope.

## Non-goals

This design does not implement:

- webhook runtime
- LINE provider adapter
- LINE signature verification
- Brand AI / RAG runtime
- customer verification runtime
- Case Binding runtime
- entitlement runtime
- report runtime
- customer-service routing runtime
- API, DB schema, migration, smoke test, or package changes
