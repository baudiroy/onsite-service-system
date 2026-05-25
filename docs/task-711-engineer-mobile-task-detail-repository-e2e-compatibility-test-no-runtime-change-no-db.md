# Task 711 - Engineer Mobile Task Detail Repository E2E Compatibility Test / No Runtime Change / No DB

## Summary

Task 711 added a bounded integration test for the Task 710 Engineer Mobile task detail repository.

The test verifies that the repository can be injected through the existing request-aware Engineer Mobile app/server path:

```text
createEngineerMobileTaskDetailReadRepository(...)
-> getTaskDetail / getReadModel
-> createApp / createServerBootstrap engineerMobile useRequestAwareProvider
-> GET /engineer-mobile/tasks/:appointmentId
```

## Coverage

The integration test covers:

- repository default mode fail-closes and does not call the executor
- synthetic `allowNonExecutableForTest=true` mode calls the injected executor
- app detail route maps auth and route `appointmentId` into the detail repository path
- matching organization / engineer / appointment returns safe detail
- wrong organization / engineer / appointment rows are excluded
- missing auth and missing permission are denied before executor use
- `customer_service` and `ai` roles are denied before executor use
- executor throw returns safe unavailable response without raw error leakage
- `createServerBootstrap({ engineerMobile })` detail path works without `listen`
- `options.app` priority bypasses engineerMobile repository and executor
- list route remains safe empty when a detail-only repository is provided

The test also checks that the query spec passed to the injected executor is frozen, placeholder-based, and does not interpolate raw organization / engineer / appointment ids into SQL text.

## Safety Boundary

Task 711 does not modify runtime source. It does not connect to a database, execute SQL, apply migrations, send provider messages, run AI/RAG/vector code, or touch browser/smoke tests.

The repository output remains safe-projected through the Task 709 mapper and existing detail route response handling. The test asserts that the response does not leak:

- raw phone / raw address / raw LINE id
- token / secret / `DATABASE_URL`
- internal note / audit log
- AI raw payload
- billing / settlement internal data
- unsafe evidence refs
- `finalAppointmentId` / `final_appointment_id`

## Runtime Boundary

Task 711 did not change:

- `src/`
- `admin/src/`
- routes / controllers / app / server
- real DB client or SQL executor
- migrations / schema / indexes
- package files
- smoke / browser scripts
- guardrails / design docs

## Future Tasks

- Add real DB-backed detail repository only after explicit DB/runtime approval.
- Make detail query specs executable only in a bounded DB task.
- Add disposable DB dry-run coverage only after an approved local-only DB packet.
- Add Engineer Mobile UI detail page and browser smoke only after frontend scope approval.
