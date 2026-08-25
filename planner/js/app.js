// ============================================================
// Course Planning App — Main Logic
// ============================================================

const AppState = {
  courses: {},
  dependencies: [],
  plan: {},          // semesterId -> [courseId, ...]
  semesters: [],
  startYear: 2024,
  endYear: 2027,     // 8 semesters: Fall 2024 – Spring 2028
  trackFilter: "",
  searchQuery: "",
  showOther: false,
};
window.AppState = AppState;

const CREDIT_WARN = 18;

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  AppState.courses      = JSON.parse(JSON.stringify(DEFAULT_COURSES));
  AppState.dependencies = JSON.parse(JSON.stringify(DEFAULT_DEPENDENCIES));
  AppState.semesters    = generateSemesters(AppState.startYear, AppState.endYear);
  AppState.semesters.forEach(s => { AppState.plan[s.id] = []; });

  // Each step is guarded: a CDN that fails to load (blocked campus network,
  // CDN outage) must degrade one feature, not brick the whole planner.
  const step = (label, fn) => {
    try { fn(); return true; }
    catch (err) { console.error(`[planner] ${label} failed:`, err); return false; }
  };

  step("track dropdown", buildTrackDropdown);
  step("initial render", renderAll);
  const dragOk = step("drag & drop", initDragDrop);
  step("toolbar", initToolbar);
  step("focus interactions", initFocusInteractions);

  const missing = [];
  if (typeof interact === "undefined")   missing.push("interact.js (drag & drop)");
  if (typeof LeaderLine === "undefined") missing.push("leader-line (dependency arrows)");
  if (typeof bootstrap === "undefined")  missing.push("Bootstrap (dialogs)");
  if (missing.length || !dragOk) showLibraryWarning(missing);
});

function showLibraryWarning(missing) {
  const bar = document.createElement("div");
  bar.className = "lib-warning";
  bar.innerHTML = `<b>Some features are unavailable.</b>
    These libraries did not load: ${missing.join(", ") || "one or more dependencies"}.
    Check your network connection, then reload.`;
  document.body.prepend(bar);
}

function buildTrackDropdown() {
  const sel = document.getElementById("track-filter");
  Object.entries(TRACKS).forEach(([code, info]) => {
    const o = document.createElement("option");
    o.value = code;
    o.textContent = `${code} — ${info.name}`;
    sel.appendChild(o);
  });
}

// ── Render ────────────────────────────────────────────────────
function renderAll() {
  renderSemesters();
  renderCourseBank();
  renderPlan();
  renderRequirements();
  requestAnimationFrame(() => ArrowManager.render());
}

function renderSemesters() {
  const container = document.getElementById("timeline-scroll");
  container.innerHTML = "";
  AppState.semesters.forEach(sem => {
    const col = document.createElement("div");
    col.className = "semester-column";
    col.dataset.semesterId = sem.id;
    col.innerHTML = `
      <div class="sem-header ${sem.type}">
        ${sem.label}
        <span class="credit-label" id="cred-${sem.id}"></span>
      </div>
      <div class="drop-zone ${sem.type}" data-semester-id="${sem.id}"></div>`;
    container.appendChild(col);
  });
}

function renderPlan() {
  AppState.semesters.forEach(sem => {
    const zone = document.querySelector(`.drop-zone[data-semester-id="${sem.id}"]`);
    if (!zone) return;
    zone.innerHTML = "";
    (AppState.plan[sem.id] || []).forEach(cid => {
      const c = AppState.courses[cid];
      if (c) zone.appendChild(makeCard(cid, c, true, sem));
    });

    const credits = creditsInSem(sem.id);
    const el = document.getElementById(`cred-${sem.id}`);
    if (el) {
      el.textContent = `${credits} cr`;
      el.classList.toggle("over", credits > CREDIT_WARN);
      el.title = credits > CREDIT_WARN ? `Over ${CREDIT_WARN} credits — heavy load` : "";
    }
  });
}

// ── Course Bank ───────────────────────────────────────────────
function renderCourseBank() {
  const list = document.getElementById("bank-list");
  list.innerHTML = "";
  const placed = placedSet();
  const track = AppState.trackFilter;

  const matches = ([id, c]) => {
    const q = AppState.searchQuery.toLowerCase();
    if (placed.has(id)) return false;
    if (q && !id.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
    return true;
  };

  // No track → flat A–Z list (previous behaviour)
  if (!track || !TRACK_REQUIREMENTS[track]) {
    const entries = Object.entries(AppState.courses).filter(matches)
      .sort(([a], [b]) => a.localeCompare(b));
    if (!entries.length) return emptyBank(list);
    entries.forEach(([id, c]) => list.appendChild(makeCard(id, c, false, null)));
    return;
  }

  // Track selected → group under the same headers as the requirements panel
  const evaluation = evaluateRequirements(track, AppState.plan, AppState.courses);
  const claimed = new Set();
  let rendered = 0;

  evaluation.groups.forEach(group => {
    let ids;
    if (group.type === "anyOf") {
      ids = group.options.filter(o => o.active).flatMap(o => o.courses);
    } else if (group.type === "choose") {
      ids = group.candidates;
    } else {
      ids = (group.courses || []);
    }

    ids = ids.filter(id => !claimed.has(id) && AppState.courses[id]);
    ids.forEach(id => claimed.add(id));

    const visible = ids.filter(id => matches([id, AppState.courses[id]]));
    if (!visible.length) return;

    const head = document.createElement("div");
    head.className = "bank-group-head" + (group.satisfied ? " done" : "");
    head.innerHTML = `<span>${group.label}</span>
      <span class="grp-count">${group.progress}</span>`;
    list.appendChild(head);

    const wrap = document.createElement("div");
    wrap.className = "bank-group-cards";
    visible.sort((a, b) => a.localeCompare(b))
      .forEach(id => wrap.appendChild(makeCard(id, AppState.courses[id], false, null)));
    list.appendChild(wrap);
    rendered += visible.length;
  });

  // Everything the track doesn't ask for, collapsed by default
  const others = Object.entries(AppState.courses)
    .filter(([id]) => !claimed.has(id))
    .filter(matches)
    .sort(([a], [b]) => a.localeCompare(b));

  if (others.length) {
    const btn = document.createElement("button");
    btn.className = "bank-other-toggle";
    btn.textContent = `${AppState.showOther ? "▾" : "▸"} Other courses (${others.length})`;
    btn.onclick = () => { AppState.showOther = !AppState.showOther; renderCourseBank(); };
    list.appendChild(btn);

    if (AppState.showOther) {
      const wrap = document.createElement("div");
      wrap.className = "bank-group-cards";
      others.forEach(([id, c]) => wrap.appendChild(makeCard(id, c, false, null)));
      list.appendChild(wrap);
    }
    rendered += others.length;
  }

  if (!rendered) emptyBank(list);
}

function emptyBank(list) {
  const el = document.createElement("div");
  el.className = "text-muted text-center small mt-3 px-2";
  el.textContent = "No matching courses";
  list.appendChild(el);
}

// ── Card Factory ──────────────────────────────────────────────
function makeCard(id, course, placed, semester) {
  const card = document.createElement("div");
  card.className = "course-card";
  card.dataset.courseId = id;
  card.dataset.placed = placed ? "true" : "false";
  card.style.borderLeftColor = cardColor(course);

  // Inline status chips — kept in the meta row so they never overlap
  // the remove button or the arrow layer.
  const chips = [];
  if (placed && semester) {
    if (!isOffered(course, semester)) {
      card.classList.add("not-offered");
      chips.push(`<span class="chip-nooffer" title="Not on the published rotation for this term">not offered</span>`);
    }
    const warn = prereqWarning(id, semester.id);
    if (warn) {
      card.classList.add("prereq-warn");
      chips.push(`<span class="chip-warn" title="${warn}">⚠ prereq</span>`);
    }
  }

  const removeBtn = placed
    ? `<button class="remove-btn" title="Remove" data-remove="${id}" data-sem="${semester?.id}">&times;</button>`
    : "";

  card.innerHTML = `
    ${removeBtn}
    <div class="card-id">${id}</div>
    <div class="card-name">${course.name}</div>
    <div class="card-meta">
      <span>${course.credits} cr</span>
      <span>·</span>
      <span>${getOfferingText(course)}</span>
      ${chips.join("")}
    </div>
    <div class="card-tracks">${badgeHtml(course)}</div>`;
  return card;
}

function cardColor(course) {
  if (course.tracks && course.tracks.length && course.tracks.length < ALL_TRACK_CODES.length) {
    return TRACKS[course.tracks[0]]?.color || "#9ca3af";
  }
  return CATEGORIES[course.category]?.color || "#9ca3af";
}

// Badge rules — fixes the confusing "+6" pill.
function badgeHtml(course) {
  const neutral = txt => `<span class="track-badge neutral">${txt}</span>`;
  const colored = t =>
    `<span class="track-badge" style="background:${TRACKS[t]?.color || '#999'}">${t}</span>`;

  if (course.category === "core") return neutral("Core");
  if (course.category === "free") return neutral("Elective");

  const tracks = course.tracks || [];
  if (!tracks.length) return "";

  // A track is selected and this course counts for it — show only that.
  const active = AppState.trackFilter;
  if (active && tracks.includes(active)) return colored(active);

  // Universal courses: one honest pill instead of ten.
  if (tracks.length >= ALL_TRACK_CODES.length) return neutral("All tracks");

  const shown = tracks.slice(0, 3).map(colored).join("");
  const rest  = tracks.slice(3);
  if (!rest.length) return shown;

  const names = rest.map(t => TRACKS[t]?.name || t).join(", ");
  return shown +
    `<span class="track-badge more" title="Also: ${names}">+${rest.length} more</span>`;
}

// ── Requirements Panel ────────────────────────────────────────
function renderRequirements() {
  const track   = AppState.trackFilter;
  const summary = document.getElementById("req-summary");
  const body    = document.getElementById("req-body");
  const loadBtn = document.getElementById("btn-load-template");

  if (!track || !TRACK_REQUIREMENTS[track]) {
    summary.innerHTML = "";
    body.innerHTML = `<div class="text-muted small" style="line-height:1.5">
      Pick a track above to see what's required, what's optional, and where
      there's a choice between alternative course paths.</div>`;
    loadBtn.disabled = true;
    return;
  }

  const ev = evaluateRequirements(track, AppState.plan, AppState.courses);
  loadBtn.disabled = false;

  summary.innerHTML = `
    <div class="req-title">${ev.name}</div>
    <div class="req-credits"><b>${ev.credits}</b> / 120 credits placed</div>
    ${ev.draft ? `<div class="req-draft">Draft — derived from the offerings
       spreadsheet, not an advising sheet. Verify before using with students.</div>` : ""}`;

  body.innerHTML = "";
  ev.groups.forEach(group => {
    const el = document.createElement("div");
    el.className = "req-group" + (group.satisfied ? " done" : "");

    const head = `
      <div class="req-group-head">
        <span>${group.label}${group.note ? ` <span class="note">${group.note}</span>` : ""}</span>
        <span class="req-progress">${group.satisfied ? "✓ " : ""}${group.progress}</span>
      </div>`;

    let bodyHtml;
    if (group.type === "anyOf") {
      const opts = group.options.map(o => `
        <div class="alt-option${o.active ? "" : " inactive"}${o.satisfied ? " satisfied" : ""}">
          <div class="alt-label">${o.label}</div>
          <div class="req-chips">
            ${o.items.map(i => chipHtml(i.id, i.placed)).join("")}
          </div>
        </div>`);
      bodyHtml = `<div class="alt-wrap">
        ${opts.join(`<span class="alt-or">OR</span>`)}
      </div>`;
    } else if (group.type === "choose") {
      const chosen = group.chosen.map(id => chipHtml(id, true)).join("");
      bodyHtml = `<div class="req-chips">${chosen ||
        `<span class="text-muted" style="font-size:.66rem">
           Pick any ${group.count} from the bank below.</span>`}</div>`;
    } else {
      bodyHtml = `<div class="req-chips">
        ${group.items.map(i => chipHtml(i.id, i.placed)).join("")}</div>`;
    }

    el.innerHTML = head + bodyHtml;
    body.appendChild(el);
  });

  // Clicking a chip jumps to that course
  body.querySelectorAll(".req-chip").forEach(chip => {
    chip.onclick = () => revealCourse(chip.dataset.course);
  });
}

function chipHtml(id, placed) {
  return `<span class="req-chip${placed ? " placed" : ""}" data-course="${id}"
    title="${AppState.courses[id]?.name || id}">${id}</span>`;
}

// Scroll a course into view and flash it, wherever it currently lives.
function revealCourse(id) {
  const el = document.querySelector(`.course-card[data-course-id="${CSS.escape(id)}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  el.classList.remove("flash");
  void el.offsetWidth;              // restart the animation
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 1200);
}

// ── Helpers ───────────────────────────────────────────────────
function placedSet() {
  const s = new Set();
  Object.values(AppState.plan).forEach(ids => ids.forEach(id => s.add(id)));
  return s;
}

function creditsInSem(semId) {
  return (AppState.plan[semId] || [])
    .reduce((n, id) => n + (AppState.courses[id]?.credits || 0), 0);
}

function prereqWarning(courseId, semId) {
  const course = AppState.courses[courseId];
  if (!course?.prerequisites?.length) return null;
  const idx = AppState.semesters.findIndex(s => s.id === semId);
  const earlier = AppState.semesters.slice(0, idx).map(s => s.id);
  const missing = course.prerequisites.filter(p =>
    !earlier.some(sid => (AppState.plan[sid] || []).includes(p)));
  return missing.length ? `Missing prerequisite: ${missing.join(", ")}` : null;
}

function removeCourse(courseId, semId) {
  const arr = AppState.plan[semId];
  if (arr) { const i = arr.indexOf(courseId); if (i >= 0) arr.splice(i, 1); }
  renderAll();
}

function unplace(courseId) {
  for (const ids of Object.values(AppState.plan)) {
    const i = ids.indexOf(courseId);
    if (i >= 0) { ids.splice(i, 1); return; }
  }
}

// ── Focus interactions (hover / pin / Esc) ────────────────────
function initFocusInteractions() {
  let lastHover = null;

  document.addEventListener("mouseover", e => {
    const card = e.target.closest?.(".course-card[data-placed='true']");
    const id = card?.dataset.courseId || null;
    if (id === lastHover) return;
    lastHover = id;
    id ? ArrowManager.hover(id) : ArrowManager.unhover();
  });

  document.addEventListener("click", e => {
    // Remove button
    const rm = e.target.closest?.("[data-remove]");
    if (rm) {
      removeCourse(rm.dataset.remove, rm.dataset.sem);
      return;
    }
    const card = e.target.closest?.(".course-card[data-placed='true']");
    if (card && !card._dragged) ArrowManager.togglePin(card.dataset.courseId);
    else if (!card && ArrowManager.isPinned()) ArrowManager.clearPin();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && ArrowManager.isPinned()) ArrowManager.clearPin();
  });
}

// ── Drag & Drop ───────────────────────────────────────────────
function initDragDrop() {
  interact(".course-card").draggable({
    autoScroll: { container: document.querySelector(".timeline-area"), margin: 50, speed: 300 },
    listeners: {
      start(e) {
        ArrowManager.clear();
        e.target.classList.add("dragging");
        e.target._tx = 0; e.target._ty = 0; e.target._dragged = true;
      },
      move(e) {
        const tx = (e.target._tx || 0) + e.dx;
        const ty = (e.target._ty || 0) + e.dy;
        e.target.style.transform = `translate(${tx}px,${ty}px)`;
        e.target._tx = tx; e.target._ty = ty;
      },
      end(e) {
        e.target.classList.remove("dragging");
        e.target.style.transform = "";
        e.target._tx = 0; e.target._ty = 0;
        // Let the synthetic click fire first, then re-enable pinning.
        setTimeout(() => { e.target._dragged = false; }, 80);
      }
    }
  });

  interact(".drop-zone").dropzone({
    accept: ".course-card",
    overlap: 0.25,
    ondragenter(e) {
      const sem    = AppState.semesters.find(s => s.id === e.target.dataset.semesterId);
      const course = AppState.courses[e.relatedTarget.dataset.courseId];
      e.target.classList.add(course && sem && !isOffered(course, sem) ? "warn-over" : "drag-over");
    },
    ondragleave(e) { e.target.classList.remove("drag-over", "warn-over"); },
    ondrop(e) {
      e.target.classList.remove("drag-over", "warn-over");
      const courseId = e.relatedTarget.dataset.courseId;
      const targetId = e.target.dataset.semesterId;
      unplace(courseId);
      if (!AppState.plan[targetId]) AppState.plan[targetId] = [];
      if (!AppState.plan[targetId].includes(courseId)) AppState.plan[targetId].push(courseId);
      renderAll();
    }
  });

  interact("#bank-list").dropzone({
    accept: ".course-card[data-placed='true']",
    overlap: 0.2,
    ondragenter(e) { e.target.classList.add("drop-over"); },
    ondragleave(e) { e.target.classList.remove("drop-over"); },
    ondrop(e) {
      e.target.classList.remove("drop-over");
      unplace(e.relatedTarget.dataset.courseId);
      renderAll();
    }
  });
}

// ── Toolbar ───────────────────────────────────────────────────
function initToolbar() {
  document.getElementById("bank-search").addEventListener("input", e => {
    AppState.searchQuery = e.target.value; renderCourseBank();
  });

  document.getElementById("track-filter").addEventListener("change", e => {
    AppState.trackFilter = e.target.value;
    AppState.showOther = false;
    renderAll();
  });

  document.getElementById("btn-download").addEventListener("click", doDownload);
  document.getElementById("btn-upload").addEventListener("click",
    () => document.getElementById("file-upload").click());
  document.getElementById("file-upload").addEventListener("change", doUpload);

  document.getElementById("btn-add-course").addEventListener("click", () => {
    document.getElementById("add-course-form").reset();
    new bootstrap.Modal(document.getElementById("addCourseModal")).show();
  });
  document.getElementById("add-course-submit").addEventListener("click", doAddCourse);

  document.getElementById("btn-add-dep").addEventListener("click", () => {
    fillDepSelects();
    new bootstrap.Modal(document.getElementById("addDepModal")).show();
  });
  document.getElementById("add-dep-submit").addEventListener("click", doAddDep);

  document.getElementById("btn-add-year").addEventListener("click", () => {
    AppState.endYear++;
    AppState.semesters = generateSemesters(AppState.startYear, AppState.endYear);
    AppState.semesters.forEach(s => { if (!AppState.plan[s.id]) AppState.plan[s.id] = []; });
    renderAll();
  });

  document.getElementById("btn-rem-year").addEventListener("click", () => {
    if (AppState.endYear <= AppState.startYear) return;
    const dropped = [`fall-${AppState.endYear}`, `spring-${AppState.endYear + 1}`];
    const lost = dropped.reduce((n, id) => n + (AppState.plan[id]?.length || 0), 0);
    if (lost && !confirm(`${lost} course(s) in that year will be returned to the bank. Continue?`)) return;
    dropped.forEach(id => delete AppState.plan[id]);
    AppState.endYear--;
    AppState.semesters = generateSemesters(AppState.startYear, AppState.endYear);
    renderAll();
  });

  const arrowBtn = document.getElementById("btn-arrow-mode");
  arrowBtn.addEventListener("click", () => {
    ArrowManager.cycleMode();
    arrowBtn.textContent = ArrowManager.getLabel();
  });

  document.getElementById("btn-toggle-panel").addEventListener("click", () => {
    document.getElementById("app-container").classList.toggle("panel-collapsed");
    requestAnimationFrame(() => ArrowManager.render());
  });

  document.getElementById("btn-load-template").addEventListener("click", doLoadTemplate);

  const ta = document.querySelector(".timeline-area");
  let t;
  ta.addEventListener("scroll", () => {
    ArrowManager.clear();
    clearTimeout(t);
    t = setTimeout(() => ArrowManager.render(), 90);
  });
  window.addEventListener("resize", () => ArrowManager.render());
}

// ── Suggested plan ────────────────────────────────────────────
function doLoadTemplate() {
  const track = AppState.trackFilter;
  if (!track) return;

  if (placedSet().size > 0 &&
      !confirm("This replaces everything currently on the timeline. Continue?")) return;

  const result = buildSuggestedPlan(
    track, AppState.semesters, AppState.courses, AppState.dependencies);
  if (!result) { toast("No requirements defined for that track", "danger"); return; }

  AppState.plan = result.plan;
  AppState.semesters.forEach(s => { if (!AppState.plan[s.id]) AppState.plan[s.id] = []; });
  renderAll();

  const total = Object.values(AppState.plan)
    .flat().reduce((n, id) => n + (AppState.courses[id]?.credits || 0), 0);

  if (result.unplaced.length) {
    toast(`Loaded ${total} credits. ${result.unplaced.length} course(s) wouldn't fit —
      add a year or check the rotation: ${result.unplaced.slice(0, 4).join(", ")}`, "warning");
  } else {
    toast(`Loaded suggested plan — ${total} credits`);
  }
}

// ── JSON in / out ─────────────────────────────────────────────
function doDownload() {
  const data = {
    version: 2,
    startYear: AppState.startYear,
    endYear: AppState.endYear,
    track: AppState.trackFilter,
    courses: AppState.courses,
    dependencies: AppState.dependencies,
    plan: AppState.plan,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `course-plan-${new Date().toISOString().slice(0, 10)}.json`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

function doUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d.courses)      AppState.courses      = d.courses;
      if (d.dependencies) AppState.dependencies = d.dependencies;
      if (d.startYear != null) AppState.startYear = d.startYear;
      if (d.endYear   != null) AppState.endYear   = d.endYear;
      AppState.semesters = generateSemesters(AppState.startYear, AppState.endYear);
      AppState.plan = d.plan || {};
      AppState.semesters.forEach(s => { if (!AppState.plan[s.id]) AppState.plan[s.id] = []; });
      if (d.track != null) {
        AppState.trackFilter = d.track;
        document.getElementById("track-filter").value = d.track;
      }
      renderAll();
      toast("Plan loaded");
    } catch (err) {
      toast("Could not read that file: " + err.message, "danger");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// ── Add course ────────────────────────────────────────────────
function doAddCourse() {
  const val = id => document.getElementById(id).value.trim();
  const id       = val("nc-id").toUpperCase();
  const name     = val("nc-name");
  const credits  = parseInt(document.getElementById("nc-credits").value) || 3;
  const semester = document.getElementById("nc-semester").value;
  const period   = parseInt(document.getElementById("nc-period").value) || 1;
  const startYr  = parseInt(document.getElementById("nc-startyear").value) || null;
  const category = document.getElementById("nc-category").value;
  const list = s => s.split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
  const tracks  = list(val("nc-tracks"));
  const prereqs = list(val("nc-prereqs"));

  if (!id || !name)          { toast("ID and name are required", "danger"); return; }
  if (AppState.courses[id])  { toast(`${id} already exists`, "danger"); return; }

  const unknown = prereqs.filter(p => !AppState.courses[p]);
  if (unknown.length) { toast(`Unknown prerequisite: ${unknown.join(", ")}`, "danger"); return; }

  const offering = { semester, period };
  if (period === 2 && startYr) offering.startYear = startYr;

  AppState.courses[id] = { name, credits, category, tracks, offering, prerequisites: prereqs };
  prereqs.forEach(p => {
    if (!AppState.dependencies.some(d => d.from === p && d.to === id))
      AppState.dependencies.push({ from: p, to: id });
  });

  bootstrap.Modal.getInstance(document.getElementById("addCourseModal")).hide();
  renderAll();
  toast(`Added ${id}`);
}

// ── Add dependency ────────────────────────────────────────────
function fillDepSelects() {
  const ids = Object.keys(AppState.courses).sort();
  ["dep-from", "dep-to"].forEach(sel => {
    const el = document.getElementById(sel);
    el.innerHTML = ids.map(id =>
      `<option value="${id}">${id} — ${AppState.courses[id].name}</option>`).join("");
  });
  document.getElementById("dep-alt").checked = false;
}

function doAddDep() {
  const from = document.getElementById("dep-from").value;
  const to   = document.getElementById("dep-to").value;
  const alt  = document.getElementById("dep-alt").checked;

  if (from === to) { toast("A course can't be its own prerequisite", "danger"); return; }
  if (AppState.dependencies.some(d => d.from === from && d.to === to)) {
    toast("That dependency already exists", "danger"); return;
  }
  if (createsCycle(from, to)) {
    toast(`That would create a prerequisite loop with ${to}`, "danger"); return;
  }

  const dep = { from, to };
  if (alt) dep.altGroup = `alt-${to}`;
  AppState.dependencies.push(dep);

  if (AppState.courses[to] && !AppState.courses[to].prerequisites.includes(from))
    AppState.courses[to].prerequisites.push(from);

  bootstrap.Modal.getInstance(document.getElementById("addDepModal")).hide();
  renderAll();
  toast(`${from} → ${to}`);
}

// Would adding from→to make `to` reachable back to `from`?
function createsCycle(from, to) {
  const seen = new Set();
  const stack = [to];
  while (stack.length) {
    const cur = stack.pop();
    if (cur === from) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    AppState.dependencies.filter(d => d.from === cur).forEach(d => stack.push(d.to));
  }
  return false;
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast align-items-center text-bg-${type} border-0 show`;
  t.setAttribute("role", "alert");
  t.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div>
    <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
