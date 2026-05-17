# Task 037 - Case Dispatch / Appointment Panel Foundation

## Scope

Task 037 adds the first admin frontend foundation for case dispatch and appointment operations inside the existing `/cases` case detail view.

Included:

- Dispatch / Appointment panel in case detail.
- Dispatch unit picker scoped by `case.organizationId`.
- Optional engineer picker foundation using active users.
- Dispatch assignment create/update.
- Appointment list/create/update/reschedule/cancel foundation.
- Refresh of case detail, case list, and timeline after successful operations.

Not included:

- Route optimization.
- Map / GPS.
- Engineer mobile acceptance workflow.
- AI dispatch engine.
- Notification sending.
- Field service reports.
- Billing / settlement.

## API Routes

Dispatch:

- `POST /api/v1/admin/cases/:caseId/dispatch`
- `PATCH /api/v1/admin/cases/:caseId/dispatch`

Appointments:

- `GET /api/v1/admin/cases/:caseId/appointments`
- `POST /api/v1/admin/cases/:caseId/appointments`
- `PATCH /api/v1/admin/appointments/:appointmentId`

Picker data:

- `GET /api/v1/admin/dispatch-units`
- `GET /api/v1/admin/users`

## Permissions

- `dispatch.manage`: create/update dispatch assignment.
- `appointments.manage`: list/create/update appointments.
- `dispatch_units.manage`: load dispatch unit picker under the current backend permission model.
- `users.read`: load optional engineer picker.
- Admin/system roles are treated as full-access by the existing frontend helper.

If a user lacks a permission, the corresponding UI is hidden or replaced with a read-only notice. Backend permission checks remain the source of truth.

## Organization Scope

The dispatch unit picker uses `case.organizationId` when available:

```text
GET /api/v1/admin/dispatch-units?organizationId=<case.organizationId>&status=active
```

The backend still validates that the selected dispatch unit belongs to the same organization as the case. The frontend does not provide a manual dispatch unit ID fallback, reducing the chance of accidental cross-organization assignment.

Legacy cases without `organizationId` show a warning/fallback behavior based on backend access. Admin/system users may still be able to see broader data if the backend permits it.

## Engineer Picker Foundation

Task 037 uses `GET /api/v1/admin/users` as a conservative foundation fallback. If `users.read` is available, the UI lists active users as optional `assignedEngineerId` candidates.

Current limitation:

- There is no dedicated engineer role filter in this frontend task.
- The picker labels this as a foundation fallback.
- Backend validation remains responsible for checking `userType=engineer` and organization membership.

Future work should add an engineer-specific backend filter or role-aware user picker.

## Dispatch Payloads

Create:

```json
{
  "dispatchUnitId": "DISPATCH_UNIT_UUID",
  "assignedEngineerId": "ENGINEER_USER_UUID",
  "assignmentNote": "optional note"
}
```

Update:

```json
{
  "assignedEngineerId": "ENGINEER_USER_UUID",
  "assignmentNote": "optional note"
}
```

The frontend does not send `dispatchUnitId` during update once the case already has dispatch unit data in case detail.

## Appointment Payloads

Create:

```json
{
  "scheduledStartAt": "2026-05-16T06:00:00.000Z",
  "scheduledEndAt": "2026-05-16T08:00:00.000Z",
  "visitType": "repair",
  "timezone": "Asia/Taipei",
  "note": "optional note"
}
```

Update / reschedule:

```json
{
  "scheduledStartAt": "2026-05-16T07:00:00.000Z",
  "scheduledEndAt": "2026-05-16T09:00:00.000Z",
  "visitType": "repair",
  "timezone": "Asia/Taipei",
  "rescheduleReason": "customer requested later time",
  "note": "optional note"
}
```

Cancel foundation:

```json
{
  "appointmentStatus": "cancelled",
  "rescheduleReason": "customer unavailable"
}
```

The UI requires end time to be later than start time. Reschedule requires `rescheduleReason`. Cancellation requires either a reason or note.

## Status Behavior

Dispatch UI is enabled for:

- `accepted`
- `dispatch_pending`
- `assigned`

Appointment create UI is enabled for:

- `accepted`
- `dispatch_pending`
- `assigned`
- `scheduled`

Backend workflow validation remains final. At the time of this task, backend dispatch update is known to be more conservative than the UI for some post-schedule states.

## Refresh Behavior

After successful dispatch or appointment operations, the frontend refreshes:

- Case detail.
- Case list.
- Timeline/messages.
- Appointment list.

The frontend does not create fake workflow events. It only displays messages returned by the backend.

## How To Run

```bash
npm run admin:check
npm run admin:build
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Manual Test Checklist

1. Login as admin.
2. Open `/cases`.
3. Create or open a test case.
4. Use workflow actions to move the case to `accepted`.
5. Open case detail.
6. Verify Dispatch / Appointment panel renders.
7. Verify dispatch unit picker loads active dispatch units scoped by organization.
8. Create dispatch assignment.
9. Verify case detail, case list, and timeline refresh.
10. Verify appointment list loads.
11. Create appointment.
12. Edit/reschedule appointment with a reason.
13. Cancel appointment if backend supports the payload.
14. Confirm no token, password, secret, customer sensitive payload, audit logs, AI raw payload, OCR raw output, or billing details are shown or logged.

## Security Notes

- API base URL remains controlled by `VITE_API_BASE_URL`.
- No Zeabur domain is hardcoded.
- No token/password/secret/customer payload is logged.
- Dispatch unit same-organization enforcement remains backend-controlled.
- Appointment update payload uses `appointmentStatus`, matching backend validators.

## Known Limitations

- Case detail currently exposes only `dispatchUnitId` and `dispatchAssignmentSource`, not full dispatch assignment detail.
- There is no dedicated dispatch assignment detail endpoint in the frontend.
- Engineer picker is a fallback over active users, not an engineer-specific filtered picker.
- No route optimization, map/GPS, AI dispatch, notification sending, field service, billing, or settlement behavior is included.

## Recommended Next Step

Add a backend/frontend dispatch assignment detail summary if operations need richer reassignment history, then proceed to a field service report panel after dispatch/appointment smoke is stable.
