/* EP01-01의 키·v1 변환 규칙은 변경하지 않는다. 읽기/쓰기 범위는 회차별로 고정한다. */
window.EpisodeStorage = (() => {
  const keys = { 'ep01-01': 'ai-story:ep01-01:v2', 'ep01-02': 'ai-story:ep01-02:v1' };
  function read(key, storage) {
    try {
      const raw = (storage === undefined ? window.localStorage : storage).getItem(key);
      try { return { value: JSON.parse(raw), exists: raw !== null, available: true }; }
      catch { return { value: null, exists: true, available: true }; }
    } catch { return { value: null, exists: false, available: false }; }
  }
  function readEpisode01(storage) {
    const current = read(keys['ep01-01'], storage);
    if (current.exists) return window.GameState.normalize(current.value);
    return window.GameState.normalize(read('ai-story:ep01-01:v1', storage).value, true);
  }
  function writeEpisode02(state, storage) {
    try {
      (storage === undefined ? window.localStorage : storage).setItem(keys['ep01-02'], JSON.stringify(state));
      return true;
    } catch { return false; }
  }
  function loadEpisode02({ memory, source, storage } = {}) {
    const disk = read(keys['ep01-02'], storage);
    const saved = window.Episode02State.normalize(memory) || window.Episode02State.normalize(disk.value);
    if (saved) return { state: saved, resumed: true, available: disk.available };
    const checkedSource = window.GameState.normalize(source || readEpisode01(storage));
    const state = window.Episode02State.fresh(checkedSource);
    return { state, resumed: false, available: disk.available };
  }
  function resetEpisode02(state, storage) {
    const fresh = window.Episode02State.fresh(state?.inherited);
    return { state: fresh, available: fresh ? writeEpisode02(fresh, storage) : false };
  }
  return { keys, readEpisode01, loadEpisode02, writeEpisode02, resetEpisode02 };
})();
