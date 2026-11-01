/* AI Coach preview for the free trial. Runs entirely on the phone (no AI, no cost).
   It builds personal coaching from the member's own plan and log: today's exact workout,
   swaps for their injuries, a shorter version when they're busy, their real meals, their
   lifts going up and their week. It's always labeled a preview in the app. */
(function () {
  const C = window.BBF_CONTENT, E = window.BBF_ENGINE;
  const PROG = k => (C.PROGRAMS[k] || {}).name || "your plan";
  const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
  const seedOf = (s) => String(s).split("").reduce((n, c) => (n * 31 + c.charCodeAt(0)) | 0, 7);
  const dose = x => x.sets + " × " + (x.kind === "time" ? x.secs + " seconds" : x.reps + (x.weight ? " at " + x.weight + " lb" : ""));
  const list = arr => arr.length < 2 ? arr.join("") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
  const has = (t, words) => words.some(w => t.includes(w));

  // Everything the preview knows, gathered once per reply
  function facts(d) {
    const p = d.profile, s = p.setup || {};
    const plan = E.buildToday(p, d.workouts, {});
    const low = E.buildToday(p, d.workouts, { energy: "low" });
    const away = E.daysSinceLast(d.workouts);
    const last = d.workouts[d.workouts.length - 1] || null;
    const meals = E.mealsFor(s, d.daily[E.dateStr()] || {});
    const injuries = (s.injuries || []).filter(x => x !== "none");
    // lifts that went up: compare first and latest weight per exercise
    const lifts = {};
    d.workouts.forEach(w => (w.exercises || []).forEach(x => { if (x.kind === "load" && x.weight) { (lifts[x.name] = lifts[x.name] || []).push(x.weight); } }));
    const gains = Object.keys(lifts).map(n => ({ name: n, from: lifts[n][0], to: lifts[n][lifts[n].length - 1] })).filter(g => g.to > g.from).sort((a, b) => (b.to - b.from) - (a.to - a.from));
    const stepsY = (d.daily[E.dateStr(new Date(Date.now() - 86400000))] || {}).steps || 0;
    return { name: (p.name || "").split(" ")[0], s, plan, low, away, last, meals, injuries, gains, stepsY, prog: E.mainProgram(s), race: E.raceWeeks(s), total: d.workouts.length };
  }
  const nm = f => f.name ? ", " + f.name : "";
  const FASTH = { "12:12": 12, "14:10": 10, "16:8": 8, "18:6": 6 };
  function nutrition(d) {
    const t = E.dateStr(), day = d.daily[t] || {}, x = (day.meals && day.meals._x) || {}, st = d.profile.settings || {}, n = st.nutrition || {};
    const tot = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: x.water || 0 };
    E.mealsFor(d.profile.setup, day).filter(m => m.status === "ate").forEach(m => { tot.kcal += m.recipe.kcal || 0; tot.protein += m.recipe.protein; tot.carbs += m.recipe.carbs || 0; tot.fat += m.recipe.fat || 0; tot.fiber += m.recipe.fiber || 0; });
    (x.foods || []).forEach(f => { tot.kcal += +f.kcal || 0; tot.protein += +f.p || 0; tot.carbs += +f.c || 0; tot.fat += +f.f || 0; });
    return { tot, goalK: n.kcal || null, goalP: n.protein || 100, goalW: n.water || 8, fast: st.fasting || { plan: "none" } };
  }

  const RECOVERY = {
    glp1: "Have protein first at your next meal to protect the muscle you just worked.",
    meno: "Protein, water and a calm evening help your body rebuild, and sleep tends to improve as you keep lifting.",
    over40: "Give those muscles 48 hours before training them hard again, and get a good night's sleep.",
    senior: "A short walk later today keeps your legs loose and your balance sharp.",
    beginner: "A little soreness tomorrow is normal. A walk and plenty of water help it ease.",
    busy: "A glass of water and a protein snack now, and you're set for the day.",
    race: "An easy walk or light spin tomorrow helps your legs recover for the next run."
  };

  // Swap ideas for their injuries, using the same rules as their plan
  const SWAP = {
    knees: { avoid: ["lunge", "stepup", "squat"], tip: "keep squats shallow (sit to a chair) and swap lunges for glute bridges or hip hinges" },
    back: { avoid: ["hinge"], tip: "skip deadlifts for now and do glute bridges and dead bugs, keeping your back flat and supported" },
    wrists: { avoid: ["push", "push2"], tip: "do push-ups against a wall or on your forearms, or hold dumbbell handles to keep your wrists straight" },
    shoulders: { avoid: ["push2"], tip: "skip overhead pressing and do rows and band pull-aparts, keeping your elbows below shoulder height" }
  };
  const BODY = { knee: "knees", knees: "knees", back: "back", wrist: "wrists", wrists: "wrists", shoulder: "shoulders", shoulders: "shoulders" };

  const P = {
    daily(d) {
      const f = facts(d), x = f.plan.exercises[0], seed = seedOf(E.dateStr());
      const focus = f.plan.run ? "Today is " + f.plan.run.name.toLowerCase() + ": " + f.plan.run.cue : "Today's " + f.plan.name + " starts with " + (x ? x.name.toLowerCase() + ", " + dose(x) : "your warm-up") + ". " + (x ? x.cue : "");
      if (f.away !== null && f.away >= 3) return "It's been " + f.away + " days since your last workout" + nm(f) + ", and that's okay. Grace, not guilt. " + focus + " If that feels like a lot, tap Low energy and just do the first two exercises.";
      if (f.gains.length && seed % 2 === 0) return "Your " + f.gains[0].name.toLowerCase() + " has gone from " + f.gains[0].from + " to " + f.gains[0].to + " lb" + nm(f) + ". That's strength you built. " + focus;
      if (f.plan.goalMet) return "You've already done " + f.plan.doneWeek + " of " + f.plan.target + " workouts this week" + nm(f) + ". Anything today is a bonus, so a walk or a gentle session is perfect.";
      if (f.stepsY >= 5000 && seed % 3 === 0) return "You walked " + f.stepsY.toLocaleString() + " steps yesterday" + nm(f) + ". Your heart thanks you. " + focus;
      if (!f.total) return "Day one of " + PROG(f.prog) + nm(f) + ". " + focus + " Go slow, focus on form, and enjoy it.";
      return pick(["You've done " + f.plan.doneWeek + " of " + f.plan.target + " workouts this week" + nm(f) + ". " + focus,
        "One faithful step today" + nm(f) + ". " + focus,
        focus + " Steady reps beat fast ones" + nm(f) + "."], seed);
    },

    workout(d) {
      const f = facts(d), w = f.last; if (!w) return "";
      const ex = (w.exercises || []).filter(x => Array.isArray(x.done));
      const done = ex.reduce((n, x) => n + x.done.filter(Boolean).length, 0), all = ex.reduce((n, x) => n + x.done.length, 0);
      const heavy = ex.filter(x => x.weight).sort((a, b) => b.weight - a.weight)[0];
      const g = heavy && f.gains.find(x => x.name === heavy.name);
      let t = (w.exercises[0] && w.exercises[0].kind === "run") ? "You finished " + w.exercises[0].name.toLowerCase() + nm(f) + ". That counts for so much." :
        (all ? "You finished " + done + " of " + all + " sets in " + w.minutes + " minutes" + nm(f) + ". " : "Workout done" + nm(f) + ". ");
      if (g) t += "Your " + g.name.toLowerCase() + " is up to " + g.to + " lb, up from " + g.from + ". ";
      else if (heavy) t += heavy.name + " at " + heavy.weight + " lb is a solid base to build on. ";
      t += w.effort === "hard" ? "Since it felt tough, your next session stays the same so your body can catch up. " : w.effort === "easy" ? "Since it felt easy, your plan adds a little more next time. " : "It felt just right, which is exactly where progress happens. ";
      return t + (RECOVERY[f.prog] || RECOVERY.beginner);
    },

    weekly(d) {
      const f = facts(d), from = E.parseDate(E.dateStr()).getTime() - 7 * 86400000;
      const wk = d.workouts.filter(w => E.parseDate(w.date).getTime() >= from);
      const mins = wk.reduce((n, w) => n + (w.minutes || 0), 0);
      let t = wk.length ? "In the last 7 days you showed up " + wk.length + (wk.length === 1 ? " time" : " times") + " for " + mins + " minutes" + nm(f) + ". " : "This past week was quiet" + nm(f) + ", and a fresh one starts now. ";
      if (f.gains.length) t += "Your " + f.gains[0].name.toLowerCase() + " climbed to " + f.gains[0].to + " lb. ";
      t += wk.length >= f.plan.target ? "You hit your goal, so next week keep the same rhythm. " : "Next week, aim for " + f.plan.target + " sessions. Put them on your calendar like appointments. ";
      if (f.injuries.length) t += "Keep protecting your " + list(f.injuries) + " with the swaps in your plan. ";
      if (f.race !== null && f.race >= 0) t += f.race <= 2 ? "Race day is close, so your plan is tapering. Rest is training now. " : f.race + " weeks to race day. Keep most runs easy. ";
      return t + "Faithful in little, growing in much.";
    },

    // Chat: understands several needs in one message and answers each from their real plan
    reply(message, d) {
      const t = " " + String(message || "").toLowerCase() + " ", f = facts(d), parts = [];
      const plan = f.plan;
      const body = Object.keys(BODY).filter(k => new RegExp("\\b" + k + "\\b").test(t)).map(k => BODY[k]);
      const hurt = body.length && has(t, ["hurt", "pain", "sore", "ache", "bother", "injur", "bad", "weak", "can't", "cant", "okay for", "ok for", "safe"]);
      const short = (t.match(/(\d+)\s*(min|minute)/) || [])[1];
      const busy = short || has(t, ["busy", "no time", "short on time", "quick", "only have"]);
      const tired = has(t, ["tired", "exhausted", "no energy", "low energy", "drained", "sleep"]);
      const food = has(t, ["eat", "meal", "food", "protein", "hungry", "breakfast", "lunch", "dinner", "snack", "recipe"]);
      const workoutQ = has(t, ["today", "workout", "what should i do", "what do i do", "plan for"]);
      const progressQ = has(t, ["progress", "stronger", "how am i doing", "improv", "results", "lifted"]);
      const raceQ = has(t, ["race", "5k", "10k", "marathon", "run "]);
      const calQ = has(t, ["calorie", "calories", "macro", "carbs", " fat ", "how much have i eaten", "how much did i eat", "water", "hydrat", "intake", "track"]);
      const fastQ = has(t, ["fast", "intermittent", "eating window", "16:8", "14:10", "18:6", "12:12", "skip breakfast"]);
      // Feelings and life questions get the caring saved replies, not plan numbers
      if (has(t, ["frustrat", "angry", "anger", "annoyed", "overwhelm", "anxious", "anxiety", "panic", "lonely", "sad", "depressed", "worry", "overthink", "racing", "not good enough", "stress", "burn", "purpose", "career", "relationship", "boundar", "family", "grief", "cry"])) return null;
      if (/(kill myself|suicide|end my life|hurt myself|self[- ]harm|want to die)/.test(t) || has(t, ["chest pain", "can't breathe", "fainted"])) return null; // safety answers come from the saved library

      if (calQ) {
        const n = nutrition(d), T = n.tot;
        parts.push("So far today" + nm(f) + ": " + T.kcal + " calories" + (n.goalK ? " of your " + n.goalK + " goal" : "") + ", " + T.protein + " of " + n.goalP + " g protein, " + T.carbs + " g carbs, " + T.fat + " g fat and " + T.water + " of " + n.goalW + " cups of water. " +
          (T.protein < n.goalP * 0.5 ? "Your next meal is a great place for protein. " : "Nice work on protein. ") + (T.water < n.goalW / 2 ? "Grab a glass of water now, too." : "You're doing well on water.") + " Tap Ate it on the Eat tab, or add your own foods, and these numbers update.");
      }
      if (fastQ) {
        const fp = nutrition(d).fast;
        if (FASTH[fp.plan]) parts.push("You're on " + fp.plan + " fasting with your eating window starting at " + (fp.start || "12:00") + ". Drink water, black coffee or tea while you fast, and open your window with protein. If you feel shaky or dizzy, eat something and ease up. Flexibility is part of a healthy plan.");
        else parts.push("Want to try intermittent fasting" + nm(f) + "? A gentle start is 12:12 (for example eating 8 AM to 8 PM), then 14:10 if it feels good. Set it up on the Eat tab under Goals, and the app will show your fasting timer. It isn't right for everyone: check with your doctor first if you're pregnant, have diabetes, take blood sugar or GLP-1 medicine, or have a history of disordered eating.");
      }
      if (hurt) {
        const parts2 = body.map(b => SWAP[b]).filter(Boolean);
        const hit = plan.exercises.filter(x => body.some(b => SWAP[b] && SWAP[b].avoid.includes(x.slot)));
        parts.push("Let's protect your " + list([...new Set(body)]) + nm(f) + ". " + (hit.length ? "In today's workout, go easy on " + list(hit.map(x => x.name.toLowerCase())) + ". " : "") + parts2.map(x => x.tip.charAt(0).toUpperCase() + x.tip.slice(1)).join(". ") + ". Stop anything that's sharp or painful, and check with your doctor if it lasts. You can add this area in your profile so every workout swaps it out for you.");
      }
      if (tired) parts.push("On a tired day, here's your gentle version" + (hurt ? "" : nm(f)) + ": " + list(f.low.exercises.map(x => x.name.toLowerCase() + " " + dose(x))) + ". About " + f.low.minutes + " minutes. Tap Low energy on Today and it's set up for you. Rest is part of strength.");
      if (busy && !tired) {
        const n = short ? Math.max(1, Math.min(plan.exercises.length, Math.floor((+short - 3) / 5))) : 2;
        parts.push("Short on time? Do " + list(plan.exercises.slice(0, n).map(x => x.name.toLowerCase() + " " + dose(x))) + (short ? ", which fits in about " + short + " minutes" : "") + ". Move straight from one to the next. That still counts as a full win.");
      }
      if (food) {
        const m = f.meals.filter(x => x.recipe && x.status !== "ate").slice(0, 3);
        parts.push(m.length ? "From your meal plan today: " + list(m.map(x => x.recipe.name + " (" + x.recipe.protein + " g protein, " + x.recipe.kcal + " cal, " + x.recipe.minutes + " min)")) + ". They all fit how you eat. Tap Swap on the Eat tab if one doesn't sound good." : "You've eaten all your planned meals today. Well done! If you're hungry, choose a snack with protein like Greek yogurt, eggs or hummus.");
      }
      if (progressQ) parts.push(f.total ? "You've logged " + f.total + " workout" + (f.total === 1 ? "" : "s") + (f.gains.length ? ", and your " + list(f.gains.slice(0, 2).map(g => g.name.toLowerCase() + " went from " + g.from + " to " + g.to + " lb")) : "") + ". You've done " + plan.doneWeek + " of " + plan.target + " this week. Keep stacking faithful days." : "Your progress starts with your first workout. Today's " + plan.name + " is the perfect place to begin.");
      if (raceQ && f.race !== null) parts.push(f.race >= 0 ? f.race + " weeks to race day. Keep most runs at an easy, talking pace, and keep your strength days. " + (f.race <= 2 ? "You're in your taper now, so less is more." : "") : "Your race date has passed. Congratulations on showing up! Set a new race in your profile whenever you're ready.");
      if (workoutQ && !parts.length && !calQ) parts.push(plan.run ? "Today: " + plan.run.name + ". " + plan.run.detail + " " + plan.run.cue : "Today's " + plan.name + nm(f) + ", about " + plan.minutes + " minutes: " + list(plan.exercises.map(x => x.name.toLowerCase() + " " + dose(x))) + ". Warm up for 5 minutes first, and rate how it felt at the end so your next session fits even better.");
      return parts.length ? parts.join("\n\n") : null; // nothing personal to add: use the saved library
    }
  };
  window.BBF_PREVIEW = P;
})();
