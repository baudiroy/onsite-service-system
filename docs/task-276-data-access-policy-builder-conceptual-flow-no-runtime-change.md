# Task 276 - Data Access Policy Builder Conceptual Flow / No Runtime Change

## Scope And Non-goals

This document continues Task274 and Task275 by describing a future-only conceptual flow for a shared Data Access Policy Builder.

The goal is to define how future read, list, search, dashboard, analytics, report, export, download, scheduled report, customer self-service lookup, AI retrieval, and RAG retrieval should conceptually pass through one access-policy decision path.

Task276 is documentation-only.

This task is not:

- permission runtime,
- entitlement runtime,
- subscription runtime,
- usage tracking runtime,
- policy engine implementation,
- report runtime,
- analytics runtime,
- export runtime,
- download runtime,
- scheduled report runtime,
- customer self-service lookup runtime,
- AI retrieval runtime,
- RAG runtime,
- retrieval service,
- vector DB implementation,
- embedding implementation,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation.

Task276 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why A Policy Builder Conceptual Flow Is Needed After Task275

Task275 defined the access dimensions separately:

- organization scope,
- user identity,
- organization membership,
- role,
- permission,
- report / export / download permission,
- feature entitlement,
- subscription status,
- usage limit,
- seat / account type,
- feature flag,
- allowed case / customer / document scope,
- customer-visible data policy,
- internal-only data policy,
- field-level masking,
- audit log requirement,
- SaaS usage tracking,
- AI Add-on usage tracking.

The next design risk is execution order.

If future implementation checks only some dimensions, or checks them in inconsistent order per feature, then reports, exports, scheduled reports, customer self-service lookup, and AI/RAG retrieval can become accidental bypasses.

This document gives a conceptual shared flow that later implementation may use as a design reference. It does not approve runtime implementation.

## Supported Future Access Contexts

The future Data Access Policy Builder should be able to classify and evaluate these contexts:

| Access context | Description | Runtime allowed now? |
| --- | --- | --- |
| Normal record read | Read a single Case, Customer, Appointment, Field Service Report, quote, billing item, or related record. | No |
| List / search | Query a list of records or search within allowed scope. | No |
| Dashboard / analytics | Aggregate records into operational, financial, quality, SLA, or risk summaries. | No |
| Report | Generate a structured view or report from authorized data. | No |
| Export | Create CSV / Excel / dataset output from authorized data. | No |
| Download | Download generated reports, exports, photos, signatures, documents, or attachments. | No |
| Scheduled report | Generate and deliver reports automatically. | No |
| Customer self-service lookup | Let customer channel identities view customer-visible status or actions. | No |
| AI retrieval | Retrieve context for AI summaries, suggestions, risk flags, or draft content. | No |
| RAG retrieval | Retrieve knowledge documents, SOP, brand rules, vendor rules, or case-related source snippets. | No |

## Future-only Policy Builder Flow

The flow below is conceptual only. It is not runtime implementation, not pseudo-code approval, and not an API contract.

```text
Request / job begins
-> identify actor
-> resolve organization scope
-> resolve organization membership or customer channel identity
-> resolve role
-> check base permission
-> check report / export / download permission when applicable
-> check feature entitlement
-> check subscription status
-> check usage limit where applicable
-> resolve allowed case scope
-> resolve allowed customer scope
-> resolve allowed document scope
-> apply customer-visible / internal-only data policy
-> apply field-level masking / redaction
-> classify audit requirement
-> classify SaaS usage tracking
-> for AI/RAG: apply permission-aware retrieval policy
-> for AI/RAG: select minimum necessary context
-> fail closed / safe deny if any required gate fails
-> allow minimum necessary data operation
```

### Flow Step Notes

| Step | Purpose | Must not do | Runtime allowed now? |
| --- | --- | --- | --- |
| identify actor | Determine user, system job, or customer channel identity. | Must not treat unknown actor as trusted. | No |
| resolve organization scope | Establish tenant boundary. | Must not allow cross-organization lookup. | No |
| resolve organization membership | Confirm internal user belongs to the organization. | Must not replace permissions. | No |
| resolve customer channel identity | Confirm external customer-facing identity when applicable. | Must not turn customer into internal user seat. | No |
| resolve role | Establish role context and default workflow surface. | Must not replace granular permission. | No |
| check base permission | Authorize the requested action. | Must not be skipped by reports, exports, or AI. | No |
| check report / export / download permission | Authorize high-risk data extraction or artifact access. | Must not expose fields denied by normal visibility. | No |
| check feature entitlement | Confirm organization has the feature. | Must not grant user permission. | No |
| check subscription status | Confirm organization commercial state where applicable. | Must not decide field visibility. | No |
| check usage limit | Enforce quota/cost constraints. | Must not authorize data visibility. | No |
| resolve allowed case scope | Limit which Cases can be accessed. | Must not grant full customer/document access. | No |
| resolve allowed customer scope | Limit which Customers can be accessed. | Must not grant access to all cases or notes. | No |
| resolve allowed document scope | Limit photos, signatures, files, and RAG sources. | Must not bypass file/document visibility. | No |
| apply visibility policy | Separate customer-visible from internal-only data. | Must not expose internal-only data to customer surfaces. | No |
| apply field masking | Redact or exclude sensitive fields. | Must not mutate official data. | No |
| classify audit requirement | Decide whether access/action must be logged. | Must not authorize the action. | No |
| classify usage tracking | Decide whether usage should be metered. | Must not store sensitive payload unnecessarily. | No |
| apply AI/RAG retrieval policy | Limit AI/RAG sources to authorized data. | Must not query unfiltered DB/vector DB. | No |
| select minimum necessary context | Reduce AI/RAG context to what the task needs. | Must not send full payload for convenience. | No |
| fail closed / safe deny | Deny when scope, permission, visibility, or masking is ambiguous. | Must not leak whether the resource exists. | No |

## Decision Matrix

| Scenario | Required actor type | Required organization scope | Requires permission? | Requires entitlement? | Requires usage check? | Requires field masking? | Requires audit log? | Customer-visible allowed? | Internal-only allowed? | AI/RAG allowed? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Normal case read | Internal user or authorized customer channel identity | Yes | Yes for internal; customer-visible policy for customer | Conditional | No | Yes | Conditional | Conditional | Conditional | Future-only Conditional | No |
| Appointment read | Internal user or authorized customer channel identity | Yes | Yes | Conditional | No | Yes | Conditional | Conditional | Conditional | Future-only Conditional | No |
| Field Service Report read | Internal user or authorized customer channel identity | Yes | Yes | Conditional | No | Yes | Conditional | Conditional | Conditional | Future-only Conditional | No |
| Customer-visible lookup | Verified customer channel identity | Yes | Customer-visible policy, not internal permission | Conditional | Conditional | Yes | Conditional | Yes | No | Future-only Conditional | No |
| Internal note read | Internal user | Yes | Yes | Conditional | No | Yes | Conditional | No | Yes | Future-only Conditional | No |
| Audit log read | Internal privileged user | Yes | Yes | Conditional | No | Yes | Yes | No | Yes | No by default | No |
| Billing / settlement internal data read | Finance / supervisor / authorized admin | Yes | Yes | Conditional | No | Yes | Yes | No | Yes | Future-only Conditional | No |
| Dashboard summary | Internal user | Yes | Yes | Yes where feature-gated | Conditional | Yes | Conditional | No by default | Yes | Future-only Conditional | No |
| Report generation | Internal user | Yes | Yes, including report permission | Yes where feature-gated | Conditional | Yes | Yes | No by default | Yes | Future-only Conditional | No |
| CSV export | Internal user | Yes | Yes, including export permission | Yes where feature-gated | Yes where quota-bound | Yes | Yes | No by default | Yes | Future-only Conditional | No |
| File / document download | Internal user or authorized customer channel identity | Yes | Yes or customer-visible policy | Conditional | Conditional | Yes | Yes | Conditional | Conditional | No by default | No |
| Scheduled report execution | Authorized system job with owner / recipient policy | Yes | Yes, re-checked for owner/recipient | Yes | Yes where quota-bound | Yes | Yes | Conditional | Conditional | No by default | No |
| AI suggestion context retrieval | Internal user | Yes | Yes | Yes for AI entitlement | Yes for AI usage | Yes | Yes | No by default | Conditional | Future-only Yes | No |
| RAG document retrieval | Internal user or customer-facing policy context | Yes | Yes or customer-visible policy | Yes where feature-gated | Yes for AI/RAG usage | Yes | Yes | Conditional | Conditional | Future-only Yes | No |

## Explicit Rules

### Policy Builder Cannot Be Bypassed

The future policy builder must not be bypassed by:

- reports,
- exports,
- downloads,
- scheduled reports,
- customer self-service lookup,
- AI retrieval,
- RAG retrieval,
- internal tools,
- background jobs,
- provider diagnostics.

### Customer Self-service Is Not Internal Permission

Customer self-service lookup uses customer-visible policy and verified customer/channel scope.

It must not:

- grant internal user permission,
- expose internal-only records,
- expose audit logs,
- expose billing / settlement internal data,
- expose AI raw payload,
- expose supervisor notes,
- expose raw provider diagnostics.

### Customer Channel Identity Is Not Internal User Seat

Customer channel identity may represent a verified customer relationship.

It does not become:

- full user seat,
- engineer seat,
- supervisor role,
- finance role,
- admin permission,
- report / export permission.

### AI/RAG Cannot Query Unfiltered Data

AI/RAG must not:

- directly query unfiltered DB,
- directly query unfiltered vector DB,
- retrieve cross-organization data,
- place unauthorized data in prompt or context,
- use internal-only sources in customer-facing answers,
- send full payload for convenience.

Future AI/RAG must use:

- permission-aware filter,
- `organization_id` filter,
- source visibility policy,
- minimum necessary context,
- sensitive-data masking,
- audit classification,
- usage tracking classification.

### Audit Requirement Does Not Allow Operation

Audit tells the platform what must be logged. It does not grant permission to perform the action.

### Usage Tracking Does Not Allow Operation

Usage tracking measures cost or quantity. It does not grant permission, entitlement, visibility, or field access.

### Entitlement Does Not Allow User Action

Entitlement means the organization has a feature. A specific user still needs permission.

## Safe Deny / Non-enumeration Guidance

Future policy builder design must avoid leaking whether a resource exists when a request fails.

Safe deny should apply when:

- permission is missing,
- organization scope is wrong,
- resource does not exist,
- feature entitlement is missing,
- subscription status blocks the feature,
- usage limit is exceeded,
- customer lookup verification fails,
- customer channel identity is not bound,
- document scope is denied,
- AI/RAG retrieval source is denied,
- field masking cannot safely apply.

External or customer-facing responses must not reveal:

- whether a Case exists,
- whether a Customer exists,
- whether a phone number is correct,
- whether an email is correct,
- whether a LINE / channel identity is already bound,
- whether an internal document exists,
- whether an internal risk flag exists.

Internal diagnostics may use more detail only through authorized internal logs, with masking and audit controls.

## SaaS-ready / Security Considerations

Future policy builder implementation must remain compatible with:

- organization isolation,
- role / permission separation,
- entitlement / subscription / usage separation,
- report / export / download permission separation,
- field-level masking readiness,
- audit readiness,
- usage tracking readiness,
- AI Add-on readiness,
- Enterprise SSO future design,
- generic channel identity,
- customer-visible / internal-only data separation.

Enterprise SSO must not bypass:

- organization membership,
- role,
- permission,
- data scope,
- field masking,
- audit requirement,
- usage tracking.

Higher SaaS plans or AI Add-ons must not relax security, tenant isolation, privacy, masking, audit, or ISO 27001-aligned guardrails.

## Future Test Ideas

These are future test ideas only. Task276 does not add tests.

Future coverage should include:

- report/export/download cannot bypass base record permission,
- scheduled report re-checks owner and recipient permissions,
- customer self-service lookup returns safe deny without enumeration,
- customer channel identity cannot access internal note,
- customer channel identity cannot become internal seat,
- AI retrieval cannot run without organization filter,
- RAG retrieval cannot use internal-only source for customer-facing answer,
- feature flag enabled but entitlement missing denies,
- entitlement present but permission missing denies,
- usage limit exceeded blocks quota-bound action,
- audit log requirement creates masked audit event,
- field masking applies to UI, report, export, and AI context consistently.

## Non-goals

Task276 does not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API routes,
- add or modify migrations / schema / indexes,
- connect to DB,
- execute DDL,
- execute `psql`,
- execute `npm run db:migrate`,
- run Migration020 dry-run or apply,
- add permission runtime,
- add entitlement runtime,
- add subscription runtime,
- add usage runtime,
- add report / analytics runtime,
- add export / download runtime,
- add scheduled report runtime,
- add customer self-service lookup runtime,
- add AI retrieval / RAG runtime,
- add retrieval service,
- add vector DB,
- add embedding,
- add indexer,
- modify tests / smoke / fixtures,
- modify `package.json`,
- modify inventory docs,
- touch provider sending,
- send LINE / SMS / Email / APP notifications,
- expose sensitive data.

## Verification Plan

For Task276, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, AI runtime, RAG runtime, report runtime, export runtime, scheduled report runtime, provider sending, or inventory verification is required.

## Conclusion

Task276 defines a future-only Data Access Policy Builder conceptual flow.

The key rule is:

```text
Every data application must pass through the same conceptual access policy:
scope, identity, membership, role, permission, entitlement, subscription,
usage, data scope, visibility, masking, audit, usage tracking, and safe deny.
```

Task276 is docs-only policy-builder conceptual guidance and does not approve permission, entitlement, usage, report, export, download, scheduled report, customer self-service, AI retrieval, or RAG runtime.
