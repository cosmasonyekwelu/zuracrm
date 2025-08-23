// server/src/routes/index.js
import { Router } from "express";

// Auth & users
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";

// Company / Org
import companyRoutes from "./company.routes.js";   // ➜ GET/PATCH /company, POST /company/logo
import orgRoutes from "./org.routes.js";

// CRM entities
import productRoutes from "./products.routes.js";
import accountsRoutes from "./accounts.routes.js";
import leadRoutes from "./leads.routes.js";
import contactRoutes from "./contacts.routes.js";
import dealRoutes from "./deals.routes.js";
import tasksRoutes from "./tasks.routes.js";
import meetingsRoutes from "./meetings.routes.js";
import callRoutes from "./calls.routes.js";
import campaignRoutes from "./campaigns.routes.js";
import documentsRoutes from "./documents.routes.js";
import forecastsRoutes from "./forecasts.routes.js";
import pipelineRoutes from "./pipeline.routes.js";
import activitiesRoutes from "./activities.routes.js";

// Platform / utilities
import integrationsRoutes from "./integrations.routes.js";
import calendarRoutes from "./calendar.routes.js";
import securityRoutes from "./security.routes.js";
import importRoutes from "./import.routes.js";
import rolesRoutes from "./roles.routes.js";
import auditRoutes from "./audit.routes.js";
import emailRoutes from "./email.routes.js";
import searchRoutes from "./search.routes.js";
import statsRoutes from "./stats.routes.js";
import docRoutes from "./docs.routes.js";

const api = Router();

/**
 * Auth & Users
 */
api.use("/auth", authRoutes);
api.use("/users", usersRoutes);

/**
 * Company / Org
 * - companyRoutes is mounted under /company (controller defines "/" and "/logo" inside)
 * - orgRoutes keeps your existing org administration endpoints
 */
api.use("/company", companyRoutes);
api.use("/org", orgRoutes);

/**
 * CRM Resources
 */
api.use("/products", productRoutes);
api.use("/accounts", accountsRoutes);
api.use("/leads", leadRoutes);
api.use("/contacts", contactRoutes);
api.use("/deals", dealRoutes);
api.use("/tasks", tasksRoutes);
api.use("/meetings", meetingsRoutes);
api.use("/calls", callRoutes);
api.use("/campaigns", campaignRoutes);
api.use("/documents", documentsRoutes);
api.use("/forecasts", forecastsRoutes);
api.use("/pipeline", pipelineRoutes);
api.use("/activities", activitiesRoutes);

/**
 * Platform / Utilities
 * NOTE: These route modules typically register their own absolute paths internally
 * (e.g., r.get("/search", ...)), so we mount them at "/" to avoid double-prefixing.
 */
api.use("/", searchRoutes);
api.use("/", statsRoutes);
api.use("/", integrationsRoutes);
api.use("/calendar", calendarRoutes);
api.use("/", securityRoutes);
api.use("/", importRoutes);
api.use("/", rolesRoutes);   // e.g., GET /roles
api.use("/", auditRoutes);   // e.g., GET /audit
api.use("/", emailRoutes);   // e.g., /email/settings
api.use("/", docRoutes);     // e.g., /docs/*

export default api;
