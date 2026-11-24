// Frage 1: Projektbereich – zeichnen ODER Flurstücke wählen
const AreaStep = (() => {
  const MIN_PARCEL_ZOOM = 17;
  const WUPPERTAL = { center: [51.2562, 7.1508], bounds: [[51.16, 6.95], [51.36, 7.36]] };
  const fmt = n => n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const el = (tag, props = {}, ...kids) => {
    const e = Object.assign(document.createElement(tag), props);
    kids.forEach(k => e.append(k));
    return e;
  };

  let map, drawLayer, viewLayer, selLayer, info, modeBtns, loadCtl;
  const cache = new Map(); // idflurst -> Feature

  function mount(root, state, api) {
    state.area ??= { mode: 'draw', drawn: null, parcels: [] };
    const a = state.area;

    root.innerHTML = '';
    const wrap = el('div', { className: 'area-step' });
    const mapWrap = el('div', { className: 'area-map-wrap' }, el('div', { id: 'map' }));
    info = el('div', { className: 'infobox' });
    modeBtns = {
      draw: el('button', { type: 'button', textContent: 'Zeichnen' }),
      select: el('button', { type: 'button', textContent: 'Flurstücke wählen' }),
    };
    const side = el('aside', { className: 'area-side' },
      el('h2', { textContent: '1. Projektbereich' }),
      el('p', { className: 'hint', textContent: 'Wo liegt Ihr Projekt? Zeichnen Sie den Bereich in die Karte oder wählen Sie ein oder mehrere Flurstücke aus.' }),
      el('div', { className: 'modes' }, modeBtns.draw, modeBtns.select),
      info);
    wrap.append(mapWrap, side);
    root.append(wrap);

    map = L.map('map', { maxBounds: L.latLngBounds(WUPPERTAL.bounds).pad(0.5), minZoom: 11 })
      .setView(WUPPERTAL.center, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap-Mitwirkende',
    }).addTo(map);
    L.rectangle(WUPPERTAL.bounds, { fill: false, weight: 0, interactive: false }).addTo(map);

    drawLayer = L.featureGroup().addTo(map);
    viewLayer = L.featureGroup().addTo(map);
    selLayer = L.featureGroup().addTo(map);

    map.addControl(new L.Control.Draw({
      position: 'topleft',
      draw: { polygon: { allowIntersection: false, showArea: false }, rectangle: { showArea: false },
              polyline: false, circle: false, marker: false, circlemarker: false },
      edit: { featureGroup: drawLayer, remove: true },
    }));

    map.on(L.Draw.Event.CREATED, e => {
      drawLayer.clearLayers(); drawLayer.addLayer(e.layer);
      a.drawn = e.layer.toGeoJSON().geometry; refreshDrawn(a, api);
    });
    map.on(L.Draw.Event.EDITED, () => {
      const l = drawLayer.getLayers()[0];
      if (l) { a.drawn = l.toGeoJSON().geometry; refreshDrawn(a, api); }
    });
    map.on(L.Draw.Event.DELETED, () => {
      if (!drawLayer.getLayers().length) { a.drawn = null; refreshDrawn(a, api); }
    });
    map.on('moveend', () => { if (a.mode === 'select') loadViewParcels(a, api); });

    modeBtns.draw.onclick = () => setMode(a, 'draw', api);
    modeBtns.select.onclick = () => setMode(a, 'select', api);

    // Zustand wiederherstellen (Zurück-Navigation)
    if (a.drawn) { drawLayer.addLayer(L.geoJSON(a.drawn).getLayers()[0]); }
    setMode(a, a.mode, api);
    if (a.drawn) map.fitBounds(drawLayer.getBounds().pad(0.3));
    else if (a.parcels.length) map.fitBounds(selLayer.getBounds().pad(0.3));
  }

  function setMode(a, mode, api) {
    a.mode = mode;
    for (const [k, b] of Object.entries(modeBtns)) b.setAttribute('aria-pressed', String(k === mode));
    document.querySelector('.leaflet-draw').style.display = mode === 'draw' ? '' : 'none';
    viewLayer.clearLayers();
    if (mode === 'select') loadViewParcels(a, api);
    render(a, api);
  }

  async function refreshDrawn(a, api) {
    const ring = a.drawn?.coordinates[0];
    a.drawnParcels = [];
    render(a, api);
    api.changed();
    if (!ring) return;
    api.status('Lade Flurstücke zum gezeichneten Bereich …');
    try {
      const found = await Alkis.inBbox(Geo.bbox(ring), 500);
      // Nur Flurstücke, die den gezeichneten Bereich tatsächlich berühren
      a.drawnParcels = found.filter(f => f.geometry.coordinates.some(p => Geo.ringsIntersect(p[0], ring)));
      a.drawnTruncated = found.length >= 500;
      api.status('');
    } catch (err) { api.status('Flurstücke nicht ladbar: ' + err.message); }
    render(a, api);
  }

  async function loadViewParcels(a, api) {
    loadCtl?.abort();
    if (map.getZoom() < MIN_PARCEL_ZOOM) {
      viewLayer.clearLayers(); api.status(`Bitte weiter hineinzoomen (ab Zoom ${MIN_PARCEL_ZOOM}), um Flurstücke zu sehen.`);
      return;
    }
    loadCtl = new AbortController();
    api.status('Lade Flurstücke …');
    try {
      const b = map.getBounds();
      const fs = await Alkis.inBbox({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() }, 400, loadCtl.signal);
      fs.forEach(f => cache.set(f.id, f));
      viewLayer.clearLayers();
      L.geoJSON(fs, {
        style: { color: '#555', weight: 1, fillOpacity: 0.02 },
        onEachFeature: (f, layer) => layer.on('click', () => toggleParcel(a, f, api)),
      }).addTo(viewLayer);
      api.status('');
    } catch (err) { if (err.name !== 'AbortError') api.status('Flurstücke nicht ladbar: ' + err.message); }
  }

  function toggleParcel(a, f, api) {
    const i = a.parcels.findIndex(p => p.id === f.id);
    if (i >= 0) a.parcels.splice(i, 1); else a.parcels.push(f);
    render(a, api); api.changed();
  }

  function drawSelection(a) {
    selLayer.clearLayers();
    if (a.mode === 'select' && a.parcels.length)
      L.geoJSON(a.parcels, { style: { color: '#e8590c', weight: 2, fillOpacity: 0.35 }, interactive: false }).addTo(selLayer);
  }

  // Infobox: Gemarkung → Flur → Flurstücke + Fläche
  function render(a, api) {
    drawSelection(a);
    info.innerHTML = '';
    const parcels = a.mode === 'select' ? a.parcels : (a.drawnParcels ?? []);

    if (a.mode === 'draw') {
      if (!a.drawn) { info.append(el('p', { className: 'hint', textContent: 'Noch kein Bereich gezeichnet. Nutzen Sie die Werkzeuge links oben in der Karte (Polygon oder Rechteck).' })); return; }
      info.append(el('div', { textContent: `Gezeichnete Fläche: ${fmt(Geo.ringArea(a.drawn.coordinates[0]))} m²` }));
    } else if (!parcels.length) {
      info.append(el('p', { className: 'hint', textContent: 'Klicken Sie auf Flurstücke in der Karte, um sie zu (ab)zuwählen.' })); return;
    }

    const tree = new Map();
    for (const f of parcels) {
      const p = f.properties;
      const g = tree.get(p.gemarkung) ?? tree.set(p.gemarkung, new Map()).get(p.gemarkung);
      (g.get(p.flur) ?? g.set(p.flur, []).get(p.flur)).push(p);
    }
    const num = s => parseInt(s, 10) || 0;
    for (const [gem, flure] of [...tree].sort()) {
      info.append(el('h3', { textContent: `Gemarkung ${gem}` }));
      for (const [flur, ps] of [...flure].sort((x, y) => num(x[0]) - num(y[0]))) {
        ps.sort((x, y) => num(x.flurstuecksnummer) - num(y.flurstuecksnummer));
        const sum = ps.reduce((s, p) => s + p.flaeche_m2, 0);
        info.append(el('div', { className: 'flur' },
          el('b', { textContent: `Flur ${flur}: ` }),
          ps.map(p => `${p.flurstuecksnummer} (${fmt(p.flaeche_m2)} m²)`).join(', '),
          ` – Summe ${fmt(sum)} m²`));
      }
    }
    if (parcels.length) {
      const total = parcels.reduce((s, f) => s + f.properties.flaeche_m2, 0);
      info.append(el('div', { className: 'sum', textContent: `${parcels.length} Flurstück(e), ${fmt(total)} m² (amtliche Fläche)` }));
    }
    if (a.mode === 'draw' && a.drawnTruncated)
      info.append(el('p', { className: 'warn', textContent: 'Achtung: Mehr als 500 Flurstücke – Liste unvollständig.' }));
  }

  function isValid(state) {
    const a = state.area;
    return !!a && (a.mode === 'draw' ? !!a.drawn : a.parcels.length > 0);
  }

  function toFeatures(state) {
    const a = state.area;
    const summary = parcels => parcels.map(f => ({
      gemarkung: f.properties.gemarkung, flur: f.properties.flur,
      flurstueck: f.properties.flurstuecksnummer, flaeche_m2: f.properties.flaeche_m2,
    }));
    if (a.mode === 'draw') {
      return [{
        type: 'Feature', geometry: a.drawn,
        properties: {
          role: 'projektbereich', mode: 'draw',
          flaeche_m2: Math.round(Geo.ringArea(a.drawn.coordinates[0])),
          flurstuecke: summary(a.drawnParcels ?? []),
        },
      }];
    }
    return a.parcels.map(f => ({
      type: 'Feature', geometry: f.geometry,
      properties: { role: 'projektbereich', mode: 'flurstueck', ...f.properties },
    }));
  }

  return { id: 'area', title: 'Projektbereich', mount, isValid, toFeatures };
})();
