// server/src/utils/acl.js
export const isAdmin = (u) => (u?.role === "admin");

// Read: what the requesting user may see (besides orgId)
export function readScopeFilter(user) {
  if (isAdmin(user)) return {}; // admin sees all inside org
  const uid = user?.id || user?._id;
  return {
    $or: [
      { ownerId: uid },
      { assignedTo: uid },
      { sharedWith: uid },
      { visibility: "org" },
    ],
  };
}

// Write guard (update/delete)
export function canWriteDoc(user, doc) {
  if (!user || !doc) return false;
  if (isAdmin(user)) return true;
  const uid = String(user.id || user._id || "");
  return (
    String(doc.ownerId || "") === uid ||
    (Array.isArray(doc.assignedTo) && doc.assignedTo.map(String).includes(uid))
  );
}
