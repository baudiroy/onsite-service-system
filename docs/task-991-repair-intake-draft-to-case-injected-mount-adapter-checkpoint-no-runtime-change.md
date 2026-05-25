# Task991 Repair Intake Draft-to-Case Injected Mount Adapter Checkpoint

## Accepted Continuation Range

Task991 records the accepted Repair Intake draft-to-Case injected mount adapter continuation:

- Task989 injected HTTP mount adapter
- Task990 HTTP mount adapter static boundary guard

## Branch Status

After Task991, this continuation is accepted, checkpointed, and paused.

## Current Capability

Task989 adds an injected-only mount adapter that can mount a Task967-style API module envelope onto an explicitly injected mount target. It supports:

- `mountTarget.post(path, handler)`
- `mountTarget[method.toLowerCase()](path, handler)`
- `mountTarget.register(method, path, handler)`

The adapter validates the injected mount target, API module envelope, route method/path/handler, and optional safe `basePath` before mounting. It never executes route handlers during mount and returns sanitized mount summaries only:

```js
{
  ok: boolean,
  mounted: number,
  routes: [
    { method: 'POST', path: '/repair-intake/drafts/:draftId/case/plan' },
    { method: 'POST', path: '/repair-intake/drafts/:draftId/case/submit' }
  ],
  reasonCode: string,
  requiredActions: string[]
}
```

Task990 guards the mount adapter from importing or referencing global app/bootstrap, route indexes, public route files, OpenAPI/DTO, DB/repositories, providers, AI/admin/billing, smoke/shared runtime, migrations, package runtime, and sensitive-field strings.

This capability is not global app route mounting. It is an injected adapter only.

## Explicit Non-Goals Preserved

The checkpoint preserves these non-goals:

- no `src/app.js`, `src/server.js`, `src/routes/index.js`, or `src/routes/public.routes.js` modification
- no global app mount
- no public route registration
- no DTO/OpenAPI
- no DB execution, psql, SQL dry-run, or `npm run db:migrate`
- no migration creation/apply
- no smoke/shared runtime
- no provider sending
- no LINE/SMS/App/email/webhook sending
- no AI/RAG
- no admin frontend
- no billing/settlement/payment/invoice
- no git staging/commit/cleanup
- no Task902

## Future Explicit Authorization Gates

Future work must remain separately bounded and explicitly authorized before crossing any of these gates:

- global app/bootstrap route mounting
- DTO/OpenAPI publication
- disposable DB dry-run
- migration/schema review
- smoke/integration runtime
- staged git add / commit batch for Task989-Task991

## Handoff Warning

Task989-Task991 remain local, uncommitted, and untracked until a separate staging/commit task is authorized.

The broader dirty worktree still contains a large local/uncommitted/untracked patch stack and must not be cleaned, reverted, relocated, or restaged blindly.

## Verification

Required commands:

```bash
git diff -- docs/task-991-repair-intake-draft-to-case-injected-mount-adapter-checkpoint-no-runtime-change.md
git diff --check -- docs/task-991-repair-intake-draft-to-case-injected-mount-adapter-checkpoint-no-runtime-change.md
git status --short -- docs/task-991-repair-intake-draft-to-case-injected-mount-adapter-checkpoint-no-runtime-change.md
git diff --cached --name-only
```
