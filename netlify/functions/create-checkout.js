// Starts a Stripe Checkout for Core or AI coach with a 7-day free trial (card required).
const Stripe = require("stripe");
const { admin, json, requireUser } = require("../lib/shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Use POST." });
  const user = await requireUser(event);
  if (!user) return json(401, { error: "Please sign in again." });
  const { plan } = JSON.parse(event.body || "{}");
  const price = plan === "coach" ? process.env.STRIPE_PRICE_COACH : process.env.STRIPE_PRICE_CORE;
  if (!price) return json(400, { error: "That plan isn't set up yet." });

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const db = admin();
  const { data: sub } = await db.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();

  // Already subscribed: send them to the billing portal to switch plans instead
  if (sub && sub.stripe_customer_id && ["active", "trialing"].includes(sub.status)) {
    const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: process.env.APP_URL + "/#/profile" });
    return json(200, { url: portal.url });
  }

  let customer = sub && sub.stripe_customer_id;
  if (!customer) {
    const c = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
    customer = c.id;
    await db.from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customer, plan: "none" }, { onConflict: "user_id" });
  }

  const hadTrial = sub && sub.had_trial;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    payment_method_collection: "always",
    subscription_data: Object.assign({ metadata: { user_id: user.id } }, hadTrial ? {} : { trial_period_days: 7 }),
    allow_promotion_codes: true,
    success_url: process.env.APP_URL + "/#/today?upgraded=1",
    cancel_url: process.env.APP_URL + "/#/plans",
    client_reference_id: user.id
  });
  return json(200, { url: session.url });
};
