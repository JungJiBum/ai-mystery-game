import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

function setup() {
  const app = { innerHTML: '', dataset: {}, querySelectorAll: () => [], querySelector: () => null };
  const node = () => ({ textContent: '', hidden: false, onclick: null });
  const paragraph = node();
  const dialog = { ...node(), open: false, querySelector: () => paragraph, close() { this.open = false; } };
  const nodes = { '#app': app, '#restart-dialog': dialog, '#reset': node(), '#restart-title': node(), '#cancel-reset': node(), '#confirm-reset': node() };
  const storage = { getItem: () => null, setItem() {} };
  const context = vm.createContext({ window: { localStorage: storage }, document: { querySelector: id => nodes[id] } });
  for (const file of ['story', 'assets', 'state', 'episodes/ep01-02/story', 'episodes/ep01-02/assets', 'episodes/ep01-02/state', 'storage', 'episodes/ep01-02/game']) {
    vm.runInContext(readFileSync(new URL(`../js/${file}.js`, import.meta.url), 'utf8'), context);
  }
  const w = context.window;
  const source = { scene: 'complete', found: ['photo', 'back', 'note', 'usb'], unlocked: true, articleRead: true, completed: true };
  function render(scene) {
    let state = w.Episode02State.fresh(source);
    for (const action of ['readArticle', 'readSign', 'search', 'openDeleted']) state = w.Episode02State.record(state, action);
    state.scene = scene;
    const before = JSON.stringify(w.Episode02State.normalize(state));
    const mounted = w.Episode02.mount({ initialState: state });
    assert.equal(JSON.stringify(mounted.getState()), before, '이미지 표시는 진행이나 수집 상태를 바꾸면 안 된다');
    return app.innerHTML;
  }
  return { ...w, app, render };
}

test('원본 PNG 3개를 보존하되 화재 사진만 활성화한다', () => {
  const { EP02_ASSETS: assets } = setup();
  assert.deepEqual(Object.keys(assets), ['fire', 'search', 'press']);
  assert.equal(assets.fire.ready, true);
  assert.equal(assets.search.ready, false);
  assert.equal(assets.press.ready, false);
  for (const asset of Object.values(assets)) {
    const data = readFileSync(new URL(`../assets/images/ep01-02/${asset.file}`, import.meta.url));
    assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(data.readUInt32BE(16), asset.width);
    assert.equal(data.readUInt32BE(20), asset.height);
  }
});
test('기관명 표지를 제외한 유효 영역을 크롭하고 오버레이를 만들지 않는다', () => {
  const { EP02_ASSETS: assets, render } = setup();
  const { crop, width, height } = assets.fire;
  assert.ok(crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0);
  assert.ok(crop.x + crop.width <= 360, '기관명 표지보다 왼쪽에서 크롭해야 한다');
  assert.ok(crop.x + crop.width <= width && crop.y + crop.height <= height);
  const html = render('article');
  assert.match(html, /ep2-fire-photo/);
  assert.doesNotMatch(html, /ep2-reference-shield|ep2-sign-masked|ep2-text-obscured/);
});
test('모든 조사 화면에서 개발·검증 안내 문구가 나타나지 않는다', () => {
  const { render } = setup();
  for (const scene of ['article', 'comparison', 'search', 'press', 'deduction']) {
    assert.doesNotMatch(render(scene), /참고용|설정 외 기관명 가림|문자 판독 제외|정답이 아닙니다|원고 기반|동일 건물임을 입증/);
  }
});
test('검색 이미지는 설정과 무관하게 렌더링하지 않고 HTML 검색·삭제 흔적을 유지한다', () => {
  const { render, EP02_ASSETS: assets, EP02_STORY: story } = setup();
  assets.search.ready = true;
  const html = render('search');
  assert.doesNotMatch(html, /archive_search.png|data-reference/);
  assert.match(html, /id="search-form"/);
  assert.ok(html.includes(story.quotes.trace));
  assert.match(html, /id="open-deleted"/);
  assert.match(html, /id="go-press"/);
});
test('보도자료 이미지 없이 원문과 진행 버튼을 유지한다', () => {
  const { render, EP02_ASSETS: assets, EP02_STORY: story } = setup();
  assets.press.ready = true;
  const html = render('press');
  assert.doesNotMatch(html, /press_release.png|data-reference/);
  assert.ok(html.includes(story.quotes.press));
  assert.match(html, /class="ep2-release"/);
  assert.match(html, /id="read-press"/);
});
test('가족사진 재사용과 안내판 판독은 이미지 증명과 독립적으로 유지한다', () => {
  const { render } = setup();
  const html = render('comparison');
  assert.match(html, /assets\/images\/ep01-01\/photo-front.webp/);
  assert.match(html, /assets\/images\/ep01-02\/fire_scene.png/);
  assert.match(html, /id="read-sign"/);
  assert.match(html, /…기록실/);
  assert.match(html, /id="go-search"/);
});
test('화재 사진을 표시하지 못해도 HTML 조사 흐름을 유지한다', () => {
  const { EP02_ASSETS: assets, render, EP02_STORY: story } = setup();
  assets.fire.ready = false;
  const article = render('article');
  assert.match(article, /사진을 표시할 수 없습니다/);
  assert.match(article, /id="read-article"/);
  assert.doesNotMatch(article, /src="assets\/images\/ep01-02/);
  assert.match(render('search'), /id="search-form"/);
  assert.ok(render('press').includes(story.quotes.press));
});
