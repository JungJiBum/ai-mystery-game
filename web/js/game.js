(() => {
  'use strict';
  const story = window.STORY, assets = window.ASSETS, model = window.GameState;
  const key = `ai-story:${story.id}:v2`, legacyKey = `ai-story:${story.id}:v1`;
  const app = document.querySelector('#app'), dialog = document.querySelector('#detail');
  let state = model.fresh(), selected = [], storageOK = true, detailReturn = null, zoom = 1;
  let migrated = false;
  try {
    const current = localStorage.getItem(key), previous = current === null ? localStorage.getItem(legacyKey) : null;
    try { state = model.normalize(JSON.parse(current ?? previous), current === null && previous !== null); }
    catch { state = model.fresh(); }
    migrated = current === null && previous !== null;
  } catch { storageOK = false; }
  let resume = state.scene !== 'start';
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { storageOK = false; }
    document.querySelectorAll('.save-note').forEach(el => { el.textContent = storageMessage(); });
  }
  if (migrated) save();
  function storageMessage() { return storageOK ? '이 브라우저에 자동 저장됩니다.' : '저장 공간을 사용할 수 없습니다. 현재 창에서 계속 플레이할 수 있습니다.'; }
  const esc = text => String(text).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const quote = id => story.quotes[id];
  function announce(text) { document.querySelector('#announcement').textContent = text; }
  function assetAlt(id) { const asset = assets[id]; return asset.quote ? `${asset.label}. ${quote(asset.quote)}` : asset.alt; }
  function media(id, className = '') {
    const asset = assets[id];
    return `<span class="media ${className}" data-asset="${id}">${asset.ready ? `<img src="assets/images/ep01-01/${esc(asset.file)}" alt="${esc(assetAlt(id))}" draggable="false">` : ''}<span class="asset-placeholder" ${asset.ready ? 'hidden' : ''}><span class="placeholder-mark" aria-hidden="true">＋</span><span>${esc(asset.label)}</span><small>이미지 준비 중</small></span></span>`;
  }
  function bindImages(root) {
    root.querySelectorAll('.media img').forEach(img => {
      const fail = () => { img.hidden = true; const fallback = img.parentElement.querySelector('.asset-placeholder'); fallback.hidden = false; fallback.querySelector('small').textContent = '이미지를 불러올 수 없습니다'; };
      img.addEventListener('error', fail, { once: true });
      if (img.complete && !img.naturalWidth) fail();
    });
  }
  function collect(id) { if (!state.found.includes(id)) { state.found.push(id); announce(`증거 수집: ${story.evidence[id].title}`); } }
  function move(scene) {
    state.scene = scene; state.inspection = null; selected = []; save(); render();
    app.querySelector('h1')?.focus();
    window.scrollTo(0, 0);
  }
  function inspect(kind, source = 'scene') {
    detailReturn = { kind, source };
    if (kind === 'back') { state.photoFace = 'back'; kind = 'photo'; }
    state.inspection = kind; zoom = 1;
    if (kind === 'photo') collect('photo');
    if (kind === 'usb') collect('usb');
    save(); render(); renderDetail(); dialog.showModal();
    document.querySelector('#close-detail').focus();
  }
  function renderDetail() {
    const kind = state.inspection, body = document.querySelector('#detail-body');
    const titles = { photo: '가족사진', note: '접힌 쪽지', usb: '검은색 USB' };
    document.querySelector('#detail-title').textContent = titles[kind];
    document.querySelector('#detail-kind').textContent = {photo:'PHOTOGRAPH / 양면 조사',note:'FOLDED NOTE / 펼쳐 보기',usb:'USB / 외관 관찰'}[kind];
    if (kind === 'photo') {
      const back = state.photoFace === 'back';
      body.innerHTML = `<p class="inspection-instruction">사진을 누르거나 아래 버튼으로 뒤집어 보세요.</p><button id="photo-object" class="photo-object ${back ? 'is-back' : ''}" aria-label="${back ? '사진 앞면 보기' : '사진 뒤집어 뒷면 보기'}" aria-describedby="photo-caption" aria-pressed="${back}"><span class="photo-turn"><span class="photo-face photo-front" aria-hidden="${back}">${media('photoFront')}</span><span class="photo-face photo-back" aria-hidden="${!back}">${media('photoBack')}<span class="surface-quote" aria-hidden="true">${esc(quote('back'))}</span></span></span></button><p id="photo-caption" class="object-caption">${back ? esc(quote('back')) : esc(story.evidence.photo.description)}</p><button id="flip-photo" class="secondary">${back ? '앞면으로 뒤집기' : '뒷면으로 뒤집기'}</button><p class="muted">현재 ${back ? '뒷면' : '앞면'} · 양면을 번갈아 확인할 수 있습니다.</p>`;
      const flip = () => {
        state.photoFace = state.photoFace === 'front' ? 'back' : 'front';
        if (state.photoFace === 'back') collect('back');
        save(); render();
        const back = state.photoFace === 'back', object = document.querySelector('#photo-object');
        object.classList.toggle('is-back', back); object.setAttribute('aria-pressed', String(back));
        object.setAttribute('aria-label', back ? '사진 앞면 보기' : '사진 뒤집어 뒷면 보기');
        object.querySelector('.photo-front').setAttribute('aria-hidden', String(back));
        object.querySelector('.photo-back').setAttribute('aria-hidden', String(!back));
        document.querySelector('#photo-caption').textContent = back ? quote('back') : story.evidence.photo.description;
        document.querySelector('#flip-photo').textContent = back ? '앞면으로 뒤집기' : '뒷면으로 뒤집기';
        body.querySelector('.muted').textContent = `현재 ${back ? '뒷면' : '앞면'} · 양면을 번갈아 확인할 수 있습니다.`;
      };
      body.querySelector('#photo-object').onclick = flip; body.querySelector('#flip-photo').onclick = flip;
    } else if (kind === 'note') {
      body.innerHTML = `<p class="inspection-instruction">접힌 부분을 눌러 안쪽을 확인하세요.</p><button id="note-object" class="note-object ${state.noteOpen ? 'is-open' : ''}" aria-expanded="${state.noteOpen}" aria-controls="note-transcript" aria-label="${state.noteOpen ? '쪽지 다시 접기' : '쪽지 펼치기'}"><span class="note-folded" ${state.noteOpen ? 'hidden' : ''}>${media('noteFolded')}</span><span class="note-unfolded" ${state.noteOpen ? '' : 'hidden'}>${media('noteOpen')}<span class="surface-quote" aria-hidden="true">${esc(quote('note'))}</span></span><span class="note-flap" aria-hidden="true"></span></button><div id="note-transcript" ${state.noteOpen ? '' : 'hidden'}><p class="object-caption">${esc(quote('note'))}</p></div><button id="unfold-note" class="secondary">${state.noteOpen ? '쪽지 다시 접기' : '쪽지 펼치기'}</button><p class="muted">읽은 내용은 쪽지를 다시 접어도 인벤토리에 남습니다.</p>`;
      const toggle = () => {
        state.noteOpen = !state.noteOpen;
        if (state.noteOpen) collect('note');
        save(); render();
        const object = body.querySelector('#note-object');
        object.classList.toggle('is-open', state.noteOpen); object.setAttribute('aria-expanded', String(state.noteOpen));
        object.setAttribute('aria-label', state.noteOpen ? '쪽지 다시 접기' : '쪽지 펼치기');
        body.querySelector('.note-folded').hidden = state.noteOpen;
        body.querySelector('.note-unfolded').hidden = !state.noteOpen;
        body.querySelector('#note-transcript').hidden = !state.noteOpen;
        body.querySelector('#unfold-note').textContent = state.noteOpen ? '쪽지 다시 접기' : '쪽지 펼치기';
      };
      body.querySelector('#note-object').onclick = toggle; body.querySelector('#unfold-note').onclick = toggle;
    } else {
      body.innerHTML = `<p class="inspection-instruction">확대한 이미지를 마우스나 손가락으로 드래그해 살펴보세요. 스크롤바도 사용할 수 있습니다.</p><div id="usb-viewport" class="usb-viewport" tabindex="0" role="region" aria-label="USB 확대 관찰 영역. 드래그로 이동하거나 화살표 키와 스크롤바로 스크롤"><div id="usb-object" class="usb-object">${media('usb')}</div></div><div class="zoom-controls"><button id="zoom-out" class="secondary" aria-label="USB 축소">−</button><output id="zoom-value" aria-live="polite">100%</output><button id="zoom-in" class="secondary" aria-label="USB 확대">＋</button><button id="zoom-reset" class="quiet">원래 크기</button></div><p class="object-caption">${esc(story.evidence.usb.description)}</p><p class="muted">${esc(story.evidence.usb.hint)}</p>`;
      const viewport = body.querySelector('#usb-viewport');
      const object = body.querySelector('#usb-object');
      let drag = null;
      function stopDrag(event) {
        if (!drag || (event?.pointerId !== undefined && event.pointerId !== drag.id)) return;
        const id = drag.id;
        drag = null;
        viewport.classList.remove('is-dragging');
        if (object.hasPointerCapture(id)) object.releasePointerCapture(id);
      }
      // 이미지 영역에만 연결해 네이티브 스크롤바의 드래그는 가로채지 않는다.
      object.addEventListener('pointerdown', event => {
        if (zoom <= 1 || drag || event.isPrimary === false || event.button !== 0) return;
        event.preventDefault();
        viewport.focus({ preventScroll: true });
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        object.setPointerCapture(event.pointerId);
        viewport.classList.add('is-dragging');
      });
      object.addEventListener('pointermove', event => {
        if (!drag || event.pointerId !== drag.id) return;
        event.preventDefault();
        viewport.scrollLeft += drag.x - event.clientX;
        viewport.scrollTop += drag.y - event.clientY;
        // 경계에서도 마지막 포인터 위치를 갱신해 반대 방향 이동이 즉시 반영된다.
        drag.x = event.clientX;
        drag.y = event.clientY;
      });
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) object.addEventListener(type, stopDrag);
      object.addEventListener('dragstart', event => event.preventDefault());
      object.addEventListener('selectstart', event => event.preventDefault());
      window.addEventListener('blur', stopDrag);
      dialog.addEventListener('close', () => {
        stopDrag();
        window.removeEventListener('blur', stopDrag);
      }, { once: true });
      function scale(value) {
        stopDrag();
        const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth;
        const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight;
        zoom = Math.max(1, Math.min(3, value));
        object.style.width = `${zoom * 100}%`; object.style.height = `${zoom * 100}%`;
        viewport.classList.toggle('is-zoomed', zoom > 1);
        body.querySelector('#zoom-value').textContent = `${Math.round(zoom * 100)}%`;
        body.querySelector('#zoom-out').disabled = zoom === 1; body.querySelector('#zoom-in').disabled = zoom === 3;
        // 확대 전 보고 있던 위치를 유지해 물건이 화면 밖으로 밀려나지 않게 한다.
        viewport.scrollLeft = zoom === 1 ? 0 : centerX * viewport.scrollWidth - viewport.clientWidth / 2;
        viewport.scrollTop = zoom === 1 ? 0 : centerY * viewport.scrollHeight - viewport.clientHeight / 2;
      }
      body.querySelector('#zoom-in').onclick = () => scale(zoom + .5);
      body.querySelector('#zoom-out').onclick = () => scale(zoom - .5);
      body.querySelector('#zoom-reset').onclick = () => scale(1); scale(1);
    }
    bindImages(body);
  }
  function inventory() {
    return `<aside class="inventory"><div class="section-head"><h2>수집한 증거</h2><span>${state.found.length} / 4</span></div><p class="muted">썸네일을 눌러 다시 조사하세요.</p><div class="evidence-list">${Object.entries(story.evidence).map(([id, item], i) => {
      const found = state.found.includes(id);
      return `<button class="evidence ${found ? 'collected' : ''}" data-evidence="${id}" ${found ? '' : 'disabled'}>${found ? media(item.asset, 'thumbnail') : '<span class="unknown-thumb" aria-hidden="true">?</span>'}<span><small>0${i + 1} / ${item.tag}</small><strong>${found ? esc(item.title) : '미발견 증거'}</strong></span><span aria-hidden="true">${found ? '↗' : '—'}</span></button>`;
    }).join('')}</div><p class="save-note">${storageMessage()}</p>${state.completed ? '<p class="completed-label">EP01-01 완료 기록 저장됨</p><button id="return-complete" class="quiet">완료 화면으로 돌아가기 →</button>' : ''}</aside>`;
  }
  function deduction() {
    const ready = state.found.length === 4;
    return `<section class="deduction"><p class="eyebrow">CONNECT THE EVIDENCE</p><h2>${story.deduction.title}</h2><p>${ready ? story.deduction.text : '사진 앞·뒷면, 쪽지 안쪽, USB를 모두 조사하면 단서를 연결할 수 있습니다.'}</p>${ready ? `<fieldset><legend>연결할 증거 두 개</legend>${Object.entries(story.evidence).map(([id, item]) => `<label class="clue-choice"><input type="checkbox" value="${id}" ${selected.includes(id) ? 'checked' : ''}><span>${esc(item.title)}${item.quote ? `<small>${esc(quote(item.quote))}</small>` : ''}</span></label>`).join('')}</fieldset><button id="deduce" class="secondary">단서 연결하기</button><p id="feedback" role="status"></p>` : ''}<div id="article-action">${state.unlocked ? '<button id="article" class="primary">12년 전 화재 기사 찾아보기 →</button>' : ''}</div></section>`;
  }
  function render() {
    document.querySelector('#reset').hidden = state.scene === 'start';
    app.dataset.scene = resume ? 'start' : state.scene;
    if (state.scene === 'start' || resume) {
      app.innerHTML = `<section class="intro"><div class="intro-copy"><p class="eyebrow">A STORY YOU INVESTIGATE</p><h1 tabindex="-1">누군가,<br>기록을 보냈다.</h1><p class="chapter">EP01-01 <span>${story.title}</span></p><p class="lead">${esc(story.intro)}</p><button id="start" class="primary">${resume ? '이어서 조사하기' : '게임 시작'} <span>→</span></button><p class="micro">물건을 살피고, 기록을 연결하는 짧은 추리 체험</p><p class="save-note">${storageMessage()}</p></div><div class="intro-art">${media('cover')}<p class="art-caption">EP01-01 / SENDER UNKNOWN</p></div></section>`;
      document.querySelector('#start').onclick = () => {
        resume = false;
        if (state.scene === 'start') move('doorstep');
        else {
          const inspection = state.inspection; render(); app.querySelector('h1')?.focus();
          if (inspection) inspect(inspection);
        }
      };
    } else if (state.scene === 'article') {
      app.innerHTML = `<section class="ending"><p class="eyebrow">04 / 기록 확인</p><h1 tabindex="-1">12년 전의 기록을 찾았다.</h1><article class="newspaper"><p class="paper-label">ARCHIVE / 12 YEARS AGO</p><h2>${story.article.title}</h2><div class="paper-rule"></div><p>${story.article.body}</p><small>게임 속 기사 요약 · 실제 보도 자료가 아닙니다</small></article><p class="lead">${story.article.after}</p><button id="finish" class="primary">기사 확인 · 조사 마치기 →</button></section>`;
      document.querySelector('#finish').onclick = () => { state.articleRead = true; state.completed = true; move('complete'); };
    } else if (state.scene === 'complete') {
      app.innerHTML = `<section class="completion"><p class="eyebrow">CASE FILE / EP01-01</p><span class="completion-seal" aria-hidden="true">✓</span><h1 tabindex="-1">${story.completion.title}</h1><p class="lead">${story.completion.text}</p><dl class="completion-summary"><div><dt>조사한 증거</dt><dd>4 / 4</dd></div><div><dt>확인한 기록</dt><dd>12년 전 연구소 화재 기사</dd></div><div><dt>검은색 USB</dt><dd>미연결</dd></div></dl><p class="muted">이번 에피소드는 여기까지입니다. 다음 회차는 아직 제공되지 않습니다.</p><p class="save-note">${storageMessage()}</p><div class="end-actions"><button id="review" class="secondary">증거 다시 살펴보기</button><button id="replay" class="quiet">처음부터 다시 플레이</button></div></section>`;
      document.querySelector('#review').onclick = () => move('parcel');
      document.querySelector('#replay').onclick = () => document.querySelector('#restart-dialog').showModal();
    } else {
      const scene = story.scenes[state.scene];
      app.innerHTML = `<section class="investigation"><div class="scene"><nav class="scene-steps" aria-label="조사 진행"><span ${state.scene === 'doorstep' ? 'aria-current="step"' : ''}>01 현관</span><span ${state.scene === 'room' ? 'aria-current="step"' : ''}>02 실내</span><span ${state.scene === 'parcel' ? 'aria-current="step"' : ''}>03 택배 내부</span></nav><p class="eyebrow">${scene.label}</p><h1 tabindex="-1">${scene.title}</h1><p class="scene-text">${scene.text}</p><div class="scene-stage">${media(scene.asset, 'scene-background')}${state.scene === 'parcel' ? `<div class="hotspots" aria-label="상자 안 조사 대상">${[['photo', '가족사진'], ['note', '접힌 쪽지'], ['usb', '검은색 USB']].map(([id, name], i) => `<button class="hotspot hotspot-${id}" data-inspect="${id}"><span aria-hidden="true">0${i + 1}</span> ${name} 조사</button>`).join('')}</div>` : ''}</div>${state.scene === 'doorstep' ? '<button id="enter-room" class="primary">택배를 들고 실내로 →</button>' : state.scene === 'room' ? '<button id="open-parcel" class="primary">택배 상자 열기 →</button>' : `<div class="objects">${[['photo', 'photoFront', '가족사진'], ['note', state.noteOpen ? 'noteOpen' : 'noteFolded', '접힌 쪽지'], ['usb', 'usb', '검은색 USB']].map(([id, asset, name]) => `<button class="object" data-inspect="${id}">${media(asset, 'object-thumb')}<strong>${name}</strong><span>${id === 'photo' ? '앞·뒷면 살펴보기' : id === 'note' ? '접힌 부분 펼치기' : '확대해서 관찰하기'} ↗</span></button>`).join('')}</div>${deduction()}`}</div>${inventory()}</section>`;
      document.querySelector('#enter-room')?.addEventListener('click', () => move('room'));
      document.querySelector('#open-parcel')?.addEventListener('click', () => move('parcel'));
      document.querySelectorAll('[data-inspect]').forEach(button => { button.onclick = () => inspect(button.dataset.inspect); });
      document.querySelectorAll('[data-evidence]').forEach(button => {
        button.onclick = () => {
          const id = button.dataset.evidence;
          if (id === 'photo') state.photoFace = 'front';
          if (id === 'note') state.noteOpen = true;
          inspect(id, 'inventory');
        };
      });
      document.querySelector('#return-complete')?.addEventListener('click', () => move('complete'));
      document.querySelectorAll('input[type=checkbox]').forEach(input => { input.onchange = () => {
        if (app.querySelectorAll('input:checked').length > 2) { input.checked = false; announce('증거는 두 개까지 선택할 수 있습니다.'); }
        selected = [...app.querySelectorAll('input:checked')].map(el => el.value);
      }; });
      document.querySelector('#deduce')?.addEventListener('click', () => {
        // 쪽지를 다시 접었더라도 읽었다는 수집 기록은 유효하다.
        const correct = model.isCorrect(state, selected, story.deduction.pair);
        if (correct) { state.unlocked = true; save(); }
        document.querySelector('#feedback').textContent = selected.length !== 2 ? '연결할 증거를 두 개 선택해 주세요.' : correct ? story.deduction.success : story.deduction.failure;
        if (correct && !document.querySelector('#article')) {
          document.querySelector('#article-action').innerHTML = '<button id="article" class="primary">12년 전 화재 기사 찾아보기 →</button>';
          document.querySelector('#article').onclick = () => move('article');
        }
      });
      document.querySelector('#article')?.addEventListener('click', () => move('article'));
    }
    bindImages(app);
  }
  dialog.addEventListener('close', () => {
    state.inspection = null; save();
    if (!detailReturn) return;
    const kind = detailReturn.kind, source = detailReturn.source;
    const selector = source === 'inventory' ? `[data-evidence="${kind}"]` : `[data-inspect="${kind}"]`;
    (app.querySelector(selector) || app.querySelector('[data-inspect="photo"]'))?.focus();
  });
  document.querySelector('#close-detail').onclick = () => dialog.close();
  const restart = document.querySelector('#restart-dialog');
  document.querySelector('#reset').onclick = () => restart.showModal();
  document.querySelector('#cancel-reset').onclick = () => restart.close();
  document.querySelector('#confirm-reset').onclick = () => {
    restart.close(); if (dialog.open) dialog.close(); state = model.fresh(); resume = false; selected = []; detailReturn = null;
    try { localStorage.removeItem(legacyKey); } catch { storageOK = false; }
    save(); render(); app.querySelector('h1')?.focus(); window.scrollTo(0, 0);
  };
  render();
})();
