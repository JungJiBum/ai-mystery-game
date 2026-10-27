window.Episode02State = (() => {
  const sourceIds = ['photo', 'back', 'note', 'usb'];
  const ids = ['article', 'sign', 'trace', 'press'];
  const scenes = ['article', 'comparison', 'search', 'press', 'deduction', 'complete'];
  function sourceSnapshot(source) {
    if (!source || source.completed !== true || source.articleRead !== true || !Array.isArray(source.found)) return null;
    if (!sourceIds.every(id => source.found.includes(id))) return null;
    if (source.sourceEpisode !== undefined && source.sourceEpisode !== 'ep01-01') return null;
    if (source.sourceSaveVersion !== undefined && source.sourceSaveVersion !== 2) return null;
    return { sourceEpisode: 'ep01-01', sourceSaveVersion: 2, completed: true, articleRead: true, found: [...sourceIds] };
  }
  function fresh(source) {
    const inherited = sourceSnapshot(source);
    return inherited ? { version: 1, scene: 'article', found: [], searchDone: false, completed: false, inherited } : null;
  }
  function normalize(saved) {
    if (!saved || saved.version !== 1 || !Array.isArray(saved.found)) return null;
    const state = fresh(saved.inherited);
    if (!state) return null;
    state.searchDone = saved.searchDone === true && saved.found.includes('sign') && saved.found.includes('article');
    for (const id of ids) {
      if (!saved.found.includes(id) || (id === 'trace' && !state.searchDone)) break;
      state.found.push(id);
    }
    state.completed = saved.completed === true && ids.every(id => state.found.includes(id));
    state.scene = scenes.includes(saved.scene) ? saved.scene : 'article';
    state.scene = permittedScene(state, state.scene);
    return state;
  }
  function permittedScene(state, scene) {
    if (scene === 'article') return scene;
    if (!state.found.includes('article')) return 'article';
    if (scene === 'comparison') return scene;
    if (!state.found.includes('sign')) return 'comparison';
    if (scene === 'search') return scene;
    if (!state.found.includes('trace')) return 'search';
    if (scene === 'press') return scene;
    if (!state.found.includes('press')) return 'press';
    if (scene === 'complete' && !state.completed) return 'deduction';
    return scenes.includes(scene) ? scene : 'article';
  }
  function validQuery(text) { return String(text).replace(/[\s'"“”‘’]/g, '') === '기록실'; }
  function isCorrect(state, selected) {
    return ids.every(id => state.found.includes(id)) && selected.length === 2 && new Set(selected).size === 2 && ['trace', 'press'].every(id => selected.includes(id));
  }
  function record(state, action) {
    const next = normalize(state);
    if (!next) return null;
    if (action === 'readArticle') next.found = [...new Set([...next.found, 'article'])];
    if (action === 'readSign' && next.found.includes('article')) next.found = [...new Set([...next.found, 'sign'])];
    if (action === 'search' && next.found.includes('sign')) next.searchDone = true;
    if (action === 'openDeleted' && next.searchDone) next.found = [...new Set([...next.found, 'trace'])];
    if (action === 'readPress' && next.found.includes('trace')) next.found = [...new Set([...next.found, 'press'])];
    return normalize(next);
  }
  return { fresh, normalize, sourceSnapshot, permittedScene, validQuery, isCorrect, record };
})();
