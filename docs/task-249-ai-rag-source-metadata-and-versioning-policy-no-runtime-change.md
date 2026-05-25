# Task 249 - AI RAG Source Metadata And Versioning Policy / No Runtime Change

## Purpose And Scope

This document defines a future policy for RAG knowledge sources, document sources, SOPs, brand rules, vendor rules, billing / settlement rules, notification policies, survey policies, repair guides, and other knowledge sources before they can be used by AI retrieval.

Task249 is documentation-only.

This task is not:

- RAG runtime implementation,
- document ingestion implementation,
- vector DB implementation,
- embedding implementation,
- retrieval service,
- source metadata schema,
- migration proposal,
- API contract,
- Admin UI,
- worker / scheduler,
- automated test implementation,
- AI auto-decision engine.

Task249 does not add source tables, document ingestion, vector indexes, embeddings, retrieval code, DB changes, API changes, Admin UI, tests, or runtime behavior.

## Core Source Governance Principles

Future RAG sources must be governed before they can enter retrieval.

Principles:

- RAG source must have organization scope.
- RAG source must have visibility metadata.
- RAG source must have permission metadata.
- RAG source must support version tracking.
- RAG source must support effective date tracking.
- RAG source must distinguish customer-visible and internal-only usage.
- RAG source should support brand / vendor / service category metadata where relevant.
- RAG source must not be retrieved across organizations.
- expired source should not be retrieved by default.
- disabled source should not be retrieved.
- deleted source should not be retrieved.
- unapproved source should not be used for production retrieval.
- AI must not generate formal recommendations from sources with missing or incomplete metadata.

Metadata quality is a prerequisite for permission-aware retrieval.

If metadata is missing, ambiguous, or inconsistent, retrieval should fail closed.

## Conceptual Metadata Fields

The fields below are conceptual metadata only.

They are not:

- DB fields,
- vector metadata schema,
- migration proposal,
- API response schema,
- production enum,
- generated client contract.

Future RAG source metadata may include:

- `organization_id`,
- `source_type`,
- `source_id`,
- `source_title`,
- `source_version`,
- `visibility`,
- `permission_scope`,
- `customer_visible`,
- `internal_only`,
- `brand_id`,
- `vendor_id`,
- `service_category`,
- `product_category`,
- `language`,
- `locale`,
- `effective_from`,
- `effective_to`,
- `approval_status`,
- `retention_status`,
- deleted marker,
- disabled marker,
- superseded marker,
- source owner,
- source confidence / trust tier,
- citation requirement,
- masking profile,
- ingestion timestamp,
- index version reference.

Metadata must not contain raw secrets, raw provider identifiers, complete customer contact values, raw AI payloads, or full sensitive documents when a reference can be used instead.

## Source Type Categories

Future source categories may include:

- customer service SOP,
- dispatch SOP,
- engineer completion guide,
- repair manual,
- brand rule,
- vendor rule,
- billing / settlement rule,
- notification policy,
- survey policy,
- safety / compliance policy,
- internal training note,
- customer-facing FAQ,
- provider diagnostic guide,
- audit / security policy.

These are not production `source_type` enums.

Task249 does not add ingestion pipeline, source registry, API contract, localization, or runtime source classification.

## Versioning And Effective Date Policy

Future AI retrieval should use source version and effective-date matching.

Principles:

- AI retrieval should select sources valid for the requested time context.
- Superseded source should not be retrieved by default.
- Draft source should not be used in production retrieval.
- Unapproved source should not be used in production retrieval.
- Historical source may be retrieved only when the actor has permission and the task requires historical context.
- Version changes must be auditable.
- Source version should be citable.
- AI output should be able to reference source version and effective window where appropriate.
- Different brand / vendor / organization contexts may have different effective rules.
- Effective date ambiguity should fail closed for high-risk recommendations.

Examples:

- A vendor settlement rule should be matched to the service date or settlement period.
- A notification policy should be matched to the message category and effective period.
- A repair guide should be matched to brand / model / product category when metadata exists.
- A superseded SOP may be useful for historical review but should not guide current operations by default.

These examples are policy notes only and do not implement retrieval logic.

## Visibility And Permission Policy

Future source visibility must protect customer-facing and internal data boundaries.

Principles:

- customer-visible source may be used for customer-facing AI only after organization scope and policy checks pass,
- internal-only source must not be used in customer-facing AI,
- billing / settlement restricted source requires specific permission,
- provider diagnostic source requires internal diagnostic permission,
- audit / security source requires restricted permission,
- engineer-facing guide is not automatically customer-visible,
- supervisor-only source is not automatically visible to support or engineer roles,
- AI must not use source similarity to bypass visibility,
- AI must not quote internal-only source in customer-visible output,
- customer-facing output should use approved customer copy sources where possible.

If visibility and permission metadata conflict, future retrieval should fail closed until source governance is corrected.

## Retention / Deletion / Disablement

Future source lifecycle must affect retrieval eligibility.

Principles:

- deleted source must not be retrieved,
- disabled source must not be retrieved,
- expired source must not be retrieved by default,
- superseded source must not be retrieved by default for current operation,
- source under legal hold / dispute requires future policy,
- retention deletion must be reflected in index / vector store,
- stale index entries must be invalidated,
- AI must not cite deleted or disabled source as current guidance,
- AI must not use stale source to override current approved source.

Future implementation should define how deletion, disablement, retention expiry, supersession, and re-indexing are coordinated across primary storage, document storage, vector store, cache, and audit records.

Task249 does not implement lifecycle syncing.

## Audit Readiness

Future audit event families may include:

- `rag.source.created`,
- `rag.source.updated`,
- `rag.source.approved`,
- `rag.source.rejected`,
- `rag.source.disabled`,
- `rag.source.superseded`,
- `rag.source.deleted`,
- `rag.source.ingested`,
- `rag.source.indexed`,
- `rag.source.excluded_from_retrieval`,
- `rag.source.retrieved`,
- `rag.source.cited`,
- `rag.source.version_mismatch_detected`,
- `rag.source.visibility_violation_blocked`,
- `ai.answer.generated_with_source_citations`.

These are placeholders only.

They are not production event names, schema enums, localization keys, API responses, or audit runtime.

Audit redaction must prohibit:

- raw sensitive payloads,
- secrets,
- tokens,
- LINE access tokens,
- channel secrets,
- full customer mobile values,
- full addresses,
- signature data,
- raw provider payloads,
- provider credentials,
- internal source diagnostics on customer-visible surfaces.

Audit should preserve accountability without exposing raw source content or sensitive data unnecessarily.

## Safe-deny And Non-leakage

Future source retrieval must avoid leaking protected source existence.

Principles:

- unauthorized source must not reveal existence,
- cross-organization source must not reveal existence,
- hidden source must not reveal existence,
- restricted source must not reveal existence to unauthorized actors,
- expired source must not reveal sensitive historical details to unauthorized actors,
- missing entitlement must not leak plan details to customer-facing surfaces,
- AI must not answer whether an internal SOP exists unless the actor can view it,
- AI must not answer whether a billing / settlement rule exists unless the actor can view it,
- AI must not answer whether provider diagnostic source exists unless the actor can view it,
- source not available should map to generic safe-deny wording where needed.

Internal diagnostics may record safe categories only after role, organization scope, permission, and visibility are confirmed.

## SaaS Usage And Entitlement Readiness

Future AI RAG source governance should remain compatible with SaaS plan, entitlement, and usage design.

Future questions:

- Which source types require AI add-on?
- Which source types require higher plan entitlement?
- Is source ingestion counted as usage?
- Is index size counted as usage?
- Is retrieval count measured by source type?
- Is citation count measured?
- Are customer-facing AI and internal AI metered separately?
- Is source version history limited by plan?
- Are historical source lookups a separate entitlement?
- Do provider diagnostic guides require advanced support / security entitlement?

Potential usage categories:

- source ingestion,
- source indexing,
- source re-indexing,
- RAG retrieval,
- citation returned,
- historical source lookup,
- source diagnostics viewed.

These are future design categories only.

Task249 does not implement SaaS usage metering, billing, entitlement runtime, feature flags, or plan limits.

## AI Advisory-only Boundary

AI may:

- use authorized, effective, visible sources to summarize,
- cite sources,
- remind that a source may be expired,
- flag source conflict,
- suggest human update to SOP,
- suggest missing knowledge source,
- identify source metadata gaps for review.

AI must not:

- automatically approve source,
- automatically publish source,
- automatically delete source,
- automatically disable source,
- automatically supersede source,
- automatically rewrite source of truth,
- treat draft source as production source,
- use unauthorized source,
- perform cross-organization retrieval,
- write RAG output into official record by itself,
- override deterministic business logic,
- bypass organization scope,
- bypass permission,
- bypass entitlement.

AI may help reviewers improve source quality, but humans or deterministic governance workflows remain responsible for source approval and official publication.

## Explicit Non-goals

Task249 does not:

- add RAG source table,
- add source metadata schema,
- add document ingestion,
- add vector DB,
- add embedding,
- add indexer,
- add retrieval service,
- add AI agent runtime,
- add API,
- modify backend `src/`,
- modify Admin `admin/src/`,
- add migration,
- modify schema,
- add index,
- add audit runtime,
- add permission runtime,
- add entitlement runtime,
- add usage runtime,
- add worker,
- add scheduler,
- add tests,
- add fixtures,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- connect to DB,
- run psql,
- run DDL,
- run `npm run db:migrate`,
- operate shared Zeabur runtime,
- send provider notifications,
- implement notification runtime,
- implement survey runtime,
- implement AI auto-decision.

## Verification Checklist

Task249 should be verified with:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive / internal diagnostic scan.

Sensitive scan should confirm there are no actual:

- DATABASE_URL values,
- passwords,
- tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE user ids,
- customer mobile values,
- full addresses,
- signature data,
- raw provider payloads,
- provider credentials,
- real tenant IDs,
- real organization IDs,
- real usage values,
- real pricing values,
- AI token counts,
- stack traces,
- SQL errors,
- DB constraint names,
- production translation strings.

Policy words, placeholders, prohibition lists, and guardrail references are allowed when they do not include actual sensitive values.

## Future Task Candidates

Future candidates only; not executed by Task249:

- AI Source Visibility Classification Matrix / No Runtime Change,
- AI RAG Source Approval Workflow Design / No Runtime Change,
- AI RAG Source Retention And Deletion Policy / No Runtime Change,
- AI RAG Ingestion Readiness Gate / No Runtime Change,
- AI Citation And Source Evidence Policy / No Runtime Change,
- AI Agent Branch Pause Summary / No Runtime Change.
