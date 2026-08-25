// ============================================================
// Course Planning App — Main Logic
// ============================================================

const AppState = {
  courses: {},
  dependencies: [],
  plan: {},        // semesterId -> [courseId, ...]
  semesters: [],
  startYear: 2024,
  endYear: 2027,   // 8 semesters: Fall 2024 – Spring 2028
  trackFilter: "",
  searchQuery: "",
};
window.AppState = AppState;

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  AppState.courses      = JSON.parse(JSON.stringify(DEFAULT_COURSES));
  AppState.dependencies = JSON.parse(JSON.stringify(DEFAULT_DEPENDENCIES));
  AppState.semesters    = generateSemesters(AppState.startYear, AppState.endYear);
  AppState.semesters.forEach(s => { AppState.plan[s.id] = []; });

  renderAll();
  initDragDrop();
  initToolbar();
});

// ── Render ────────────────────────────────────────────────────
function renderAll() {
  renderSemesters();
  renderCourseBank();
  renderPlan();
  requestAnimationFrame(() => {
    ArrowManager.draw(AppState.dependencies, AppState.plan, AppState.courses);
  });
}

function renderSemesters() {
  const container = document.getElementById("timeline-scroll");
  container.innerHTML = "";
  AppState.semesters.forEach(sem => {
    const credits = creditsInSem(sem.id);
    const col = document.createElement("div");
    col.className = "semester-column";
    col.dataset.semesterId = sem.id;
    col.innerHTML = `
      <div class="sem-header ${sem.type}">
        ${sem.label}
        <span class="credit-label" id="cred-${sem.id}">${credits} cr</span>
      </div>
      <div class="drop-zone ${sem.type}" data-semester-id="${sem.id}"></div>`;
    container.appendChild(col);
  });
}

function renderCourseBank() {
  const list = document.getElementById("bank-list");
  list.innerHTML = "";
  const placed = placedSet();
  const q = AppState.searchQuery.toLowerCase();
  const tf = AppState.trackFilter;

  const entries = Object.entries(AppState.courses)
    .filter(([id]) => !placed.has(id))
    .filter(([id, c]) => {
      if (q && !id.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
      if (tf && !c.tracks.includes(tf)) return false;
      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    const el = document.createElement("div");
    el.className = "text-muted text-center small mt-3 px-2";
    el.textContent = "No matching courses";
    list.appendChild(el);
    return;
  }
  entries.forEach(([id, c]) => list.appendChild(makeCard(id, c, false, null)));
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
    const credEl = document.getElementById(`cred-${sem.id}`);
    if (credEl) credEl.textContent = `${creditsInSem(sem.id)} cr`;
  });
}

// ── Card Factory ──────────────────────────────────────────────
function makeCard(id, course, placed, semester) {
  const card = document.createElement("div");
  card.className = "course-card";
  card.dataset.courseId = id;
  card.dataset.placed = placed ? "true" : "false";

  const primaryColor = course.tracks.length ? (TRACKS[course.tracks[0]]?.color || "#9ca3af") : "#9ca3af";
  card.style.borderLeftColor = primaryColor;

  let topRight = "";
  if (placed && semester) {
    if (!isOffered(course, semester)) {
      card.classList.add("not-offered");
      topRight = `<span class="no-offer-pill" title="Not typically offered this semester">Not offered</span>`;
    } else {
      const warn = prereqWarning(id, semester.id);
      if (warn) {
        card.classList.add("prereq-warn");
        topRight = `<span class="warn-icon" title="${warn}">&#9888;</span>`;
      }
    }
  }

  const badges = course.tracks.slice(0, 4).map(t =>
    `<span class="track-badge" style="background:${TRACKS[t]?.color||'#999'}">${t}</span>`
  ).join("") + (course.tracks.length > 4
    ? `<span class="track-badge" style="background:#aaa">+${course.tracks.length-4}</span>` : "");

  const removeBtn = placed
    ? `<button class="remove-btn" onclick="removeCourse('${id}','${semester?.id}')">&times;</button>` : "";

  card.innerHTML = `
    ${removeBtn}${topRight}
    <div class="card-id">${id}</div>
    <div class="card-name">${course.name}</div>
    <div class="card-meta">${course.credits} cr &middot; ${getOfferingText(course)}</div>
    <div class="card-tracks">${badges}</div>`;
  return card;
}

// ── Helpers ───────────────────────────────────────────────────
function placedSet() {
  const s = new Set();
  Object.values(AppState.plan).forEach(ids => ids.forEach(id => s.add(id)));
  return s;
}

function creditsInSem(semId) {
  return (AppState.plan[semId] || []).reduce((n, id) => n + (AppState.courses[id]?.credits || 0), 0);
}

function prereqWarning(courseId, semId) {
  const course = AppState.courses[courseId];
  if (!course?.prerequisites?.length) return null;
  const idx = AppState.semesters.findIndex(s => s.id === semId);
  const earlier = new Set(AppState.semesters.slice(0, idx).map(s => s.id));
  const missing = course.prerequisites.filter(p =>
    !Array.from(earlier).some(sid => (AppState.plan[sid] || []).includes(p))
  );
  return missing.length ? `Missing prereqs: ${missing.join(", ")}` : null;
}

window.removeCourse = function(courseId, semId) {
  const arr = AppState.plan[semId];
  if (arr) { const i = arr.indexOf(courseId); if (i >= 0) arr.splice(i, 1); }
  renderAll();
};

// ── Drag & Drop (interact.js) ─────────────────────────────────
function initDragDrop() {
  interact(".course-card").draggable({
    autoScroll: { container: document.querySelector(".timeline-area"), margin: 50, speed: 300 },
    listeners: {
      start(e) {
        e.target.classList.add("dragging");
        e.target._tx = 0; e.target._ty = 0;
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
      }
    }
  });

  interact(".drop-zone").dropzone({
    accept: ".course-card",
    overlap: 0.25,
    ondragenter(e) {
      const semId   = e.target.dataset.semesterId;
      const courseId = e.relatedTarget.dataset.courseId;
      const sem     = AppState.semesters.find(s => s.id === semId);
      const course  = AppState.courses[courseId];
      e.target.classList.add(course && sem && !isOffered(course, sem) ? "warn-over" : "drag-over");
    },
    ondragleave(e) { e.target.classList.remove("drag-over","warn-over"); },
    ondrop(e) {
      e.target.classList.remove("drag-over","warn-over");
      const card     = e.relatedTarget;
      const courseId = card.dataset.courseId;
      const targetId = e.target.dataset.semesterId;

      // Remove from old location
      if (card.dataset.placed === "true") {
        for (const [sid, ids] of Object.entries(AppState.plan)) {
          const i = ids.indexOf(courseId);
          if (i >= 0) { ids.splice(i, 1); break; }
        }
      }

      if (!AppState.plan[targetId]) AppState.plan[targetId] = [];
      if (!AppState.plan[targetId].includes(courseId)) {
        AppState.plan[targetId].push(courseId);
      }
      renderAll();
    }
  });

  // Drop back to bank
  interact("#bank-list").dropzone({
    accept: ".course-card[data-placed='true']",
    overlap: 0.2,
    ondragenter(e) { e.target.classList.add("drop-over"); },
    ondragleave(e) { e.target.classList.remove("drop-over"); },
    ondrop(e) {
      e.target.classList.remove("drop-over");
      const courseId = e.relatedTarget.dataset.courseId;
      for (const [sid, ids] of Object.entries(AppState.plan)) {
        const i = ids.indexOf(courseId);
        if (i >= 0) { ids.splice(i, 1); break; }
      }
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
    AppState.trackFilter = e.target.value; renderCourseBank();
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
    [`fall-${AppState.endYear}`, `spring-${AppState.endYear+1}`].forEach(id => delete AppState.plan[id]);
    AppState.endYear--;
    AppState.semesters = generateSemesters(AppState.startYear, AppState.endYear);
    renderAll();
  });

  // Reposition arrows on scroll / resize
  const ta = document.querySelector(".timeline-area");
  let t;
  ta.addEventListener("scroll", () => {
    ArrowManager.clear();
    clearTimeout(t);
    t = setTimeout(() => ArrowManager.draw(AppState.dependencies, AppState.plan, AppState.courses), 80);
  });
  window.addEventListener("resize", () =>
    ArrowManager.draw(AppState.dependencies, AppState.plan, AppState.courses));
}

// ── JSON IO ───────────────────────────────────────────────────
function doDownload() {
  const data = { version: 1, startYear: AppState.startYear, endYear: AppState.endYear,
    courses: AppState.courses, dependencies: AppState.dependencies, plan: AppState.plan };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"),
    { href: URL.createObjectURL(blob), download: `course-plan-${new Date().toISOString().slice(0,10)}.json` });
  a.click(); URL.revokeObjectURL(a.href);
}

function doUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d.courses)      AppState.courses      = d.courses;
      if (d.dependencies) AppState.dependencies = d.dependencies;
      if (d.startYear != null) AppState.startYear = d.startYear;
      if (d.endYear != null)   AppState.endYear   = d.endYear;
      AppState.semesters = generateSemesters(AppState.startYear, AppState.endYear);
      AppState.plan = d.plan || {};
      AppState.semesters.forEach(s => { if (!AppState.plan[s.id]) AppState.plan[s.id] = []; });
      renderAll();
      toast("Plan loaded!");
    } catch (err) { toast("Error: " + err.message, "danger"); }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// ── Add Course ────────────────────────────────────────────────
function doAddCourse() {
  const id      = document.getElementById("nc-id").value.trim().toUpperCase();
  const name    = document.getElementById("nc-name").value.trim();
  const credits = parseInt(document.getElementById("nc-credits").value) || 3;
  const sem     = document.getElementById("nc-semester").value;
  const period  = parseInt(document.getElementById("nc-period").value) || 1;
  const startYr = parseInt(document.getElementById("nc-startyear").value) || null;
  const tracks  = document.getElementById("nc-tracks").value.split(",").map(t=>t.trim().toUpperCase()).filter(Boolean);
  const prereqs = document.getElementById("nc-prereqs").value.split(",").map(t=>t.trim().toUpperCase()).filter(Boolean);

  if (!id || !name) { toast("ID and Name required", "danger"); return; }
  if (AppState.courses[id]) { toast(`${id} already exists`, "danger"); return; }

  const offering = { semester: sem, period };
  if (period === 2 && startYr) offering.startYear = startYr;
  AppState.courses[id] = { name, credits, tracks, offering, prerequisites: prereqs };

  prereqs.forEach(p => {
    if (!AppState.dependencies.some(d => d.from === p && d.to === id))
      AppState.dependencies.push({ from: p, to: id });
  });

  bootstrap.Modal.getInstance(document.getElementById("addCourseModal")).hide();
  renderAll();
  toast(`Added ${id}`);
}

// ── Add Dependency ────────────────────────────────────────────
function fillDepSelects() {
  ["dep-from","dep-to"].forEach(sel => {
    const el = document.getElementById(sel); el.innerHTML = "";
    Object.keys(AppState.courses).sort().forEach(id => {
      el.innerHTML += `<option value="${id}">${id} – ${AppState.courses[id].name}</option>`;
    });
  });
}

function doAddDep() {
  const from = document.getElementById("dep-from").value;
  const to   = document.getElementById("dep-to").value;
  if (from === to) { toast("Cannot depend on itself", "danger"); return; }
  if (AppState.dependencies.some(d => d.from === from && d.to === to)) {
    toast("Dependency already exists", "danger"); return;
  }
  AppState.dependencies.push({ from, to });
  if (AppState.courses[to] && !AppState.courses[to].prerequisites.includes(from))
    AppState.courses[to].prerequisites.push(from);
  bootstrap.Modal.getInstance(document.getElementById("addDepModal")).hide();
  renderAll();
  toast(`${from} → ${to}`);
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast align-items-center text-bg-${type} border-0 show`;
  t.setAttribute("role","alert");
  t.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div>
    <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
