# Task 975 - Staging-Prep Docs Batch Manifest / Task964-Task974 / Docs Only / No Git Mutation

## Purpose

Create a docs-only manifest for the worktree organization, staging manifest, and dry-run verification documents themselves.

This keeps staging-prep and management docs separate from feature/runtime batches:

- Repair Intake functional batch.
- Engineer Mobile functional batch.
- Data Correction functional batch.
- Customer Access functional batch.

No real git mutation was performed. This task did not run a real `git add`, commit, reset, restore, checkout, clean, `rm`, `mv`, `cp`, DB command, migration command, smoke test, provider call, AI/RAG flow, admin change, API shape change, or runtime modification.

Only this Task975 documentation file was created.

## Recommended Staging-Prep Docs Batch

Existing management/staging-prep docs checked for this batch:

- `docs/task-964-worktree-inventory-and-commit-grouping-plan-docs-only-no-git-mutation.md`
- `docs/task-965-first-batch-staging-manifest-repair-intake-runtime-stack-docs-only-no-git-mutation.md`
- `docs/task-966-second-batch-staging-manifest-engineer-mobile-task921-task933-docs-only-no-git-mutation.md`
- `docs/task-970-repair-intake-first-batch-staging-dry-run-verification-no-git-mutation.md`
- `docs/task-971-engineer-mobile-second-batch-staging-dry-run-verification-no-git-mutation.md`
- `docs/task-972-third-batch-staging-manifest-data-correction-customer-access-docs-only-no-git-mutation.md`
- `docs/task-973-data-correction-third-batch-staging-dry-run-verification-no-git-mutation.md`
- `docs/task-974-customer-access-third-batch-staging-dry-run-verification-no-git-mutation.md`

Optional self-inclusion if PM later wants the manifest included in the same management-docs batch:

- `docs/task-975-staging-prep-docs-batch-manifest-task964-task974-docs-only-no-git-mutation.md`

## Explicit Exclusions

This management-docs batch intentionally excludes:

- All functional source/test files.
- Repair Intake runtime stack paths.
- Engineer Mobile runtime/read-only paths.
- Data Correction source/test/docs feature batches, except the staging-prep docs listed above.
- Customer Access source/test/docs feature batches, except the staging-prep docs listed above.
- Task967-Task969 Repair Intake API-prep docs, because they are functional Repair Intake follow-up docs rather than staging-prep management docs.
- tracked bootstrap/runtime/smoke/migration files.
- migrations and fixtures.
- package files.
- `admin/src`.
- provider, LINE, SMS, App, email, webhook work.
- AI/RAG.
- billing or settlement work.
- Task902.

## Inspection Results

Read-only commands used:

- `git status --short`
- `git status --short -- docs/task-964*.md docs/task-965*.md docs/task-966*.md docs/task-970*.md docs/task-971*.md docs/task-972*.md docs/task-973*.md docs/task-974*.md`
- `git ls-files --others --exclude-standard -- docs/task-964*.md docs/task-965*.md docs/task-966*.md docs/task-970*.md docs/task-971*.md docs/task-972*.md docs/task-973*.md docs/task-974*.md`
- `git diff --check -- docs/task-964*.md docs/task-965*.md docs/task-966*.md docs/task-970*.md docs/task-971*.md docs/task-972*.md docs/task-973*.md docs/task-974*.md`

Results:

- The broader worktree still contains many pre-existing modified and untracked files.
- The eight existing management/staging-prep docs listed above are all untracked.
- `git ls-files --others --exclude-standard` returned the same eight existing management/staging-prep docs.
- `git diff --check` returned no output for the checked management/staging-prep docs.
- No dry-run staging was needed or performed for Task975.
- No index/staging state was mutated.

## Suggested Future Git Add Command

Do not run this command in Task975. Use it only if PM explicitly authorizes real staging for the management-docs batch:

```bash
git add -- \
  docs/task-964-worktree-inventory-and-commit-grouping-plan-docs-only-no-git-mutation.md \
  docs/task-965-first-batch-staging-manifest-repair-intake-runtime-stack-docs-only-no-git-mutation.md \
  docs/task-966-second-batch-staging-manifest-engineer-mobile-task921-task933-docs-only-no-git-mutation.md \
  docs/task-970-repair-intake-first-batch-staging-dry-run-verification-no-git-mutation.md \
  docs/task-971-engineer-mobile-second-batch-staging-dry-run-verification-no-git-mutation.md \
  docs/task-972-third-batch-staging-manifest-data-correction-customer-access-docs-only-no-git-mutation.md \
  docs/task-973-data-correction-third-batch-staging-dry-run-verification-no-git-mutation.md \
  docs/task-974-customer-access-third-batch-staging-dry-run-verification-no-git-mutation.md \
  docs/task-975-staging-prep-docs-batch-manifest-task964-task974-docs-only-no-git-mutation.md
```

Before any actual staging, rerun:

```bash
git status --short -- \
  docs/task-964-worktree-inventory-and-commit-grouping-plan-docs-only-no-git-mutation.md \
  docs/task-965-first-batch-staging-manifest-repair-intake-runtime-stack-docs-only-no-git-mutation.md \
  docs/task-966-second-batch-staging-manifest-engineer-mobile-task921-task933-docs-only-no-git-mutation.md \
  docs/task-970-repair-intake-first-batch-staging-dry-run-verification-no-git-mutation.md \
  docs/task-971-engineer-mobile-second-batch-staging-dry-run-verification-no-git-mutation.md \
  docs/task-972-third-batch-staging-manifest-data-correction-customer-access-docs-only-no-git-mutation.md \
  docs/task-973-data-correction-third-batch-staging-dry-run-verification-no-git-mutation.md \
  docs/task-974-customer-access-third-batch-staging-dry-run-verification-no-git-mutation.md \
  docs/task-975-staging-prep-docs-batch-manifest-task964-task974-docs-only-no-git-mutation.md
```

## Risk Notes

- These docs describe staging strategy, inventory, and dry-run evidence. They can be staged in a management-docs commit or omitted from production feature commits depending on repo policy.
- They should not be mixed into feature/runtime commits unless PM explicitly wants them included.
- Task967-Task969 should remain with the Repair Intake functional/API-prep discussion, not this management-docs batch.
- `git status --short -- <paths>` should be checked again before actual staging because the worktree is still a large local patch stack.

## Next PM Decision Options

1. Authorize actual `git add` for the exact verified Repair Intake Task965/970 batch.
2. Authorize actual `git add` for the exact verified Engineer Mobile Task966/971 batch.
3. Authorize actual `git add` for the exact verified Data Correction Task973 batch.
4. Authorize actual `git add` for the exact verified Customer Access Task974 batch.
5. Authorize actual `git add` for the management-docs batch listed in this Task975 manifest.
6. Resume runtime without staging.
