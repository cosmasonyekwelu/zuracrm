# CHANGELOG

**Product:** ZuraCRM  
**Release:** `v0.7.0`  
**Date:** **Fri, 22 Aug 2025**  
**Time:** **20:15 WAT (Africa/Lagos)**

---

## Summary

This release stabilizes core CRM flows (Leads, Deals, Tasks, Meetings), introduces a full **Calendar Booking** system (settings + public booking), fixes broken **Documents** uploads, aligns **Campaigns** model & UI, wires **Home** stats, and cleans up **Mongoose index** duplication. It also improves API mounting, error handling, and frontend UX.

---

## Highlights

- ✅ Calendar Booking: per-user settings, available slots, and booking (private & public endpoints)  
- ✅ Meetings: v1/v2 payload compatibility, ICS export, bulk delete, status updates, polished UI  
- ✅ Documents: reliable uploads (multer), model + routes, download/open/delete in UI  
- ✅ Campaigns: consistent fields (`channel`, `status`, `startDate`, `endDate`) + better form/table UX  
- ✅ Tasks: normalized schema (`title`, `dueDate`, `with`) + robust UI flow  
- ✅ Home: live stats wiring and “Book now” points to **/meetings**  
- ✅ Backend routing: all routes mounted under **/api**, calendar routes exposed correctly  
- ✅ Fixed Mongoose duplicate index warnings and missing plugin import

---

## Backend

### Routing & App Shell
- **`server/src/app.js`**
  - Mount **all** routes under `/api` to match frontend base URL.
  - Add `/api/health`.
  - Serve static uploads at `/uploads`.
  - Stronger 404 + centralized error handler (keeps 401/403).
  - CORS, JSON, URL-encoding, cookies, morgan.

- **`server/src/routes/index.js`**
  - Ensured modules are mounted:
    - `/auth`, `/users`, `/company`, `/org`
    - `/products`, `/accounts`, `/leads`, `/contacts`, `/deals`, `/tasks`, `/meetings`, `/calls`, `/campaigns`, `/documents`, `/forecasts`, `/pipeline`, `/activities`
    - Platform: `/search`, `/stats`, `/integrations`, `/calendar`, `/security`, `/import`, `/roles`, `/audit`, `/email`, `/docs`
  - **Fix:** Calendar routes now mounted so `GET /api/calendar/settings` works.

### Multi-tenant Utilities
- **`server/src/models/_tenant.js`**
  - `tenantFields` exported for reuse (orgId/ownerId/assignedTo/visibility/sharedWith/audit).
  - `addTenantIndexes(schema)` for `{ orgId, ownerId, createdAt }` compound index.
  - **Fix:** Avoid duplicate index definitions by removing overlapping `index: true` + `schema.index()` collisions.

### Calendar Booking
- **`server/src/routes/calendar.routes.js`**
  - Private: `GET /calendar/settings`, `PATCH /calendar/settings`, `GET /calendar/slots`, `POST /calendar/book`
  - Public: `GET /calendar/public/:slug`, `GET /calendar/public/:slug/slots`, `POST /calendar/public/:slug/book`

- **`server/src/controllers/calendar.controller.js`**
  - Settings with validation (slug, days, time window, duration), unique slug check, and safe defaults.
  - Slot computation with conflict checks against `Meeting` windows.
  - Private `book` creates owner’s meeting; Public `book` for shared booking link (slug).
  - Returns lean, safe payloads.

### Meetings
- **`server/src/routes/meetings.routes.js`**
  - `GET /meetings`, `POST /meetings`, `PATCH /meetings/:id`, `DELETE /meetings/:id`

- **`server/src/controllers/meetings.controller.js`**
  - Accepts **v1** `{title,start,end,location,notes,attendees?}` and **v2** `{title,when,durationMinutes,with,location,status,notes}`.
  - Uses `req.user.orgId` and `req.user.id` to set **required** tenant fields (`orgId`, `ownerId`, `createdBy`, `updatedBy`).
  - List supports search & normalizes records.
  - Update performs upsert-style field mapping and normalizes output.
  - Delete hard-deletes by id.
  - (Relies on `Meeting.toPublic()` if available; otherwise returns canonical fields.)

  > **Fix for earlier error**: `"ownerId" is required` — controller now derives `ownerId` from `auth` middleware for create/update.

### Tasks
- **Model/controller/route** aligned to use:
  - Fields: `title` (required), `dueDate` (Date), `with` (string), `status` in `["Open","In Progress","Completed"]`, `priority` in `["Low","Normal","High"]`, `notes`.
  - Create/Update normalize ISO dates and trim fields.
  - Fixes prior “`subject` is required” by standardizing on **title**.

### Deals
- **`server/src/routes/deals.routes.js`**
  - `GET /deals`, `POST /deals`, `PATCH /deals/:id`
  - `GET /deals/stages` for Kanban columns (names or `{key,name}`)

- Controller adapts to Kanban, stage movement via PATCH, and stage normalization.

### Campaigns
- **`server/src/models/Campaign.js`**
  - Schema aligned with UI: `name` (required), `channel`, `status`, `startDate`, `endDate`, `budget`, `actualCost`, `notes`, plus tenant fields.
  - **Fix:** replace old `{type,status,startAt,endAt}` to new fields.

- **`server/src/routes/campaigns.routes.js`** & controller
  - Full CRUD with search, number coercion, and ISO date handling.

### Documents (Uploads)
- **`server/src/middleware/upload.js`**
  - `multer.diskStorage` to `/server/src/uploads` folder.
  - Predictable filenames: `timestamp-rand.ext`.
  - Creates folder if missing.

- **Model/controller/route**
  - Model fields: `{ name, url, type, sizeKb, uploadedAt }` + tenant fields.
  - `POST /documents` (multipart) returns saved doc; `GET /documents` lists; `DELETE /documents/:id` deletes and removes file.
  - **Fix:** Replaced “Unsupported file type” 500s with robust error handling and permissive defaults.

### Stats
- **`server/src/controllers/stats.controller.js`**
  - `leadStats(req,res)`: `{ total, today }`
  - `dealStats(req,res)`: `{ open, thisWeek }` (open ≈ status/stage heuristic)
  - `activityStats(req,res)`: `{ total, dueToday }` across `Task`, `Meeting`, `Call`
  - `home(req,res)`: aggregates the three for dashboard.
  - **Fix:** Export names corrected to match imports (e.g., `activityStats`).

- **`server/src/routes/stats.routes.js`**
  - `GET /stats/home`, `GET /stats/summary`, `GET /stats`  
  - Mounted under `/api` so Home UI calls succeed.

---

## Frontend

### Home
- **`src/pages/Home.jsx`**
  - Fetches live stats:
    - `GET /api/stats/home` → mini cards
    - `GET /api/stats/summary` / `GET /api/stats` fallbacks handled
  - “**Book Now**” now goes to **`/meetings`** (internal), not an external link.
  - Graceful loading/degraded states.

### Meetings
- **`src/pages/Meetings.jsx`**
  - Clean layout & spacing; accessible controls and small helpers:
    - Local datetime input, relative times (“in 2 hours”)
    - Sorting, status filter, pagination, bulk delete
    - **ICS export** (`.ics` download)
  - Create/Update tries **v1** then **v2** payloads automatically.
  - Optimistic updates with rollback on failure.

### Calendar Booking Settings
- **`src/pages/settings/CalendarBooking.jsx`**
  - Loads/saves to `/api/calendar/settings` with validation for slug/days/time/duration.
  - Shows **API missing** banner if route unmounted (404 handling).
  - Preview available days/time window & first slots, copy public link.
  - Normalizes slug and clamps duration.

### Deals
- **`src/pages/Deals.jsx`**
  - Stage-aware Kanban; supports `GET /deals/stages` returning names or `{key,name}`.
  - Drag & drop updates server via `PATCH /deals/:id { stage }`.
  - **Removed** lingering **account** references (form/search/UI) to prevent 500s.

### Contacts
- **`src/pages/Contacts.jsx`**
  - **Removed** `account` field from form, filters, payload, and table to match API.

### Documents
- **`src/pages/Documents.jsx`**
  - Multipart upload with progress/disabled state.
  - Lists documents with type/size/date; **Open** and **Delete** actions.

### Campaigns
- **`src/pages/Campaigns.jsx`**
  - Aligns with new model:
    - `channel`, `status`, ISO `startDate`/`endDate`
    - Currency formatting (NGN), inline status change, search by name/channel/status
  - Robust add/edit/cancel flows with number coercion and date normalization.

### Tasks
- **`src/pages/Tasks.jsx`**
  - `title` required; `dueDate` date input; `withName` mapped to server `with`.
  - Inline status/priority updates; search on title/with/status; optimistic updates.

---

## Fixes

- **500s on create** (Deals, Tasks, Meetings) due to schema mismatches and missing tenant fields — **resolved**.
- **404s** for `/api/calendar/settings` & `/api/stats/*` — routes now mounted and controllers added.
- **Mongoose duplicate index warnings** on `orgId` and compound `{ orgId, ownerId, createdAt }` — **eliminated** by centralizing index creation.
- **Documents “Unsupported file type”** — replaced with stable multer pipeline and clear errors.

---

## Breaking Changes

- **Campaign model fields renamed**:
  - `type` → `channel`
  - `startAt` → `startDate`
  - `endAt` → `endDate`
- **Tasks** use `title` (not `subject`), `with` (not `withName` server-side).
- **Contacts/Deals UI**: `account` field removed from forms and list views.

> If you have scripts or imports depending on old field names, update them to the new schema.

---

## Migration Notes

1. **Database**
   - No destructive migrations were run, but if you had custom indexes duplicating those in `_tenant.js`, drop the duplicates.
   - Optional: backfill `Campaign` fields (`channel`, `startDate`, `endDate`) from legacy fields if your DB contains old data.

2. **Env/Static**
   - Ensure server can write to `server/src/uploads`. The app creates it if missing.

3. **Auth**
   - Meetings/Tasks/Deals creation requires `auth` middleware to populate `req.user.orgId` & `req.user.id`.

---

## API Endpoints Added/Changed

- **Calendar**
  - `GET/PATCH /api/calendar/settings`
  - `GET /api/calendar/slots?date=YYYY-MM-DD`
  - `POST /api/calendar/book`
  - Public: `GET /api/calendar/public/:slug`, `/slots`, `POST /book`

- **Meetings**
  - `GET /api/meetings` (search)
  - `POST /api/meetings` (v1/v2 payloads)
  - `PATCH /api/meetings/:id`
  - `DELETE /api/meetings/:id`

- **Documents**
  - `GET /api/documents`
  - `POST /api/documents` (multipart)
  - `DELETE /api/documents/:id`

- **Stats**
  - `GET /api/stats/home`, `GET /api/stats/summary`, `GET /api/stats`

- **Deals**
  - `GET /api/deals/stages`

---

## QA Checklist (done)

- Meetings:
  - Create, edit, delete; v1/v2 payloads; ICS export; pagination; status change.
- Calendar:
  - Settings GET/PATCH; slug clash (409); slots generation; private/public booking (409 conflict on overlap).
- Documents:
  - Upload PNG/PDF/DOCX tested; list/open/delete; 400 surfaced to UI.
- Campaigns:
  - CRUD; date inputs; NGN formatting; inline status updates.
- Tasks:
  - CRUD; inline status/priority; search; date handling.
- Home:
  - Stats populated; “Book now” navigates to `/meetings`.

---

## Timeline (WAT)

- **18:05** — Fix Mongoose duplicate indexes; centralize tenant indexes.  
- **18:20** — Remove `account` field from Contacts & Deals UI.  
- **18:40** — Repair Deals routes/controller; enable Kanban & stage API.  
- **18:55** — Implement Documents model/controller/routes + upload middleware.  
- **19:10** — Align Campaign model & UI; handle dates and currency.  
- **19:20** — Rework Tasks model/controller & UI (`title`, `dueDate`, `with`).  
- **19:30** — Meetings controller/routes (v1/v2 support), ICS, UI polish.  
- **19:40** — Calendar Booking controller/routes; Settings page overhaul.  
- **19:50** — Home stats wiring; stats controller & routes; “Book now” → `/meetings`.  
- **20:05** — Route mounting audit; `/api/calendar/settings` and `/api/stats/*` verified.

---

*Prepared on **Fri, 22 Aug 2025, 20:15 WAT (Africa/Lagos)**.*
