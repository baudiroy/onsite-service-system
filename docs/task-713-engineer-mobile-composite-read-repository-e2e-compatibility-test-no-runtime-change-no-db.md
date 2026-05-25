# Task 713 - Engineer Mobile Composite Read Repository E2E Compatibility Test / No Runtime Change / No DB

## Summary

Task 713 added a bounded integration test for the Task 712 composite Engineer Mobile read repository.

The test verifies that one injected composite repository can support both existing mounted Engineer Mobile routes:

```text
createEngineerMobileReadRepository(...)
-> useRequestAwareProvider:true
-> createApp / createServerBootstrap
-> GET /engineer-mobile/tasks
-> GET /engineer-mobile/tasks/:appointmentId
```

## Coverage

The integration test covers:

- composite repository default mode fail-closes and does not call the executor
- synthetic `allowNonExecutableForTest=true` mode calls the shared executor for list route
- synthetic mode calls the shared executor for detail route
- same app list route returns assigned scoped tasks
- same app detail route returns matching assigned task detail
- wrong organization rows are excluded from list and detail
- wrong engineer rows are excluded from list and detail
- wrong appointment id is excluded from detail
- missing auth and missing permission are denied before executor use
- `customer_service` and `ai` roles are denied before executor use
- list and detail query specs passed to the executor are frozen and placeholder based
- `createServerBootstrap({ engineerMobile })` list/detail paths work without `listen`
- `options.app` priority bypasses the Engineer Mobile repository and executor

## Safety Boundary

The test uses synthetic sentinel strings only. It does not connect to a database, execute SQL, apply migrations, send provider messages, run AI/RAG/vector code, or touch browser/smoke tests.

The test asserts redaction of:

- raw phone / raw address / raw LINE id
- token / secret / `DATABASE_URL`
- internal note / audit log
- AI raw payload
- billing / settlement internal data
- unsafe evidence refs
- `finalAppointmentId` / `final_appointment_id`

## Runtime Boundary

Task 713 did not change:

- `src/`
- `admin/src/`
- routes / controllers / app / server
- real DB client or SQL executor
- migrations / schema / indexes
- package files
- smoke / browser scripts
- guardrails / design docs

## Future Tasks

- Wire the composite repository as the standard Engineer Mobile read repository only in a separate bounded runtime task.
- Add real DB-backed executors only after explicit DB/runtime approval.
- Make list/detail query specs executable only in a bounded DB task.
- Add disposable DB dry-run coverage only after an approved local-only DB packet.
- Add Engineer Mobile UI and browser smoke only after frontend scope approval.
