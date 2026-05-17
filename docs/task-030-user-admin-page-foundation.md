# Task 030 User Admin Page Foundation

## Scope

Task 030 replaces the `/users` placeholder with the first real admin feature page.

Included:

- User list with pagination.
- Keyword search and status filter.
- Create user.
- Edit display name and status.
- Disable user.
- User detail view.
- Read-only roles section.
- Read-only organization memberships section.
- Permission-based read / manage UI behavior.

Not included:

- Password reset.
- Invitation email.
- MFA.
- Role assignment UI.
- Organization assignment UI.
- Full IAM policy editor.

## API Routes

The admin frontend uses the existing backend User Admin APIs:

- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/users/:userId`
- `PATCH /api/v1/admin/users/:userId`
- `DELETE /api/v1/admin/users/:userId`
- `GET /api/v1/admin/users/:userId/roles`
- `POST /api/v1/admin/users/:userId/roles`
- `DELETE /api/v1/admin/users/:userId/roles/:roleId`
- `GET /api/v1/admin/users/:userId/organizations`
- `POST /api/v1/admin/users/:userId/organizations`
- `DELETE /api/v1/admin/users/:userId/organizations/:organizationId`

The role and organization assignment API client functions exist, but the Task 030 UI keeps those sections read-only because role / organization option selectors are not part of this task.

## Permission Rules

- `/users` is visible through the menu when the actor has `users.read`.
- Admin/system users are treated as full access for the menu and page foundation.
- `users.read` can list users and open details.
- `users.manage` can create, edit, and disable users.
- Users without `users.manage` see a read-only table.

## Security Rules

- The frontend never renders `password_hash` or `passwordHash`.
- If the user API unexpectedly includes a password field key, development mode logs only a key-level warning and ignores the value.
- Create user accepts a password only in the form state needed for submit.
- The password field is cleared after submit.
- The page does not log password, token, or secrets.

## Start Admin Frontend

From the repository root:

```bash
npm run admin:dev
```

For Zeabur API verification:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

## Manual Verification

1. Login as admin.
2. Open `/users`.
3. Verify the user list loads.
4. Search by email or display name.
5. Filter by active / disabled.
6. Click refresh.
7. Create a test user such as `task030-user-<timestamp>@example.com`.
8. Verify the table does not show `password_hash` or `passwordHash`.
9. Open detail view.
10. Verify roles section loads or shows an empty state.
11. Verify organizations section loads or shows an empty state.
12. Edit display name or status.
13. Disable the test user.
14. Verify the status displays as `停用`.
15. Inspect the browser console and confirm no password, token, or secret is logged.

## Build Verification

From the repository root:

```bash
npm run admin:check
npm run admin:build
```

From the admin package:

```bash
cd admin
npm run check
npm run build
```

## Task 030 Verification Result

Verified against Zeabur API:

```text
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app
```

Result:

- Admin login succeeded.
- `/users` loaded the backend user list.
- Keyword search worked with the test user email.
- Status filter worked for disabled users.
- Refresh kept the current filtered result usable.
- Created test user: `task030-user-1778886141167@example.com`.
- User detail opened successfully.
- Roles section loaded and showed an empty state when no role data existed.
- Organizations section loaded and showed an empty state when no membership data existed.
- Edited display name to `Task030 Test User Updated`.
- Disabled the test user successfully.
- Disabled user displayed as `停用`.
- Table and detail view did not render `password_hash` or `passwordHash`.
- Browser console inspection did not show password, token, or secret values.

## Known Limitations

- Role assignment UI is not implemented yet.
- Organization membership assignment UI is not implemented yet.
- There is no role list / organization picker on the user detail view yet.
- The page uses the current lightweight router from Task 028 / Task 029.
- Organization switching is still a future task.

## Recommended Next Step

Add either:

- role / organization assignment controls for the user detail drawer, or
- an Organization Admin page so user membership assignment can use a proper organization picker.
