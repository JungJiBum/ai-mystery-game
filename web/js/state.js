/* DOM과 분리한 저장 데이터 검증·이전 및 추리 판정. */
window.GameState = (() => {
  const scenes = ['start', 'doorstep', 'room', 'parcel', 'article', 'complete'];
  const ids = ['photo', 'back', 'note', 'usb'];
  function fresh() {
    return { version: 2, scene: 'start', found: [], unlocked: false, articleRead: false,
      completed: false, photoFace: 'front', noteOpen: false, inspection: null };
  }
  function normalize(saved, legacy = false) {
    if (!saved || !Array.isArray(saved.found)) return fresh();
    const next = fresh();
    next.scene = legacy ? ({ room: 'parcel', ending: 'article' }[saved.scene] || saved.scene) : saved.scene;
    if (!scenes.includes(next.scene)) return fresh();
    next.found = ids.filter(id => saved.found.includes(id));
    if (next.found.includes('back') && !next.found.includes('photo')) next.found.unshift('photo');
    next.photoFace = saved.photoFace === 'back' && next.found.includes('back') ? 'back' : 'front';
    next.noteOpen = next.found.includes('note') && (legacy || saved.noteOpen === true);
    // v1 기사 도달은 보존한다. 조사 중인 기존 정답은 원문 기준으로 다시 확인한다.
    next.unlocked = next.found.length === 4 && (legacy ? saved.scene === 'ending' : saved.unlocked === true);
    next.articleRead = next.unlocked && saved.articleRead === true;
    next.completed = next.articleRead && saved.completed === true;
    if (['article', 'complete'].includes(next.scene) && !next.unlocked) next.scene = 'parcel';
    if (next.scene === 'complete' && !next.completed) next.scene = 'article';
    if (next.scene === 'start') return fresh();
    if (next.scene === 'parcel' && ['photo', 'note', 'usb'].includes(saved.inspection)) next.inspection = saved.inspection;
    return next;
  }
  function canDeduce(state) { return ids.every(id => state.found.includes(id)); }
  function isCorrect(state, selected, pair) {
    return canDeduce(state) && selected.length === 2 && new Set(selected).size === 2 && pair.every(id => selected.includes(id));
  }
  return { fresh, normalize, canDeduce, isCorrect };
})();
