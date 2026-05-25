# Task 250 - AI Suggestion Official Record Separation Policy / No Runtime Change

## Purpose And Scope

This document defines future policy boundaries between AI suggestion outputs and official platform records.

It covers AI suggestion, risk flag, summary, draft, explanation, confidence, retrieved sources, human accept / reject / edit, and official records such as Case, Appointment, Field Service Report, Billing, Settlement, Complaint, Survey, Notification, customer channel identity, and audit records.

Task250 is documentation-only.

This task is not:

- AI suggestion runtime implementation,
- official record write implementation,
- AI agent runtime,
- RAG runtime,
- API contract,
- Admin UI,
- migration / schema proposal,
- audit runtime,
- automated test implementation,
- AI auto-decision engine.

Task250 does not add tables, APIs, UI, AI runtime, official write workflow, audit runtime, permission runtime, entitlement runtime, usage runtime, or tests.

## Core Separation Principles

AI output is not an official record.

Future principles:

- AI suggestion must remain separate from official records.
- AI confidence must remain separate from official records.
- AI explanation must remain separate from official records.
- Retrieved source citations must remain separate from official records unless a future approved workflow explicitly stores safe references.
- Human accept / reject / edit must be traceable.
- AI must not write suggestion into Case by itself.
- AI must not write suggestion into Appointment by itself.
- AI must not write suggestion into Field Service Report by itself.
- AI must not write suggestion into Billing / Settlement / Complaint / Survey / Notification official state by itself.
- When a human adopts AI suggestion, the official writer should be the human actor or approved deterministic system workflow, not AI.
- Uncertain content must not be written as fact into official records.

AI can help prepare a candidate. It cannot become the official actor for high-risk business decisions.

## Official Record Boundaries

AI must not directly modify:

- Case status,
- Appointment status,
- dispatch visit result,
- Field Service Report official content,
- `finalAppointmentId`,
- quote approval,
- billing approval,
- settlement approval,
- customer fee consent,
- complaint creation,
- complaint closure,
- survey response official content,
- notification send,
- notification resend,
- notification production switch,
- customer channel identity verification,
- customer channel identity binding,
- official audit event facts.

AI must not use suggestion confidence, retrieved sources, or generated explanation as permission to mutate any official record.

Official record changes require deterministic business rules and/or authorized human action.

## AI Output Categories

The categories below are conceptual only.

They are not:

- production enum,
- DB schema,
- API contract,
- generated client field,
- Admin UI option,
- runtime behavior.

Future AI output categories may include:

- summary,
- draft,
- structured extraction,
- risk flag,
- recommendation,
- classification,
- confidence score,
- explanation,
- retrieved source citation,
- missing information warning,
- policy mismatch warning,
- unsafe action warning,
- human decision record reference.

Each category should have a clear policy for whether it may be customer-visible, internal-only, audit-recorded, source-cited, or eligible for human adoption.

## Human Accept / Reject / Edit Readiness

Future human review workflows should capture:

- human actor identity,
- organization scope,
- permission check,
- entitlement check if applicable,
- source citation visibility,
- target official record reference,
- AI suggestion version reference,
- accept / reject / edit decision,
- accept / reject / edit reason where appropriate,
- before / after change tracking where appropriate,
- audit event,
- safe redaction profile.

Audit and official write workflows should not store raw AI sensitive payload.

Human adoption should be explicit. Copying text, accepting structured fields, or applying a suggested classification should each be distinguishable where risk requires it.

## Customer-visible vs Internal-only Separation

Customer-visible surfaces must not expose:

- internal AI raw payload,
- internal confidence,
- internal risk label,
- retrieved internal-only sources,
- internal permission / entitlement denial reason,
- provider diagnostics,
- billing / settlement internal suggestion,
- engineer internal evaluation,
- complaint risk score,
- internal audit details,
- retrieval diagnostics.

Customer-visible surfaces may show:

- human-approved customer-facing response,
- safe summary if approved,
- customer-visible source-based answer if policy permits,
- approved status / next-step wording,
- human-reviewed explanation written for customer context.

Internal-only AI suggestions must stay role-gated, organization-scoped, and redacted.

## RAG Citation And Source Handling

AI suggestion using RAG should cite allowed sources where appropriate.

Principles:

- internal-only source citation must not be shown to customer-facing surfaces,
- source version should be preserved where appropriate,
- effective date / effective window should be preserved where appropriate,
- missing citation should lower trust and require review,
- AI cannot cite hidden source to justify customer-facing answer,
- superseded source should not support current official action by default,
- expired source should not support current official action by default,
- deleted source should not support current official action,
- unapproved source should not support current official action.

Citation is evidence for review, not automatic approval.

## Audit Readiness

Future audit event families may include:

- `ai.suggestion.generated`,
- `ai.suggestion.viewed`,
- `ai.suggestion.accepted`,
- `ai.suggestion.rejected`,
- `ai.suggestion.edited`,
- `ai.output.copied_to_official_workflow_by_human`,
- `ai.risk_flag.created`,
- `ai.risk_flag.dismissed`,
- `ai.source_citation.viewed`,
- `ai.source_citation.rejected`,
- `ai.unsafe_output.blocked`,
- `ai.low_confidence.ignored`.

These are placeholders only.

They are not production event names, schema enums, localization keys, API responses, or audit runtime.

Audit redaction must prohibit:

- full customer mobile values,
- full addresses,
- raw LINE user ids,
- tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw provider payloads,
- provider credentials,
- raw AI sensitive payloads,
- internal audit diagnostics on customer-visible surfaces.

Audit should answer who adopted or rejected AI output. It should not make AI the official actor.

## Safe-deny And Non-leakage

Future AI suggestion workflows must avoid leaking protected resource existence.

Principles:

- AI should not reveal whether hidden official record exists,
- AI should not reveal whether internal-only source exists,
- AI should not reveal internal permission details on customer-facing surfaces,
- AI should not imply cross-organization data exists,
- AI should not use unauthorized source to fill a response,
- retrieval denied should produce generic safe response where appropriate,
- no customer-facing output should reveal provider diagnostics, billing internals, audit internals, or internal risk labels.

If AI cannot answer safely with authorized sources, it should not improvise with uncertain or unauthorized content.

## SaaS Entitlement / Usage Readiness

Future questions:

- Which AI suggestion types require AI add-on?
- Which agent types may generate official-record-adjacent suggestions?
- Are accept / reject / edit actions usage-counted?
- Are accept / reject / edit actions audit-only but not billable?
- Does copied-to-official workflow require a higher plan?
- Is token usage measured by agent type?
- Is source citation count usage-counted?
- Are customer-facing AI and internal AI separate entitlements?
- Should AI risk flag generation have separate quota?
- Should official-record-adjacent suggestion require supervisor permission?

Task250 does not implement entitlement, usage, billing, quota, feature flags, or plan logic.

## AI Advisory-only Boundary

AI may:

- summarize,
- draft,
- structure information,
- flag risk,
- remind missing data,
- suggest next steps,
- cite authorized sources,
- provide confidence / explanation for human review.

AI must not:

- automatically modify official record,
- automatically approve official workflow,
- automatically reject official workflow,
- automatically create complaint,
- automatically close complaint,
- automatically select `finalAppointmentId`,
- automatically approve quote,
- automatically approve billing / settlement,
- automatically approve refund / compensation,
- automatically send notification,
- automatically verify customer identity,
- automatically bind customer channel identity,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- write uncertain content into official data as fact.

AI remains advisory. Official action must remain human-controlled or deterministic under approved workflow.

## Risk Examples

Future implementation should guard against:

| Risk | Required boundary |
| --- | --- |
| AI summary is copied into Field Service Report without review | Require human accept / edit and audit. |
| AI settlement suggestion becomes payable amount | Require finance / settlement approval and deterministic rule checks. |
| AI complaint risk flag becomes formal complaint closure | AI cannot close complaint; human/supervisor workflow required. |
| AI cites internal source to customer | Block customer-visible use of internal-only sources. |
| AI confidence is treated as fact | Confidence is advisory only. |
| AI draft notification is sent directly | Sending requires approved notification workflow and provider gates. |
| AI fills missing customer consent | Consent must come from customer approval record / verified workflow. |
| AI changes finalAppointmentId | `finalAppointmentId` remains backend / system-determined and stable after completion. |

These examples are policy notes only, not tests or runtime behavior.

## Explicit Non-goals

Task250 does not:

- add AI suggestion table,
- add official record write workflow,
- add AI agent runtime,
- add RAG runtime,
- add retrieval service,
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
- implement AI auto-decision,
- implement official record write by AI.

## Verification Checklist

Task250 should be verified with:

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

Future candidates only; not executed by Task250:

- AI Human Accept / Reject / Edit Workflow Design / No Runtime Change,
- AI Official Record Write Boundary Matrix / No Runtime Change,
- AI Suggestion Audit Event Catalog / No Runtime Change,
- AI Customer-visible Output Policy / No Runtime Change,
- AI Risk Flag Governance Policy / No Runtime Change,
- AI Agent Branch Pause Summary / No Runtime Change.
