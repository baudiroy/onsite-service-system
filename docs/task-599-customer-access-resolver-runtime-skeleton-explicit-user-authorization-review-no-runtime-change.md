# Task 599 - Customer Access Resolver Runtime Skeleton Explicit User Authorization Review

## Scope

Task599 is a docs-only explicit user authorization review for the possible future Customer Access Resolver runtime skeleton.

Task599 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test code changes.
- no fixture changes.
- no API.
- no route / controller.
- no DTO / projection.
- no DB.
- no migration.
- no provider sending.
- no AI.

Task599 does not authorize implementation.

## Current Baseline Recap

Current accepted baseline:

- Task574 through Task578: resolver static baseline closed.
- Task579: runtime authorization packet completed.
- Task580 through Task582: pure function skeleton proposal, readiness gate, and exact implementation packet completed.
- Task583 through Task584: unit test plan and exact implementation packet completed.
- Task585 through Task586: response envelope proposal and exact implementation packet completed.
- Task587 through Task589: authorization reviews completed.
- Task590 through Task592: explicit authorization packets completed.
- Task593: resolver skeleton final go / no-go review completed; result NO-GO.
- Task594: unit test final go / no-go review completed; result NO-GO.
- Task595: response envelope final go / no-go review completed; result NO-GO.
- Task596: runtime skeleton authorization request draft completed; explicitly non-current authorization.
- Task597: runtime skeleton branch PM handoff completed.
- Task598: runtime skeleton final scope lock completed.

Current state:

```text
RUNTIME SKELETON STILL NOT AUTHORIZED
```

## Explicit Authorization Review Conclusion

TASK599 REVIEW RESULT: NO EXPLICIT USER AUTHORIZATION FOR RUNTIME SKELETON HAS BEEN GRANTED YET.

Task599 only reviews whether explicit user authorization currently exists.

The user has not explicitly authorized creating:

```text
src/customerAccess/customerAccessResolver.js
```

Current completed work is limited to docs-only planning, review, final scope lock, and authorization request drafting.

Task599 must not treat generic continuation phrases as runtime authorization.

The following phrases are not sufficient authorization:

- "continue".
- "go ahead".
- "可以".
- "繼續".
- "下一步".
- "請給下一個 task".
- "請繼續開發".

Task599 does not:

- create `src/customerAccess/customerAccessResolver.js`.
- create `resolveCustomerAccess`.
- create a unit test.
- create a response envelope helper.
- change runtime behavior.

## Required Future Authorization Wording

If the user wants to authorize the first runtime skeleton later, the authorization must be explicit and scoped.

Acceptable future authorization wording should be similar to:

```text
我明確授權 Codex 在 Task601 建立 src/customerAccess/customerAccessResolver.js。
本次只允許 pure function skeleton，不允許 API / DB / migration / provider / AI。
允許執行 node --check src/customerAccess/customerAccessResolver.js 與 git diff --check -- src/customerAccess/customerAccessResolver.js。
```

This wording is only a future authorization example.

Task599 records this future wording but does not grant authorization.

## Future Exact Authorized Scope if User Grants GO Later

If the user explicitly grants GO later, the first runtime skeleton must still be locked to:

```text
src/customerAccess/customerAccessResolver.js
```

The future implementation must be:

- single file only.
- pure function only.
- deterministic input to decision output.
- side-effect free.
- fail-closed by default.
- no DB.
- no repository.
- no route / controller.
- no DTO / projection.
- no provider.
- no AI / RAG.
- no audit log write.
- no file storage access.
- no Field Service Report write.
- no appointment write.
- no publication state write.
- no customer identity write.
- no `finalAppointmentId` modification.

## Future Allowed Commands if User Grants GO Later

If a later task separately authorizes actual implementation, suggested allowed commands are:

```bash
node --check src/customerAccess/customerAccessResolver.js
git diff --check -- src/customerAccess/customerAccessResolver.js
```

Task599 must not run the `node --check` command above because Task599 does not create the runtime skeleton file.

Task599 may only run:

```bash
git diff --check -- docs/task-599-customer-access-resolver-runtime-skeleton-explicit-user-authorization-review-no-runtime-change.md
```

## Stop Conditions for Future Implementation

Future implementation must stop and report to PM if it appears to require:

- DB access.
- repository access.
- route / controller.
- customer-facing endpoint.
- DTO / projection implementation.
- response envelope implementation.
- unit test implementation unless separately authorized.
- audit log write.
- provider sending.
- AI / RAG.
- migration / schema.
- package change.
- permission runtime.
- entitlement runtime.
- customer identity runtime write.
- publication state write.
- real customer PII.
- token / secret.
- LINE credential.
- changes outside the exact authorized file.

## Mandatory Invariants

Any future work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Next Task Candidates

Candidates only; do not execute from Task599:

- Task600 - PM Continuation Handoff after Customer Access Resolver Runtime Skeleton Readiness / No Runtime Change.
- Task601 - Customer Access Resolver Pure Function Skeleton / Exact Files Only / No API / No DB, only if user explicitly authorizes exact `src/` change.
- Task602 - Customer Access Resolver Runtime Skeleton Reconfirmation Gate / No Runtime Change.

Task599 does not start Task600.

## Non-goals

Task599 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task598 documents.

Task599 does not run:

- `npm test`.
- `npm run test`.
- `npm run smoke`.
- `npm run db:migrate`.
- `psql`.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- `node --check src/customerAccess/customerAccessResolver.js`.
- `node --check src/customerAccess/customerAccessResponseEnvelope.js`.
- DB / migration / API / browser / provider sending commands.

## Guardrails Review

Task599 remains aligned with `PROJECT_GUARDRAILS.md`:

- documentation-only.
- no runtime behavior change.
- no schema or migration change.
- no API change.
- no permission runtime change.
- no audit log runtime change.
- no customer channel identity runtime change.
- no organization isolation runtime change.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
