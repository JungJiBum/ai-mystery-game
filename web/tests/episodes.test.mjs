import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const json = value => JSON.parse(JSON.stringify(value));
function setup() {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
  const context = vm.createContext({ window: { localStorage: storage } });
  for (const file of ['state', 'episodes/ep01-02/story', 'episodes/ep01-02/assets', 'episodes/ep01-02/state', 'storage', 'episodes']) {
    vm.runInContext(readFileSync(new URL(`../js/${file}.js`, import.meta.url), 'utf8'), context);
  }
  return { ...context.window, entries, storage };
}
function completed01() {
  return { version: 2, scene: 'complete', found: ['photo', 'back', 'note', 'usb'], unlocked: true, articleRead: true, completed: true };
}
function advance(model, state) {
  for (const action of ['readArticle', 'readSign', 'search', 'openDeleted', 'readPress']) state = model.record(state, action);
  return state;
}
test('알려진 두 회차 해시만 허용하고 알 수 없는 주소는 EP01-01로 보낸다', () => {
  const { EpisodeRouting: router } = setup();
  assert.equal(router.resolve('#ep01-01'), 'ep01-01');
  assert.equal(router.resolve('#ep01-02'), 'ep01-02');
  for (const hash of ['', '#ep01-03', '#__proto__', '#constructor']) assert.equal(router.resolve(hash), 'ep01-01');
});
test('미완료·불완전한 EP01-01 저장으로 다음 회차를 시작할 수 없다', () => {
  const { EpisodeStorage: store, storage } = setup();
  assert.equal(store.loadEpisode02().state, null);
  for (const bad of [{ ...completed01(), completed: false }, { ...completed01(), found: ['usb'] }, { ...completed01(), articleRead: false }, { ...completed01(), unlocked: false }]) {
    storage.setItem(store.keys['ep01-01'], JSON.stringify(bad));
    assert.equal(store.loadEpisode02().state, null);
  }
});
test('검증된 완료와 네 증거 ID만 사본으로 전달하고 새 단서와 섞지 않는다', () => {
  const { EpisodeStorage: store, storage } = setup();
  const source = completed01(); storage.setItem(store.keys['ep01-01'], JSON.stringify(source));
  const result = store.loadEpisode02();
  assert.equal(result.resumed, false);
  assert.deepEqual(json(result.state.found), []);
  assert.deepEqual(json(result.state.inherited), { sourceEpisode: 'ep01-01', sourceSaveVersion: 2, completed: true, articleRead: true, found: source.found });
  result.state.inherited.found.pop(); assert.equal(source.found.length, 4);
});
test('완료 후 재조사 중인 EP01-01도 다음 회차를 해금한다', () => {
  const { EpisodeStorage: store } = setup();
  assert.ok(store.loadEpisode02({ source: { ...completed01(), scene: 'parcel' } }).state);
});
test('EP01-01 v1 장면 이전은 보존하고 기존 엔딩을 새 완료로 오인하지 않는다', () => {
  const { EpisodeStorage: store, storage } = setup();
  storage.setItem('ai-story:ep01-01:v1', JSON.stringify({ scene: 'ending', found: completed01().found, unlocked: true }));
  const state = store.readEpisode01();
  assert.equal(state.scene, 'article'); assert.equal(state.completed, false);
  assert.equal(store.loadEpisode02().state, null);
});
test('EP01-02 저장·초기화가 EP01-01 v1/v2 저장을 바꾸지 않는다', () => {
  const { EpisodeStorage: store, Episode02State: model, storage, entries } = setup();
  const original = JSON.stringify(completed01());
  storage.setItem(store.keys['ep01-01'], original); storage.setItem('ai-story:ep01-01:v1', 'legacy');
  const state = advance(model, store.loadEpisode02().state);
  assert.equal(store.writeEpisode02(state), true);
  const reset = store.resetEpisode02(state);
  assert.equal(reset.state.scene, 'article'); assert.deepEqual(json(reset.state.found), []);
  assert.equal(entries.get(store.keys['ep01-01']), original); assert.equal(entries.get('ai-story:ep01-01:v1'), 'legacy');
  assert.equal(entries.size, 3);
});
test('EP01-01을 초기화해도 이미 시작한 EP01-02의 사본·진행은 유지한다', () => {
  const { EpisodeStorage: store, Episode02State: model, storage, GameState } = setup();
  const state = advance(model, store.loadEpisode02({ source: completed01() }).state);
  state.scene = 'deduction'; store.writeEpisode02(state);
  storage.setItem(store.keys['ep01-01'], JSON.stringify(GameState.fresh()));
  const loaded = store.loadEpisode02();
  assert.equal(loaded.resumed, true); assert.equal(loaded.state.scene, 'deduction');
  assert.equal(loaded.state.inherited.completed, true); assert.equal(loaded.state.found.length, 4);
});
test('사진 비교·검색·삭제 페이지·보도자료의 순서가 검증된다', () => {
  const { Episode02State: model } = setup();
  let state = model.fresh(completed01());
  assert.equal(model.permittedScene(state, 'deduction'), 'article');
  assert.deepEqual(json(model.record(state, 'readPress').found), []);
  state = model.record(state, 'readArticle');
  assert.equal(model.permittedScene(state, 'search'), 'comparison');
  state = model.record(state, 'readSign');
  assert.deepEqual(json(model.record(state, 'openDeleted').found), ['article', 'sign']);
  state = model.record(state, 'search'); state = model.record(state, 'openDeleted');
  assert.equal(model.permittedScene(state, 'deduction'), 'press');
  state = model.record(state, 'readPress'); assert.equal(state.found.length, 4);
});
test('원고의 기록실 검색어만 받아들이고 연구소 고유명을 만들지 않는다', () => {
  const { Episode02State: model, EP02_STORY: story } = setup();
  assert.equal(story.searchScope, '기사 속 연구소');
  for (const query of ['기록실', ' 기록실 ', '“기록실”']) assert.equal(model.validQuery(query), true);
  for (const query of ['', 'USB', '전산실']) assert.equal(model.validQuery(query), false);
});
test('출입 이력 미리보기·원본 보존 문구·안내판을 원고 그대로 사용한다', () => {
  const { EP02_STORY: story } = setup();
  assert.equal(story.quotes.sign, '…기록실');
  assert.equal(story.quotes.trace, '화재 발생 당시 내부 기록 보관 구역의 출입 이력은…');
  assert.equal(story.quotes.press, '사고 관련 내부 기록은 관계 기관에 제출하였으며, 원본은 보존 규정에 따라 관리 중입니다.');
  assert.equal(story.quotes.report, '야간 연구 도중 발생한 전기 설비 이상. 연구원 두 명 사망.');
});
test('네 단서 확인 후 삭제 흔적+보도자료만 정답이다', () => {
  const { Episode02State: model, EP02_STORY: story } = setup();
  const fresh = model.fresh(completed01()), full = advance(model, fresh);
  assert.equal(model.isCorrect(fresh, ['trace', 'press']), false);
  for (const a of ['article', 'sign', 'trace', 'press']) for (const b of ['article', 'sign', 'trace', 'press']) {
    const correct = a !== b && [a, b].includes('trace') && [a, b].includes('press');
    assert.equal(model.isCorrect(full, [a, b]), correct);
  }
  assert.deepEqual(json(story.deduction.pair), ['trace', 'press']);
});
test('EP01-02 이어하기·완료 복원이 보존된다', () => {
  const { Episode02State: model, EpisodeStorage: store } = setup();
  const state = advance(model, model.fresh(completed01())); state.scene = 'complete'; state.completed = true;
  store.writeEpisode02(state);
  const restored = store.loadEpisode02(); assert.equal(restored.resumed, true); assert.deepEqual(json(restored.state), json(state));
});
test('가짜 완료·미확인 단서와 다른 회차 출처를 거부한다', () => {
  const { Episode02State: model } = setup();
  const fresh = model.fresh(completed01());
  const bad = model.normalize({ ...fresh, scene: 'complete', completed: true, found: ['article', 'trace', 'press'] });
  assert.equal(bad.completed, false); assert.equal(bad.scene, 'comparison');
  assert.equal(model.normalize({ ...fresh, inherited: { ...fresh.inherited, sourceEpisode: 'ep01-03' } }), null);
});
test('손상된 EP01-02 저장은 검증된 전회차 기록으로 새로 시작한다', () => {
  const { EpisodeStorage: store, storage } = setup();
  storage.setItem(store.keys['ep01-01'], JSON.stringify(completed01())); storage.setItem(store.keys['ep01-02'], '{broken');
  assert.equal(store.loadEpisode02().state.scene, 'article'); assert.equal(store.loadEpisode02().resumed, false);
});
test('저장 차단 시 회차 전환 메모리와 완료 사본으로 계속 플레이한다', () => {
  const { EpisodeStorage: store, Episode02State: model } = setup();
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const loaded = store.loadEpisode02({ source: completed01(), storage: denied });
  assert.ok(loaded.state); assert.equal(loaded.available, false);
  const state = advance(model, loaded.state);
  assert.equal(store.writeEpisode02(state, denied), false);
  const resumed = store.loadEpisode02({ memory: state, storage: denied });
  assert.equal(resumed.resumed, true); assert.equal(resumed.state.found.length, 4);
});
