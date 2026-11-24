// Erzeugt aus EINER FeatureCollection (Projektbereich) vier Styles und veröffentlicht sie in EINEM Git-Commit:
//   Planungsphase 0: Planungsrecht   (FNP, Regionalplan, LEP, B-Plan, Landschaft/Naturschutz)
//   Planungsphase 0: Fachkonzepte    (Bodenfunktion, dezentrale Wärmeversorgung, Stadtbaumkonzept)
//   Planungsphase 1: Ready2Use       (Geltungsbereich: gleiche Geometrie wie der Projektbereich, schwarz gestrichelt)
//   Planungsphase 1: Ready2hack      (zwei Punkte TwinFlow 101/103 relativ zu Ready2Use, per Filter-Button schaltbar)
//   Planungsphase 1: Entwurf         (Bebauungsentwurf, aus der Geometrie von Ready2Use berechnet, siehe js/entwurf.js)
// Weil alles aus derselben FeatureCollection entsteht und in einem Commit landet, sind die Styles immer synchron:
// ein neuer Bereich ersetzt alle fünf gemeinsam.
const Publish = (() => {
  const CFG = { owner: 'benjamin-bleske', repo: 'adhoc-featurecollection-wizard', branch: 'main' };
  const FILES = {
    planungsrecht: 'published/planungsphase-0-planungsrecht.json',
    fachkonzepte: 'published/planungsphase-0-fachkonzepte.json',
    ready2use: 'published/planungsphase-1-ready2use.json',
    ready2hack: 'published/planungsphase-1-ready2hack.json',
    entwurf: 'published/planungsphase-1-entwurf.json',
    projektbereich: 'published/projektbereich.geojson',
    entwurfgeo: 'published/entwurf.geojson',
  };
  const TITLES = { ready2use: 'Planungsphase 1: Ready2Use', ready2hack: 'Planungsphase 1: Ready2hack', entwurf: 'Planungsphase 1: Entwurf' };
  // fester Text in der Infobox von Ready2Use
  const READY2USE_TEXT = 'Der TwinFlow Umlauf wurde am 24. November 2026 von Benjamin Bleske gestartet.';
  // frühere Dateinamen: werden beim Publishen entfernt (Planungsphase 0 steht dauerhaft im Tag planungsphase-0)
  const LEGACY = ['published/style.json', 'published/planungsrecht.json', 'published/fachkonzepte.json', 'published/geltungsbereich.json'];
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
  const titleOf = key => Fachdaten.GROUPS[key]?.title ?? TITLES[key];
  const siblings = except => ['planungsrecht', 'fachkonzepte', 'ready2use', 'ready2hack', 'entwurf'].filter(k => k !== except).map(k => sibling(k, titleOf(k)));

  // Style "Projektbereich: Planungsrecht" bzw. "Projektbereich: Fachkonzepte"
  function groupStyle(gid, fc, bounds, pbId) {
    const g = Fachdaten.GROUPS[gid];
    const ids = (fc.fachdaten ?? []).filter(id => Fachdaten.CATALOG.find(c => c.id === id)?.group === gid);
    const fd = Fachdaten.toStyleParts(ids, bounds);
    const ds = Fachdaten.toDynamicStyling(ids, fd.byEntry);
    const links = [...Fachdaten.links(ids), ...siblings(gid)];
    const keywords = ['adhoc', pbId, `carmaconf://infoBoxMapping:${Fachdaten.infoboxMapping(ids, { extraKey: 'info_' + gid })}`];
    return {
      version: 8, name: g.title,
      ...(fd.sprite && { sprite: fd.sprite }), ...(fd.glyphs && { glyphs: fd.glyphs }),
      metadata: {
        adhoc: { projektbereich: pbId, styles: FILES },
        carmaConf: { ...(ds.length && { dynamicStyling: ds }), ...zoomTool(bounds),
          layerInfo: { title: g.title, description: [`Projektbereich ${pbId}, gemeinsam veröffentlicht mit allen Planungsphase-Styles.`, ...Fachdaten.describe(ids)].join('\n'), links, keywords } },
      },
      sources: { ...fd.sources, adhoc: { type: 'geojson', data: fcFor(fc, ['info_' + gid], pbId) } },
      layers: [
        ...fd.layers,
        ...outlineLayers('#e00000'),
      ],
    };
  }

  // Style "Planungsphase 1: Ready2Use": Geltungsbereich, Geometrie des Projektbereichs, schwarze gestrichelte Linie
  function ready2useStyle(fc, bounds, pbId) {
    const title = TITLES.ready2use;
    return {
      version: 8, name: title,
      metadata: {
        adhoc: { projektbereich: pbId },
        carmaConf: { ...zoomTool(bounds),
          layerInfo: { title, description: `Geltungsbereich zum Projektbereich ${pbId} (gleiche Geometrie wie der Projektbereich).`,
            links: siblings('ready2use'),
            keywords: ['adhoc', pbId, `carmaconf://infoBoxMapping:${Fachdaten.infoboxMapping([], { title: 'Geltungsbereich', intro: READY2USE_TEXT })}`] } },
      },
      sources: { adhoc: { type: 'geojson', data: fcFor(fc, [], pbId) } },
      layers: outlineLayers('#000000'),
    };
  }

  // zwei Punkte relativ zum Geltungsbereich (Ready2Use): Mitte der Ausdehnung und, auf gleicher Höhe, 20 % der Ost-West-Ausdehnung weiter östlich
  const TWINFLOW = [
    { name: 'TwinFlow 101', color: '#e8590c', text: 'Mitte des Geltungsbereichs' },
    { name: 'TwinFlow 103', color: '#0b6bcb', text: 'auf gleicher Höhe, 20 % der Ausdehnung östlich der Mitte' },
  ];
  function twinflowPoints(bounds) {
    const [x0, y0] = Fachdaten.merc([bounds[0], bounds[1]]), [x1, y1] = Fachdaten.merc([bounds[2], bounds[3]]);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, dx = 0.2 * (x1 - x0);
    return [[cx, cy], [cx + dx, cy]].map((m, i) => ({
      type: 'Feature',
      properties: { name: TWINFLOW[i].name, info_title: TWINFLOW[i].name, info_text: `Planungsphase 1: Ready2hack\nLage: ${TWINFLOW[i].text}` },
      geometry: { type: 'Point', coordinates: Fachdaten.unmerc(m).map(v => +v.toFixed(7)) },
    }));
  }

  // Style "Planungsphase 1: Ready2hack": Geometrie folgt Ready2Use (gleiche FeatureCollection, gleicher Commit);
  // die Punkte sind über den Filter-Button im Layer-Chip einzeln schaltbar
  function ready2hackStyle(fc, bounds, pbId) {
    const title = TITLES.ready2hack;
    const dot = c => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Ccircle cx='6' cy='6' r='5' fill='${encodeURIComponent(c)}'/%3E%3C/svg%3E`;
    const colorMatch = ['match', ['get', 'name'], ...TWINFLOW.flatMap(t => [t.name, t.color]), '#555555'];
    return {
      version: 8, name: title,
      glyphs: 'https://tiles.cismet.de/fonts/{fontstack}/{range}.pbf',
      metadata: {
        adhoc: { projektbereich: pbId, folgt: FILES.ready2use },
        carmaConf: { ...zoomTool(bounds),
          filterConfig: { filterType: 'button', filterMode: 'or', layerPattern: 'r2h-', styles: { iconSize: '12px', selectedBorderColor: 'none' },
            filters: TWINFLOW.map((t, i) => ({ key: 'tf' + (101 + 2 * i), label: t.name, icon: dot(t.color), propertyName: 'name', propertyValue: t.name })) },
          layerInfo: { title, description: `Punkte TwinFlow 101 (Mitte) und TwinFlow 103 (20 % der Ausdehnung östlich) relativ zum Geltungsbereich „${TITLES.ready2use}“, Projektbereich ${pbId}.`,
            links: siblings('ready2hack'),
            keywords: ['adhoc', pbId, `carmaconf://infoBoxMapping:${Fachdaten.infoboxMapping([], {})}`] } },
      },
      sources: { 'r2h-points': { type: 'geojson', data: { type: 'FeatureCollection', projektbereich_id: pbId, features: twinflowPoints(bounds) } } },
      layers: [
        { id: 'r2h-circle', type: 'circle', source: 'r2h-points', paint: { 'circle-radius': 8, 'circle-color': colorMatch, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } },
        { id: 'r2h-label', type: 'symbol', source: 'r2h-points',
          layout: { 'text-field': ['get', 'name'], 'text-font': ['Open Sans Semibold'], 'text-size': 13, 'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-allow-overlap': true },
          paint: { 'text-color': '#222222', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } },
      ],
    };
  }

  // Style "Planungsphase 1: Entwurf": Bebauungsentwurf (Lageplan), berechnet aus der Geometrie von Ready2Use (siehe js/entwurf.js)
  function entwurfStyle(design, bounds, pbId) {
    const title = TITLES.entwurf, st = design.stats;
    const infobox = "function createInfoBoxInfo(p){ var n = { gruen: 'Grünfläche mit Hecke', strasse: 'Privatstraße', parken: 'Stellplätze', parken_braun: 'Stellplätze (gepflastert)', haus: p.titel, baum: 'Baum', strassenachse: 'Privatstraße' }; return { header: 'Planungsphase 1: Entwurf', headerColor: '#5d7430', title: n[p.kind] || 'Entwurf', additionalInfo: p.text || '' }; }";
    return {
      version: 8, name: title,
      glyphs: 'https://tiles.cismet.de/fonts/{fontstack}/{range}.pbf',
      metadata: {
        adhoc: { projektbereich: pbId, folgt: FILES.ready2use, entwurf: st },
        carmaConf: { ...zoomTool(bounds),
          layerInfo: { title, description: `Bebauungsentwurf (Lageplan) zum Geltungsbereich „${TITLES.ready2use}“, Projektbereich ${pbId}: ${st.haeuser} Reihenhaus-Zeilen (${st.einheiten} Einheiten), ${st.stellplaetze} Stellplätze, ${st.baeume} Bäume. Berechnet aus der Geometrie, immer synchron mit Ready2Use.`,
            links: siblings('entwurf'), keywords: ['adhoc', pbId, `carmaconf://infoBoxMapping:${infobox}`] } },
      },
      sources: { entwurf: { type: 'geojson', data: design } },
      layers: Entwurf.layers('entwurf'),
    };
  }

  // alle fünf Styles aus derselben FeatureCollection
  function buildStyles(fc, design = Entwurf.build(fc)) {
    const bounds = extent(fc), pbId = projektbereichId(fc);
    return {
      planungsrecht: groupStyle('planungsrecht', fc, bounds, pbId),
      fachkonzepte: groupStyle('fachkonzepte', fc, bounds, pbId),
      ready2use: ready2useStyle(fc, bounds, pbId),
      ready2hack: ready2hackStyle(fc, bounds, pbId),
      entwurf: entwurfStyle(design, bounds, pbId),
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
    const design = Entwurf.build(fc), styles = buildStyles(fc, design), id = projektbereichId(fc);
    const files = {
      [FILES.planungsrecht]: JSON.stringify(styles.planungsrecht, null, 2),
      [FILES.fachkonzepte]: JSON.stringify(styles.fachkonzepte, null, 2),
      [FILES.ready2use]: JSON.stringify(styles.ready2use, null, 2),
      [FILES.ready2hack]: JSON.stringify(styles.ready2hack, null, 2),
      [FILES.entwurf]: JSON.stringify(styles.entwurf, null, 2),
      [FILES.entwurfgeo]: JSON.stringify(design, null, 2),
      [FILES.projektbereich]: JSON.stringify({ ...fc, projektbereich_id: id }, null, 2),
      ...Object.fromEntries(LEGACY.map(p => [p, null])),
    };
    const sha = await commitFiles(files, token, `Publish Projektbereich ${id} (Planungsphase 0 + 1, inkl. Entwurf) ${new Date().toISOString()}`);
    return { sha, id, urls: Object.fromEntries(Object.keys(FILES).map(k => [k, raw(FILES[k], sha)])) };
  }

  return { publish, buildStyles, commitFiles, projektbereichId, extent, twinflowPoints, FILES, TITLES, CFG, raw };
})();
