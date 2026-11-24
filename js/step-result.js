// Letzter Schritt: fertige FeatureCollection anzeigen, kopieren, herunterladen
const ResultStep = (() => {
  function mount(root, state, api) {
    const fc = api.buildFeatureCollection();
    const json = JSON.stringify(fc, null, 2);
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'result-step';
    wrap.innerHTML = '<h2>Ergebnis: FeatureCollection</h2><div class="result-actions"><button id="copy" type="button">Kopieren</button><button id="dl" type="button" class="primary">Als .geojson herunterladen</button></div><textarea readonly></textarea>';
    wrap.querySelector('textarea').value = json;
    wrap.querySelector('#copy').onclick = () => navigator.clipboard.writeText(json).then(() => api.status('In die Zwischenablage kopiert.'));
    wrap.querySelector('#dl').onclick = () => {
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([json], { type: 'application/geo+json' })),
        download: `adhoc-featurecollection-${new Date().toISOString().slice(0, 10)}.geojson`,
      });
      a.click(); URL.revokeObjectURL(a.href);
    };
    root.append(wrap);
  }
  return { id: 'result', title: 'Ergebnis', mount, isValid: () => true, toFeatures: () => [] };
})();
