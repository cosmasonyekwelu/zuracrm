
# Security Notes

- **JWT:** Use a strong `JWT_SECRET`. Rotate secrets periodically.
- **CORS:** In production, restrict `origin` to your domains only.
- **Passwords:** Always hashed server-side. Never log credentials.
- **Tenancy:** Filter by `orgId` on all queries. Avoid cross-tenant leakage.
- **Validation:** Validate body and query inputs (times, dates, IDs). Return 400/409 accordingly.
- **Uploads:** If enabling documents, sanitize filenames, restrict MIME types, and scan files.
- **Headers:** Consider `helmet` in production.
- **Rate Limits:** Recommended to add `express-rate-limit` for auth endpoints.
