# Task 032 Dispatch Unit Admin Page Foundation

## Scope

This task promotes `/dispatch-units` from a placeholder to the first foundation version of the Dispatch Unit Admin page in the React/Vite admin frontend.

It only covers dispatch unit master data management. It does not implement route optimization, map/GPS features, engineer mobile workflows, AI dispatch automation, or a full dispatch scheduling screen.

## API Routes

- `GET /api/v1/admin/dispatch-units`
- `POST /api/v1/admin/dispatch-units`
- `GET /api/v1/admin/dispatch-units/:dispatchUnitId`
- `PATCH /api/v1/admin/dispatch-units/:dispatchUnitId`
- `DELETE /api/v1/admin/dispatch-units/:dispatchUnitId`
- `GET /api/v1/admin/organizations` for the organization picker when available

## Permission Rules

- The page is controlled by `dispatch_units.manage`, matching the current backend route permission.
- Admin/system users are treated as fully privileged through the existing auth helper foundation.
- The frontend does not implement a separate read-only mode because the current backend does not expose `dispatch_units.read`.

## Organization Picker And Scope

- Create requires an `organizationId`.
- The page uses the Organization Admin API as the preferred picker source.
- If the organization list cannot be loaded, the page remains usable and falls back to manual `organizationId` input.
- `organizationId` is read-only in the edit form and is never sent in PATCH payloads.
- Backend organization scope remains the source of truth for cross-organization access enforcement.

## Supported UI

- List dispatch units with organization, name, code, service region, city, product types, priority, status, created time, and updated time.
- Filter by organization, keyword, status, and service region.
- Create dispatch unit.
- Read detail, including formatted `routingRules` JSON.
- Update name, code, service region, status, city, product types, priority, and routing rules.
- Disable dispatch unit through the DELETE endpoint.

## Safety Notes

- The page does not render secret-like fields.
- API base URL still comes from `VITE_API_BASE_URL`; no Zeabur domain is hardcoded.
- Passwords, tokens, and secrets are not logged.
- Large routing rules are shown only in the detail modal, not flattened into the table.

## Verification

Run:

```bash
npm run admin:check
npm run admin:build
```

Optional Zeabur API manual check:

```bash
cd admin
VITE_API_BASE_URL=https://onsite-service-api.zeabur.app npm run dev
```

Manual smoke:

- Login as admin.
- Open `/dispatch-units`.
- Confirm organizations load in the picker or fallback input appears.
- Create a test dispatch unit.
- View detail.
- Edit fields.
- Disable the test dispatch unit.
- Re-check `/users`, `/organizations`, `/dashboard`, login, and logout.

## Known Limitations

- No route optimization.
- No map/GPS integration.
- No engineer assignment UI.
- No AI dispatch engine.
- No full dispatch scheduling page.
- Current permission model uses `dispatch_units.manage` for both read and write.

## Suggested Next Step

The next low-risk frontend task can be either a Cases list foundation or a Dispatch/Appointment operational overview, depending on whether the product priority is intake review or dispatch execution.
