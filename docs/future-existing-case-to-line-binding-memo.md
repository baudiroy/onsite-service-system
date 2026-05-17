# Future Memo - Existing Case to LINE Binding

## Purpose

This memo records a future required workflow:

Existing repair cases must be able to bind to LINE after the case has already been created.

Current and near-term development should not implement the full feature yet. This memo is a design boundary and future planning note for LINE customer onboarding, notification flow, and customer inquiry enhancement.

## Background

In real operations, many cases are created before the customer ever contacts the service provider through LINE.

Cases may originate from:

- Phone calls
- Customer service agents
- Admin backend entry
- Vendor-provided case data
- External service sources
- Other non-LINE intake channels

Therefore, the platform must not only support "customer enters from LINE and creates a case." It must also support the reverse flow:

1. A repair case already exists.
2. The system or customer service guides the customer to LINE.
3. The customer completes LINE binding.
4. The existing case and customer are associated with the correct `customer_line_identity`.
5. Later inquiry, notifications, missing document requests, appointments, and service completion updates can happen through LINE.

This is required for future customer service LINE migration, reduced phone back-and-forth, and easier customer self-inquiry.

## Formal Design Principles

1. The system must support both LINE-originated cases and existing-case-to-LINE binding.
2. Existing `case` / `customer` records should be able to generate a LINE binding invitation.
3. Binding must include secure verification. `caseNo` alone is not enough.
4. LINE identity scope must follow the existing multi-organization model:
   - `organization_id`
   - `line_channel_id`
   - `line_user_id`
5. `line_user_id` must not be treated as a global identity.
6. After binding succeeds, customer inquiry, notification, and LINE message flows must use the correct `organization_id` + `line_channel_id` scope.
7. Binding flow must write audit logs.
8. Binding tokens, mobile numbers, LINE IDs, channel secrets, and access tokens must not be exposed in plaintext logs or unsafe payloads.

## Suggested Future Flow

1. Customer service or the system already has a case.
2. The system generates a LINE binding invitation through one or more channels:
   - SMS link
   - QR code
   - Customer service verbal guidance to join LINE
   - Admin button to generate / copy invitation link
3. Customer clicks the link or joins LINE.
4. The system verifies the case binding request. Possible approaches:
   - One-time token
   - `caseNo` + mobile
   - `caseNo` + last three digits of mobile
   - Token + partial mobile verification
5. After verification succeeds, the system creates or updates `customer_line_identities`.
6. The system securely links:
   - `customer_id`
   - `case_id`
   - `line_channel_id`
   - `line_user_id`
7. The customer can then use LINE to:
   - Query case progress
   - Receive notifications
   - Submit missing materials
   - Confirm appointments
   - View service completion information

## Future Data Model Concepts

### `case_line_binding_tokens`

Suggested fields:

- `id`
- `organization_id`
- `line_channel_id`
- `case_id`
- `customer_id`
- `token_hash`
- `expires_at`
- `used_at`
- `created_by`
- `created_at`
- `metadata`

Notes:

- Store token hash only.
- Do not store plaintext tokens.
- Tokens should be single-use and time-limited.

### `customer_line_identities`

Existing / expected scope fields:

- `organization_id`
- `line_channel_id`
- `customer_id`
- `line_user_id`
- `status`
- `linked_at`

Important:

- `organization_id` + `line_channel_id` + `line_user_id` is the correct identity scope.
- Do not use `line_user_id` alone as a global identity.

### Optional Future Table: `case_line_bindings`

Suggested fields:

- `id`
- `case_id`
- `customer_id`
- `customer_line_identity_id`
- `linked_at`
- `source`
- `created_at`

This table may be useful if a customer has multiple cases or if the product needs explicit case-level binding history separate from customer-level LINE identity.

## Security Requirements

1. Binding token must expire.
2. Binding token should be stored as a hash only.
3. Binding token should be single-use.
4. Verification failure responses must not reveal whether:
   - The case exists
   - The mobile number is correct
   - The LINE identity is already bound
5. Binding success, failure, expiry, and repeated use must write audit logs.
6. Logs must not include:
   - Full mobile number
   - Full token
   - Raw LINE user id
   - LINE access token
   - Channel secret
   - Full request payload
7. Users from different organizations / LINE channels must not be able to bind or query each other's cases.
8. Customer-visible data must follow the public inquiry data policy. It must not expose:
   - Internal notes
   - Audit logs
   - Billing data
   - Internal engineer notes
   - AI raw payload
   - OCR raw output

## Future API / Feature Direction

### Admin Side

Future admin features may include:

- Generate existing-case LINE binding invitation
- View binding status
- Regenerate invitation
- Cancel / revoke invitation
- View binding audit events

### Public / LINE Side

Future public or LINE-facing features may include:

- Verify binding token
- Bind LINE identity
- Query bound cases
- Unbind or rebind flow, depending on future policy

### Notification Side

Future notification behavior may include:

- Send SMS invitation after case creation.
- Let customer service copy an invitation link.
- Choose notification channel based on LINE binding state:
  - If LINE bound: prefer LINE.
  - If not LINE bound: use SMS / phone / other channel.

## AI Boundary

AI may help identify cases that are good candidates for LINE binding invitation, for example:

- Customer called multiple times for status.
- Appointment time needs confirmation.
- Missing documents or photos are needed.
- Follow-up / second visit is likely.
- Service completion notification would reduce manual calls.

AI must not:

- Automatically complete LINE binding.
- Bypass customer verification.
- Use raw LINE user id as a global identity.
- Override organization / LINE channel scope.
- Expose sensitive binding token, mobile, LINE ID, or channel credentials.

AI involvement should start as draft / suggestion / reminder only, not automatic decision-making.

## Current Stage

This is a future design memo.

Do not implement this flow in the current stage.

Current priorities remain:

- Core case / customer flow
- Dispatch / appointment flow
- Multi-dispatch results
- One official Field Service Report per case
- Billing / settlement foundation
- Admin operation pages
- Smoke tests
- AI-ready fields and extension points only

When future work enters LINE customer onboarding, notification routing, or customer inquiry enhancement, this existing-case-to-LINE binding flow must be treated as a required design item.
