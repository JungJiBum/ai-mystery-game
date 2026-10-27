(() => {
  const memory = {}, catalog = window.EpisodeCatalog;
  let mounted = null, current = null;
  function route() {
    const id = window.EpisodeRouting.resolve(window.location.hash);
    if (window.location.hash !== `#${id}`) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
    if (current === id && mounted) return;
    if (mounted) { memory[current] = mounted.getState(); mounted.dispose(); }
    current = id;
    const app = document.querySelector('#app'); app.dataset.episode = id;
    document.title = `AI Story — ${catalog[id].title}`;
    document.querySelector('.episode').textContent = catalog[id].label;
    document.querySelectorAll('[data-episode-link]').forEach(link => { if (link.dataset.episodeLink === id) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    if (id === 'ep01-01') {
      document.querySelector('#restart-title').textContent = 'EP01-01을 처음부터 시작할까요?';
      document.querySelector('#restart-dialog p').textContent = 'EP01-01의 증거와 진행 상황만 초기화합니다. EP01-02 저장은 유지합니다.';
      mounted = window.Episode01.mount({ initialState: memory[id], resumeImmediately: !!memory[id], onNext(state) { memory[id] = state; window.location.hash = 'ep01-02'; } });
    } else {
      mounted = window.Episode02.mount({ initialState: memory[id], sourceState: memory['ep01-01'] });
    }
    app.querySelector('h1')?.focus();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
