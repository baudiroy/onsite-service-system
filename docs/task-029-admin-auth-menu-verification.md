# Task 029 Admin Auth Menu Verification

## Scope

Task 029 hardens the admin frontend authentication foundation without adding full business CRUD pages.

Covered areas:

- API client bearer token handling.
- 401 logout behavior.
- current user loading.
- protected route behavior.
- role / permission menu visibility.
- current route status for formal foundation pages and remaining placeholders.

## API Base URL

Set the backend API base URL through Vite env only:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

For Zeabur API verification:

```bash
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app
```

The frontend source must not hardcode the Zeabur production domain.

## Start Admin Frontend

From the repository root:

```bash
npm run admin:dev
```

Or from the admin package:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

Default local URL:

```text
http://127.0.0.1:5173
```

## Login Verification

1. Open `/login`.
2. Enter the admin email and password.
3. Submit the form.
4. The frontend calls `POST /api/v1/auth/login`.
5. On success, the frontend stores `accessToken`.
6. The frontend calls `GET /api/v1/auth/me`.
7. The user is redirected to `/dashboard`.

The UI must not log password, token, or secrets.

## Current User Verification

On `/dashboard`, verify:

- display name is shown.
- email is shown.
- user type is shown.
- status is shown.
- roles and permission count are shown.

Current backend `/api/v1/auth/me` returns enough for the first menu foundation:

- `id`
- `email`
- `displayName`
- `mobile`
- `userType`
- `status`
- `authProvider`
- `lastLoginAt`
- `roles`
- `permissions`

Future organization switcher work may need organization membership summary in `/auth/me`.

## Protected Route Verification

1. Clear local token or open a fresh browser profile.
2. Navigate directly to `/dashboard`.
3. The app should redirect to `/login`.

Refresh behavior:

1. Login successfully.
2. Refresh `/dashboard`.
3. The app reads the local token.
4. The app calls `GET /api/v1/auth/me`.
5. The app remains on `/dashboard` if the token is valid.

Invalid token behavior:

1. If backend returns `401 AUTH_REQUIRED`, the API client clears local token.
2. AuthProvider clears `currentUser`.
3. The protected route sends the user back to `/login`.

## Logout Verification

1. Click logout in the topbar.
2. The app attempts `POST /api/v1/auth/logout`.
3. The app clears local token regardless of backend logout behavior.
4. The app clears `currentUser`.
5. The app redirects to `/login`.

## Role-Based Menu Verification

Menu foundation:

- Dashboard is visible to any authenticated user.
- Admin/system users can see every enabled menu item.
- Other users see only items matching their permissions or roles.
- Missing or empty `roles` / `permissions` arrays must not crash the UI.

Menu permission mapping:

| Menu | Rule |
| --- | --- |
| Dashboard | authenticated |
| 使用者管理 | `users.read` |
| 組織管理 | `organizations.read` |
| 派工單位管理 | `dispatch_units.manage` |
| 案件管理 | `cases.read` |
| 派工 / 預約 | `dispatch.manage` or `appointments.manage` |
| 到府服務紀錄 | `service_reports.manage` |
| 帳務 / 結算 | `billing.manage` |
| 客戶詢問 | `cases.read` for Phase 1 |
| AI 任務 | `ai.read` |
| Audit Logs | `audit_logs.read` |
| 通知設定 | `notifications.read` |
| 系統設定 | `admin` or `system` role |

## Current Admin Routes

The following routes have since been promoted from Task 029 placeholders into formal foundation pages:

- `/users` - User Admin Page foundation.
- `/organizations` - Organization Admin Page foundation.
- `/dispatch-units` - Dispatch Unit Admin Page foundation.
- `/cases` - Case Management Page foundation.

The following routes remain placeholders:

- `/dispatch-appointments`
- `/field-service`
- `/billing-settlement`
- `/customer-inquiries`
- `/ai-jobs`
- `/audit-logs`
- `/notifications`
- `/settings`

Each remaining placeholder shows a title, short description, and a note that the API integration will be added in later tasks.

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

## Task 029 Verification Result

Verified against Zeabur API:

```text
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app
```

Results:

- Login page rendered at `/login`.
- Admin login succeeded through `POST /api/v1/auth/login`.
- Current user loaded through `GET /api/v1/auth/me`.
- `/dashboard` displayed current user identity, role, permission count, and API base URL.
- Admin/system menu showed all enabled entries.
- At the time of Task 029, placeholder routes opened successfully for core future modules, including users, dispatch / appointment, field service, billing / settlement, and audit logs. Since then, `/users`, `/organizations`, `/dispatch-units`, and `/cases` have been promoted to formal foundation pages.
- Refresh on an authenticated route preserved the session by reloading current user from the stored token.
- Logout attempted `POST /api/v1/auth/logout`, cleared local token, and returned to `/login`.
- Direct `/dashboard` access without a token redirected to `/login`.
- Invalid token backend behavior returns `401 AUTH_REQUIRED`; the frontend API client clears local token on 401 and lets the route guard return to login.
- Browser console inspection did not show application logs containing password, access token, or secrets.

## Known Limitations

- Task 029 itself did not implement business CRUD pages. Later tasks promoted `/users`, `/organizations`, `/dispatch-units`, and `/cases` to formal foundation pages.
- The admin frontend uses simple browser history routing without React Router to keep the foundation lightweight.
- Organization switching is not implemented yet.
- `/auth/me` does not currently include organization memberships in the auth DTO.
