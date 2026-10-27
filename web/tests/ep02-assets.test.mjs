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

test('EP01-02 이미지 3개가 PNG로 활성화되고 실제 크기와 일치한다', () => {
  const { EP02_ASSETS: assets } = setup();
  assert.deepEqual(Object.keys(assets), ['fire', 'search', 'press']);
  for (const asset of Object.values(assets)) {
    assert.equal(asset.ready, true);
    assert.match(asset.file, /^[a-z_]+\.png$/);
    const data = readFileSync(new URL(`../assets/images/ep01-02/${asset.file}`, import.meta.url));
    assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(data.readUInt32BE(16), asset.width);
    assert.equal(data.readUInt32BE(20), asset.height);
  }
});
test('확정되지 않은 이미지 문자는 판독에서 제외하고 기관명은 가린다', () => {
  const { EP02_ASSETS: assets, render } = setup();
  assert.equal(assets.fire.treatment, 'mask-sign');
  assert.equal(assets.search.treatment, 'obscure-text');
  assert.equal(assets.press.treatment, 'obscure-text');
  const fire = render('article');
  assert.match(fire, /ep2-sign-masked/);
  assert.match(fire, /설정 외 기관명 가림/);
  assert.match(fire, /동일 건물임을 입증하는 자료가 아닙니다/);
});
test('검색·보도자료 참고 이미지는 보조기기에 잘못된 문구를 전달하지 않는다', () => {
  const { render } = setup();
  for (const scene of ['search', 'press']) {
    const html = render(scene);
    assert.match(html, /ep2-text-obscured/);
    assert.match(html, /alt="" aria-hidden="true"/);
    assert.match(html, /문자 판독 제외/);
    assert.match(html, /게임의 설정이나 정답이 아닙니다/);
  }
});
test('검색 입력·삭제 흔적 원문이 참고 이미지보다 먼저 표시된다', () => {
  const { render, EP02_STORY: story } = setup();
  const html = render('search');
  assert.ok(html.indexOf('id="search-form"') < html.indexOf('data-reference="search"'));
  assert.ok(html.indexOf(story.quotes.trace) < html.indexOf('data-reference="search"'));
  assert.match(html, /id="open-deleted"/);
  assert.match(html, /id="go-press"/);
});
test('공식 보존 문구가 문서 참고 이미지보다 먼저 표시된다', () => {
  const { render, EP02_STORY: story } = setup();
  const html = render('press');
  assert.ok(html.indexOf(story.quotes.press) < html.indexOf('data-reference="press"'));
  assert.ok(html.indexOf('</article>') < html.indexOf('data-reference="press"'));
  assert.ok(html.indexOf('id="read-press"') < html.indexOf('data-reference="press"'));
  assert.match(html, /id="read-press"/);
});
test('가족사진 재사용·안내판 판독·연결된 화재 참고 이미지를 함께 유지한다', () => {
  const { render } = setup();
  const html = render('comparison');
  assert.match(html, /assets\/images\/ep01-01\/photo-front.webp/);
  assert.match(html, /assets\/images\/ep01-02\/fire_scene.png/);
  assert.match(html, /id="read-sign"/);
  assert.match(html, /…기록실/);
  assert.match(html, /id="go-search"/);
});
test('이미지 미제공 상태에서도 원고 기반 조사 UI가 유지된다', () => {
  const { EP02_ASSETS: assets, render, EP02_STORY: story } = setup();
  for (const asset of Object.values(assets)) asset.ready = false;
  const article = render('article');
  assert.match(article, /이미지 준비 중/);
  assert.match(article, /id="read-article"/);
  const search = render('search'), press = render('press');
  assert.match(search, /id="search-form"/);
  assert.ok(press.includes(story.quotes.press));
  assert.ok(!search.includes('src="assets/images/ep01-02/'));
  assert.ok(!press.includes('src="assets/images/ep01-02/'));
});
