# Task 165 - Reverse LINE Binding Handoff QA / Next Branch Selection / No Runtime Change

## Background

Task165 performs QA on the reverse LINE binding handoff and prepares next-branch selection.
It does not implement APIs, migrations, Admin UI, LINE / LIFF flows, LINE push, or runtime behavior.

This task checks that Tasks158-164 are consistent, do not imply runtime approval, and keep sensitive output and inventory freeze boundaries intact.

## No-runtime-change Statement

Task165 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- add tests,
- add a migration file,
- change schema or indexes,
- apply or dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- implement invitation APIs,
- implement token generation,
- implement LIFF / LINE trusted context,
- implement Admin UI,
- send LINE / APP / SMS / email,
- implement survey runtime,
- write survey intents or event outbox rows,
- implement AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Reviewed:

- `docs/task-158-existing-case-reverse-line-binding-product-design-no-runtime-change.md`
- `docs/task-159-reverse-line-binding-data-model-proposal-no-migration.md`
- `docs/task-160-reverse-line-binding-api-contract-no-runtime-change.md`
- `docs/task-161-reverse-line-binding-admin-ux-operator-runbook-no-runtime-change.md`
- `docs/task-162-reverse-line-binding-security-abuse-case-review-no-runtime-change.md`
- `docs/task-163-reverse-line-binding-implementation-readiness-gate-no-runtime-change.md`
- `docs/task-164-reverse-line-binding-design-freeze-implementation-handoff-no-runtime-change.md`

Static QA focused on:

- source-of-truth consistency,
- freeze wording,
- non-approval wording,
- branch wording,
- sensitive output warnings,
- Admin UX boundary,
- API boundary,
- security / fail-closed boundary,
- survey compatibility,
- inventory docs freeze.

No patch to Tasks158-164 was required.

## Handoff Consistency QA

Findings:

- Tasks158-164 all state no runtime behavior change.
- Tasks158-164 consistently separate reverse LINE binding from Case completion and Field Service Report completion.
- Tasks158-164 consistently preserve `organization_id + line_channel_id + line_user_id` as the LINE identity scope.
- Tasks158-164 consistently reject using raw LINE user id as a public form input.
- Task159 proposes data model only and does not create a migration file.
- Task160 proposes API contract only and does not implement routes.
- Task161 proposes Admin UX only and does not modify Admin frontend.
- Task162 marks security / abuse controls as future requirements.
- Task163 marks runtime readiness as blocked.
- Task164 freezes design but explicitly states freeze is not approval.

Conclusion:

- handoff package is internally consistent,
- no blocker-level contradiction found,
- current package is safe to freeze and pause.

## Non-approval QA

Confirmed:

- freeze does not approve migration,
- freeze does not approve migration file authoring,
- freeze does not approve DB dry-run,
- freeze does not approve DB apply,
- freeze does not approve runtime APIs,
- freeze does not approve Admin UI implementation,
- freeze does not approve LINE / LIFF runtime,
- freeze does not approve LINE push,
- freeze does not approve survey runtime or survey delivery,
- freeze does not approve shared runtime mutation.

Important interpretation rule:

General wording such as "continue", "next", "go ahead", or "keep working" is not enough to start migration, DB, API runtime, Admin runtime, LINE push, survey runtime, or shared runtime changes.

## Sensitive Output QA

Confirmed design boundaries:

- do not output `DATABASE_URL`,
- do not output password / token / secret values,
- do not output raw LINE user id,
- do not output customer mobile / phone / tel values,
- do not output raw provider payload,
- do not output full Case / Customer / Report payload,
- do not output LINE channel secret / access token,
- token hash and plaintext token remain sensitive,
- public responses remain generic.

Task165 sensitive scan may match policy words such as "token", "lineUserId", or "customer mobile"; those are documentation warnings, not actual secret values.

## Branch Options After Task165

Safe branch options:

1. Continue docs-only QA / keep paused.
2. Start reverse LINE binding migration proposal, no migration file.
3. Start API implementation planning, no runtime code.
4. Start Admin UX implementation planning, no Admin code.
5. Start trusted LINE / LIFF flow design, no runtime.
6. Return to another product mainline area.

Unsafe without explicit approval:

- migration file authoring,
- DB dry-run,
- DB apply,
- runtime API implementation,
- Admin UI implementation,
- LINE / LIFF runtime,
- LINE push,
- survey runtime,
- survey sending,
- shared runtime mutation.

## Approval Interpretation Rules

Treat the following as insufficient for runtime / DB approval:

- "continue",
- "do next",
- "keep going",
- "go ahead",
- "do 20 tasks",
- "follow the workflow",
- "make progress".

Require explicit approval for:

- migration file authoring,
- local-only dry-run,
- DB apply,
- psql / DB connection,
- runtime API implementation,
- Admin UI implementation,
- LINE / LIFF runtime,
- LINE push,
- survey runtime,
- shared runtime mutation.

Approval should name the branch and scope.
For DB work, it must identify safe local/test target and exclude shared / production runtime.

## Safe User Branch Selection Prompt

Suggested prompt for the user:

```text
Reverse LINE binding design is now frozen as a docs-only package.
Please choose one next branch:

1. Continue docs-only QA / keep paused.
2. Start reverse LINE binding migration proposal, no migration file.
3. Start API implementation planning, no runtime code.
4. Start Admin UX implementation planning, no Admin code.
5. Start trusted LINE / LIFF flow design, no runtime.
6. Return to another product mainline area.

Do not paste DATABASE_URL, secrets, raw LINE user id, customer mobile, raw payload, or production data.
```

## QA Findings Matrix

| Area | Finding | Severity | Recommended action | Patched in Task165? | Required before Task166? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Source-of-truth index | Tasks158-164 have clear roles | Info | Keep Task164 as handoff entry | No | No | Consistent |
| Freeze scope | Freeze covers product/API/data/security/Admin UX | Info | Preserve freeze package | No | No | Stable |
| Non-approval wording | Task164 explicitly says freeze is not approval | Info | Keep branch approval explicit | No | No | Strong enough |
| Branch options | Task164 lists safe default and migration alternative | Info | Use Task165 prompt | No | No | Clear |
| Sensitive output | Warnings repeated across package | Info | Continue scanning docs | No | No | No actual values found |
| Admin UX boundary | Invitation UX separated from manual raw-ID tool | Info | Keep separation | No | No | Good boundary |
| API boundary | Admin vs public/trusted context split defined | Info | Do not implement from manual tool | No | No | Good boundary |
| Security/fail-closed | Task162 covers abuse / fail-closed | Info | Keep as pre-runtime gate | No | No | Good boundary |
| Survey compatibility | Binding does not trigger survey/send | Info | Keep resolver separate | No | No | Consistent |
| Inventory freeze | No Task087 inventory guide changes | Info | Keep frozen | No | No | No inventory expansion |

No blocker or warning requiring immediate patch was found.

## Any Docs Patches Made

No patches were made to Tasks158-164.

Task165 only adds this QA / branch selection document.

## Task166 Recommendation

Default recommendation if the user has not explicitly selected a branch:

```text
Task166 - Reverse LINE Binding Final Pause Summary / No Runtime Change
```

Scope:

- docs-only,
- summarize Tasks158-165,
- mark reverse LINE binding line paused,
- state next branch requires explicit user choice,
- no implementation.

If the user explicitly chooses migration proposal path:

```text
Task166 - Reverse LINE Binding Migration Proposal / No Migration
```

Scope:

- docs-only,
- draft future `line_binding_invitations` migration proposal,
- no migration file,
- no apply,
- no runtime.

## Final Recommendation

Task158-165 are consistent and ready to pause as the reverse LINE binding design / handoff package.

Do not proceed to migration, DB, runtime API, Admin UI, LINE / LIFF runtime, LINE push, or survey runtime without explicit branch selection and approval.

Default next step should be a final pause summary unless the user chooses a specific planning branch.

## Non-goals

Task165 does not design or implement:

- backend runtime,
- Admin frontend runtime,
- API clients,
- migration files,
- schema / indexes,
- smoke tests,
- token generation,
- rate limit middleware,
- LIFF integration,
- webhook binding runtime,
- LINE push,
- APP push,
- SMS / email,
- survey sending,
- survey intent / event outbox writes,
- AI automatic decisions,
- inventory docs changes,
- destructive cleanup.

## Verification

Recommended verification for Task165:

- `npm run check`
- `npm run admin:check`
- `git diff --check`
- sensitive information scan for actual credential / customer / raw provider values.
