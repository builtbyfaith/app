// AI coach: checks the member has the AI coach plan, enforces a daily limit,
// calls OpenAI with the coach personality, and saves the conversation.
const { admin, json, requireUser } = require("../lib/shared");
const systemPrompt = require("../lib/coach-personality");

const DAILY_LIMIT = parseInt(process.env.COACH_DAILY_LIMIT || "30", 10);
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const CRISIS = /(kill myself|suicide|end my life|hurt myself|self[- ]harm|don'?t want to live)/i;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Use POST." });
  const user = await requireUser(event);
  if (!user) return json(401, { error: "Please sign in again." });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { error: "Bad request." }); }
  const message = String(body.message || "").trim().slice(0, 600);
  if (!message) return json(400, { error: "Type a message first." });

  const db = admin();
  const { data: sub } = await db.from("subscriptions").select("plan,status").eq("user_id", user.id).maybeSingle();
  if (!sub || sub.plan !== "coach" || !["active", "trialing"].includes(sub.status)) {
    return json(403, { error: "The AI coach is part of the AI coach plan. You can start a free trial from the Coach tab." });
  }

  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const { count } = await db.from("coach_messages").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).eq("role", "user").gte("created_at", since.toISOString());
  if ((count || 0) >= DAILY_LIMIT) {
    return json(429, { error: "You've reached today's coach messages. I'll be here tomorrow, and your plan is ready for you today. You've got this." });
  }

  // Last few messages for context
  const { data: history } = await db.from("coach_messages").select("role,content")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
  const past = (history || []).reverse().map(m => ({ role: m.role, content: m.content }));

  let reply;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0.7,
        messages: [{ role: "system", content: systemPrompt(body.context) }, ...past, { role: "user", content: message }]
      })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "OpenAI error");
    reply = (j.choices && j.choices[0] && j.choices[0].message.content || "").trim();
  } catch (e) {
    console.error("coach error", e.message);
    return json(502, { error: "Your coach couldn't reply just now. Please try again in a minute." });
  }

  if (CRISIS.test(message) && !/988/.test(reply)) {
    reply += "\n\nIf you're thinking about hurting yourself, please call or text 988 (Suicide & Crisis Lifeline) right now, or 911 in an emergency. You matter.";
  }

  await db.from("coach_messages").insert([
    { user_id: user.id, role: "user", content: message },
    { user_id: user.id, role: "assistant", content: reply }
  ]);
  return json(200, { reply });
};
