# Task418 — Customer-Facing Fixture Sensitive Scan Checklist / No Runtime Change

Task418 defines a future sensitive scan checklist for customer-facing fixtures,
tests, local-only runtime spike data, demo data, documentation examples,
snapshots, generated outputs, screenshots, and exported artifacts.

This task is documentation-only. It does not add scan scripts, fixtures, tests,
CI, runtime, API, DB, provider sending, or AI runtime.

## Current Baseline

Task418 follows the Task370-417 customer-facing no-runtime baseline.

It especially follows Task417, which defines the synthetic fixture policy:

- fixtures must be fully synthetic,
- production data is forbidden by default,
- real personal data is forbidden,
- raw provider payloads are forbidden,
- raw tokens and raw channel ids are forbidden,
- complete phone numbers and complete addresses are forbidden,
- symbolic fixture references are preferred.

Current state remains:

- no customer-facing runtime,
- no fixture files added,
- no test files added,
- no scan script added,
- no CI gate added,
- no projection utility modification,
- no forbidden field constants modification,
- no route/controller/API implementation,
- no resolver runtime,
- no repository / DB access,
- no migration / schema / index,
- no token/link persistence,
- no customer channel identity persistence,
- no audit/security event persistence,
- no localization/message catalog runtime,
- no provider sending,
- no AI / RAG / vector DB runtime,
- no smoke/browser/API/integration tests,
- no shared/prod/Zeabur runtime access.

Task418 is a docs-only sensitive scan checklist, not scan implementation.

## Scan Principles

Future fixture/test/demo data scans should follow these principles:

- Default fail closed.
- Production data is forbidden.
- Raw provider payload is forbidden.
- Raw token is forbidden.
- Secret is forbidden.
- Raw channel id is forbidden.
- Complete phone number is forbidden.
- Complete address is forbidden.
- True customer name is forbidden.
- Customer document content is forbidden.
- Signature content is forbidden.
- Photo content is forbidden.
- File/document content is forbidden.
- Symbolic fixture examples may exist only when they are not contactable, not
  reversible, and not tied to real data.
- Allowed policy terms do not permit real sensitive values.

If a scan result is ambiguous, the future workflow must stop and ask for human
review. Codex must not silently ignore uncertain sensitive matches.

## Must-Fail Sensitive Matches

The following future fixture/test/demo data matches must fail closed.

| Sensitive match | Future action | Notes |
| --- | --- | --- |
| Real phone / mobile number | Must fail closed. | Do not accept contactable numbers. |
| Complete address | Must fail closed. | Do not accept full street/doorplate-like data. |
| Raw token | Must fail closed. | Use sanitized token references only. |
| Secret | Must fail closed. | Includes API/webhook/provider/application secrets. |
| Actual `DATABASE_URL` value | Must fail closed. | The policy term is allowed, the actual value is not. |
| Raw channel id | Must fail closed. | Includes provider-specific channel/user identifiers. |
| Actual `line_user_id` value | Must fail closed. | Field-name discussion is allowed; real values are not. |
| Provider webhook payload | Must fail closed. | Do not include raw provider payloads. |
| Customer document content | Must fail closed. | Includes copied documents or screenshots. |
| Signature/photo/file/document content | Must fail closed. | Use symbolic metadata only. |
| Raw AI prompt with personal data | Must fail closed. | AI fixtures must be synthetic/minimized. |
| Raw model response with personal data | Must fail closed. | Do not preserve PII in model outputs. |
| Internal note full text | Must fail closed. | Use symbolic placeholders only. |
| Audit log full text | Must fail closed. | Use sanitized audit references only. |
| Billing/settlement internal data full text | Must fail closed. | Use symbolic billing/settlement categories only. |
| Production-like exported row | Must fail closed. | Export-shaped rows can still leak real data. |

No future scan should automatically downgrade a must-fail match to acceptable
without human review and documented approval.

## Allowed Symbolic / Policy Terms

Policy terms and symbolic examples may appear in documentation or future test
design when they are clearly non-sensitive.

Allowed examples:

- `line_user_id` as a field-name discussion,
- `DATABASE_URL` as a prohibited-value label,
- phone as a policy term,
- address as a policy term,
- payload as a policy term,
- `org_test_alpha`,
- `org_test_beta`,
- `cust_ref_alpha`,
- `case_ref_alpha`,
- `appointment_ref_alpha`,
- `report_ref_alpha`,
- `token_ref_valid_alpha`,
- `token_ref_expired_alpha`,
- `token_ref_revoked_alpha`,
- `channel_ref_line_alpha`,
- `channel_ref_sms_alpha`,
- `channel_ref_web_alpha`,
- `channel_ref_app_alpha`,
- `channel_ref_email_alpha`.

Allowed terms do not mean real values are allowed.

## False Positive Review Boundary

Future scans may produce policy-word false positives.

Rules:

- If a scan matches a policy word, a human should confirm whether it is only a
  policy term.
- If a scan matches a possible real value, stop and fail closed.
- If it is unclear whether a match is real sensitive data, fail closed.
- Codex must not decide that real sensitive data is acceptable.
- Codex must not redact and continue silently when a future fixture/test file
  contains likely real sensitive data.
- Suspicious content should be reported by file path and field/category name
  only, without printing the sensitive value.

This document does not define an automated scanner. It defines the future
review boundary.

## Fixture Location Coverage

Future sensitive scans should cover:

- fixtures,
- tests,
- documentation examples,
- snapshots,
- API examples,
- local-only runtime demo data,
- logs,
- generated output,
- screenshots,
- exported artifacts,
- sample import files,
- sample customer-facing reports,
- sample notification payloads,
- sample provider payloads.

Task418 does not add a scan script or runtime scanner.

## Channel Identity Scan Rules

Future scans must cover channel identity data across:

- LINE,
- SMS,
- Web Link,
- App,
- Email,
- phone-assisted flow.

Rules:

- `line_user_id` must not be used as global identity.
- Actual `line_user_id` values must not appear in fixtures.
- Raw provider identifiers must not appear in fixtures.
- Phone number must be symbolic, not real.
- Email address must be symbolic, not real contactable data.
- Channel id must be symbolic, not raw provider data.
- Binding state examples must not reveal real customer/channel relationships.

## Token / Link Scan Rules

Future tests should use sanitized token references only.

Rules:

- Raw token must not appear.
- Token-like secrets must fail closed.
- Sanitized token references may describe state symbolically.
- Token states may be represented as valid / expired / revoked / wrong purpose /
  wrong organization / wrong resource.
- Fixture token must not look like a usable secret.
- Token/link fixtures must not encode real customer, report, appointment, or
  channel information.

External response tests must not use token fixture differences to create
existence leakage.

## AI / RAG / Observability Scan Rules

Future AI/RAG/observability fixture scans must fail closed on:

- raw prompt payload,
- raw model response with personal data,
- vector DB dump,
- RAG retrieved sensitive text,
- raw provider payload,
- complete phone number,
- complete address,
- internal note full text,
- audit/security event full text,
- raw token,
- raw channel id.

Rules:

- Observability examples must be sanitized.
- AI fixtures must be synthetic/minimized.
- AI must not use fixture scan results to decide that data can be uploaded,
  externalized, or sent to a provider.
- RAG examples must be symbolic unless a separate synthetic knowledge fixture
  policy is approved.

## Future Checklist Before Fixture/Test Implementation

The checklist below is future-only. Task418 does not implement it.

- Define scan command.
- Define allowed symbolic pattern list.
- Define must-fail sensitive pattern list.
- Define reviewer sign-off format.
- Define CI gate proposal.
- Define artifact cleanup rule.
- Define fixture update checklist.
- Define no-production-data assertion.
- Define no-provider-payload assertion.
- Define no-real-contact-data assertion.
- Define no-raw-token assertion.
- Define no-raw-channel-id assertion.

Each item requires separate future approval before fixture/test implementation.

## Explicit Non-goals

Task418 does not:

- modify `src/`,
- modify `admin/src/`,
- add or modify fixture files,
- add or modify test files,
- add or modify smoke tests,
- add scan scripts,
- add CI configuration,
- run smoke/browser/API/DB tests,
- modify `package.json`,
- modify localization files or message catalogs,
- modify projection utilities,
- modify forbidden field constants,
- implement API / route / controller runtime,
- implement resolver runtime,
- implement repository runtime,
- implement permission runtime,
- implement audit/security event tables,
- implement audit/security event query runtime,
- implement support workflow runtime,
- implement case runtime,
- implement complaint runtime,
- implement follow-up runtime,
- implement link reissue runtime,
- implement rate-limit middleware,
- implement abuse detection runtime,
- add DB access,
- add or modify migration/schema/index,
- execute DB/DDL/psql/`npm run db:migrate`/Migration020 dry-run/apply,
- touch shared/prod/Zeabur runtime,
- add audit write / log runtime / worker,
- trigger LINE/SMS/Email/App/survey/provider sending,
- call AI provider, RAG, vector DB, prompt, worker, or model runtime,
- add file/photo/signature/document storage runtime,
- add billing/settlement/inventory runtime,
- process real token, secret, customer personal data, raw channel data, or raw
  provider payload.

## Decision

Task418 records a future customer-facing fixture sensitive scan checklist only.

Decision summary:

- Future fixture/test/demo data scans should default to fail closed.
- Must-fail matches include real contact data, raw tokens, secrets, actual
  database URLs, raw channel ids, actual channel user ids, provider payloads,
  customer documents, signatures/photos/files, AI prompt/model responses with
  personal data, internal notes, audit logs, billing/settlement internals, and
  production-like exported rows.
- Policy terms and symbolic examples are allowed only as non-sensitive
  documentation or test-design placeholders.
- No scan script, fixture, test, runtime, API, DB, provider, or AI work is
  implemented by Task418.

## Verification Plan

For Task418 completion:

- `git diff --check`
- `npm run check`
- `npm run admin:check`
- Sensitive scan on this document for actual secrets, tokens, complete customer
  personal data, raw channel data, raw provider payload, and production data.

API, DB, browser, smoke, and new unit test commands should not be run for this
docs-only checklist.

## Redaction Note

This document contains symbolic examples and policy terms such as token,
secret, raw channel id, phone, mobile, address, provider payload,
`DATABASE_URL`, `line_user_id`, and Zeabur only as examples of data or runtime
boundaries that must not be exposed or touched without authorization. It does
not include credentials, database URLs, access tokens, secrets, complete
customer phone numbers, complete customer addresses, raw channel identifiers,
raw provider payloads, verification codes, production data details, copied
screenshots, customer documents, signatures, photos, or file contents.
