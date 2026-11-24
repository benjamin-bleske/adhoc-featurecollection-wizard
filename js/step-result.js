// Letzter Schritt: fertige FeatureCollection anzeigen, kopieren, herunterladen
const ResultStep = (() => {
  function mount(root, state, api) {
    const fc = api.buildFeatureCollection();
    const json = JSON.stringify(fc, null, 2);
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'result-step';
    wrap.innerHTML = '<h2>Ergebnis: FeatureCollection</h2><div class="result-actions"><button id="copy" type="button">Kopieren</button><button id="dl" type="button">Als .geojson herunterladen</button></div><div class="publish"><input id="token" type="password" autocomplete="off" placeholder="GitHub-Token (Contents: Read &amp; write)"><button id="pub" type="button" class="primary">Ins Repo publishen</button></div><p class="hint" id="pubmsg">Veröffentlicht einen Style (<code></code>, enthält die FeatureCollection) und überschreibt die vorherige Version. Die URL danach ins Geoportal ziehen. Das Token bleibt nur im Browser-Tab (sessionStorage).</p><textarea readonly></textarea>';
    wrap.querySelector('textarea').value = json;
    wrap.querySelector('#copy').onclick = () => navigator.clipboard.writeText(json).then(() => api.status('In die Zwischenablage kopiert.'));
    wrap.querySelector('#dl').onclick = () => {
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([json], { type: 'application/geo+json' })),
        download: `adhoc-featurecollection-${new Date().toISOString().slice(0, 10)}.geojson`,
      });
      a.click(); URL.revokeObjectURL(a.href);
    };
    const tok = wrap.querySelector('#token');
    try { tok.value = sessionStorage.getItem('gh-token') ?? ''; } catch {}
    wrap.querySelector('#pubmsg code').textContent = Publish.CFG.path;
    wrap.querySelector('#pub').onclick = async () => {
      if (!tok.value) { api.status('Bitte GitHub-Token eingeben.'); return; }
      try { sessionStorage.setItem('gh-token', tok.value); } catch {}
      api.status('Publishe …');
      try {
        const errs = await Fachdaten.load(fc.fachdaten);
        if (errs.length) api.status('Hinweis, nicht ladbar: ' + errs.join('; '));
        const r = await Publish.publish(JSON.stringify(Publish.buildStyle(fc), null, 2), tok.value);
        wrap.querySelector('#pubmsg').innerHTML = `${r.replaced ? 'Vorherige Version überschrieben' : 'Neu angelegt'}: <a target="_blank" rel="noopener" href="${r.url}">${r.url}</a>`;
        api.status('Veröffentlicht.');
      } catch (err) { api.status('Fehler: ' + err.message); }
    };
    root.append(wrap);
  }
  return { id: 'result', title: 'Ergebnis', mount, isValid: () => true, toFeatures: () => [] };
})();
