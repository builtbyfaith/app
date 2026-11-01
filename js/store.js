/* Data layer. Uses Supabase when js/config.js has keys; otherwise runs in demo mode
   with everything saved in this browser only. */
(function () {
  const cfg = window.BBF_CONFIG || {};
  const live = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const KEY = "bbf_demo_v1";
  let sb = null;
  if (live) sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  // ---------- demo storage ----------
  const blank = () => ({ user: null, profile: null, plan: "none", status: null, workouts: [], daily: {}, body: [], coach: [] });
  function readDemo() { try { return JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { return memDemo || blank(); } }
  let memDemo = null;
  function writeDemo(d) { memDemo = d; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* storage off: keep in memory */ } }

  async function token() { const { data } = await sb.auth.getSession(); return data.session && data.session.access_token; }
  async function call(fn, body) {
    const t = await token();
    const r = await fetch("/.netlify/functions/" + fn, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
    return j;
  }
  const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

  const Store = {
    live,

    async user() {
      if (!live) return readDemo().user;
      const { data } = await sb.auth.getSession();
      return data.session ? { id: data.session.user.id, email: data.session.user.email } : null;
    },

    async signUp(name, email, password) {
      if (!live) { const d = readDemo(); d.user = { id: "demo", email, name }; d.profile = d.profile || { name, setup: null, settings: {}, progression: {} }; writeDemo(d); return { ok: true }; }
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: cfg.siteUrl || location.origin } });
      if (error) throw new Error(error.message);
      if (!data.session) return { needsConfirm: true };
      await sb.from("profiles").update({ name }).eq("id", data.user.id);
      return { ok: true };
    },

    async signIn(email, password) {
      if (!live) { const d = readDemo(); d.user = d.user || { id: "demo", email }; d.profile = d.profile || { name: "", setup: null, settings: {}, progression: {} }; writeDemo(d); return; }
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === "Invalid login credentials" ? "That email and password don't match. Try again or reset your password." : error.message);
    },

    async resetPassword(email) {
      if (!live) return;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: (cfg.siteUrl || location.origin) + "/#/new-password" });
      if (error) throw new Error(error.message);
    },

    async resendConfirm(email) {
      if (!live) return;
      const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: cfg.siteUrl || location.origin } });
      if (error) throw new Error(error.message);
    },

    async setPassword(pw) { if (live) must(await sb.auth.updateUser({ password: pw })); },

    async signOut() { if (!live) { const d = readDemo(); d.user = null; writeDemo(d); return; } await sb.auth.signOut(); },

    async load() {
      if (!live) { const d = readDemo(); return { profile: d.profile, plan: d.plan, status: d.status, workouts: d.workouts, daily: d.daily, body: d.body, coach: d.coach }; }
      const u = await this.user();
      const since = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
      const [p, s, w, dl, b, c] = await Promise.all([
        sb.from("profiles").select("*").eq("id", u.id).maybeSingle(),
        sb.from("subscriptions").select("*").eq("user_id", u.id).maybeSingle(),
        sb.from("workout_logs").select("*").gte("date", since).order("date"),
        sb.from("daily_logs").select("*").gte("date", since),
        sb.from("body_logs").select("*").order("date"),
        sb.from("coach_messages").select("role,content,created_at").order("created_at").limit(60)
      ]);
      const daily = {}; (must(dl) || []).forEach(r => daily[r.date] = r);
      const prof = must(p) || { name: "", setup: null, settings: {}, progression: {} };
      const sub = must(s) || {};
      return { profile: { name: prof.name || "", setup: prof.setup, settings: prof.settings || {}, progression: prof.progression || {} }, plan: sub.plan || "none", status: sub.status || null, workouts: must(w) || [], daily, body: must(b) || [], coach: must(c) || [] };
    },

    async saveProfile(patch) {
      if (!live) { const d = readDemo(); d.profile = Object.assign({}, d.profile, patch); writeDemo(d); return; }
      const u = await this.user();
      must(await sb.from("profiles").upsert(Object.assign({ id: u.id }, patch), { onConflict: "id" }));
    },

    async saveWorkout(w) {
      if (!live) { const d = readDemo(); d.workouts.push(w); writeDemo(d); return; }
      const u = await this.user();
      must(await sb.from("workout_logs").insert(Object.assign({ user_id: u.id }, w)));
    },

    async saveDaily(date, patch) {
      if (!live) { const d = readDemo(); d.daily[date] = Object.assign({ date }, d.daily[date], patch); writeDemo(d); return; }
      const u = await this.user();
      must(await sb.from("daily_logs").upsert(Object.assign({ user_id: u.id, date }, patch), { onConflict: "user_id,date" }));
    },

    async addBody(date, weight) {
      if (!live) { const d = readDemo(); d.body = d.body.filter(b => b.date !== date).concat({ date, weight }); d.body.sort((a, b) => a.date.localeCompare(b.date)); writeDemo(d); return; }
      const u = await this.user();
      must(await sb.from("body_logs").upsert({ user_id: u.id, date, weight }, { onConflict: "user_id,date" }));
    },

    async coach(message, context) {
      if (!live) {
        const d = readDemo();
        const reply = window.BBF_DEMO_COACH(message, context);
        d.coach.push({ role: "user", content: message }, { role: "assistant", content: reply });
        writeDemo(d);
        return { reply, demo: true };
      }
      return call("coach", { message, context });
    },

    async startCheckout(plan) {
      if (!live) { const d = readDemo(); d.plan = plan; d.status = "trialing"; writeDemo(d); return { demo: true }; }
      const { url } = await call("create-checkout", { plan });
      location.href = url;
    },

    async openPortal() {
      if (!live) return { demo: true };
      const { url } = await call("customer-portal", {});
      location.href = url;
    },

    async deleteData() {
      if (!live) { try { localStorage.removeItem(KEY); } catch (e) {} memDemo = null; return; }
      await call("delete-account", {});
      await sb.auth.signOut();
    },

    onAuth(cb) { if (live) sb.auth.onAuthStateChange((evt) => cb(evt)); }
  };

  window.BBF_STORE = Store;
})();
