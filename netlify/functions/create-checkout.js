// Starts a Stripe Checkout for Core or AI coach. The free trial happens in the app first (no card), so billing starts right away.
const Stripe = require("stripe");
const { admin, json, readBody, guard } = require("../lib/shared");

exports.handler = async (event) => {
  const g = await guard(event); if (g.res) return g.res;
  const user = g.user;
  const body = readBody(event);
  if (!body || !["core", "coach"].includes(body.plan)) return json(400, { error: "Please choose a plan." });
  const price = body.plan === "coach" ? process.env.STRIPE_PRICE_COACH : process.env.STRIPE_PRICE_CORE;
  if (!price || !process.env.STRIPE_SECRET_KEY) return json(503, { error: "Memberships open soon. Please check back shortly." });

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const db = admin();
    const { data: sub } = await db.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();

    // Already subscribed: send them to the billing portal to switch plans instead
    if (sub && sub.stripe_customer_id && ["active", "trialing", "past_due"].includes(sub.status)) {
      const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: process.env.APP_URL + "/#/profile" });
      return json(200, { url: portal.url });
    }

    let customer = sub && sub.stripe_customer_id;
    if (!customer) {
      const c = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } }, { idempotencyKey: "cust-" + user.id });
      customer = c.id;
      await db.from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customer }, { onConflict: "user_id" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price, quantity: 1 }],
      payment_method_collection: "always",
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: process.env.APP_URL + "/#/today?upgraded=1",
      cancel_url: process.env.APP_URL + "/#/plans",
      client_reference_id: user.id
    });
    return json(200, { url: session.url });
  } catch (e) {
    console.error("checkout error", e.message);
    return json(502, { error: "We couldn't open checkout just now. Please try again in a minute." });
  }
};
