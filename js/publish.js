// Erzeugt aus EINER FeatureCollection (Projektbereich) drei Styles und veröffentlicht sie in EINEM Git-Commit:
//   published/planungsrecht.json    "Projektbereich: Planungsrecht"  (FNP, Regionalplan, LEP, B-Plan, Landschaft/Naturschutz)
//   published/fachkonzepte.json     "Projektbereich: Fachkonzepte"   (Bodenfunktion, dezentrale Wärmeversorgung, Stadtbaumkonzept)
//   published/geltungsbereich.json  "Geltungsbereich"                (gleiche Geometrie wie der Projektbereich, schwarz gestrichelt)
//   published/projektbereich.geojson  die gemeinsame Geometrie
// Weil alles aus derselben FeatureCollection entsteht und in einem Commit landet, sind die Styles immer synchron:
// ein neuer Bereich ersetzt alle drei gemeinsam.
const Publish = (() => {
  const CFG = { owner: 'benjamin-bleske', repo: 'adhoc-featurecollection-wizard', branch: 'main' };
  const FILES = {
    planungsrecht: 'published/planungsrecht.json',
    fachkonzepte: 'published/fachkonzepte.json',
    geltungsbereich: 'published/geltungsbereich.json',
    projektbereich: 'published/projektbereich.geojson',
  };
  const LEGACY = ['published/style.json']; // Planungsphase 0 (steht dauerhaft im Tag planungsphase-0)
  const raw = (path, ref = CFG.branch) => `https://raw.githubusercontent.com/${CFG.owner}/${CFG.repo}/${ref}/${path}`;

  // [west, süd, ost, nord] über alle Koordinaten der FeatureCollection
  function extent(fc) {
    let w = 180, s = 90, e = -180, n = -90;
    const walk = c => Array.isArray(c[0]) ? c.forEach(walk) : (w = Math.min(w, c[0]), e = Math.max(e, c[0]), s = Math.min(s, c[1]), n = Math.max(n, c[1]));
    fc.features.forEach(f => walk(f.geometry.coordinates));
    return fc.features.length ? [w, s, e, n].map(v => +v.toFixed(6)) : null;
  }

  // kurze, stabile Kennung der Geometrie: verbindet die Styles eines Projektbereichs
  function projektbereichId(fc) {
    let h = 2166136261;
    const str = JSON.stringify(fc.features.map(f => f.geometry));
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 'pb-' + (h >>> 0).toString(16);
  }

  // FeatureCollection für einen Style: nur die Infobox-Eigenschaften, die dieser Style braucht
  const INFO_KEYS = ['info_planungsrecht', 'info_fachkonzepte'];
  function fcFor(fc, keepKeys, id) {
    return {
      type: 'FeatureCollection', projektbereich_id: id,
      features: fc.features.map(f => ({
        ...f,
        properties: Object.fromEntries(Object.entries(f.properties).filter(([k]) => !INFO_KEYS.includes(k) || keepKeys.includes(k))),
      })),
    };
  }

  // gestrichelter Umriss ohne sichtbare Füllung (die Fläche ist praktisch unsichtbar, damit ein Klick die Infobox öffnet)
  const outlineLayers = color => [
    { id: 'adhoc-fill', type: 'fill', source: 'adhoc', paint: { 'fill-color': color, 'fill-opacity': 0.000001 } },
    { id: 'adhoc-line', type: 'line', source: 'adhoc', layout: { 'line-join': 'round' },
      paint: { 'line-color': color, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 16, 4, 20, 6], 'line-dasharray': [3, 1.5] } },
  ];

  const zoomTool = bounds => bounds && { tools: [{ kind: 'zoomToExtent', config: { label: 'Auf den Projektbereich zoomen', bounds } }] };
  const sibling = (key, title) => ({ url: raw(FILES[key]), text: `${title} (Style)` });

  // Style "Projektbereich: Planungsrecht" bzw. "Projektbereich: Fachkonzepte"
  function groupStyle(gid, fc, bounds, pbId) {
    const g = Fachdaten.GROUPS[gid];
    const ids = (fc.fachdaten ?? []).filter(id => Fachdaten.CATALOG.find(c => c.id === id)?.group === gid);
    const fd = Fachdaten.toStyleParts(ids, bounds);
    const ds = Fachdaten.toDynamicStyling(ids, fd.byEntry);
    const bbox = Fachdaten.bboxFeature(ids, bounds);
    const others = Object.entries(Fachdaten.GROUPS).filter(([k]) => k !== gid).map(([k, o]) => sibling(k, o.title));
    const links = [...Fachdaten.links(ids), ...others, sibling('geltungsbereich', 'Geltungsbereich')];
    const keywords = ['adhoc', pbId, `carmaconf://infoBoxMapping:${Fachdaten.infoboxMapping(ids, { extraKey: 'info_' + gid })}`];
    return {
      version: 8, name: g.title,
      ...(fd.sprite && { sprite: fd.sprite }), ...(fd.glyphs && { glyphs: fd.glyphs }),
      metadata: {
        adhoc: { projektbereich: pbId, styles: FILES },
        carmaConf: { ...(ds.length && { dynamicStyling: ds }), ...zoomTool(bounds),
          layerInfo: { title: g.title, description: [`Projektbereich ${pbId}, gemeinsam veröffentlicht mit den Styles „Projektbereich: Planungsrecht“, „Projektbereich: Fachkonzepte“ und „Geltungsbereich“.`, ...Fachdaten.describe(ids)].join('\n'), links, keywords } },
      },
      sources: { ...fd.sources, ...(bbox && { 'adhoc-bbox': { type: 'geojson', data: { type: 'FeatureCollection', features: [bbox] } } }), adhoc: { type: 'geojson', data: fcFor(fc, ['info_' + gid], pbId) } },
      layers: [
        ...fd.layers,
        ...(bbox ? [{ id: 'adhoc-bbox', type: 'line', source: 'adhoc-bbox', layout: { visibility: 'none' }, paint: { 'line-color': '#0b6bcb', 'line-width': 1.5, 'line-dasharray': [4, 3] } }] : []),
        ...outlineLayers('#e00000'),
      ],
    };
  }

  // Style "Geltungsbereich": Geometrie des Projektbereichs, schwarze gestrichelte Linie
  function geltungsStyle(fc, bounds, pbId) {
    const title = 'Geltungsbereich';
    return {
      version: 8, name: title,
      metadata: {
        adhoc: { projektbereich: pbId },
        carmaConf: { ...zoomTool(bounds),
          layerInfo: { title, description: `Geltungsbereich zum Projektbereich ${pbId} (gleiche Geometrie wie der Projektbereich, Planungsphase 0).`,
            links: Object.entries(Fachdaten.GROUPS).map(([k, o]) => sibling(k, o.title)),
            keywords: ['adhoc', pbId, `carmaconf://infoBoxMapping:${Fachdaten.infoboxMapping([], { title })}`] } },
      },
      sources: { adhoc: { type: 'geojson', data: fcFor(fc, [], pbId) } },
      layers: outlineLayers('#000000'),
    };
  }

  // alle drei Styles aus derselben FeatureCollection
  function buildStyles(fc) {
    const bounds = extent(fc), pbId = projektbereichId(fc);
    return {
      planungsrecht: groupStyle('planungsrecht', fc, bounds, pbId),
      fachkonzepte: groupStyle('fachkonzepte', fc, bounds, pbId),
      geltungsbereich: geltungsStyle(fc, bounds, pbId),
    };
  }

  // Dateien (Pfad -> Inhalt, null = löschen) in EINEM Commit schreiben (Git Data API)
  async function commitFiles(files, token, message) {
    const base = `https://api.github.com/repos/${CFG.owner}/${CFG.repo}`;
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' };
    const j = async (url, init = {}) => {
      const res = await fetch(url, { headers, cache: 'no-store', ...init });
      if (!res.ok) throw new Error(`GitHub HTTP ${res.status}: ${(await res.json().catch(() => ({}))).message ?? ''}`);
      return res.json();
    };
    const parent = (await j(`${base}/git/ref/heads/${CFG.branch}`)).object.sha;
    const treeSha = (await j(`${base}/git/commits/${parent}`)).tree.sha;
    const existing = new Set((await j(`${base}/git/trees/${treeSha}?recursive=1`)).tree.map(t => t.path));
    const tree = Object.entries(files).filter(([p, c]) => c !== null || existing.has(p))
      .map(([path, c]) => c === null ? { path, mode: '100644', type: 'blob', sha: null } : { path, mode: '100644', type: 'blob', content: c });
    const newTree = await j(`${base}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: treeSha, tree }) });
    const commit = await j(`${base}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }) });
    await j(`${base}/git/refs/heads/${CFG.branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
    return commit.sha;
  }

  // Publiziert alle Styles gemeinsam. Die URLs enthalten die Commit-SHA: unveränderlich und sofort aktuell
  // (raw.githubusercontent.com cached pro Pfad ~5 Min und ignoriert ?query).
  async function publish(fc, token) {
    const styles = buildStyles(fc), id = projektbereichId(fc);
    const files = {
      [FILES.planungsrecht]: JSON.stringify(styles.planungsrecht, null, 2),
      [FILES.fachkonzepte]: JSON.stringify(styles.fachkonzepte, null, 2),
      [FILES.geltungsbereich]: JSON.stringify(styles.geltungsbereich, null, 2),
      [FILES.projektbereich]: JSON.stringify({ ...fc, projektbereich_id: id }, null, 2),
      ...Object.fromEntries(LEGACY.map(p => [p, null])),
    };
    const sha = await commitFiles(files, token, `Publish Projektbereich ${id} (Planungsrecht, Fachkonzepte, Geltungsbereich) ${new Date().toISOString()}`);
    return { sha, id, urls: Object.fromEntries(Object.keys(FILES).map(k => [k, raw(FILES[k], sha)])) };
  }

  return { publish, buildStyles, commitFiles, projektbereichId, extent, FILES, CFG, raw };
})();
