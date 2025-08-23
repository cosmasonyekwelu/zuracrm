// server/src/controllers/forecasts.controller.js
import Deal from "../models/Deal.js";
import { ApiError, ok } from "../utils/http.js";

// Stage → probability (edit as needed)
const PROB = {
  qualification: 0.10,
  needs_analysis: 0.30,
  proposal: 0.60,
  negotiation: 0.80,
  closed_won: 1.00,
  closed_lost: 0.00,
};

function ym(dateLike) {
  if (!dateLike) return "N/A";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "N/A";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function summary(req, res, next) {
  try {
    // Multi-tenant: org-scoped; non-admin sees only own deals
    const filter = { orgId: req.user.orgId };
    if (req.user.role !== "admin") filter.owner = req.user.id;

    const deals = await Deal.find(filter)
      .select("stage amount closeDate createdAt updatedAt")
      .lean();

    const byStage = new Map();  // stage → amount
    const byMonth = new Map();  // YYYY-MM → amount

    let pipelineTotal = 0;
    let weightedTotal = 0;
    let wonTotal = 0;
    let lostTotal = 0;

    for (const d of deals) {
      const stage = d.stage || "qualification";
      const amount = Number(d.amount || 0);
      const prob = PROB[stage] ?? 0;

      pipelineTotal += amount;
      weightedTotal += amount * prob;

      if (stage === "closed_won") wonTotal += amount;
      if (stage === "closed_lost") lostTotal += amount;

      byStage.set(stage, (byStage.get(stage) || 0) + amount);

      // prefer closeDate month; fall back to createdAt month
      const month = ym(d.closeDate) !== "N/A" ? ym(d.closeDate) : ym(d.createdAt);
      byMonth.set(month, (byMonth.get(month) || 0) + amount);
    }

    // Convert maps to arrays (sorted)
    const pipeline = Array.from(byStage.entries())
      .map(([stage, amount]) => ({ stage, amount }))
      .sort((a, b) => a.stage.localeCompare(b.stage));

    const monthly = Array.from(byMonth.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return ok(res, {
      pipeline,
      monthly,
      totals: {
        pipeline: pipelineTotal,
        weighted: weightedTotal,
        won: wonTotal,
        lost: lostTotal,
        count: deals.length,
      },
    });
  } catch (e) {
    next(e);
  }
}
