// Starts a Stripe Checkout for Core or AI Coach.
// Right now no card is asked for during the free trial: members choose a plan after it ends.
// Later, set CARD_FOR_TRIAL=true in Netlify to let them choose during the trial (card collected,
// billing starts when the trial ends, so they never lose free days).
const CARD_FOR_TRIAL = process.env.CARD_FOR_TRIAL === "true";
const Stripe = require("stripe");
const { admin, json, readBody, guard, trialInfo } = require("../lib/shared");

function keepFreeDays(sub) {
  const data = { metadata: { user_id: (sub && sub.user_id) || "" } };
  const t = trialInfo(sub);
  if (!t.active || (sub && sub.had_trial)) return data;
  const msLeft = t.ends.getTime() - Date.now();
  // Stripe needs a trial end at least 48 hours away; otherwise round up to whole days (at most 1 extra day).
  if (msLeft >= 48 * 3600000 + 60000) data.trial_end = Math.floor(t.ends.getTime() / 1000);
  else data.trial_period_days = Math.max(1, Math.ceil(msLeft / 86400000));
  return data;
}

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
    const { data: found } = await db.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();
    const sub = Object.assign({ user_id: user.id }, found || {});
    if (!CARD_FOR_TRIAL && trialInfo(sub).active && !(sub.stripe_customer_id && ["active", "trialing", "past_due"].includes(sub.status))) {
      return json(400, { error: "Enjoy your free trial! No card needed. You can choose a plan when it ends." });
    }

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
      subscription_data: CARD_FOR_TRIAL ? keepFreeDays(sub) : { metadata: { user_id: user.id } },
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
