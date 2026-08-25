// ============================================================
// Track Requirements — "what's required vs optional"
// ============================================================
//
// Group types
//   all    : every course listed is required
//   choose : pick `count` from `courses` (or from a `match` rule)
//   anyOf  : pick ONE of several alternative paths (e.g. MATH vs BAAS)
//
// ============================================================

const CORE_39 = [
  "CORE-FYS1","CORE-FYS2","CORE-ENGL","CORE-HIST","CORE-REL","CORE-PHIL",
  "CORE-CREA","CORE-SOCSCI","CORE-SCI","CORE-FDIV","CORE-FHERTG",
  "CORE-FNAT","CORE-FSOCJUS",
];

// The MATH-vs-BAAS fork, shared by every track.
const MATH_SEQUENCE_GROUP = {
  id: "math-seq",
  label: "Math Sequence",
  note: "choose ONE path",
  type: "anyOf",
  options: [
    { id: "calc", label: "Calculus path", courses: ["MATH-110","MATH-120"] },
    { id: "baas", label: "BAAS path",     courses: ["BAAS-130","BAAS-140","BAAS-200"] },
  ],
};

const AUX_TAIL_GROUP = {
  id: "aux-stats",
  label: "Applied Statistics",
  note: "choose ONE",
  type: "anyOf",
  options: [
    { id: "baas210", label: "BAAS-210", courses: ["BAAS-210"] },
    { id: "math275", label: "MATH-275", courses: ["MATH-275"] },
  ],
};

const coreGroup = () => ({
  id: "core", label: "Core (Gen-Ed)", note: "39 hrs", type: "all", courses: [...CORE_39],
});

const electiveGroup = (count, label) => ({
  id: "cs-electives",
  label: label || "CSIS-300+ Electives",
  note: `choose ${count}`,
  type: "choose",
  count,
  match: { prefix: "CSIS", min: 300 },
  alsoAllow: ["SCDV-480"],
});

const TRACK_REQUIREMENTS = {
  // ── Authored from the 2024 advising sheet ───────────────
  SD: {
    name: "Software Development Track",
    source: "advising sheet 2024",
    groups: [
      coreGroup(),
      { id: "cs-req", label: "Computer Science", note: "34+ hrs", type: "all",
        courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-225","CSIS-385","CSIS-411",
                  "CSIS-350","CSIS-390","CSIS-410","CSIS-415"] },
      electiveGroup(3),
      MATH_SEQUENCE_GROUP,
      { id: "aux", label: "Auxiliary", note: "15–17 hrs", type: "all",
        courses: ["CSIS-011","MATH-250"] },
      AUX_TAIL_GROUP,
    ],
  },

  FD: {
    name: "Foundations Track",
    source: "advising sheet 2024",
    groups: [
      coreGroup(),
      { id: "cs-req", label: "Computer Science", note: "34+ hrs", type: "all",
        courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-220","CSIS-225","CSIS-385","CSIS-411"] },
      electiveGroup(4),
      MATH_SEQUENCE_GROUP,
      { id: "aux", label: "Auxiliary", note: "15–17 hrs", type: "all",
        courses: ["CSIS-011","MATH-250","MATH-350"] },
    ],
  },

  // ── Derived from the offerings spreadsheet track tags ───
  // Flagged `draft` so the panel tells the advisor to verify.
  GD: { name: "Game Development Track", draft: true, groups: [
    coreGroup(),
    { id: "cs-req", label: "Computer Science", type: "all",
      courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-225","CSIS-385","CSIS-411","CSIS-350"] },
    { id: "track-req", label: "Game Development Requirements", note: "choose 3", type: "choose", count: 3,
      courses: ["CSIS-380","CSIS-345","CSIS-320","CSIS-375","CSIS-335","CSIS-330","CSIS-365"] },
    electiveGroup(1),
    MATH_SEQUENCE_GROUP,
    { id: "aux", label: "Auxiliary", type: "all", courses: ["CSIS-011","MATH-250"] },
    AUX_TAIL_GROUP,
  ]},

  AI: { name: "Artificial Intelligence Track", draft: true, groups: [
    coreGroup(),
    { id: "cs-req", label: "Computer Science", type: "all",
      courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-225","CSIS-385","CSIS-411"] },
    { id: "track-req", label: "AI Requirements", note: "choose 3", type: "choose", count: 3,
      courses: ["CSIS-375","CSIS-320","CSIS-371","CSIS-370"] },
    electiveGroup(2),
    MATH_SEQUENCE_GROUP,
    { id: "aux", label: "Auxiliary", type: "all", courses: ["CSIS-011","MATH-250"] },
    AUX_TAIL_GROUP,
  ]},

  CY: { name: "Cyber Track", draft: true, groups: [
    coreGroup(),
    { id: "cs-req", label: "Computer Science", type: "all",
      courses: ["CSIS-110","CSIS-120","CSIS-205","CSIS-210","CSIS-220","CSIS-225","CSIS-385","CSIS-411","CSIS-350"] },
    { id: "track-req", label: "Cyber Requirements", note: "choose 3", type: "choose", count: 3,
      courses: ["CSIS-306","CSIS-400","CSIS-330","CSIS-365"] },
    MATH_SEQUENCE_GROUP,
    { id: "aux", label: "Auxiliary", type: "all", courses: ["CSIS-011","MATH-250"] },
    AUX_TAIL_GROUP,
  ]},

  IS: { name: "Information Systems Track", draft: true, groups: [
    coreGroup(),
    { id: "cs-req", label: "Computer Science", type: "all",
      courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-225","CSIS-385","CSIS-411","CSIS-350","CSIS-390","CSIS-410","CSIS-415"] },
    { id: "track-req", label: "IS Requirements", note: "choose 2", type: "choose", count: 2,
      courses: ["CSIS-355","CSIS-368","CSIS-331","CSIS-365","CSIS-306"] },
    MATH_SEQUENCE_GROUP,
    { id: "aux", label: "Auxiliary", type: "all", courses: ["CSIS-011","MATH-250"] },
    AUX_TAIL_GROUP,
  ]},

  EN: { name: "Entrepreneurial Track", draft: true, groups: [
    coreGroup(),
    { id: "cs-req", label: "Computer Science", type: "all",
      courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-225","CSIS-385","CSIS-411","CSIS-350","CSIS-390","CSIS-410","CSIS-415"] },
    { id: "track-req", label: "Entrepreneurial Requirements", note: "choose 1", type: "choose", count: 1,
      courses: ["CSIS-331"] },
    electiveGroup(2),
    MATH_SEQUENCE_GROUP,
    { id: "aux", label: "Auxiliary", type: "all", courses: ["CSIS-011","MATH-250"] },
    AUX_TAIL_GROUP,
  ]},

  ED: { name: "CS Education Track", draft: true, groups: [
    coreGroup(),
    { id: "cs-req", label: "Computer Science", type: "all",
      courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-220","CSIS-225","CSIS-385","CSIS-411","CSIS-390"] },
    { id: "track-req", label: "CS Education Requirements", note: "choose 2", type: "choose", count: 2,
      courses: ["CSIS-365","CSIS-306"] },
    electiveGroup(1),
    MATH_SEQUENCE_GROUP,
    { id: "aux", label: "Auxiliary", type: "all", courses: ["CSIS-011","MATH-250","MATH-351"] },
  ]},

  ADS: { name: "Applied Data Science", draft: true, groups: [
    coreGroup(),
    { id: "cs-req", label: "Computer Science", type: "all",
      courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-350","CSIS-320"] },
    electiveGroup(2),
    MATH_SEQUENCE_GROUP,
    { id: "aux", label: "Auxiliary", type: "all", courses: ["CSIS-011","MATH-250"] },
    AUX_TAIL_GROUP,
  ]},

  PDS: { name: "Pure Data Science", draft: true, groups: [
    coreGroup(),
    { id: "cs-req", label: "Computer Science", type: "all",
      courses: ["CSIS-110","CSIS-120","CSIS-210","CSIS-350","CSIS-355","CSIS-320"] },
    electiveGroup(2),
    MATH_SEQUENCE_GROUP,
    { id: "aux", label: "Auxiliary", type: "all", courses: ["CSIS-011","MATH-250","MATH-275"] },
  ]},
};

// ── Resolve a group's candidate course list ─────────────────
function resolveGroupCourses(group, catalog) {
  if (group.type === "anyOf") {
    return group.options.flatMap(o => o.courses);
  }
  let ids = group.courses ? [...group.courses] : [];
  if (group.match) {
    const { prefix, min } = group.match;
    ids = ids.concat(
      Object.keys(catalog).filter(id => {
        if (prefix && !id.startsWith(prefix)) return false;
        const n = courseNumber(id);
        return !isNaN(n) && (min == null || n >= min);
      })
    );
  }
  if (group.alsoAllow) ids = ids.concat(group.alsoAllow);
  return [...new Set(ids)].filter(id => catalog[id]);
}

// ── Evaluate a plan against a track's requirements ──────────
function evaluateRequirements(trackCode, plan, catalog) {
  const req = TRACK_REQUIREMENTS[trackCode];
  if (!req) return null;

  const placed = new Set();
  Object.values(plan).forEach(ids => ids.forEach(id => placed.add(id)));

  // A course satisfies the FIRST group that claims it. Without this, courses
  // named in the CS core (CSIS-350, CSIS-410, …) would also be counted as
  // "CSIS-300+ electives", inflating that group.
  const claimed = new Set();

  const groups = req.groups.map(group => {
    if (group.type === "anyOf") {
      const options = group.options.map(opt => {
        const done = opt.courses.filter(c => placed.has(c));
        return { ...opt, placedCount: done.length, total: opt.courses.length,
                 satisfied: done.length === opt.courses.length,
                 items: opt.courses.map(c => ({ id: c, placed: placed.has(c) })) };
      });
      const best = options.reduce((a, b) => (b.placedCount > a.placedCount ? b : a), options[0]);
      const engaged = best.placedCount > 0;
      group.options.forEach(o => o.courses.forEach(c => claimed.add(c)));
      return { ...group, options: options.map(o => ({ ...o, active: !engaged || o.id === best.id })),
               satisfied: options.some(o => o.satisfied),
               progress: `${best.placedCount}/${best.total}` };
    }

    if (group.type === "choose") {
      const candidates = resolveGroupCourses(group, catalog).filter(c => !claimed.has(c));
      const chosen = candidates.filter(c => placed.has(c));
      chosen.forEach(c => claimed.add(c));
      return { ...group, candidates, chosen,
               satisfied: chosen.length >= group.count,
               progress: `${Math.min(chosen.length, group.count)}/${group.count}` };
    }

    // type: all
    const items = (group.courses || []).map(c => ({ id: c, placed: placed.has(c) }));
    items.forEach(i => claimed.add(i.id));
    const done = items.filter(i => i.placed).length;
    return { ...group, items, satisfied: done === items.length,
             progress: `${done}/${items.length}` };
  });

  const credits = [...placed].reduce((n, id) => n + (catalog[id]?.credits || 0), 0);
  return { trackCode, name: req.name, draft: !!req.draft, groups, credits,
           satisfied: groups.every(g => g.satisfied) };
}

// Every course id this track cares about — used to grey out the rest of the bank.
function requiredCourseIds(trackCode, catalog) {
  const req = TRACK_REQUIREMENTS[trackCode];
  if (!req) return null;
  const s = new Set();
  req.groups.forEach(g => resolveGroupCourses(g, catalog).forEach(id => s.add(id)));
  return s;
}

// ── Auto-build a suggested plan ─────────────────────────────
// Walks semesters in order, placing a course only when every prerequisite
// was scheduled in a STRICTLY EARLIER term and the course is actually
// offered that term. Free electives are added last, into whichever
// semesters are lightest, so the load stays even.
function buildSuggestedPlan(trackCode, semesters, catalog, deps, capPerSem = 16) {
  const req = TRACK_REQUIREMENTS[trackCode];
  if (!req) return null;

  const prereqList = id => (catalog[id]?.prerequisites || []).filter(p => catalog[p]);

  // 1. Target course list. Fixed groups first, so that optional choices can be
  //    made against a base that already exists.
  const wanted = [];
  req.groups.filter(g => g.type !== "anyOf" && g.type !== "choose")
    .forEach(g => wanted.push(...(g.courses || [])));

  // How many of this course's prerequisites are NOT yet in the plan?
  const unmet = (id, base) => prereqList(id).filter(p => !base.has(p)).length;

  // Optional groups: prefer whatever is actually reachable given what's
  // already selected — otherwise we schedule a course whose prerequisite
  // is never taken (e.g. BAAS-210 without the BAAS sequence).
  req.groups.forEach(group => {
    const base = new Set(wanted);
    if (group.type === "anyOf") {
      const best = group.options
        .map(o => {
          const withOpt = new Set([...base, ...o.courses]);
          return { o, cost: o.courses.reduce((n, c) => n + unmet(c, withOpt), 0) };
        })
        .sort((a, b) => a.cost - b.cost)[0];
      wanted.push(...best.o.courses);
    } else if (group.type === "choose") {
      const pool = resolveGroupCourses(group, catalog)
        .filter(id => !wanted.includes(id) && catalog[id].category !== "free")
        .sort((a, b) =>
          unmet(a, base) - unmet(b, base) || courseNumber(a) - courseNumber(b));
      wanted.push(...pool.slice(0, group.count));
    }
  });

  // 2. Close over prerequisites, so nothing is scheduled with a missing one.
  const required = new Set(wanted.filter(id => catalog[id]));
  let grew = true;
  while (grew) {
    grew = false;
    [...required].forEach(id => prereqList(id).forEach(p => {
      if (!required.has(p)) { required.add(p); grew = true; }
    }));
  }

  const prereqsOf = id => prereqList(id).filter(p => required.has(p));

  // 3. Order by how much each course unlocks: long prerequisite chains go
  //    first, so CSIS-110 claims an early slot instead of losing every seat
  //    to gen-eds. Capstones (4xx with nothing downstream) are held back.
  const depthMemo = new Map();
  const depth = id => {
    if (depthMemo.has(id)) return depthMemo.get(id);
    depthMemo.set(id, 0);                                  // cycle guard
    const kids = [...required].filter(c => prereqsOf(c).includes(id));
    const d = kids.length ? 1 + Math.max(...kids.map(depth)) : 0;
    depthMemo.set(id, d);
    return d;
  };
  const isCapstone = id => depth(id) === 0 && courseNumber(id) >= 400;
  const order = [...required].sort((a, b) =>
    depth(b) - depth(a) ||
    (courseNumber(a) || 0) - (courseNumber(b) || 0));

  const plan = {};
  const credits = {};
  semesters.forEach(s => { plan[s.id] = []; credits[s.id] = 0; });

  // 4. Schedule.
  const scheduled = new Set();
  let remaining = [...order];
  const lastTwo = semesters.slice(-2).map(s => s.id);

  semesters.forEach((sem, semIdx) => {
    // Snapshot: a prerequisite placed *this* term does not unlock its
    // dependent in the same term.
    const satisfiedBefore = new Set(scheduled);
    const isFinalYear = lastTwo.includes(sem.id);
    let progress = true;
    while (progress) {
      progress = false;
      for (const id of [...remaining]) {
        const c = catalog[id];
        const cr = c.credits || 0;
        if (credits[sem.id] + cr > capPerSem) continue;
        if (!isOffered(c, sem)) continue;
        if (!prereqsOf(id).every(p => satisfiedBefore.has(p))) continue;
        // Hold capstones for the final year unless we're running out of room.
        if (isCapstone(id) && !isFinalYear && semIdx < semesters.length - 2) continue;
        plan[sem.id].push(id);
        scheduled.add(id);
        remaining = remaining.filter(r => r !== id);
        credits[sem.id] += cr;
        progress = true;
      }
    }
  });

  // 3. Top up toward 120 credits with free electives, always filling
  //    the lightest semester first so the load comes out even.
  const TARGET = 120;
  let total = Object.values(credits).reduce((a, b) => a + b, 0);
  const frees = Object.keys(catalog)
    .filter(id => catalog[id].category === "free" && !scheduled.has(id));

  for (const id of frees) {
    if (total >= TARGET) break;
    const cr = catalog[id].credits || 0;
    const lightest = semesters
      .filter(s => credits[s.id] + cr <= capPerSem)
      .sort((a, b) => credits[a.id] - credits[b.id])[0];
    if (!lightest) break;
    plan[lightest.id].push(id);
    credits[lightest.id] += cr;
    total += cr;
  }

  return { plan, unplaced: remaining, credits: total };
}
