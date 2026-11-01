// Keeps each member's plan in Supabase in sync with Stripe.
const Stripe = require("stripe");
const { admin } = require("../lib/shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST." };
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) return { statusCode: 400, body: "Missing signature" };
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  let evt;
  try { evt = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return { statusCode: 400, body: "Bad signature" }; }

  const planFor = (priceId) => priceId === process.env.STRIPE_PRICE_COACH ? "coach" : priceId === process.env.STRIPE_PRICE_CORE ? "core" : "none";
  const db = admin();

  async function sync(subscription) {
    const priceId = subscription.items.data[0] && subscription.items.data[0].price.id;
    const live = ["active", "trialing", "past_due"].includes(subscription.status);
    const row = {
      stripe_customer_id: subscription.customer,
      plan: live ? planFor(priceId) : "none",
      status: subscription.status,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
    };
    if (subscription.status === "trialing" || subscription.trial_end) row.had_trial = true;
    const userId = subscription.metadata && subscription.metadata.user_id;
    if (userId) await db.from("subscriptions").upsert(Object.assign({ user_id: userId }, row), { onConflict: "user_id" });
    else await db.from("subscriptions").update(row).eq("stripe_customer_id", subscription.customer);
  }

  try {
    if (evt.type === "checkout.session.completed" && evt.data.object.subscription) {
      await sync(await stripe.subscriptions.retrieve(evt.data.object.subscription));
    } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(evt.type)) {
      await sync(evt.data.object);
    }
  } catch (e) {
    console.error("webhook error", e.message);
    return { statusCode: 500, body: "Webhook handling failed" };
  }
  return { statusCode: 200, body: "ok" };
};
