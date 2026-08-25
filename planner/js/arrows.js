// ============================================================
// Dependency Arrows — focus / all / off
// ============================================================
//
// Default is FOCUS: nothing is drawn at rest. Hovering (or clicking to pin)
// a card draws that course's full prerequisite chain upstream and everything
// that depends on it downstream, dimming unrelated cards.
//
// ============================================================

const ArrowManager = (() => {
  let lines = [];
  let mode = "focus";          // "focus" | "all" | "off"
  let focusId = null;          // course currently hovered
  let pinnedId = null;         // course click-pinned

  const MODES = ["focus", "all", "off"];
  const MODE_LABEL = { focus: "Arrows: Focus", all: "Arrows: All", off: "Arrows: Off" };

  // ── Graph helpers ─────────────────────────────────────────
  function buildAdjacency(deps) {
    const out = {}, into = {};
    deps.forEach(d => {
      (out[d.from] = out[d.from] || []).push(d.to);
      (into[d.to] = into[d.to] || []).push(d.from);
    });
    return { out, into };
  }

  function walk(startId, adj) {
    const seen = new Set();
    const stack = [startId];
    while (stack.length) {
      const cur = stack.pop();
      (adj[cur] || []).forEach(next => {
        if (!seen.has(next)) { seen.add(next); stack.push(next); }
      });
    }
    return seen;
  }

  // Every course connected to `id` in either direction.
  function chainOf(id, deps) {
    const { out, into } = buildAdjacency(deps);
    const set = new Set([id]);
    walk(id, out).forEach(c => set.add(c));
    walk(id, into).forEach(c => set.add(c));
    return set;
  }

  // ── Rendering ─────────────────────────────────────────────
  function clear() {
    lines.forEach(l => { try { l.remove(); } catch (_) {} });
    lines = [];
  }

  function cardEl(courseId) {
    return document.querySelector(
      `.course-card[data-course-id="${CSS.escape(courseId)}"][data-placed="true"]`);
  }

  function semIndexOf(courseId, plan, semesters) {
    for (const [sid, ids] of Object.entries(plan)) {
      if (ids.includes(courseId)) return semesters.findIndex(s => s.id === sid);
    }
    return -1;
  }

  // Column-aware sockets: left-to-right for normal edges, vertical when the
  // two courses share a semester. Avoids the backward loops `fluid` produced.
  function socketsFor(fromIdx, toIdx) {
    if (fromIdx === toIdx) return { startSocket: "bottom", endSocket: "top" };
    if (fromIdx < toIdx)   return { startSocket: "right",  endSocket: "left" };
    return { startSocket: "left", endSocket: "right" };   // violation, points back
  }

  function drawEdge(dep, plan, semesters) {
    const fromEl = cardEl(dep.from);
    const toEl   = cardEl(dep.to);
    if (!fromEl || !toEl) return;

    const fromIdx = semIndexOf(dep.from, plan, semesters);
    const toIdx   = semIndexOf(dep.to,   plan, semesters);
    const violated = fromIdx >= toIdx;
    const isAlt = !!dep.altGroup;

    const opts = {
      color: violated ? "rgba(239,68,68,.85)"
           : isAlt    ? "rgba(120,113,108,.6)"
           :            "rgba(37,99,235,.55)",
      size: violated ? 2.5 : 2,
      path: "grid",
      ...socketsFor(fromIdx, toIdx),
      startSocketGravity: 12,
      endSocketGravity: 12,
      startPlug: "behind",
      endPlug: "arrow1",
      endPlugSize: 1.6,
    };

    if (violated)   opts.dash = { animation: true };
    else if (isAlt) opts.dash = { len: 6, gap: 4 };

    try {
      const line = new LeaderLine(fromEl, toEl, opts);
      if (isAlt) {
        try { line.middleLabel = "either"; } catch (_) {}
      }
      lines.push(line);
    } catch (_) { /* element not laid out yet */ }
  }

  // ── Public render ─────────────────────────────────────────
  function render() {
    clear();
    const st = window.AppState;
    if (!st) return;

    // Only cards on the timeline participate in focus highlighting — the bank
    // is a palette, not part of the chain being traced.
    const timelineCards = () => document.querySelectorAll(".drop-zone .course-card");

    document.querySelectorAll(".course-card").forEach(c => {
      c.classList.remove("dimmed", "chain-focus", "chain-member");
    });

    if (mode === "off") return;

    const active = pinnedId || focusId;

    if (mode === "all" || !active) {
      if (mode === "all") {
        st.dependencies.forEach(d => drawEdge(d, st.plan, st.semesters));
      }
      return;
    }

    // Focus mode with an active course
    const chain = chainOf(active, st.dependencies);

    timelineCards().forEach(c => {
      const id = c.dataset.courseId;
      if (id === active) c.classList.add("chain-focus");
      else if (chain.has(id)) c.classList.add("chain-member");
      else c.classList.add("dimmed");
    });

    st.dependencies
      .filter(d => chain.has(d.from) && chain.has(d.to))
      .forEach(d => drawEdge(d, st.plan, st.semesters));
  }

  // ── Interaction ───────────────────────────────────────────
  function hover(courseId) {
    if (mode !== "focus" || pinnedId) return;
    focusId = courseId;
    render();
  }

  function unhover() {
    if (mode !== "focus" || pinnedId) return;
    focusId = null;
    render();
  }

  function togglePin(courseId) {
    if (mode !== "focus") return;
    pinnedId = pinnedId === courseId ? null : courseId;
    focusId = pinnedId;
    render();
  }

  function clearPin() {
    pinnedId = null;
    focusId = null;
    render();
  }

  function cycleMode() {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    pinnedId = focusId = null;
    render();
    return mode;
  }

  const getMode  = () => mode;
  const getLabel = () => MODE_LABEL[mode];
  const isPinned = () => !!pinnedId;

  function reposition() {
    lines.forEach(l => { try { l.position(); } catch (_) {} });
  }

  return { render, clear, hover, unhover, togglePin, clearPin,
           cycleMode, getMode, getLabel, isPinned, reposition };
})();
