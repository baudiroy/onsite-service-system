# Design Docs Index / 模組設計文件索引

This folder contains module-level design documents for future workflows and platform capabilities. These documents expand the principles in `docs/PROJECT_GUARDRAILS.md` and should be used when a task needs detailed flow, state, field direction, examples, or future implementation boundaries.

Design docs are not runtime approval. A design document may describe future data models, APIs, workers, AI/RAG, permissions, audit logs, notifications, or migrations, but no runtime work should begin unless a later task explicitly authorizes the exact scope.

## Layers

- `docs/PROJECT_SHORT_INSTRUCTION.md`: compact hard-boundary instruction under 8000 characters.
- `docs/PROJECT_GUARDRAILS.md`: full project source of truth.
- `docs/design/*.md`: module-specific future design and implementation planning.

## Current Module Docs

| File | Scope |
| --- | --- |
| [engineer-mobile-workbench.md](./engineer-mobile-workbench.md) | Engineer mobile web / PWA workbench, field workflow, photos, signature, completion submission boundary. |
| [customer-ai-scope.md](./customer-ai-scope.md) | Customer AI allowed scope, customer-visible data boundary, low-risk troubleshooting, escalation rules. |
| [depot-workshop-repair.md](./depot-workshop-repair.md) | Depot / workshop repair workflow as a second service workflow beside on-site service. |
| [brand-service-provider-subcontractor-access.md](./brand-service-provider-subcontractor-access.md) | Multi-party access model for brands, service providers, subcontractors, engineers, and customers. |
| [repair-intake-customer-matching.md](./repair-intake-customer-matching.md) | Multi-source Repair Intake, reporter/customer boundary, phone-based matching, SMS/LINE routing. |
| [saas-trial-usage-billing.md](./saas-trial-usage-billing.md) | SaaS plan, trial, seat, usage, add-on, Enterprise contract, and cost-control design. |
| [saas-plan-entitlement-and-add-ons.md](./saas-plan-entitlement-and-add-ons.md) | SaaS plan entitlement, add-on packaging, brand official LINE, Brand AI, multi-channel cost boundaries. |
| [brand-official-line-channel-integration.md](./brand-official-line-channel-integration.md) | Brand official LINE / brand channel integration, Case Binding, triage, Brand Knowledge AI, add-on boundaries. |
| [ai-assistance-layer.md](./ai-assistance-layer.md) | Embedded AI assistance surfaces, human-in-the-loop, official record separation, AI governance. |
| [open-repair-intake.md](./open-repair-intake.md) | Public repair lookup, service provider directory, assisted referral, service request vs Case boundary. |
| [data-access-control.md](./data-access-control.md) | Unified data permission model for reports, export, AI retrieval, RAG, customer self-service, scheduled reports. |
| [data-correction-amendment-governance.md](./data-correction-amendment-governance.md) | Phone re-verification, pre-departure corrections, post-departure freeze, unable-to-complete terminal states, completion amendments. |
| [product-simplicity-role-ux.md](./product-simplicity-role-ux.md) | Role-based UX, progressive disclosure, frontline simplicity, AI assist without burden. |
| [customer-facing-completion-flow.md](./customer-facing-completion-flow.md) | Customer-facing report, signature exception, issue reporting, survey, versioning, download/access tracking. |
| [case-first-contact-dispatch-intake.md](./case-first-contact-dispatch-intake.md) | SMS first contact, LINE binding, Web fallback, AI call, dispatch intake draft. |
| [dispatch-appointment-confirmation.md](./dispatch-appointment-confirmation.md) | Dispatch suggestion, proposed appointment, customer confirmation, calendar link, confirmation logs. |
| [billing-settlement-rule-governance.md](./billing-settlement-rule-governance.md) | Source files, AI rule draft, dry-run, approval, versioning, settlement result traceability. |
| [parts-inventory-wms.md](./parts-inventory-wms.md) | Parts master, vehicle stock, reservations, serial tracking, old parts return, settlement linkage. |
| [cloud-ai-data-protection.md](./cloud-ai-data-protection.md) | External AI provider data minimization, supplier risk, private/local/hybrid AI options. |
| [ai-assisted-file-import-protection.md](./ai-assisted-file-import-protection.md) | AI-assisted import without sending full raw files; parsing, masking, dry-run, human confirmation. |
| [closed-domain-ai-permission-rag.md](./closed-domain-ai-permission-rag.md) | Closed-domain AI agent, permission-aware RAG, tenant isolation, audit, feedback, usage. |
| [future-operations-risk-control.md](./future-operations-risk-control.md) | SLA, approval records, parts/quote/feedback/checklist/review/dashboard/self-service/risk-radar roadmap. |

## Related Historical Task Branches

| Design Doc | Historical Branch / Task Range |
| --- | --- |
| [engineer-mobile-workbench.md](./engineer-mobile-workbench.md) | Engineer mobile field UX, skeleton, static baselines, repository planning: tasks 289-296 and 455-544+ |
| [customer-facing-completion-flow.md](./customer-facing-completion-flow.md) | Customer-facing completion and customer access readiness: tasks 324-327 and 344-454+ |
| [case-first-contact-dispatch-intake.md](./case-first-contact-dispatch-intake.md) | Case-created first contact / dispatch intake: tasks 319-323 |
| [dispatch-appointment-confirmation.md](./dispatch-appointment-confirmation.md) | Multi-dispatch and appointment confirmation history: tasks 056-072 plus dispatch intake branches |
| [repair-intake-customer-matching.md](./repair-intake-customer-matching.md) | Repair intake / case creation and customer channel identity: tasks 328-331 and 297-302 |
| [closed-domain-ai-permission-rag.md](./closed-domain-ai-permission-rag.md) | AI agent / permission-aware RAG: tasks 247-258 |
| [data-access-control.md](./data-access-control.md) | Data access control: tasks 274-281 |
| [saas-trial-usage-billing.md](./saas-trial-usage-billing.md) | SaaS plan / entitlement / usage: tasks 282-288 |
| [billing-settlement-rule-governance.md](./billing-settlement-rule-governance.md) | Billing / settlement itemization: tasks 259-265 |
| [future-operations-risk-control.md](./future-operations-risk-control.md) | SLA operations risk and operations quality: tasks 173-215 and 266-273 |

For full historical files, use [../TASK_ARCHIVE_INDEX.md](../TASK_ARCHIVE_INDEX.md) and [../TASK_FILE_CATALOG.md](../TASK_FILE_CATALOG.md).

## Maintenance Rules

- Keep module details here instead of expanding `PROJECT_SHORT_INSTRUCTION.md`.
- Keep hard non-negotiable rules in `PROJECT_GUARDRAILS.md`.
- If a design appears in multiple places, preserve one source of truth and replace duplicates with short references.
- If a future task needs runtime work, define exact allowed files and verification commands before changing code.
- Do not place secrets, raw customer data, raw LINE user ids, provider credentials, full payloads, or production details in design docs.


## Runtime Task Readiness Gate

Before converting any design doc into runtime work, a future task should explicitly answer:

- Which exact files may be edited.
- Whether backend `src/`, admin `src/`, API, migration, smoke tests, or package scripts are in scope.
- Whether DB access, DDL, provider sending, AI/RAG runtime, file upload, notification sending, or external network calls are allowed.
- Which organization scope, permission, entitlement, audit log, sensitive data, and customer-visible data rules apply.
- Which checks and smoke tests must pass.
- What must remain non-goal for that task.
