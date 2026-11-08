import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const json = value => JSON.parse(JSON.stringify(value));
function setup() {
  const entries = new Map();
  const storage = { getItem: k => entries.get(k) ?? null, setItem: (k, v) => entries.set(k, v), removeItem: k => entries.delete(k) };
  const context = vm.createContext({ window: { localStorage: storage } });
  for (const file of ['story', 'state', 'episodes/ep01-02/story', 'episodes/ep01-02/state', 'episodes/ep01-03/story', 'episodes/ep01-03/state', 'storage', 'episodes']) vm.runInContext(readFileSync(new URL(`../js/${file}.js`, import.meta.url), 'utf8'), context);
  const w = context.window;
  const source01 = { version: 2, scene: 'complete', found: ['photo', 'back', 'note', 'usb'], unlocked: true, articleRead: true, completed: true };
  let source = w.Episode02State.fresh(source01);
  for (const action of ['readArticle', 'readSign', 'search', 'openDeleted', 'readPress']) source = w.Episode02State.record(source, action);
  source.completed = true; source.scene = 'complete';
  return { ...w, source, source01, storage, entries, context };
}
const request = { period: 'article', facility: 'lab', record: 'internal' };
function advance(m, state) {
  for (const [action, value] of [['readPress', 'locationUnknown'], ['sendInquiry', request], ['analyzeReply', 'nameOnly'], ...['beforePeriod', 'beforeCode', 'afterPeriod', 'afterCode'].map(id => ['mark', id]), ['compare']]) state = m.record(state, action, value);
  return state;
}
function solved(m, state) { return m.solve(advance(m, state), ['press', 'reply', 'comparison'], 'reclassified'); }

test('EP03: EP02 미완료·불완전·잘못된 출처로 해금하지 않는다', () => {
  const { EpisodeStorage: s, source, storage } = setup();
  assert.equal(s.loadEpisode03().state, null);
  for (const bad of [{ ...source, completed: false }, { ...source, found: ['press'] }, { ...source, searchDone: false }, { ...source, version: 2 }, { ...source, inherited: null }]) {
    storage.setItem(s.keys['ep01-02'], JSON.stringify(bad)); assert.equal(s.loadEpisode03().state, null);
  }
});
test('EP03: 검증된 EP02 완료를 최소 사본으로 인계한다', () => {
  const { Episode03State: m, source } = setup();
  const state = m.fresh({ ...source, extraSecret: 'ignore' });
  assert.equal(state.scene, 'press'); assert.equal(state.found.length, 0);
  assert.equal(state.inherited.sourceEpisode, 'ep01-02'); assert.equal(state.inherited.extraSecret, undefined);
  assert.deepEqual(json(state.inherited.found), ['article', 'sign', 'trace', 'press']);
  state.inherited.found.pop(); assert.equal(source.found.length, 4);
  for (const field of [{ sourceEpisode: 'ep01-01' }, { sourceSaveVersion: 2 }]) assert.equal(m.fresh({ ...m.sourceSnapshot(source), ...field }), null);
});
test('EP03: 기존 인용문 공유 및 제공 원문·코드를 정확히 유지한다', () => {
  const { EP03_STORY: story, EP02_STORY: old, STORY } = setup();
  assert.equal(story.quotes.press, old.quotes.press);
  assert.equal(story.quotes.note, STORY.quotes.note.split('\n')[1]);
  assert.equal(story.quotes.reply, '요청하신 명칭으로 관리 중인 기록은 확인되지 않습니다.');
  assert.equal(story.quotes.before, '기록 보관 구역 — R-03'); assert.equal(story.quotes.after, '자료 관리 구역 — D-03');
});
test('EP03: 조사 이전 순서 건너뛰기와 가짜 완료를 차단한다', () => {
  const { Episode03State: m, source } = setup(); const fresh = m.fresh(source);
  for (const action of ['analyzeReply', 'mark', 'compare', 'readNote']) assert.deepEqual(json(m.record(fresh, action, 'beforeCode')), json(fresh));
  const fake = m.normalize({ ...fresh, scene: 'complete', found: ['press', 'reply', 'comparison'], completed: true, noteRead: true, deduced: true });
  assert.equal(fake.completed, false); assert.equal(fake.scene, 'press'); assert.deepEqual(json(fake.found), []);
});
test('EP03: 보도자료의 미확인 위치를 구분해야 첫 증거를 수집한다', () => {
  const { Episode03State: m, source } = setup(); const state = m.fresh(source);
  assert.equal(m.record(state, 'readPress', 'preserved').pressRead, false);
  assert.deepEqual(json(m.record(state, 'readPress', 'locationUnknown').found), ['press']);
});
test('EP03: 문의 오답은 답변을 열지 않고 올바른 자료로 재시도한다', () => {
  const { Episode03State: m, source } = setup(); const state = m.record(m.fresh(source), 'readPress', 'locationUnknown');
  for (const bad of [{}, { ...request, period: 'delivery' }, { ...request, facility: 'sender' }, { ...request, record: 'usb' }]) assert.equal(m.record(state, 'sendInquiry', bad).requestSent, false);
  assert.equal(m.record(state, 'sendInquiry', request).requestSent, true);
});
test('EP03: 답변은 폐기나 완전 부존재로 해석할 수 없다', () => {
  const { Episode03State: m, source } = setup(); let state = m.record(m.fresh(source), 'readPress', 'locationUnknown'); state = m.record(state, 'sendInquiry', request);
  for (const wrong of ['destroyed', 'missing']) assert.equal(m.record(state, 'analyzeReply', wrong).replyAnalyzed, false);
  assert.equal(m.record(state, 'analyzeReply', 'nameOnly').replyAnalyzed, true);
});
test('EP03: 시점과 코드 네 항목을 양쪽에서 확인해야 비교를 수집한다', () => {
  const { Episode03State: m, source } = setup(); let state = advance(m, m.fresh(source));
  assert.deepEqual(json(state.found), ['press', 'reply', 'before', 'after', 'comparison']);
  state = m.normalize({ ...state, marks: ['afterCode', 'afterPeriod', 'afterCode', 'fake'], comparisonReviewed: true });
  assert.deepEqual(json(state.marks), ['afterPeriod', 'afterCode']); assert.equal(state.comparisonReviewed, false);
  assert.deepEqual(json(state.found), ['press', 'reply', 'after']);
  assert.equal(m.permittedScene(state, 'deduction'), 'comparison');
});
test('EP03: 모든 증거 확인 후 세 증거와 재분류 가설 조합만 정답이다', () => {
  const { Episode03State: m, source } = setup(); const fresh = m.fresh(source), full = advance(m, fresh);
  const ids = ['press', 'reply', 'before', 'after', 'comparison'];
  for (const a of ids) for (const b of ids) for (const c of ids) {
    const selected = [a, b, c]; const expected = new Set(selected).size === 3 && ['press', 'reply', 'comparison'].every(id => selected.includes(id));
    assert.equal(m.isCorrect(full, selected, 'reclassified'), expected);
  }
  for (const h of ['destroyed', 'sameRoom', '']) assert.equal(m.isCorrect(full, ['press', 'reply', 'comparison'], h), false);
  assert.equal(m.isCorrect(fresh, ['press', 'reply', 'comparison'], 'reclassified'), false);
  assert.equal(m.solve(full, ['press', 'reply', 'before'], 'reclassified').deduced, false);
  assert.equal(m.solve(full, ['press', 'reply', 'comparison'], 'reclassified').deduced, true);
});
test('EP03: 쪽지 확인 및 D-03 검색 전에는 완료할 수 없다', () => {
  const { Episode03State: m, source } = setup(); const state = solved(m, m.fresh(source));
  assert.equal(m.finish(state, 'D-03').completed, false);
  const read = m.record(state, 'readNote');
  for (const query of ['', 'R-03', 'USB']) assert.equal(m.finish(read, query).completed, false);
  assert.equal(m.finish(read, ' D-03 ').completed, true);
});
test('EP03: 중간·완료·완료 후 재조사 상태의 새로고침 복원', () => {
  const { EpisodeStorage: s, Episode03State: m, source } = setup();
  let state = advance(m, m.fresh(source)); state.scene = 'comparison';
  s.writeEpisode03(state); assert.deepEqual(json(s.loadEpisode03().state), json(state));
  state = m.finish(m.record(solved(m, state), 'readNote'), 'D-03');
  s.writeEpisode03(state); assert.deepEqual(json(s.loadEpisode03().state), json(state));
  state.scene = 'press'; s.writeEpisode03(state); assert.equal(s.loadEpisode03().state.completed, true);
});
test('EP03: 저장·초기화는 EP01 v1/v2와 EP02 바이트를 바꾸지 않는다', () => {
  const { EpisodeStorage: s, Episode03State: m, source, source01, storage, entries } = setup();
  const previous = { 'ai-story:ep01-01:v1': 'legacy', [s.keys['ep01-01']]: JSON.stringify(source01), [s.keys['ep01-02']]: JSON.stringify(source) };
  for (const [k, v] of Object.entries(previous)) storage.setItem(k, v);
  const state = advance(m, m.fresh(source)); s.writeEpisode03(state); const reset = s.resetEpisode03(state);
  assert.equal(reset.state.scene, 'press'); assert.equal(reset.state.found.length, 0); assert.equal(reset.state.completed, false);
  assert.deepEqual(json(reset.state.inherited), json(state.inherited));
  for (const [k, v] of Object.entries(previous)) assert.equal(entries.get(k), v);
});
test('EP03: 이전 회차 초기화 후에도 독립 저장의 완료 사본을 유지한다', () => {
  const { EpisodeStorage: s, Episode03State: m, Episode02State: m2, source, source01 } = setup();
  const state = advance(m, m.fresh(source)); s.writeEpisode03(state); s.resetEpisode02(m2.fresh(source01));
  assert.deepEqual(json(s.loadEpisode03().state), json(state));
});
test('EP03: 손상 JSON·잘못된 인계·미래 버전 저장은 복구하거나 잠근다', () => {
  const { EpisodeStorage: s, Episode03State: m, source, storage } = setup();
  for (const bad of ['{broken', JSON.stringify({ ...m.fresh(source), version: 99 }), JSON.stringify({ ...m.fresh(source), inherited: {} })]) {
    storage.setItem(s.keys['ep01-03'], bad); assert.equal(s.loadEpisode03().state, null);
    assert.equal(s.loadEpisode03({ source }).state.scene, 'press');
  }
});
test('EP03: 저장 차단 시 메모리 인계·이동·초기화 유지', () => {
  const { EpisodeStorage: s, Episode03State: m, source } = setup();
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
  const loaded = s.loadEpisode03({ source, storage: denied }); assert.equal(loaded.available, false); assert.ok(loaded.state);
  const state = advance(m, loaded.state); assert.equal(s.writeEpisode03(state, denied), false);
  assert.deepEqual(json(s.loadEpisode03({ memory: state, storage: denied }).state), json(state));
  assert.equal(s.resetEpisode03(state, denied).state.found.length, 0);
});
test('EP03: 앞 회차 완료 후 재조사 중이어도 해금한다', () => {
  const { EpisodeStorage: s, source } = setup(); assert.ok(s.loadEpisode03({ source: { ...source, scene: 'article' } }).state);
});
test('EP03: 실제 라우터가 세 회차 전환·뒤로/앞으로 상태와 dispose를 처리한다', () => {
  const { context } = setup(), w = context.window; const listeners = {}, mounted = [], disposed = [];
  const app = { dataset: {}, querySelector: () => ({ focus() {} }) };
  const node = { textContent: '' };
  context.document = { title: '', querySelector: s => s === '#app' ? app : node, querySelectorAll: () => [] };
  w.location = { hash: '#ep01-01', pathname: '/', search: '' }; w.history = { replaceState(_a, _b, url) { w.location.hash = url.slice(url.indexOf('#')); } };
  w.addEventListener = (type, fn) => { listeners[type] = fn; }; w.scrollTo = () => {};
  for (const [id, name] of [['ep01-01', 'Episode01'], ['ep01-02', 'Episode02'], ['ep01-03', 'Episode03']]) w[name] = { mount(args) { mounted.push({ id, args }); return { getState: () => ({ episode: id }), dispose: () => disposed.push(id) }; } };
  vm.runInContext(readFileSync(new URL('../js/router.js', import.meta.url), 'utf8'), context);
  for (const id of ['ep01-02', 'ep01-03', 'ep01-02', 'ep01-03']) { w.location.hash = '#'+id; listeners.hashchange(); }
  assert.equal(app.dataset.episode, 'ep01-03'); assert.equal(mounted.length, 5); assert.equal(disposed.length, 4);
  assert.equal(mounted[2].args.sourceState.episode, 'ep01-02'); assert.equal(mounted[4].args.initialState.episode, 'ep01-03');
});
