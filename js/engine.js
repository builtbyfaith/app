/* Training and meal engine: builds each day's plan from the member's setup and history. */
(function () {
  const C = window.BBF_CONTENT;
  const DAY = 86400000;

  const pad = n => String(n).padStart(2, "0");
  const dateStr = (d = new Date()) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parseDate = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const dayNumber = (d = new Date()) => Math.floor(parseDate(dateStr(d)).getTime() / DAY);
  const weekStart = (d = new Date()) => { const x = parseDate(dateStr(d)); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return dateStr(x); };
  const pick = (arr, n) => arr[((n % arr.length) + arr.length) % arr.length];

  function dailyWord(d = new Date()) { return pick(C.VERSES, dayNumber(d)); }
  function affirmation(kind, seed = dayNumber()) { return pick(C.AFFIRMATIONS[kind] || C.AFFIRMATIONS.start, seed); }

  function mainProgram(setup) { return (setup.programs && setup.programs[0]) || "beginner"; }

  function workoutsThisWeek(workouts, d = new Date()) {
    const ws = weekStart(d);
    return workouts.filter(w => w.date >= ws && w.date <= dateStr(d));
  }

  function daysSinceLast(workouts, d = new Date()) {
    if (!workouts.length) return null;
    const last = workouts.map(w => w.date).sort().pop();
    return dayNumber(d) - dayNumber(parseDate(last));
  }

  function placeFor(setup, sessionNumber) {
    const order = ["gym", "db", "out", "bare"];
    const places = (setup.place && setup.place.length ? setup.place : ["bare"]).slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return pick(places, sessionNumber);
  }

  function setsFor(minutes) { return minutes <= 20 ? 2 : 3; }

  function startLoad(setup, slot) {
    const base = { never: 10, some: 15, regular: 25 }[setup.experience] || 10;
    if (slot === "push2" || slot === "pull2") return Math.max(5, base - 5);
    if (slot === "hinge") return base + 5;
    return base;
  }

  function startTarget(ex, setup, slot) {
    const prog = mainProgram(setup);
    if (ex.kind === "time") return slot === "balance" ? 20 : 30;
    if (ex.kind === "body") return prog === "senior" ? 8 : 10;
    return prog === "meno" && setup.experience !== "never" ? 8 : 10;
  }

  // progression: { [exerciseName]: { weight, reps, secs } }
  function prescription(ex, slot, setup, progression) {
    const p = progression[ex.name] || {};
    if (ex.kind === "load") return { weight: p.weight || startLoad(setup, slot), reps: p.reps || startTarget(ex, setup, slot) };
    if (ex.kind === "time") return { secs: p.secs || startTarget(ex, setup, slot) };
    return { reps: p.reps || startTarget(ex, setup, slot) };
  }

  function raceWeeks(setup, d = new Date()) {
    if (!setup.raceDate) return null;
    return Math.ceil((dayNumber(parseDate(setup.raceDate)) - dayNumber(d)) / 7);
  }

  function runSession(kind, setup, d = new Date()) {
    const exp = setup.experience;
    const weeks = raceWeeks(setup, d);
    const taper = weeks !== null && weeks <= 2 && weeks >= 0;
    let minutes, detail;
    if (kind === "long") {
      minutes = { never: 25, some: 40, regular: 60 }[exp] || 35;
      if (weeks !== null && weeks > 2) minutes += Math.min(30, Math.max(0, 16 - weeks) * 3);
      if (taper) minutes = Math.round(minutes * 0.6);
      detail = "Easy, conversational pace the whole way.";
    } else {
      const reps = { never: 4, some: 6, regular: 8 }[exp] || 5;
      const r = taper ? Math.max(3, reps - 3) : reps;
      minutes = 10 + r * 4 + 5;
      detail = "10 min easy warm-up, then " + r + " × 2 min strong with 2 min easy jog between, then 5 min easy.";
    }
    return { type: "run", name: C.RUNS[kind].name, cue: C.RUNS[kind].cue, minutes, detail, taper };
  }

  function buildToday(profile, workouts, opts = {}) {
    const setup = profile.setup;
    const d = opts.date || new Date();
    const progKey = mainProgram(setup);
    const prog = C.PROGRAMS[progKey];
    const doneWeek = workoutsThisWeek(workouts, d);
    const target = setup.days || 3;
    const sessionNumber = workouts.length;
    const tmpl = pick(prog.sessions, doneWeek.length);
    const minutes = setup.minutes || 30;
    const lowEnergy = opts.energy === "low";

    if (tmpl.run) {
      const r = runSession(tmpl.run, setup, d);
      if (lowEnergy) { r.minutes = Math.max(15, Math.round(r.minutes * 0.6)); r.detail = "Keep it all easy today. " + r.detail.split(". ").slice(-1)[0]; }
      return { program: prog.name, name: r.name, place: "out", minutes: r.minutes, run: r, exercises: [], goalMet: doneWeek.length >= target, doneWeek: doneWeek.length, target };
    }

    const place = placeFor(setup, sessionNumber);
    let slots = tmpl.slots.slice();
    const extras = setup.programs.slice(1);
    if (extras.includes("senior") && !slots.includes("balance")) slots.push("balance");
    if (minutes >= 45 && !slots.includes("carry")) slots.push("carry");
    if (lowEnergy && slots.length > 2) slots = slots.slice(0, slots.length - 1);
    const sets = Math.max(1, setsFor(minutes) - (lowEnergy ? 1 : 0));
    const avoid = (setup.injuries || []).map(s => s.toLowerCase());

    const used = new Set();
    const exercises = slots.map(slot => {
      let s = slot;
      if (avoid.includes("knees") && (slot === "lunge" || slot === "stepup")) s = "hinge";
      if (avoid.includes("wrists") && (slot === "push" || slot === "push2")) s = "wallpush";
      if (avoid.includes("back") && slot === "hinge") s = "core";
      if (avoid.includes("shoulders") && slot === "push2") s = "pull2";
      let ex = C.EXERCISES[s][place] || C.EXERCISES[s].bare;
      // never repeat the same exercise in one session
      for (const alt of [s, "core", "pull2", "carry", "balance", "push", "pull"]) {
        const cand = C.EXERCISES[alt][place] || C.EXERCISES[alt].bare;
        if (!used.has(cand.name)) { ex = cand; s = alt; break; }
      }
      used.add(ex.name);
      return Object.assign({ slot: s, sets }, ex, prescription(ex, s, setup, profile.progression || {}));
    });
    const est = Math.round(exercises.length * sets * 2.2 + 6);
    return { program: prog.name, name: tmpl.name + (lowEnergy ? " (gentle)" : ""), place, minutes: Math.min(minutes, est), exercises, goalMet: doneWeek.length >= target, doneWeek: doneWeek.length, target };
  }

  // After a workout: update progression from sets completed and how it felt
  function progress(progression, exercises, effort) {
    const next = Object.assign({}, progression);
    exercises.forEach(ex => {
      const all = ex.done && ex.done.length && ex.done.every(Boolean);
      const cur = Object.assign({}, next[ex.name] || {});
      if (ex.kind === "load") {
        const w = ex.weightUsed || ex.weight;
        cur.weight = w; cur.reps = ex.reps;
        if (all && effort !== "hard") cur.weight = w + (w < 15 ? 2.5 : 5);
        if (effort === "hard" && !all) cur.weight = Math.max(5, w - 5);
      } else if (ex.kind === "time") {
        cur.secs = ex.secs;
        if (all && effort !== "hard") cur.secs = Math.min(90, ex.secs + 5);
      } else {
        cur.reps = ex.repsUsed || ex.reps;
        if (all && effort !== "hard") cur.reps = Math.min(20, cur.reps + 1);
      }
      next[ex.name] = cur;
    });
    return next;
  }

  // ---------- Meals ----------
  function recipesFor(setup, slot) {
    const diet = setup.diet || "balanced";
    const allergies = setup.allergies || [];
    const dislikes = (setup.dislikes || "").toLowerCase().split(/[,;]/).map(s => s.trim()).filter(Boolean);
    let list = C.RECIPES.filter(r => r.slot === slot && r.tags.includes(diet) && !r.allergens.some(a => allergies.includes(a)));
    list = list.filter(r => !dislikes.some(w => (r.name + " " + r.ingredients.join(" ")).toLowerCase().includes(w)));
    // never break diet or allergy rules; only relax dislikes if nothing is left
    if (!list.length) list = C.RECIPES.filter(r => r.slot === slot && r.tags.includes(diet) && !r.allergens.some(a => allergies.includes(a)));
    return list;
  }

  function mealsFor(setup, daily, d = new Date()) {
    const n = dayNumber(d);
    const meals = (daily && daily.meals) || {};
    return ["breakfast", "lunch", "dinner", "snack"].map(slot => {
      const list = recipesFor(setup, slot);
      const m = meals[slot] || {};
      const chosen = m.pick && list.find(r => r.id === m.pick);
      const recipe = chosen || (list.length ? pick(list, n + (m.swap || 0)) : null);
      return { slot, recipe, status: m.status || null, swap: m.swap || 0, options: list.length };
    }).filter(m => m.recipe);
  }

  function groceryList(setup) {
    const items = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      mealsFor(setup, null, d).forEach(m => m.recipe.ingredients.forEach(ing => {
        const key = ing.toLowerCase();
        items.set(key, { name: ing, count: ((items.get(key) || {}).count || 0) + 1 });
      }));
    }
    return [...items.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function proteinToday(setup, daily) {
    return mealsFor(setup, daily).filter(m => m.status === "ate").reduce((s, m) => s + m.recipe.protein, 0);
  }

  function weeksOnTrack(workouts, target, d = new Date()) {
    let count = 0;
    const cur = parseDate(weekStart(d));
    // this week counts once the goal is met; otherwise start from last week
    const thisWeek = workoutsThisWeek(workouts, d).length;
    if (thisWeek >= target) count++;
    for (let i = 1; i < 104; i++) {
      const s = new Date(cur); s.setDate(s.getDate() - 7 * i);
      const e = new Date(s); e.setDate(e.getDate() + 6);
      const n = workouts.filter(w => w.date >= dateStr(s) && w.date <= dateStr(e)).length;
      if (n >= target) count++; else break;
    }
    return count;
  }

  window.BBF_ENGINE = { recipesFor, dateStr, parseDate, dayNumber, weekStart, dailyWord, affirmation, buildToday, progress, mealsFor, groceryList, proteinToday, workoutsThisWeek, daysSinceLast, weeksOnTrack, raceWeeks, mainProgram };
})();
