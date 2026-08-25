// ============================================================
// Dependency Arrow Manager  (LeaderLine wrapper)
// ============================================================
const ArrowManager = (() => {
  let lines = [];

  function clear() {
    lines.forEach(l => { try { l.remove(); } catch (_) {} });
    lines = [];
  }

  function draw(dependencies, plan, courses) {
    clear();

    // Build placement map: courseId -> semesterId
    const placement = {};
    for (const [sid, ids] of Object.entries(plan)) {
      ids.forEach(id => { placement[id] = sid; });
    }

    const semesters = window.AppState ? window.AppState.semesters : [];

    for (const dep of dependencies) {
      if (!placement[dep.from] || !placement[dep.to]) continue;

      const fromEl = document.querySelector(
        `.course-card[data-course-id="${dep.from}"][data-placed="true"]`);
      const toEl = document.querySelector(
        `.course-card[data-course-id="${dep.to}"][data-placed="true"]`);
      if (!fromEl || !toEl) continue;

      const fromIdx = semesters.findIndex(s => s.id === placement[dep.from]);
      const toIdx   = semesters.findIndex(s => s.id === placement[dep.to]);
      const violated = fromIdx >= toIdx;

      try {
        const line = new LeaderLine(fromEl, toEl, {
          color: violated ? 'rgba(239,68,68,.8)' : 'rgba(37,99,235,.45)',
          size:  violated ? 2.5 : 1.8,
          path:  'fluid',
          startSocket: 'right',
          endSocket:   'left',
          startPlug: 'disc',
          endPlug:   'arrow1',
          dash: violated ? { animation: true } : false,
        });
        lines.push(line);
      } catch (_) {}
    }
  }

  function reposition() {
    lines.forEach(l => { try { l.position(); } catch (_) {} });
  }

  return { clear, draw, reposition };
})();
