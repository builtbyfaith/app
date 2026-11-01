// Deletes a member's account and all their data (tables cascade from auth.users).
// Cancels any Stripe membership first so nobody is billed after deleting.
const Stripe = require("stripe");
const { admin, json, guard } = require("../lib/shared");

exports.handler = async (event) => {
  const g = await guard(event); if (g.res) return g.res;
  const db = admin();
  try {
    const { data: sub } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", g.user.id).maybeSingle();
    if (sub && sub.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const subs = await stripe.subscriptions.list({ customer: sub.stripe_customer_id, status: "all", limit: 20 });
      for (const s of subs.data) if (!["canceled", "incomplete_expired"].includes(s.status)) await stripe.subscriptions.cancel(s.id);
    }
  } catch (e) {
    console.error("delete: cancel failed", e.message);
    return json(502, { error: "We couldn't cancel your membership just now, so nothing was deleted. Please try again or email us." });
  }
  const { error } = await db.auth.admin.deleteUser(g.user.id);
  if (error) return json(500, { error: "We couldn't delete your account. Please email us and we'll help." });
  return json(200, { ok: true });
};
