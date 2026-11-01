/* Offline coach used in demo mode (no AI key yet). It follows the same personality as the
   real AI coach: warm, encouraging, faith-filled, practical and short. */
(function () {
  const has = (t, words) => words.some(w => t.includes(w));
  const first = n => (n ? ", " + n.split(" ")[0] : "");

  window.BBF_DEMO_COACH = function (message, ctx) {
    const t = (message || "").toLowerCase();
    const name = first(ctx && ctx.name);
    const w = ctx && ctx.today;

    if (has(t, ["kill myself", "suicide", "end my life", "self harm", "hurt myself"])) {
      return "I'm really glad you told me" + name + ". You matter, and you don't have to carry this alone. Please reach out right now: call or text 988 (Suicide & Crisis Lifeline, US) or talk to someone you trust. If you're in danger, call 911.";
    }
    if (has(t, ["pain", "hurt", "injur", "dizzy", "chest", "faint", "medication", "ozempic", "wegovy", "mounjaro", "zepbound", "pregnan", "doctor"])) {
      return "Thank you for telling me" + name + ". Anything about pain, medication or how your body is reacting is worth checking with your doctor first. For today, skip anything that hurts and choose the gentle version of your workout. Listening to your body is wisdom, not weakness.";
    }
    if (has(t, ["tired", "exhausted", "no energy", "low energy", "sleep", "drained"])) {
      return "Tired days are real" + name + ". Tap \"Low energy today?\" and I'll shorten your workout but keep the key lifts. Even 10 minutes keeps the promise you made to yourself. \"My grace is sufficient for thee.\" (2 Corinthians 12:9) Rest is part of strength.";
    }
    if (has(t, ["missed", "skipped", "fell off", "quit", "give up", "gave up", "failed", "behind", "lazy", "can't do this", "cant do this"])) {
      return "You haven't failed" + name + ", you paused. That's different. His mercies are new every morning, and so is your plan. Let's start small: one workout this week, the gentle version if you need it. Showing up imperfectly still counts. I'm proud of you for coming back.";
    }
    if (has(t, ["eat", "food", "meal", "protein", "hungry", "recipe", "snack", "diet"])) {
      return "Great question" + name + ". Aim for a protein-rich food at each meal; your Eat tab already lines that up for you. If a meal doesn't sound good, tap Swap for another that fits your diet. Nourish the body you were given, and give thanks for every bite.";
    }
    if (has(t, ["motivat", "don't feel like", "dont feel like", "not in the mood", "discourag", "sad", "down", "overwhelm"])) {
      return "I hear you" + name + ". Feelings follow action more often than the other way around. Put on your shoes and do just the first exercise. If you want to stop after that, you still won. \"Let us not be weary in well doing: for in due season we shall reap, if we faint not.\" (Galatians 6:9)";
    }
    if (has(t, ["pray", "faith", "god", "jesus", "bible", "verse"])) {
      return "I love that" + name + ". Try this: before your workout, take one slow breath and pray, \"Lord, thank You for this body. Help me steward it well today.\" Then move with gratitude. \"I can do all things through Christ who strengthens me.\" (Philippians 4:13)";
    }
    if (has(t, ["swap", "replace", "instead", "don't have", "dont have", "too hard", "too easy", "change"])) {
      return "We can adjust that" + name + ". If a move feels too hard, do fewer reps or lighter weight and finish with good form. Too easy? Rate the workout \"Easy\" at the end and your next session goes up a little. Your plan learns from you every time.";
    }
    if (w && has(t, ["today", "workout", "what should i", "plan"])) {
      return "Today is " + w + name + ". Start with a 5 minute warm-up, take your time on each set, and tap Done as you go. You've got this, and I'm cheering for you.";
    }
    return "I'm here for you" + name + ". Tell me how you're feeling, what's getting in the way, or what you'd like to change, and we'll figure out the next small step together. Every faithful step counts.";
  };
})();
