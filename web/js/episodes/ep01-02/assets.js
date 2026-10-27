/* 제공 PNG는 참고 이미지다. 원고 밖의 기관명·날짜·문구는 단서로 사용하지 않는다.
   원본 파일은 보존하고 화면 표시에서 기관명 가림/문자 비노출 처리를 적용한다. */
window.EP02_ASSETS = {
  fire: {
    file: 'fire_scene.png', ready: true, width: 558, height: 754,
    label: '화재 후 외관 참고 이미지', alt: '화재 후 그을린 건물 외관 참고 이미지. 기관명 표시는 가렸으며 가족사진과 같은 건물인지는 확인되지 않았습니다.',
    treatment: 'mask-sign',
    caption: '화재 후 외관 참고 · 사고 당시 사진이나 동일 건물임을 입증하는 자료가 아닙니다.',
    note: '원고는 밤의 연구소 사진을 묘사합니다. 건물 비교와 안내판 단서는 아래의 원고 기반 판독을 기준으로 확인하세요.'
  },
  search: {
    file: 'archive_search.png', ready: true, width: 489, height: 754,
    label: '검색 화면 참고 이미지', alt: '', treatment: 'obscure-text',
    caption: '화면 구성 참고 · 이미지의 기관명·날짜·문구는 게임의 설정이나 정답이 아닙니다.',
    note: '문자 판독을 제외한 참고 이미지입니다. 검색과 미리보기 단서는 위의 원고 기준 HTML에서 확인하세요.'
  },
  press: {
    file: 'press_release.png', ready: true, width: 511, height: 754,
    label: '보도자료 형식 참고 이미지', alt: '', treatment: 'obscure-text',
    caption: '문서 형식 참고 · 이미지의 기관명·날짜·문구는 게임의 설정이나 정답이 아닙니다.',
    note: '문자 판독을 제외한 참고 이미지입니다. 공식 단서는 위에 표시된 원고 기준 보존 문구입니다.'
  }
};
