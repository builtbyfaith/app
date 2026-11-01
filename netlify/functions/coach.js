// AI coach: checks the member has the AI coach plan, enforces a daily limit,
// calls OpenAI with the coach personality, and saves the conversation.
const { admin, json, readBody, guard } = require("../lib/shared");
const systemPrompt = require("../lib/coach-personality");

const DAILY_LIMIT = parseInt(process.env.COACH_DAILY_LIMIT || "50", 10);
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const CRISIS = /(kill myself|suicide|end my life|hurt myself|self[- ]harm|don'?t want to live)/i;

// Only these short facts about the member reach the AI, so nobody can stuff the prompt.
const str = (v, n) => typeof v === "string" ? v.slice(0, n) : "";
const num = (v) => Number.isFinite(v) ? Math.max(0, Math.min(9999, Math.round(v))) : null;
const list = (v) => Array.isArray(v) ? v.slice(0, 8).map(x => str(x, 40)).filter(Boolean) : [];
function cleanContext(c) {
  c = c && typeof c === "object" ? c : {};
  return { name: str(c.name, 40).split(" ")[0], programs: list(c.programs), today: str(c.today, 80), workoutsThisWeek: num(c.workoutsThisWeek), weeklyGoal: num(c.weeklyGoal),
    daysSinceLastWorkout: num(c.daysSinceLastWorkout), weeksOnTrack: num(c.weeksOnTrack), totalWorkouts: num(c.totalWorkouts), lastEffort: str(c.lastEffort, 20), nutrition: str(c.nutrition, 220), fasting: str(c.fasting, 120), experience: str(c.experience, 20), place: list(c.place), injuries: list(c.injuries), diet: str(c.diet, 30), raceWeeks: num(c.raceWeeks) };
}

exports.handler = async (event) => {
  const g = await guard(event); if (g.res) return g.res;
  const user = g.user;
  const body = readBody(event);
  if (!body) return json(400, { error: "Bad request." });
  const message = String(body.message || "").trim().slice(0, 600);
  if (!message) return json(400, { error: "Type a message first." });
  if (!process.env.OPENAI_API_KEY) return json(503, { error: "The coach is resting right now. Please try again later." });

  const db = admin();
  const { data: sub } = await db.from("subscriptions").select("plan,status").eq("user_id", user.id).maybeSingle();
  const coachPlan = sub && sub.plan === "coach" && ["active", "trialing", "past_due"].includes(sub.status);
  // Free-trial members use the app's built-in saved replies, so only paid AI coach members reach OpenAI.
  if (!coachPlan) return json(403, { error: "The AI coach is part of the AI coach plan. You can add it from the Coach tab." });

  // Save the message first, then count, so sending many at once can't slip past the limit.
  const { data: saved, error: saveErr } = await db.from("coach_messages").insert({ user_id: user.id, role: "user", content: message }).select("id").single();
  if (saveErr) return json(500, { error: "Your coach couldn't reply just now. Please try again in a minute." });
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const limit = DAILY_LIMIT;
  const limitMsg = "You've reached today's coach messages. I'll be here tomorrow, and your plan is ready for you today. You've got this.";
  const { count } = await db.from("coach_messages").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).eq("role", "user").gte("created_at", since.toISOString());
  if ((count || 0) > limit) {
    await db.from("coach_messages").delete().eq("id", saved.id);
    return json(429, { error: limitMsg });
  }

  // Last few messages for context (not including the one just saved)
  const { data: history } = await db.from("coach_messages").select("role,content")
    .eq("user_id", user.id).lt("id", saved.id).order("id", { ascending: false }).limit(8);
  const past = (history || []).reverse().map(m => ({ role: m.role, content: String(m.content).slice(0, 800) }));

  let reply;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0.7,
        user: user.id,
        messages: [{ role: "system", content: systemPrompt(cleanContext(body.context)) }, ...past, { role: "user", content: message }]
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || "OpenAI error " + r.status);
    reply = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || "").trim();
    if (!reply) throw new Error("Empty reply");
  } catch (e) {
    console.error("coach error", e.message);
    await db.from("coach_messages").delete().eq("id", saved.id); // a failed reply doesn't use up a message
    return json(502, { error: "Your coach couldn't reply just now. Please try again in a minute." });
  } finally { clearTimeout(timer); }

  if (CRISIS.test(message) && !/988/.test(reply)) {
    reply += "\n\nIf you're thinking about hurting yourself, please call or text 988 (Suicide & Crisis Lifeline) right now, or 911 in an emergency. You matter.";
  }

  await db.from("coach_messages").insert({ user_id: user.id, role: "assistant", content: reply });
  return json(200, { reply });
};
