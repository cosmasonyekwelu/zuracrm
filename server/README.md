# Zura CRM — Production Backend (PORT 4000)

A production-grade Node.js API for your Zoho-like CRM. It ships with JWT auth (email/phone/username), robust security, validation, rate-limits, metrics, and Docker.

## Quick Start (Local)
```bash
npm i
cp .env.example .env
npm run seed
npm run dev  # http://localhost:4000
```

Seeded accounts:
- Admin: `admin@zura.local` / `admin123`
- User: `user@zura.local` / `user1234`

## With Docker
```bash
docker compose up --build
# API on http://localhost:4000, Mongo on 27017
```

## Frontend Integration
Set `VITE_API_URL=http://localhost:4000` so requests go to `http://localhost:4000/api`.
