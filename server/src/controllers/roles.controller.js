export async function getRoles(_req, res) {
  res.json({
    roles: [
      { id: "admin", name: "Admin", permissions: ["*"] },
      { id: "user",  name: "User",  permissions: ["read", "create", "update"] },
    ],
    sharingRules: [
      { module: "leads",   visibility: "private" },
      { module: "deals",   visibility: "team" },
      { module: "accounts",visibility: "org" },
    ],
  });
}
