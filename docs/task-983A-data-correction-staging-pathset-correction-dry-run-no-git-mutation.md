# Task983A - Data Correction Staging Pathset Correction Dry-Run / No Git Mutation

## Scope

Task983A documents and verifies a corrected Data Correction staging path set after Task983 stopped before staging.

No real `git add`, commit, reset, restore, checkout, clean, delete, move, DB command, migration command, smoke/shared runtime command, provider call, AI/RAG flow, admin change, or source/test/runtime modification was performed.

Only this Task983A documentation file was created.

## Blocker Summary

Task983 attempted to stage the exact 263 Data Correction paths parsed from Task973. Git stopped before staging because one Task973 docs path was stale:

`docs/task-888-data-correction-decision-audit-injected-writer-path-no-real-db-no-api-shape-change.md`

Git reported:

```text
fatal: pathspec 'docs/task-888-data-correction-decision-audit-injected-writer-path-no-real-db-no-api-shape-change.md' did not match any files
```

After that failure:

- `git diff --cached --name-only` had no output.
- The index remained clean.
- No partial staging occurred.
- No reset, restore, clean, or corrective staging was attempted.

## Corrected Path

Replace this stale path:

`docs/task-888-data-correction-decision-audit-injected-writer-path-no-real-db-no-api-shape-change.md`

With this actual existing path:

`docs/task-888-data-correction-decision-audit-injected-writer-path-closure-guard-no-real-db-no-api-shape-change.md`

Verification:

- The corrected Task888 path exists.
- `git status --short -- docs/task-888-data-correction-decision-audit-injected-writer-path-closure-guard-no-real-db-no-api-shape-change.md` returns `??`.

## Corrected Candidate Verification

The corrected Data Correction candidate set is still 263 paths:

- 20 `src/dataCorrection` paths.
- 2 adjacent Data Correction controller/route paths.
- 75 `tests/dataCorrection` paths.
- 166 Data Correction task docs.

Verification results:

- Corrected candidate count: 263.
- Missing path check over the corrected candidate set: no output.
- `git diff --cached --name-only` before dry-run: no output.
- `git status --short -- <corrected exact 263 Data Correction paths>`: all corrected candidate paths are untracked (`??`).
- `git ls-files --others --exclude-standard -- <corrected exact 263 Data Correction paths>`: returned the corrected 263 paths.
- `git diff --name-only -- <corrected exact 263 Data Correction paths>`: no output.
- `git diff --check -- <corrected exact 263 Data Correction paths>`: passed with no output.

## Dry-Run Result

`git add --dry-run -- <corrected exact 263 Data Correction paths> | wc -l` returned:

```text
263
```

After dry-run:

- `git diff --cached --name-only` had no output.
- The index remained clean.
- No real staging occurred.

## Exclusions Preserved

The corrected dry-run did not include:

- Customer Access paths.
- Repair Intake committed paths.
- Engineer Mobile committed paths.
- Task964 through Task980 staging-prep docs.
- Task967 through Task969 API-prep continuation paths.
- Task902.
- Task972 or Task973 staging-prep docs.
- Tracked bootstrap/runtime files.
- `src/app.js`.
- `src/server.js`.
- `src/routes/index.js`.
- `src/routes/public.routes.js`.
- Smoke scripts.
- Migrations or fixtures.
- Package files.
- Admin, provider, AI/RAG, or billing files.

## Next PM Decision Options

- Authorize actual staging using the corrected exact 263-path Data Correction set.
- Split Data Correction into smaller sub-batches.
- Pause.
