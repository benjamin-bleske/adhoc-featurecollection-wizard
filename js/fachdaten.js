// Fachdaten, die als Kartenebenen in den Style des Projektbereichs übernommen werden können.
// Raster (WMS): MapLibre fragt Kacheln per GetMap in EPSG:3857 ab. Vektor (FNP): Vector Tiles der Stadt Wuppertal.
// `bounds` begrenzt die Quellen auf das Rechteck um den Projektbereich.
const Fachdaten = (() => {
  const wms = (base, params) => `${base}?service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}&${params}`;

  // Jede Ebene: id, label (Name des Kartenwerks), description, source (Quelle), links, sources/layers (Style-Bausteine, ids mit Präfix fd-<id>)
  const CATALOG = [
    {
      id: 'luftbild', label: 'Luftbild',
      description: 'Luftbild der Stadt Wuppertal (True-Ortho 2024).',
      source: 'Stadt Wuppertal, maps.wuppertal.de/karten',
      links: [],
      sources: { raster: { type: 'raster', tileSize: 256, tiles: [wms('https://maps.wuppertal.de/karten', 'layers=R102:trueortho2024&styles=&format=image/jpeg')] } },
      layers: [{ suffix: '', type: 'raster', source: 'raster', paint: { 'raster-opacity': 1 } }],
    },
    {
      id: 'fnp', label: 'FNP Hauptnutzungen',
      description: 'Flächennutzungsplan der Stadt Wuppertal, Hauptnutzungen (Vektordaten).',
      source: 'Stadt Wuppertal, tiles.cismet.de/hauptnutzungen',
      links: [{ url: 'https://tiles.cismet.de/hauptnutzungen/style.json', text: 'FNP Hauptnutzungen (Style)' }],
      sources: { vector: { type: 'vector', minzoom: 9, maxzoom: 14, tiles: ['https://tiles.cismet.de/hauptnutzungen/{z}/{x}/{y}.pbf'] } },
      layers: [
        { suffix: '-fill', type: 'fill', source: 'vector', 'source-layer': 'hauptnutzungen', paint: { 'fill-color': ['get', 'farbe'], 'fill-opacity': 0.5 } },
        { suffix: '-line', type: 'line', source: 'vector', 'source-layer': 'hauptnutzungen', filter: ['==', ['get', 'rechtswirksam'], null], paint: { 'line-color': ['get', 'farbe'], 'line-opacity': 1, 'line-width': 2 } },
      ],
    },
    {
      id: 'regionalplan', label: 'WMS Regionalplan NRW',
      description: 'Stellt Rasterdaten der Regionalpläne der sechs Planungsgebiete in NRW sowie des Regionalen Flächennutzungsplans im Kern-Ruhrgebiet dar.',
      source: 'Land NRW, WMS Regionalplan NRW',
      links: [{ url: 'https://www.wms.nrw.de/wms/wms_nw_regionalplan?REQUEST=GetCapabilities&SERVICE=WMS', text: 'WMS Regionalplan NRW (GetCapabilities)' }],
      sources: { raster: { type: 'raster', tileSize: 256, tiles: [wms('https://www.wms.nrw.de/wms/wms_nw_regionalplan', 'layers=regionalplan&styles=&format=image/png&transparent=true')] } },
      layers: [{ suffix: '', type: 'raster', source: 'raster', paint: { 'raster-opacity': 0.7 } }],
    },
  ];

  const byId = id => CATALOG.find(c => c.id === id);
  const selected = ids => (ids ?? []).map(byId).filter(Boolean);
  const layerIds = c => c.layers.map(l => `fd-${c.id}${l.suffix}`);

  // Rechteck [w,s,e,n] um den Projektbereich, leicht aufgeweitet
  const padBounds = ([w, s, e, n]) => {
    const dx = (e - w) * 0.05 || 0.0005, dy = (n - s) * 0.05 || 0.0005;
    return [w - dx, s - dy, e + dx, n + dy].map(v => +v.toFixed(6));
  };

  // -> { sources, layers } für den Style (Reihenfolge wie im Katalog: Luftbild unten)
  function toStyleParts(ids, bounds) {
    const sources = {}, layers = [];
    for (const c of selected(ids)) {
      for (const [key, def] of Object.entries(c.sources))
        sources[`fd-${c.id}-${key}`] = { ...def, ...(bounds && { bounds: padBounds(bounds) }), attribution: c.source };
      c.layers.forEach(({ suffix, source, ...l }) =>
        layers.push({ id: `fd-${c.id}${suffix}`, source: `fd-${c.id}-${source}`, ...l, metadata: { fachdaten: c.label } }));
    }
    return { sources, layers };
  }

  // Ein Dropdown "Fachdaten" im Layer-Chip (carmaConf.dynamicStyling, Typ list), Einträge nach Kartenwerk.
  // Ein Eintrag je Kombination der gewählten Fachdaten; Ziele sind Pfade im Style: layers.<id>.layout.visibility
  function toDynamicStyling(ids) {
    const sel = selected(ids);
    if (!sel.length) return [];
    const bits = m => m.toString(2).replace(/0/g, '').length;
    const full = (1 << sel.length) - 1;
    // alle zuerst, dann Einzelne und Paare in Katalogreihenfolge, "keine" zuletzt
    const masks = Array.from({ length: full + 1 }, (_, m) => m).sort((a, b) => (b === full) - (a === full) || (a === 0) - (b === 0) || bits(a) - bits(b) || a - b);
    const combos = masks.map(m => sel.filter((_, i) => m & (1 << i)));
    const options = combos.map(on => {
      const o = { id: on.length ? on.map(c => c.id).join('+') : 'keine', title: on.length ? on.map(c => c.label).join(' + ') : 'Keine Fachdaten' };
      for (const c of sel) o[`vis_${c.id}`] = on.includes(c) ? 'visible' : 'none';
      return o;
    });
    return [{
      type: 'list', label: 'Fachdaten', default: options[0].id, showIcon: false, options,
      targets: Object.fromEntries(sel.map(c => [`vis_${c.id}`, layerIds(c).map(id => `layers.${id}.layout.visibility`)])),
    }];
  }

  // Beschreibung + Links für layerInfo
  const describe = ids => selected(ids).map(c => `${c.label}: ${c.description} (Quelle: ${c.source})`);
  const links = ids => selected(ids).flatMap(c => c.links);

  return { CATALOG, toStyleParts, toDynamicStyling, describe, links };
})();
