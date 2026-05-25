# Task 278 - Data Access Report / Export / Download Permission Boundary / No Runtime Change

## Scope And Non-goals

This document continues the Data Access Control / Data Permission Model branch from Task274 through Task277.

The purpose is to define docs-only boundaries for future report, export, download, and scheduled report permissions.

Task278 is documentation-only.

This task is not:

- report runtime,
- analytics runtime,
- export runtime,
- download runtime,
- scheduled report runtime,
- permission runtime,
- entitlement runtime,
- subscription runtime,
- usage tracking runtime,
- customer self-service lookup runtime,
- AI retrieval runtime,
- RAG runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- automated test implementation.

Task278 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why Report / Export / Download Boundaries Are Needed After Task277

Task277 separated scope resolution, visibility policy, field masking, and safe deny.

Reports, exports, downloads, and scheduled reports are higher-risk because they can:

- aggregate many records,
- include sensitive fields,
- leave the normal UI,
- become files that outlive a session,
- be forwarded to recipients,
- be scheduled automatically,
- become SaaS usage / billing events,
- accidentally bypass normal data visibility.

Therefore, future report/export/download design must explicitly preserve:

- organization isolation,
- base read permission,
- report/export/download-specific permission,
- feature entitlement,
- subscription status,
- usage limits,
- data scope,
- visibility policy,
- field-level masking,
- audit,
- usage tracking.

Task278 defines future boundaries only. It does not approve runtime implementation.

## Definitions

### Report

A report is a structured view or generated artifact that summarizes authorized data for a business purpose.

Reports may include tables, metrics, summaries, charts, or formatted documents in future design.

Report access must not include records or fields the actor cannot read.

### Dashboard Analytics

Dashboard analytics are UI summaries, counts, charts, or risk views derived from authorized records.

Dashboard analytics are not official records and must not bypass source data scope.

### Export

An export creates a dataset outside the normal UI, such as CSV, Excel, or future machine-readable output.

Export is higher-risk than normal read because data may leave the platform boundary.

### CSV Export

CSV export is a specific export format that must apply the same permission, visibility, masking, audit, and usage rules as other exports.

### File / Document Download

Download includes generated reports, exports, uploaded files, attachments, photos, signatures, and future documents.

Download permission must consider document scope, file sensitivity, expiry, and audit.

### Scheduled Report

A scheduled report is automated report generation or delivery.

Scheduled report is automation of report/export/download, not a separate permission shortcut.

### Report Permission

Report permission controls whether a user may view or generate reports.

It does not imply export or download permission.

### Export Permission

Export permission controls whether a user may create export files or datasets.

It does not imply file/download permission for unrelated artifacts.

### Download Permission

Download permission controls whether a user may download generated or uploaded artifacts.

It does not imply permission to view all source records.

### Aggregation Threshold

Aggregation threshold is a future privacy control that may suppress, bucket, or generalize counts where a small sample could expose sensitive records.

Aggregation threshold is not runtime-approved by Task278.

### Masking Policy

Masking policy determines whether sensitive fields are shown, partially shown, excluded, aggregated, or redacted.

Masking must apply consistently in reports, exports, downloads, scheduled reports, and AI-related data outputs.

### Usage Tracking Event

Usage tracking event is a future SaaS metering concept for report generation, export, download, scheduled delivery, or AI-related export actions.

Usage tracking does not authorize access.

## Boundary Principles

- Report/export/download cannot bypass normal read permission.
- Scheduled report is automation of report/export/download, not a permission shortcut.
- Export permission does not equal download permission.
- Report permission does not equal export permission.
- Entitlement does not equal user permission.
- Usage quota not exceeded does not mean data access is allowed.
- Audit requirement does not mean operation is allowed.
- Field-level masking must continue through report/export/download.
- Customer-visible data and internal-only data must not be mixed through export.
- Generated files should be treated as sensitive artifacts when they include sensitive source data.
- Future scheduled delivery must validate recipient authorization at execution time, not only at schedule creation time.

## Future-only Permission Matrix

The matrix below is conceptual only. It is not a schema, API, route, test, or runtime implementation.

| Future report/export/download scenario | Required base read permission | Required report/export/download permission | Requires entitlement? | Requires subscription active? | Requires usage check? | Requires masking? | Requires aggregation threshold? | Requires audit? | Customer-visible allowed? | Internal-only allowed? | Scheduled report allowed? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case list report | Case read within allowed scope | Report permission | Conditional | Conditional | Conditional | Yes | Conditional | Conditional | No by default | Conditional | Future-only Conditional | No |
| Appointment schedule report | Appointment read within allowed scope | Report permission | Conditional | Conditional | Conditional | Yes | Conditional | Conditional | Conditional safe subset | Conditional | Future-only Conditional | No |
| Field Service Report summary report | Report read within allowed scope | Report permission | Conditional | Conditional | Conditional | Yes | Conditional | Conditional | Conditional approved subset | Conditional | Future-only Conditional | No |
| Internal note report | Internal note read | Report permission for internal data | Conditional | Conditional | Conditional | Yes | Conditional | Yes | No | Yes, authorized roles only | Future-only Restricted | No |
| Survey feedback report | Survey/feedback read within allowed scope | Report permission | Conditional | Conditional | Conditional | Yes | Conditional | Conditional | Conditional customer-owned content policy | Yes, authorized roles only | Future-only Conditional | No |
| Complaint / callback future report | Complaint/follow-up read within allowed scope | Report permission for operations/quality data | Conditional | Conditional | Conditional | Yes | Conditional | Yes | No by default | Yes, authorized roles only | Future-only Restricted | No |
| Billing / settlement report | Billing/settlement read | Finance/report permission | Conditional | Conditional | Conditional | Yes | Conditional | Yes | No | Yes, finance/supervisor roles | Future-only Restricted | No |
| Customer contact export | Customer contact read | Export permission for contact fields | Conditional | Conditional | Yes | Yes | No | Yes | No by default | Yes, authorized roles only | Future-only Restricted | No |
| CSV export | Source record read | Export permission | Conditional | Conditional | Yes | Yes | Conditional | Yes | No by default | Conditional | Future-only Restricted | No |
| File attachment download | Document/file read | Download permission | Conditional | Conditional | Conditional | Yes | No | Yes | Conditional own/customer-visible file policy | Conditional | Future-only Restricted | No |
| Customer signature download | Signature metadata/file read | Download permission for sensitive file | Conditional | Conditional | Conditional | Yes | No | Yes | Conditional approved/customer-owned policy | Yes, restricted | Future-only Restricted | No |
| Audit log export | Audit log read | Export permission for audit logs | Conditional | Conditional | Yes | Yes | Conditional | Yes | No | Yes, audit/admin only | Future-only Restricted | No |
| AI suggestion export | AI suggestion read | Export permission for AI advisory data | Conditional AI entitlement | Conditional | Yes | Yes | Conditional | Yes | No by default | Yes, authorized roles only | Future-only Restricted | No |
| RAG source metadata export | RAG source metadata read | Export permission for source metadata | Conditional | Conditional | Yes | Yes | Conditional | Yes | Conditional public/customer-visible docs only | Conditional | Future-only Restricted | No |
| Scheduled report execution | Source read re-checked at execution | Report/export/download permission re-checked | Yes where feature-gated | Yes | Yes | Yes | Conditional | Yes | Conditional by recipient policy | Conditional by recipient policy | Future-only only | No |

## Scheduled Report Re-check Rules

Future scheduled report implementation must re-check access on every execution.

It must not rely only on the access state from when the schedule was created.

Each execution should conceptually re-check:

- organization scope,
- user / service actor,
- organization membership or authorized system context,
- base read permission,
- report / export / download permission,
- feature entitlement,
- subscription status,
- usage limit,
- data scope,
- customer-visible / internal-only visibility policy,
- field masking,
- recipient authorization,
- audit requirement,
- usage tracking requirement.

Scheduled report execution must fail closed if any required gate is invalid, expired, revoked, exceeded, or ambiguous.

Examples:

- User lost export permission after schedule creation: fail closed.
- Organization subscription expired: fail closed where subscription is required.
- Export entitlement removed: fail closed.
- Usage limit exceeded: fail closed or route to future limit-handling policy.
- Recipient no longer authorized: do not deliver.
- Field masking policy changed: apply latest safe masking.
- Source record moved out of scope: exclude or deny according to future policy.

## Safe Deny / Non-enumeration Rules

External or customer-facing export/download failures must not reveal:

- whether a Case exists,
- whether a Customer exists,
- whether a phone number is correct,
- whether an email is correct,
- whether a channel identity is bound,
- whether a file exists,
- whether a report exists,
- whether a generated export exists,
- whether an internal note exists,
- whether an audit log exists.

Internal errors must not expose:

- full token,
- secret,
- full phone,
- full address,
- raw LINE id,
- raw provider payload,
- raw signature data,
- AI raw sensitive payload,
- provider credentials,
- DB connection details.

Internal diagnostics may record safe, masked classification only for authorized users and audit workflows.

## Interaction With Future Access Contexts

| Access context | Report/export/download boundary | Runtime allowed now? |
| --- | --- | --- |
| Normal read | Establishes source record visibility; report/export/download cannot exceed it. | No |
| List / search | Result lists must obey same scope and masking before report/export actions. | No |
| Dashboard / analytics | Dashboard summaries must not become unrestricted reports or exports. | No |
| Report | Requires report permission and visibility/masking policy. | No |
| Export | Requires export permission, masking, audit, usage classification, and entitlement where applicable. | No |
| Download | Requires download permission, document scope, expiry, masking, and audit where applicable. | No |
| Scheduled report | Re-checks all applicable gates on each execution. | No |
| AI retrieval / RAG retrieval | AI/RAG source data may not be exported or included without the same source visibility and masking rules. | No |

## SaaS-ready / Security Considerations

Future report/export/download design must remain compatible with:

- organization isolation,
- role / permission separation,
- report permission,
- export permission,
- download permission,
- entitlement / subscription / usage separation,
- field-level masking readiness,
- audit readiness,
- usage tracking readiness,
- AI Add-on readiness for AI-related exports,
- Enterprise SSO future design,
- customer-visible / internal-only separation,
- generic channel identity.

Higher SaaS plans, AI Add-ons, or Enterprise SSO must not reduce data protection requirements.

Report/export/download usage may become SaaS-metered in the future, but usage tracking must not store unnecessary sensitive payload.

## Future Test Ideas

These are future test ideas only. Task278 does not add tests.

Future coverage should include:

- report permission without base read permission denies,
- export permission without source visibility denies,
- report permission does not allow CSV export,
- export permission does not allow sensitive file download,
- scheduled report re-checks permission on every execution,
- scheduled report fails when entitlement is removed,
- scheduled report fails when recipient authorization is revoked,
- customer contact export masks or excludes restricted fields,
- audit log export is restricted and audited,
- customer-facing download does not enumerate file existence,
- AI suggestion export excludes AI raw sensitive payload,
- RAG metadata export respects source visibility filters.

## Non-goals

Task278 does not:

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

For Task278, verification is limited to documentation safety:

- `npm run check`,
- `npm run admin:check`,
- `git diff --check`,
- sensitive text scan for accidental secrets or real customer/provider data.

No smoke, DB, migration, API, Admin runtime, AI runtime, RAG runtime, report runtime, export runtime, scheduled report runtime, provider sending, or inventory verification is required.

## Conclusion

Task278 defines future-only report / export / download permission boundaries.

The key rule is:

```text
Report, export, download, and scheduled report must not bypass normal read
permission, organization isolation, visibility policy, field masking, audit,
or usage tracking.
```

Task278 is docs-only report/export/download permission boundary guidance and does not approve report, export, download, or scheduled report runtime.
