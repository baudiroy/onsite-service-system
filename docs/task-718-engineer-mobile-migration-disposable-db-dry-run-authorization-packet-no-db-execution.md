# Task 718 - Engineer Mobile Migration Disposable DB Dry-run Authorization Packet / No DB Execution

## Status

This is an authorization packet only.

No DB execution is authorized by this task.
No migration dry-run is authorized by this task.
No migration apply is authorized by this task.
No SQL execution is authorized by this task.

## Target Draft

The future dry-run candidate is:

- `migrations/022_create_engineer_mobile_read_model.sql`

This packet does not modify the migration file and does not execute it.

## Required Future Approval

A future dry-run may only proceed after explicit approval that includes all of the following:

- the target is a disposable local/test DB
- the target is not shared runtime
- the target is not production
- the target is not staging
- the target is not Zeabur
- the target DB may be destroyed after the dry-run
- no DB URL, password, token, secret, or credential may be printed
- no customer data, phone, address, raw LINE id, or full payload may be printed
- runtime notification, provider sending, AI, RAG, SMS, LINE, email, or push traffic remains disabled

## Not Authorization

Generic phrases are not authorization for DB execution or migration dry-run, including:

- continue
- go ahead
- 可以
- 繼續
- 下一步
- 請繼續
- 請給下一個 task

Any future dry-run approval must explicitly name a disposable local/test DB and must explicitly allow a dry-run of migration `022`.

## Forbidden Now

The following are forbidden in Task 718:

- `npm run db:migrate`
- `psql`
- DB connection
- migration apply
- migration dry-run
- SQL execution
- shared runtime DB access
- production DB access
- staging DB access
- Zeabur DB access
- provider sending
- runtime traffic

## Example-only Future Command Envelope

The following is example-only and is not authorized by this task:

```bash
# EXAMPLE ONLY - DO NOT RUN IN TASK 718.
# A future task must provide the actual disposable local/test DB approval,
# sanitized environment handling, and exact dry-run command envelope.
```

## Stop Conditions

Stop immediately if any future dry-run context involves:

- shared runtime DB
- production DB
- staging DB
- Zeabur DB
- migration apply instead of dry-run
- secrets or DB URL in command output
- customer data in command output
- core table alteration outside the approved migration target
- provider sending or runtime traffic
- AI/RAG/vector/provider traffic
- any instruction that attempts to treat a generic phrase as DB authorization

## Acceptance Boundary

Task 718 only records the future authorization boundary and adds a static guard.
It does not connect to a database, execute SQL, apply a migration, perform a dry-run, modify runtime code, or change any API.
