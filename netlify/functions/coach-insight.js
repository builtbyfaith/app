// Coach Faith as a real coach, not just a chat: a daily note, feedback on each workout,
// and a weekly review. AI Coach members only. Reads the member's own data from the database
// (not from the browser), and saves each note so it's written once and costs fractions of a cent.
const { admin, json, readBody, guard } = require("../lib/shared");
const systemPrompt = require("../lib/coach-personality");

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const KINDS = {
  daily: { tokens: 160, task: "Write today's coach note for this member. 2 or 3 short sentences. Mention one specific thing from their recent activity (a workout they did, a lift that went up, steps, a streak, or time away, with grace). End with one clear focus for today that fits their plan. No greeting like 'Hi', no list." },
  workout: { tokens: 220, task: "Give feedback on the workout they just finished (the most recent one below). 3 or 4 short sentences: celebrate something specific (a weight, the sets they completed, showing up on a tired day), react to how hard it felt, and say what to aim for next time on one exercise. Add one quick recovery tip (protein, water, sleep or a walk). No list." },
  weekly: { tokens: 320, task: "Write their weekly check-in from the last 7 days. 4 to 6 short sentences: name their wins, notice a pattern (consistency, energy, steps, strength), and give one or two focuses for next week that fit their schedule and any areas to protect. Encourage them like a coach who believes in them. No list." }
};

const day = (d) => new Date(d).toISOString().slice(0, 10);
function validKey(kind, key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key || "")) return false;
  const diff = Math.abs(new Date(key + "T12:00:00Z").getTime() - Date.now());
  return diff < (kind === "weekly" ? 9 : 2) * 86400000;
}

const PROG = { glp1: "GLP-1 Strength", meno: "Menopause Strength", over40: "Strong Over 40", senior: "Senior Strength", beginner: "Total Beginner", busy: "20-Minute Strong", race: "Race Ready" };
const PLACE = { bare: "home with no equipment", db: "home with dumbbells or bands", gym: "a gym", out: "outdoors" };
function describe(profile, workouts, daily) {
  const s = (profile && profile.setup) || {};
  const lines = [];
  lines.push("Programs: " + ((s.programs || []).map(k => PROG[k] || k).join(", ") || "unknown") + ". Trains " + (s.days || "?") + " days a week, about " + (s.minutes || "?") + " minutes, at: " + ((s.place || []).map(k => PLACE[k] || k).join(", ") || "home") + ".");
  lines.push("Experience: " + (s.experience || "unknown") + ". Areas to protect: " + ((s.injuries || []).filter(x => x !== "none").join(", ") || "none") + ". Way of eating: " + (s.diet || "balanced") + (s.raceDate ? ". Race date: " + s.raceDate : "") + ".");
  if (!workouts.length) lines.push("No workouts logged in the last 14 days.");
  workouts.slice(-8).forEach(w => {
    const ex = (w.exercises || []).slice(0, 6).map(x => {
      const done = Array.isArray(x.done) ? x.done.filter(Boolean).length + "/" + x.done.length + " sets" : "";
      return x.name + (x.weight ? " " + x.weight + " lb" : "") + (x.reps ? " x" + x.reps : "") + (x.secs ? " " + x.secs + "s" : "") + (done ? " (" + done + ")" : "");
    }).join("; ");
    lines.push("Workout " + w.date + ": " + (w.name || "") + ", " + (w.minutes || "?") + " min, felt " + ({ easy: "easy", right: "just right", hard: "tough" }[w.effort] || "okay") + (w.energy === "low" ? ", low-energy day" : "") + (ex ? ". " + ex : ""));
  });
  const steps = daily.filter(d => d.steps).map(d => d.date + ": " + d.steps);
  if (steps.length) lines.push("Steps: " + steps.join(", ") + ".");
  return lines.join("\n").slice(0, 3500);
}

exports.handler = async (event) => {
  const g = await guard(event); if (g.res) return g.res;
  const user = g.user;
  const body = readBody(event);
  if (!body || !KINDS[body.kind] || !validKey(body.kind, body.key)) return json(400, { error: "Bad request." });
  const { kind, key } = body;
  const db = admin();

  const { data: sub } = await db.from("subscriptions").select("plan,status").eq("user_id", user.id).maybeSingle();
  if (!(sub && sub.plan === "coach" && ["active", "trialing", "past_due"].includes(sub.status))) return json(403, { error: "AI Coach members only." });

  // Already written? Send the saved note (no new AI cost).
  const { data: cached } = await db.from("coach_insights").select("content").eq("user_id", user.id).eq("kind", kind).eq("key", key).maybeSingle();
  if (cached && !(kind === "workout" && body.refresh)) return json(200, { text: cached.content });
  if (!process.env.OPENAI_API_KEY) return json(503, { error: "The coach is resting right now." });

  // Workout feedback can be refreshed when they log a second workout the same day, at most 3 times.
  if (kind === "workout" && cached) {
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const { count } = await db.from("coach_insights").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("updated_at", since.toISOString());
    if ((count || 0) > 6) return json(200, { text: cached.content });
  }

  const from = day(Date.now() - 14 * 86400000);
  const [p, w, d] = await Promise.all([
    db.from("profiles").select("name,setup").eq("id", user.id).maybeSingle(),
    db.from("workout_logs").select("date,name,energy,effort,minutes,exercises").eq("user_id", user.id).gte("date", from).order("date").order("id"),
    db.from("daily_logs").select("date,steps").eq("user_id", user.id).gte("date", day(Date.now() - 7 * 86400000)).order("date")
  ]);
  const profile = p.data || {};
  const workouts = w.data || [];
  if (kind === "workout" && !workouts.length) return json(200, { text: "" });
  const facts = describe(profile, workouts, d.data || []);

  let text;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: JSON.stringify({
        model: MODEL, max_tokens: KINDS[kind].tokens, temperature: 0.7, user: user.id,
        messages: [
          { role: "system", content: systemPrompt({ name: String(profile.name || "").split(" ")[0] }) },
          { role: "user", content: "Today is " + key + ".\nWHAT THEY'VE DONE:\n" + facts + "\n\nYOUR TASK: " + KINDS[kind].task }
        ]
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || "OpenAI error " + r.status);
    text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || "").trim();
    if (!text) throw new Error("Empty reply");
  } catch (e) {
    console.error("insight error", e.message);
    return json(502, { error: "Your coach couldn't write this just now." });
  } finally { clearTimeout(timer); }

  await db.from("coach_insights").upsert({ user_id: user.id, kind, key, content: text.slice(0, 2000), updated_at: new Date().toISOString() }, { onConflict: "user_id,kind,key" });
  return json(200, { text });
};
