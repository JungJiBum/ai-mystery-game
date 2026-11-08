/* EP01-03 전용 검증기. 기존 두 회차의 저장 규격은 변경하지 않는다. */
window.Episode03State = (() => {
  const scenes = ['press', 'inquiry', 'comparison', 'deduction', 'final', 'complete'];
  const markIds = ['beforePeriod', 'beforeCode', 'afterPeriod', 'afterCode'];
  function sourceSnapshot(source) {
    if (source?.sourceEpisode !== undefined && source.sourceEpisode !== 'ep01-02') return null;
    if (source?.sourceSaveVersion !== undefined && source.sourceSaveVersion !== 1) return null;
    const checked = window.Episode02State.normalize(source?.sourceEpisode ? { ...source, version: source.sourceSaveVersion } : source);
    if (!checked?.completed) return null;
    return { sourceEpisode: 'ep01-02', sourceSaveVersion: 1, completed: true, searchDone: true,
      found: ['article', 'sign', 'trace', 'press'], inherited: checked.inherited };
  }
  function fresh(source) {
    const inherited = sourceSnapshot(source);
    return inherited ? { version: 1, scene: 'press', found: [], pressRead: false, requestSent: false,
      replyAnalyzed: false, marks: [], comparisonReviewed: false, deduced: false, noteRead: false, completed: false, inherited } : null;
  }
  function normalize(saved) {
    if (!saved || saved.version !== 1 || !Array.isArray(saved.found)) return null;
    const next = fresh(saved.inherited);
    if (!next) return null;
    next.pressRead = saved.pressRead === true;
    next.requestSent = next.pressRead && saved.requestSent === true;
    next.replyAnalyzed = next.requestSent && saved.replyAnalyzed === true;
    next.marks = next.replyAnalyzed && Array.isArray(saved.marks) ? markIds.filter(id => saved.marks.includes(id)) : [];
    next.comparisonReviewed = next.marks.length === 4 && saved.comparisonReviewed === true;
    next.found = [next.pressRead && 'press', next.replyAnalyzed && 'reply',
      next.marks.includes('beforePeriod') && next.marks.includes('beforeCode') && 'before',
      next.marks.includes('afterPeriod') && next.marks.includes('afterCode') && 'after',
      next.comparisonReviewed && 'comparison'].filter(Boolean);
    next.deduced = next.comparisonReviewed && saved.deduced === true;
    next.noteRead = next.deduced && saved.noteRead === true;
    next.completed = next.noteRead && saved.completed === true;
    next.scene = permittedScene(next, scenes.includes(saved.scene) ? saved.scene : 'press');
    return next;
  }
  function permittedScene(state, scene) {
    if (!scenes.includes(scene) || scene === 'press' || !state.pressRead) return 'press';
    if (scene === 'inquiry' || !state.replyAnalyzed) return 'inquiry';
    if (scene === 'comparison' || !state.comparisonReviewed) return 'comparison';
    if (scene === 'deduction' || !state.deduced) return 'deduction';
    if (scene === 'final' || !state.completed) return 'final';
    return 'complete';
  }
  function validInquiry(values) { return values?.period === 'article' && values.facility === 'lab' && values.record === 'internal'; }
  function isCorrect(state, selected, hypothesis) {
    return state.comparisonReviewed && state.found.length === 5 && Array.isArray(selected) && selected.length === 3 &&
      new Set(selected).size === 3 && window.EP03_STORY.deduction.evidence.every(id => selected.includes(id)) && hypothesis === 'reclassified';
  }
  function record(state, action, value) {
    const next = normalize(state);
    if (!next) return null;
    if (action === 'readPress' && value === 'locationUnknown') next.pressRead = true;
    if (action === 'sendInquiry' && next.pressRead && validInquiry(value)) next.requestSent = true;
    if (action === 'analyzeReply' && next.requestSent && value === 'nameOnly') next.replyAnalyzed = true;
    if (action === 'mark' && next.replyAnalyzed && markIds.includes(value)) next.marks.push(value);
    if (action === 'compare' && next.marks.length === 4) next.comparisonReviewed = true;
    if (action === 'readNote' && next.deduced) next.noteRead = true;
    return normalize(next);
  }
  function solve(state, selected, hypothesis) {
    const next = normalize(state);
    if (next && isCorrect(next, selected, hypothesis)) next.deduced = true;
    return next;
  }
  function finish(state, query) {
    const next = normalize(state);
    if (next?.noteRead && String(query).trim().toUpperCase() === 'D-03') { next.completed = true; next.scene = 'complete'; }
    return next;
  }
  return { fresh, normalize, sourceSnapshot, permittedScene, validInquiry, isCorrect, record, solve, finish };
})();
