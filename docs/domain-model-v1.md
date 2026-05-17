# Domain Model v1

## Core Relationship

```text
customers
   ↓
cases
   ↓
case_messages
case_attachments
   ↓
dispatches
   ↓
field_service_reports
   ↓
billing_records
```

## Phase 1 Required Tables

```text
customers
cases
case_messages
case_attachments
dispatch_units
users
audit_logs
```

## Reserved Future Tables

```text
dispatches
engineers
field_service_reports
billing_records
manufacturer_claims
engineer_settlements
vendor_settlements
```

## Module Mapping

| Module | Core Tables |
|---|---|
| AI customer service | case_messages, ai_logs |
| Repair request system | customers, cases, case_attachments |
| Dispatch system | dispatch_units, dispatches, engineers |
| Engineer on-site service | field_service_reports, service_photos, signatures |
| Billing reconciliation | billing_records, manufacturer_claims, engineer_settlements, vendor_settlements |
| ISO audit | audit_logs |
