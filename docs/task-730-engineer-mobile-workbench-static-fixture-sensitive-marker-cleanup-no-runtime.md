# Task 730 — Engineer Mobile Workbench Static Fixture Sensitive Marker Cleanup / No Runtime Change

## Scope

This task cleans up Engineer Mobile Workbench synthetic fixture marker strings that were intentionally used as forbidden-field examples but were too similar to real credential names for broad static leak scans.

## Changes

- Replaced bare `DATABASE_URL` fixture markers with `databaseConnectionConfigMarker`.
- Replaced channel credential examples containing `channel_secret` / `access_token` wording with neutral credential markers.
- Replaced `rawBinaryRefs...` with `rawFileRefs...` so the synthetic fixture does not trip broad raw binary scans.
- Replaced `no-internal-risk-...` wording with `no-internal-riskindicator...` to avoid accidental `sk-...` API-key-like pattern matches.
- Updated Engineer Mobile Workbench static tests to assert the neutral marker names.

## Runtime Decision

No runtime behavior changed.

This task did not modify backend routes, controllers, services, repositories, API behavior, DB schema, migrations, admin frontend source, smoke scripts, package metadata, providers, AI/RAG runtime, LINE/SMS/App push logic, or customer channel identity runtime.

## Guardrails

- Synthetic fixtures remain clearly synthetic.
- No real credentials, tokens, raw LINE identifiers, customer phone numbers, or production payloads were added.
- Customer-facing visibility, organization isolation, source-data-only completion submission, and one Case / one formal Field Service Report guardrail markers remain covered by static tests.

## Verification

- `node --test tests/engineerMobileWorkbench/*.js`: PASS, 108 passed / 0 failed.
- `find tests -type f -name '*.js' -print | xargs node --test`: PASS, 1622 passed / 0 failed.
- `npm run check`: PASS.
- `git diff --check`: PASS.
