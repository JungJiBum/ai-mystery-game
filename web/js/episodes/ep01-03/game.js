window.Episode03 = { mount({ initialState, sourceState } = {}) {
  const story = window.EP03_STORY, model = window.Episode03State, store = window.EpisodeStorage;
  const app = document.querySelector('#app'), restart = document.querySelector('#restart-dialog');
  const loaded = store.loadEpisode03({ memory: initialState, source: sourceState });
  let state = loaded.state, storageOK = loaded.available, resume = loaded.resumed && !initialState;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const q = id => esc(story.quotes[id]);
  const saveText = () => storageOK ? 'EP01-03 진행 상황이 이 브라우저에 자동 저장됩니다.' : '저장 공간을 사용할 수 없습니다. 현재 페이지에서는 계속 조사할 수 있습니다.';
  const button = (action, text, cls = 'primary', extra = '') => `<button type="button" data-action="${action}" class="${cls}" ${extra}>${text}</button>`;
  function save() { storageOK = store.writeEpisode03(state); }
  function refresh(focus = 'h1') { render(); app.querySelector(focus)?.focus(); }
  function move(scene) { state.scene = model.permittedScene(state, scene); save(); refresh(); window.scrollTo(0, 0); }
  function record(action, value) { state = model.record(state, action, value); save(); }
  function feedback(text) { app.querySelector('#ep3-feedback').textContent = text; }
  function options(items) { return '<option value="">자료 선택</option>' + items.map(([id, text]) => `<option value="${id}">${esc(text)}</option>`).join(''); }
  function press() {
    return `<article class="ep3-document"><p class="eyebrow">당시 공식 보도자료</p><h2>사고 관련 내부 기록</h2><blockquote>${q('press')}</blockquote></article><form id="ep3-press-form"><fieldset><legend>이 문서만으로 아직 알 수 없는 것은?</legend><label class="clue-choice"><input type="radio" name="fact" value="preserved" required><span>원본을 보존 규정에 따라 관리 중이라고 발표했는가.</span></label><label class="clue-choice"><input type="radio" name="fact" value="locationUnknown"><span>원본을 구체적으로 어디에 보관하고 있는가.</span></label></fieldset><button class="primary" type="submit">확인한 내용 기록하기 →</button></form>`;
  }
  function inquiry() {
    const form = `<details class="ep3-source"><summary>문의에 사용할 기존 자료 열기</summary><h2>${esc(window.STORY.article.title)}</h2><p>${esc(window.STORY.article.body)}</p><p>사고 시점: 12년 전 · 조사 대상: 기사 속 연구소</p><h3>당시 보도자료</h3><blockquote>${q('press')}</blockquote></details><form id="ep3-inquiry-form"><div class="ep3-fields"><label>사고 시점의 근거<select name="period" required>${options(story.inquiry.period)}</select></label><label>시설 관련 정보<select name="facility" required>${options(story.inquiry.facility)}</select></label><label>문의할 기록 명칭<select name="record" required>${options(story.inquiry.record)}</select></label></div><p class="muted">게임 안의 문의입니다. 입력 내용은 외부에 전송되지 않습니다.</p><button type="submit" class="primary">보존 여부 문의하기 →</button></form>`;
    const reply = `<article class="ep3-document"><p class="eyebrow">보존 여부 문의 / 답변</p><h2>명칭 조회 결과</h2><blockquote>${q('reply')}</blockquote></article><form id="ep3-reply-form"><fieldset><legend>답변이 확인해 준 범위는?</legend><label class="clue-choice"><input type="radio" name="scope" value="destroyed" required><span>사고 관련 기록이 폐기되었다.</span></label><label class="clue-choice"><input type="radio" name="scope" value="nameOnly"><span>요청한 명칭으로 관리 중인 기록을 확인하지 못했다.</span></label><label class="clue-choice"><input type="radio" name="scope" value="missing"><span>어떤 이름으로도 기록은 존재하지 않는다.</span></label></fieldset><button class="primary" type="submit">답변 범위를 기록하고 문서 비교하기 →</button></form>`;
    return state.requestSent ? reply : form;
  }
  function comparison() {
    return `<p class="muted">두 자료에서 작성 시점과 구역 표기를 각각 눌러 표시하세요.</p><div class="ep3-comparison">${Object.entries(story.documents).map(([id, doc]) => `<article class="ep3-document"><p class="eyebrow">시설 자료 / ${id === 'before' ? 'A' : 'B'}</p><h2>${esc(doc.title)}</h2><dl><dt>작성 시점</dt><dd>${button('mark', esc(doc.period), 'ep3-mark', `data-mark="${id}Period" aria-pressed="${state.marks.includes(id + 'Period')}"`)}</dd><dt>구역 명칭 및 분류 코드</dt><dd>${button('mark', q(doc.quote), 'ep3-mark ep3-code', `data-mark="${id}Code" aria-pressed="${state.marks.includes(id + 'Code')}"`)}</dd></dl><p class="ep3-mark-status">${state.marks.includes(id + 'Period') && state.marks.includes(id + 'Code') ? '시점과 구역 표기 기록됨' : '작성 시점과 구역 표기를 확인하세요.'}</p></article>`).join('')}</div><p class="muted" role="status">확인한 항목 ${state.marks.length} / 4</p>${button('compare', '선택한 시점과 코드 비교하기', 'secondary', state.marks.length !== 4 ? 'disabled' : '')}${state.comparisonReviewed ? `<section class="ep3-reading" role="status"><h2>문서 간 차이</h2><blockquote>${q('comparison')}</blockquote><p>명칭과 코드가 달라졌다. 같은 공간을 가리키는지는 아직 확인되지 않았다.</p>${button('deduction', '수집한 증거 연결하기 →')}</section>` : ''}`;
  }
  function deduction() {
    return `<form id="ep3-deduction-form"><fieldset><legend>조사 방향을 함께 뒷받침하는 증거 세 개를 선택하세요.</legend>${Object.entries(story.clues).map(([id, clue]) => `<label class="clue-choice"><input type="checkbox" name="evidence" value="${id}"><span>${esc(clue.title)}<small>${q(clue.quote)}</small></span></label>`).join('')}</fieldset><fieldset><legend>이 자료들로 세울 수 있는 조사 방향은?</legend>${story.hypotheses.map(([id, text]) => `<label class="clue-choice"><input type="radio" name="hypothesis" value="${id}" required><span>${esc(text)}</span></label>`).join('')}</fieldset><button class="secondary" type="submit">증거와 조사 가설 연결하기</button></form>${state.deduced ? `<section class="ep3-reading" role="status"><h2>확인된 사실에서 조사 가설로</h2><p>${esc(story.deduction.success)}</p>${button('final', '기록을 정리하고 쪽지 다시 보기 →')}</section>` : ''}`;
  }
  function finalScene() {
    return `${button('note', '택배 속 쪽지 다시 펼치기', 'secondary', `aria-expanded="${state.noteRead}" aria-controls="ep3-note"`)}${state.noteRead ? `<section id="ep3-note" class="ep3-document"><p class="eyebrow">택배 속 쪽지</p><blockquote>${q('note')}</blockquote></section><p>누군가 자신에게 직접 기록을 추적하도록 유도한 것은 아닐까.</p><form id="ep3-search-form"><label for="ep3-query">다음으로 조사할 분류 코드</label><div class="ep3-query"><input id="ep3-query" name="query" type="search" autocomplete="off" required><button class="primary" type="submit">검색 →</button></div></form>` : ''}`;
  }
  function sidebar() {
    return `<aside class="inventory ep3-inventory"><div class="section-head"><h2>이번 회차의 증거</h2><span>${state.found.length} / 5</span></div>${Object.entries(story.clues).map(([id, item]) => state.found.includes(id) ? `<details class="ep3-evidence"><summary>${esc(item.title)}</summary><blockquote>${q(item.quote)}</blockquote></details>` : '<p class="ep3-undiscovered">미발견 증거</p>').join('')}<details class="ep3-source"><summary>EP01-02에서 이어받은 기록</summary><p>EP01-02 완료 · 공식 보도자료 확인</p><ul>${state.inherited.found.map(id => `<li>${esc(window.EP02_STORY.clues[id].title)}</li>`).join('')}</ul><p>USB는 미확인 상태로 남아 있다.</p></details><p class="save-note">${saveText()}</p>${state.completed ? button('complete', 'EP01-03 완료 화면으로 →', 'quiet') : ''}</aside>`;
  }
  function render() {
    app.dataset.episode = 'ep01-03'; app.dataset.scene = state?.scene || 'locked';
    document.querySelector('#reset').hidden = !state;
    if (!state) { app.innerHTML = '<section class="completion"><p class="eyebrow">EP01-03</p><h1 tabindex="-1">EP01-02 완료 후 시작할 수 있습니다.</h1><p class="lead">이전 회차에서 조사한 기록이 필요합니다.</p><a class="primary ep2-link" href="#ep01-02">EP01-02로 돌아가기 →</a></section>'; return; }
    if (resume) { app.innerHTML = `<section class="completion"><p class="eyebrow">EP01-03 / CONTINUE</p><h1 tabindex="-1">${story.title}</h1><p class="lead">확인한 증거 ${state.found.length} / 5</p>${button('resume', 'EP01-03 이어서 조사하기 →')}<p class="save-note">${saveText()}</p></section>`; return; }
    if (state.scene === 'complete') {
      app.innerHTML = `<section class="completion episode-three"><p class="eyebrow">CASE FILE / EP01-03</p><span class="completion-seal" aria-hidden="true">✓</span><h1 tabindex="-1">${story.completion.title}</h1><p class="lead">D-03 검색 결과가 나타나기 시작했다.</p><p>${esc(story.completion.text)}</p><ul class="ep3-summary">${Object.entries(story.clues).map(([, item]) => `<li>${esc(item.title)}<blockquote>${q(item.quote)}</blockquote></li>`).join('')}</ul><p class="ep2-next-hint">${esc(story.completion.next)}</p><p class="muted">EP01-04는 아직 제공되지 않습니다. USB 내용과 택배 발신인은 알 수 없습니다.</p><p class="save-note">${saveText()}</p><div class="end-actions">${button('review', 'EP01-03 기록 다시 살펴보기', 'secondary')}<a class="quiet ep2-link" href="#ep01-02">EP01-02로 돌아가기</a></div></section>`; return;
    }
    const scene = story.scenes[state.scene];
    app.innerHTML = `<section class="investigation episode-three"><div class="scene"><nav class="ep2-steps" aria-label="EP01-03 조사 단계">${Object.entries(story.scenes).map(([id, item]) => `<button type="button" data-action="scene" data-scene="${id}" ${model.permittedScene(state, id) !== id ? 'disabled' : ''} ${state.scene === id ? 'aria-current="step"' : ''}>${esc(item.label)}</button>`).join('')}</nav><p class="eyebrow">EP01-03 / ${esc(scene.label)}</p><h1 tabindex="-1">${esc(scene.title)}</h1><p class="scene-text">${esc(scene.text)}</p>${({ press, inquiry, comparison, deduction, final: finalScene })[state.scene]()}<p id="ep3-feedback" role="status" aria-live="polite"></p></div>${sidebar()}</section>`;
  }
  function click(event) {
    const target = event.target.closest('[data-action]');
    if (!target || !app.contains(target) || target.disabled) return;
    const action = target.dataset.action;
    if (action === 'resume') { resume = false; refresh(); }
    else if (action === 'scene') move(target.dataset.scene);
    else if (action === 'mark') { record('mark', target.dataset.mark); refresh(`[data-mark="${target.dataset.mark}"]`); }
    else if (action === 'compare') { record('compare'); refresh('[data-action="deduction"]'); }
    else if (action === 'note') { record('readNote'); refresh('#ep3-query'); }
    else if (action === 'review') move('press');
    else if (['deduction', 'final', 'complete'].includes(action)) move(action);
  }
  function submit(event) {
    const form = event.target;
    if (!form.id.startsWith('ep3-')) return;
    event.preventDefault();
    const value = name => form.querySelector(`[name="${name}"]:checked`)?.value || form.querySelector(`[name="${name}"]`)?.value;
    if (form.id === 'ep3-press-form') {
      if (value('fact') !== 'locationUnknown') { feedback('보존 관리 중이라는 발표는 문서에 있다. 아직 구체적으로 확인하지 못한 내용을 골라 보자.'); return; }
      record('readPress', value('fact')); move('inquiry');
    } else if (form.id === 'ep3-inquiry-form') {
      const values = Object.fromEntries(['period', 'facility', 'record'].map(name => [name, value(name)]));
      if (!model.validInquiry(values)) { feedback('문의 대상과 선택한 자료가 맞지 않는다. 화재 기사와 보도자료에서 사고 시점, 시설, 기록 명칭을 다시 확인해 보자.'); return; }
      record('sendInquiry', values); refresh('#ep3-reply-form input');
    } else if (form.id === 'ep3-reply-form') {
      if (value('scope') !== 'nameOnly') { feedback('답변은 요청한 명칭을 기준으로 했다. 폐기나 모든 기록의 부존재까지 확인한 답변일까?'); return; }
      record('analyzeReply', value('scope')); move('comparison');
    } else if (form.id === 'ep3-deduction-form') {
      const selected = [...form.querySelectorAll('[name="evidence"]:checked')].map(input => input.value);
      if (!model.isCorrect(state, selected, value('hypothesis'))) { feedback(story.deduction.failure); return; }
      state = model.solve(state, selected, value('hypothesis')); save(); refresh('[data-action="final"]');
    } else if (form.id === 'ep3-search-form') {
      const next = model.finish(state, value('query'));
      if (!next.completed) { feedback('사고 후 자료에서 확인한 분류 코드를 입력해 보자.'); return; }
      state = next; save(); refresh(); window.scrollTo(0, 0);
    }
  }
  app.addEventListener('click', click); app.addEventListener('submit', submit);
  document.querySelector('#restart-title').textContent = 'EP01-03을 처음부터 시작할까요?';
  restart.querySelector('p').textContent = 'EP01-03 진행만 초기화합니다. 다른 회차 저장과 이어받은 기록은 유지합니다.';
  document.querySelector('#reset').onclick = () => restart.showModal();
  document.querySelector('#cancel-reset').onclick = () => restart.close();
  document.querySelector('#confirm-reset').onclick = () => { restart.close(); const result = store.resetEpisode03(state); state = result.state; storageOK = result.available; resume = false; refresh(); window.scrollTo(0, 0); };
  if (state && !loaded.resumed) save();
  render();
  return { getState: () => state ? JSON.parse(JSON.stringify(state)) : null, dispose() {
    app.removeEventListener('click', click); app.removeEventListener('submit', submit);
    if (restart.open) restart.close();
    for (const id of ['reset', 'cancel-reset', 'confirm-reset']) document.querySelector(`#${id}`).onclick = null;
  } };
} };
