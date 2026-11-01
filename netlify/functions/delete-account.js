// Deletes a member's account and all their data (tables cascade from auth.users).
const { admin, json, requireUser } = require("../lib/shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Use POST." });
  const user = await requireUser(event);
  if (!user) return json(401, { error: "Please sign in again." });
  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) return json(500, { error: "We couldn't delete your account. Please email us and we'll help." });
  return json(200, { ok: true });
};
