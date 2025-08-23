
# Zura CRM — Product Requirements Document (PRD)
**Version:** 1.0  
**Date:** 2025-08-22 18:43 UTC

## 1) Overview
Zura CRM is a lightweight, multi‑tenant CRM focused on speed, clarity, and interoperability. It provides core sales objects (Leads, Accounts, Contacts, Deals), activity tracking (Tasks, Meetings, Calls), simple Campaign management, and self‑serve Calendar Booking.

Primary goals:
- Sales teams capture/track work quickly.
- Managers see pipeline and activity snapshot at a glance.
- Prospects/clients can book meetings through a simple public link.

Out of scope (v1):
- Payments, quotes, advanced marketing automation, file/document processing (intentionally disabled in this build).

## 2) Personas & Key Jobs
- **Ayo (Account Exec):** create leads, log tasks/calls, schedule meetings, move deals.
- **Nkechi (SDR):** quick lead capture from web/events, schedule intro calls.
- **Bolu (Sales Manager):** monitor open deals, weekly changes, activity volume, hiring readiness.
- **Prospect:** book a time via public booking page.

## 3) Success Metrics (v1)
- T90% of actions < 150ms server p95.
- Create new lead < 10 seconds end‑to‑end.
- ≥ 1 meeting booked from public link in a demo run.
- Zero 500s in happy-path flows during a 30‑minute demo.

## 4) Functional Requirements
### 4.1 Authentication & Tenanting
- Email+password auth with JWT.
- All data is scoped by `orgId`; user has `role` (owner/admin/user).
- CORS/CSRF safe defaults for localhost dev.

### 4.2 CRM Objects
- **Leads**: CRUD, status (`New|Contacted|Qualified|Unqualified`).
- **Accounts/Contacts**: CRUD, minimal schema; contacts optionally tied to accounts.
- **Deals**: CRUD, stage & probability, amount, close date.
- **Tasks**: CRUD, `status`, `priority`, `dueDate`, free‑text `with`, quick inline status/priority edits.
- **Meetings**: CRUD, dual payload support
  - v1: `{subject,start,end,location,notes,attendees?}`
  - v2: `{title,when,durationMinutes,with,location,status,notes}`
  Export `.ics`. Status changes inline.
- **Calls**: CRUD, basic outcome tracking.
- **Campaigns**: CRUD with `{name, channel, status, startDate, endDate, budget, actualCost, notes}`.
- **Stats**: `/stats/home`, `/stats/summary`, `/stats` aggregate counts for homepage.

### 4.3 Calendar Booking
- Per‑user settings: `slug`, available `days`, working window `start/end` (HH:MM), `duration` minutes.
- Private API: `GET/PATCH /calendar/settings`, `GET /calendar/slots?date=YYYY-MM-DD`, `POST /calendar/book`.
- Public API: `GET /calendar/public/:slug`, `/slots`, `/book`.
- Prevent double‑booking via overlap checks.
- Public booking page consumes public endpoints only.

## 5) Non‑Functional Requirements
- **Performance:** p95 < 150ms for CRUD, < 500ms for searches.
- **Security:** JWT, password hashing, per‑tenant access control.
- **Reliability:** Central error handler; graceful validation messages.
- **DX:** Consistent error shape; seed script for demo data.

## 6) Data Model (abridged)
- All: `{orgId, ownerId?, createdBy, updatedBy, visibility}`.
- Meetings: `{title|subject, when|start, durationMinutes|end, with, status, location, notes, attendees[]}`.
- Campaigns: `{name, channel|type, status, startDate|startAt, endDate|endAt, budget, actualCost, notes}`.

## 7) API (high‑level)
- **Auth:** `/api/auth/login`, `/api/auth/me`
- **Core:** `/api/leads|accounts|contacts|deals|tasks|meetings|calls|campaigns`
- **Stats:** `/api/stats/home`, `/api/stats/summary`, `/api/stats`
- **Calendar:** `/api/calendar/settings`, `/api/calendar/slots`, `/api/calendar/book`, public mirror under `/api/calendar/public/:slug/*`

## 8) Acceptance Criteria (samples)
- Create, edit, delete a Task → reflected immediately in list; status/priority inline patch works.
- Meeting created with v2 payload persists and renders in table; ICS export downloads.
- Calendar settings PATCH rejects invalid times; slug collision returns 409.
- Homepage stats render without 500s; unknown routes return JSON 404 shape.

## 9) Rollout Plan
- Local dev using seed script.
- Smoke test CRUD, booking, stats.
- Tag release and export seed data snapshot.
