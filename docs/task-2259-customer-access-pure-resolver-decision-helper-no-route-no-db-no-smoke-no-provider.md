# Task2259 - Customer Access Pure Resolver Decision Helper

## Summary

This task adds a standalone pure Customer Access resolver decision helper and focused unit tests. It does not wire the helper into routes, resolvers, handlers, repositories, DTOs, app/server, DB, providers, smoke, or runtime paths.

## Added Files

- `src/customerAccess/customerAccessResolverDecisionHelper.js`
- `tests/customerAccess/customerAccessResolverDecisionHelper.unit.test.js`

## Helper Contract

The helper accepts a plain input object containing explicit trusted `customerAccessContext` plus an already-safe projection or projection lookup result. It returns a new decision object and never mutates input.

Allowed allow decision fields:

- `allowed`
- `status`
- `messageKey`
- `projection`

Allowed projection fields:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

Allowed public attachment fields:

- `attachmentId`
- `label`
- `mimeType`

Denied, missing, malformed, unauthorized, conflicting, cross-scope, or unavailable input returns a generic unavailable decision:

- `allowed: false`
- `status: deny`
- `messageKey: customerAccess.unavailable`

## Guardrails

- The helper is pure and standalone with no imports.
- The helper trusts only explicit `customerAccessContext`, not raw body, query, headers, cookies, session, user, provider payload, debug, or env containers.
- The helper requires verified customer identity, organization scope match, case linkage, publication allowed, and customer-visible policy passed before allow.
- The helper does not use client-controlled internal fields to authorize access.
- The helper omits raw internal identifiers, raw Case/Appointment/Completion Report / Field Service Report objects, repository/DB rows, audit data, provider internals, AI/RAG/vector/OpenAI data, billing/settlement/payment/invoice data, debug/internal fields, SQL, token, password, and secret fields.
- Safe-deny output does not reveal Case/report existence or raw denial details.
- This task does not change Customer Access route/API/DTO/projection/resolver behavior or customer-facing report runtime behavior outside adding the standalone pure helper.

## Verification

- `node --test tests/customerAccess/customerAccessResolverDecisionHelper.unit.test.js`
- `node --test tests/customerAccess/customerAccessContextSourceBoundary.static.test.js`
- `node --test tests/customerAccess/customerAccessResolverSafeDenyBehavior.static.test.js`
- `node --test tests/customerAccess/customerFacingProjectionAllowlist.static.test.js`
- `node --test tests/customerAccess/customerServiceReportSafeEnvelopePresenter.unit.test.js`
- `node --test tests/customerAccess/customerServiceReportSafeEnvelopePresenterBoundary.static.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`

## Held Docs

The 7 held historical untracked docs remain untouched, unstaged, and untracked.
