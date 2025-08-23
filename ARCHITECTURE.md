
# Architecture Overview

## Stack
- **Client:** React (Vite), React Router, minimal context for auth, axios API wrapper.
- **Server:** Node + Express, MongoDB/Mongoose, JWT auth, multer (uploads path reserved), central error handler.
- **Multi‑tenancy:** each record carries `orgId`; requests run under authenticated user → controllers filter by `orgId`.

## Layout
```
client/
  src/
    components/
    pages/
    context/AuthContext.jsx
    services/api.js
server/
  src/
    models/
    controllers/
    routes/
    middleware/
    utils/
    seed.js
```
- `routes/index.js` mounts feature routers at `/api/*` (e.g., `/api/calendar`).
- `app.js` wires middleware (CORS, JSON, cookies, logging) and static `/uploads` (if enabled).

## Error Handling
- `asyncHandler` wrapper sends errors to a central error middleware.
- `ApiError.statusCode` respected; otherwise 500.
- Frontend uses `validateStatus` in axios where fallbacks are needed (e.g., Meetings v1→v2).

## Auth
- `POST /auth/login` issues JWT stored by client; `auth` middleware injects `req.user` with { id, orgId, role }.
- Use strong `JWT_SECRET` in production.

## Calendar Booking
- `CalendarSettings` per user. Public booking uses `slug` to resolve owner.
- Overlap checks prevent double booking.
- Public endpoints expose only minimal data.

## Frontend Notes
- Tables allow inline status/priority edits (Tasks/Meetings).
- Settings → CalendarBooking uses robust client‑side validation and handles 404/409 gracefully.
