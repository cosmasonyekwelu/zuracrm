# Zura CRM — Full-stack Starter (Zoho-style high-fidelity)

**Tech**: React (Vite) + Node.js (Express) + MongoDB (Mongoose) + JWT

## Quick Start
### Backend
```bash
cd backend
cp .env.example .env   # edit MONGO_URI, JWT_SECRET, optional GOOGLE_CLIENT_ID
npm i
npm run seed
npm run dev
```
### Frontend
```bash
cd ../frontend
npm i
npm run dev
```

## Features
- Landing page with **embedded signup**, CTA buttons, and **footer**
- **Sign in**: social buttons (Google stub + extensible), identifier-first (email or phone) then password
- **Sign up**: name, email, **phone**, password, social buttons, and footer
- Authenticated app with **Logout**
- Modules: Leads (Convert), Accounts, Contacts, Deals (**Kanban move**), Activities
- Web-to-Lead endpoint
- **Brand**: Zura — original logos and copy (no third‑party assets)

## Google Sign-in (optional)
1. Create OAuth 2.0 Client (Web) in Google Cloud.
2. Add JS origin `http://localhost:5173`.
3. Put `GOOGLE_CLIENT_ID=...` in `backend/.env` and restart backend.
4. Optionally set `VITE_GOOGLE_CLIENT_ID=...` in `frontend/.env` to render native Google widget.
5. Frontend sends ID token to `POST /api/auth/google`; backend verifies with `google-auth-library`.
