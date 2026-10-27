import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const context = vm.createContext({ window: {} });
for (const file of ['story', 'assets', 'state']) {
  vm.runInContext(readFileSync(new URL(`../js/${file}.js`, import.meta.url), 'utf8'), context);
}
const { GameState: model, STORY: story, ASSETS: assets } = context.window;
const all = ['photo', 'back', 'note', 'usb'];
const json = value => JSON.parse(JSON.stringify(value));
test('원문은 이미지 설명과 추리에서 공유할 단일 데이터다', () => {
  assert.equal(story.quotes.back, '기록은 사라져도, 사실은 사라지지 않는다.');
  assert.equal(story.quotes.note, '당신의 부모님에 관한 기록입니다.\n믿지 않아도 좋습니다. 직접 확인하십시오.');
  assert.equal(assets.photoBack.quote, 'back');
  assert.equal(assets.noteOpen.quote, 'note');
  assert.equal(story.evidence.back.quote, 'back');
  assert.equal(story.evidence.note.quote, 'note');
});
test('새 게임과 손상된 저장은 초기 상태로 복구한다', () => {
  for (const bad of [null, {}, { found: 'not-array' }, { found: [], scene: 'unknown' }]) {
    assert.deepEqual(json(model.normalize(bad)), json(model.fresh()));
  }
});
test('v1 방 안 저장의 증거를 유지하고 새 추리로 이전한다', () => {
  const next = model.normalize({ scene: 'room', found: all, unlocked: true }, true);
  assert.equal(next.scene, 'parcel');
  assert.deepEqual(json(next.found), all);
  assert.equal(next.noteOpen, true);
  assert.equal(next.unlocked, false);
});
test('v1 현관과 기사 도달 기록을 보존한다', () => {
  assert.equal(model.normalize({ scene: 'doorstep', found: [] }, true).scene, 'doorstep');
  const next = model.normalize({ scene: 'ending', found: all, unlocked: true }, true);
  assert.equal(next.scene, 'article');
  assert.equal(next.unlocked, true);
  assert.equal(next.completed, false);
});
test('조사 도중 저장 복원: 사진 방향·쪽지 상태·열린 조사 화면', () => {
  const saved = { ...model.fresh(), scene: 'parcel', found: all, photoFace: 'back', noteOpen: true, inspection: 'note' };
  assert.deepEqual(json(model.normalize(saved)), saved);
});
test('전체 증거 전에 추리를 풀 수 없다', () => {
  for (const found of [[], ['photo', 'back', 'note'], ['back', 'note']]) {
    assert.equal(model.isCorrect({ found }, ['back', 'note'], story.deduction.pair), false);
  }
});
test('가능한 모든 두 증거 조합 중 뒷면+쪽지만 정답이다', () => {
  for (const a of all) for (const b of all) {
    const expected = a !== b && [a, b].includes('back') && [a, b].includes('note');
    assert.equal(model.isCorrect({ found: all }, [a, b], story.deduction.pair), expected, `${a}+${b}`);
  }
  assert.equal(model.isCorrect({ found: all }, ['photo', 'note'], story.deduction.pair), false);
});
test('쪽지를 다시 접어도 이미 읽은 단서는 유효하다', () => {
  assert.equal(model.isCorrect({ found: all, noteOpen: false }, ['back', 'note'], story.deduction.pair), true);
});
test('미확인 기사나 일부 증거로 완료 상태를 복원할 수 없다', () => {
  const partial = model.normalize({ scene: 'complete', found: ['photo'], unlocked: true, completed: true, articleRead: true });
  assert.equal(partial.scene, 'parcel');
  assert.equal(partial.completed, false);
  const unread = model.normalize({ scene: 'complete', found: all, unlocked: true, completed: true });
  assert.equal(unread.scene, 'article');
  assert.equal(unread.completed, false);
});
test('완료 저장 및 완료 후 증거 재검토 상태를 보존한다', () => {
  const saved = { ...model.fresh(), scene: 'complete', found: all, unlocked: true, articleRead: true, completed: true };
  assert.deepEqual(json(model.normalize(saved)), saved);
  assert.equal(model.normalize({ ...saved, scene: 'parcel' }).completed, true);
});
test('알 수 없는 증거·중복·잘못된 조사 화면을 정리한다', () => {
  const next = model.normalize({ scene: 'parcel', found: ['back', 'back', 'fake'], inspection: 'fake' });
  assert.deepEqual(json(next.found), ['photo', 'back']);
  assert.equal(next.inspection, null);
});
test('9개 이미지는 로컬 파일명과 연결 상태를 명시한다', () => {
  assert.equal(Object.keys(assets).length, 9);
  for (const asset of Object.values(assets)) {
    assert.match(asset.file, /^[a-z-]+\.(webp|png|jpe?g)$/);
    assert.equal(typeof asset.ready, 'boolean');
  }
});

test('활성화된 이미지 9개가 로컬 WebP 파일로 존재한다', () => {
  for (const asset of Object.values(assets)) {
    assert.equal(asset.ready, true, asset.file);
    const data = readFileSync(new URL(`../assets/images/ep01-01/${asset.file}`, import.meta.url));
    assert.equal(data.subarray(0, 4).toString(), 'RIFF', asset.file);
    assert.equal(data.subarray(8, 12).toString(), 'WEBP', asset.file);
  }
});
