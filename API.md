
# API Quick Reference

Base URL (dev): `http://localhost:4000/api`

## Auth
- `POST /auth/login` → { token, user }
- `GET /auth/me` → current user

## Stats
- `GET /stats/home`
- `GET /stats/summary`
- `GET /stats`

## Calendar (private; requires auth)
- `GET /calendar/settings`
- `PATCH /calendar/settings` — body: { slug, days:[Mon..Sun], start:"HH:MM", end:"HH:MM", duration:Number }
- `GET /calendar/slots?date=YYYY-MM-DD`
- `POST /calendar/book` — body: { when:ISO, duration:Number?, with:String, title?, location?, notes? }

## Calendar (public; no auth)
- `GET /calendar/public/:slug`
- `GET /calendar/public/:slug/slots?date=YYYY-MM-DD`
- `POST /calendar/public/:slug/book` — body: { when:ISO, withName?, email?, title?, notes?, location? }

## Meetings
Supports **v1** and **v2** payloads.

- `GET /meetings?search=`
- `POST /meetings`  
  v1: { subject,title?, start, end, location?, notes?, attendees? }  
  v2: { title, when, durationMinutes, with?, location?, status?, notes? }
- `PATCH /meetings/:id`
- `DELETE /meetings/:id`

## Tasks
- `GET /tasks?search=`
- `POST /tasks` — { title, dueDate?, with?, status, priority, notes? }
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

## Campaigns
- `GET /campaigns?search=`
- `POST /campaigns` — { name, channel, status, startDate?, endDate?, budget, actualCost, notes? }
- `PATCH /campaigns/:id`
- `DELETE /campaigns/:id`

## Other Core
- `/leads`, `/accounts`, `/contacts`, `/deals`, `/calls` — standard CRUD.
