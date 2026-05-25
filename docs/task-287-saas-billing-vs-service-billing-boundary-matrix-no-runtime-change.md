# Task 287 - SaaS Billing vs Service Billing Boundary Matrix / No Runtime Change

## Scope And Non-goals

This document continues the SaaS Plan / Entitlement / Usage Boundary branch after Task282 through Task286.

The purpose is to define a future-only boundary matrix between platform SaaS billing and field service / customer service billing so future implementation does not mix tenant subscription charges, usage costs, seats, AI Add-ons, customer repair quotes, customer fee consent, field service settlement, vendor / brand settlement, payment, or invoice handoff.

Task287 is documentation-only.

This task is not:

- SaaS billing runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- account / seat billing runtime,
- usage-based billing runtime,
- service billing runtime,
- settlement runtime,
- quote runtime,
- customer payment runtime,
- customer invoice runtime,
- entitlement runtime,
- permission runtime,
- usage metering runtime,
- feature flag runtime,
- AI Add-on runtime,
- provider sending runtime,
- report / export / download runtime,
- customer self-service runtime,
- AI retrieval runtime,
- RAG runtime,
- DB schema / migration proposal,
- API contract,
- Admin UI,
- smoke / test implementation.

Task287 does not add tables, migrations, schema, indexes, APIs, Admin UI, runtime logic, audit runtime, permission runtime, entitlement runtime, subscription runtime, usage runtime, tests, smoke fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, or inventory documentation changes.

## Why SaaS Billing vs Service Billing Boundaries Are Needed After Task286

Task286 separated usage tracking, cost attribution, usage limits, audit, provider usage, and future billable usage.

The next risk is mixing two different billing domains:

1. Platform SaaS billing:
   - what the tenant pays for using the platform,
   - such as subscription, seats, usage, AI Add-on, provider usage, file storage, API usage, or Enterprise add-ons.

2. Field service / customer service billing:
   - what the end customer, vendor, brand, or service company pays/settles for a field service case,
   - such as repair quote, customer fee consent, parts charge, floor/carrying/remote fee, second visit fee, vendor settlement, finance approval, customer payment, or invoice handoff.

These domains may both use the words billing, invoice, payment, usage, cost, approval, or charge. They must remain separate.

Task287 defines the boundary only. It does not approve any runtime implementation.

## Definitions

### SaaS Billing

SaaS billing is the future commercial process for charging a tenant / organization for using the platform.

It may include subscription, seats, usage, AI Add-ons, SSO, private AI, storage, provider usage, API usage, or custom enterprise add-ons.

### Subscription Billing

Subscription billing is the future recurring plan fee for Basic, Professional, Business, Enterprise, or custom plans.

It is not customer repair billing.

### Seat-based Billing

Seat-based billing is future pricing for internal account types such as Full User Seat, Field Engineer Seat, or Viewer / Read-only Seat.

It is not an engineer service fee and not field labor settlement.

### Usage-based Billing

Usage-based billing is future pricing or quota enforcement based on platform usage such as AI, notification sending, file storage, exports, API calls, webhooks, or survey sending.

It is not automatically a customer charge.

### AI Add-on Billing

AI Add-on billing is future platform pricing for AI capabilities or AI usage.

It does not allow AI to approve service settlement, customer fee consent, quotes, payments, or invoices.

### Provider Usage Cost

Provider usage cost is the internal or pass-through cost of services such as LINE, SMS, Email, APP push, webhook delivery, AI provider calls, or storage.

Provider usage cost is not automatically an end-customer service charge.

### Service Billing

Service billing is billing related to an actual field service case.

It may include quote, repair charges, parts/materials, floor/carrying/remote fees, second visit fees, customer approval, payment, or invoice handoff.

### Customer Quote

Customer quote is a proposed service charge presented to the end customer for approval.

Quote acceptance is not finance settlement approval.

### Customer Fee Consent

Customer fee consent records that the customer agreed to a fee, add-on, quote, extra work, or second visit cost.

Consent is not settlement approval and not SaaS subscription payment.

### Field Service Settlement

Field service settlement is the internal/vendor/brand/service-company process of calculating and approving payable or receivable amounts for a service case.

It must follow deterministic rules or human approval, not AI auto-approval.

### Vendor / Brand Settlement Rule

Vendor / brand settlement rule is a configurable rule for field service calculation, approval, or reconciliation.

It is separate from SaaS plan entitlement.

### Payment / Invoice Handoff

Payment / invoice handoff is the future process of passing approved service or SaaS charges into an accounting, payment, or invoice workflow.

Task287 does not implement this handoff.

## Boundary Principles

- SaaS billing is not field service billing.
- Subscription invoice is not customer repair invoice.
- Seat-based billing is not engineer service fee.
- AI Add-on billing does not mean AI may approve service settlement.
- Provider usage cost is not automatically customer charge.
- Customer fee consent is not settlement approval.
- Quote acceptance is not settlement approval.
- Settlement approval is not SaaS subscription payment.
- SaaS plan entitlement is not service charge rule.
- SaaS usage tracking is not service settlement calculation.
- Platform invoice data must not be mixed into Case / Field Service Report as service charge data.
- Customer repair charge must not expose tenant subscription, AI Add-on, provider usage, or internal SaaS cost.
- AI may suggest or check, but may not approve any SaaS billing, service settlement, customer fee consent, payment, or invoice.

## Boundary Matrix

This matrix is intentionally conservative. It describes future billing-domain guidance only.

| Item | Belongs to SaaS billing? | Belongs to service billing / settlement? | Customer-visible to end customer? | Visible to SaaS tenant admin? | May affect plan entitlement? | May affect service settlement? | Requires customer consent? | Requires finance approval? | May AI suggest? | May AI approve? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Platform subscription fee | Yes | No | No | Yes | Yes | No | No | Maybe, tenant finance process. | Yes, summary/check only. | No | No |
| Seat-based platform fee | Yes | No | No | Yes | Yes | No | No | Maybe, tenant finance process. | Yes, summary/check only. | No | No |
| AI Add-on fee | Yes | No | No | Yes | Yes | No | No | Maybe, tenant finance process. | Yes, usage/cost insight only. | No | No |
| LINE / SMS / Email provider usage cost | Yes, if platform pass-through or usage-rated. | No by default. | No by default. | Yes, as tenant/platform usage. | Maybe | No by default. | No by default. | Maybe | Yes, cost anomaly insight only. | No | No |
| File storage usage cost | Yes | No | No | Yes | Maybe | No | No | Maybe | Yes, cost insight only. | No | No |
| API / webhook usage cost | Yes | No | No | Yes | Maybe | No | No | Maybe | Yes, cost insight only. | No | No |
| Customer repair quote | No | Yes | Yes, if presented to customer. | Yes, by service permission. | No | Yes | Yes | Maybe | Yes, draft/explanation only. | No | No |
| Floor / carrying / remote fee | No | Yes | Yes, if charged to customer. | Yes, by service permission. | No | Yes | Yes, when applicable. | Maybe | Yes, reminder/check only. | No | No |
| Parts / material charge | No | Yes | Yes, if charged to customer. | Yes, by service permission. | No | Yes | Yes, when applicable. | Maybe | Yes, suggestion/check only. | No | No |
| Second visit fee | No | Yes | Yes, if charged to customer. | Yes, by service permission. | No | Yes | Yes, when applicable. | Maybe | Yes, reminder/check only. | No | No |
| Vendor / brand settlement amount | No | Yes | No by default. | Yes, by finance/settlement permission. | No | Yes | No | Yes | Yes, check/anomaly only. | No | No |
| Finance settlement approval | No | Yes | No by default. | Yes, by finance permission. | No | Yes | No | Yes | Yes, checklist/risk only. | No | No |
| Customer payment | No | Yes | Yes | Yes, by payment/finance permission. | No | Yes | Yes, for charge authorization where applicable. | Maybe | Yes, status summary only. | No | No |
| Invoice handoff | May be SaaS invoice handoff if platform billing. | May be service invoice handoff if service billing. | Service invoice only if customer-facing. | Yes, by domain-specific permission. | Maybe, for SaaS invoice. | Maybe, for service invoice. | Depends on domain. | Yes | Yes, validation/check only. | No | No |

## Data Separation Rules

- SaaS billing data must not be mixed into Case / Field Service Report / service settlement records.
- Service billing / settlement data must not be mixed into SaaS subscription records.
- Customer-visible repair charges must not expose tenant subscription cost, AI Add-on cost, provider usage internal cost, seat fee, or platform subscription details.
- Tenant admin SaaS invoice data must not expose unrelated customer personal data.
- Provider usage cost may support future internal cost attribution, but it must not automatically become a customer charge.
- SaaS invoice and customer repair invoice are separate domains even if a future accounting integration handles both.
- Case-level service billing must continue to respect one Case = one formal Field Service Report.
- Service settlement must not create additional formal Field Service Reports.

## Interaction With Previous Branches

### Billing / Settlement Branch

Task259 through Task265 remain the service billing / settlement design branch.

Service billing / settlement remains part of the customer service workflow:

- quote,
- customer fee consent,
- parts/materials,
- floor/carrying/remote fee,
- second visit fee,
- vendor / brand settlement rule,
- finance settlement approval.

SaaS billing does not replace these workflows.

### Data Access Control Branch

Task274 through Task281 remain authoritative for billing data visibility.

Both SaaS billing and service billing data require:

- organization scope,
- user permission,
- feature entitlement where applicable,
- field-level masking,
- customer-visible/internal-data policy,
- audit,
- safe export/download policy.

### SaaS Usage Branch

Task286 clarified that usage tracking may support cost attribution.

Usage tracking is not formal invoice by itself.

Provider usage cost, AI usage, API usage, export usage, and storage usage may become future SaaS cost inputs only after explicit billing policy and runtime approval.

### AI Branch

AI remains advisory-only.

AI may:

- suggest quote wording,
- check missing fee consent,
- flag settlement anomalies,
- summarize SaaS usage trends,
- detect provider cost anomalies,
- remind finance about missing evidence.

AI must not:

- approve SaaS billing,
- approve service settlement,
- approve customer fee consent,
- approve customer payment,
- approve invoice handoff,
- decide payable amount,
- override deterministic billing or settlement rules.

## SaaS-ready Considerations

Future SaaS packaging may include:

- Basic / Professional / Business / Enterprise platform pricing,
- account / seat-based billing,
- usage-based billing,
- AI Add-on billing,
- Enterprise SSO add-on,
- private / dedicated / hybrid AI add-on,
- provider usage pass-through,
- storage or export usage limits,
- custom enterprise contracts.

These are platform commercial concepts and must remain separate from service case charges.

Future service billing may include:

- customer quote,
- customer fee consent,
- floor / carrying / remote fee,
- parts/materials,
- second visit fee,
- vendor / brand settlement,
- finance approval,
- customer payment,
- service invoice handoff.

These are field service workflow concepts and must remain separate from platform SaaS charges.

## Runtime Forbidden Confirmation

Task287 explicitly does not implement:

- SaaS billing runtime,
- subscription runtime,
- payment runtime,
- invoice runtime,
- account / seat billing runtime,
- usage-based billing runtime,
- service billing runtime,
- settlement runtime,
- quote runtime,
- customer payment runtime,
- customer invoice runtime,
- entitlement runtime,
- permission runtime,
- usage metering runtime,
- feature flag runtime,
- AI Add-on runtime,
- provider sending runtime,
- SSO runtime,
- report / export / download runtime,
- scheduled report runtime,
- customer self-service lookup runtime,
- AI retrieval runtime,
- RAG runtime,
- DB schema,
- migration,
- index,
- API changes,
- Admin UI changes,
- smoke / test changes.

## Future Implementation Questions

Before any billing runtime work begins, future tasks must answer:

- Which charges are platform SaaS charges?
- Which charges are service case charges?
- Which charges are customer-visible?
- Which charges are tenant-admin visible only?
- Which charges require customer consent?
- Which charges require finance approval?
- Which provider usage costs are internal-only?
- Which provider usage costs are pass-through, if any?
- Which AI Add-on costs are platform-level only?
- Which service billing rules depend on vendor / brand configuration?
- Which invoice handoff domain is being implemented?
- How does accounting integration separate SaaS invoice and service invoice?
- What audit events are required for each domain?
- What data must be masked in each domain?

## Conclusion

Task287 adds docs-only billing boundary guidance.

It does not approve or implement SaaS billing, service billing, settlement, quote, payment, invoice, provider sending, AI Add-on, or usage billing runtime.

Future implementation must preserve:

- SaaS billing is not service billing,
- subscription invoice is not customer repair invoice,
- seat billing is not engineer service fee,
- provider usage cost is not automatic customer charge,
- quote acceptance is not settlement approval,
- customer fee consent is not settlement approval,
- AI may suggest but may not approve,
- runtime allowed now is No.
