/* 사용자가 제공한 원문. 인용문·접근성 설명·추리 단서는 이 값을 공유한다. */
window.STORY = {
  id: 'ep01-01', title: '발신인 없는 택배',
  quotes: {
    back: '기록은 사라져도, 사실은 사라지지 않는다.',
    note: '당신의 부모님에 관한 기록입니다.\n믿지 않아도 좋습니다. 직접 확인하십시오.'
  },
  intro: '12년 전, AI 연구소 화재로 부모님을 잃었다.\n그리고 오늘, 발신인 없는 택배 하나가 도착했다.',
  scenes: {
    doorstep: { label: '01 / 현관', title: '문 앞에 놓인 낯선 상자.', text: '발신인의 이름이 없다. 상자를 들고 안으로 들어가 보자.', asset: 'entrance' },
    room: { label: '02 / 실내', title: '익숙한 방, 낯선 택배.', text: '탁자 위에 상자를 내려놓았다. 안에는 무엇이 들어 있을까?', asset: 'room' },
    parcel: { label: '03 / 택배 내부', title: '세 가지 물건. 하나의 의문.', text: '가족사진, 접힌 쪽지, 검은색 USB. 물건을 골라 직접 살펴보자.', asset: 'parcelOpen' }
  },
  evidence: {
    photo: { title: '가족사진 앞면', tag: 'PHOTOGRAPH / FRONT', asset: 'photoFront', description: '부모님과 내가 함께 찍힌 가족사진이다.', hint: '사진을 뒤집어 뒷면도 확인해 보자.' },
    back: { title: '가족사진 뒷면', tag: 'PHOTOGRAPH / BACK', asset: 'photoBack', quote: 'back', description: '사진 뒷면에는 문장이 남아 있다.' },
    note: { title: '쪽지 안쪽', tag: 'NOTE / UNFOLDED', asset: 'noteOpen', quote: 'note', description: '접힌 쪽지를 펼쳐 보았다.' },
    usb: { title: '검은색 USB', tag: 'USB / NOT CONNECTED', asset: 'usb', description: '검은색 USB다. 아직 컴퓨터에 연결하지 않았다.', hint: '확대해서 겉모습을 살펴볼 수 있다. 안에 무엇이 들어 있는지는 알 수 없다.' }
  },
  deduction: {
    title: '남겨진 두 문장은 무엇을 말할까?',
    text: '기록과 사실에 관한 문장, 직접 확인하라는 문장을 연결해 보자.',
    pair: ['back', 'note'],
    success: '사진 뒷면은 기록과 사실을 구분하고, 쪽지는 부모님에 관한 기록을 직접 확인하라고 한다. 먼저 12년 전 화재의 공개 기사를 찾아보자. 이것은 내가 정한 조사 방향이다.',
    failure: '이 연결만으로는 조사 방향을 정하기 어렵다. 사진 뒷면의 문장과 쪽지 안쪽의 문장을 함께 살펴보자.'
  },
  article: {
    title: '12년 전 AI 연구소 화재',
    body: 'AI 연구소 화재로 부모님이 사망했다는 당시의 보도를 찾았다. 이 기사만으로는 화재 원인이나 택배 발신인을 알 수 없다.',
    after: '기록을 확인했다. 하지만 택배를 보낸 사람도, USB에 담긴 내용도 아직 알 수 없다.'
  },
  completion: { title: 'EP01-01 조사 완료', text: '택배 속 증거를 조사하고, 12년 전 연구소 화재 기사를 발견했습니다. 검은색 USB는 연결하지 않은 채 남아 있습니다.' }
};
