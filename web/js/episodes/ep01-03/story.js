/* 사용자가 제공한 EP01-03 구현 원고 기준. 날짜·기관명·미확정 결론을 보충하지 않는다. */
window.EP03_STORY = {
  id: 'ep01-03', title: '존재하지 않는 기록',
  quotes: {
    press: window.EP02_STORY.quotes.press,
    reply: '요청하신 명칭으로 관리 중인 기록은 확인되지 않습니다.',
    before: '기록 보관 구역 — R-03',
    after: '자료 관리 구역 — D-03',
    note: window.STORY.quotes.note.split('\n')[1]
  },
  scenes: {
    press: { label: '01 / 남겨진 문서', title: '보존 중이라는 문장.', text: '그는 지난 조사에서 확보한 보도자료를 다시 열었다. 발표된 내용과 아직 확인하지 못한 것을 구분해 보자.' },
    inquiry: { label: '02 / 보존 여부 문의', title: '어떤 기록을 찾고 있는가.', text: '공개 문의 경로에서 사고 기록의 보존 여부를 확인하기로 했다. 가지고 있는 자료에서 문의에 필요한 정보를 골랐다.' },
    comparison: { label: '03 / 문서 비교', title: '이름과 코드 사이.', text: '서로 다른 시점의 시설 관련 자료를 펼쳤다. 작성 시점과 보관 구역의 표기를 각각 확인해 보자.' },
    deduction: { label: '04 / 조사 가설', title: '답변이 말하지 않은 것.', text: '보도자료, 문의 답변, 문서 간 차이를 연결해 다음 조사 방향을 정리하자.' },
    final: { label: '05 / 다시 읽는 쪽지', title: '직접 확인하십시오.', text: '그는 택배 속 쪽지를 다시 꺼냈다.' }
  },
  documents: {
    before: { title: '사고 전 시설 관련 자료', period: '사고 전', code: 'R-03', quote: 'before' },
    after: { title: '사고 후 시설 관련 자료', period: '사고 후', code: 'D-03', quote: 'after' }
  },
  clues: {
    press: { title: '공식 보도자료의 보존 문구', quote: 'press' },
    reply: { title: '명칭에 대한 문의 답변', quote: 'reply' },
    before: { title: '사고 전 구역 표기', quote: 'before' },
    after: { title: '사고 후 구역 표기', quote: 'after' },
    comparison: { title: '작성 시점·분류 코드 비교', quote: 'comparison' }
  },
  inquiry: {
    period: [ ['article', '기존 화재 기사 · 12년 전 사고'], ['delivery', '택배가 도착한 시점'] ],
    facility: [ ['lab', '화재 기사에 나온 연구소'], ['sender', '발신인을 알 수 없는 택배'] ],
    record: [ ['internal', '보도자료의 사고 관련 내부 기록'], ['usb', '검은색 USB의 내용'] ]
  },
  hypotheses: [
    ['destroyed', '기록은 폐기되었다고 확정한다.'],
    ['reclassified', '다른 명칭으로 재분류되었을 가능성을 추가 조사한다.'],
    ['sameRoom', 'R-03과 D-03은 동일한 공간이라고 확정한다.']
  ],
  deduction: {
    evidence: ['press', 'reply', 'comparison'],
    success: '원본은 보존 중이라고 발표되었지만, 요청한 명칭으로 관리되는 기록은 확인되지 않았다. 사고 전후 자료에는 서로 다른 명칭과 코드가 적혀 있다. 다른 명칭으로 재분류되었을 가능성을 추가 조사할 필요가 있다. 기록의 폐기나 두 구역의 동일성은 확인되지 않았다.',
    failure: '선택한 자료가 발표 내용, 답변의 범위, 사고 전후 차이를 함께 설명하는지 다시 살펴보자. 확인된 사실에서 나아갈 수 있는 조사 가설을 골라야 한다.'
  },
  completion: { title: 'EP01-03 조사 완료', text: '보존 발표와 명칭 조회 답변, 사고 전후 분류 코드의 차이를 정리했다. 재분류 가능성은 아직 조사 가설이다.', next: '다음 이야기 — EP01-04 「삭제된 이름」' }
};

// 비교 요약도 문서 인용문에서 파생해 원문을 한 곳에서 관리한다.
window.EP03_STORY.quotes.comparison = `사고 전: ${window.EP03_STORY.quotes.before}\n사고 후: ${window.EP03_STORY.quotes.after}`;
