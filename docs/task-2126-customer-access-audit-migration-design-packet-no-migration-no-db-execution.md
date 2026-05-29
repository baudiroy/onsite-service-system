# Task2126 - Customer Access Audit Migration Design Packet

## Status

- Documentation-only migration design packet for future Customer Access audit persistence.
- No migration file was created.
- No DB was touched.
- No SQL was executed.
- No runtime, source, test, package, repository/query, audit persistence, DB writer, route/controller/global mount, production mount, app/server/public routes, smoke, listener, network, Zeabur/env, provider, admin, AI, billing, settlement, payment, invoice, package, or package-lock work was performed.
- The 7 held historical docs remain untracked and untouched.

## Current Accepted Audit Persistence Context

Task2123 conceptual table:

- `customer_access_audit_events`

Task2123 conceptual columns:

- `id`
- `event_type`
- `occurred_at`
- `request_id`
- `actor_type`
- `organization_id`
- `customer_id`
- `case_id`
- `report_id`
- `decision`
- `reason_code`
- `route`
- `method`
- `source`
- `metadata_json`
- `created_at`

Task2124 repository record keys:

- `eventType`
- `occurredAt`
- `requestId`
- `actorType`
- `organizationId`
- `customerId`
- `caseId`
- `reportId`
- `decision`
- `reasonCode`
- `route`
- `method`
- `source`
- `metadata`

## Future DDL Concept - Not Approved DDL

Table name:

- `customer_access_audit_events`

Suggested conceptual column mapping:

- `id`: UUID / generated primary key concept
- `event_type`: text / varchar
- `occurred_at`: timestamptz, nullable or required per future decision
- `request_id`: text, nullable
- `actor_type`: text, nullable
- `organization_id`: text or UUID depending existing schema convention
- `customer_id`: text or UUID, nullable
- `case_id`: text or UUID, nullable
- `report_id`: text or UUID, nullable
- `decision`: text
- `reason_code`: text, nullable
- `route`: text
- `method`: text
- `source`: text
- `metadata_json`: jsonb with sanitized allowlisted metadata only
- `created_at`: timestamptz not null default now() concept

Exact DB types must follow existing schema conventions in a future migration task.

No DDL is authorized now.

## Future Constraints And Checks Concept

Conceptual constraints:

- `event_type` should be constrained to supported Customer Access audit event types.
- `decision` should be constrained to `allow`, `deny`, `success`, or `failure`.
- `method` should be constrained to `GET` for current Customer Access audit events.
- `reason_code` should allow only accepted safe reason codes or null.
- `metadata_json` must not be used for raw payloads.
- `organization_id` should be present when audit event includes organization context.

Data that must not be stored:

- raw request/response data
- headers, tokens, cookies, body, query, or params objects
- DB rows, query metadata, query text, or query values
- provider payloads
- AI prompts or responses
- debug, stack, SQL, private, or admin-only fields

## Future Index Concepts

Conceptual indexes:

- `organization_id, created_at`
- `organization_id, case_id, created_at`
- `organization_id, report_id, created_at`
- `event_type, created_at`
- `request_id`, only if query need is confirmed
- `created_at`, for retention or cleanup

Indexes are conceptual and must be checked against real query needs before any migration is created.

## Organization Isolation

- All future reads must scope by `organization_id` where present.
- No cross-organization audit query assumptions.
- Customer-visible audit endpoints are not authorized.
- Admin audit UI is not authorized.
- Audit events must not become a customer-facing data source.

## Retention And Privacy Considerations

- Future retention policy is required before production persistence.
- Avoid storing raw personal data.
- Avoid storing phone, address, email, or LINE raw identity.
- Avoid storing provider, AI, private, debug, or admin-only fields.
- Metadata must remain small and allowlisted.

## Future Migration Readiness Steps

Future Task A:

- Compare proposed columns with existing schema naming and type conventions.

Future Task B:

- Create migration file only after explicit authorization.

Future Task C:

- Static SQL lint / migration review.

Future Task D:

- Disposable local/test DB dry-run authorization packet.

Future Task E:

- Actual disposable DB dry-run only with explicit approval.

Future Task F:

- Production or staging apply remains separate and is not implied.

## Explicit Non-Goals

- No migration file creation.
- No SQL execution.
- No DB touch.
- No repository implementation.
- No audit persistence writer implementation.
- No runtime persistence integration.
- No route/controller/global mount changes.
- No production mount.
- No smoke, endpoint probe, server, listener, network, Zeabur, or env work.
- No provider, admin, AI, billing, package, or package-lock work.

## Verification

Executed commands for this docs-only design packet:

```sh
git diff --check -- docs/task-2126-customer-access-audit-migration-design-packet-no-migration-no-db-execution.md
git status --short --branch
```

Results:

- `git diff --check -- docs/task-2126-customer-access-audit-migration-design-packet-no-migration-no-db-execution.md`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only the Task2126 doc plus the 7 held historical docs untracked before commit.

Node tests were not required or run because this task is documentation-only and no source or test files were changed.
