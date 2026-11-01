// Opens Stripe's billing portal so members can change plans, update cards or cancel.
const Stripe = require("stripe");
const { admin, json, requireUser } = require("../lib/shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Use POST." });
  const user = await requireUser(event);
  if (!user) return json(401, { error: "Please sign in again." });
  const { data: sub } = await admin().from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!sub || !sub.stripe_customer_id) return json(400, { error: "No membership found yet." });
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: process.env.APP_URL + "/#/profile" });
  return json(200, { url: portal.url });
};
