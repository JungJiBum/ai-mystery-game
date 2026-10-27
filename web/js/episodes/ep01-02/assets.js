/* 화재 사진은 표시 영역만 크롭한다. 원본 PNG와 공식 단서 데이터는 변경하지 않는다.
   검색·보도자료 PNG는 설정 불일치로 보관만 하고 플레이 화면에는 사용하지 않는다. */
window.EP02_ASSETS = {
  fire: {
    file: 'fire_scene.png', ready: true, width: 558, height: 754,
    label: '화재 후 건물 외관', alt: '화재 후 그을린 건물의 출입구와 외벽',
    crop: { x: 0, y: 220, width: 360, height: 270 },
    caption: '화재 후 건물 외관'
  },
  search: {
    file: 'archive_search.png', ready: false, width: 489, height: 754,
    label: '검색 화면 원본', alt: ''
  },
  press: {
    file: 'press_release.png', ready: false, width: 511, height: 754,
    label: '보도자료 원본', alt: ''
  }
};
