// Opens Stripe's billing portal so members can change plans, update cards or cancel.
const Stripe = require("stripe");
const { admin, json, guard } = require("../lib/shared");

exports.handler = async (event) => {
  const g = await guard(event); if (g.res) return g.res;
  try {
    const { data: sub } = await admin().from("subscriptions").select("stripe_customer_id").eq("user_id", g.user.id).maybeSingle();
    if (!sub || !sub.stripe_customer_id) return json(400, { error: "No membership found yet." });
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: process.env.APP_URL + "/#/profile" });
    return json(200, { url: portal.url });
  } catch (e) {
    console.error("portal error", e.message);
    return json(502, { error: "We couldn't open billing just now. Please try again in a minute." });
  }
};
