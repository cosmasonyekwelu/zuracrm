// src/models/index.js
// Registers all existing model files without crashing if some are missing.
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List all model filenames you *might* have. Loader will skip missing ones.
const candidates = [
  "User.js",
  "Account.js",
  "Lead.js",
  "Contact.js",
  "Deal.js",
  "Task.js",
  "Meeting.js",
  "Call.js",

  // Optional — only load if present
  "Product.js",
  "Campaign.js",
  "Forecast.js",
  "Quote.js",
  "Invoice.js",
  "SalesOrder.js",
  "Documents.js",
  "Organization.js",
  "Pipeline.js",
  "IntegrationSettings.js",
  "SecurityPolicy.js",
  "AuditLog.js",
  "EmailConnection.js",
];

for (const f of candidates) {
  const full = path.join(__dirname, f);
  if (fs.existsSync(full)) {
    // Top-level await is fine in ESM (Node 24)
    await import(pathToFileURL(full).href);
  }
}
