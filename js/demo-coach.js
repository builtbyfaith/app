/* Backup coach. Answers instantly when there's no connection, when the AI service is down,
   and in demo mode. Same personality as the AI coach: warm, encouraging, faith-filled,
   practical and short. Safety topics are always checked first.
   To add answers: add a line to "replies" in any topic, or add a new topic with its own words.
   Placeholders: {name} = ", Grace" (or nothing), {Name} = "Grace" (or "friend"),
   {today} = today's workout, {week} = "2 of 3", {left} = workouts left this week. */
(function () {
  const VERSES = [
    "\"I can do all things through Christ who strengthens me.\" (Philippians 4:13)",
    "\"They shall run, and not be weary; and they shall walk, and not faint.\" (Isaiah 40:31)",
    "\"My grace is sufficient for thee: for my strength is made perfect in weakness.\" (2 Corinthians 12:9)",
    "\"Let us not be weary in well doing: for in due season we shall reap, if we faint not.\" (Galatians 6:9)",
    "\"I will praise thee; for I am fearfully and wonderfully made.\" (Psalm 139:14)",
    "\"The joy of the LORD is your strength.\" (Nehemiah 8:10)",
    "\"Be strong and of a good courage; be not afraid.\" (Joshua 1:9)",
    "\"His compassions fail not. They are new every morning.\" (Lamentations 3:22-23)",
    "\"Come unto me, all ye that labour and are heavy laden, and I will give you rest.\" (Matthew 11:28)",
    "\"She girdeth her loins with strength, and strengtheneth her arms.\" (Proverbs 31:17)",
    "\"Commit thy works unto the LORD, and thy thoughts shall be established.\" (Proverbs 16:3)",
    "\"Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.\" (Philippians 4:6)"
  ];

  // Topics are checked in this order. The first group are safety topics and always win.
  const TOPICS = [
    { id: "crisis", safety: true, words: ["kill myself", "suicide", "suicidal", "end my life", "end it all", "self harm", "self-harm", "hurt myself", "don't want to live", "dont want to live", "want to die", "no reason to live"], replies: [
      "I'm really glad you told me{name}. You matter so much, and you don't have to carry this alone. Please reach out right now: call or text 988 (Suicide & Crisis Lifeline, US) or talk to someone you trust. If you're in danger, call 911.",
      "Thank you for trusting me with this{name}. What you're feeling is real, and help is real too. Please call or text 988 right now to talk with someone who cares, or call 911 if you're in danger. Is there someone you can be with today?"
    ] },
    { id: "emergency", safety: true, words: ["chest pain", "chest hurts", "can't breathe", "cant breathe", "trouble breathing", "fainted", "passed out", "heart racing", "heart is racing"], replies: [
      "Please stop exercising right now{name}. Chest pain, fainting or trouble breathing need medical care right away, so call 911 or have someone take you to urgent care. Your workout can wait; you can't.",
      "That needs a doctor today{name}. Stop the workout, sit down, and call 911 if it's severe or not easing. Please check in with your doctor before training again."
    ] },
    { id: "eating", safety: true, words: ["purge", "throw up after", "made myself sick", "starving myself", "not eating", "skip meals to", "binge", "hate my body", "disgusting", "too fat to"], replies: [
      "Thank you for being honest with me{name}. You deserve to be fed and cared for, every single day. Please talk with your doctor or a counselor about this; you don't have to figure it out alone. For today, let's focus on one gentle, nourishing meal.",
      "I hear how hard this is{name}, and I'm so glad you said it out loud. Your worth was never measured by your body. A doctor or counselor can really help with this, and the National Alliance for Eating Disorders helpline (1-866-662-1235) is there too. You are fearfully and wonderfully made."
    ] },
    { id: "medical", safety: true, words: ["pain", "hurts", "hurt", "hurting", "injur", "dizzy", "lightheaded", "medication", "medicine", "ozempic", "wegovy", "mounjaro", "zepbound", "semaglutide", "tirzepatide", "dose", "pregnan", "doctor", "surgery", "blood pressure", "diabet"], replies: [
      "Thank you for telling me{name}. Anything about pain, medication or how your body is reacting is worth checking with your doctor first. For today, skip anything that hurts and choose the gentle version of your workout. Listening to your body is wisdom, not weakness.",
      "Your body is talking, and it's smart to listen{name}. Please run this by your doctor before pushing through. In the meantime, swap anything that hurts for a gentler move, or take a walk instead. Strength built carefully lasts longest.",
      "I'm not able to give medical or medication advice{name}, but your doctor can, and it's worth asking. Until then, keep moving only in ways that feel good. You're taking care of yourself, and that's exactly right."
    ] },

    { id: "frustrated", weight: 2, words: ["frustrat", "annoyed", "irritated", "fed up", "so mad", "angry", "anger", "furious", "pissed", "rage", "had it", "sick of"], replies: [
      "That sounds really frustrating{name}, and it makes sense you feel that way. Try a physiological sigh: breathe in through your nose, take a second short sip of air on top, then let it out slowly through your mouth. Do it two or three times. It's one of the fastest ways to calm your body.",
      "Frustration is energy looking for somewhere to go{name}. Put it to work: a brisk 10-minute walk, or shake out your arms and legs hard for 30 seconds. Moving it through your body often takes the edge off faster than thinking it through.",
      "I hear you{name}. Try naming it in one word: \"frustrated,\" \"disappointed,\" \"overlooked.\" Simply naming a feeling helps your brain settle it. Then ask: what's one small thing I can control right now?",
      "Before you respond to whatever set you off{name}, give it 90 seconds. A strong emotion's first wave usually passes in about that long if you breathe and don't feed it. Then decide what you want to do with a calmer mind.",
      "It's okay to be upset{name}. Anger often points to something that matters to you. Write it all down for 5 minutes without editing, then tear it up or close the notebook. Be ye angry, and sin not (Ephesians 4:26). Feeling it is human; you get to choose what comes next.",
      "Let's widen the lens{name}. Look out a window or across the room and soften your eyes to take in the whole view for 30 seconds. A wider gaze tells your nervous system you're safe. Then take one slow breath and tell me what happened, if you'd like."
    ] },
    { id: "overthinking", weight: 2, words: ["overthink", "racing thoughts", "can't stop thinking", "cant stop thinking", "ruminat", "spiral", "racing", "mind keeps", "my mind", "my mind won't", "my mind wont", "what if", "worrying", "worry"], replies: [
      "A busy mind is exhausting{name}. Try a brain dump: write every thought down for 5 minutes, no order needed. Getting them on paper tells your brain it doesn't have to hold them all at once.",
      "Try scheduled worry time{name}. When a worry pops up, jot it down and save it for a set 15 minutes later today. Most worries feel smaller by then, and you've given yourself permission to rest in between.",
      "Let's check that thought{name}. Ask: is this 100% true? What would I tell a friend who thought this? What's another way to see it? Thoughts are not always facts, especially when we're tired.",
      "Ground yourself with 5-4-3-2-1{name}: name 5 things you see, 4 you can feel, 3 you hear, 2 you smell and 1 you taste. It pulls your attention out of the spin and back into this moment.",
      "Cast all your care upon Him, for He careth for you (1 Peter 5:7){name}. Try a breath prayer: breathe in \"Be still,\" breathe out \"and know that I am God.\" Repeat slowly for one minute."
    ] },
    { id: "panic", weight: 2, words: ["panic", "panic attack", "freaking out", "can't calm down", "cant calm down", "heart is pounding", "heart pounding", "shaking", "hyperventilat"], replies: [
      "You're safe right now{name}, and this feeling will pass. Breathe out slowly, longer than you breathe in: in for 4, out for 6 or 8. Long exhales slow your heart. Keep going for a minute.",
      "Let's ground together{name}. Press your feet into the floor and notice the weight of your body. Name 5 things you can see out loud. Waves of panic peak and fall, usually within minutes.",
      "Try box breathing{name}: in for 4, hold for 4, out for 4, hold for 4. Trace a square with your finger as you go. If panic happens often, a doctor or counselor can help a lot, and that's a strong step.",
      "Hum a song you love, slowly{name}, or say a verse quietly: \"What time I am afraid, I will trust in thee\" (Psalm 56:3). Humming and slow speaking both help settle your body. If you have chest pain or trouble breathing that doesn't pass, call 911."
    ] },
    { id: "lonely", weight: 2, words: ["lonely", "alone", "no friends", "isolated", "no one cares", "nobody cares", "left out"], replies: [
      "Feeling lonely is so hard{name}, and it doesn't mean something is wrong with you. One small step: text one person today, even just \"thinking of you.\" Connection often starts with a tiny message.",
      "You matter, and you're not alone{name}. A walk somewhere with people around, a class, a church small group or a volunteer shift are gentle ways to feel connected without pressure. Which one feels most doable?",
      "I will never leave thee, nor forsake thee (Hebrews 13:5){name}. While you reach out to others, be a kind friend to yourself too: a good meal, a walk outside, your favorite music.",
      "Group workouts and walking buddies are great for both body and heart{name}. Would you be open to inviting one person to walk with you this week?"
    ] },
    { id: "worth", weight: 2, words: ["not good enough", "worthless", "imposter", "insecure", "self esteem", "self-esteem", "confidence", "i'm a failure", "im a failure", "useless", "i suck"], replies: [
      "Those words are heavy{name}, and they're not the whole truth about you. Try this: what would you say to a friend who felt this way? Now say it to yourself. You deserve that same kindness.",
      "Try a self-compassion break{name}: put a hand on your heart and say, \"This is hard. I'm not the only one who feels this. May I be kind to myself right now.\" It sounds simple, and research shows it really helps.",
      "Confidence grows from keeping small promises to yourself{name}. Pick one tiny thing today and do it: a 10-minute walk, a glass of water, one set. Then notice that you did it.",
      "You are fearfully and wonderfully made (Psalm 139:14){name}. Your worth was settled before you ever lifted a weight or reached a goal. Write down three things you did well this week, however small."
    ] },
    { id: "purpose", words: ["purpose", "direction", "my life", "career", "job", "calling", "stuck in life", "what should i do with", "big decision", "decide", "decision", "goal", "goals", "dream"], replies: [
      "Let's think it through together{name}. Picture yourself a year from now feeling proud. What's different? Pick one small step this week that moves toward that picture.",
      "When a decision feels big{name}, write each option with three columns: what it gives you, what it costs you, and how it fits what matters most to you. Then pray on it and talk with someone wise you trust.",
      "Big goals get done in small steps{name}. Break yours into one action you can do in 20 minutes or less, and put it on your calendar. Commit thy works unto the LORD, and thy thoughts shall be established (Proverbs 16:3).",
      "Purpose often shows up where your gifts meet what you care about{name}. What do people thank you for? What lights you up? Those are good clues for your next step.",
      "Feeling stuck is a normal part of growing{name}. Try a tiny experiment instead of a giant leap: a conversation, a class, a volunteer day. Experiments teach you what fits."
    ] },
    { id: "habits", words: ["habit", "routine", "consistent", "consistency", "discipline", "morning routine", "stick to", "keep forgetting", "schedule"], replies: [
      "Make it tiny and attach it to something you already do{name}: \"After I pour my coffee, I'll do 10 squats.\" Habits stick when they're easy and have a clear cue.",
      "Try the 2-minute rule{name}: start any habit with a version that takes 2 minutes. Put on your shoes, open your workout, fill your water bottle. Starting is the hardest part.",
      "Never miss twice{name}. One missed day is life; just make the next day happen, even in a small way. That one rule protects your streak better than perfection.",
      "Set your space up for success{name}: workout clothes laid out, water on your desk, fruit on the counter. Your environment does half the work for you.",
      "Track it where you can see it{name}. Checking off a habit gives your brain a small reward that makes you want to do it again. Your Today screen is a great place to start."
    ] },
    { id: "boundaries", words: ["boundar", "say no", "people pleas", "relationship", "husband", "wife", "boyfriend", "girlfriend", "my kids", "family", "coworker", "my boss", "conflict", "argument", "argue"], replies: [
      "Relationships can be the hardest part of life{name}. Before a hard conversation, take a slow breath and lead with how you feel, not what they did wrong: \"I feel overwhelmed when…\" It keeps the door open.",
      "Saying no can be loving{name}. Try: \"I can't this week, but I can on Saturday.\" A kind, clear no protects your yes for what matters most.",
      "You can't pour from an empty cup{name}. Taking time for your health isn't selfish; it helps you show up better for the people you love.",
      "If a conversation gets heated{name}, it's okay to pause: \"I want to talk about this, and I need 20 minutes to calm down first.\" Then take a walk and come back. Be swift to hear, slow to speak, slow to wrath (James 1:19).",
      "Try to listen until the other person feels heard{name}, then share your side. And if something keeps hurting you, a counselor or pastor can be a great help."
    ] },
    { id: "gratitude", words: ["grateful", "gratitude", "thankful", "blessed", "peace", "joy", "happy today", "feeling good", "great day"], replies: [
      "I love this{name}! Hold onto it: write down three good things from today and why they happened. Doing this before bed is linked with better mood and sleep.",
      "Joy looks good on you{name}. Share it: send a quick thank-you text to someone who helped you this week. Gratitude grows when it's spoken.",
      "This is the day which the LORD hath made; we will rejoice and be glad in it (Psalm 118:24){name}. Let today's good energy carry into a walk or your workout.",
      "Celebrate this moment{name}. Good days are fuel for harder ones, so notice what made today great and do more of it."
    ] },
    { id: "win", words: ["did it", "finished", "completed", "pr", "personal record", "new record", "heavier", "lifted more", "first time", "proud", "i went", "i ran", "i walked", "hit my", "made it", "streak", "lost", "down a size", "clothes fit"], replies: [
      "Yes{name}! That's real strength you built with your own effort. Take a moment to enjoy it, because you earned it. Keep the same weight next time and make every rep smooth.",
      "I'm cheering out loud for you{name}! This is what consistency looks like. Write down how it felt, so on a hard day you can remember this one. The joy of the LORD is your strength.",
      "Look at you{name}! Small wins stacked up become big change. Rest well tonight and let your body grow from what you did today.",
      "That is something to celebrate{name}. You kept the promise you made to yourself. Thank God for a body that can do this, and let's keep the momentum going.",
      "So proud of you{name}! Wins like this are why we show up on the ordinary days. What would you like to aim for next?"
    ] },
    { id: "tired", words: ["tired", "exhausted", "no energy", "low energy", "drained", "worn out", "fatigue", "sluggish", "wiped"], replies: [
      "Tired days are real{name}. Tap \"Low energy today?\" and your workout gets shorter but keeps the key lifts. Even 10 minutes keeps the promise you made to yourself. Rest is part of strength.",
      "Let's be kind to your body today{name}. Try the low-energy version of {today}, or take a gentle 15-minute walk. Moving a little often helps energy more than you'd expect.",
      "I hear you{name}. Drink a big glass of water, have a snack with protein, and then decide. If you're still running on empty, a rest day is a wise choice, not a failure. Come unto me, all ye that labour, and I will give you rest.",
      "Low energy doesn't mean low effort{name}. Do your first exercise only, and stop there if you need to. You still showed up, and that matters."
    ] },
    { id: "sleep", words: ["sleep", "insomnia", "can't sleep", "cant sleep", "up all night", "woke up", "night sweats"], replies: [
      "Poor sleep makes everything harder{name}. Go gentle today with the low-energy workout, and try to train earlier in the day. A short evening walk and a screen-free last half hour can really help.",
      "Rest matters as much as reps{name}. Strength training helps sleep over time, so you're on the right road. Tonight, try a cool dark room and a few slow breaths with a short prayer of thanks.",
      "Rough night? Let's not ask too much of you today{name}. A shorter session or a walk is plenty. Your body does its rebuilding while you rest."
    ] },
    { id: "stress", words: ["stress", "anxious", "anxiety", "worried", "overwhelm", "busy week", "chaos", "too much going on", "burnout", "burned out", "burnt out", "too much on my plate"], replies: [
      "That's a lot to carry{name}. Movement is one of the best stress relievers we have, even 10 minutes. Breathe slowly between sets and let this be time just for you. Be careful for nothing; but in every thing by prayer, let your requests be made known unto God.",
      "When life feels full, keep the plan small{name}. Do the 20-minute version today and call it a full win. You don't have to do everything to do something good.",
      "I'm sorry it's such a heavy season{name}. Try this: three slow breaths, a quick prayer, then just your warm-up. Often that's enough to shift the whole day."
    ] },
    { id: "missed", words: ["missed", "skipped", "fell off", "behind", "haven't worked out", "havent worked out", "been a while", "slacked", "lazy", "messed up", "ruined"], replies: [
      "You haven't failed{name}, you paused. That's different. His mercies are new every morning, and so is your plan. Let's start small: one workout this week, the gentle version if you need it.",
      "Welcome back{name}! Missed days don't erase the work you've done. Today, just do {today}, or even half of it. Showing up imperfectly still counts.",
      "Everybody falls off sometimes{name}; the strong ones get back on. You're getting back on right now, and I'm proud of you. One workout, then we'll build from there.",
      "No guilt here{name}. Your plan adjusts to you, not the other way around. Let's pick one day this week and protect it like an appointment."
    ] },
    { id: "quit", words: ["quit", "give up", "gave up", "can't do this", "cant do this", "not working", "what's the point", "whats the point", "never going to", "hopeless", "pointless"], replies: [
      "Please don't give up on yourself{name}. Progress is often quiet before it's visible. Let's make this week so small you can't fail: two short workouts. Let us not be weary in well doing, for in due season we shall reap.",
      "I believe in you, even on days you don't{name}. You're stronger than you were when you started, whether the scale shows it or not. Let's do one tiny thing today and let that be enough.",
      "Hard seasons don't last forever{name}. You don't need to feel motivated, just willing. Lace up, do your first exercise, and let me know how it went.",
      "It makes sense to feel discouraged{name}. But look at what you've already done; that took courage. Let's adjust the plan instead of quitting it. What feels hardest right now?"
    ] },
    { id: "motivation", words: ["motivat", "don't feel like", "dont feel like", "not in the mood", "can't get started", "cant get started", "procrastinat", "unmotivated", "excuse"], replies: [
      "Feelings usually follow action{name}. Put on your shoes and do just the first exercise. If you want to stop after that, you still won.",
      "Motivation comes and goes, but you can lean on habit{name}. Set a 10-minute timer and start {today}. Most days, you'll want to keep going once you begin.",
      "Think about how you'll feel an hour from now if you move today{name}. That version of you will be so glad. Commit thy works unto the LORD, and thy thoughts shall be established.",
      "Let's make it easy{name}: favorite song on, water bottle filled, first set started. That's all I'm asking for right now."
    ] },
    { id: "sad", words: ["sad", "down", "depressed", "cry", "crying", "bad day", "rough day", "hard day", "grief", "lost my"], replies: [
      "I'm so sorry you're having a hard day{name}. Be gentle with yourself; a slow walk outside or some light stretching can lift the heart a little. If this heaviness sticks around, please talk with someone you trust or your doctor.",
      "That sounds really hard{name}. You don't have to perform today. A short walk and some deep breaths count, and so does rest. Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
      "Thank you for telling me{name}. Hard days are part of every journey, and they don't define you. Take care of the basics today: water, a good meal, a little movement, and some kindness toward yourself."
    ] },
    { id: "body", words: ["fat", "ugly", "body image", "hate how i look", "look bad", "embarrass", "self conscious", "self-conscious", "compare", "everyone else"], replies: [
      "You are fearfully and wonderfully made{name}, today, not just someday. Let's focus on what your body can do: every lift, step and stretch is something to be thankful for. Comparison steals joy; your only race is with yesterday's you.",
      "I wish you could see yourself the way God sees you{name}. Strength is built from the inside out. Let's celebrate one thing your body did for you this week.",
      "Those thoughts are heavy{name}, and they're not the whole truth. Try writing down three things your body did well this week. If these feelings are with you a lot, a counselor can really help."
    ] },
    { id: "plateau", words: ["plateau", "not losing", "scale", "weight won't", "weight wont", "gained", "no progress", "not seeing", "stuck"], replies: [
      "The scale is only one small part of the story{name}. Strength, energy, sleep and how your clothes fit all count. Check your Progress tab; your lifts are telling you you're getting stronger.",
      "Plateaus are normal, especially while building muscle{name}. Keep protein at every meal, keep lifting, and give it a few more weeks. In due season we shall reap, if we faint not.",
      "Bodies don't change in straight lines{name}. Water, hormones and muscle all move the scale around. Try weighing in just once a week, or hide body weight in your profile and focus on strength for a while."
    ] },
    { id: "sore", words: ["sore", "soreness", "stiff", "doms", "achy", "aching"], replies: [
      "A little soreness a day or two after training is normal{name}, especially when you're starting out. Gentle movement, water and a short walk help it ease. Sharp or lasting pain is different; check with your doctor about that.",
      "Sore muscles are rebuilding stronger{name}. Warm up a little longer today, go a bit lighter, and it will loosen up as you move.",
      "That means you worked{name}! Stretch gently, get good sleep and protein, and your body will thank you. If it's still very sore, do a light day or a walk instead."
    ] },
    { id: "busy", words: ["no time", "busy", "short on time", "only have", "quick workout", "10 minutes", "15 minutes", "schedule"], replies: [
      "Short workouts still count{name}. Do the first two exercises of {today} with good form, and you're done. Consistency beats long sessions every time.",
      "Let's fit it in{name}. Ten minutes of squats, push-ups and a plank is a real workout. Change your session length in your profile anytime to match your season.",
      "Busy seasons need flexible plans{name}. Try splitting it up: one exercise in the morning, one at lunch, one after dinner. It all adds up."
    ] },
    { id: "travel", words: ["travel", "trip", "vacation", "hotel", "away from home", "on the road", "holiday"], replies: [
      "Travel workouts can be simple{name}. Squats, push-ups against the bed, lunges and a plank in your hotel room are plenty. Walk everywhere you can and enjoy the trip.",
      "Enjoy your time away{name}! Aim for two short bodyweight sessions and lots of walking. Your plan will be waiting when you get home.",
      "No gym? No problem{name}. Switch your training place to \"At home, no equipment\" in your profile and your workouts will fit your room."
    ] },
    { id: "swap", words: ["bench", "no gym", "what do i use", "wrist", "knee", "shoulder", "lower back", "swap", "replace", "instead of", "alternative", "don't have", "dont have", "no equipment", "no weights", "no dumbbells", "can't do", "cant do"], replies: [
      "We can adjust that{name}. Swap it for an easier version: fewer reps, lighter weight, or a supported version holding a chair or wall. Good form matters more than the exact move.",
      "Your plan only uses the equipment you choose{name}. Update \"Where will you train?\" in your profile and your workouts will rebuild around what you have.",
      "Easy fix{name}: for squats try sit-to-stands, for push-ups try wall push-ups, for lunges try step-ups or split squats holding a chair. Keep moving and keep it safe."
    ] },
    { id: "hard", words: ["too hard", "too heavy", "struggl", "couldn't finish", "couldnt finish", "difficult", "can't lift", "cant lift"], replies: [
      "That's okay{name}. Go lighter or do fewer reps, and finish with good form. Rate the workout \"Tough\" at the end and your next session will ease up.",
      "Strength is built gradually{name}. It's smart to drop the weight and own every rep. Next time will feel better, I promise.",
      "Hard means you're growing{name}, but it should never feel unsafe. Take longer rests between sets and use the gentle version until it feels steady."
    ] },
    { id: "easy", words: ["too easy", "easy", "bored", "not challenging", "want more", "harder", "push me"], replies: [
      "Love that{name}! Rate your workout \"Easy\" when you finish and your next session goes up a little in weight or reps. Your plan learns from you.",
      "You're getting stronger{name}! Slow each rep down for three seconds on the way down; it makes any exercise more challenging without adding weight.",
      "Time to level up{name}. Add a rep to every set, or try the next heavier dumbbells. Keep your form crisp."
    ] },
    { id: "fasting", words: ["fast", "fasting", "intermittent", "eating window", "16:8", "14:10", "18:6", "12:12", "skip breakfast"], replies: [
      "Intermittent fasting can help some people with structure{name}. A gentle start is 12:12, then 14:10 if it feels good. Drink water while fasting and open your eating window with protein. Check with your doctor first if you're pregnant, have diabetes, take blood sugar or GLP-1 medicine, or have a history of disordered eating.",
      "Fasting works best when it feels flexible, not punishing{name}. If you train in the morning, try placing your eating window so you can eat soon after your workout. If you feel shaky or dizzy, eat something and ease up. If you have a health condition or take medication, check with your doctor first.",
      "During a fast, water, black coffee and plain tea are fine{name}. When your window opens, start with protein and vegetables, and don't try to make up for the hours you fasted. Steady and kind beats extreme. If you have a health condition or take medication, check with your doctor first.",
      "There's no prize for the longest fast{name}. Most people do well with 12 to 16 hours. Your strength, sleep and mood are the best signs of whether it's working for you. If you have a health condition or take medication, check with your doctor first."
    ] },
    { id: "calories", words: ["calorie", "calories", "macro", "macros", "carbs", "how much should i eat", "intake", "track food", "tracking food"], replies: [
      "Calories can be a helpful guide, not a judge{name}. Focus first on protein at every meal, plenty of vegetables and fiber, and enough water. Those habits do a lot of the work for you.",
      "Eating too little can backfire{name}: low energy, poor workouts and muscle loss. If you track calories, never go below about 1,200 a day, and let your strength and energy tell you if it's enough.",
      "Carbs fuel your workouts{name}. Oats, fruit, potatoes, rice and whole grains are great choices, especially before training. Balance them with protein and healthy fats.",
      "A simple plate guide{name}: half vegetables, a palm or two of protein, a fist of carbs and a thumb of healthy fat. It works without counting anything."
    ] },
    { id: "protein", words: ["calcium", "bone", "vitamin", "supplement", "creatine", "fiber", "carb", "protein", "eat", "food", "meal", "recipe", "breakfast", "lunch", "dinner", "diet", "nutrition", "grocery"], replies: [
      "Aim for a protein-rich food at every meal{name}: eggs, Greek yogurt, chicken, fish, beans or tofu. Your Eat tab already lines that up for you, and Swap gives you another option that fits.",
      "Simple wins best{name}: protein, a vegetable or fruit, and something filling at each meal. Use the grocery list in the Eat tab so the week is easier.",
      "Nourish the body you were given{name}. If a meal doesn't sound good, tap Swap for one that fits your way of eating. And give thanks for every bite."
    ] },
    { id: "hungry", words: ["ate too much", "overate", "pizza", "fast food", "cheat", "fell off my diet", "hungry", "craving", "sweets", "sugar", "snack", "junk", "chocolate", "late night"], replies: [
      "Cravings are normal{name}, not a character flaw. Try a protein snack first, like Greek yogurt or cheese and fruit, and then enjoy a little treat if you still want it. No guilt.",
      "Hunger is your body asking for fuel{name}. Make sure your meals have enough protein; it keeps you full longer. Then enjoy your food without shame.",
      "A balanced snack can help{name}: apple with peanut butter, hummus and veggies, or a boiled egg. Treats can be part of a healthy life, too."
    ] },
    { id: "appetite", words: ["no appetite", "not hungry", "can't eat", "cant eat", "nausea", "nauseous", "small portions"], replies: [
      "When appetite is low, protein comes first{name}. Small, frequent bites like yogurt, a protein shake, eggs or cottage cheese can help. If nausea continues, please check with your doctor.",
      "Little and often works well{name}. Sip water through the day and choose soft, protein-rich foods. Keep lifting too; it helps protect your muscle."
    ] },
    { id: "water", words: ["water", "hydrat", "thirsty", "drink"], replies: [
      "Great question{name}! Keep a water bottle nearby and sip through the day, plus a little extra around workouts. If you feel tired or headachy, water is a great first step.",
      "Hydration helps energy, recovery and appetite{name}. Try a glass of water with every meal and one before your workout."
    ] },
    { id: "steps", words: ["steps", "walk", "walking", "step count", "pedometer"], replies: [
      "Walking is a gift to your body{name}. A 10-minute walk after meals is a lovely habit. Log your steps on the Today screen and watch them add up.",
      "Every step counts{name}! If today's goal feels far, take a short walk now and another later. They shall walk, and not faint.",
      "Walks are perfect on rest days too{name}. Try a prayer walk: give thanks for something with every block."
    ] },
    { id: "run", words: ["run", "running", "jog", "5k", "10k", "half marathon", "marathon", "race", "relay", "track", "pace", "mile"], replies: [
      "Keep most of your runs easy{name}, an easy pace where you can still talk. Strength days make you a faster, healthier runner. They shall run, and not be weary.",
      "Race day comes together one run at a time{name}. Follow today's plan, warm up well, and finish feeling like you could do a little more.",
      "Nerves before a race mean you care{name}. Trust your training, start slower than you want to, and enjoy it. Be strong and of a good courage.",
      "In the last two weeks before a race, your plan tapers so your legs feel fresh{name}. Less is more right now; rest is training too."
    ] },
    { id: "menopause", words: ["menopause", "perimenopause", "hot flash", "hot flashes", "hormone", "mood swings", "brain fog"], replies: [
      "This season can be a lot{name}, and you're handling it with courage. Strength training is one of the best things you can do for bones, mood and sleep. On hot-flash days, train somewhere cool and keep water close.",
      "Your body is changing, and you're meeting it with strength{name}. Some weeks you'll feel great and some you won't; adjust without guilt. Talk with your doctor about symptoms that bother you.",
      "Muscle is protective in menopause{name}, so every session counts. Lift steadily, add balance work, and give yourself extra grace with rest."
    ] },
    { id: "glp1", words: ["glp", "weight loss shot", "injection", "shot"], replies: [
      "On a GLP-1, protecting muscle is the main goal{name}. Lift two to three times a week and have protein at every meal, even small ones. Any questions about your medication go to your doctor.",
      "Smaller appetite makes protein extra important{name}. Start each meal with the protein bite first. Your strength workouts help make sure the weight that comes off isn't muscle."
    ] },
    { id: "balance", words: ["balance", "fall", "falling", "unsteady", "wobbly", "senior", "older", "age", "too old", "arthritis"], replies: [
      "It's never too late to get stronger{name}. Balance work near a chair or wall is perfect, and it gets easier every week. Safety first, always.",
      "Strong legs and steady balance keep you independent{name}. Sit-to-stands and step-ups are some of the best moves you can do. Go slow and hold on whenever you need to.",
      "Age is just a number to your muscles{name}; they respond to training at every age. Take your time, warm up well, and celebrate how far you've come."
    ] },
    { id: "nervous", words: ["nervous", "scared", "intimidat", "gym anxiety", "don't know how", "dont know how", "new to", "beginner", "never lifted", "first workout", "afraid"], replies: [
      "Everyone starts somewhere{name}, and you're already brave for starting. Each exercise has a simple cue to guide you. Go slow, use light weights, and focus on how it feels. Be strong and of a good courage.",
      "It's okay to feel unsure{name}. Start with bodyweight and master the movement first. Nobody at the gym is watching as closely as you think; they're focused on themselves.",
      "You don't have to be great to start{name}, but you have to start to get great. Do {today} at your own pace, and I'll be right here."
    ] },
    { id: "warmup", words: ["warm up", "warmup", "stretch", "mobility", "cool down", "flexib"], replies: [
      "A good warm-up is 5 minutes{name}: march in place, arm circles, hip circles and a few easy squats. It helps your joints feel ready.",
      "Stretch gently after your workout{name}, holding each stretch for about 30 seconds. Breathe slowly and use it as a moment of gratitude."
    ] },
    { id: "form", words: ["form", "technique", "doing it right", "correct way", "how do i do", "how to do", "knees cave", "back rounding"], replies: [
      "Great question{name}. Read the cue under each exercise, move slowly, and stop if anything pinches. Filming one set on your phone is a great way to check your form.",
      "Form first, weight second{name}. Keep your core braced, move with control, and use a weight you could lift a couple more times. If something hurts, swap it."
    ] },
    { id: "rest", words: ["rest day", "day off", "recovery", "overtrain", "every day", "take a break"], replies: [
      "Rest days are when muscles grow{name}. Enjoy a walk, stretch, and get good sleep. Even God rested on the seventh day.",
      "Taking a day off is part of the plan{name}, not a break from it. Come back tomorrow fresh and ready."
    ] },
    { id: "faith", words: ["pray", "prayer", "faith", "god", "jesus", "lord", "bible", "verse", "scripture", "church", "bless"], replies: [
      "I love that{name}. Before your workout, try a slow breath and this prayer: \"Lord, thank You for this body. Help me steward it well today.\" Then move with gratitude. I can do all things through Christ who strengthens me.",
      "Here's a verse for today{name}: {verse} Carry it with you through your workout.",
      "Let's pray together{name}: \"Lord, give me strength for today, grace for my weak moments, and joy in the journey. Amen.\" You're not doing this alone.",
      "Faith and fitness go well together{name}. Every rep can be a quiet thank-you for the body you were given. {verse}"
    ] },
    { id: "thanks", words: ["thank", "thanks", "appreciate", "love this", "you're the best", "helpful"], replies: [
      "You're so welcome{name}! I'm proud of the work you're putting in. Keep going; you've got this.",
      "Anytime{name}. Cheering for you every step of the way.",
      "That means a lot{name}. The credit is yours, though. You're the one showing up."
    ] },
    { id: "greeting", words: ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "how are you"], replies: [
      "Hi {Name}! So glad you're here. How are you feeling today?",
      "Hey {Name}! You've done {week} workouts this week. How can I help you keep it going?",
      "Good to see you {Name}! Today's plan is {today}. How's your energy?"
    ] },
    { id: "today", weight: 0.5, words: ["today", "workout", "what should i", "what do i do", "plan", "next"], replies: [
      "Up today{name}: {today}. Start with a 5-minute warm-up, take your time on each set, and tap Done as you go. You've got this.",
      "Here's the plan{name}: {today}. You've done {week} this week, so {left} to go. Let's make today count.",
      "Your workout today is {today}{name}. Not feeling 100 percent? Tap \"Low energy today?\" for a shorter version. Either way, I'm cheering for you."
    ] },
    { id: "app", weight: 0.5, words: ["how does", "how do i use", "where is", "where do i", "log", "track", "progress tab", "change my plan", "settings", "cancel", "subscription", "billing"], replies: [
      "Here's the quick tour{name}: Today has your workout and steps, Eat has meals, swaps and your grocery list, and Progress shows your lifts and weigh-ins. Change your plan anytime from the profile icon on Today.",
      "Log weigh-ins on the Progress tab and steps on Today{name}. You can change your program, days, time, equipment and food from your profile, and membership changes are under \"Manage or cancel\" there too."
    ] }
  ];

  // Add the larger saved library (js/coach-library.js) to each topic
  const EXTRA = window.BBF_COACH_EXTRA || {};
  // Free members get the starter set (tp.base); Core, trial and AI Coach members (when offline) get the full library.
  TOPICS.forEach(tp => { tp.base = tp.replies.slice(); if (EXTRA[tp.id]) tp.replies = tp.replies.concat(EXTRA[tp.id]); });

  const DEFAULT = [
    "I'm here for you{name}. Tell me how you're feeling, what's getting in the way, or what you'd like to change, and we'll figure out the next small step together.",
    "Every faithful step counts{name}. What's one thing you'd like help with today: your workout, your meals, or your motivation?",
    "I'm listening{name}. Whatever today looks like, we'll make a plan that fits it. How's your energy right now?",
    "I want to make sure I help with the right thing{name}. Are you asking about your workout, food, rest, or how you're feeling?",
    "Tell me a little more{name}. I can help with workout swaps, low-energy days, meals, sleep, motivation, running, or a word of encouragement.",
    "I'm not sure I caught that{name}, but I'm here. What's one thing that would make today feel like a win?"
  ];

  const has = (t, w) => w.length <= 3 ? new RegExp("\\b" + w + "\\b").test(t) : t.includes(w);
  const RKEY = "bbf_coach_rot";
  let mem = {};
  function nextIndex(id, n) {
    let rot = mem;
    try { rot = JSON.parse(localStorage.getItem(RKEY)) || mem; } catch (e) {}
    const i = ((rot[id] == null ? Math.floor(Math.random() * n) : rot[id] + 1)) % n;
    rot[id] = i; mem = rot;
    try { localStorage.setItem(RKEY, JSON.stringify(rot)); } catch (e) {}
    return i;
  }

  function fill(text, ctx) {
    const nm = ctx && ctx.name ? String(ctx.name).split(" ")[0] : "";
    const done = ctx && ctx.workoutsThisWeek != null ? ctx.workoutsThisWeek : null;
    const goal = ctx && ctx.weeklyGoal != null ? ctx.weeklyGoal : null;
    const left = done != null && goal != null ? Math.max(0, goal - done) : null;
    return text
      .replace(/\{name\}/g, nm ? ", " + nm : "")
      .replace(/\{Name\}/g, nm || "friend")
      .replace(/\{today\}/g, (ctx && ctx.today) || "the workout on your Today screen")
      .replace(/\{week\}/g, done != null && goal != null ? done + " of " + goal : "some")
      .replace(/\{left\}/g, left != null ? (left === 0 ? "none left, so anything extra is a bonus" : left + " left") : "a few more")
      .replace(/\{verse\}/g, () => VERSES[Math.floor(Math.random() * VERSES.length)]);
  }

  // ---- picking the most relevant reply ----
  const STOP = new Set("the and for you your are but not with this that have has had was were what when where how why who can could would should will just about from they them then than into out over some very really today feel like make made does doing dont don't cant can't im i'm get got its it's any all also more much too one two".split(" "));
  const stem = w => w.replace(/'s$/, "").replace(/(ing|ed|es|s)$/, "");
  const wordsOf = txt => String(txt).toLowerCase().replace(/\{[a-z]+\}/gi, " ").match(/[a-z']+/g) || [];
  const keyWords = txt => new Set(wordsOf(txt).filter(w => w.length > 2 && !STOP.has(w)).map(stem));
  const replyKeys = new Map();
  const keysFor = r => { if (!replyKeys.has(r)) replyKeys.set(r, keyWords(r)); return replyKeys.get(r); };
  // Rare words count more than common ones, so "squat" beats "good" when picking a reply.
  const DF = new Map();
  TOPICS.concat([{ replies: DEFAULT }]).forEach(tp => tp.replies.forEach(r => keysFor(r).forEach(k => DF.set(k, (DF.get(k) || 0) + 1))));
  const overlap = (msgKeys, r) => { let n = 0; keysFor(r).forEach(k => { if (msgKeys.has(k)) n += 1 / Math.sqrt(DF.get(k) || 1); }); return n; };

  const HKEY = "bbf_coach_recent";
  let memRecent = [];
  function recent() { try { return JSON.parse(localStorage.getItem(HKEY)) || memRecent; } catch (e) { return memRecent; } }
  function remember(r) { const h = [r.slice(0, 60)].concat(recent().filter(x => x !== r.slice(0, 60))).slice(0, 40); memRecent = h; try { localStorage.setItem(HKEY, JSON.stringify(h)); } catch (e) {} }

  // Best match for the message among replies not used recently; ties are broken randomly.
  function choose(list, msgKeys) {
    const used = new Set(recent());
    let pool = list.filter(r => !used.has(r.slice(0, 60)));
    if (!pool.length) pool = list.slice();
    let top = -1, picks = [];
    for (const r of pool) { const sc = overlap(msgKeys, r); if (sc > top) { top = sc; picks = [r]; } else if (sc === top) picks.push(r); }
    const r = picks[Math.floor(Math.random() * picks.length)];
    remember(r);
    return r;
  }

  window.BBF_DEMO_COACH = function (message, ctx, opts) {
    const basic = !!(opts && opts.basic);
    const pool = tp => basic ? tp.base : tp.replies;
    const t = " " + String(message || "").toLowerCase().replace(/[\u2019]/g, "'") + " ";
    const msgKeys = keyWords(t);
    // Safety first, in order
    for (const tp of TOPICS) if (tp.safety && tp.words.some(w => has(t, w))) return fill(choose(pool(tp), msgKeys), ctx);
    // Otherwise the topic whose words (and best reply) match the message most
    let best = null, score = 0;
    for (const tp of TOPICS) {
      if (tp.safety) continue;
      let s = tp.words.reduce((n, w) => n + (has(t, w) ? (w.includes(" ") ? 2 : 1) : 0), 0) * (tp.weight || 1);
      if (s > 0) s += 0.25 * Math.min(4, Math.max.apply(null, pool(tp).map(r => overlap(msgKeys, r))));
      if (s > score) { best = tp; score = s; }
    }
    let reply = fill(choose(best ? pool(best) : DEFAULT, msgKeys), ctx);
    // About one reply in four gets a verse, if it doesn't already have one
    if (best && best.id !== "greeting" && best.id !== "app" && !/\(\w+ \d/.test(reply) && !/God|LORD|Lord|grace|courage|mercies|weary|faint|made\b/.test(reply) && Math.random() < 0.25) {
      reply += " " + VERSES[Math.floor(Math.random() * VERSES.length)];
    }
    return reply;
  };
})();
