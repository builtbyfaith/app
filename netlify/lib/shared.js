// Shared helpers for the Netlify functions. Secrets come from Netlify environment variables
// and never reach the browser.
const { createClient } = require("@supabase/supabase-js");

const URL_ = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
let client = null;
// One reused server client per function instance (faster and lighter under heavy traffic).
const admin = () => client || (client = createClient(URL_(), SERVICE(), { auth: { persistSession: false, autoRefreshToken: false } }));

// Free trial: no card needed. Change these in Netlify environment variables if you like.
const TRIAL_DAYS = parseInt(process.env.FREE_TRIAL_DAYS || "3", 10);
const TRIAL_MESSAGES = parseInt(process.env.FREE_TRIAL_MESSAGES || "30", 10);
function trialInfo(sub) {
  const start = sub && sub.trial_started_at ? new Date(sub.trial_started_at) : null;
  const ends = start ? new Date(start.getTime() + TRIAL_DAYS * 86400000) : null;
  return { start, ends, active: !!(ends && Date.now() < ends.getTime()) };
}
const paid = (sub) => !!(sub && ["core", "coach"].includes(sub.plan) && ["active", "trialing", "past_due"].includes(sub.status));

const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body)
});

// Reads a JSON body safely; returns null for missing, oversized or broken input.
function readBody(event, maxBytes = 8000) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : (event.body || "");
  if (raw.length > maxBytes) return null;
  try { const v = JSON.parse(raw || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : null; } catch (e) { return null; }
}

// Only accept calls made from the app itself (blocks other websites from using a member's session).
function sameOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin;
  if (!origin) return true; // same-origin fetches from some browsers omit it; the sign-in token is still required
  const allowed = [process.env.APP_URL, process.env.URL, process.env.DEPLOY_PRIME_URL].filter(Boolean).map(u => u.replace(/\/$/, ""));
  return allowed.includes(origin.replace(/\/$/, ""));
}

// Confirms the request comes from a signed-in member and returns their user record.
async function requireUser(event) {
  const auth = event.headers.authorization || event.headers.Authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token.length > 4000) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Common front door for member-only functions: POST only, from the app, signed in.
async function guard(event) {
  if (event.httpMethod !== "POST") return { res: json(405, { error: "Use POST." }) };
  if (!URL_() || !SERVICE()) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables");
    return { res: json(503, { error: "The app is still being set up. Please try again soon." }) };
  }
  if (!sameOrigin(event)) return { res: json(403, { error: "Not allowed." }) };
  const user = await requireUser(event).catch(() => null);
  if (!user) return { res: json(401, { error: "Please sign in again." }) };
  return { user };
}

module.exports = { admin, json, readBody, requireUser, guard, trialInfo, paid, TRIAL_DAYS, TRIAL_MESSAGES };
