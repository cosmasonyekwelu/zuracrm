// src/utils/csv.js
// Tries to use csv-parse; if not installed, falls back to a lightweight CSV parser.

import { createInterface } from "node:readline";

/** naive but quote-aware splitter: "a,b","c""d",e -> [a,b][c"d][e] */
function splitCSV(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"'; i++; // escaped quote
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

async function parseCsvFallback(stream) {
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let headers = null;
  const rows = [];
  for await (const line of rl) {
    if (!line.trim() && headers) continue;
    const cols = splitCSV(line).map((s) => s.trim());
    if (!headers) {
      headers = cols;
    } else {
      const row = {};
      headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
      rows.push(row);
    }
  }
  return rows;
}

export async function parseCsv(stream) {
  // Try csv-parse first
  try {
    const mod = await import("csv-parse"); // will throw if not installed
    const { parse } = mod;
    return await new Promise((resolve, reject) => {
      const rows = [];
      stream
        .pipe(parse({ columns: true, trim: true }))
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows))
        .on("error", reject);
    });
  } catch {
    // Fallback (no dependency)
    return await parseCsvFallback(stream);
  }
}
