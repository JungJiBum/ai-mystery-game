window.EpisodeCatalog = {
  'ep01-01': { title: '발신인 없는 택배', label: 'EP. 01 / 01', next: 'ep01-02' },
  'ep01-02': { title: '12년 전의 사고', label: 'EP. 01 / 02', previous: 'ep01-01' }
};
window.EpisodeRouting = {
  resolve(hash) {
    const id = String(hash).replace(/^#/, '');
    return Object.prototype.hasOwnProperty.call(window.EpisodeCatalog, id) ? id : 'ep01-01';
  }
};
