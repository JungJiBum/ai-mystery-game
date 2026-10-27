window.Episode02 = { mount({ initialState, sourceState } = {}) {
  const story = window.EP02_STORY, assets = window.EP02_ASSETS, model = window.Episode02State;
  const app = document.querySelector('#app'), restart = document.querySelector('#restart-dialog');
  const loaded = window.EpisodeStorage.loadEpisode02({ memory: initialState, source: sourceState });
  let state = loaded.state, storageOK = loaded.available, resume = loaded.resumed && !initialState, selected = [], openRecord = null;
  const esc = text => String(text).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const found = id => state.found.includes(id);
  const q = id => esc(story.quotes[id]);
  const storageMessage = () => storageOK ? 'EP01-02 진행 상황이 이 브라우저에 자동 저장됩니다.' : '저장 공간을 사용할 수 없습니다. 현재 페이지에서는 계속 조사할 수 있습니다.';
  function save() { storageOK = window.EpisodeStorage.writeEpisode02(state); }
  function focusTitle() { app.querySelector('h1')?.focus(); window.scrollTo(0, 0); }
  function record(action) { state = model.record(state, action); save(); }
  function move(scene) { state.scene = model.permittedScene(state, scene); selected = []; openRecord = null; save(); render(); focusTitle(); }
  function firePhoto() {
    const asset = assets.fire, crop = asset.crop;
    const style = `width:${asset.width / crop.width * 100}%;height:${asset.height / crop.height * 100}%;left:${-crop.x / crop.width * 100}%;top:${-crop.y / crop.height * 100}%`;
    return `<figure class="ep2-figure"><div class="ep2-media ep2-fire-photo" style="aspect-ratio:${crop.width} / ${crop.height}">${asset.ready ? `<img src="assets/images/ep01-02/${esc(asset.file)}" width="${asset.width}" height="${asset.height}" style="${style}" alt="${esc(asset.alt)}" draggable="false">` : ''}<div class="ep2-image-fallback" ${asset.ready ? 'hidden' : ''}><strong>${esc(asset.label)}</strong><span>사진을 표시할 수 없습니다</span></div></div><figcaption>${esc(asset.caption)}</figcaption></figure>`;
  }
  function familyPhoto() {
    const asset = window.ASSETS.photoFront;
    return `<figure class="ep2-figure"><div class="ep2-media">${asset.ready ? `<img src="assets/images/ep01-01/${esc(asset.file)}" alt="부모님과 주인공이 함께 찍힌 택배 속 가족사진">` : ''}<div class="ep2-image-fallback" ${asset.ready ? 'hidden' : ''}><strong>택배 속 가족사진</strong><span>이미지 준비 중</span></div></div><figcaption>택배 속 가족사진 / EP01-01</figcaption></figure>`;
  }
  function bindImages() {
    app.querySelectorAll('.ep2-media img').forEach(img => {
      const fail = () => { img.hidden = true; img.nextElementSibling.hidden = false; img.nextElementSibling.querySelector('span').textContent = '이미지를 불러올 수 없습니다'; };
      img.addEventListener('error', fail, { once: true }); if (img.complete && !img.naturalWidth) fail();
    });
  }
  function navigation() {
    return `<nav class="ep2-steps" aria-label="EP01-02 조사 단계">${Object.keys(story.scenes).map((scene, i) => `<button data-scene="${scene}" ${model.permittedScene(state, scene) !== scene ? 'disabled' : ''} ${state.scene === scene ? 'aria-current="step"' : ''}>0${i + 1} ${['기사', '사진 비교', '검색', '보도자료', '단서 연결'][i]}</button>`).join('')}</nav>`;
  }
  function sidebar() {
    return `<aside class="inventory ep2-inventory"><div class="section-head"><h2>이번 회차의 단서</h2><span>${state.found.length} / 4</span></div>${Object.entries(story.clues).map(([id, item], i) => `<button class="evidence ${found(id) ? 'collected' : ''}" data-clue="${id}" ${found(id) ? '' : 'disabled'}><span class="record-no">0${i + 1}</span><span>${found(id) ? esc(item.title) : '미발견 단서'}</span><span aria-hidden="true">${found(id) ? '↗' : '—'}</span></button>`).join('')}${openRecord ? `<section class="ep2-record" aria-label="수집한 단서 상세"><h3>${esc(story.clues[openRecord].title)}</h3><blockquote>${q(story.clues[openRecord].quote)}</blockquote><button id="close-record" class="quiet">단서 상세 닫기</button></section>` : ''}<details class="ep2-inherited"><summary>EP01-01에서 이어받은 기록</summary><p>EP01-01 완료 · 화재 기사 확인</p><ul>${state.inherited.found.map(id => `<li>${esc(window.STORY.evidence[id].title)}</li>`).join('')}</ul><p>USB는 미확인 증거입니다. 컴퓨터에 연결하지 않았습니다.</p></details><p class="save-note">${storageMessage()}</p>${state.completed ? '<button id="ep2-return-complete" class="quiet">EP01-02 완료 화면으로 →</button>' : ''}</aside>`;
  }
  function sceneBody() {
    switch (state.scene) {
      case 'article': return `<article class="newspaper ep2-paper"><p class="paper-label">ARCHIVE / 12 YEARS AGO</p><h2>12년 전 연구소 화재 기사</h2>${firePhoto()}<p>당시 발표된 사고 경위</p><blockquote>${q('report')}</blockquote><p>${esc(story.articleNote)}</p></article><button id="read-article" class="primary">기사를 확인하고 사진 비교하기 →</button>`;
      case 'comparison': return `<div class="ep2-comparison">${familyPhoto()}${firePhoto()}</div><p class="scene-text">${esc(story.comparisonNote)}</p><button id="read-sign" class="secondary">가족사진 안내판 확대 판독</button>${found('sign') ? `<section class="ep2-reading" role="status"><p class="eyebrow">안내판 확대 판독</p><blockquote>${q('sign')}</blockquote><p>사고 기사 어디에도 기록실에 대한 설명은 없었다.</p></section><button id="go-search" class="primary">연구소와 기록실 검색하기 →</button>` : ''}`;
      case 'search': return `<section class="ep2-search"><p class="eyebrow">자료 검색</p><p class="ep2-search-scope">검색 대상 <strong>${esc(story.searchScope)}</strong></p><form id="search-form"><label for="search-query">함께 검색할 단어</label><div class="ep2-query-row"><input id="search-query" name="query" type="search" placeholder="안내판에서 읽은 단어" autocomplete="off" value="${state.searchDone ? '기록실' : ''}" aria-describedby="search-help"><button class="primary" type="submit">검색</button></div></form><p id="search-help" class="muted">기사 속 연구소와 입력한 단어를 함께 검색합니다. 게임 안의 자료만 조회합니다.</p><p id="search-feedback" role="status"></p>${state.searchDone ? `<section class="ep2-results"><p class="muted">오래된 채용 공고와 행사 안내 사이에 미리보기 한 줄이 남아 있었다.</p><blockquote>${q('trace')}</blockquote><button id="open-deleted" class="secondary">미리보기의 페이지 열기</button>${found('trace') ? '<p class="ep2-deleted" role="status">삭제된 주소입니다. 페이지를 열 수 없습니다.</p><p>남자는 기사와 사진, 검색 결과의 주소를 따로 저장했다. USB는 열지 않았다.</p><button id="go-press" class="primary">사고 당시 공식 보도자료 확인하기 →</button>' : ''}</section>` : ''}</section>`;
      case 'press': return `<article class="ep2-release"><p class="eyebrow">당시 공식 보도자료</p><h2>사고 관련 내부 기록</h2><p>자료 맨 아래의 문장</p><blockquote>${q('press')}</blockquote><p class="muted">보도자료의 발표 내용을 확인했습니다. 원본이 현재 어디에 있는지는 아직 알 수 없습니다.</p></article><button id="read-press" class="primary">보존 문구를 기록하고 단서 연결하기 →</button>`;
      case 'deduction': return `<section class="ep2-deduction"><fieldset><legend>연결할 단서 두 개를 선택하세요.</legend>${Object.entries(story.clues).map(([id, clue]) => `<label class="clue-choice"><input type="checkbox" value="${id}" ${selected.includes(id) ? 'checked' : ''}><span>${esc(clue.title)}<small>${q(clue.quote)}</small></span></label>`).join('')}</fieldset><button id="ep2-deduce" class="secondary">단서 연결하기</button><p id="ep2-feedback" role="status"></p><div id="ep2-finish-action"></div></section>`;
      default: return '';
    }
  }
  function render() {
    app.dataset.scene = state?.scene || 'locked'; app.dataset.episode = 'ep01-02';
    document.querySelector('#reset').hidden = !state;
    if (!state) {
      app.innerHTML = '<section class="completion"><p class="eyebrow">EP01-02 / 12년 전의 사고</p><h1 tabindex="-1">EP01-01 완료 후 시작할 수 있습니다.</h1><p class="lead">이전 회차의 검증된 완료 기록이 필요합니다. EP01-01에서 기사 확인 후 조사를 마쳐 주세요.</p><a class="primary ep2-link" href="#ep01-01">EP01-01로 돌아가기 →</a></section>';
      return;
    }
    if (resume) {
      app.innerHTML = `<section class="completion"><p class="eyebrow">EP01-02 / CONTINUE</p><h1 tabindex="-1">${story.title}</h1><p class="lead">이번 회차에서 확인한 단서 ${state.found.length} / 4</p><button id="ep2-resume" class="primary">EP01-02 이어서 조사하기 →</button><p class="save-note">${storageMessage()}</p></section>`;
      document.querySelector('#ep2-resume').onclick = () => { resume = false; render(); focusTitle(); }; return;
    }
    if (state.scene === 'complete') {
      app.innerHTML = `<section class="completion"><p class="eyebrow">CASE FILE / EP01-02</p><span class="completion-seal" aria-hidden="true">✓</span><h1 tabindex="-1">${story.completion.title}</h1><p class="lead">${esc(story.completion.text)}</p><p class="ep2-next-hint">${esc(story.completion.next)}</p><p class="muted">EP01-03은 아직 제공되지 않습니다. USB는 미확인 상태로 남아 있습니다.</p><p class="save-note">${storageMessage()}</p><div class="end-actions"><button id="ep2-review" class="secondary">EP01-02 기록 다시 살펴보기</button><a class="quiet ep2-link" href="#ep01-01">EP01-01로 돌아가기</a></div></section>`;
      document.querySelector('#ep2-review').onclick = () => move('article'); return;
    }
    const scene = story.scenes[state.scene];
    app.innerHTML = `<section class="investigation episode-two"><div class="scene">${navigation()}<p class="eyebrow">EP01-02 / ${scene.label}</p><h1 tabindex="-1">${scene.title}</h1><p class="scene-text">${esc(scene.text)}</p>${sceneBody()}</div>${sidebar()}</section>`;
    bindImages();
    app.querySelectorAll('[data-scene]').forEach(button => { button.onclick = () => move(button.dataset.scene); });
    app.querySelectorAll('[data-clue]').forEach(button => { button.onclick = () => { openRecord = button.dataset.clue; render(); app.querySelector('.ep2-record')?.scrollIntoView({ block: 'nearest' }); app.querySelector('#close-record')?.focus(); }; });
    app.querySelector('#close-record')?.addEventListener('click', () => { const id = openRecord; openRecord = null; render(); app.querySelector(`[data-clue="${id}"]`)?.focus(); });
    app.querySelector('#ep2-return-complete')?.addEventListener('click', () => move('complete'));
    app.querySelector('#read-article')?.addEventListener('click', () => { record('readArticle'); move('comparison'); });
    app.querySelector('#read-sign')?.addEventListener('click', () => { record('readSign'); render(); app.querySelector('.ep2-reading')?.scrollIntoView({ block: 'nearest' }); app.querySelector('#read-sign').focus(); });
    app.querySelector('#go-search')?.addEventListener('click', () => move('search'));
    app.querySelector('#search-form')?.addEventListener('submit', event => {
      event.preventDefault();
      if (!model.validQuery(app.querySelector('#search-query').value)) { app.querySelector('#search-feedback').textContent = '안내판에서 판독한 단어를 입력해 주세요.'; return; }
      record('search'); render(); app.querySelector('#open-deleted').focus();
    });
    app.querySelector('#open-deleted')?.addEventListener('click', () => { record('openDeleted'); render(); app.querySelector('#go-press').focus(); });
    app.querySelector('#go-press')?.addEventListener('click', () => move('press'));
    app.querySelector('#read-press')?.addEventListener('click', () => { record('readPress'); move('deduction'); });
    app.querySelectorAll('input[type=checkbox]').forEach(input => { input.onchange = () => {
      if (app.querySelectorAll('input:checked').length > 2) { input.checked = false; document.querySelector('#announcement').textContent = '단서는 두 개까지 선택할 수 있습니다.'; }
      selected = [...app.querySelectorAll('input:checked')].map(el => el.value);
    }; });
    app.querySelector('#ep2-deduce')?.addEventListener('click', () => {
      const correct = model.isCorrect(state, selected);
      app.querySelector('#ep2-feedback').textContent = selected.length !== 2 ? '연결할 단서를 두 개 선택해 주세요.' : correct ? story.deduction.success : story.deduction.failure;
      app.querySelector('#ep2-finish-action').replaceChildren();
      if (correct) {
        const button = document.createElement('button'); button.id = 'ep2-finish'; button.className = 'primary'; button.textContent = '기록을 정리하고 EP01-02 마치기 →';
        button.onclick = () => { state.completed = true; move('complete'); }; app.querySelector('#ep2-finish-action').append(button);
      }
    });
  }
  document.querySelector('#restart-title').textContent = 'EP01-02를 처음부터 시작할까요?';
  restart.querySelector('p').textContent = '이번 회차의 조사 진행만 초기화합니다. EP01-01 저장과 이어받은 기록은 유지합니다.';
  document.querySelector('#reset').onclick = () => restart.showModal();
  document.querySelector('#cancel-reset').onclick = () => restart.close();
  document.querySelector('#confirm-reset').onclick = () => {
    restart.close(); const result = window.EpisodeStorage.resetEpisode02(state); state = result.state; storageOK = result.available;
    resume = false; selected = []; openRecord = null; render(); focusTitle();
  };
  if (state && !loaded.resumed) save();
  render();
  return {
    getState: () => state ? JSON.parse(JSON.stringify(state)) : null,
    dispose() {
      if (restart.open) restart.close();
      for (const id of ['reset', 'cancel-reset', 'confirm-reset']) document.querySelector(`#${id}`).onclick = null;
    }
  };
} };
