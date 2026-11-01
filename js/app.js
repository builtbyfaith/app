/* Built by Faith app: screens and navigation */
(function () {
  const C = window.BBF_CONTENT, E = window.BBF_ENGINE, S = window.BBF_STORE;
  const root = document.getElementById("app");
  const state = { user: null, data: null, energy: null, session: null, timer: null, stepsOpen: false, weightOpen: false, confirmDelete: false, busy: false, setup: null, lift: null };

  // ---------- helpers ----------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => E.dateStr();
  const go = h => { if (location.hash === h) render(); else location.hash = h; };
  const firstName = () => ((state.data && state.data.profile && state.data.profile.name) || "").split(" ")[0];
  function toast(msg) { document.querySelectorAll(".toast").forEach(x => x.remove()); const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
  const flower = (c, size, style) => '<svg class="fl" style="width:' + size + 'px;' + style + '" viewBox="0 0 100 100" aria-hidden="true"><g fill="' + c + '"><ellipse cx="50" cy="24" rx="14" ry="22"/><ellipse cx="50" cy="24" rx="14" ry="22" transform="rotate(72 50 50)"/><ellipse cx="50" cy="24" rx="14" ry="22" transform="rotate(144 50 50)"/><ellipse cx="50" cy="24" rx="14" ry="22" transform="rotate(216 50 50)"/><ellipse cx="50" cy="24" rx="14" ry="22" transform="rotate(288 50 50)"/></g><circle cx="50" cy="50" r="11" fill="#E7DCA2"/></svg>';
  const I = {
    flower: '<svg width="18" height="18" viewBox="4 0 92 92" aria-hidden="true"><g fill="#E9765F"><ellipse cx="50" cy="20" rx="13" ry="19"/><ellipse cx="50" cy="20" rx="13" ry="19" transform="rotate(72 50 46)"/><ellipse cx="50" cy="20" rx="13" ry="19" transform="rotate(144 50 46)"/><ellipse cx="50" cy="20" rx="13" ry="19" transform="rotate(216 50 46)"/><ellipse cx="50" cy="20" rx="13" ry="19" transform="rotate(288 50 46)"/></g><circle cx="50" cy="46" r="10" fill="#E7DCA2"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg>',
    back: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.5 4l-6 6 6 6"/></svg>',
    user: '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="8" r="3.5"/><path d="M4 19c1-3.5 3.8-5 7-5s6 1.5 7 5"/></svg>',
    home: '<svg width="24" height="24" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 10L11 4l7.5 6v8h-15z"/></svg>',
    eat: '<svg width="24" height="24" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 4v8a3 3 0 006 0V4M8 4v18M18 4c-2 0-3 3-3 7s1 5 3 5v6"/></svg>',
    prog: '<svg width="24" height="24" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 17.5l5-5 3.5 3.5 6.5-7.5"/></svg>',
    coach: '<svg width="24" height="24" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h14v9H9l-4 3.5V14H4z"/></svg>'
  };
  const navBar = cur => '<nav class="nav" aria-label="Main">' + [["today", "Today", I.home], ["eat", "Eat", I.eat], ["progress", "Progress", I.prog], ["coach", "Coach", I.coach]].map(([k, l, ic]) => '<a href="#/' + k + '"' + (cur === k ? ' class="on" aria-current="page"' : "") + ">" + ic + l + "</a>").join("") + "</nav>";
  const demoBar = () => S.live ? "" : '<div class="demo-bar">Demo mode: saved on this device only. <button data-a="resetDemo">Start over</button></div>';
  const word = (w) => '<div class="word"><q>' + esc(w.text) + "</q><small>" + esc(w.ref) + "</small></div>";
  const page = (inner, nav, cls) => demoBar() + '<main class="screen' + (cls ? " " + cls : "") + '">' + inner + "</main>" + (nav ? navBar(nav) : "");
  const opt = (on, label, small, action, val) => '<button class="opt' + (on ? " on" : "") + '" data-a="' + action + '" data-v="' + esc(val) + '" aria-pressed="' + on + '">' + "<span>" + esc(label) + (small ? "<small>" + esc(small) + "</small>" : "") + '</span><span class="tk">' + I.check + "</span></button>";

  async function reload() { state.data = await S.load(); }
  // ---- memberships ----
  // Edit prices and the "what's included" lists here. Stripe prices must match.
  const TRIAL_DAYS = 3, FREE_WORKOUTS = 2;
  const PLAN_INFO = {
    free: { name: "Free", price: "$0", per: "forever", items: [
      "Your personal plan from the quiz, for any program",
      FREE_WORKOUTS + " guided workouts a week with exercise diagrams",
      "Low-energy workouts and rest timer",
      "Today's meal ideas and recipes",
      "Step tracking, weigh-ins and workout history",
      "Daily verse and encouragement",
      "Coach Faith everyday encouragement: 120 saved replies across 38 topics"] },
    core: { name: "Core", price: "$4.99", per: "/month", items: [
      "Everything in Free",
      "Your full weekly schedule, every workout day",
      "Workouts that add weight and reps as you get stronger",
      "Meal swaps and your weekly grocery list",
      "Strength charts for every lift",
      "Coach Faith full library: 450+ saved replies with tips on form, meals, sleep, running and more, even offline"] },
    coach: { name: "AI Coach", price: "$9.99", per: "/month", items: [
      "Everything in Core",
      "Coach Faith AI: real, personal answers about your plan",
      "Help with swaps, tired days, meals and motivation, any time"] }
  };
  const isPaid = () => ["core", "coach"].includes(state.data.plan);
  const hasCoach = () => state.data.plan === "coach";
  const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function trial() {
    const start = new Date(state.data.trialStarted || Date.now()).getTime(), ends = start + TRIAL_DAYS * 86400000;
    const msLeft = ends - Date.now();
    return { start, active: msLeft > 0, daysLeft: Math.max(1, Math.ceil(msLeft / 86400000)) };
  }
  // coach | core | trial | free
  function tier() { if (hasCoach()) return "coach"; if (isPaid()) return "core"; return trial().active ? "trial" : "free"; }
  const full = () => tier() !== "free";
  const cardForTrial = () => !!(window.BBF_CONFIG && window.BBF_CONFIG.cardForTrial);
  const fmtDay = ms => new Date(ms).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const trialEndText = () => fmtDay(trial().start + TRIAL_DAYS * 86400000);
  // During the trial, small tags show which plan keeps each feature
  const ptag = k => tier() === "trial" ? '<span class="ptag ptag-' + k + '">' + (k === "coach" ? "AI Coach" : "Core") + "</span>" : "";
  // Members without the AI coach get saved replies: the starter set on Free, the full library otherwise.
  const basicCoach = () => tier() === "free";
  const hasAccess = () => true;

  // ---- Coach Faith across the app ----
  // AI Coach members get notes written from their real data; everyone else gets a fitting saved note.
  const notes = {};
  function coachCtx() {
    const d = state.data, p = d.profile, plan = E.buildToday(p, d.workouts, {});
    return { name: p.name, today: plan.name + " (" + plan.minutes + " min)", workoutsThisWeek: plan.doneWeek, weeklyGoal: plan.target };
  }
  function savedNote(id, prompt) {
    if (!notes[id]) notes[id] = window.BBF_DEMO_COACH ? window.BBF_DEMO_COACH(prompt, coachCtx(), { basic: tier() === "free" }) : "";
    return notes[id];
  }
  function noteCard(title, id, body, extra) {
    return '<div class="card coach-note"><div class="cn-head"><span class="cn-av" aria-hidden="true">' + I.flower + '</span><span class="label">' + title + '</span></div><p class="cn-text" id="' + id + '">' + body + "</p>" + (extra || "") + "</div>";
  }
  // Shows a saved note right away; for AI Coach members swaps in the personal note when it arrives.
  function coachNote(kind, key, title, prompt, extra) {
    const id = "cn-" + kind + "-" + key.replace(/[^\w-]/g, "");
    if (tier() === "trial" && window.BBF_PREVIEW) {
      let text = ""; try { text = window.BBF_PREVIEW[kind](state.data); } catch (e) {}
      return noteCard(title + " " + ptag("coach"), id, esc(text || savedNote(id, prompt)), extra);
    }
    if (!hasCoach()) return noteCard(title, id, esc(savedNote(id, prompt)), extra);
    const ck = "bbf_note_" + id;
    let cached = notes[ck]; try { cached = cached || localStorage.getItem(ck); } catch (e) {}
    if (cached) return noteCard(title, id, esc(cached), extra);
    setTimeout(async () => {
      try {
        const r = await S.insight(kind, key.split(":")[0], key.includes(":") && !key.endsWith(":1"));
        const text = r && r.text;
        const el = document.getElementById(id);
        const out = text || savedNote(id, prompt);
        if (text) { notes[ck] = text; try { localStorage.setItem(ck, text); } catch (e) {} }
        if (el) el.textContent = out;
      } catch (e) { const el = document.getElementById(id); if (el) el.textContent = savedNote(id, prompt); }
    }, 0);
    return noteCard(title, id, '<span class="muted">Coach Faith is writing your note…</span>', extra);
  }

  const lock = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>';
  const upsell = (title, text) => '<div class="card upsell"><span class="label" style="display:flex;align-items:center;gap:6px;color:var(--coral)">' + lock + ' Core feature</span><h3>' + title + '</h3><p class="small">' + text + '</p><a class="btn" href="#/plans">See plans from ' + PLAN_INFO.core.price + '/month</a></div>';
  let memPending = null;
  const PKEY = "bbf_pending_setup";
  function loadPending() { try { const v = localStorage.getItem(PKEY); return v ? JSON.parse(v) : memPending; } catch (e) { return memPending; } }
  function savePending(s) { memPending = s; try { localStorage.setItem(PKEY, JSON.stringify(s)); } catch (e) {} }
  function clearPending() { memPending = null; try { localStorage.removeItem(PKEY); } catch (e) {} }
  const blankSetup = () => ({ programs: [], place: [], injuries: [], allergies: [] });
  const bloom = (n, total) => { const cols = ["#E9765F", "#8FCDC6", "#E7D58E", "#F3B4A7", "#8FCDC6", "#E9765F", "#E7D58E", "#F3B4A7", "#8FCDC6"]; let s = '<svg width="44" height="44" viewBox="0 0 100 100" aria-hidden="true">'; for (let k = 0; k < total; k++) { if (k < n) s += '<ellipse cx="50" cy="22" rx="12" ry="20" fill="' + cols[k % cols.length] + '" transform="rotate(' + (k * 360 / total) + ' 50 50)"/>'; } return s + '<circle cx="50" cy="50" r="11" fill="#E7DCA2"/></svg>'; };
  // Friendly wording for save errors (the technical detail goes to the browser console)
  function friendly(e) {
    const m = String((e && e.message) || e || "");
    console.error("save error:", m);
    if (/fetch|network|offline|load failed/i.test(m)) return "You seem to be offline. Please check your connection and try again.";
    if (/jwt|session|sign in|auth/i.test(m)) return "Please sign in again to save that.";
    if (/schema cache|does not exist|column|relation/i.test(m)) return "We couldn't save that yet. The app is finishing setup, so please try again soon.";
    if (/violates check|constraint/i.test(m)) return "That number looks off. Please check it and try again.";
    return "We couldn't save that. Please try again.";
  }
  // Update the screen right away, save in the background, and undo if the save fails.
  async function quick(local, remote, msg) {
    const backup = JSON.stringify(state.data);
    try { local(state.data); } catch (e) {}
    render();
    if (msg) toast(msg);
    try { await remote(); }
    catch (e) { state.data = JSON.parse(backup); render(); toast(friendly(e)); }
  }
  async function act(fn) { if (state.busy) return; state.busy = true; try { await fn(); } catch (e) { toast(e.message || "Something went wrong. Please try again."); } finally { state.busy = false; } }

  // ---------- auth screens ----------
  function welcome() {
    const feats = [
      ["\u{1F4AA}", "Plans that adapt", "Workouts that grow with you, even on low-energy days."],
      ["\u{1F33F}", "Coach Faith", "A warm, faith-filled coach who helps you keep going."],
      ["\u{1F957}", "Meals made simple", "Recipes, easy swaps and a grocery list that fit you."],
      ["\u{1F4C8}", "See your progress", "Strength, steps and wins, all in one place."]
    ];
    return page('<div class="hero-card"><div class="hc-top">' + flower("#9ED3CF", 30, "right:18px;top:16px") +
      '<span class="eyebrow">For every season of strong</span><h1 class="title">Meet Built by Faith</h1><p class="sub">Strength plans, meals and encouragement that fit your body, your schedule and your faith.</p></div>' +
      '<div class="hc-body"><div class="hc-lead"><h2>Less guessing. More getting stronger.</h2><p>Answer a few quick questions and get a plan made for you. No account needed to start.</p></div>' +
      '<div class="feat-grid">' + feats.map(f => '<div class="feat"><span class="feat-ic" aria-hidden="true">' + f[0] + '</span><h3>' + f[1] + '</h3><p>' + f[2] + '</p></div>').join("") + '</div>' +
      '<a class="btn btn-glow" href="#/setup/0">Find my program</a></div></div>' +
      '<p class="center muted small">Already have an account? <a class="link" href="#/login" style="padding:0">Sign in</a></p>', null, "no-nav");
  }

  function authForm(kind) {
    const titles = { signup: ["Create your account", "Let's get you set up. It takes about two minutes."], login: ["Welcome back", "Good to see you again."], forgot: ["Reset your password", "We'll email you a link to choose a new one."], "new-password": ["Choose a new password", "Use at least 8 characters."] };
    let [t, s] = titles[kind];
    if (kind === "signup" && loadPending()) { t = "Save your plan"; s = "Create your account to start your plan. It takes 30 seconds."; }
    let fields = "";
    if (kind === "signup") fields += '<div class="field"><label for="nm">First name</label><input id="nm" autocomplete="given-name" maxlength="40" required></div>';
    if (kind !== "new-password") fields += '<div class="field"><label for="em">Email</label><input id="em" type="email" autocomplete="email" required></div>';
    if (kind !== "forgot") fields += '<div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="' + (kind === "login" ? "current-password" : "new-password") + '" minlength="8" required></div>';
    const btn = { signup: "Create account", login: "Sign in", forgot: "Send reset link", "new-password": "Save password" }[kind];
    const foot = kind === "login" ? '<a class="link center" href="#/forgot">Forgot your password?</a><a class="link center" href="#/signup">New here? Create an account</a>' : kind === "signup" ? '<a class="link center" href="#/login">Already have an account? Sign in</a>' : '<a class="link center" href="#/login">Back to sign in</a>';
    return page('<a class="icon-btn" href="#/welcome" aria-label="Back" style="background:var(--card)">' + I.back + '</a><h1 class="title">' + t + '</h1><p class="sub">' + s + "</p>" +
      '<form data-f="' + kind + '" novalidate style="display:flex;flex-direction:column;gap:12px">' + fields + '<div class="err" id="err" role="alert"></div><button class="btn" type="submit">' + btn + "</button></form>" + foot +
      (S.live ? "" : '<p class="note">Demo mode: any email and password work, and nothing leaves this device.</p>'), null, "no-nav");
  }

  // ---------- setup ----------
  const SETUP = [
    { key: "programs", multi: true, eb: "Your season", q: "What would you like help with?", hint: "Pick all that apply. Your first pick leads your plan.", opts: Object.keys(C.PROGRAMS).map(k => [k, C.PROGRAMS[k].name, C.PROGRAMS[k].short]) },
    { key: "experience", eb: "Your starting point", q: "How much lifting have you done?", hint: "No wrong answers. Everyone starts somewhere.", opts: [["never", "Basically none", "Show me everything"], ["some", "A bit, on and off", "I know a few moves"], ["regular", "I train regularly", "Push me"]] },
    { key: "days", eb: "Your week", q: "How many days a week can you train?", hint: "Pick what you can keep, not what sounds impressive.", opts: [[2, "2 days", ""], [3, "3 days", "Most popular"], [4, "4 days", ""], [5, "5 days", ""]], grid: true },
    { key: "minutes", eb: "Your time", q: "How long can you train most days?", hint: "Showing up beats long sessions.", opts: [[20, "15–20 minutes", "Short and focused"], [30, "About 30 minutes", "The sweet spot"], [45, "45 minutes or more", "Room for extra work"]] },
    { key: "place", multi: true, eb: "Your space", q: "Where will you train?", hint: "Pick all that apply. Workouts only use what you have.", opts: [["bare", "At home, no equipment", ""], ["db", "At home, with dumbbells or bands", ""], ["gym", "At a gym", ""], ["out", "Outdoors", "Park, trail, track or backyard"]] },
    { key: "injuries", multi: true, eb: "Your body", q: "Anything we should work around?", hint: "We'll swap exercises to protect these areas.", opts: [["knees", "Knees", ""], ["back", "Lower back", ""], ["wrists", "Wrists", ""], ["shoulders", "Shoulders", ""], ["none", "Nothing right now", ""]], grid: true },
    { key: "diet", eb: "Your food", q: "Which way of eating fits you best?", hint: "Your meal plan only shows recipes that fit.", opts: C.DIETS.map(d => [d, d.charAt(0).toUpperCase() + d.slice(1).replace("-", " "), ""]), grid: true },
    { key: "allergies", multi: true, eb: "Your food", q: "Any allergies or foods to avoid?", hint: "We'll leave these out of every recipe.", opts: C.ALLERGENS.map(a => [a, a.charAt(0).toUpperCase() + a.slice(1), ""]).concat([["none", "No allergies", ""]]), grid: true, dislikes: true },
    { key: "raceDate", eb: "Your race", q: "When is your race?", hint: "Your plan counts down to race day and tapers the last two weeks.", date: true, only: s => (s.programs || []).includes("race") }
  ];
  const stepsFor = s => SETUP.filter(st => !st.only || st.only(s));

  function setupScreen(n) {
    const s = state.setup;
    const steps = stepsFor(s);
    const st = steps[n];
    if (!st) return "";
    const val = s[st.key];
    const pct = Math.round((n + 1) / steps.length * 100);
    let body = "";
    if (st.date) body = '<div class="field"><label for="rd">Race date</label><input id="rd" type="date" value="' + esc(val || "") + '" min="' + today() + '"></div><button class="link" data-a="noRace">I don\'t have a date yet</button>';
    else body = '<div class="opts' + (st.grid ? " grid" : "") + '">' + st.opts.map(o => opt(st.multi ? (val || []).includes(o[0]) : val === o[0], o[1], o[2], "pick", JSON.stringify([st.key, o[0], !!st.multi]))).join("") + "</div>";
    if (st.dislikes) body += '<div class="field"><label for="dl">Foods you just don\'t like (optional)</label><input id="dl" placeholder="e.g. mushrooms, olives" value="' + esc(s.dislikes || "") + '"></div>';
    const ready = st.date ? true : st.multi ? (val || []).length > 0 : val != null;
    const last = n === steps.length - 1;
    return page('<div class="top">' +
      '<div class="row"><button class="icon-btn" data-a="setupBack" aria-label="Back">' + I.back + '</button><span class="chip" style="background:#fff">Step ' + (n + 1) + " of " + steps.length + '</span>' + bloom(n, steps.length) + '</div><div class="progress"><i style="width:' + pct + '%"></i></div>' +
      '<span class="eyebrow">' + st.eb + '</span><h1 class="title">' + st.q + '</h1><p class="sub">' + st.hint + "</p></div>" + body +
      '<div class="setup-foot"><p class="center muted" style="font-family:var(--display);font-style:italic;font-weight:700">' + esc(E.affirmation("start", n)) + '</p><button class="btn" data-a="setupNext" ' + (ready ? "" : "disabled") + ">" + (last ? "Build my plan" : "Continue") + "</button></div>", null, "no-nav");
  }

  // ---------- quiz result (before an account) ----------
  function resultScreen() {
    const s = loadPending();
    if (!s || !s.programs || !s.programs.length) { go("#/setup/0"); return ""; }
    const prof = { setup: s, progression: {}, settings: {} };
    const plan = E.buildToday(prof, []);
    const names = s.programs.map(k => C.PROGRAMS[k].name);
    const why = [
      s.experience === "never" ? "Starts gently, with simple moves and clear cues." : s.experience === "regular" ? "Progresses faster, matched to your experience." : "Starts just above where you are and builds each week.",
      s.days + " days a week, about " + s.minutes + " minutes each.",
      (s.injuries && s.injuries.length ? "Exercises are swapped to protect your " + s.injuries.join(" and ") + "." : "Every workout uses only the space and equipment you picked."),
      "Meals fit your " + (s.diet || "balanced") + " way of eating" + (s.allergies && s.allergies.length ? ", with no " + s.allergies.join(", ") : "") + "."
    ];
    const first = plan.run ? '<p class="small">' + esc(plan.run.detail) + "</p>" : plan.exercises.map(x => '<div class="ex"><span>' + esc(x.name) + "</span><b>" + x.sets + " × " + (x.kind === "time" ? x.secs + " s" : x.reps) + "</b></div>").join("");
    return page('<div class="top" style="min-height:220px;justify-content:flex-end">' + flower("#F0A99C", 44, "right:18px;top:26px") + flower("#9ED3CF", 28, "right:76px;top:90px;animation-delay:-1s") + flower("#E7DCA2", 30, "left:20px;top:40px;animation-delay:-2s") +
      '<span class="eyebrow">Your plan is in full bloom</span><h1 class="title" style="font-size:32px">' + esc(names[0]) + "</h1>" + (names.length > 1 ? '<div class="chips">' + names.slice(1).map(n => '<span class="chip" style="background:#fff">+ ' + esc(n) + "</span>").join("") + "</div>" : "") + '<p class="sub">' + esc(C.PROGRAMS[s.programs[0]].short) + "</p></div>" +
      '<div class="card"><span class="label">Why it fits you</span><ul class="list small">' + why.map(w => "<li>" + esc(w) + "</li>").join("") + "</ul></div>" +
      '<div class="card"><span class="label">Your first workout</span><div class="ex"><h3>' + esc(plan.name) + '</h3><span class="small muted">' + plan.minutes + " min</span></div>" + first + "</div>" +
      '<a class="btn" href="#/signup">Create my account to start</a><a class="btn soft" href="#/login">I already have an account</a><button class="link center" data-a="redoQuiz">Change my answers</button>' +
      '<p class="center muted" style="font-family:var(--display);font-style:italic;font-weight:700">' + esc(E.affirmation("start")) + "</p>", null, "no-nav");
  }

  // ---------- plans (paywall) ----------
  function plans() {
    const t = tier(), tr = trial();
    const head = t === "trial"
      ? '<span class="eyebrow">Free trial · ' + tr.daysLeft + (tr.daysLeft === 1 ? " day" : " days") + ' left</span><h1 class="title">Choose what fits you</h1><p class="sub">You\'re trying everything right now. After your trial you keep the Free plan, or pick Core or AI Coach any time.</p>'
      : t === "free" ? '<span class="eyebrow">Your free trial has ended</span><h1 class="title">Keep growing stronger</h1><p class="sub">You\'re on the Free plan now, and it stays free. Choose Core or AI Coach any time to keep your full schedule, meals and coach.</p>'
      : '<span class="eyebrow">Your membership</span><h1 class="title">Your plan</h1><p class="sub">' + (state.data.status === "trialing" && state.data.periodEnd ? "Free until " + fmtDay(state.data.periodEnd) + ", then billing starts. " : "") + 'Switch plans or manage billing any time.</p>';
    const ck = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg>';
    const card = (k, hl, btn) => { const i = PLAN_INFO[k], cur = (t === k) || (k === "free" && t === "free");
      if (t === "trial" && !cardForTrial()) btn = "";
      return '<div class="card plan' + (hl ? " hl" : "") + '">' + (hl ? '<span class="label" style="color:var(--coral)">Most encouraging</span>' : "") +
        '<div class="ex"><h3>' + i.name + '</h3>' + (cur ? '<span class="chip">Your plan</span>' : "") + '</div><p class="plan-price">' + i.price + '<span> ' + i.per + '</span></p>' +
        '<ul class="plan-list">' + i.items.map(x => "<li>" + ck + "<span>" + esc(x) + "</span></li>").join("") + "</ul>" + (cur ? "" : btn) + "</div>"; };
    return page('<div class="top">' + flower("#F0A99C", 34, "right:18px;top:24px") + head + '</div>' +
      (t === "trial" ? (cardForTrial()
        ? '<div class="note"><b>Choose now, pay later.</b> You won\'t be charged until your free trial ends on ' + trialEndText() + '. AI Coach switches on right away.</div>'
        : '<div class="note"><b>No card needed during your trial.</b> Enjoy everything until ' + trialEndText() + '. Then pick the plan that fits you, or keep using Free.</div>') : "") +
      card("coach", true, '<button class="btn" data-a="checkout" data-v="coach">Choose AI Coach</button>' + (t === "trial" ? '<p class="small muted center">Free until ' + trialEndText() + ', then ' + PLAN_INFO.coach.price + '/month</p>' : "")) +
      card("core", false, '<button class="btn soft" data-a="checkout" data-v="core">Choose Core</button>' + (t === "trial" ? '<p class="small muted center">Free until ' + trialEndText() + ', then ' + PLAN_INFO.core.price + '/month</p>' : "")) +
      card("free", false, "") +
      (isPaid() ? '<button class="btn soft" data-a="portal">Manage or cancel</button>' : '<p class="small muted center">Cancel any time from your profile. No card needed for Free.</p>') +
      '<a class="btn mint" href="#/today">Back to today</a>' +
      (!isPaid() ? '<button class="link center" data-a="refresh">I already subscribed</button>' : ""), null, "no-nav");
  }

  // ---------- today ----------
  function todayScreen() {
    const d = state.data, p = d.profile;
    const plan = E.buildToday(p, d.workouts, { energy: state.energy });
    const daily = d.daily[today()] || {};
    const meals = E.mealsFor(p.setup, daily);
    const ate = meals.filter(m => m.status === "ate").length;
    const steps = daily.steps || 0, stepGoal = (p.settings && p.settings.stepGoal) || 7000;
    const away = E.daysSinceLast(d.workouts);
    const doneToday = d.workouts.some(w => w.date === today());
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const ring = (pctv, col, label, val, action) => '<button class="ring" ' + (action ? 'data-a="' + action + '"' : "") + ' aria-label="' + label + ": " + val + '"><span class="r" style="background:conic-gradient(' + col + " " + Math.min(100, pctv) + '%,#F1E7E0 0)"><span>' + val + "</span></span><small>" + label + "</small></button>";
    const nextMeal = meals.find(m => m.status !== "ate");
    const raceW = E.raceWeeks(p.setup);

    let workoutCard;
    const capped = !full() && plan.doneWeek >= FREE_WORKOUTS;
    if (capped && !doneToday) {
      workoutCard = '<div class="card" style="background:var(--butter-soft);border-color:transparent"><span class="label">This week</span><h3>You did your ' + FREE_WORKOUTS + ' free workouts. Well done!</h3><p class="small">Take a walk or stretch today. Your next free workouts open on Monday, or unlock your full weekly schedule with Core.</p><a class="btn" href="#/plans">See plans from ' + PLAN_INFO.core.price + '/month</a><button class="btn soft" data-a="stepsToggle">Log a walk</button></div>';
    } else if (doneToday) {
      workoutCard = '<div class="card" style="background:var(--mint-soft);border-color:transparent"><span class="label">Today</span><h3>Workout done. Well done' + (firstName() ? ", " + esc(firstName()) : "") + '.</h3><p class="small">' + esc(E.affirmation("done")) + '</p><a class="btn soft" href="#/progress">See your progress</a></div>';
    } else {
      const lines = plan.run ? '<p class="small">' + esc(plan.run.detail) + "</p>" : plan.exercises.map(x => '<div class="ex"><span>' + esc(x.name) + "</span><b>" + x.sets + " × " + (x.kind === "time" ? x.secs + " s" : x.reps) + "</b></div>").join("");
      workoutCard = '<div class="card" style="box-shadow:0 14px 34px rgba(31,42,51,.07)"><div class="ex"><h3>' + esc(plan.name) + '</h3><span class="muted small">' + plan.minutes + " min</span></div>" +
        (plan.goalMet ? '<p class="note">You hit your goal of ' + plan.target + ' workouts this week. This one is a bonus.</p>' : "") + lines +
        '<div><span class="label">How\'s your energy?</span><div class="opts grid" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:6px">' + [["low", "Low"], ["ok", "Okay"], ["good", "Good"]].map(([k, l]) => '<button class="opt' + ((state.energy || "ok") === k ? " on" : "") + '" style="min-height:44px;justify-content:center;padding:0" data-a="energy" data-v="' + k + '" aria-pressed="' + ((state.energy || "ok") === k) + '">' + l + "</button>").join("") + "</div></div>" +
        (state.energy === "low" ? '<p class="small muted">' + esc(E.affirmation("rest")) + "</p>" : "") +
        '<button class="btn" data-a="startWorkout">Start workout</button></div>';
    }

    return page('<div class="top">' + flower("#F0A99C", 34, "right:16px;top:80px") +
      '<div class="row"><span class="eyebrow">' + new Date().toLocaleDateString(undefined, { weekday: "long" }) + " · " + esc(C.PROGRAMS[E.mainProgram(p.setup)].name) + '</span><a class="icon-btn" href="#/profile" aria-label="Profile and settings">' + I.user + "</a></div>" +
      '<h1 class="title">' + greet + (firstName() ? ", " + esc(firstName()) : "") + ".</h1>" + word(E.dailyWord()) +
      (tier() === "trial" ? '<a class="trial-pill" href="#/plans"><span>Free trial · ' + trial().daysLeft + (trial().daysLeft === 1 ? " day" : " days") + ' left</span><b>See plans</b></a>'
        : tier() === "free" ? '<a class="trial-pill" href="#/plans"><span>Free plan · ' + Math.max(0, FREE_WORKOUTS - plan.doneWeek) + ' of ' + FREE_WORKOUTS + ' workouts left this week</span><b>Upgrade</b></a>' : "") +
      '<div class="rings">' + ring(plan.doneWeek / plan.target * 100, "#C4553E", "This week", plan.doneWeek + "/" + plan.target) + ring(steps / stepGoal * 100, "#3E9E96", "Steps", steps >= 1000 ? (steps / 1000).toFixed(1) + "k" : String(steps), "stepsToggle") + ring(ate / Math.max(1, meals.length) * 100, "#A8892A", "Meals", ate + "/" + meals.length) + "</div>" +
      (state.stepsOpen ? '<form data-f="steps" style="display:flex;gap:8px"><label class="sr" for="st" style="position:absolute;left:-9999px">Steps today</label><input id="st" type="number" inputmode="numeric" min="0" placeholder="Steps today" value="' + (steps || "") + '" style="flex:1;min-height:44px;border-radius:999px;border:1.5px solid var(--line);padding:0 14px"><button class="btn small" type="submit">Save</button></form>' : "") +
      "</div>" +
      (away !== null && away >= 5 && !doneToday && !capped ? '<div class="card" style="background:var(--butter-soft);border-color:transparent"><h3>' + esc(E.affirmation("back")) + '</h3><p class="small">It\'s been ' + away + ' days. Let\'s ease back in with a gentle session.</p><button class="btn soft" data-a="energy" data-v="low">Start gently</button></div>' : "") +
      (raceW !== null && raceW >= 0 ? '<div class="card" style="background:var(--sky-soft);border-color:transparent"><span class="label">Race countdown</span><h3>' + (raceW === 0 ? "Race week. Trust your training." : raceW + " week" + (raceW === 1 ? "" : "s") + " to race day") + "</h3></div>" : "") +
      (doneToday
        ? coachNote("workout", today() + ":" + d.workouts.filter(w => w.date === today()).length, "Coach Faith on today's workout", (d.workouts.filter(w => w.date === today()).slice(-1)[0] || {}).effort === "hard" ? "that workout was too hard" : "I finished my workout today")
        : coachNote("daily", today(), "Coach Faith · today", away !== null && away >= 3 ? "I missed workouts and fell off" : plan.goalMet ? "I hit my goal this week" : state.energy === "low" ? "I am tired today" : "what should I do today workout", '<a class="link" href="#/coach" style="padding:0;align-self:flex-start">Talk with Coach Faith</a>')) +
      workoutCard +
      (nextMeal ? '<a class="card" href="#/eat" style="text-decoration:none;color:inherit;flex-direction:row;align-items:center"><span style="flex:1"><span class="label">Next meal</span><br><b>' + esc(nextMeal.recipe.name) + '</b><br><span class="small muted">' + nextMeal.recipe.protein + " g protein · " + nextMeal.recipe.minutes + " min</span></span>" + I.back.replace('d="M12.5 4l-6 6 6 6"', 'd="M7.5 4l6 6-6 6"') + "</a>" : "") +
      '<p class="small muted center">' + esc(C.PROGRAMS[E.mainProgram(p.setup)].tip) + "</p>", "today");
  }

  // ---------- workout player ----------
  function startWorkout() {
    const plan = E.buildToday(state.data.profile, state.data.workouts, { energy: state.energy });
    if (!full() && plan.doneWeek >= FREE_WORKOUTS) { go("#/plans"); return; }
    plan.exercises.forEach(x => { x.done = Array(x.sets).fill(false); x.weightUsed = x.weight; x.repsUsed = x.reps; });
    state.session = { plan, started: Date.now(), energy: state.energy || "ok" };
    go("#/workout");
  }

  function workoutScreen() {
    const s = state.session;
    if (!s) { go("#/today"); return ""; }
    const p = s.plan;
    const rest = (E.mainProgram(state.data.profile.setup) === "senior" || state.data.profile.setup.experience === "never") ? 90 : 60;
    let body;
    if (p.run) {
      body = '<div class="card"><h3>' + esc(p.run.name) + '</h3><p>' + esc(p.run.detail) + '</p><p class="small muted">' + esc(p.run.cue) + '</p><div class="chips"><span class="chip">' + p.minutes + " minutes</span>" + (p.run.taper ? '<span class="chip">Taper week</span>' : "") + "</div></div>";
    } else {
      body = p.exercises.map((x, i) => {
        const doneCount = x.done.filter(Boolean).length;
        const rows = x.done.map((on, j) => '<div class="set-row"><span class="set-n">Set ' + (j + 1) + "</span>" +
          (x.kind === "load" ? '<label style="position:absolute;left:-9999px" for="w' + i + "_" + j + '">Weight</label><input id="w' + i + "_" + j + '" type="number" inputmode="decimal" step="2.5" data-in="weight" data-i="' + i + '" value="' + x.weightUsed + '" aria-label="Weight in pounds"><span class="small muted">lb × ' + x.repsUsed + "</span>" :
            x.kind === "time" ? '<span class="small" style="grid-column:span 2">' + x.secs + " seconds</span>" :
              '<label style="position:absolute;left:-9999px" for="r' + i + "_" + j + '">Reps</label><input id="r' + i + "_" + j + '" type="number" inputmode="numeric" data-in="reps" data-i="' + i + '" value="' + x.repsUsed + '" aria-label="Reps"><span class="small muted">reps</span>') +
          '<button class="check' + (on ? " on" : "") + '" data-a="setDone" data-v="' + i + "," + j + '" aria-pressed="' + on + '" aria-label="Set ' + (j + 1) + ' done">' + I.check + "</button></div>").join("");
        return '<div class="card' + (doneCount === x.sets ? '" style="background:var(--mint-soft);border-color:transparent' : "") + '"><div class="ex"><h3 style="font-size:18px">' + esc(x.name) + '</h3><span class="small muted">' + doneCount + "/" + x.sets + '</span></div>' + (window.BBF_FIGURE ? window.BBF_FIGURE(x.name) : "") + '<p class="small muted">' + esc(x.cue) + "</p>" + rows + '<button class="link ask" data-a="ask" data-v="' + esc("How do I do " + x.name + " with good form" + (((state.data.profile.setup || {}).injuries || []).filter(i => i !== "none").length ? ", and is it okay for my " + state.data.profile.setup.injuries.filter(i => i !== "none").join(" and ") : "") + "?") + '">' + I.flower + ' Ask Coach Faith about this</button></div>';
      }).join("");
    }
    const timer = state.timer ? '<div class="timer" role="timer" aria-live="off"><span>Rest</span><b id="tleft">' + state.timer.left + 's</b><button data-a="skipRest">Skip</button></div>' : "";
    return page('<div class="row" style="display:flex;justify-content:space-between;align-items:center"><button class="icon-btn" style="background:var(--card)" data-a="quitWorkout" aria-label="Leave workout">' + I.back + '</button><span class="chip">' + p.minutes + " min</span></div>" +
      '<span class="eyebrow">' + esc(p.program) + '</span><h1 class="title">' + esc(p.name) + "</h1>" +
      '<p class="small muted">Warm up for 5 minutes first: march in place, arm circles and a few easy squats. Rest about ' + rest + " seconds between sets.</p>" +
      body + '<button class="btn" data-a="finishWorkout">Finish workout</button>' + timer, null, "no-nav");
  }

  function finishScreen() {
    const s = state.session;
    if (!s) { go("#/today"); return ""; }
    return page('<div class="top" style="min-height:260px;justify-content:flex-end">' + flower("#F0A99C", 44, "right:20px;top:30px") + flower("#9ED3CF", 30, "right:80px;top:96px;animation-delay:-1s") + flower("#E7DCA2", 30, "left:22px;top:46px;animation-delay:-2s") +
      '<span class="eyebrow">Workout complete</span><h1 class="title" style="font-size:34px">' + esc(E.affirmation("done", Date.now() % 7)) + "</h1>" + word(E.dailyWord()) + "</div>" +
      '<span class="label">How did that feel?</span><div class="opts">' + opt(false, "Easy", "Next time goes up a little", "effort", "easy") + opt(false, "Just right", "Steady progress", "effort", "right") + opt(false, "Too hard", "We'll hold the weight steady", "effort", "hard") + "</div>", null, "no-nav");
  }

  async function saveWorkout(effort) {
    const s = state.session, p = s.plan, prof = state.data.profile;
    const minutes = Math.max(1, Math.round((Date.now() - s.started) / 60000));
    const log = { date: today(), name: p.name, program: p.program, energy: s.energy, effort, minutes: p.run ? p.minutes : minutes,
      exercises: p.run ? [{ name: p.run.name, kind: "run", minutes: p.minutes }] : p.exercises.map(x => ({ name: x.name, kind: x.kind, sets: x.sets, weight: x.weightUsed, reps: x.repsUsed, secs: x.secs, done: x.done })) };
    await S.saveWorkout(log);
    if (!p.run && full()) {
      const progression = E.progress(prof.progression || {}, p.exercises, effort);
      await S.saveProfile({ progression });
    }
    state.session = null; state.energy = null; stopTimer();
    await reload();
    toast(!full() ? "Saved. Well done! Core adds weight for you as you get stronger." : effort === "hard" ? "Saved. We'll keep it steady next time." : "Saved. Your plan just got a little stronger.");
    go("#/today");
  }

  function startTimer(sec) {
    stopTimer();
    state.timer = { left: sec, id: setInterval(() => {
      state.timer.left--;
      const el = document.getElementById("tleft");
      if (state.timer.left <= 0) { stopTimer(); render(); toast("Rest done. Next set when you're ready."); try { navigator.vibrate && navigator.vibrate(200); } catch (e) {} return; }
      if (el) el.textContent = state.timer.left + "s";
    }, 1000) };
  }
  function stopTimer() { if (state.timer) { clearInterval(state.timer.id); state.timer = null; } }

  // ---------- eat ----------
  function eatScreen() {
    const p = state.data.profile, daily = state.data.daily[today()] || {};
    const meals = E.mealsFor(p.setup, daily);
    const slotName = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
    const tags = [(p.setup.diet || "balanced").replace("-", " ")].concat((p.setup.allergies || []).filter(a => a !== "none").map(a => "No " + a));
    return page('<div class="top">' + flower("#E7DCA2", 32, "right:18px;top:24px") + '<span class="eyebrow">' + esc(E.affirmation("eat")) + '</span><h1 class="title">Today\'s meals</h1><div class="chips">' + tags.map(t => '<span class="chip" style="background:#fff">' + esc(t) + "</span>").join("") + '<button class="chip filter" data-a="editField" data-v="diet" data-back="#/eat">Edit</button></div></div>' +
      '<div class="opts grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><a class="btn soft small" style="width:100%" href="#/recipes">Browse recipes</a><button class="btn soft small" style="width:100%" data-a="editField" data-v="allergies" data-back="#/eat">Allergies and dislikes</button></div>' +
      meals.map(m => '<div class="card' + (m.status === "ate" ? '" style="background:var(--mint-soft);border-color:transparent' : "") + '"><div class="ex"><span class="label">' + slotName[m.slot] + "</span>" + (m.status === "ate" ? '<b class="small" style="color:var(--sage)">Eaten</b>' : "") + "</div><h3>" + esc(m.recipe.name) + '</h3><span class="small muted">' + m.recipe.protein + " g protein · " + m.recipe.minutes + ' min</span><div class="opts grid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><a class="btn small" style="width:100%" href="#/recipe/' + m.recipe.id + '">Cook</a>' + (full() ? '<button class="btn small soft" style="width:100%" data-a="swap" data-v="' + m.slot + '"' + (m.options < 2 ? " disabled" : "") + '>Swap</button>' : '<a class="btn small soft" style="width:100%;gap:4px" href="#/plans" aria-label="Swap meals with Core">' + lock + 'Swap</a>') + '<button class="btn small soft" style="width:100%" data-a="ate" data-v="' + m.slot + '" aria-pressed="' + (m.status === "ate") + '">' + (m.status === "ate" ? "Undo" : "Ate it") + "</button></div></div>").join("") +
      (full() ? '<a class="btn mint" href="#/grocery">This week\'s grocery list ' + ptag("core") + '</a>' : upsell("Your weekly grocery list", "Get every ingredient for the week in one list, plus meal swaps that fit how you eat.")) + '<button class="btn soft" data-a="ask" data-v="Give me an easy high-protein meal idea for today that fits how I eat">' + I.flower + ' Ask Coach Faith for a meal idea</button>' +
      '<p class="small muted center">Change your diet or allergies anytime in your profile.</p>', "eat");
  }

  function recipeScreen(id) {
    const r = C.RECIPES.find(x => x.id === id);
    if (!r) { go("#/eat"); return ""; }
    return page('<a class="icon-btn" href="#/eat" aria-label="Back to meals" style="background:var(--card)">' + I.back + '</a><span class="eyebrow">' + esc(r.slot) + '</span><h1 class="title">' + esc(r.name) + '</h1><div class="chips"><span class="chip">' + r.protein + ' g protein</span><span class="chip">' + r.minutes + " min</span></div>" +
      '<div class="card"><span class="label">Ingredients</span><ul class="list small">' + r.ingredients.map(i => "<li>" + esc(i) + "</li>").join("") + "</ul></div>" +
      '<div class="card"><span class="label">Steps</span><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px">' + r.steps.map(s => "<li>" + esc(s) + "</li>").join("") + "</ol></div>" +
      '<p class="center muted" style="font-family:var(--display);font-style:italic;font-weight:700">Give thanks, and enjoy every bite.</p>', "eat");
  }

  function groceryScreen() {
    if (!full()) { go("#/plans"); return ""; }
    const items = E.groceryList(state.data.profile.setup);
    let got = {}; try { got = JSON.parse(localStorage.getItem("bbf_grocery_" + E.weekStart()) || "{}"); } catch (e) {}
    return page('<a class="icon-btn" href="#/eat" aria-label="Back to meals" style="background:var(--card)">' + I.back + '</a><h1 class="title">Grocery list</h1><p class="sub">Everything for the next 7 days of meals. Tap to check off.</p>' +
      '<div class="card"><ul class="list">' + items.map(it => '<li><button class="check' + (got[it.name] ? " on" : "") + '" data-a="groc" data-v="' + esc(it.name) + '" aria-pressed="' + !!got[it.name] + '" aria-label="' + esc(it.name) + '">' + I.check + '</button><span style="flex:1' + (got[it.name] ? ";text-decoration:line-through;color:var(--muted)" : "") + '">' + esc(it.name) + "</span>" + (it.count > 1 ? '<span class="small muted">×' + it.count + "</span>" : "") + "</li>").join("") + "</ul></div>", "eat");
  }

  // ---------- progress ----------
  function weeklyCard() {
    const d = state.data, ws = E.weekStart(), from = E.parseDate(today()).getTime() - 7 * 86400000;
    const recent = d.workouts.filter(w => E.parseDate(w.date).getTime() >= from);
    const mins = recent.reduce((n, w) => n + (w.minutes || 0), 0);
    const stepDays = Object.values(d.daily || {}).filter(x => x.steps && E.parseDate(x.date).getTime() >= from);
    const avgSteps = stepDays.length ? Math.round(stepDays.reduce((n, x) => n + x.steps, 0) / stepDays.length) : 0;
    const stats = '<div class="chips"><span class="chip">' + recent.length + " workout" + (recent.length === 1 ? "" : "s") + '</span><span class="chip">' + mins + ' min</span>' + (avgSteps ? '<span class="chip">' + avgSteps.toLocaleString() + " steps a day</span>" : "") + "</div>";
    if (hasCoach() || tier() === "trial") return coachNote("weekly", ws, "Your weekly check-in · last 7 days", "how am I doing this week", stats);
    return noteCard("Your week · last 7 days", "cn-week", esc(recent.length ? "You showed up " + recent.length + (recent.length === 1 ? " time" : " times") + " in the last 7 days. Every session counts, and you're building something that lasts." : "A new week is a fresh start. One workout is all it takes to begin again."), stats + '<a class="link" href="#/plans" style="padding:0;align-self:flex-start">Get a personal weekly review with AI Coach</a>');
  }

  function progressScreen() {
    const d = state.data, p = d.profile, target = p.setup.days || 3;
    const total = d.workouts.length, weeks = E.weeksOnTrack(d.workouts, target);
    const loads = {};
    d.workouts.forEach(w => (w.exercises || []).forEach(x => { if (x.kind === "load" && x.weight) (loads[x.name] = loads[x.name] || []).push({ date: w.date, weight: x.weight }); }));
    const names = Object.keys(loads);
    const lift = state.lift && loads[state.lift] ? state.lift : names[0];
    let liftCard = '<div class="card"><span class="label">Strength</span><p class="small">Finish a workout with weights and your strength chart starts here.</p></div>';
    let gain = "";
    if (lift) {
      const pts = loads[lift].slice(-8), max = Math.max(...pts.map(x => x.weight));
      const firstW = loads[lift][0].weight, lastW = loads[lift][loads[lift].length - 1].weight;
      gain = lastW - firstW;
      liftCard = '<div class="card"><div class="ex"><span class="label">Strength ' + ptag("core") + '</span>' + (names.length > 1 ? '<select data-in="lift" aria-label="Choose exercise" style="border:1px solid var(--line);border-radius:10px;padding:4px 8px;background:var(--card)">' + names.map(n => "<option" + (n === lift ? " selected" : "") + ">" + esc(n) + "</option>").join("") + "</select>" : "") + "</div><b>" + esc(lift) + '</b><div class="bars" role="img" aria-label="' + esc(lift) + " weight over the last " + pts.length + " sessions, from " + pts[0].weight + " to " + pts[pts.length - 1].weight + ' pounds">' + pts.map(x => '<i style="height:' + Math.max(6, Math.round(x.weight / max * 100)) + '%"></i>').join("") + '</div><div class="ex small muted"><span>' + pts[0].weight + " lb</span><b style=\"color:var(--ink)\">Now " + pts[pts.length - 1].weight + " lb</b></div></div>";
    }
    const hide = p.settings && p.settings.hideWeight;
    let bodyCard;
    if (hide) bodyCard = '<div class="card"><div class="ex"><span class="label">Body weight</span><button class="link small" style="padding:0" data-a="toggleWeight">Show</button></div><p class="small muted">Hidden. Strength and consistency are what matter most.</p></div>';
    else {
      const b = d.body.slice(-12);
      let chart = '<p class="small muted">Optional. Add a weigh-in once a week if it helps you.</p>';
      if (b.length >= 2) {
        const ws = b.map(x => +x.weight), mn = Math.min(...ws), mx = Math.max(...ws), rng = Math.max(1, mx - mn);
        const ptsv = ws.map((w, i) => (i / (ws.length - 1) * 300).toFixed(1) + "," + (10 + (1 - (w - mn) / rng) * 40).toFixed(1)).join(" ");
        chart = '<svg viewBox="0 0 300 60" width="100%" height="60" role="img" aria-label="Weight from ' + ws[0] + " to " + ws[ws.length - 1] + ' pounds"><polyline points="' + ptsv + '" fill="none" stroke="#3E9E96" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="ex small muted"><span>' + ws[0] + " lb</span><b style=\"color:var(--ink)\">" + ws[ws.length - 1] + " lb (" + ((ws[ws.length - 1] - ws[0]) > 0 ? "+" : "") + Math.round((ws[ws.length - 1] - ws[0]) * 10) / 10 + ")</b></div>";
      }
      bodyCard = '<div class="card"><div class="ex"><span class="label">Body weight</span><button class="link small" style="padding:0" data-a="toggleWeight">Hide</button></div>' + chart +
        (state.weightOpen ? '<form data-f="weight" style="display:flex;gap:8px"><input id="wt" type="number" inputmode="decimal" step="0.1" placeholder="Weight in lb" aria-label="Weight in pounds" style="flex:1;min-height:44px;border-radius:999px;border:1.5px solid var(--line);padding:0 14px"><button class="btn small" type="submit">Save</button></form>' : '<button class="btn soft small" style="width:100%" data-a="weightOpen">Add weigh-in</button>') + "</div>";
    }
    const recent = d.workouts.slice(-5).reverse();
    return page('<div class="top">' + flower("#9ED3CF", 34, "right:18px;top:24px") + '<span class="eyebrow">' + (total ? total + " workout" + (total === 1 ? "" : "s") + " so far" : "Your journey starts here") + '</span><h1 class="title">' + (total ? "You're growing stronger." : "Every journey starts with one step.") + "</h1>" +
      '<div class="stats"><div class="stat"><b>' + total + '</b><small>workouts</small></div><div class="stat"><b>' + weeks + '</b><small>weeks on track</small></div><div class="stat" style="background:var(--coral);color:#fff"><b>' + (gain > 0 ? "+" + gain : gain || 0) + '</b><small style="color:#fff">lb ' + esc(lift ? "on " + lift.split(" ").slice(-1)[0].toLowerCase() : "gained") + "</small></div></div></div>" +
      weeklyCard() +
      (full() ? liftCard : upsell("Strength charts", "See every lift climb week by week. Core also adds weight and reps for you as you get stronger.")) + bodyCard +
      (recent.length ? '<div class="card"><span class="label">Recent workouts</span><ul class="list small">' + recent.map(w => "<li><span style=\"flex:1\"><b>" + esc(w.name) + "</b><br><span class=\"muted\">" + E.parseDate(w.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + w.minutes + " min</span></span><span class=\"chip\">" + ({ easy: "Easy", right: "Just right", hard: "Tough" }[w.effort] || "") + "</span></li>").join("") + "</ul></div>" : "") +
      '<p class="center muted" style="font-family:var(--display);font-style:italic;font-weight:700">Faithful in little, growing in much.</p>', "progress");
  }

  // ---------- coach ----------
  function coachScreen() {
    const d = state.data;
    const saved = !hasCoach(), out = false;
    const preview = tier() === "trial";
    const trialBar = saved ? '<div class="note" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span><b>' + (preview ? "AI Coach preview:</b> answers from your own plan during your trial" : "Coach Faith:</b> " + (basicCoach() ? "everyday encouragement" : "full library")) + '</span><a class="link" href="#/plans" style="padding:0;white-space:nowrap">' + (basicCoach() ? "See plans" : "Get AI Coach") + '</a></div>' : "";
    const msgs = d.coach.length ? d.coach : [{ role: "assistant", content: "Hi" + (firstName() ? " " + firstName() : "") + "! I'm your Built by Faith coach. I know your plan and I'm here to help you keep going, especially on the hard days. What's on your mind?" }];
    return page('<div class="top" style="padding-bottom:16px">' + flower("#9ED3CF", 28, "right:18px;top:24px") + '<span class="eyebrow">Your coach</span><h1 class="title" style="font-size:24px">Here for you, every step.</h1></div>' + trialBar +
      (state.session ? '<a class="btn soft small" href="#/workout" style="align-self:flex-start">Back to your workout</a>' : "") + '<div class="chat" id="chat" aria-live="polite">' + msgs.map(m => '<div class="msg ' + (m.role === "user" ? "me" : "ai") + '">' + esc(m.content) + "</div>").join("") + (state.typing ? '<div class="msg ai muted">Typing…</div>' : "") + "</div>" +
      (d.coach.length < 2 ? '<div class="starters">' + (tier() === "trial" ? ["My knees hurt and I only have 15 minutes", "I'm tired today", "What should I eat today?", "How am I doing?", "What's my workout today?"] : ["I'm tired today", "I fell off track", "Swap an exercise", "What should I eat?", "I need encouragement"]).map(s => '<button data-a="starter" data-v="' + esc(s) + '">' + esc(s) + "</button>").join("") + "</div>" : "") +
+
      '<p class="small muted center" style="margin-bottom:70px">Your coach gives fitness encouragement, not medical advice.</p>' +
      (out ? "" : '<form class="composer" data-f="coach"><label for="cm" style="position:absolute;left:-9999px">Message your coach</label><input id="cm" autocomplete="off" placeholder="Message your coach" maxlength="600"><button class="btn small" type="submit">Send</button></form>'), "coach");
  }

  async function sendCoach(text) {
    text = (text || "").trim(); if (!text) return;
    const d = state.data, p = d.profile;
    d.coach.push({ role: "user", content: text, at: Date.now() });
    state.typing = true; render(); scrollChat();
    const plan = E.buildToday(p, d.workouts, {});
    const context = { name: p.name, programs: (p.setup.programs || []).map(k => C.PROGRAMS[k].name), today: plan.name + " (" + plan.minutes + " min)", workoutsThisWeek: plan.doneWeek, weeklyGoal: plan.target, daysSinceLastWorkout: E.daysSinceLast(d.workouts), weeksOnTrack: E.weeksOnTrack(d.workouts, plan.target), totalWorkouts: d.workouts.length, lastEffort: ({ easy: "easy", right: "just right", hard: "tough" })[(d.workouts[d.workouts.length - 1] || {}).effort] || "", experience: p.setup.experience, place: p.setup.place, injuries: p.setup.injuries, diet: p.setup.diet, raceWeeks: E.raceWeeks(p.setup) };
    try {
      if (!hasCoach()) {
        let preview = null;
        if (tier() === "trial" && window.BBF_PREVIEW) { try { preview = window.BBF_PREVIEW.reply(text, state.data); } catch (e) {} }
        const r = await S.trialCoach(text, context, basicCoach(), preview);
        if (r.reply) d.coach.push({ role: "assistant", content: r.reply }); else d.coach.pop();
        state.typing = false; render(); scrollChat(); return;
      }
      const r = await S.coach(text, context);
      d.coach.push({ role: "assistant", content: r.reply });
      if (r.offline && !state.offlineNoted) { state.offlineNoted = true; toast("Connection is weak, so your coach answered from saved encouragement."); }
    } catch (e) {
      d.coach.push({ role: "assistant", content: e.message || "I couldn't reply just now. Please try again in a moment." });
    }
    state.typing = false; render(); scrollChat();
  }
  function scrollChat() { setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 30); }

  // ---------- quick edit of one plan answer ----------
  function editScreen(key) {
    if (!state.setup) state.setup = JSON.parse(JSON.stringify(state.data.profile.setup));
    const s = state.setup, st = SETUP.find(x => x.key === key);
    if (!st) { go("#/profile"); return ""; }
    const v = s[st.key];
    let body;
    if (st.date) body = '<div class="field"><label for="rd">Race date</label><input id="rd" type="date" value="' + esc(v || "") + '" min="' + today() + '"></div><p class="small muted">Leave it empty if you don\'t have a date yet.</p>';
    else body = '<div class="opts' + (st.grid ? " grid" : "") + '">' + st.opts.map(o => opt(st.multi ? (v || []).includes(o[0]) : v === o[0], o[1], o[2], "pick", JSON.stringify([st.key, o[0], !!st.multi]))).join("") + "</div>";
    if (st.dislikes) body += '<div class="field"><label for="dl">Foods you just don\'t like (optional)</label><input id="dl" maxlength="200" placeholder="e.g. mushrooms, olives" value="' + esc(s.dislikes || "") + '"></div>';
    return page('<div class="top"><div class="row"><button class="icon-btn" data-a="cancelEdit" aria-label="Back">' + I.back + '</button></div><span class="eyebrow">' + st.eb + '</span><h1 class="title">' + st.q + '</h1><p class="sub">' + st.hint + "</p></div>" + body +
      '<div class="setup-foot"><button class="btn" data-a="saveEdit">Save</button><button class="btn soft" data-a="cancelEdit">Cancel</button></div>', null, "no-nav");
  }

  // ---------- browse recipes ----------
  function recipesScreen() {
    const setup = state.data.profile.setup, slots = ["breakfast", "lunch", "dinner", "snack"], cur = state.recipeSlot || "all";
    const names = { all: "All", breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" };
    const shown = cur === "all" ? slots : [cur];
    const total = slots.reduce((n, sl) => n + E.recipesFor(setup, sl).length, 0);
    return page('<div class="top">' + flower("#E7DCA2", 30, "right:18px;top:20px") + '<div class="row"><a class="icon-btn" href="#/eat" aria-label="Back to meals">' + I.back + '</a></div><span class="eyebrow">' + total + ' recipes that fit you</span><h1 class="title">Browse recipes</h1><p class="sub">Every recipe here fits your way of eating and leaves out your allergies.</p>' +
      '<div class="chips">' + Object.keys(names).map(k => '<button class="chip filter' + (cur === k ? " on" : "") + '" data-a="recipeFilter" data-v="' + k + '">' + names[k] + "</button>").join("") + "</div></div>" +
      shown.map(sl => { const list = E.recipesFor(setup, sl); return '<span class="label">' + names[sl === "snack" ? "snack" : sl] + " · " + list.length + "</span>" + list.map(r =>
        '<div class="card recipe-row"><a href="#/recipe/' + r.id + '" style="text-decoration:none;color:inherit"><h3 style="font-size:17px">' + esc(r.name) + '</h3><span class="small muted">' + r.protein + " g protein · " + r.minutes + " min</span></a>" +
        (full() ? '<button class="btn small soft" data-a="useRecipe" data-v="' + sl + "|" + r.id + '">Use for today\'s ' + sl + "</button>" : '<a class="btn small soft" href="#/plans" style="gap:4px">' + lock + " Add to today with Core</a>") + "</div>").join(""); }).join("") +
      '<button class="btn soft" data-a="editField" data-v="diet" data-back="#/recipes">Change my way of eating</button>', "eat");
  }

  // ---------- profile ----------
  function planRows(s) {
    const lbl = (key, v) => { const st = SETUP.find(x => x.key === key); if (!st || !st.opts) return v; const f = o => (st.opts.find(x => x[0] === o) || [o, o])[1]; return Array.isArray(v) ? (v.length ? v.map(f).join(", ") : "None") : f(v); };
    const rows = [["programs", "Programs", (s.programs || []).map(k => C.PROGRAMS[k].name).join(" + ")], ["experience", "Experience", lbl("experience", s.experience)], ["days", "Days a week", s.days + " days"], ["minutes", "Workout length", lbl("minutes", s.minutes)],
      ["place", "Where you train", lbl("place", s.place || [])], ["injuries", "Areas to protect", lbl("injuries", (s.injuries || []).length ? s.injuries : [])], ["diet", "Way of eating", lbl("diet", s.diet)], ["allergies", "Allergies and dislikes", lbl("allergies", s.allergies || []) + (s.dislikes ? " · no " + s.dislikes : "")]];
    if ((s.programs || []).includes("race")) rows.push(["raceDate", "Race date", s.raceDate ? E.parseDate(s.raceDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No date yet"]);
    return '<div class="card"><span class="label">Your plan · tap to change</span><ul class="list">' + rows.map(r => '<li><button class="edit-row" data-a="editField" data-v="' + r[0] + '"><span><small>' + r[1] + "</small>" + esc(r[2] || "Not set") + '</span><b aria-hidden="true">›</b></button></li>').join("") + "</ul></div>";
  }

  function profileScreen() {
    const d = state.data, p = d.profile, s = p.setup;
    const freeUntil = d.status === "trialing" && d.periodEnd ? " · free until " + fmtDay(d.periodEnd) : "";
    const planName = { coach: "AI Coach" + freeUntil, core: "Core" + freeUntil, trial: "Free trial · " + trial().daysLeft + (trial().daysLeft === 1 ? " day" : " days") + " left", free: "Free" }[tier()];
    return page('<a class="icon-btn" href="#/today" aria-label="Back to today" style="background:var(--card)">' + I.back + '</a><h1 class="title">Your profile</h1>' +
      '<form data-f="name" class="card"><div class="field"><label for="pn">First name</label><input id="pn" value="' + esc(p.name) + '"></div><button class="btn soft small" type="submit">Save name</button></form>' +
      planRows(s) +
      '<div class="card"><span class="label">Membership</span><p><b>' + planName + "</b>" + "" + "</p>" + (d.plan === "core" ? '<button class="btn small" data-a="checkout" data-v="coach">Add the AI coach</button>' : "") + (d.plan !== "none" ? '<button class="btn soft small" data-a="portal">Manage or cancel</button>' : '<a class="btn small" href="#/plans">Choose a plan</a>') + "</div>" +
      '<div class="card"><span class="label">Daily step goal</span><div class="opts grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + [5000, 7000, 8000, 10000, 12000, 15000].map(g => '<button class="opt' + (((p.settings || {}).stepGoal || 7000) === g ? " on" : "") + '" style="min-height:44px;justify-content:center;padding:6px" data-a="stepGoal" data-v="' + g + '">' + g.toLocaleString() + "</button>").join("") + "</div></div>" +
      '<div class="card"><span class="label">Preferences</span><button class="opt' + (s && p.settings && p.settings.hideWeight ? " on" : "") + '" data-a="toggleWeight" aria-pressed="' + !!(p.settings && p.settings.hideWeight) + '"><span>Hide body weight<small>Focus on strength and consistency</small></span><span class="tk">' + I.check + "</span></button></div>" +
      '<button class="btn soft" data-a="signOut">Sign out</button>' +
      (state.confirmDelete ? '<div class="card" style="border-color:var(--coral)"><p><b>Delete all your data?</b></p><p class="small">This removes your workouts, meals, progress and coach messages. It can\'t be undone.' + (d.plan !== "none" ? " Cancel your membership first under Manage or cancel." : "") + '</p><div class="confirm"><button class="btn soft small" data-a="cancelDelete">Keep my data</button><button class="btn small" data-a="deleteData">Delete everything</button></div></div>' : '<button class="link center" data-a="askDelete">Delete my data</button>') +
      '<p class="small muted center">Fitness guidance only, not medical advice. Check with your doctor before starting, especially if you take medication or are pregnant.</p>', null);
  }

  // ---------- router ----------
  async function render() {
    const h = (location.hash || "#/").slice(2);
    const [r, a] = h.split("/");
    const route = r.split("?")[0];
    const routeKey = r + "/" + (a || "");
    if (routeKey !== state.lastRoute && route !== "coach" && window.scrollTo) window.scrollTo(0, 0);
    state.lastRoute = routeKey;
    if (route === "new-password") { root.innerHTML = authForm("new-password"); return; }
    if (!state.user) {
      if (route === "setup") { if (!state.setup) state.setup = loadPending() || blankSetup(); root.innerHTML = setupScreen(+a || 0); return; }
      if (route === "result") { root.innerHTML = resultScreen(); return; }
      root.innerHTML = ["signup", "login", "forgot"].includes(route) ? authForm(route) : welcome();
      return;
    }
    if (!state.data) {
      try { await reload(); }
      catch (e) {
        console.error(e);
        root.innerHTML = page('<div class="top"><span class="eyebrow">Hang tight</span><h1 class="title">We couldn\'t load your plan.</h1><p class="sub">Check your connection and try again. If it keeps happening, the app may still be finishing setup.</p></div><button class="btn" data-a="retryLoad">Try again</button><button class="btn soft" data-a="signOut">Sign out</button><p class="small muted center">' + esc(e.message || "") + "</p>", null, "no-nav");
        return;
      }
    }
    let p = state.data.profile;
    const pending = loadPending();
    if ((!p || !p.setup || !p.setup.programs) && pending && pending.programs && pending.programs.length) {
      try { await S.saveProfile({ setup: pending }); clearPending(); state.setup = null; await reload(); p = state.data.profile; toast("Your plan is saved."); } catch (e) { toast(e.message); }
    }
    if (!p || !p.setup || !p.setup.programs) {
      if (route !== "setup") return go("#/setup/0");
      if (!state.setup) state.setup = { programs: [], place: [], injuries: [], allergies: [] };
      root.innerHTML = setupScreen(+a || 0); return;
    }
    if (route === "setup") { if (!state.setup) state.setup = JSON.parse(JSON.stringify(p.setup)); root.innerHTML = setupScreen(+a || 0); return; }
    if (!hasAccess() && route !== "plans" && route !== "profile") return go("#/plans");
    if (tier() === "free" && route === "today") {
      const k = "bbf_trial_end_seen_" + ((state.user && state.user.id) || "demo");
      let seen = false; try { seen = localStorage.getItem(k); } catch (e) {}
      if (!seen && state.data.trialStarted) { try { localStorage.setItem(k, "1"); } catch (e) {} return go("#/plans"); }
    }
    const screens = { today: todayScreen, plans, workout: workoutScreen, finish: finishScreen, eat: eatScreen, grocery: groceryScreen, progress: progressScreen, coach: coachScreen, profile: profileScreen };
    if (route === "recipe") { root.innerHTML = recipeScreen(a); return; }
    if (route === "edit") { root.innerHTML = editScreen(a); return; }
    if (route === "recipes") { root.innerHTML = recipesScreen(); return; }
    root.innerHTML = (screens[route] || todayScreen)();
    if (route === "coach") { scrollChat(); if (state.ask) { const q = state.ask; state.ask = null; sendCoach(q); } }
  }

  // ---------- actions ----------
  const A = {
    retryLoad() { state.data = null; render(); },
    async resendConfirm() { await act(async () => { await S.resendConfirm(state.pendingEmail); toast("Sent again. Check your inbox and spam folder."); }); },
    async resetDemo() { await S.deleteData(); state.user = null; state.data = null; state.setup = null; go("#/welcome"); },
    startWith(el) {
      const k = el.dataset.v; if (!C.PROGRAMS[k]) return;
      state.setup = loadPending() || blankSetup();
      state.setup.programs = [k].concat((state.setup.programs || []).filter(x => x !== k));
      savePending(state.setup); go("#/setup/1");
    },
    pick(el) {
      const [key, val, multi] = JSON.parse(el.dataset.v);
      const s = state.setup;
      if (multi) {
        let arr = (s[key] || []).slice();
        if (val === "none") arr = arr.includes("none") ? [] : ["none"];
        else { arr = arr.filter(x => x !== "none"); arr = arr.includes(val) ? arr.filter(x => x !== val) : arr.concat(val); }
        s[key] = arr;
      } else s[key] = val;
      const dl = document.getElementById("dl"); if (dl) s.dislikes = dl.value;
      const y = window.scrollY; render(); window.scrollTo(0, y);
    },
    setupBack() {
      const n = +(location.hash.split("/")[2] || 0);
      if (n > 0) return go("#/setup/" + (n - 1));
      if (!state.user) { savePending(state.setup); return go("#/welcome"); }
      if (state.data && state.data.profile.setup && state.data.profile.setup.programs) { state.setup = null; go("#/profile"); }
    },
    redoQuiz() { state.setup = loadPending() || blankSetup(); go("#/setup/0"); },
    noRace() { state.setup.raceDate = null; A.setupNext(); },
    async setupNext() {
      const s = state.setup, n = +(location.hash.split("/")[2] || 0), steps = stepsFor(s);
      const dl = document.getElementById("dl"); if (dl) s.dislikes = dl.value.trim();
      const rd = document.getElementById("rd"); if (rd) s.raceDate = rd.value || null;
      if (!state.user) savePending(s);
      if (n < steps.length - 1) return go("#/setup/" + (n + 1));
      if (!state.user) {
        s.injuries = (s.injuries || []).filter(x => x !== "none"); s.allergies = (s.allergies || []).filter(x => x !== "none");
        savePending(s); state.setup = null; return go("#/result");
      }
      await act(async () => {
        s.injuries = (s.injuries || []).filter(x => x !== "none"); s.allergies = (s.allergies || []).filter(x => x !== "none");
        await S.saveProfile({ setup: s });
        state.setup = null; await reload();
        toast("Your plan is ready.");
        go(hasAccess() ? "#/today" : "#/plans");
      });
    },
    async checkout(el) {
      await act(async () => {
        const r = await S.startCheckout(el.dataset.v);
        if (r && r.demo) { await reload(); toast("Membership started (demo)."); go(el.dataset.v === "coach" ? "#/coach" : "#/today"); }
      });
    },
    async refresh() { await act(async () => { await reload(); if (!isPaid()) toast("No membership found yet. It can take a minute after checkout."); else go("#/today"); }); },
    async portal() { await act(async () => { const r = await S.openPortal(); if (r && r.demo) toast("In the live app this opens Stripe to manage or cancel."); }); },
    async signOut() { await S.signOut(); state.user = null; state.data = null; go("#/welcome"); },
    energy(el) { state.energy = el.dataset.v; render(); },
    stepsToggle() { state.stepsOpen = !state.stepsOpen; render(); },
    startWorkout,
    setDone(el) {
      const [i, j] = el.dataset.v.split(",").map(Number);
      const x = state.session.plan.exercises[i];
      x.done[j] = !x.done[j];
      const rest = (E.mainProgram(state.data.profile.setup) === "senior" || state.data.profile.setup.experience === "never") ? 90 : 60;
      if (x.done[j]) startTimer(rest); else stopTimer();
      const y = window.scrollY; render(); window.scrollTo(0, y);
    },
    skipRest() { stopTimer(); const y = window.scrollY; render(); window.scrollTo(0, y); },
    quitWorkout() { stopTimer(); state.session = null; go("#/today"); },
    finishWorkout() { stopTimer(); go("#/finish"); },
    async effort(el) { await act(() => saveWorkout(el.dataset.v)); },
    async swap(el) {
      const slot = el.dataset.v, t = today(), daily = state.data.daily[t] || {}, meals = Object.assign({}, daily.meals || {});
      meals[slot] = { swap: ((meals[slot] || {}).swap || 0) + 1, status: null };
      await quick(d => { d.daily[t] = Object.assign({ date: t }, d.daily[t], { meals }); }, () => S.saveDaily(t, { meals }));
    },
    async ate(el) {
      const slot = el.dataset.v, t = today(), daily = state.data.daily[t] || {}, meals = Object.assign({}, daily.meals || {});
      const cur = meals[slot] || {}; meals[slot] = Object.assign({}, cur, { status: cur.status === "ate" ? null : "ate" });
      await quick(d => { d.daily[t] = Object.assign({ date: t }, d.daily[t], { meals }); }, () => S.saveDaily(t, { meals }), meals[slot].status === "ate" ? "Nice! Meal logged." : null);
    },
    async useRecipe(el) {
      const [slot, id] = el.dataset.v.split("|"), t = today(), daily = state.data.daily[t] || {}, meals = Object.assign({}, daily.meals || {});
      meals[slot] = { pick: id, status: null };
      await quick(d => { d.daily[t] = Object.assign({ date: t }, d.daily[t], { meals }); }, () => S.saveDaily(t, { meals }), "Added to today's " + slot + ".");
      go("#/eat");
    },
    groc(el) {
      const k = "bbf_grocery_" + E.weekStart(); let got = {};
      try { got = JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) {}
      got[el.dataset.v] = !got[el.dataset.v];
      try { localStorage.setItem(k, JSON.stringify(got)); } catch (e) {}
      const y = window.scrollY; render(); window.scrollTo(0, y);
    },
    async toggleWeight() { const st = Object.assign({}, state.data.profile.settings); st.hideWeight = !st.hideWeight; await quick(d => { d.profile.settings = st; }, () => S.saveProfile({ settings: st }), st.hideWeight ? "Body weight hidden." : "Body weight showing."); },
    async stepGoal(el) { const st = Object.assign({}, state.data.profile.settings, { stepGoal: +el.dataset.v }); await quick(d => { d.profile.settings = st; }, () => S.saveProfile({ settings: st }), "Step goal set to " + (+el.dataset.v).toLocaleString() + "."); },
    recipeFilter(el) { state.recipeSlot = el.dataset.v; render(); },
    editField(el) { state.setup = JSON.parse(JSON.stringify(state.data.profile.setup)); state.editBack = el.dataset.back || "#/profile"; go("#/edit/" + el.dataset.v); },
    async saveEdit() {
      const s = state.setup; if (!s) return go("#/profile");
      const dl = document.getElementById("dl"); if (dl) s.dislikes = dl.value.trim().slice(0, 200);
      const rd = document.getElementById("rd"); if (rd) s.raceDate = rd.value || null;
      s.injuries = (s.injuries || []).filter(x => x !== "none"); s.allergies = (s.allergies || []).filter(x => x !== "none");
      if (!s.programs || !s.programs.length || !s.place || !s.place.length) return toast("Pick at least one option.");
      const setup = JSON.parse(JSON.stringify(s)), back = state.editBack || "#/profile";
      state.setup = null;
      go(back);
      await quick(d => { d.profile.setup = setup; }, () => S.saveProfile({ setup }), "Saved. Your plan is updated.");
    },
    cancelEdit() { state.setup = null; go(state.editBack || "#/profile"); },
    weightOpen() { state.weightOpen = true; render(); },
    starter(el) { sendCoach(el.dataset.v); },
    ask(el) { state.ask = el.dataset.v; if (state.session) toast("Your workout is paused. Tap Back to your workout when you're ready."); go("#/coach"); },
    redoSetup() { state.setup = JSON.parse(JSON.stringify(state.data.profile.setup)); go("#/setup/0"); },
    askDelete() { state.confirmDelete = true; render(); },
    cancelDelete() { state.confirmDelete = false; render(); },
    async deleteData() { await act(async () => { await S.deleteData(); state.user = null; state.data = null; state.confirmDelete = false; toast("Your data was deleted."); go("#/welcome"); }); }
  };

  const F = {
    async signup() {
      const nm = val("nm"), em = val("em"), pw = val("pw");
      if (!nm) return err("Add your first name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return err("Enter an email like name@example.com.");
      if (pw.length < 8) return err("Use at least 8 characters for your password.");
      await act(async () => {
        const r = await S.signUp(nm, em, pw);
        if (r.needsConfirm) { state.pendingEmail = em; root.innerHTML = page('<h1 class="title">Check your email</h1><p class="sub">We sent a confirmation link to ' + esc(em) + '. Tap it to confirm your account, then come back and sign in.</p><p class="small muted">Don\'t see it after a few minutes? Check your spam or promotions folder.</p><a class="btn" href="#/login">Go to sign in</a><button class="btn soft" data-a="resendConfirm">Resend the email</button>', null, "no-nav"); return; }
        state.user = await S.user(); state.data = null; if (!S.live) await S.saveProfile({ name: nm }); go("#/today");
      });
    },
    async login() {
      const em = val("em"), pw = val("pw");
      if (!em || !pw) return err("Enter your email and password.");
      await act(async () => {
        try { await S.signIn(em, pw); }
        catch (e) { if (/confirm/i.test(e.message)) { state.pendingEmail = em; root.innerHTML = page('<h1 class="title">Confirm your email first</h1><p class="sub">Tap the link we sent to ' + esc(em) + ', then sign in again.</p><button class="btn" data-a="resendConfirm">Resend the email</button><a class="btn soft" href="#/login">Back to sign in</a>', null, "no-nav"); return; } throw e; }
        state.user = await S.user(); state.data = null; go("#/today");
      });
    },
    async forgot() {
      const em = val("em");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return err("Enter the email you signed up with.");
      await act(async () => { await S.resetPassword(em); toast("If that email has an account, a reset link is on its way."); go("#/login"); });
    },
    async "new-password"() {
      const pw = val("pw"); if (pw.length < 8) return err("Use at least 8 characters.");
      await act(async () => { await S.setPassword(pw); toast("Password saved."); state.user = await S.user(); go("#/today"); });
    },
    async steps() {
      const raw = val("st").replace(/[, ]/g, ""), n = Math.min(150000, Math.max(0, parseInt(raw, 10) || 0)), t = today();
      if (!raw) return toast("Type your steps, like 6500.");
      state.stepsOpen = false;
      await quick(d => { d.daily[t] = Object.assign({ date: t }, d.daily[t], { steps: n }); }, () => S.saveDaily(t, { steps: n }), n.toLocaleString() + " steps saved. Every step counts!");
    },
    async weight() {
      const w = Math.round(parseFloat(val("wt").replace(",", ".")) * 10) / 10, t = today();
      if (!w || w < 50 || w > 700) return toast("Enter your weight in pounds, like 165.");
      state.weightOpen = false;
      await quick(d => { d.body = d.body.filter(b => b.date !== t).concat({ date: t, weight: w }).sort((a, b) => a.date.localeCompare(b.date)); }, () => S.addBody(t, w), "Weigh-in saved: " + w + " lb.");
    },
    async coach() { const v = val("cm"); document.getElementById("cm").value = ""; await sendCoach(v); },
    async name() { const n = val("pn").slice(0, 40); if (!n) return toast("Add your first name."); await quick(d => { d.profile.name = n; }, () => S.saveProfile({ name: n }), "Name saved."); }
  };
  const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
  const err = m => { const e = document.getElementById("err"); if (e) e.textContent = m; };

  root.addEventListener("click", e => {
    const el = e.target.closest("[data-a]");
    if (!el || el.disabled) return;
    e.preventDefault();
    const fn = A[el.dataset.a];
    if (fn) fn(el);
  });
  root.addEventListener("submit", e => {
    const f = e.target.closest("[data-f]"); if (!f) return;
    e.preventDefault();
    const fn = F[f.dataset.f]; if (fn) fn();
  });
  root.addEventListener("change", e => {
    const el = e.target;
    if (el.dataset.in === "lift") { state.lift = el.value; render(); }
    if (el.dataset.in === "weight" || el.dataset.in === "reps") {
      const x = state.session.plan.exercises[+el.dataset.i], v = parseFloat(el.value);
      if (v > 0) { if (el.dataset.in === "weight") x.weightUsed = v; else x.repsUsed = Math.round(v); }
      const y = window.scrollY; render(); window.scrollTo(0, y);
    }
  });
  window.addEventListener("hashchange", render);

  (async function boot() {
    try {
      state.user = await S.user();
      if (state.user && /upgraded/.test(location.hash)) {
        for (let i = 0; i < 6; i++) { await reload(); if (state.data.plan !== "none") break; await new Promise(r => setTimeout(r, 2000)); }
        history.replaceState(null, "", "#/today");
      }
    } catch (e) { toast(e.message); }
    S.onAuth(async evt => {
      if (evt === "PASSWORD_RECOVERY") { location.hash = "#/new-password"; return; }
      const u = await S.user();
      if (!!u !== !!state.user) { state.user = u; state.data = null; render(); }
    });
    if (!location.hash) location.hash = state.user ? "#/today" : "#/welcome";
    render();
  })();
})();
