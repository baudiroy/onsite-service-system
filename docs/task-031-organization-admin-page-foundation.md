# Task 031 Organization Admin Page Foundation

## Scope

Task 031 replaces the `/organizations` placeholder with the second real admin feature page.

Included:

- Organization list with pagination.
- Keyword search and status filter.
- Create organization.
- Edit organization name and status.
- Organization detail view.
- Permission-based read / manage UI behavior.

Not included:

- SaaS tenant billing.
- Organization switcher.
- Full ABAC.
- LINE channel management.
- Notification routing.
- User organization membership assignment UI.

## API Routes

The admin frontend uses the existing backend Organization Admin APIs:

- `GET /api/v1/admin/organizations`
- `POST /api/v1/admin/organizations`
- `GET /api/v1/admin/organizations/:organizationId`
- `PATCH /api/v1/admin/organizations/:organizationId`

User organization membership APIs already exist, but this task does not add organization assignment UI to the user detail drawer.

## Permission Rules

- `/organizations` is visible through the menu when the actor has `organizations.read`.
- Admin/system users are treated as full access for the menu and page foundation.
- `organizations.read` can list organizations and open details.
- `organizations.manage` can create and edit organizations.
- Users without `organizations.manage` see a read-only table.

## Organization Fields

The page renders only:

- `id`
- `organizationCode`
- `organizationName`
- `status`
- `createdAt`
- `updatedAt`

The edit form keeps `organizationCode` read-only because the backend update validator only accepts `organizationName` and `status`.

## Security Rules

- The frontend does not render secret-like fields.
- If an organization API response unexpectedly includes sensitive keys, development mode logs only a key-level warning and ignores the value.
- The page does not log token, password, channel secrets, access tokens, API keys, or storage secrets.
- The page does not hardcode the Zeabur API domain.

Sensitive keys intentionally ignored include:

- `password`
- `password_hash`
- `passwordHash`
- `token`
- `accessToken`
- `channelSecret`
- `channelAccessToken`
- `secret`
- `apiKey`
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `R2_SECRET_ACCESS_KEY`

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
2. Open `/organizations`.
3. Verify the organization list loads.
4. Search by organization code or organization name.
5. Filter by active / disabled.
6. Click refresh.
7. Create a test organization such as `task031-org-<timestamp>`.
8. Open detail view.
9. Verify the future note section is visible.
10. Edit organization name or status.
11. Verify the table reflects the update.
12. Inspect the browser console and confirm no password, token, or secret is logged.
13. Re-open `/users` and verify the users page still loads.
14. Verify dashboard, login, and logout still work.

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

## Task 031 Verification Result

Verified against Zeabur API:

```text
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app
```

Result:

- Admin login succeeded.
- `/organizations` loaded the backend organization list.
- Created test organization through the Zeabur API:
  - `organizationCode`: `task031-org-1778887997`
  - `organizationName`: `Task031 Test Organization`
- Updated test organization through the Zeabur API:
  - `organizationName`: `Task031 Test Organization Updated`
  - `status`: `disabled`
- The `/organizations` frontend displayed the updated organization row.
- Organization detail view opened successfully.
- Future note section displayed user membership, LINE/notification routing, and organization switching notes.
- Detail view and table did not render secret-like fields.
- `/users` still loaded after the Organization page changes.
- `/dashboard` still loaded.
- Logout returned to `/login`.
- Browser console inspection did not show password, token, or secret values.

Note: the in-app browser automation available during this verification could not type into modal inputs because its virtual clipboard was unavailable. The same create/update backend flows were verified with Zeabur API calls, and the frontend was verified to render the resulting backend state.

## Known Limitations

- Organization membership assignment UI remains future work.
- LINE channel management remains future work.
- Organization switching remains future work.
- Tenant billing and full ABAC remain future work.

## Recommended Next Step

After this page is stable, add either:

- Organization picker support to the User Admin detail drawer for membership assignment, or
- Dispatch Unit Admin Page Foundation, using organizations as the source for organization scope selection.
