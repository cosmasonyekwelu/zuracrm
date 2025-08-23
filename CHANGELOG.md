# Changelog

All notable changes to **Zura CRM** will be documented in this file.


# \[Unreleased]

## Planned

* Settings UX refactor (handled in a new chat/thread).
* Bulk admin tools (role templates, org-wide defaults).
* Email/calendar provider integrations and webhooks.

---

[2.1.0] – 2025-08-22
Fixed

Meeting creation 500s caused by ownerId being required: the controller and model now work even if a project uses owner (new) or ownerId (legacy). Validation no longer hard-fails when only one is present.

Controller sets both fields when creating: owner and ownerId ← req.user.id.

Model adds compatibility glue so either field is accepted and mirrored.

Errors now return 400 with details instead of generic 500.

Added

Calendar endpoints to support booking UI:

GET /api/calendar/settings, PATCH /api/calendar/settings

GET /api/calendar/slots?date=YYYY-MM-DD

POST /api/calendar/book

Meetings extras:

GET /api/meetings/:id.ics – download ICS

POST /api/meetings/:id/rsvp – attendee RSVP

POST /api/meetings/:id/forward – add/forward invitee

Changed

Meetings API accepts flexible payloads and normalizes them internally:

You can send { title, when, durationMinutes } or { title, start, end }.

Attendees normalized to { name?, email?, userId?, response }.

Responses include computed fields: title, when, durationMinutes.

# \[2.1.0] – 2025-08-22

## Added

* **Multi-tenant & role model across core objects**

  * Introduced shared tenant fields on most models: `orgId`, `owner`, `teamIds`, `visibility`, `createdBy`, `updatedBy`.
  * Server-side scoping helpers to ensure queries are restricted to `req.user.orgId`.
  * `requireRole()` middleware for admin-only endpoints.
* **Invites**

  * Invite flow to add users into an existing org.
  * `Invite` model supports `token`, `email`, `role`, `profile`, `status`, `invitedBy`, plus optional `expiresAt`.
  * Controllers to **list** and **revoke** invites; `register` now accepts `inviteToken`.
* **Forecasts**

  * `GET /api/forecasts/summary` — pipeline totals and simple monthly projection.
  * Heuristic stage-probability map (edit in controller).
* **Deals**

  * `GET /api/deals/stages` for UI configuration (accepts string array or `{key,name}` objects).
  * Kanban drop → `PATCH /api/deals/:id` updates `stage`.
* **Documents**

  * `/api/documents/:id/download` endpoint for secure file download.
  * Multer storage with per-type upload directory; sanitized filenames.
* **Sales Docs (Quotes / Invoices / SalesOrders)**

  * Unified **Doc** base model with discriminators: `Quote`, `Invoice`, `SalesOrder`.
  * Auto-recalculation of line totals via shared `ItemSchema` (`qty`, `unitPrice`, `discount`, computed totals).
* **Products**

  * Zod validation schemas and REST routes (`GET /products?search=`, `POST /products`, `PATCH /products/:id`, etc.).
  * Text index on `name`, `sku`, `description`.
* **Auth**

  * Aliases: `/signup|/register`, `/signin|/login`, `/signout|/logout`.
  * `GET /auth/me` returns normalized public user payload.

### Changed

* **Auth middleware** now attaches `req.user = { id, orgId, role, name }` after JWT verification; rejects missing/expired tokens with 401.
* **`register` controller**:

  * With `inviteToken`: user joins inviter’s org with invite role/profile; invite marked `accepted`.
  * Without token: creates a new Org and sets user as `admin` & org owner.
* **API client (`src/services/api.js`)**

  * Unified Axios instance with base: `${VITE_API_URL || http://localhost:4000}/api`.
  * Optional cookie mode; Bearer token auto-attached from `localStorage("auth.token")`.
  * Response normalizer returns `items` arrays for list endpoints.
  * Helper `AuthAPI` for `signin/signup/signout/me`.
* **Frontend pages**

  * **Deals** Kanban made stage-key aware and resilient to differing stage shapes.
  * **Products** page now uses string inputs, converts numeric types on submit, and supports live search.
  * **Forecasts** falls back to local computation when `summary` endpoint is absent (doesn’t crash).
* **Validation**

  * Switched to **Zod** in `validate()` middleware: parses `body`, `query`, `params`; consistent 400 with issue list.

### Fixed

* Missing export in `documents.controller` (`download`) that caused route import error.
* `products.routes` crash due to absent `products.schema.js`.
* 404 on `/api/pipeline` by documenting/adding explicit pipeline routes.
* Multiple 401 loops by guarding `/auth/me` call in frontend when no token (token-mode).
* Deals stage fetch 500s by aligning `Pipeline` model and stages endpoint.

### Removed

* Legacy `_lineItem.js` (replaced by shared `ItemSchema` in `models/common.js`).
* Various ad-hoc role checks scattered in controllers (centralized via `requireRole()`).

### Security

* **Rate limits** for auth endpoints via `authLimiter`.
* Consistent org-scoped queries to prevent cross-tenant data leakage.
* JWT signing now includes `{ sub, orgId, role, name }` with configurable expiration.

### Migration Notes

* **Users**

  * Ensure all existing users have a valid `orgId`. Backfill script: set org per tenant then re-issue tokens.
* **Models**

  * Add tenant fields (`orgId`, `owner`, `visibility`, etc.) to: Leads, Contacts, Deals, Tasks, Calls, Meetings, Documents, Campaigns, Quotes, SalesOrders, Invoices, Products (where applicable).
  * Update indexes to include `orgId` in uniqueness constraints (e.g., `sku+orgId` instead of global `sku`).
* **Invites**

  * If using `expiresAt`, ensure indexes or cleanup job for stale invites. UI should surface “Invite expired”.
* **API**

  * Consumers should prefer new endpoints:

    * `GET /forecasts/summary`
    * `GET /deals/stages`
    * `GET /documents/:id/download`
  * Frontend expects list responses to either be `[]` or `{ items: [] }`.

---

# \[2.0.0] – 2024-11-xx

## Added

* Baseline multi-module CRM: Auth, Leads, Contacts, Deals, Activities, Products, Sales Docs, Documents, Campaigns, Forecasts.
* Initial Org model (`name`, `logoUrl`, `domain`, `settings`).
* File uploads for Documents.
* Basic dashboard & navigation.

---

# \[1.0.0] – 2024-06-xx

## Added

* Initial public release with authentication, simple CRUD for core objects, and minimal UI.

---

## Notes

* For local dev:

  * **Backend**: `PORT=4000`, `MONGO_URI=mongodb://127.0.0.1:27017/zura`, `JWT_SECRET=***`, `CORS_ORIGIN=http://localhost:5173`.
  * **Frontend**: `VITE_API_URL=http://localhost:4000`, optional `VITE_USE_COOKIES=true|false`.
* Follow commit messages with `feat:`, `fix:`, `docs:`, `refactor:`, etc., to keep this changelog accurate.

---

