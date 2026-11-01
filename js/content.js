/* Built by Faith app content: programs, exercises, recipes, verses.
   Edit this file to change workouts, meals or daily words. */
(function () {
  // ---------- Daily words: short scripture + original affirmations ----------
  const VERSES = [
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "I will praise thee; for I am fearfully and wonderfully made.", ref: "Psalm 139:14" },
    { text: "They shall run, and not be weary; and they shall walk, and not faint.", ref: "Isaiah 40:31" },
    { text: "Be strong and of a good courage.", ref: "Joshua 1:9" },
    { text: "She girdeth her loins with strength, and strengtheneth her arms.", ref: "Proverbs 31:17" },
    { text: "My grace is sufficient for thee: for my strength is made perfect in weakness.", ref: "2 Corinthians 12:9" },
    { text: "Let us not be weary in well doing: for in due season we shall reap, if we faint not.", ref: "Galatians 6:9" },
    { text: "His compassions fail not. They are new every morning.", ref: "Lamentations 3:22-23" },
    { text: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
    { text: "The Lord is my strength and my shield; my heart trusted in him, and I am helped.", ref: "Psalm 28:7" },
    { text: "God is in the midst of her; she shall not be moved.", ref: "Psalm 46:5" },
    { text: "Commit thy works unto the Lord, and thy thoughts shall be established.", ref: "Proverbs 16:3" }
  ];

  const AFFIRMATIONS = {
    start: ["Start where you are. Grace covers the rest.", "Every season has its strength.", "Small steps, faithfully taken, change everything."],
    rest: ["Rest is part of strength.", "A shorter workout still counts. You showed up.", "Gentle is still forward."],
    done: ["Faithful in little, growing in much.", "You kept your word to yourself today.", "Strength is built one faithful rep at a time.", "That was strong. Well done."],
    back: ["Welcome back. No guilt, just grace.", "Today is a fresh start. His mercies are new every morning.", "You didn't quit. You paused. Let's go gently."],
    eat: ["Nourish the body you were given.", "Give thanks, and enjoy every bite."]
  };

  // ---------- Programs ----------
  // slots: movement patterns filled from EXERCISES by training space
  const PROGRAMS = {
    glp1: {
      name: "GLP-1 Strength", short: "Keep your muscle while the weight comes off.",
      sessions: [
        { name: "Full body A", slots: ["squat", "push", "pull", "core"] },
        { name: "Full body B", slots: ["hinge", "lunge", "pull", "carry"] },
        { name: "Full body C", slots: ["squat", "push", "hinge", "core"] }
      ],
      walkDay: true, tip: "Aim for protein at every meal. It helps your body hold on to muscle."
    },
    meno: {
      name: "Menopause Strength", short: "Energy, strong bones and better sleep.",
      sessions: [
        { name: "Lower body + core", slots: ["squat", "hinge", "lunge", "core"] },
        { name: "Upper body", slots: ["push", "pull", "push2", "carry"] },
        { name: "Full body + balance", slots: ["squat", "pull", "balance", "core"] }
      ],
      walkDay: true, tip: "Lifting a little heavier over time is one of the best things for strong bones."
    },
    over40: {
      name: "Strong Over 40", short: "Build real muscle while keeping your joints happy.",
      sessions: [
        { name: "Push + legs", slots: ["squat", "push", "lunge", "core"] },
        { name: "Pull + core", slots: ["hinge", "pull", "pull2", "core"] },
        { name: "Full body", slots: ["squat", "push", "pull", "carry"] }
      ],
      walkDay: false, tip: "Warm up for five minutes before you lift. Your joints will thank you."
    },
    senior: {
      name: "Senior Strength", short: "Everyday strength and steady balance.",
      sessions: [
        { name: "Strength + balance A", slots: ["sitstand", "wallpush", "pull", "balance"] },
        { name: "Strength + balance B", slots: ["stepup", "pull", "balance", "carry"] },
        { name: "Strength + balance C", slots: ["sitstand", "wallpush", "balance", "core"] }
      ],
      walkDay: true, tip: "Keep a chair or counter nearby for balance work. Safe is strong."
    },
    beginner: {
      name: "Total Beginner", short: "Step by step, so you always know what to do.",
      sessions: [
        { name: "Learn the basics", slots: ["squat", "push", "pull"] },
        { name: "Full body intro", slots: ["hinge", "push", "core"] },
        { name: "Full body practice", slots: ["squat", "pull", "core"] }
      ],
      walkDay: true, tip: "Focus on doing each move well. Weight comes later."
    },
    busy: {
      name: "20-Minute Strong", short: "Short, efficient sessions for full weeks.",
      sessions: [
        { name: "Full body", slots: ["squat", "push", "pull"] },
        { name: "Legs + core", slots: ["lunge", "hinge", "core"] },
        { name: "Upper body", slots: ["push", "pull", "carry"] }
      ],
      walkDay: false, tip: "Move straight from one exercise to the next to save time."
    },
    race: {
      name: "Race Ready", short: "5K to marathon, relays and track, with strength built in.",
      sessions: [
        { name: "Strength for runners", slots: ["squat", "hinge", "lunge", "core"] },
        { name: "Intervals or track", run: "intervals" },
        { name: "Long easy run", run: "long" }
      ],
      walkDay: false, tip: "Most of your running should feel easy enough to hold a conversation."
    }
  };

  // ---------- Exercises by pattern and training space ----------
  // kind: "load" (weight in lb) or "body" (reps only) or "time" (seconds)
  const X = (name, kind, cue) => ({ name, kind, cue });
  const EXERCISES = {
    squat: { bare: X("Bodyweight squat", "body", "Sit back like into a chair, chest tall."), db: X("Goblet squat", "load", "Hold one dumbbell at your chest. Sit between your heels."), gym: X("Goblet squat", "load", "Hold one dumbbell at your chest. Sit between your heels."), out: X("Bench squat", "body", "Sit to a park bench and stand right back up.") },
    hinge: { bare: X("Glute bridge", "body", "Squeeze your glutes and lift your hips. Pause at the top."), db: X("Dumbbell Romanian deadlift", "load", "Soft knees, push your hips back, keep the weights close."), gym: X("Romanian deadlift", "load", "Soft knees, push your hips back, flat back."), out: X("Single-leg glute bridge", "body", "One foot down, lift your hips, keep them level.") },
    lunge: { bare: X("Split squat", "body", "Long stance, lower the back knee straight down."), db: X("Dumbbell reverse lunge", "load", "Step back, lower with control, push through the front foot."), gym: X("Dumbbell reverse lunge", "load", "Step back, lower with control, push through the front foot."), out: X("Walking lunges", "body", "Long steps, tall chest, back knee toward the ground.") },
    push: { bare: X("Incline push-up", "body", "Hands on a counter. Body straight like a plank."), db: X("Dumbbell floor press", "load", "Lie down, elbows at 45 degrees, press up."), gym: X("Dumbbell bench press", "load", "Feet planted, press up over your chest."), out: X("Bench push-up", "body", "Hands on a park bench, lower your chest to it.") },
    push2: { bare: X("Pike push-up", "body", "Hips high, lower your head toward the floor."), db: X("Seated shoulder press", "load", "Press straight up, ribs down."), gym: X("Seated shoulder press", "load", "Press straight up, ribs down."), out: X("Bench dips", "body", "Hands on the bench, lower slowly, shoulders down.") },
    pull: { bare: X("Backpack row", "load", "Fill a backpack, hinge forward and row it to your ribs."), db: X("One-arm dumbbell row", "load", "Hand on a bench or chair, pull your elbow back."), gym: X("Seated cable row", "load", "Chest tall, pull your elbows back, squeeze."), out: X("Inverted row", "body", "Under a low bar or sturdy rail, pull your chest up.") },
    pull2: { bare: X("Superman hold", "time", "Lie face down, lift arms and legs, breathe."), db: X("Dumbbell reverse fly", "load", "Hinge forward, lift arms out wide, squeeze shoulder blades."), gym: X("Lat pulldown", "load", "Pull the bar to your upper chest, elbows down."), out: X("Band pull-apart", "body", "Arms straight, pull the band apart to your chest.") },
    core: { bare: X("Dead bug", "body", "Low back pressed down, slowly reach opposite arm and leg."), db: X("Plank", "time", "Elbows under shoulders, squeeze glutes, breathe."), gym: X("Plank", "time", "Elbows under shoulders, squeeze glutes, breathe."), out: X("Bird dog", "body", "Hands and knees, reach opposite arm and leg, stay steady.") },
    carry: { bare: X("Wall sit", "time", "Back on the wall, knees over ankles, breathe."), db: X("Farmer carry", "time", "Heavy dumbbells at your sides, walk tall."), gym: X("Farmer carry", "time", "Heavy dumbbells at your sides, walk tall."), out: X("Hill walk", "time", "Walk briskly uphill, arms swinging.") },
    balance: { bare: X("Single-leg stand", "time", "Hold a counter at first. Stand tall on one foot."), db: X("Single-leg stand", "time", "Hold a counter at first. Stand tall on one foot."), gym: X("Single-leg stand", "time", "Hold a rail at first. Stand tall on one foot."), out: X("Heel-to-toe walk", "time", "Walk a straight line, heel touching toe.") },
    sitstand: { bare: X("Sit to stand", "body", "From a sturdy chair, stand up without using your hands if you can."), db: X("Sit to stand", "body", "From a sturdy chair, stand up without using your hands if you can."), gym: X("Box squat", "body", "Sit back to a box or bench and stand tall."), out: X("Bench sit to stand", "body", "Sit to a park bench and stand right back up.") },
    wallpush: { bare: X("Wall push-up", "body", "Hands on the wall, lower your chest toward it."), db: X("Wall push-up", "body", "Hands on the wall, lower your chest toward it."), gym: X("Chest press machine", "load", "Light weight, press smoothly, control the return."), out: X("Bench push-up", "body", "Hands on a park bench, lower your chest to it.") },
    stepup: { bare: X("Step-up", "body", "Use the bottom stair. Hold the rail. Step up tall."), db: X("Step-up", "body", "Use the bottom stair. Hold the rail. Step up tall."), gym: X("Step-up", "body", "Low box, hold a rail, step up tall."), out: X("Curb step-up", "body", "Step up onto a curb or low step, slow and steady.") }
  };

  const RUNS = {
    easy: { name: "Easy run", cue: "Conversational pace. You should be able to talk." },
    intervals: { name: "Intervals", cue: "Warm up 10 min, then fast-but-controlled repeats with easy jogs between." },
    long: { name: "Long easy run", cue: "Slow and steady. This builds your engine." }
  };

  // ---------- Recipes ----------
  // tags: diet styles it fits; allergens: dairy, gluten, nuts, egg, fish, soy
  const R = (id, name, slot, protein, minutes, tags, allergens, ingredients, steps) => ({ id, name, slot, protein, minutes, tags, allergens, ingredients, steps });
  const ALL = ["balanced", "high-protein", "mediterranean"];
  const RECIPES = [
    R("eggspin", "Egg and spinach scramble", "breakfast", 28, 10, [...ALL, "vegetarian", "gluten-free", "dairy-free"], ["egg"], ["4 eggs", "2 handfuls spinach", "1 tsp olive oil", "Salt and pepper"], ["Warm oil in a pan over medium heat.", "Wilt the spinach for 1 minute.", "Add beaten eggs and stir gently until just set.", "Season and serve."]),
    R("yogurtbowl", "Greek yogurt berry bowl", "breakfast", 25, 5, [...ALL, "vegetarian", "gluten-free"], ["dairy", "nuts"], ["1 cup plain Greek yogurt", "1 cup berries", "1 tbsp chopped almonds", "1 tsp honey"], ["Spoon yogurt into a bowl.", "Top with berries and almonds.", "Drizzle with honey."]),
    R("oatsprotein", "Protein overnight oats", "breakfast", 24, 5, ["balanced", "high-protein", "vegetarian"], ["dairy", "gluten"], ["1/2 cup oats", "1/2 cup Greek yogurt", "1/2 cup milk", "1 tbsp chia seeds", "1/2 banana"], ["Stir everything except banana in a jar.", "Refrigerate overnight.", "Top with sliced banana in the morning."]),
    R("tofuscramble", "Turmeric tofu scramble", "breakfast", 22, 12, [...ALL, "vegetarian", "vegan", "gluten-free", "dairy-free"], ["soy"], ["1 block firm tofu", "1/2 bell pepper, diced", "1/2 tsp turmeric", "1 tsp olive oil", "Salt and pepper"], ["Sauté pepper in oil for 3 minutes.", "Crumble in tofu and turmeric.", "Cook 5 minutes, stirring.", "Season and serve."]),
    R("chickenbowl", "Greek chicken bowl", "lunch", 35, 20, [...ALL, "gluten-free"], ["dairy"], ["6 oz chicken breast", "1/2 cup cooked rice or quinoa", "Cucumber and tomato", "2 tbsp tzatziki", "Lemon"], ["Season chicken with salt, pepper and lemon.", "Cook in a pan 6 to 7 minutes per side.", "Slice and serve over rice with vegetables.", "Top with tzatziki."]),
    R("tunawrap", "Tuna salad lettuce wraps", "lunch", 30, 10, [...ALL, "gluten-free", "dairy-free"], ["fish", "egg"], ["1 can tuna", "1 tbsp mayo", "Celery, diced", "Butter lettuce leaves"], ["Mix tuna, mayo and celery.", "Spoon into lettuce leaves.", "Wrap and enjoy."]),
    R("lentilsoup", "Hearty lentil soup", "lunch", 18, 30, ["balanced", "mediterranean", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["1 cup dry lentils", "1 carrot, 1 celery stalk, 1 onion, diced", "4 cups broth", "1 tsp cumin"], ["Sauté vegetables 5 minutes.", "Add lentils, broth and cumin.", "Simmer 25 minutes until tender.", "Season and serve."]),
    R("turkeywrap", "Turkey hummus wrap", "lunch", 28, 8, ["balanced", "high-protein"], ["gluten"], ["1 whole wheat wrap", "4 oz sliced turkey", "2 tbsp hummus", "Spinach and cucumber"], ["Spread hummus on the wrap.", "Layer turkey and vegetables.", "Roll tightly and slice."]),
    R("chickpeasalad", "Chickpea Mediterranean salad", "lunch", 16, 10, ["balanced", "mediterranean", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["1 can chickpeas, rinsed", "Cucumber, tomato, red onion", "Olive oil and lemon", "Fresh parsley"], ["Chop the vegetables.", "Toss with chickpeas, oil and lemon.", "Top with parsley."]),
    R("tacowraps", "Turkey taco lettuce wraps", "dinner", 32, 25, [...ALL, "gluten-free", "dairy-free"], [], ["1 lb ground turkey", "1 tbsp taco seasoning", "Butter lettuce leaves", "Salsa and avocado"], ["Brown turkey 8 minutes.", "Stir in seasoning and a splash of water.", "Spoon into lettuce cups.", "Top with salsa and avocado."]),
    R("salmonveg", "Sheet pan salmon and vegetables", "dinner", 34, 25, [...ALL, "gluten-free", "dairy-free"], ["fish"], ["6 oz salmon fillet", "Broccoli and sweet potato, chopped", "1 tbsp olive oil", "Lemon and garlic"], ["Heat oven to 425°F.", "Toss vegetables in oil and roast 10 minutes.", "Add salmon, season, roast 12 more minutes.", "Finish with lemon."]),
    R("chickenstirfry", "Chicken veggie stir-fry", "dinner", 33, 20, ["balanced", "high-protein", "dairy-free"], ["soy"], ["6 oz chicken, sliced", "2 cups stir-fry vegetables", "2 tbsp soy sauce", "1 tsp ginger", "1/2 cup rice"], ["Cook chicken in a hot pan 5 minutes.", "Add vegetables and stir-fry 4 minutes.", "Add soy sauce and ginger.", "Serve over rice."]),
    R("beanchili", "Three-bean chili", "dinner", 20, 30, ["balanced", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["1 can each black, kidney and pinto beans", "1 can diced tomatoes", "1 onion, diced", "2 tsp chili powder"], ["Sauté onion 4 minutes.", "Add everything else.", "Simmer 20 minutes.", "Serve warm."]),
    R("pastaturkey", "Turkey meat sauce pasta", "dinner", 35, 25, ["balanced", "high-protein"], ["gluten"], ["4 oz whole wheat pasta", "1/2 lb ground turkey", "1 cup marinara", "Side salad"], ["Boil pasta.", "Brown turkey 8 minutes.", "Stir in marinara and simmer 5 minutes.", "Toss with pasta."]),
    R("shrimpbowl", "Garlic shrimp quinoa bowl", "dinner", 30, 20, [...ALL, "gluten-free", "dairy-free"], ["fish"], ["6 oz shrimp", "1/2 cup quinoa", "Zucchini, sliced", "Garlic and olive oil"], ["Cook quinoa.", "Sauté zucchini 3 minutes.", "Add shrimp and garlic, cook 3 to 4 minutes.", "Serve over quinoa."]),
    R("chiapudding", "Berry chia pudding", "breakfast", 8, 5, ["balanced", "mediterranean", "vegetarian", "vegan", "dairy-free"], [], ["3 tbsp chia seeds", "3/4 cup oat milk", "1/2 cup berries", "1 tsp maple syrup"], ["Stir chia and oat milk in a jar.", "Refrigerate at least 2 hours or overnight.", "Top with berries and maple syrup."]),
    R("hummusveg", "Hummus and veggie plate", "snack", 7, 5, ["balanced", "mediterranean", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["1/3 cup hummus", "Carrots, cucumber and bell pepper"], ["Slice the vegetables.", "Dip and enjoy."]),
    R("cottagebowl", "Cottage cheese snack bowl", "snack", 24, 3, ["balanced", "high-protein", "vegetarian", "gluten-free"], ["dairy"], ["1 cup cottage cheese", "Pineapple or cucumber"], ["Spoon into a bowl and top."]),
    R("edamame", "Salted edamame", "snack", 17, 5, [...ALL, "vegetarian", "vegan", "gluten-free", "dairy-free"], ["soy"], ["1 cup edamame in pods", "Sea salt"], ["Steam or microwave 3 minutes.", "Sprinkle with salt."]),
    // ---- more variety ----
    R("veggieomelet", "Veggie and feta omelet", "breakfast", 26, 12, [...ALL, "vegetarian", "gluten-free"], ["egg", "dairy"], ["3 eggs", "1/4 cup crumbled feta", "Spinach, tomato and onion", "1 tsp olive oil"], ["Sauté the vegetables in oil for 3 minutes.", "Pour in beaten eggs and cook until almost set.", "Sprinkle feta, fold and serve."]),
    R("pbtoast", "Peanut butter banana toast", "breakfast", 14, 5, ["balanced", "vegetarian", "vegan", "dairy-free"], ["nuts", "gluten"], ["2 slices whole grain bread", "2 tbsp peanut butter", "1 banana", "Pinch of cinnamon"], ["Toast the bread.", "Spread peanut butter.", "Top with sliced banana and cinnamon."]),
    R("smoothie", "Berry protein smoothie", "breakfast", 27, 5, ["balanced", "high-protein", "vegetarian", "gluten-free"], ["dairy"], ["1 cup milk", "1/2 cup Greek yogurt", "1 cup frozen berries", "1/2 banana", "1 tbsp ground flax"], ["Add everything to a blender.", "Blend until smooth.", "Pour and enjoy."]),
    R("veganoats", "Peanut butter protein oats", "breakfast", 18, 8, ["balanced", "vegetarian", "vegan", "dairy-free"], ["nuts", "gluten", "soy"], ["1/2 cup oats", "1 cup soy milk", "1 tbsp peanut butter", "1 tbsp chia seeds", "Berries"], ["Simmer oats in soy milk for 5 minutes.", "Stir in chia and peanut butter.", "Top with berries."]),
    R("breakfasttacos", "Egg and black bean breakfast tacos", "breakfast", 24, 12, ["balanced", "high-protein", "vegetarian", "gluten-free", "dairy-free"], ["egg"], ["3 eggs", "1/2 cup black beans", "2 corn tortillas", "Salsa and avocado"], ["Warm the beans and tortillas.", "Scramble the eggs.", "Fill tortillas with eggs and beans.", "Top with salsa and avocado."]),
    R("sweetpotatohash", "Sweet potato and turkey sausage hash", "breakfast", 25, 20, ["balanced", "high-protein", "gluten-free", "dairy-free"], [], ["1 sweet potato, diced", "2 turkey sausage links, sliced", "1/2 bell pepper", "1 tsp olive oil"], ["Cook sweet potato in oil for 10 minutes, covered.", "Add sausage and pepper.", "Cook 6 to 8 minutes until browned."]),
    R("cottagetoast", "Cottage cheese tomato toast", "breakfast", 20, 5, ["balanced", "high-protein", "mediterranean", "vegetarian"], ["dairy", "gluten"], ["2 slices whole grain bread", "1/2 cup cottage cheese", "Sliced tomato", "Black pepper and basil"], ["Toast the bread.", "Spread cottage cheese.", "Top with tomato, pepper and basil."]),

    R("quinoabowl", "Quinoa black bean bowl", "lunch", 19, 15, ["balanced", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["1 cup cooked quinoa", "1/2 cup black beans", "Corn, tomato and red onion", "Lime and cilantro", "1/4 avocado"], ["Warm the quinoa and beans.", "Add corn, tomato and onion.", "Squeeze lime and top with avocado and cilantro."]),
    R("eggsaladwrap", "Egg salad lettuce wraps", "lunch", 20, 10, ["balanced", "vegetarian", "gluten-free"], ["egg", "dairy"], ["4 hard-boiled eggs", "2 tbsp Greek yogurt", "1 tsp mustard", "Celery and chives", "Butter lettuce"], ["Chop the eggs.", "Mix with yogurt, mustard, celery and chives.", "Spoon into lettuce leaves."]),
    R("salmonsalad", "Salmon spinach salad", "lunch", 30, 10, [...ALL, "gluten-free", "dairy-free"], ["fish"], ["1 pouch or can salmon", "2 cups spinach", "Cherry tomatoes and cucumber", "Olive oil and lemon"], ["Toss spinach and vegetables.", "Top with salmon.", "Dress with olive oil and lemon."]),
    R("tofubowl", "Teriyaki tofu rice bowl", "lunch", 22, 20, ["balanced", "vegetarian", "vegan", "dairy-free"], ["soy", "gluten"], ["1/2 block firm tofu, cubed", "1/2 cup brown rice", "Broccoli and carrots", "2 tbsp teriyaki sauce"], ["Pan-fry tofu until golden, about 8 minutes.", "Steam the vegetables.", "Serve over rice with teriyaki sauce."]),
    R("chickensoup", "Chicken and vegetable soup", "lunch", 28, 30, [...ALL, "gluten-free", "dairy-free"], [], ["6 oz chicken breast", "Carrot, celery and onion", "4 cups chicken broth", "Thyme"], ["Sauté vegetables 5 minutes.", "Add broth, chicken and thyme.", "Simmer 20 minutes.", "Shred the chicken and serve."]),
    R("caprese", "Chicken caprese salad", "lunch", 34, 15, [...ALL, "gluten-free"], ["dairy"], ["5 oz cooked chicken", "Fresh mozzarella", "Tomato and basil", "Balsamic and olive oil", "Mixed greens"], ["Slice chicken, mozzarella and tomato.", "Layer over greens with basil.", "Drizzle with balsamic and oil."]),
    R("hummusbowl", "Falafel-style hummus bowl", "lunch", 17, 15, ["balanced", "mediterranean", "vegetarian", "vegan", "dairy-free"], ["gluten"], ["1/2 cup chickpeas, roasted", "1/3 cup hummus", "Cucumber, tomato and greens", "1/2 whole wheat pita"], ["Roast chickpeas at 425°F for 15 minutes.", "Spread hummus in a bowl.", "Add vegetables, chickpeas and pita."]),

    R("lentilcurry", "Coconut lentil curry", "dinner", 18, 30, ["balanced", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["1 cup red lentils", "1 can light coconut milk", "1 can diced tomatoes", "1 onion and 2 garlic cloves", "2 tsp curry powder", "Spinach"], ["Sauté onion and garlic 4 minutes.", "Add lentils, tomatoes, coconut milk and curry.", "Simmer 20 minutes.", "Stir in spinach until wilted."]),
    R("tofustirfry", "Tofu broccoli stir-fry", "dinner", 24, 20, ["balanced", "vegetarian", "vegan", "dairy-free"], ["soy"], ["1 block firm tofu, cubed", "2 cups broccoli", "2 tbsp soy sauce", "1 tsp ginger and garlic", "1/2 cup brown rice"], ["Pan-fry tofu until golden.", "Add broccoli and stir-fry 4 minutes.", "Add soy sauce, ginger and garlic.", "Serve over rice."]),
    R("stuffedpeppers", "Black bean stuffed peppers", "dinner", 17, 35, ["balanced", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["2 bell peppers, halved", "1 can black beans", "1/2 cup cooked rice", "1/2 cup salsa", "Cumin"], ["Heat oven to 400°F.", "Mix beans, rice, salsa and cumin.", "Fill the peppers.", "Bake 25 minutes."]),
    R("chickpeacurry", "Chickpea spinach curry", "dinner", 16, 25, ["balanced", "mediterranean", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["1 can chickpeas", "1 can diced tomatoes", "2 cups spinach", "1 onion", "2 tsp garam masala"], ["Sauté onion 5 minutes.", "Add chickpeas, tomatoes and spices.", "Simmer 15 minutes.", "Stir in spinach."]),
    R("lemonchicken", "Lemon herb chicken with green beans", "dinner", 38, 25, [...ALL, "gluten-free", "dairy-free"], [], ["6 oz chicken breast", "2 cups green beans", "1 lemon", "Garlic, oregano and olive oil", "1 small potato"], ["Heat oven to 425°F.", "Toss potato in oil and roast 10 minutes.", "Add chicken and green beans with lemon, garlic and oregano.", "Roast 18 to 20 minutes."]),
    R("turkeymeatballs", "Turkey meatballs and zucchini noodles", "dinner", 32, 25, [...ALL, "gluten-free", "dairy-free"], ["egg"], ["1/2 lb ground turkey", "1 egg", "Italian seasoning", "2 zucchini, spiralized", "1 cup marinara"], ["Mix turkey, egg and seasoning; roll into balls.", "Bake at 400°F for 18 minutes.", "Warm zucchini noodles 2 minutes.", "Top with meatballs and marinara."]),
    R("codtacos", "Baked fish tacos", "dinner", 28, 20, [...ALL, "gluten-free", "dairy-free"], ["fish"], ["6 oz cod or tilapia", "Corn tortillas", "Cabbage slaw", "Lime and salsa"], ["Season fish and bake at 400°F for 12 minutes.", "Flake into warm tortillas.", "Top with slaw, lime and salsa."]),
    R("beefbowl", "Lean beef and veggie rice bowl", "dinner", 33, 20, ["balanced", "high-protein", "gluten-free", "dairy-free"], [], ["5 oz lean ground beef", "1/2 cup rice", "Peppers and onions", "Salsa"], ["Brown beef 7 minutes.", "Add peppers and onions, cook 4 minutes.", "Serve over rice with salsa."]),
    R("pestopasta", "White bean pesto pasta", "dinner", 22, 20, ["balanced", "mediterranean", "vegetarian"], ["gluten", "dairy", "nuts"], ["3 oz whole wheat pasta", "1/2 can white beans", "2 tbsp pesto", "Cherry tomatoes and spinach"], ["Boil pasta.", "Warm beans, tomatoes and spinach in a pan.", "Toss everything with pesto."]),
    R("tempehbowl", "Tempeh sweet potato bowl", "dinner", 26, 30, ["balanced", "high-protein", "vegetarian", "vegan", "gluten-free", "dairy-free"], ["soy"], ["4 oz tempeh, cubed", "1 sweet potato, cubed", "Kale", "Tahini and lemon"], ["Roast sweet potato at 425°F for 20 minutes.", "Pan-fry tempeh until golden.", "Wilt kale in the pan.", "Serve with tahini and lemon."]),

    R("trailmix", "Simple trail mix", "snack", 7, 1, ["balanced", "mediterranean", "vegetarian", "vegan", "gluten-free", "dairy-free"], ["nuts"], ["2 tbsp almonds", "1 tbsp pumpkin seeds", "1 tbsp raisins"], ["Mix and portion into a small bag."]),
    R("roastedchickpeas", "Crunchy roasted chickpeas", "snack", 7, 25, ["balanced", "mediterranean", "vegetarian", "vegan", "gluten-free", "dairy-free"], [], ["1 can chickpeas, dried well", "1 tsp olive oil", "Paprika and salt"], ["Heat oven to 425°F.", "Toss chickpeas with oil and spices.", "Roast 20 to 25 minutes, shaking once."]),
    R("yogurtparfait", "Greek yogurt parfait", "snack", 15, 3, ["balanced", "high-protein", "vegetarian"], ["dairy", "gluten"], ["3/4 cup Greek yogurt", "2 tbsp granola", "Berries"], ["Layer yogurt, berries and granola in a cup."]),
    R("turkeyroll", "Turkey and cheese roll-ups", "snack", 18, 3, ["balanced", "high-protein", "gluten-free"], ["dairy"], ["3 slices turkey", "2 slices cheese", "Cucumber spears"], ["Lay cheese on turkey.", "Roll around cucumber spears."]),
    R("applepb", "Apple with peanut butter", "snack", 8, 2, ["balanced", "vegetarian", "vegan", "gluten-free", "dairy-free"], ["nuts"], ["1 apple", "2 tbsp peanut butter"], ["Slice the apple and dip."]),
    R("proteinshake", "Chocolate protein shake", "snack", 25, 2, ["balanced", "high-protein", "vegetarian", "gluten-free"], ["dairy"], ["1 scoop protein powder", "1 cup milk", "Ice", "1/2 banana (optional)"], ["Blend or shake until smooth."]),
    R("appleegg", "Apple and hard-boiled eggs", "snack", 13, 2, [...ALL, "vegetarian", "gluten-free", "dairy-free"], ["egg"], ["2 hard-boiled eggs", "1 apple"], ["Slice the apple and enjoy with the eggs."])
  ];

  const DIETS = ["balanced", "high-protein", "mediterranean", "vegetarian", "vegan", "dairy-free", "gluten-free"];
  const ALLERGENS = ["dairy", "gluten", "nuts", "egg", "fish", "soy"];

  window.BBF_CONTENT = { VERSES, AFFIRMATIONS, PROGRAMS, EXERCISES, RUNS, RECIPES, DIETS, ALLERGENS };
})();
