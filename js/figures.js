/* Exercise diagrams: a simple start -> finish drawing for every exercise in the app.
   Each drawing is built from a pose (joint angles), so body proportions always stay right.
   Side view: the figure faces right. Angles are in degrees from straight down; positive = forward.
   Torso angle is from straight up; positive = leaning forward. */
(function () {
  const L = { torso: 26, neck: 5, head: 5.6, thigh: 17, shin: 17, upper: 12, fore: 11.5, foot: 5 };
  const COL = { body: "#C4553E", far: "#EBA393", prop: "#9ED3CF", prop2: "#D8CEC2", ink: "#1F2A33", ground: "#E6DDD3" };
  const rad = d => d * Math.PI / 180;
  const seg = (p, ang, len) => [p[0] + len * Math.sin(rad(ang)), p[1] + len * Math.cos(rad(ang))];

  // Build joint positions for a side-view pose
  function side(p) {
    const hip = [0, 0];
    const t = p.t || 0;
    const sh = [hip[0] + L.torso * Math.sin(rad(t)), hip[1] - L.torso * Math.cos(rad(t))];
    const ht = t + (p.neck || 0);
    const head = [sh[0] + (L.neck + L.head) * Math.sin(rad(ht)), sh[1] - (L.neck + L.head) * Math.cos(rad(ht))];
    const limbs = (pairs, a, b) => pairs.map(([u, f]) => { const m = seg(a, u, b[0]); return [a, m, seg(m, f, b[1])]; });
    const arms = limbs(p.a || [[0, 0], [0, 0]], sh, [L.upper, L.fore]);
    const legs = limbs(p.l || [[0, 0], [0, 0]], hip, [L.thigh, L.shin]);
    const feet = legs.map((lg, i) => { const fa = (p.f && p.f[i] != null) ? p.f[i] : 90; return seg(lg[2], fa, L.foot); });
    return { hip, sh, head, arms, legs, feet };
  }
  // Front view: limb angles positive = outward from the body
  function front(p) {
    const hip = [0, 0], sh = [0, -L.torso];
    const head = [0, sh[1] - L.neck - L.head];
    const w = 7, hw = 4;
    const arm = (side, [u, f]) => { const s = [side * w, sh[1] + 2]; const m = seg(s, side * u, L.upper); return [s, m, seg(m, side * f, L.fore)]; };
    const leg = (side, [u, f]) => { const s = [side * hw, 0]; const m = seg(s, side * u, L.thigh); return [s, m, seg(m, side * f, L.shin)]; };
    const A = p.a || [[10, 10], [10, 10]], G = p.l || [[4, 4], [4, 4]];
    const arms = [arm(1, A[0]), arm(-1, A[1])], legs = [leg(1, G[0]), leg(-1, G[1])];
    const feet = legs.map((lg, i) => seg(lg[2], (i ? -1 : 1) * 90, 3));
    return { hip, sh, head, arms, legs, feet, front: true, shL: [-w, sh[1] + 2], shR: [w, sh[1] + 2], hipL: [-hw, 0], hipR: [hw, 0] };
  }

  // Place the figure in a 120 x 100 panel: centered, lowest point resting on the ground (y = 90)
  function place(j, p) {
    const pts = [j.head, j.sh, j.hip].concat(...j.arms, ...j.legs, j.feet);
    const minX = Math.min(...pts.map(q => q[0])), maxX = Math.max(...pts.map(q => q[0]));
    const contact = p.ground === "body" ? Math.max(...pts.map(q => q[1])) + 3 : Math.max(...j.feet.concat(j.legs.map(l => l[2])).map(q => q[1])) + 1.5;
    // optional: pin a hand to a fixed point (for bars, benches and walls)
    let dx = 60 - (minX + maxX) / 2 + (p.dx || 0), dy = 90 - contact + (p.dy || 0);
    if (p.pin) { const h = j.arms[p.pin.far ? 1 : 0][2]; dx = p.pin.x - h[0]; dy = p.pin.y - h[1]; }
    const mv = q => [q[0] + dx, q[1] + dy];
    const out = { head: mv(j.head), sh: mv(j.sh), hip: mv(j.hip), arms: j.arms.map(a => a.map(mv)), legs: j.legs.map(l => l.map(mv)), feet: j.feet.map(mv), front: j.front };
    if (j.front) { out.shL = mv(j.shL); out.shR = mv(j.shR); out.hipL = mv(j.hipL); out.hipR = mv(j.hipR); }
    return out;
  }

  const r1 = n => Math.round(n * 10) / 10;
  const line = (pts, c, w) => '<polyline points="' + pts.map(q => r1(q[0]) + "," + r1(q[1])).join(" ") + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  const rect = (x, y, w, h, c, rx) => '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="' + (rx == null ? 2 : rx) + '" fill="' + c + '"/>';

  // Small props drawn from the figure's joints
  function dumbbell(h, vertical) {
    return vertical ? rect(h[0] - 1.2, h[1] - 6, 2.4, 12, COL.ink, 1) + rect(h[0] - 3, h[1] - 7.5, 6, 3, COL.ink, 1) + rect(h[0] - 3, h[1] + 4.5, 6, 3, COL.ink, 1)
      : rect(h[0] - 6, h[1] - 1.2, 12, 2.4, COL.ink, 1) + rect(h[0] - 7.5, h[1] - 3, 3, 6, COL.ink, 1) + rect(h[0] + 4.5, h[1] - 3, 3, 6, COL.ink, 1);
  }
  const hand = (j, far) => j.arms[far ? 1 : 0][2];
  const foot = (j, far) => j.legs[far ? 1 : 0][2];
  const lowFoot = (j) => Math.max(foot(j)[1], foot(j, 1)[1]);
  const PROPS = {
    // seat under the hips (chair with a back, bench or box)
    chair: (j) => { const x = j.hip[0] - 8, y = j.hip[1] + 3.5, g = 90; return rect(x, y, 16, 3, COL.prop2) + rect(x - 1, y - 20, 3, 23, COL.prop2) + rect(x, y + 3, 2.5, g - y - 3, COL.prop2, 1) + rect(x + 13, y + 3, 2.5, g - y - 3, COL.prop2, 1); },
    seatBehind: (j, o) => { const f = foot(j), y = o.y, x = f[0] - (o.back || 24); return o.box ? rect(x, y, 20, 90 - y, COL.prop2, 3) : rect(x - 4, y, 26, 3.5, COL.prop2) + rect(x - 2, y + 3.5, 2.5, 90 - y - 3.5, COL.prop2, 1) + rect(x + 17, y + 3.5, 2.5, 90 - y - 3.5, COL.prop2, 1); },
    chairBehind: (j, o) => { const f = foot(j), y = o.y, x = f[0] - (o.back || 24); return rect(x - 2, y, 18, 3, COL.prop2) + rect(x - 3, y - 20, 3, 23, COL.prop2) + rect(x - 1, y + 3, 2.5, 90 - y - 3, COL.prop2, 1) + rect(x + 13, y + 3, 2.5, 90 - y - 3, COL.prop2, 1); },
    benchUnder: (j) => { const y = j.hip[1] + 3.5, x0 = j.head[0] - 4, x1 = j.hip[0] + 8; return rect(x0, y, x1 - x0, 3.5, COL.prop2) + rect(x0 + 3, y + 3.5, 2.5, 90 - y - 3.5, COL.prop2, 1) + rect(x1 - 6, y + 3.5, 2.5, 90 - y - 3.5, COL.prop2, 1); },
    // surface under the hands (counter, bench, chair seat)
    counterAtHand: (j, o) => { const h = hand(j, o && o.far); return rect(h[0] - 6, h[1] + 2, 22, 90 - h[1] - 2, COL.prop2, 2); },
    benchAtHand: (j, o) => { const h = hand(j, o && o.far), w = (o && o.w) || 26, x = o && o.behind ? h[0] - w + 6 : h[0] - 6; return rect(x, h[1] + 2, w, 3.5, COL.prop2) + rect(x + 2, h[1] + 5.5, 2.5, 90 - h[1] - 5.5, COL.prop2, 1) + rect(x + w - 5, h[1] + 5.5, 2.5, 90 - h[1] - 5.5, COL.prop2, 1); },
    wallAtHand: (j) => { const h = hand(j); return rect(h[0] + 2, 10, 5, 80, COL.prop2, 1); },
    wallBehind: (j) => { const x = Math.min(j.sh[0], j.hip[0]) - 9; return rect(x, 10, 5, 80, COL.prop2, 1); },
    barAtHand: (j) => { const h = hand(j); return rect(h[0] - 14, h[1] - 1.5, 30, 3, COL.ink, 1.5) + rect(h[0] - 14, h[1], 3, 90 - h[1], COL.prop2, 1); },
    mat: () => rect(14, 88, 92, 3, COL.prop, 1.5),
    hill: (j) => { const f = foot(j, 1), k = -0.3, y0 = f[1] + 1.5 - k * f[0]; return '<polygon points="0,' + r1(y0) + " 120," + r1(y0 + k * 120) + ' 120,100 0,100" fill="' + COL.prop2 + '"/>'; },
    cable: (j, o) => rect(o.x, 34, 6, 56, COL.prop2, 1) + line([[o.x, o.y], hand(j)], COL.ink, 1),
    pulldown: (j) => { const h = j.arms[0][2]; return rect(h[0] - 18, h[1] - 1.5, 36, 3, COL.ink, 1.5) + line([[60, h[1]], [60, 2]], COL.ink, 1); },
    band: (j) => line([j.arms[0][2], j.arms[1][2]], COL.prop, 3),
    pack: (j) => { const h = hand(j); return rect(h[0] - 5, h[1], 10, 12, COL.prop, 3); },
    db: (j) => dumbbell(hand(j)) + (j.front ? dumbbell(hand(j, 1)) : ""),
    dbV: (j) => dumbbell(hand(j), true) + (j.front ? dumbbell(hand(j, 1), true) : ""),
    goblet: (j) => { const h = hand(j); return dumbbell([h[0] + 1, h[1] - 2], true); },
    barbell: (j) => { const h = hand(j); return rect(h[0] - 3, h[1] - 5, 6, 10, COL.ink, 2); },
    stepAtFoot: (j, o) => { const f = o && o.under ? [ (foot(j)[0] + foot(j, 1)[0]) / 2, lowFoot(j)] : foot(j); const w = (o && o.w) || 24; return rect(f[0] - w / 2 + 2, f[1] + 1.5, w, 90 - f[1] - 1.5, COL.prop2, 2); },
    line: () => '<line x1="12" y1="91.5" x2="108" y2="91.5" stroke="' + COL.prop + '" stroke-width="2" stroke-dasharray="4 3"/>'
  };

  function figure(j, opt) {
    let s = "";
    const far = (pts) => line(pts, COL.far, 4.2);
    const near = (pts) => line(pts, COL.body, 4.6);
    if (j.front) {
      s += near([j.legs[0][0], j.legs[0][1], j.legs[0][2], j.feet[0]]) + near([j.legs[1][0], j.legs[1][1], j.legs[1][2], j.feet[1]]);
      s += '<polygon points="' + [j.shL, j.shR, j.hipR, j.hipL].map(q => r1(q[0]) + "," + r1(q[1])).join(" ") + '" fill="' + COL.body + '" stroke="' + COL.body + '" stroke-width="4" stroke-linejoin="round"/>';
      s += near(j.arms[0]) + near(j.arms[1]);
    } else {
      s += far([j.legs[1][0], j.legs[1][1], j.legs[1][2], j.feet[1]]) + far(j.arms[1]);
      s += line([j.hip, j.sh], COL.body, 5.5);
      s += near([j.legs[0][0], j.legs[0][1], j.legs[0][2], j.feet[0]]);
      s += near(j.arms[0]);
    }
    s += '<circle cx="' + r1(j.head[0]) + '" cy="' + r1(j.head[1]) + '" r="' + L.head + '" fill="' + COL.body + '"/>';
    return s;
  }

  function panel(p, x) {
    const j = place(p.front ? front(p) : side(p), p);
    const back = (p.props || []).filter(q => !/^(db|dbV|goblet|barbell|band|pack|pulldown|cable|barAtHand)$/.test(q.k || q)).map(q => PROPS[q.k || q](j, q)).join("");
    const fore = (p.props || []).filter(q => /^(db|dbV|goblet|barbell|band|pack|pulldown|cable|barAtHand)$/.test(q.k || q)).map(q => PROPS[q.k || q](j, q)).join("");
    return '<g transform="translate(' + x + ',0)"><line x1="6" y1="90.5" x2="114" y2="90.5" stroke="' + COL.ground + '" stroke-width="2" stroke-linecap="round"/>' + back + figure(j) + fore + "</g>";
  }

  // ---- Pose library ----
  const SEATED = [[88, 0], [86, 0]];
  const STAND = [[2, 0], [-2, 0]];
  const POSES = {
    "Bodyweight squat": [{ t: 4, a: [[90, 90], [86, 86]], l: STAND }, { t: 40, a: [[88, 88], [84, 84]], l: [[82, -20], [78, -22]] }],
    "Goblet squat": [{ t: 4, a: [[20, 175], [16, 170]], l: STAND, props: ["goblet"] }, { t: 36, a: [[45, 185], [40, 180]], l: [[82, -20], [78, -22]], props: ["goblet"] }],
    "Bench squat": [{ t: 2, a: [[90, 90], [86, 86]], l: STAND, props: [{ k: "seatBehind", y: 70, back: 26 }] }, { t: 30, a: [[90, 90], [86, 86]], l: [[86, -10], [84, -12]], props: [{ k: "seatBehind", y: 70, back: 26 }] }],
    "Box squat": [{ t: 2, a: [[90, 90], [86, 86]], l: STAND, props: [{ k: "seatBehind", y: 70, back: 24, box: true }] }, { t: 30, a: [[90, 90], [86, 86]], l: [[86, -10], [84, -12]], props: [{ k: "seatBehind", y: 70, back: 24, box: true }] }],
    "Sit to stand": [{ t: 10, a: [[50, 80], [44, 76]], l: SEATED, props: ["chair"] }, { t: 2, a: [[14, 14], [10, 10]], l: STAND, props: [{ k: "chairBehind", y: 70, back: 22 }] }],
    "Bench sit to stand": [{ t: 10, a: [[50, 80], [44, 76]], l: SEATED, props: [{ k: "seatBehind", y: 70, back: 23 }] }, { t: 2, a: [[14, 14], [10, 10]], l: STAND, props: [{ k: "seatBehind", y: 70, back: 23 }] }],

    "Glute bridge": [{ t: -90, a: [[100, 90], [100, 90]], l: [[140, 10], [138, 10]], ground: "body", props: ["mat"] }, { t: -122, neck: 32, a: [[90, 90], [90, 90]], l: [[105, -5], [103, -5]], ground: "body", props: ["mat"] }],
    "Single-leg glute bridge": [{ t: -90, a: [[100, 90], [100, 90]], l: [[140, 10], [125, 125]], ground: "body", props: ["mat"] }, { t: -122, neck: 32, a: [[90, 90], [90, 90]], l: [[105, -5], [122, 122]], ground: "body", props: ["mat"] }],
    "Dumbbell Romanian deadlift": [{ t: 0, a: [[0, 0], [-2, -2]], l: STAND, props: ["dbV"] }, { t: 72, neck: -12, a: [[2, 2], [-2, -2]], l: [[16, 0], [14, 0]], props: ["dbV"] }],
    "Romanian deadlift": [{ t: 0, a: [[0, 0], [-2, -2]], l: STAND, props: ["barbell"] }, { t: 72, neck: -12, a: [[2, 2], [-2, -2]], l: [[16, 0], [14, 0]], props: ["barbell"] }],

    "Split squat": [{ t: 0, a: [[0, 0], [0, 0]], l: [[22, 0], [-26, -6]], f: [90, 150] }, { t: 2, a: [[0, 0], [0, 0]], l: [[82, 0], [-8, -82]], f: [90, 150] }],
    "Dumbbell reverse lunge": [{ t: 0, a: [[0, 0], [0, 0]], l: STAND, props: ["dbV"] }, { t: 4, a: [[2, 2], [0, 0]], l: [[82, 0], [-8, -82]], f: [90, 150], props: ["dbV"] }],
    "Walking lunges": [{ t: 0, a: [[-20, -10], [20, 30]], l: [[22, 0], [-26, -6]], f: [90, 150] }, { t: 2, a: [[20, 40], [-20, -10]], l: [[82, 0], [-8, -82]], f: [90, 150], dx: 8 }],

    "Incline push-up": [{ t: 35, a: [[55, 55], [53, 53]], l: [[-35, -35], [-35, -35]], f: [150, 150], props: ["counterAtHand"] }, { t: 45, a: [[-10, 120], [-12, 118]], l: [[-45, -45], [-45, -45]], f: [150, 150], props: ["counterAtHand"] }],
    "Bench push-up": [{ t: 55, a: [[35, 35], [33, 33]], l: [[-55, -55], [-55, -55]], f: [160, 160], props: [{ k: "benchAtHand", w: 24 }] }, { t: 62, a: [[-30, 100], [-32, 98]], l: [[-62, -62], [-62, -62]], f: [160, 160], props: [{ k: "benchAtHand", w: 24 }] }],
    "Wall push-up": [{ t: 20, a: [[88, 88], [86, 86]], l: [[-20, -20], [-20, -20]], f: [120, 120], props: ["wallAtHand"] }, { t: 30, a: [[20, 140], [18, 138]], l: [[-30, -30], [-30, -30]], f: [120, 120], props: ["wallAtHand"] }],
    "Pike push-up": [{ t: 140, a: [[8, 8], [6, 6]], l: [[-40, -40], [-40, -40]], f: [140, 140], ground: "body" }, { t: 128, a: [[-55, 30], [-57, 28]], l: [[-40, -40], [-40, -40]], f: [140, 140], ground: "body" }],
    "Dumbbell floor press": [{ t: -90, a: [[110, 180], [110, 180]], l: [[140, 10], [138, 10]], ground: "body", props: ["mat", "db"] }, { t: -90, a: [[180, 180], [180, 180]], l: [[140, 10], [138, 10]], ground: "body", props: ["mat", "db"] }],
    "Dumbbell bench press": [{ t: -90, a: [[110, 180], [110, 180]], l: [[90, 0], [90, 0]], props: ["benchUnder", "db"] }, { t: -90, a: [[180, 180], [180, 180]], l: [[90, 0], [90, 0]], props: ["benchUnder", "db"] }],
    "Seated shoulder press": [{ t: 0, a: [[40, 180], [36, 176]], l: SEATED, props: ["chair", "dbV"] }, { t: 0, a: [[176, 180], [172, 176]], l: SEATED, props: ["chair", "dbV"] }],
    "Chest press machine": [{ t: -4, a: [[-30, 90], [-32, 88]], l: SEATED, props: ["chair"] }, { t: -4, a: [[88, 90], [86, 88]], l: SEATED, props: ["chair"] }],
    "Bench dips": [{ t: -4, a: [[-12, -12], [-14, -14]], l: [[80, 12], [80, 12]], pin: { x: 40, y: 62 }, props: [{ k: "benchAtHand", behind: true, w: 28 }] }, { t: -4, a: [[-75, 5], [-77, 3]], l: [[60, 30], [60, 30]], pin: { x: 40, y: 62 }, props: [{ k: "benchAtHand", behind: true, w: 28 }] }],

    "Backpack row": [{ t: 65, neck: -10, a: [[0, 0], [8, 8]], l: [[14, 0], [12, 0]], props: ["pack"] }, { t: 65, neck: -10, a: [[-88, 0], [8, 8]], l: [[14, 0], [12, 0]], props: ["pack"] }],
    "One-arm dumbbell row": [{ t: 72, neck: -10, a: [[0, 0], [4, 4]], l: [[16, 0], [-10, 0]], props: [{ k: "benchAtHand", far: true, w: 22 }, "dbV"] }, { t: 72, neck: -10, a: [[-88, 0], [4, 4]], l: [[16, 0], [-10, 0]], props: [{ k: "benchAtHand", far: true, w: 22 }, "dbV"] }],
    "Seated cable row": [{ t: 12, a: [[86, 86], [84, 84]], l: [[84, 100], [82, 98]], ground: "body", props: [{ k: "cable", x: 108, y: 72 }] }, { t: -6, a: [[-35, 88], [-37, 86]], l: [[84, 100], [82, 98]], ground: "body", props: [{ k: "cable", x: 108, y: 72 }] }],
    "Inverted row": [{ t: -62, neck: 0, a: [[180, 180], [180, 180]], l: [[62, 62], [62, 62]], f: [150, 150], pin: { x: 38, y: 34 }, props: ["barAtHand"] }, { t: -50, neck: 0, a: [[35, 185], [33, 183]], l: [[50, 50], [50, 50]], f: [140, 140], pin: { x: 38, y: 34 }, props: ["barAtHand"] }],
    "Superman hold": [{ t: 90, a: [[90, 90], [90, 90]], l: [[-90, -90], [-90, -90]], f: [180, 180], ground: "body", props: ["mat"] }, { t: 80, neck: -6, a: [[105, 105], [105, 105]], l: [[-78, -78], [-78, -78]], f: [170, 170], ground: "body", props: ["mat"] }],
    "Dumbbell reverse fly": [{ front: true, a: [[2, 2], [2, 2]], l: [[4, 4], [4, 4]], props: ["db"] }, { front: true, a: [[88, 88], [88, 88]], l: [[4, 4], [4, 4]], props: ["db"] }],
    "Lat pulldown": [{ front: true, a: [[160, 175], [160, 175]], l: [[80, 0], [80, 0]], props: ["pulldown"] }, { front: true, a: [[60, 175], [60, 175]], l: [[80, 0], [80, 0]], props: ["pulldown"] }],
    "Band pull-apart": [{ front: true, a: [[40, -60], [40, -60]], props: ["band"] }, { front: true, a: [[92, 92], [92, 92]], props: ["band"] }],

    "Dead bug": [{ t: -90, a: [[180, 180], [180, 180]], l: [[180, 90], [180, 90]], f: [180, 180], ground: "body", props: ["mat"] }, { t: -90, a: [[180, 180], [-92, -92]], l: [[92, 92], [180, 90]], f: [90, 180], ground: "body", props: ["mat"] }],
    "Plank": [{ t: 76, a: [[0, 90], [0, 90]], l: [[-76, -76], [-76, -76]], f: [170, 170], ground: "body", props: ["mat"] }],
    "Bird dog": [{ t: 90, a: [[0, 0], [0, 0]], l: [[0, -90], [0, -90]], f: [0, 0], ground: "body", props: ["mat"] }, { t: 90, a: [[0, 0], [90, 90]], l: [[-90, -90], [0, -90]], f: [-90, 0], ground: "body", props: ["mat"] }],

    "Wall sit": [{ t: 0, a: [[0, 0], [0, 0]], l: SEATED, props: ["wallBehind"] }],
    "Farmer carry": [{ t: 0, a: [[-6, -6], [6, 6]], l: [[18, 0], [-14, -10]], f: [90, 110], props: ["dbV"] }, { t: 0, a: [[6, 6], [-6, -6]], l: [[-14, -10], [18, 0]], f: [110, 90], dx: 8, props: ["dbV"] }],
    "Hill walk": [{ t: 14, a: [[-25, -5], [25, 55]], l: [[34, -4], [-12, -16]], f: [72, 100], props: ["hill"] }, { t: 14, a: [[25, 55], [-25, -5]], l: [[-12, -16], [34, -4]], f: [100, 72], props: ["hill"] }],
    "Single-leg stand": [{ t: 0, a: [[40, 70], [0, 0]], l: STAND, props: ["counterAtHand"] }, { t: 0, a: [[40, 70], [0, 0]], l: [[2, 0], [70, -10]], f: [90, 90], props: ["counterAtHand"] }],
    "Heel-to-toe walk": [{ t: 0, a: [[50, 50], [-40, -40]], l: [[6, 0], [-6, 0]], props: ["line"] }, { t: 0, a: [[50, 50], [-40, -40]], l: [[-6, 0], [6, 0]], dx: 8, props: ["line"] }],
    "Step-up": [{ t: 8, a: [[0, 0], [0, 0]], l: [[64, 0], [-4, 0]], props: ["stepAtFoot"] }, { t: 2, a: [[0, 0], [0, 0]], l: STAND, dy: -11, props: [{ k: "stepAtFoot", under: true, w: 30 }] }],
    "Curb step-up": [{ t: 8, a: [[0, 0], [0, 0]], l: [[64, 0], [-4, 0]], props: ["stepAtFoot"] }, { t: 2, a: [[0, 0], [0, 0]], l: STAND, dy: -11, props: [{ k: "stepAtFoot", under: true, w: 30 }] }]
  };

  const STATIC = { "Plank": 1, "Wall sit": 1 };

  // Returns an SVG string for an exercise, or "" if there's no drawing for it.
  window.BBF_FIGURE = function (name) {
    const poses = POSES[name];
    if (!poses) return "";
    const lbl = (x, t) => '<text x="' + x + '" y="98" text-anchor="middle" font-size="7" font-weight="800" fill="#5E676E" font-family="Nunito,system-ui,sans-serif" letter-spacing=".08em">' + t + "</text>";
    if (poses.length === 1) {
      return '<svg class="fig" viewBox="0 0 250 100" role="img" aria-label="How to do ' + name + ': hold this position">' + panel(poses[0], 65) + lbl(125, "HOLD") + "</svg>";
    }
    const arrow = '<g transform="translate(125,50)"><circle r="9" fill="#FBF0EC"/><path d="M-4 0h7m-3-3.5 3.5 3.5-3.5 3.5" fill="none" stroke="#C4553E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>';
    return '<svg class="fig" viewBox="0 0 250 100" role="img" aria-label="How to do ' + name + ': start and finish positions">' + panel(poses[0], 0) + panel(poses[1], 130) + arrow + lbl(60, "START") + lbl(190, STATIC[name] ? "HOLD" : "FINISH") + "</svg>";
  };
  window.BBF_FIGURE_NAMES = Object.keys(POSES);
})();
