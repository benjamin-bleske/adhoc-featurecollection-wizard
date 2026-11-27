// Erzeugt aus EINER FeatureCollection (Projektbereich) sechs Styles und veröffentlicht sie in EINEM Git-Commit:
//   Planungsphase 0: Planungsrecht   (FNP, Regionalplan, LEP, B-Plan, Landschaft/Naturschutz)
//   Planungsphase 0: Fachkonzepte    (Bodenfunktion, dezentrale Wärmeversorgung, Stadtbaumkonzept)
//   Planungsphase 0: Erschließung    (noch leer: nur der Umriss des Projektbereichs)
//   Planungsphase 1: Ready2Use       (Geltungsbereich, schwarz gestrichelt, + Bebauungsentwurf; Dropdown: "Geltungsbereich" / "Geltungsbereich und Entwurf")
//   Planungsphase 1: Ready2hack      (TwinFlow 101 bis 106 nach festen Abstandsregeln relativ zu Ready2Use, per Filter-Button schaltbar, mit Datenblatt)
//   Planungsphase 2: Zukunftsvision  (wie Ready2Use, Geltungsbereich mit doppelter Fläche, Entwurf in Bauabschnitten, js/vision.js)
// Weil alles aus derselben FeatureCollection entsteht und in einem Commit landet, sind die Styles immer synchron:
// ein neuer Bereich ersetzt alle sechs gemeinsam.
const Publish = (() => {
  const CFG = { owner: 'benjamin-bleske', repo: 'adhoc-featurecollection-wizard', branch: 'main' };
  const FILES = {
    planungsrecht: 'published/planungsphase-0-planungsrecht.json',
    fachkonzepte: 'published/planungsphase-0-fachkonzepte.json',
    erschliessung: 'published/planungsphase-0-erschliessung.json',
    ready2use: 'published/planungsphase-1-ready2use.json',
    ready2hack: 'published/planungsphase-1-ready2hack.json',
    vision: 'published/planungsphase-2-zukunftsvision.json',
    projektbereich: 'published/projektbereich.geojson',
    entwurfgeo: 'published/entwurf.geojson',
    visiongeo: 'published/zukunftsvision.geojson',
    datenblatt: 'published/twinflow-datenblatt.html',
    ressorts: 'published/twinflow-ressorts.json',
  };
  const TITLES = { ready2use: 'Planungsphase 1: Ready2Use', ready2hack: 'Planungsphase 1: Ready2hack', vision: 'Planungsphase 2: Zukunftsvision' };
  // fester Text in der Infobox von Ready2Use
  const PAGES = `https://${CFG.owner}.github.io/${CFG.repo}/`; // GitHub Pages: liefert HTML (raw.githubusercontent.com liefert nur Text)
  // true, sobald die Komponente twinFlowSIM in carma ausgeliefert ist (docs/carma-datenblatt/): Info-Symbol öffnet dann das Datenblatt im Geoportal-Fenster
  const USE_SIM = false;
  const READY2USE_TEXT = 'Der TwinFlow Umlauf wurde am 24. November 2026 von Benjamin Bleske gestartet.';
  // frühere Dateinamen: werden beim Publishen entfernt (Planungsphase 0 steht dauerhaft im Tag planungsphase-0)
  const LEGACY = ['published/style.json', 'published/planungsrecht.json', 'published/fachkonzepte.json', 'published/geltungsbereich.json', 'published/planungsphase-1-entwurf.json'];
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
  const siblings = except => ['planungsrecht', 'fachkonzepte', 'erschliessung', 'ready2use', 'ready2hack', 'vision'].filter(k => k !== except).map(k => sibling(k, titleOf(k)));

  // Styles der Planungsphase 0 (eine Gruppe aus Fachdaten.GROUPS je Style; ohne Fachdaten bleibt nur der Umriss)
  function groupStyle(gid, fc, bounds, pbId) {
    const g = Fachdaten.GROUPS[gid];
    const ids = (fc.fachdaten ?? []).filter(id => Fachdaten.CATALOG.find(c => c.id === id)?.group === gid);
    const fd = Fachdaten.toStyleParts(ids, bounds);
    const ds = Fachdaten.toDynamicStyling(ids, fd.byEntry);
    const links = [...Fachdaten.links(ids), ...siblings(gid)];
    const keywords = ['adhoc', pbId, `carmaconf://infoBoxMapping:${Fachdaten.infoboxMapping(ids, { extraKey: 'info_' + gid, intro: g.infoText })}`];
    return {
      version: 8, name: g.title,
      ...(fd.sprite && { sprite: fd.sprite }), ...(fd.glyphs && { glyphs: fd.glyphs }),
      metadata: {
        adhoc: { projektbereich: pbId, styles: FILES },
        carmaConf: { ...(ds.length && { dynamicStyling: ds }), ...zoomTool(bounds),
          layerInfo: { title: g.title, description: [`Projektbereich ${pbId}, gemeinsam veröffentlicht mit allen Planungsphase-Styles.`, ...(g.description ? [g.description] : []), ...Fachdaten.describe(ids)].join('\n'), links, keywords } },
      },
      sources: { ...fd.sources, adhoc: { type: 'geojson', data: fcFor(fc, ['info_' + gid], pbId) } },
      layers: [
        ...fd.layers,
        ...outlineLayers('#e00000'),
      ],
    };
  }

  // Infobox für Objekte des Entwurfs (Features mit `kind`); Header zeigt die gewählte Ebene
  const ENTWURF_INFOBOX = "function createInfoBoxInfo(p){ var n = { gruen: 'Grünfläche mit Hecke', strasse: 'Privatstraße', parken: 'Stellplätze', parken_braun: 'Stellplätze (gepflastert)', haus: p.titel, baum: 'Baum', strassenachse: 'Privatstraße' }; return { header: 'Geltungsbereich und Entwurf', headerColor: '#5d7430', title: n[p.kind] || 'Entwurf', additionalInfo: p.text || '' }; }";

  // Style "Planungsphase 1: Ready2Use": Geltungsbereich (Geometrie des Projektbereichs, schwarz gestrichelt) und der daraus berechnete Entwurf
  // (js/entwurf.js). Im Dropdown des Layer-Buttons: "Geltungsbereich" (nur Umriss) oder "Geltungsbereich und Entwurf".
  function ready2useStyle(fc, bounds, pbId, design) {
    const title = TITLES.ready2use, st = design.stats;
    const entLayers = Entwurf.layers('entwurf').map(l => ({ ...l, layout: { ...l.layout, visibility: 'none' } })); // Standard: nur Geltungsbereich
    const ids = entLayers.map(l => l.id);
    const options = [
      { id: 'geltungsbereich', title: 'Geltungsbereich', vis_entwurf: 'none' },
      { id: 'geltungsbereich_entwurf', title: 'Geltungsbereich und Entwurf', vis_entwurf: 'visible' },
    ];
    const geltung = Fachdaten.infoboxMapping([], { title: 'Geltungsbereich', intro: READY2USE_TEXT });
    // eine Funktion für beide Objektarten: Entwurfs-Features tragen `kind`, der Geltungsbereich nicht
    const infobox = `function createInfoBoxInfo(p){ var E = (${ENTWURF_INFOBOX}); var G = (${geltung}); return p.kind ? E(p) : G(p); }`;
    const [fill, line] = outlineLayers('#000000');
    return {
      version: 8, name: title,
      glyphs: 'https://tiles.cismet.de/fonts/{fontstack}/{range}.pbf',
      metadata: {
        adhoc: { projektbereich: pbId, entwurf: st },
        carmaConf: { ...zoomTool(bounds),
          dynamicStyling: [{ type: 'list', label: 'Ebene', default: 'geltungsbereich', showIcon: false, options, targets: { vis_entwurf: ids.map(id => `layers.${id}.layout.visibility`) } }],
          layerInfo: { title, description: `Geltungsbereich zum Projektbereich ${pbId} (gleiche Geometrie wie der Projektbereich). Ebene „Geltungsbereich und Entwurf“: Bebauungsentwurf (Lageplan) mit ${st.haeuser} Reihenhaus-Zeilen (${st.einheiten} Einheiten), ${st.stellplaetze} Stellplätzen und ${st.baeume} Bäumen, berechnet aus der Geometrie (js/entwurf.js), immer synchron mit dem Geltungsbereich.`,
            links: siblings('ready2use'), keywords: ['adhoc', pbId, `carmaconf://infoBoxMapping:${infobox}`] } },
      },
      sources: { adhoc: { type: 'geojson', data: fcFor(fc, [], pbId) }, entwurf: { type: 'geojson', data: design } },
      // Reihenfolge: unsichtbare Trefferfläche, Entwurf (klickbar, wenn sichtbar), Umriss oben
      layers: [fill, ...entLayers, line],
    };
  }

  // Lage der TwinFlows: feste Abstandsregeln relativ zur Ausdehnung des Geltungsbereichs (siehe js/ressorts.js):
  // Ausgangspunkt ist die Mitte der Ausdehnung; dx/dy sind Anteile der Ost-West-Breite bzw. Nord-Süd-Höhe (Schritt 20 %).
  //   101 Mitte · 102 20 % westlich · 103 20 % östlich · 104 20 % nördlich · 105 20 % südlich · 106 40 % östlich
  // Alle Punkte müssen INNERHALB des Geltungsbereichs liegen: liegt der Sollpunkt außerhalb der Fläche (unregelmäßige Form,
  // Löcher), wird er auf die nächstgelegene geeignete Stelle innerhalb verschoben (Mindestabstand zum Rand und zu bereits gesetzten Punkten).
  function twinflowPoints(bounds, fc) {
    const [x0, y0] = Fachdaten.merc([bounds[0], bounds[1]]), [x1, y1] = Fachdaten.merc([bounds[2], bounds[3]]);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0, s = 1 / Math.cos(bounds[1] * Math.PI / 180);
    const polys = fc ? fc.features.flatMap(f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(poly => poly.map(r => r.map(Fachdaten.merc))) : [];
    const pip = (pt, ring) => { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
    const inside = pt => polys.some(poly => pip(pt, poly[0]) && !poly.slice(1).some(r => pip(pt, r)));
    const dEdge = pt => { let m = Infinity; for (const poly of polys) for (const ring of poly) for (let i = 0; i < ring.length - 1; i++) { const [ax, ay] = ring[i], [bx, by] = ring[i + 1], vx = bx - ax, vy = by - ay; const t = Math.max(0, Math.min(1, ((pt[0] - ax) * vx + (pt[1] - ay) * vy) / (vx * vx + vy * vy || 1))); m = Math.min(m, Math.hypot(pt[0] - ax - t * vx, pt[1] - ay - t * vy)); } return m; };
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const ext = Math.max(w, h), margin = 0.02 * ext, minSep = 0.07 * ext;
    // Kandidaten: Gitter über die Ausdehnung, nur Punkte innerhalb mit Randabstand
    const cand = [];
    if (polys.length) for (let i = 0; i <= 80; i++) for (let j = 0; j <= 80; j++) { const pt = [x0 + w * i / 80, y0 + h * j / 80]; if (inside(pt) && dEdge(pt) >= margin) cand.push(pt); }
    const target = Ressorts.LISTE.map(r => [cx + r.dx * w, cy + r.dy * h]);
    const placed = new Array(target.length), done = [];
    // zuerst die Punkte, die schon innerhalb liegen (exakte Regel), dann die übrigen nach nächstem Kandidaten
    target.forEach((t, k) => { if (!polys.length || (inside(t) && dEdge(t) >= margin && done.every(q => dist(q, t) >= minSep))) { placed[k] = t; done.push(t); } });
    target.forEach((t, k) => {
      if (placed[k]) return;
      const free = cand.filter(c => done.every(q => dist(q, c) >= minSep));
      const best = (free.length ? free : cand).reduce((a, c) => !a || dist(c, t) < dist(a, t) ? c : a, null) || t;
      placed[k] = best; done.push(best);
    });
    return Ressorts.LISTE.map((r, k) => {
      const moved = dist(placed[k], target[k]) / s;
      return {
        type: 'Feature',
        properties: {
          name: r.twinflow, ressort: r.id, ressort_name: r.name, farbe: r.farbe,
          lage: moved > 1 ? `${r.regel}, auf die nächstgelegene Stelle innerhalb des Geltungsbereichs verschoben (ca. ${Math.round(moved)} m)` : r.regel,
          verschoben_m: Math.round(moved),
          beitrag: r.beitraege[0], datenblatt: `${PAGES}${FILES.datenblatt}#${Datenblatt.slug(r.twinflow)}`,
          ...(r.bild && { bild: `${PAGES}published/${r.bild}`, bild_hinweis: r.bild_hinweis }),
          info_title: r.twinflow, info_text: `Planungsphase 1: Ready2hack\nLage: ${r.regel}`,
        },
        geometry: { type: 'Point', coordinates: Fachdaten.unmerc(placed[k]).map(v => +v.toFixed(7)) },
      };
    });
  }

  // Style "Planungsphase 1: Ready2hack": Geometrie folgt Ready2Use (gleiche FeatureCollection, gleicher Commit);
  // die Punkte sind über den Filter-Button im Layer-Chip einzeln schaltbar
  function ready2hackStyle(fc, bounds, pbId) {
    const title = TITLES.ready2hack;
    const infobox = "function createInfoBoxInfo(p){ var e = function (x) { return String(x).split('&').join('&amp;').split('<').join('&lt;'); }; return { header: 'Planungsphase 1: Ready2hack', headerColor: p.farbe, title: p.name, subtitle: 'Ressort ' + p.ressort + ': ' + p.ressort_name, additionalInfo: '<html><b>Lage:</b> ' + e(p.lage) + '<br/><b>Beitrag:</b> ' + e(p.beitrag) + '<br/><small>Stellungnahme, Datenangebot und Diskussion im Datenblatt (Info-Symbol).</small>' + (p.bild ? '<br/><img src=\\'' + p.bild + '\\' alt=\\'Schlagloch\\' style=\\'width:100%;margin-top:6px\\'/><br/><small>' + e(p.bild_hinweis) + '</small>' : '') + '</html>', genericLinks: [{ url: p.datenblatt, tooltip: 'Datenblatt', iconname: 'info' }]" + (USE_SIM ? ", modal: 'twinFlowSIM'" : '') + " }; }";
    const dot = c => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Ccircle cx='6' cy='6' r='5' fill='${encodeURIComponent(c)}'/%3E%3C/svg%3E`;
    const colorMatch = ['match', ['get', 'name'], ...Ressorts.LISTE.flatMap(r => [r.twinflow, r.farbe]), '#555555'];
    return {
      version: 8, name: title,
      glyphs: 'https://tiles.cismet.de/fonts/{fontstack}/{range}.pbf',
      metadata: {
        adhoc: { projektbereich: pbId, folgt: FILES.ready2use },
        carmaConf: { ...zoomTool(bounds),
          filterConfig: { filterType: 'button', filterMode: 'or', layerPattern: 'r2h-', styles: { iconSize: '12px', selectedBorderColor: 'none' },
            filters: Ressorts.LISTE.map(r => ({ key: 'tf' + r.id, label: r.twinflow, icon: dot(r.farbe), propertyName: 'name', propertyValue: r.twinflow })) },
          layerInfo: { title, description: `TwinFlows 101 bis 106 (je Ressort einer) nach festen Abstandsregeln relativ zum Geltungsbereich „${TITLES.ready2use}“, Projektbereich ${pbId}. Datenblatt über das Info-Symbol in der Infobox.`,
            links: siblings('ready2hack'),
            keywords: ['adhoc', pbId, `carmaconf://infoBoxMapping:${infobox}`] } },
      },
      sources: { 'r2h-points': { type: 'geojson', data: { type: 'FeatureCollection', projektbereich_id: pbId, features: twinflowPoints(bounds, fc) } } },
      layers: [
        { id: 'r2h-circle', type: 'circle', source: 'r2h-points', paint: { 'circle-radius': 8, 'circle-color': colorMatch, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } },
        { id: 'r2h-label', type: 'symbol', source: 'r2h-points',
          layout: { 'text-field': ['get', 'name'], 'text-font': ['Open Sans Semibold'], 'text-size': 13, 'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-allow-overlap': true },
          paint: { 'text-color': '#222222', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } },
      ],
    };
  }

  // Style "Planungsphase 2: Zukunftsvision" (Flächengedächnis): Funktionsweise wie Ready2Use, aber mit eigenem, doppelt so großem
  // Geltungsbereich und dem Entwurf in Bauabschnitten (js/vision.js)
  function visionStyle(vision, pbId) {
    const title = TITLES.vision, { area, design } = vision, st = design.stats, bounds = extent(area);
    const entLayers = Vision.layers('entwurf').map(l => ({ ...l, layout: { ...l.layout, visibility: 'none' } }));
    const options = [
      { id: 'geltungsbereich', title: 'Geltungsbereich', vis_entwurf: 'none' },
      { id: 'geltungsbereich_entwurf', title: 'Geltungsbereich und Entwurf', vis_entwurf: 'visible' },
    ];
    const geltung = Fachdaten.infoboxMapping([], { title: 'Geltungsbereich Zukunftsvision', intro: Vision.TEXT });
    const infobox = `function createInfoBoxInfo(p){ var E = (${Vision.INFOBOX}); var G = (${geltung}); return p.kind ? E(p) : G(p); }`;
    const [fill, line] = outlineLayers('#000000');
    return {
      version: 8, name: title,
      glyphs: 'https://tiles.cismet.de/fonts/{fontstack}/{range}.pbf',
      metadata: {
        adhoc: { projektbereich: pbId, entwurf: st },
        carmaConf: { ...zoomTool(bounds),
          dynamicStyling: [{ type: 'list', label: 'Ebene', default: 'geltungsbereich', showIcon: false, options, targets: { vis_entwurf: entLayers.map(l => `layers.${l.id}.layout.visibility`) } }],
          layerInfo: { title, description: `Flächengedächnis über die Zukunftsvision zum Projektbereich ${pbId}: Geltungsbereich mit doppelter Fläche. Ebene „Geltungsbereich und Entwurf“: Vision in ${st.abschnitte} Bauabschnitten mit ${st.baufelder} Baufeldern, ${st.haeuser} Gebäuden und ${st.baeume} Bäumen, berechnet aus der Geometrie (js/vision.js). Zeithorizonte sind beispielhaft.`,
            links: siblings('vision'), keywords: ['adhoc', pbId, `carmaconf://infoBoxMapping:${infobox}`] } },
      },
      sources: { adhoc: { type: 'geojson', data: { ...area, projektbereich_id: pbId } }, entwurf: { type: 'geojson', data: design } },
      layers: [fill, ...entLayers, line],
    };
  }

  // alle sechs Styles aus derselben FeatureCollection
  function buildStyles(fc, design = Entwurf.build(fc), vision = Vision.build(fc)) {
    const bounds = extent(fc), pbId = projektbereichId(fc);
    return {
      planungsrecht: groupStyle('planungsrecht', fc, bounds, pbId),
      fachkonzepte: groupStyle('fachkonzepte', fc, bounds, pbId),
      erschliessung: groupStyle('erschliessung', fc, bounds, pbId),
      ready2use: ready2useStyle(fc, bounds, pbId, design),
      ready2hack: ready2hackStyle(fc, bounds, pbId),
      vision: visionStyle(vision, pbId),
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

  // Alle Dateien des Publish (Pfad -> Inhalt; null = löschen), ohne Netzwerk. Vorher Fachdaten.load/analyse aufrufen (wie step-result.js).
  function buildFiles(fc) {
    const design = Entwurf.build(fc), vision = Vision.build(fc), styles = buildStyles(fc, design, vision), id = projektbereichId(fc);
    const files = {
      [FILES.planungsrecht]: JSON.stringify(styles.planungsrecht, null, 2),
      [FILES.fachkonzepte]: JSON.stringify(styles.fachkonzepte, null, 2),
      [FILES.erschliessung]: JSON.stringify(styles.erschliessung, null, 2),
      [FILES.ready2use]: JSON.stringify(styles.ready2use, null, 2),
      [FILES.ready2hack]: JSON.stringify(styles.ready2hack, null, 2),
      [FILES.vision]: JSON.stringify(styles.vision, null, 2),
      [FILES.visiongeo]: JSON.stringify({ type: 'FeatureCollection', projektbereich_id: id, features: [...vision.area.features, ...vision.design.features] }, null, 2),
      [FILES.projektbereich]: JSON.stringify({ ...fc, projektbereich_id: id }, null, 2),
      [FILES.entwurfgeo]: JSON.stringify(design, null, 2),
      [FILES.ressorts]: JSON.stringify({ stand: Ressorts.STAND, ressorts: Ressorts.LISTE }, null, 2),
      [FILES.datenblatt]: Datenblatt.build(twinflowPoints(extent(fc), fc), { id, zeilen: (fc.features[0]?.properties.info_text || '').split('\n') }),
      ...Object.fromEntries(LEGACY.map(p => [p, null])),
    };
    return { id, files };
  }

  // Publiziert alle Styles gemeinsam. Die URLs enthalten die Commit-SHA: unveränderlich und sofort aktuell
  // (raw.githubusercontent.com cached pro Pfad ~5 Min und ignoriert ?query).
  async function publish(fc, token) {
    const { id, files } = buildFiles(fc);
    const sha = await commitFiles(files, token, `Publish Projektbereich ${id} (Planungsphase 0 bis 2, inkl. Entwürfen und Datenblatt) ${new Date().toISOString()}`);
    return { sha, id, urls: Object.fromEntries(Object.keys(FILES).map(k => [k, raw(FILES[k], sha)])) };
  }

  return { publish, buildFiles, buildStyles, commitFiles, projektbereichId, extent, twinflowPoints, PAGES, FILES, TITLES, CFG, raw };
})();
