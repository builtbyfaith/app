// Shared helpers for the Netlify functions. Secrets come from Netlify environment variables
// and never reach the browser.
const { createClient } = require("@supabase/supabase-js");

let client = null;
// One reused server client per function instance (faster and lighter under heavy traffic).
const admin = () => client || (client = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }));

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
  if (!sameOrigin(event)) return { res: json(403, { error: "Not allowed." }) };
  const user = await requireUser(event).catch(() => null);
  if (!user) return { res: json(401, { error: "Please sign in again." }) };
  return { user };
}

module.exports = { admin, json, readBody, requireUser, guard };
