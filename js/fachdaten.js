// Fachdaten, die als Kartenebenen in den Style des Projektbereichs übernommen werden können.
//  - kind 'wms':   Raster-WMS, MapLibre fragt Kacheln per GetMap in EPSG:3857 ab.
//  - kind 'style': externer Vektor-Style (tiles.cismet.de), wird beim Publishen geladen und in den Style eingebaut
//                  (Sources/Layer mit Präfix fd-<id>; Beschriftungs-Layer mit Sprite entfallen).
// `bounds` begrenzt die Quellen auf das Rechteck um den Projektbereich.
const Fachdaten = (() => {
  const caps = base => `${base}?REQUEST=GetCapabilities&SERVICE=WMS`;

  // Styles der Planungsphase 0 im Geoportal: "Planungsrecht", "Fachkonzepte" und "Erschließung" (noch ohne Fachdaten)
  const GROUPS = {
    planungsrecht: { title: 'Planungsphase 0: Planungsrecht', file: 'published/planungsphase-0-planungsrecht.json' },
    fachkonzepte: { title: 'Planungsphase 0: Fachkonzepte', file: 'published/planungsphase-0-fachkonzepte.json' },
    erschliessung: { title: 'Planungsphase 0: Erschließung', file: 'published/planungsphase-0-erschliessung.json',
      description: 'Erschließung bezeichnet im deutschen Bau- und Planungsrecht die Gesamtheit aller Maßnahmen, die ein unbebautes Grundstück überhaupt erst bebaubar und nutzbar machen. Noch ohne Fachdaten.',
      // fester Text oben in der Infobox
      infoText: 'In diesem Schritt können Manipulationen am DGM und DOM vorgenommen werden. Bei der Fläche Blombach-Süd ist etwa relevant herauszufinden, wie viel Boden in m3 wegtransportiert oder wo andershin geschoben werden müsste, um die Fläche eben herzurichten. Bei diesem Schritt sind aber auch das Hochziehen von abstrakten 3D-Kuben, das Begrünen einzelner Seiten oder Dächer und das Platzieren von Bäumen möglich. (Simcity-Simulationen)' },
  };

  const CATALOG = [
    { id: 'fnp', group: 'planungsrecht', kind: 'style', label: 'FNP Hauptnutzungen',
      styleUrl: 'https://tiles.cismet.de/hauptnutzungen/style.json', sourceLayer: 'hauptnutzungen',
      description: 'Flächennutzungsplan der Stadt Wuppertal, Hauptnutzungen (Vektordaten).',
      source: 'Stadt Wuppertal, tiles.cismet.de/hauptnutzungen',
      // der Style bringt keine Infobox mit: eigene Zuordnung (eine Zeile, siehe Geoportal-Regel "nur Zeilen mit function")
      infobox: "function createInfoBoxInfo(p){ return { header: 'FNP Hauptnutzungen', headerColor: p.farbe || '#7C7CA6', title: p.nutzung, subtitle: p.text_recht || '', additionalInfo: p.name || '' }; }" },
    { id: 'regionalplan', group: 'planungsrecht', kind: 'wms', label: 'WMS Regionalplan NRW',
      description: 'Stellt Rasterdaten der Regionalpläne der sechs Planungsgebiete in NRW sowie des Regionalen Flächennutzungsplans im Kern-Ruhrgebiet dar.',
      source: 'Land NRW, wms.nrw.de/wms/wms_nw_regionalplan',
      capabilities: caps('https://www.wms.nrw.de/wms/wms_nw_regionalplan'),
      legend: 'https://www.wms.nrw.de/legends/wms/wms_nw_regionalplan/Legende.png',
      // keine Flächenauswertung: gerenderte Farben weichen von der Legende ab, Topographie-Unterlage, Darstellung nur ab 1:8000
      noAnalysis: 'Festlegungen im Projektbereich sind aus dem Kartenbild nicht zuverlässig ableitbar (siehe Legende).',
      getMap: { base: 'https://www.wms.nrw.de/wms/wms_nw_regionalplan', layers: 'regionalplan' }, opacity: 0.7 },
    { id: 'lep', group: 'planungsrecht', kind: 'wms', label: 'WMS Landesentwicklungsplan NRW',
      description: 'Rasterdaten der zeichnerischen Festlegungen des geltenden Landesentwicklungsplans NRW.',
      source: 'Land NRW, wms.nrw.de/wms/wms_nw_landesentwicklungsplan',
      capabilities: caps('https://www.wms.nrw.de/wms/wms_nw_landesentwicklungsplan'),
      opacity: 0.7,
      legend: 'https://www.wms.nrw.de/legends/wms/wms_nw_landesentwicklungsplan/landesentwicklungsplan.png',
      // Flächenfarben im Kartenbild = Legendenfarben (geprüft); daraus wird der Flächenanteil im Projektbereich geschätzt
      getMap: { base: 'https://www.wms.nrw.de/wms/wms_nw_landesentwicklungsplan', layers: 'landesentwicklungsplan' },
      classes: [
        { name: 'Siedlungsraum', rgb: [242, 207, 128] },
        { name: 'Freiraum', rgb: [255, 247, 186] },
        { name: 'Grünzüge', rgb: [149, 202, 125] },
        { name: 'Gebiete für den Schutz der Natur', rgb: [122, 164, 117] },
        { name: 'Oberflächengewässer', rgb: [0, 131, 181] },
      ] },
    { id: 'bplan', group: 'planungsrecht', kind: 'style', label: 'B-Plan-Verfahren (rechtsverbindlich)',
      styleUrl: 'https://tiles.cismet.de/bplanverfahren/rechtsverbindlich.style.json', sourceLayer: 'bplanverfahren',
      description: 'Räumliche Geltungsbereiche rechtsverbindlicher Bebauungsplanverfahren in Wuppertal.',
      source: 'Stadt Wuppertal, tiles.cismet.de/bplanverfahren' },
    { id: 'landschaft', group: 'planungsrecht', kind: 'style', label: 'Landschafts- und Naturschutz',
      styleUrl: 'https://tiles.cismet.de/landschaftsundnaturschutz/style.json', sourceLayer: 'landschaftsundnaturschutz',
      description: 'Landschafts- und Naturschutzgebiete der Stadt Wuppertal.',
      source: 'Stadt Wuppertal, tiles.cismet.de/landschaftsundnaturschutz' },
    { id: 'boden', group: 'fachkonzepte', kind: 'style', label: 'Gesamtbewertung der Bodenfunktionen',
      styleUrl: 'https://tiles.cismet.de/bodenfunktion/style.json', sourceLayer: 'bodenfunktion',
      description: 'Gesamtbewertung der Bodenfunktionen in Wuppertal.',
      source: 'Stadt Wuppertal, tiles.cismet.de/bodenfunktion' },
    { id: 'kwp', group: 'fachkonzepte', kind: 'style', label: 'Eignung dezentrale Wärmeversorgung',
      styleUrl: 'https://tiles.cismet.de/kwp_dezentral/style.json', sourceLayer: 'kwp_dezentral',
      description: 'Eignungsgebiete für dezentrale Wärmeversorgung (kommunale Wärmeplanung Wuppertal).',
      source: 'Stadt Wuppertal, tiles.cismet.de/kwp_dezentral' },
    { id: 'stadtbaum', group: 'fachkonzepte', kind: 'style', label: 'Stadtbaumkonzept',
      styleUrl: 'https://tiles.cismet.de/stadtbaumkonzept/style.json', sourceLayer: 'stadtbaumkonzept',
      description: 'Geplante Baumstandorte und Baumarten des Stadtbaumkonzepts (Pflanzsaison 26/27).',
      source: 'Stadt Wuppertal, tiles.cismet.de/stadtbaumkonzept' },
  ];

  const byId = id => CATALOG.find(c => c.id === id);
  const selected = ids => (ids ?? []).map(byId).filter(Boolean);

  // ---- Laden (async): externe Styles und WMS-Capabilities
  const loaded = {}; // id -> { style?, infobox?, caps?, error? }

  const stripTags = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const firstSentences = (s, max = 260) => { const t = stripTags(s); if (t.length <= max) return t; const cut = t.slice(0, max); return cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, 80)) || cut; };

  function parseCaps(xml) {
    const first = re => (xml.match(re) ?? [])[1];
    return {
      title: first(/<Service>[\s\S]*?<Title>([^<]*)<\/Title>/),
      abstract: first(/<Service>[\s\S]*?<Abstract>([\s\S]*?)<\/Abstract>/),
      org: first(/<ContactOrganization>([^<]*)<\/ContactOrganization>/),
    };
  }

  // Mapbox-Style: Infobox-Funktion aus den layerInfo.keywords ziehen
  const styleInfobox = style => (style.metadata?.carmaConf?.layerInfo?.keywords ?? [])
    .find(k => /^carmaconf:\/\/infoboxmapping:/i.test(k) && k.includes('function') && !k.includes('\n'))
    ?.replace(/^carmaconf:\/\/infoboxmapping:/i, '');

  async function load(ids) {
    await Promise.all(selected(ids).map(async c => {
      if (loaded[c.id]) return;
      try {
        if (c.kind === 'style') {
          const style = await (await fetch(c.styleUrl)).json();
          loaded[c.id] = { style, infobox: c.infobox ?? styleInfobox(style) };
        } else if (c.capabilities) {
          loaded[c.id] = { caps: parseCaps(await (await fetch(c.capabilities)).text()) };
        }
      } catch (e) { loaded[c.id] = { error: e.message }; }
    }));
    return errors(ids);
  }
  const errors = ids => selected(ids).filter(c => loaded[c.id]?.error).map(c => `${c.label}: ${loaded[c.id].error}`);

  // ---- Auswertung: Flächenanteile der Legendenklassen im Projektbereich (aus dem WMS-Kartenbild, nur Browser)
  const analysis = {}; // id -> [{ name, share }]
  const merc = ([lon, lat]) => [lon * 20037508.34 / 180, Math.log(Math.tan((90 + lat) * Math.PI / 360)) * 20037508.34 / Math.PI];

  async function analyse(fc) {
    const geoms = fc.features.map(f => f.geometry);
    const polys = geoms.flatMap(g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
    const pts = polys.flatMap(p => p[0]).map(merc);
    if (!pts.length) return;
    let [x0, y0, x1, y1] = [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
    const pad = Math.max(x1 - x0, y1 - y0, 50) * 0.05;
    [x0, y0, x1, y1] = [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
    // Der Dienst zeichnet erst ab ca. 3 m/Pixel; wir rechnen mit mindestens 5 m/Pixel, höchstens 1200 Pixel
    const mpp = Math.max(5, Math.max(x1 - x0, y1 - y0) / 1200);
    const W = Math.max(16, Math.round((x1 - x0) / mpp)), H = Math.max(16, Math.round((y1 - y0) / mpp));
    // Maske des Projektbereichs
    const mc = Object.assign(document.createElement('canvas'), { width: W, height: H }), mx = mc.getContext('2d', { willReadFrequently: true });
    mx.beginPath();
    for (const poly of polys) for (const ring of poly) ring.map(merc).forEach(([x, y], i) => mx[i ? 'lineTo' : 'moveTo']((x - x0) / (x1 - x0) * W, (y1 - y) / (y1 - y0) * H));
    mx.fillStyle = '#000'; mx.fill('evenodd');
    const mask = mx.getImageData(0, 0, W, H).data;
    for (const c of selected(fc.fachdaten).filter(c => c.classes)) {
      try {
        const u = `${c.getMap.base}?service=WMS&version=1.1.1&request=GetMap&layers=${c.getMap.layers}&styles=&format=image/png&transparent=true&srs=EPSG:3857&width=${W}&height=${H}&bbox=${[x0, y0, x1, y1].join(',')}`;
        const bmp = await createImageBitmap(await (await fetch(u)).blob());
        const ic = Object.assign(document.createElement('canvas'), { width: W, height: H }), ix = ic.getContext('2d', { willReadFrequently: true });
        ix.drawImage(bmp, 0, 0, W, H);
        const img = ix.getImageData(0, 0, W, H).data, counts = c.classes.map(() => 0);
        let classified = 0;
        for (let i = 0; i < W * H; i++) {
          if (mask[i * 4 + 3] < 128 || img[i * 4 + 3] < 128) continue;
          const j = c.classes.findIndex(k2 => Math.abs(img[i * 4] - k2.rgb[0]) + Math.abs(img[i * 4 + 1] - k2.rgb[1]) + Math.abs(img[i * 4 + 2] - k2.rgb[2]) <= 9);
          if (j >= 0) { counts[j]++; classified++; }
        }
        analysis[c.id] = classified ? c.classes.map((k2, j) => ({ name: k2.name, share: counts[j] / classified })).filter(x => x.share >= 0.02).sort((a, b) => b.share - a.share) : [];
      } catch (e) { analysis[c.id] = null; }
    }
  }

  // ---- Style-Bausteine
  const unmerc = ([x, y]) => [x * 180 / 20037508.34, Math.atan(Math.exp(y * Math.PI / 20037508.34)) * 360 / Math.PI - 90];
  // Abrufbereich der Fachdaten: ein Quadrat (gleich lange Seiten), mittig um den Projektbereich, Kantenlänge = 3 x längste Seite des Projektbereichs
  const ABRUF_FAKTOR = 3;
  const abrufbereich = ([w, s, e, n]) => {
    const [x0, y0] = merc([w, s]), [x1, y1] = merc([e, n]);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = ABRUF_FAKTOR * Math.max(x1 - x0, y1 - y0, 1) / 2;
    const [lw, ls] = unmerc([cx - half, cy - half]), [le, ln] = unmerc([cx + half, cy + half]);
    return [lw, ls, le, ln].map(v => +v.toFixed(6));
  };

  // -> { sources, layers, byEntry: { id: [layer-ids] } }
  function toStyleParts(ids, bounds) {
    const sources = {}, layers = [], byEntry = {};
    let sprite = null, glyphs = null;
    const b = bounds && abrufbereich(bounds);
    for (const c of selected(ids)) {
      byEntry[c.id] = [];
      if (c.kind === 'wms') {
        // Ein einzelnes GetMap-Bild genau für den Abrufbereich: bleibt auf das Rechteck begrenzt und verschwindet bei Nahzoom nicht
        // (die Dienste zeichnen nur bis ca. 1:8000, daher mind. 4 m pro Pixel).
        if (!b) { delete byEntry[c.id]; continue; }
        const [w, s0, e, n] = b, [x0, y0] = merc([w, s0]), [x1, y1] = merc([e, n]);
        const mpp = Math.max(4, Math.max(x1 - x0, y1 - y0) / 2000);
        const W = Math.max(32, Math.round((x1 - x0) / mpp)), H = Math.max(32, Math.round((y1 - y0) / mpp)); // Quadrat -> W = H
        sources[`fd-${c.id}`] = { type: 'image', coordinates: [[w, n], [e, n], [e, s0], [w, s0]],
          url: `${c.getMap.base}?service=WMS&version=1.1.1&request=GetMap&layers=${c.getMap.layers}&styles=&format=image/png&transparent=true&srs=EPSG:3857&width=${W}&height=${H}&bbox=${[x0, y0, x1, y1].map(v => v.toFixed(2)).join(',')}` };
        layers.push({ id: `fd-${c.id}`, type: 'raster', source: `fd-${c.id}`, layout: { visibility: 'none' }, paint: { 'raster-opacity': c.opacity ?? 1 }, metadata: { fachdaten: c.label } });
        byEntry[c.id].push(`fd-${c.id}`);
      } else if (loaded[c.id]?.style) {
        const st = loaded[c.id].style;
        for (const [k, def] of Object.entries(st.sources)) sources[`fd-${c.id}-${k}`] = { ...def, ...(b && { bounds: b }), attribution: c.source };
        // Ein Style kann nur ein Sprite haben: der erste Quell-Style mit Sprite behält seine Symbol-Layer (Beschriftung/Symbole),
        // bei weiteren entfallen sie.
        const owner = st.sprite && (!sprite || sprite === st.sprite);
        if (owner) { sprite = st.sprite; }
        if (st.glyphs && !glyphs) glyphs = st.glyphs;
        for (const l of st.layers) {
          if (l.type === 'symbol' && !owner) continue;
          const id = `fd-${c.id}-${l.id}`;
          layers.push({ ...l, id, source: `fd-${c.id}-${l.source}`, layout: { ...l.layout, visibility: 'none' }, metadata: { ...l.metadata, fachdaten: c.label } });
          byEntry[c.id].push(id);
        }
      }
    }
    return { sources, layers, byEntry, sprite, glyphs };
  }

  // Ein Dropdown im Layer-Chip (carmaConf.dynamicStyling, Typ list): "Nur Projektbereich" (Standard) oder je ein Kartenwerk.
  // Der Abrufbereich (Rechteck, in dem die Fachdaten geladen werden) ist nur sichtbar, wenn ein Kartenwerk aktiv ist.
  function toDynamicStyling(ids, byEntry) {
    const sel = selected(ids).filter(c => byEntry[c.id]?.length);
    if (!sel.length) return [];
    const opt = (id, title, on) => { const o = { id, title }; for (const c of sel) o[`vis_${c.id}`] = on.includes(c) ? 'visible' : 'none'; return o; };
    const options = [opt('nur', 'Nur Projektbereich', []), ...sel.map(c => opt(c.id, c.label, [c]))];
    return [{
      type: 'list', label: 'Fachdaten', default: 'nur', showIcon: false, options,
      targets: { ...Object.fromEntries(sel.map(c => [`vis_${c.id}`, byEntry[c.id].map(id => `layers.${id}.layout.visibility`)])) },
    }];
  }

  // Rechteck, in dem die Fachdaten abgerufen werden (Quelle `bounds` der Fachdaten-Ebenen)
  function bboxFeature(ids, bounds) {
    if (!bounds || !selected(ids).length) return null;
    const [w, s, e, n] = abrufbereich(bounds);
    return { type: 'Feature', properties: { info_title: 'Abrufbereich der Fachdaten', info_text: 'Rechteck um den Projektbereich, in dem die gewählten Fachdaten geladen werden.' },
      geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } };
  }

  // ---- Infobox: eine Zuordnungsfunktion (eine Zeile!) für alle Quellen; Verteilung nach carmaInfo.sourceLayer
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Kompakte HTML-Zeilen zu den WMS-Kartenwerken: Auswertung (falls möglich) + Links
  function capabilitiesHtml(ids) {
    return selected(ids).filter(c => c.kind === 'wms').map(c => {
      const an = analysis[c.id];
      const val = an?.length ? an.map(x => `${esc(x.name)} (${Math.max(1, Math.round(x.share * 100))} %)`).join(', ') : c.noAnalysis ? 'keine Auswertung möglich' : 'keine Festlegung erkannt';
      const links = [c.legend && `<a href="${c.legend}">Legende</a>`, `<a href="${c.capabilities.replace(/&/g, '&amp;')}">Capabilities</a>`].filter(Boolean).join(' · ');
      return `<b>${esc(c.label)}:</b> ${val} <small>(${links})</small>`;
    }).join('<br/>');
  }

  function infoboxMapping(ids, { extraKey = null, title = null, intro = null } = {}) {
    const fns = selected(ids).filter(c => c.sourceLayer && loaded[c.id]?.infobox)
      .map(c => `${JSON.stringify(c.sourceLayer)}: ${loaded[c.id].infobox}`);
    const capsHtml = capabilitiesHtml(ids);
    const base = title ? "(p.info_title + '\\n' + (p.info_text || ''))" : "(p.info_text || '')";
    const raw = extraKey ? `(${base} + '\\n' + (p.${extraKey} || ''))` : base;
    const adhoc = `var e = function (x) { return String(x).split('&').join('&amp;').split('<').join('&lt;'); }; var t = ${raw}.split('\\n').filter(function (l) { return l; }).map(function (l) { var i = l.indexOf(': '); return i > 0 && i < 48 ? '<b>' + e(l.slice(0, i + 1)) + '</b>' + e(l.slice(i + 1)) : e(l); }).join('<br/>'); return { title: ${title ? JSON.stringify(title) : 'p.info_title'}, additionalInfo: '<html>' + ${JSON.stringify(intro ? esc(intro) + '<br/><br/>' : '')} + t + ${JSON.stringify(capsHtml ? '<br/>' + capsHtml : '')} + '</html>' };`;
    const code = `function createInfoBoxInfo(p){ var M = { ${fns.join(', ')} }; var sl = p.carmaInfo && p.carmaInfo.sourceLayer; if (sl && M[sl]) { return M[sl](p); } ${adhoc} }`;
    return code.replace(/\s*\n\s*/g, ' ');
  }

  const describe = ids => selected(ids).map(c => `${c.label}: ${c.description} (Quelle: ${c.source})`);
  const links = ids => selected(ids).flatMap(c => [c.styleUrl && { url: c.styleUrl, text: `${c.label} (Style)` }, c.capabilities && { url: c.capabilities, text: `${c.label} (GetCapabilities)` }].filter(Boolean));

  return { merc, unmerc, CATALOG, GROUPS, load, analyse, analysis, errors, abrufbereich, toStyleParts, toDynamicStyling, bboxFeature, infoboxMapping, describe, links };
})();
