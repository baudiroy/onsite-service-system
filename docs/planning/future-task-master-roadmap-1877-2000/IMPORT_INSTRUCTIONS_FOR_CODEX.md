# Import Instructions for Codex

Place this directory under:

```text
docs/planning/future-task-master-roadmap-1877-2000/
```

This packet is planning-only. Do not execute Task1877–Task2000 by importing these files.

Suggested import task:

```text
Task1877P — Import Future Task Master Roadmap 1877–2000 / Planning Only / No Runtime
```

Allowed:
- Add these Markdown files only.
- Run `git status --short`.
- Run `npm run check` if available, or documented equivalent syntax/static check if npm is unavailable.
- Commit only the planning files.

Suggested commit message:

```text
Task1877P add future task master roadmap
```

Forbidden:
- No runtime/source changes.
- No DB, SQL, migration, seed.
- No Zeabur/deploy/smoke.
- No provider calls.
- No secrets printed.
- No push unless separately approved.
- Do not touch held historical untracked docs.
