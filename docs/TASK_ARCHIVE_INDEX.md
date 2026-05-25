# Task Archive Index / 舊 Task 文件索引

Status: documentation index / no runtime change.

This file organizes historical `docs/task-*.md` notes so future Codex / PM work can find the right branch without scanning hundreds of files.

No task files were moved or renamed during this indexing pass. Existing links remain valid.

## Current Source-of-truth Layers

| Layer | File |
| --- | --- |
| Documentation home | [docs/README.md](./README.md) |
| Short project instruction | [PROJECT_SHORT_INSTRUCTION.md](./PROJECT_SHORT_INSTRUCTION.md) |
| Full guardrails | [PROJECT_GUARDRAILS.md](./PROJECT_GUARDRAILS.md) |
| Module design index | [design/README.md](./design/README.md) |
| Full task file catalog | [TASK_FILE_CATALOG.md](./TASK_FILE_CATALOG.md) |

## How To Use This Archive

- Use `PROJECT_SHORT_INSTRUCTION.md` for compact hard boundaries.
- Use `PROJECT_GUARDRAILS.md` for non-negotiable project rules.
- Use `docs/design/*.md` for current module-level design source of truth.
- Use old `task-*.md` files as historical decision logs and evidence trails.
- Do not treat a historical task note as approval to run DB, DDL, provider sending, AI/RAG runtime, LINE push, SMS, or destructive cleanup.
- If a historical task conflicts with current guardrails or design docs, current guardrails win and the conflict should be reported.

## Current Design Docs Cross-links

Use this table to jump from historical branches to current module design docs.

| Historical Area | Current Design Docs |
| --- | --- |
| Engineer mobile / field UX / workbench | [engineer-mobile-workbench.md](./design/engineer-mobile-workbench.md) |
| Customer-facing completion / customer access | [customer-facing-completion-flow.md](./design/customer-facing-completion-flow.md), [data-access-control.md](./design/data-access-control.md) |
| First contact / dispatch intake / appointment confirmation | [case-first-contact-dispatch-intake.md](./design/case-first-contact-dispatch-intake.md), [dispatch-appointment-confirmation.md](./design/dispatch-appointment-confirmation.md) |
| Repair intake / customer matching / open repair intake | [repair-intake-customer-matching.md](./design/repair-intake-customer-matching.md), [open-repair-intake.md](./design/open-repair-intake.md) |
| AI assistance / customer AI / permission-aware RAG | [ai-assistance-layer.md](./design/ai-assistance-layer.md), [customer-ai-scope.md](./design/customer-ai-scope.md), [closed-domain-ai-permission-rag.md](./design/closed-domain-ai-permission-rag.md), [cloud-ai-data-protection.md](./design/cloud-ai-data-protection.md) |
| SaaS / entitlement / usage / billing | [saas-trial-usage-billing.md](./design/saas-trial-usage-billing.md), [billing-settlement-rule-governance.md](./design/billing-settlement-rule-governance.md) |
| Data access / permissions / brand-provider access | [data-access-control.md](./design/data-access-control.md), [brand-service-provider-subcontractor-access.md](./design/brand-service-provider-subcontractor-access.md) |
| Parts / inventory / operations risk | [parts-inventory-wms.md](./design/parts-inventory-wms.md), [future-operations-risk-control.md](./design/future-operations-risk-control.md) |
| Product simplicity / role-based UX | [product-simplicity-role-ux.md](./design/product-simplicity-role-ux.md) |
| Depot / workshop repair | [depot-workshop-repair.md](./design/depot-workshop-repair.md) |

## Branch Map

| Branch | Task Range | Files | Key Handoff / Gate / Latest Notes |
| --- | ---: | ---: | --- |
| Foundation schema / architecture | 002 - 006 | 5 | [task-006-api-endpoint-design.md](./task-006-api-endpoint-design.md) |
| Precheck, security, local/Zeabur smoke | 024 - 029 | 8 | [task-029-admin-auth-menu-verification.md](./task-029-admin-auth-menu-verification.md) |
| Admin frontend foundation | 030 - 055 | 26 | [task-055-audit-log-page-case-deep-links-foundation.md](./task-055-audit-log-page-case-deep-links-foundation.md) |
| Multi-dispatch admin/browser | 056 - 072 | 17 | [task-059-auto-select-final-appointment-for-service-report-completion.md](./task-059-auto-select-final-appointment-for-service-report-completion.md) |
| Smoke fixture inventory / shared runtime policy | 073 - 095 | 23 | [task-088-smoke-fixture-inventory-index-performance-review-planning.md](./task-088-smoke-fixture-inventory-index-performance-review-planning.md) |
| Case / Appointment / Field Service Report consistency and finalAppointmentId | 104 - 105 | 2 | [task-105-backend-owned-final-appointment-inference-api-contract.md](./task-105-backend-owned-final-appointment-inference-api-contract.md) |
| Survey first-transition and Migration 020 pause | 110 - 151 | 42 | [task-148-migration-020-survey-runtime-pause-acknowledgement-next-branch-selection-no-runtime-change.md](./task-148-migration-020-survey-runtime-pause-acknowledgement-next-branch-selection-no-runtime-change.md)<br>[task-149-survey-runtime-handoff-qa-review-no-runtime-change.md](./task-149-survey-runtime-handoff-qa-review-no-runtime-change.md)<br>[task-150-migration-020-survey-runtime-final-pause-summary-no-runtime-change.md](./task-150-migration-020-survey-runtime-final-pause-summary-no-runtime-change.md) |
| Migration README / first-transition hardening | 152 - 157 | 6 | [task-157-first-transition-hardening-closure-product-mainline-return-recommendation.md](./task-157-first-transition-hardening-closure-product-mainline-return-recommendation.md) |
| Existing case reverse LINE binding | 158 - 166 | 9 | [task-164-reverse-line-binding-design-freeze-implementation-handoff-no-runtime-change.md](./task-164-reverse-line-binding-design-freeze-implementation-handoff-no-runtime-change.md)<br>[task-165-reverse-line-binding-handoff-qa-next-branch-selection-no-runtime-change.md](./task-165-reverse-line-binding-handoff-qa-next-branch-selection-no-runtime-change.md)<br>[task-166-reverse-line-binding-final-pause-summary-no-runtime-change.md](./task-166-reverse-line-binding-final-pause-summary-no-runtime-change.md) |
| Channel abstraction / master handoff | 167 - 172 | 6 | [task-170-channel-abstraction-handoff-qa-next-branch-selection-no-runtime-change.md](./task-170-channel-abstraction-handoff-qa-next-branch-selection-no-runtime-change.md)<br>[task-171-channel-abstraction-final-pause-summary-no-runtime-change.md](./task-171-channel-abstraction-final-pause-summary-no-runtime-change.md)<br>[task-172-system-architecture-master-handoff-index-next-product-branch-selection-no-runtime-change.md](./task-172-system-architecture-master-handoff-index-next-product-branch-selection-no-runtime-change.md) |
| SLA operations risk | 173 - 215 | 43 | [task-202-sla-operations-risk-feature-gate-localization-key-draft-no-runtime-change.md](./task-202-sla-operations-risk-feature-gate-localization-key-draft-no-runtime-change.md)<br>[task-204-sla-operations-risk-feature-gated-admin-empty-state-surface-inventory-no-runtime-change.md](./task-204-sla-operations-risk-feature-gated-admin-empty-state-surface-inventory-no-runtime-change.md)<br>[task-215-sla-operations-risk-docs-index-and-branch-pause-summary-no-runtime-change.md](./task-215-sla-operations-risk-docs-index-and-branch-pause-summary-no-runtime-change.md) |
| Survey runtime readiness | 216 - 227 | 12 | [task-223-survey-permission-and-entitlement-readiness-matrix-no-runtime-change.md](./task-223-survey-permission-and-entitlement-readiness-matrix-no-runtime-change.md)<br>[task-226-survey-runtime-readiness-gate-review-no-runtime-change.md](./task-226-survey-runtime-readiness-gate-review-no-runtime-change.md)<br>[task-227-survey-docs-index-and-branch-pause-summary-no-runtime-change.md](./task-227-survey-docs-index-and-branch-pause-summary-no-runtime-change.md) |
| Generic customer channel identities | 228 - 233 | 6 | [task-233-generic-customer-channel-identities-branch-pause-summary-no-runtime-change.md](./task-233-generic-customer-channel-identities-branch-pause-summary-no-runtime-change.md) |
| Notification delivery readiness | 234 - 246 | 13 | [task-237-notification-provider-sending-readiness-checklist-no-runtime-change.md](./task-237-notification-provider-sending-readiness-checklist-no-runtime-change.md)<br>[task-245-notification-runtime-readiness-gate-no-runtime-change.md](./task-245-notification-runtime-readiness-gate-no-runtime-change.md)<br>[task-246-notification-docs-index-and-branch-pause-summary-no-runtime-change.md](./task-246-notification-docs-index-and-branch-pause-summary-no-runtime-change.md) |
| AI agent / permission-aware RAG | 247 - 258 | 12 | [task-247-ai-agent-permission-aware-rag-readiness-planning-no-runtime-change.md](./task-247-ai-agent-permission-aware-rag-readiness-planning-no-runtime-change.md)<br>[task-257-ai-runtime-readiness-gate-review-no-runtime-change.md](./task-257-ai-runtime-readiness-gate-review-no-runtime-change.md)<br>[task-258-ai-docs-index-and-branch-pause-summary-no-runtime-change.md](./task-258-ai-docs-index-and-branch-pause-summary-no-runtime-change.md) |
| Billing / settlement itemization | 259 - 265 | 7 | [task-265-billing-settlement-branch-readiness-gate-review-no-runtime-change.md](./task-265-billing-settlement-branch-readiness-gate-review-no-runtime-change.md) |
| Operations quality | 266 - 273 | 8 | [task-273-operations-quality-branch-readiness-gate-review-no-runtime-change.md](./task-273-operations-quality-branch-readiness-gate-review-no-runtime-change.md) |
| Data access control | 274 - 281 | 8 | [task-281-data-access-control-branch-readiness-gate-review-no-runtime-change.md](./task-281-data-access-control-branch-readiness-gate-review-no-runtime-change.md) |
| SaaS plan / entitlement / usage | 282 - 288 | 7 | [task-288-saas-plan-entitlement-usage-branch-readiness-gate-review-no-runtime-change.md](./task-288-saas-plan-entitlement-usage-branch-readiness-gate-review-no-runtime-change.md) |
| Engineer mobile field UX design | 289 - 296 | 8 | [task-296-engineer-mobile-field-ux-branch-readiness-gate-review-no-runtime-change.md](./task-296-engineer-mobile-field-ux-branch-readiness-gate-review-no-runtime-change.md) |
| Customer channel identity / notification boundary | 297 - 302 | 6 | [task-302-customer-channel-identity-notification-branch-readiness-gate-review-no-runtime-change.md](./task-302-customer-channel-identity-notification-branch-readiness-gate-review-no-runtime-change.md) |
| Audit log / evidence traceability | 303 - 310 | 8 | [task-309-audit-log-evidence-traceability-branch-readiness-gate-review-no-runtime-change.md](./task-309-audit-log-evidence-traceability-branch-readiness-gate-review-no-runtime-change.md)<br>[task-310-cross-branch-runtime-readiness-master-gate-review-no-runtime-change.md](./task-310-cross-branch-runtime-readiness-master-gate-review-no-runtime-change.md) |
| Product MVP readiness | 311 - 318 | 8 | [task-316-customer-visible-service-result-summary-readiness-detail-no-runtime-change.md](./task-316-customer-visible-service-result-summary-readiness-detail-no-runtime-change.md)<br>[task-317-customer-fee-consent-implementation-readiness-detail-no-runtime-change.md](./task-317-customer-fee-consent-implementation-readiness-detail-no-runtime-change.md)<br>[task-318-mvp-readiness-detail-branch-closure-review-no-runtime-change.md](./task-318-mvp-readiness-detail-branch-closure-review-no-runtime-change.md) |
| Case-created first contact / dispatch intake | 319 - 323 | 5 | [task-323-case-created-first-contact-dispatch-intake-branch-readiness-gate-review-no-runtime-change.md](./task-323-case-created-first-contact-dispatch-intake-branch-readiness-gate-review-no-runtime-change.md) |
| Customer-facing completion flow | 324 - 327 | 4 | [task-327-customer-facing-completion-flow-branch-readiness-gate-review-no-runtime-change.md](./task-327-customer-facing-completion-flow-branch-readiness-gate-review-no-runtime-change.md) |
| Repair intake / case creation | 328 - 331 | 4 | [task-331-repair-intake-case-creation-branch-readiness-gate-review-no-runtime-change.md](./task-331-repair-intake-case-creation-branch-readiness-gate-review-no-runtime-change.md) |
| Customer-facing runtime readiness | 344 - 454 | 96 | [task-452-customer-facing-runtime-implementation-sequencing-closure-no-runtime-change.md](./task-452-customer-facing-runtime-implementation-sequencing-closure-no-runtime-change.md)<br>[task-453-pm-continuation-handoff-summary-after-customer-facing-runtime-readiness-sequencing-closure-no-runtime-change.md](./task-453-pm-continuation-handoff-summary-after-customer-facing-runtime-readiness-sequencing-closure-no-runtime-change.md)<br>[task-454-customer-facing-runtime-branch-pause-acceptance-record-no-runtime-change.md](./task-454-customer-facing-runtime-branch-pause-acceptance-record-no-runtime-change.md) |
| Engineer mobile workbench skeleton / static baselines | 455 - 544 | 81 | [task-540-pm-continuation-handoff-after-appointment-state-static-eligibility-test-baseline-no-runtime-change.md](./task-540-pm-continuation-handoff-after-appointment-state-static-eligibility-test-baseline-no-runtime-change.md)<br>[task-542-pm-continuation-handoff-after-safe-deny-static-test-baseline-no-runtime-change.md](./task-542-pm-continuation-handoff-after-safe-deny-static-test-baseline-no-runtime-change.md)<br>[task-544-pm-continuation-handoff-after-completion-submission-idempotency-static-test-baseline-no-runtime-change.md](./task-544-pm-continuation-handoff-after-completion-submission-idempotency-static-test-baseline-no-runtime-change.md) |
| Customer-facing access design and readiness | 545 - 600 | 44 | [task-597-customer-access-resolver-runtime-skeleton-branch-pm-handoff-no-runtime-change.md](./task-597-customer-access-resolver-runtime-skeleton-branch-pm-handoff-no-runtime-change.md)<br>[task-598-customer-access-resolver-runtime-skeleton-final-scope-lock-no-runtime-change.md](./task-598-customer-access-resolver-runtime-skeleton-final-scope-lock-no-runtime-change.md)<br>[task-600-pm-continuation-handoff-after-customer-access-resolver-runtime-skeleton-readiness-no-runtime-change.md](./task-600-pm-continuation-handoff-after-customer-access-resolver-runtime-skeleton-readiness-no-runtime-change.md) |
| Customer access runtime skeleton | 601 - 634 | 34 | [task-614-customer-access-app-route-mount-readiness-static-test-no-runtime-mount-no-db.md](./task-614-customer-access-app-route-mount-readiness-static-test-no-runtime-mount-no-db.md)<br>[task-615-mount-customer-access-route-in-route-index-no-db-no-repository-no-provider.md](./task-615-mount-customer-access-route-in-route-index-no-db-no-repository-no-provider.md)<br>[task-631-route-index-factory-options-for-customer-access-no-shared-db-no-migration.md](./task-631-route-index-factory-options-for-customer-access-no-shared-db-no-migration.md) |

## Important Current Pause / Safety Notes

- Migration 020 exists as a file artifact in the broader project history, but task notes repeatedly preserve no-apply / no-shared-apply boundaries unless a future task gives exact DB authorization.
- Survey runtime, notification sending, AI/RAG runtime, customer-facing runtime, engineer mobile workbench runtime, and customer access runtime all have staged readiness notes, but historical planning does not equal blanket runtime approval.
- Inventory docs / operator handoff remain frozen unless a future task explicitly changes the policy.
- Customer-visible and AI-visible data must follow Data Access Control, masking, organization scope, and audit requirements.

## Maintenance Rules

- Prefer adding new current design into `docs/design/*.md` instead of expanding old task notes.
- If a branch is revived, create a new task note that references the old range and states exact allowed files.
- Keep this index updated when a major branch is paused, resumed, or closed.
- Avoid moving old task files unless a dedicated archive migration task explicitly approves path changes and link updates.
