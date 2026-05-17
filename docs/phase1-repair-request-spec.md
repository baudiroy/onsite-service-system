# Phase 1 Repair Request Specification

## Repair Request Entry Points

- LINE Official Account
- Website repair form

## Phase 1 Repair Flow

```text
1. Customer enters through LINE or website.
2. Customer chooses repair request.
3. AI asks guided questions.
4. System collects customer data.
5. System collects product and fault data.
6. Customer uploads photos.
7. AI OCR and background analysis run.
8. System creates case.
9. System returns case number.
10. Admin backend receives notification.
```

## Case Statuses

Phase 1 statuses:

```text
draft
pending_customer
submitted
reviewing
accepted
rejected
cancelled
```

Reserved future statuses:

```text
dispatch_pending
assigned
scheduled
on_site
completed
closed
```

## Customer Fields

| Field | Required | Notes |
|---|---:|---|
| customer_name | yes | Customer name |
| mobile | yes | Mobile phone |
| tel | no | Landline, keep as optional |
| line_user_id | system | LINE identifier |
| city | yes | City |
| address | yes | Full address |
| preferred_visit_time | yes/no | Desired on-site visit time; preferred over contact time |

## Product / Machine Fields

| Field | Required | Notes |
|---|---:|---|
| brand | yes | Product brand |
| product_type | yes | Product type/category |
| model_no | yes | Product model |
| serial_no | yes | Required, but can be filled by AI OCR from nameplate photo |
| invoice_date | yes/no | Can be filled by AI OCR from invoice photo |
| problem_description | yes | Fault description |
| ai_summary | system | AI-generated summary |

## Attachments

Use `case_attachments`.

Attachment types:

```text
fault_photo
serial_photo
invoice_photo
other
```

Files are stored in Cloudflare R2. PostgreSQL stores metadata only.

## AI OCR Background Jobs

### Serial Number

```text
Customer uploads nameplate photo
↓
AI OCR recognizes serial number
↓
System fills serial_no
↓
Admin can manually correct
```

### Invoice Date

```text
Customer uploads invoice photo
↓
AI OCR recognizes invoice date
↓
System fills invoice_date
↓
Admin can manually correct
```

## Address and GPS

Customers only provide address.

The system may later perform background geocoding:

```text
address
↓
geocoding
↓
lat / lng
```

Do not ask customers to input coordinates.

## Dispatch Unit Assignment

Use:

```text
Rule engine first
AI as assistant
Human override always allowed
```

`dispatch_units` must support future creation, update, disable, and priority settings.
