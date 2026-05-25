# Task 256 - AI Official Write Source Trace Policy / No Runtime Change

## Purpose And Scope

This document defines future source trace policy for cases where a human actor adopts an AI suggestion and brings that content into an official workflow or official record candidate.

Task256 is documentation-only.

This task is not:

- official write workflow implementation,
- AI suggestion runtime,
- AI agent runtime,
- RAG runtime,
- retrieval service,
- source trace schema,
- API contract,
- Admin UI,
- migration / schema proposal,
- audit runtime,
- automated test implementation,
- AI auto-decision engine.

Task256 does not add source trace tables, official write workflow, AI suggestion tables, APIs, Admin UI, migrations, schema, audit runtime, AI runtime, RAG runtime, retrieval service, permission runtime, entitlement runtime, usage runtime, or automated tests.

## Core Source Trace Principles

AI-assisted official-record-adjacent work must remain traceable without making AI the official actor.

Future principles:

- When a human adopts AI suggestion, traceability should be preserved.
- Official write actor should not be AI.
- Official writer should be the human actor or an approved deterministic workflow.
- Source trace should preserve AI suggestion reference.
- Source trace should preserve retrieved source citation reference.
- Source trace should preserve source version and effective date where applicable.
- Human-edited content should be distinguishable from original AI suggestion.
- Missing source should not support official write without manual evidence or review.
- Hidden source should not support official write by a writer who cannot view it.
- Expired source should not support current action by default.
- Unauthorized source should not support official write.
- Source trace must not expose internal source to customer-visible surfaces.

Source trace is accountability metadata. It is not permission, entitlement, source visibility, or official approval by itself.

## Official Write Target Boundaries

The future source trace policy may apply to these target workflows, but Task256 does not implement any of them:

- Case note / Case update,
- Appointment outcome,
- dispatch visit result,
- Field Service Report draft / final content,
- billing review note,
- settlement review note,
- quote review note,
- complaint follow-up note,
- survey follow-up review,
- notification copy approval,
- customer channel identity review,
- audit-support note.

AI must not directly modify:

- Case status,
- Appointment status,
- Field Service Report official status,
- `finalAppointmentId`,
- quote approval,
- billing approval,
- settlement approval,
- customer fee consent,
- complaint creation,
- complaint closure,
- notification sending,
- customer identity verification,
- customer identity binding.

AI suggestion may be a draft. It must not be the actor that changes official state.

## Conceptual Source Trace Metadata

The metadata below is conceptual only.

It is not:

- DB columns,
- API schema,
- migration proposal,
- production enum,
- generated client field,
- Admin UI contract.

Future source trace metadata may include:

- official target reference,
- AI suggestion reference,
- suggestion version,
- agent type,
- task type,
- human actor reference,
- human role category,
- organization reference,
- permission context category,
- entitlement context category,
- source citation reference,
- source version reference,
- source effective date category,
- source visibility category,
- human edit delta category,
- accept / edit reason,
- official workflow validation result category,
- audit reference,
- occurred at.

The metadata should support review and accountability while avoiding raw sensitive payload storage.

## Source Eligibility For Official Write

Future source trace should evaluate whether a source is eligible to support a given official workflow action.

Eligibility principles:

- Source must be organization-scoped.
- Source must be visible to the human writer.
- Source must be valid for the target workflow.
- Source must be approved where approval is required.
- Source must be effective for the relevant time window where effective dates exist.
- Source must not be deleted.
- Source must not be disabled.
- Source must not be superseded for the current action.
- Source must match the target workflow context.
- Billing action needs billing-visible source.
- Settlement action needs settlement-visible source.
- Complaint / quality action needs complaint / quality-visible source.
- Customer-facing official content cannot rely on hidden internal-only source as customer-visible fact.
- Missing or invalid citation means official write needs manual evidence, refreshed source, or higher review.

Source eligibility is separate from AI confidence.

## Human Edit And Attribution

Human edit must remain attributable.

Principles:

- Human edit should be distinguishable from original AI text.
- Human edit is human responsibility.
- AI suggestion confidence is not official certainty.
- Human may accept some parts and reject others.
- Human edit reason may be required for high-risk workflows.
- Official write should not misrepresent AI draft as customer original text.
- Official write should not misrepresent AI inference as verified fact.
- Human reviewer should verify evidence before adopting factual claims.
- High-risk official writes should retain a safe edit category or reason, not raw sensitive payload.

If human text becomes official content, the official content should be attributed to the human or approved deterministic workflow, with AI involvement recorded as trace metadata.

## Customer-visible vs Internal Trace Separation

Customer-visible surfaces must not expose:

- internal source trace,
- internal AI suggestion reference,
- AI confidence,
- internal risk score,
- internal source title if hidden,
- reviewer notes,
- audit metadata,
- permission context,
- entitlement context,
- provider diagnostics,
- raw AI payload.

Customer-visible surfaces may show:

- human-approved content,
- customer-visible source citation if policy permits,
- safe summary if approved,
- approved next-step wording,
- human-reviewed explanation written for customer context.

Internal trace can support accountability without becoming customer-visible explanation.

## Audit Readiness

Future audit event examples:

- `ai.official_write.proposed`,
- `ai.official_write.source_trace_attached`,
- `ai.official_write.source_trace_missing`,
- `ai.official_write.blocked_by_source_visibility`,
- `ai.official_write.blocked_by_expired_source`,
- `ai.official_write.human_accepted`,
- `ai.official_write.human_edited`,
- `ai.official_write.human_rejected`,
- `ai.official_write.validation_failed`,
- `ai.official_write.completed_by_human`,
- `ai.official_write.copied_to_official_workflow`,
- `ai.official_write.unsafe_blocked`.

These are placeholders only.

They are not:

- production event names,
- DB enum values,
- localization keys,
- API response fields,
- generated client contracts,
- audit runtime.

Audit redaction must prohibit:

- full customer mobile values,
- full addresses,
- raw LINE user ids,
- tokens,
- secrets,
- raw provider payloads,
- raw AI sensitive payloads,
- internal trace exposure on customer-visible surfaces.

Audit should record trace categories and actor accountability, not raw hidden source content.

## Permission / Entitlement Readiness

Future implementation must answer:

- Who can attach source trace?
- Who can view source trace?
- Who can approve official write based on AI suggestion?
- Which target workflows need supervisor review?
- Which target workflows need billing / settlement permission?
- Which target workflows need quality / complaint permission?
- Which source trace export capabilities require entitlement?
- Does official-write-adjacent AI require higher plan?
- Does trace retention differ by plan?
- Which workflows require source citation before adoption?
- Which workflows allow manual evidence when citation is missing?

These are future design questions only. Task256 does not implement permission, entitlement, retention, export, or workflow logic.

## Safe-deny And Non-leakage

Future source trace behavior must fail safely.

Safe-deny principles:

- Writer cannot view source -> writer cannot use source trace.
- Source hidden -> do not reveal existence.
- Cross-organization source -> deny without disclosure.
- Expired source -> safe warning only to authorized internal reviewer.
- Disabled source -> safe warning only to authorized internal reviewer.
- Customer-facing surface must not reveal internal trace exists.
- AI must not say "internal policy supports this" unless the source is visible and allowed for that surface.
- AI must not imply hidden source supports a conclusion.
- Missing trace must not reveal whether hidden trace exists.

Safe-deny should protect both customer-visible and internal role-restricted surfaces from resource enumeration.

## AI Advisory-only Boundary

AI can:

- suggest source trace,
- remind missing citation,
- flag source mismatch,
- remind source expired / superseded,
- draft official workflow text for human review,
- compare AI draft and human edit,
- suggest evidence categories to check.

AI cannot:

- attach hidden source automatically,
- approve official write,
- complete official write,
- modify official record,
- choose `finalAppointmentId`,
- approve quote,
- approve settlement,
- approve refund,
- approve compensation,
- create complaint,
- close complaint,
- send notification,
- bypass permission,
- bypass entitlement,
- bypass organization scope,
- treat uncertain inference as verified fact.

AI remains advisory. It must not become the accountable actor for official state.

## Explicit Non-goals

Task256 does not:

- create source trace table,
- add official write workflow,
- add AI suggestion table,
- add AI review runtime,
- add RAG runtime,
- add retrieval service,
- add API,
- modify backend source,
- modify Admin source,
- add migration,
- change schema,
- add index,
- add audit runtime,
- add permission runtime,
- add entitlement runtime,
- add usage metering runtime,
- add tests,
- add smoke tests,
- modify `package.json`,
- modify inventory docs,
- touch Migration020,
- touch shared Zeabur runtime,
- connect to DB,
- run DDL,
- implement AI agent runtime,
- implement embedding,
- implement vector DB,
- implement provider sending,
- implement notification runtime,
- implement survey runtime,
- implement AI auto-decision,
- implement official record write by AI.

## Future Runtime Readiness Checklist

Before future implementation, a new task should verify:

- source trace does not make AI the official actor,
- official writer is human or approved deterministic workflow,
- source trace is organization-scoped,
- source trace is visible to the human writer,
- hidden source cannot support official write by unauthorized writer,
- missing / expired / disabled / superseded source cannot support current action by default,
- human edits are distinguishable from AI suggestion,
- customer-visible surfaces do not expose internal trace,
- audit records trace categories with redaction,
- `finalAppointmentId` remains backend / system determined,
- official workflow validation still runs after AI-assisted draft adoption.

## Future Task Candidates

Future tasks may include:

- AI source trace metadata schema proposal,
- AI official write source trace permission matrix,
- AI source trace retention policy,
- AI source trace audit event hardening,
- AI official write validation matrix,
- AI source trace Admin UX requirements,
- AI source trace safe-deny copy catalog,
- AI official write source trace test plan,
- AI source trace export policy,
- AI official write runtime readiness gate.

These are future candidates only. Task256 does not execute them.
