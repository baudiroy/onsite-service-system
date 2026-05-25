# Task748 - Basic Brand Referral API Normalization Slice

## Goal

Add the first bounded runtime slice for Basic brand referral: a minimal app/API normalization adapter that accepts request-like input, calls the existing pure `normalizeBrandReferralRequest`, and returns a safe normalized envelope only.

This slice does not create Case / intake draft, verify identity, bind Case, write audit/contact log, persist DB records, call provider runtime, or call AI/RAG runtime.

## Changed Files

- `src/brandChannel/brandReferralApp.js`
- `tests/brandChannel/brandReferralApiNormalization.unit.test.js`
- `docs/task-748-basic-brand-referral-api-normalization-slice-no-db-no-case-creation.md`

## Runtime Boundary

The adapter exposes:

- `normalizeBrandReferralApiRequest(request)`
- `createBrandReferralApp()`

The response shape is:

- `statusCode`
- `body.ok`
- `body.messageKey`
- `body.referral`

`body.referral` is the safe normalizer envelope with:

- normalized safe metadata
- no-runtime grants
- `reasonKey`
- `requiredNextStep`

## Non-goals

Task748 does not:

- mount a public route
- start a server
- create a Case
- create a repair intake draft
- verify identity
- bind a Case
- grant customer access
- write audit/contact log
- call provider / LINE / SMS / App push / webhook runtime
- call AI/RAG runtime
- persist DB records
- check or mutate entitlement / billing runtime
- expose raw provider payloads
- expose raw `line_user_id`
- expose full phone / address or other sensitive values

## Verification

Required commands:

```sh
node --test tests/brandChannel/brandReferralApiNormalization.unit.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- src/brandChannel/brandReferralRequestNormalizer.js src/brandChannel/brandReferralApp.js tests/brandChannel/brandReferralApiNormalization.unit.test.js docs/task-748-basic-brand-referral-api-normalization-slice-no-db-no-case-creation.md
```
