// Veröffentlicht den Style (inkl. FeatureCollection) per GitHub Contents API ins Repo.
// Feste Zielpfad-Datei -> jede neue Veröffentlichung überschreibt die vorherige.
const Publish = (() => {
  const CFG = { owner: 'benjamin-bleske', repo: 'adhoc-featurecollection-wizard', branch: 'main', path: 'published/style.json' };
  const api = `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.path}`;
  const rawUrl = `https://raw.githubusercontent.com/${CFG.owner}/${CFG.repo}/${CFG.branch}/${CFG.path}`;

  const b64 = s => { const b = new TextEncoder().encode(s); let t = ''; b.forEach(c => t += String.fromCharCode(c)); return btoa(t); };

  // MapLibre-Style, wie ihn das Geoportal per Drop erwartet (URL auf .json):
  // FeatureCollection inline als geojson-Source + Fill/Line-Layer + carmaConf-Metadaten.
  // Kein `instant`: ein instant hinzugefügter Layer verliert im Geoportal sein zoomToExtent-Tool (Lupe).
  // [west, süd, ost, nord] über alle Koordinaten der FeatureCollection
  function extent(fc) {
    let w = 180, s = 90, e = -180, n = -90;
    const walk = c => Array.isArray(c[0]) ? c.forEach(walk) : (w = Math.min(w, c[0]), e = Math.max(e, c[0]), s = Math.min(s, c[1]), n = Math.max(n, c[1]));
    fc.features.forEach(f => walk(f.geometry.coordinates));
    return fc.features.length ? [w, s, e, n].map(v => +v.toFixed(6)) : null;
  }

  // Infobox des Geoportals: Zeilen "key: ausdruck" (p = Feature-Properties), als Keyword carmaconf://infoBoxMapping:<zeile>
  const INFOBOX_MAPPING = ['title: p.info_title', 'additionalInfo: p.info_text'];

  function buildStyle(fc) {
    const title = 'Adhoc-Projektbereich';
    const bounds = extent(fc);
    const fd = Fachdaten.toStyleParts(fc.fachdaten, bounds);
    const ds = Fachdaten.toDynamicStyling(fc.fachdaten);
    return {
      version: 8, name: title,
      metadata: { carmaConf: { ...(ds.length && { dynamicStyling: ds }), ...(bounds && { tools: [{ kind: 'zoomToExtent', config: { label: 'Auf den Projektbereich zoomen', bounds } }] }), layerInfo: { title, description: 'Ad-hoc FeatureCollection aus dem Wizard', keywords: ['adhoc', ...INFOBOX_MAPPING.map(l => `carmaconf://infoBoxMapping:${l}`)] } } },
      sources: { ...fd.sources, adhoc: { type: 'geojson', data: fc } },
      layers: [
        ...fd.layers,
        { id: 'adhoc-fill', type: 'fill', source: 'adhoc', paint: { 'fill-color': '#e8590c', 'fill-opacity': 0.35 } },
        { id: 'adhoc-line', type: 'line', source: 'adhoc', paint: { 'line-color': '#e8590c', 'line-width': 2 } },
      ],
    };
  }

  async function publish(json, token) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    // vorhandene Datei -> sha nötig zum Überschreiben
    const cur = await fetch(`${api}?ref=${CFG.branch}`, { headers, cache: 'no-store' });
    if (cur.status !== 404 && !cur.ok) throw new Error(`GitHub HTTP ${cur.status}`);
    const sha = cur.ok ? (await cur.json()).sha : undefined;
    const res = await fetch(api, {
      method: 'PUT', headers,
      body: JSON.stringify({
        message: `Publish FeatureCollection ${new Date().toISOString()}`,
        content: b64(json), branch: CFG.branch, ...(sha && { sha }),
      }),
    });
    if (!res.ok) throw new Error(`GitHub HTTP ${res.status}: ${(await res.json().catch(() => ({}))).message ?? ''}`);
    // raw.githubusercontent.com cached pro Pfad ~5 Min und ignoriert ?query. Die URL mit Commit-SHA ist
    // dagegen unveränderlich und sofort aktuell -> diese ins Geoportal ziehen.
    const sha2 = (await res.json()).commit.sha;
    return { replaced: !!sha, url: `https://raw.githubusercontent.com/${CFG.owner}/${CFG.repo}/${sha2}/${CFG.path}` };
  }

  return { publish, buildStyle, rawUrl, CFG };
})();
