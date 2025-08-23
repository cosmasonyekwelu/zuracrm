// server/src/controllers/rolesPolicy.controller.js
import RolePolicy from "../models/RolePolicy.js";

const MODULES = ["Leads","Contacts","Accounts","Deals","Activities","Documents","Campaigns"];
const ROLES = ["admin","manager","user","read_only"];
const PERMS = ["no","ro","rw"];

function defaultPolicy() {
  const p = {};
  for (const r of ROLES) p[r] = {};
  for (const m of MODULES) {
    p.admin[m] = "rw";
    p.manager[m] = "rw";
    p.user[m] = "ro";
    p.read_only[m] = "no";
  }
  return p;
}
function normalize(input = {}) {
  const out = defaultPolicy();
  for (const r of ROLES) {
    for (const m of MODULES) {
      const v = input?.[r]?.[m];
      out[r][m] = PERMS.includes(v) ? v : out[r][m];
    }
  }
  return out;
}

export async function getRolePolicy(req, res) {
  const { orgId } = req.user;
  let doc = await RolePolicy.findOne({ orgId }).lean();
  if (!doc) {
    return res.json({ permissionsByRole: defaultPolicy() });
  }
  return res.json({ permissionsByRole: normalize(doc.permissionsByRole) });
}

export async function patchRolePolicy(req, res) {
  const { orgId, id: userId } = req.user;
  const next = normalize(req.body?.permissionsByRole || req.body?.permissions || req.body?.permissionsByRole);
  const doc = await RolePolicy.findOneAndUpdate(
    { orgId },
    { $set: { permissionsByRole: next, updatedBy: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return res.json({ permissionsByRole: normalize(doc.permissionsByRole) });
}
