// Shared helpers for the Netlify functions. Secrets come from Netlify environment variables.
const { createClient } = require("@supabase/supabase-js");

const admin = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const json = (status, body) => ({ statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// Confirms the request comes from a signed-in member and returns their user record.
async function requireUser(event) {
  const auth = event.headers.authorization || event.headers.Authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

module.exports = { admin, json, requireUser };
