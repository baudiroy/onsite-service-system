# Task2063 — Customer-Facing Projection HTTP Boundary Malformed Service Result Guard

## Scope

- No DB changes.
- No migrations, SQL, seeds, schema, indexes, psql, db commands, dry-run, or migration apply.
- No repository query changes.
- No route/controller/global mount changes.
- No `src/app.js`, `src/server.js`, `public.routes.js`, or route registration changes.
- No Zeabur, env, runtime smoke, endpoint probes, provider sending, admin frontend, AI/RAG/provider/model calls, or billing/settlement/payment/invoice work.
- The 7 held historical untracked docs were left untouched.

## Runtime Guard

The customer-facing service report projection HTTP boundary now validates projection service results before choosing an HTTP status or JSON body.

Malformed service results, thrown errors, rejected promises, raw `Error` objects, arrays, dates, class instances, thenables, unsafe nested payloads, and invalid envelope shapes fail closed to the sanitized unavailable safe-deny envelope:

```json
{
  "status": "deny",
  "messageKey": "customerAccess.unavailable",
  "customerVisible": false,
  "data": null,
  "error": {
    "messageKey": "customerAccess.unavailable"
  }
}
```

The HTTP status for thrown, rejected, malformed, or unsafe service results remains `404`.

Valid allow responses must keep the established `serviceReport` allowlist:

- `customerReportReference`
- `caseReference`
- `serviceStatus`
- `appointmentWindow`
- `engineerDisplayName`
- `serviceSummary`
- `completionTime`
- `publicAttachments`

Valid public attachment items remain limited to:

- `attachmentId`
- `label`
- `mimeType`

## Regression Notes

- Task2058 `serviceSummary` remains sourced only from `approved_service_summary`.
- Task2061 `completionTime` remains sourced only from `completion_time`.
- Task2060 public attachment item keys remain `attachmentId`, `label`, and `mimeType`.
- Task2059 `serviceReport` top-level allowlist remains unchanged.
- Task2062 malformed projection row behavior remains unchanged.
