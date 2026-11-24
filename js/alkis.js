// Flurstücke aus dem ALKIS-Vector-Tiles-Service der Stadt Wuppertal (Mapbox-konform, Open Data dl-zero-de/2.0).
// Gerendert per MapLibre GL (über maplibre-gl-leaflet), Attribute/Geometrie direkt aus den Tiles.
const Alkis = (() => {
  const STYLE = 'https://tiles.cismet.de/alkis/flurstuecke.black.style.json';
  const SOURCE = 'alkis_data';
  const LAYER = 'landparcel';
  const MIN_ZOOM = 16; // darunter sind die Tiles zu grob für Geometrie/Attribute

  // Schlüssel -> Name (aus carma: apps/lagis/.../generalConstant.js)
  const GEMARKUNGEN = {
    3001: 'Barmen', 3485: 'Beyenburg', 3279: 'Cronenberg', 3278: 'Dönberg', 3135: 'Elberfeld',
    3486: 'Langerfeld', 3487: 'Nächstebreck', 3267: 'Ronsdorf', 3276: 'Schöller', 3277: 'Vohwinkel',
  };

  // Attribute eines Tile-Features -> unsere Properties
  function toProps(p) {
    const kz = p.flurstueck_kz_voll ?? '';
    const nenner = kz.slice(14, 18).replace(/_/g, '').replace(/^0+/, '');
    return {
      gemarkung: GEMARKUNGEN[p.gemarkungsnummer] ?? `Gemarkung ${p.gemarkungsnummer}`,
      gemarkungsnummer: p.gemarkungsnummer,
      flur: String(p.flurnummer),
      flurstuecksnummer: nenner ? `${p.zaehler}/${nenner}` : String(p.zaehler),
      flaeche_m2: Number(p.flaeche_m2) || 0,
      adresse: p.adresse ?? '',
      flurstueckskennzeichen: kz.replace(/_/g, ''),
    };
  }

  const polysOf = g => g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];

  function bboxOf(multi) {
    let w = 180, s = 90, e = -180, n = -90;
    multi.forEach(poly => poly[0].forEach(([x, y]) => { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }));
    return [w, s, e, n];
  }

  // Tile-Stücke eines Flurstücks zusammenfügen; vollständig, wenn die Bbox zur mitgelieferten `bounds` passt
  function geometryOf(mgl, rawProps) {
    const pieces = mgl.querySourceFeatures(SOURCE, { sourceLayer: LAYER, filter: ['==', ['get', 'fid'], rawProps.fid] });
    const polys = pieces.flatMap(f => polysOf(f.geometry));
    if (!polys.length) return null;
    const merged = polygonClipping.union(...polys);
    let complete = false;
    try {
      const want = JSON.parse(rawProps.bounds), got = bboxOf(merged);
      complete = want.every((v, i) => Math.abs(v - got[i]) < 3e-5);
    } catch { /* ohne bounds: unvollständig */ }
    return { geometry: { type: 'MultiPolygon', coordinates: merged }, complete };
  }

  function featureFor(mgl, rawProps, fallbackGeom) {
    const g = geometryOf(mgl, rawProps);
    return {
      type: 'Feature', id: rawProps.fid,
      geometry: g?.geometry ?? { type: 'MultiPolygon', coordinates: polysOf(fallbackGeom) },
      properties: { ...toProps(rawProps), geometrie_vollstaendig: !!g?.complete },
      _raw: rawProps,
    };
  }

  // Flurstück unter dem Klickpunkt (Pixel im Karten-Container)
  function parcelAt(mgl, point) {
    const f = mgl.queryRenderedFeatures([point.x, point.y], { layers: ['landparcel_fill'] })[0];
    return f ? { raw: f.properties, geometry: f.geometry } : null;
  }

  // Alle Flurstücke in den geladenen Tiles, die den Ring berühren (dedupliziert)
  function intersecting(mgl, ring, Geo) {
    const byFid = new Map();
    for (const f of mgl.querySourceFeatures(SOURCE, { sourceLayer: LAYER })) {
      if (byFid.has(f.properties.fid)) continue;
      if (polysOf(f.geometry).some(p => Geo.ringsIntersect(p[0], ring))) byFid.set(f.properties.fid, f.properties);
    }
    return [...byFid.values()].map(raw => ({ type: 'Feature', id: raw.fid, geometry: null, properties: toProps(raw) }));
  }

  // Hervorhebung der gewählten Flurstücke direkt auf den Tiles
  function addHighlight(mgl) {
    const filter = ['in', ['get', 'fid'], ['literal', []]];
    const base = { source: SOURCE, 'source-layer': LAYER, filter };
    mgl.addLayer({ ...base, id: 'adhoc-sel-fill', type: 'fill', paint: { 'fill-color': '#e8590c', 'fill-opacity': 0.35 } });
    mgl.addLayer({ ...base, id: 'adhoc-sel-line', type: 'line', paint: { 'line-color': '#e8590c', 'line-width': 2 } });
  }
  let lastKey = '';
  function setHighlight(mgl, fids) {
    const key = fids.join(',');
    if (key === lastKey || !mgl.getLayer('adhoc-sel-fill')) return;
    lastKey = key;
    for (const id of ['adhoc-sel-fill', 'adhoc-sel-line']) mgl.setFilter(id, ['in', ['get', 'fid'], ['literal', fids]]);
  }
  const resetHighlight = () => { lastKey = ''; };

  // ---- Vektor-Fachdaten (Vector Tiles der Stadt Wuppertal): was berührt den Projektbereich, mit welchem Flächenanteil?
  const BODEN = { '0': 'Siedlungsfläche', '-9': 'Gewässer', '1': 'sehr gering', '2': 'gering', '3': 'mittel', '4': 'hoch', '5': 'sehr hoch' };
  const VEC = {
    fnp: { layer: 'hauptnutzungen', maxzoom: 14, name: p => p.nutzung || null, recht: p => p.text_recht },
    bplan: { layer: 'bplanverfahren', maxzoom: 17, name: p => p.kategorie === 'rechtsverbindlich' && p.verfahren ? `Nr. ${p.verfahren}${p.name ? ' ' + p.name : ''}` : null },
    landschaft: { layer: 'landschaftsundnaturschutz', maxzoom: 14, name: p => p.sg_typ ? (p.sg_typ === 'NS' ? 'Naturschutzgebiet' : 'Landschaftsschutzgebiet') + (p.nrw_name ? ' ' + p.nrw_name : '') : null },
    boden: { layer: 'bodenfunktion', maxzoom: 14, name: p => BODEN[p.ges] ?? null },
  };
  const srcId = id => `adhoc-${id}`;

  function addVec(mgl) {
    for (const [id, v] of Object.entries(VEC)) {
      if (mgl.getSource(srcId(id))) continue;
      mgl.addSource(srcId(id), { type: 'vector', minzoom: 9, maxzoom: v.maxzoom, tiles: [`https://tiles.cismet.de/${v.layer}/{z}/{x}/{y}.pbf`] });
      // unsichtbare Fläche, damit MapLibre die Kacheln lädt (querySourceFeatures braucht einen Layer)
      mgl.addLayer({ id: `adhoc-probe-${id}`, type: 'fill', source: srcId(id), 'source-layer': v.layer, paint: { 'fill-opacity': 0 } });
    }
  }
  const multiArea = multi => multi.reduce((t, poly) => t + Geo.ringArea(poly[0]) - poly.slice(1).reduce((h, r) => h + Geo.ringArea(r), 0), 0);

  // multi: MultiPolygon-Koordinaten des Projektbereichs -> { items: [{ name, share }], recht: [..] } oder null (Tiles fehlen noch)
  function vecSummary(mgl, id, multi) {
    const v = VEC[id], src = srcId(id);
    if (!mgl.getSource(src) || !mgl.isSourceLoaded(src)) return null;
    const bb = Geo.bbox(multi.flatMap(p => p[0]));
    const groups = new Map();
    for (const f of mgl.querySourceFeatures(src, { sourceLayer: v.layer })) {
      const name = v.name(f.properties);
      if (!name) continue;
      const polys = polysOf(f.geometry).filter(p => { const b = Geo.bbox(p[0]); return b.e >= bb.w && b.w <= bb.e && b.n >= bb.s && b.s <= bb.n; });
      if (!polys.length) continue;
      const g = groups.get(name) ?? groups.set(name, { polys: [], recht: new Set() }).get(name);
      g.polys.push(...polys);
      if (v.recht?.(f.properties)) g.recht.add(v.recht(f.properties));
    }
    const total = multiArea(multi);
    if (!total) return { items: [], recht: [] };
    const items = [], recht = new Set();
    for (const [name, g] of groups) {
      let area = 0;
      try { area = multiArea(polygonClipping.intersection(polygonClipping.union(...g.polys), multi)); } catch { continue; }
      if (area / total >= 0.01) { items.push({ name, share: area / total }); g.recht.forEach(r => recht.add(r)); }
    }
    items.sort((a, b) => b.share - a.share);
    return { items, recht: [...recht] };
  }

  return { STYLE, MIN_ZOOM, VEC, addVec, vecSummary, parcelAt, featureFor, intersecting, addHighlight, setHighlight, resetHighlight };
})();
