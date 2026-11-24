// Frage 1: Projektbereich – zeichnen ODER Flurstücke wählen
const AreaStep = (() => {
  const MIN_ZOOM = Alkis.MIN_ZOOM;
  const WUPPERTAL = { center: [51.2562, 7.1508], bounds: [[51.16, 6.95], [51.36, 7.36]] };
  const fmt = n => n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const el = (tag, props = {}, ...kids) => {
    const e = Object.assign(document.createElement(tag), props);
    kids.forEach(k => e.append(k));
    return e;
  };

  let map, mgl, drawLayer, info, modeBtns;

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

    // ALKIS-Flurstücke/Gebäude als Vector Tiles (Stadt Wuppertal)
    mgl = L.maplibreGL({ style: Alkis.STYLE, pane: 'overlayPane' }).addTo(map).getMaplibreMap();
    Alkis.resetHighlight();
    mgl.on('load', () => { Alkis.addHighlight(mgl); Alkis.addFnp(mgl); render(a, api); });
    mgl.on('idle', () => refresh(a, api));
    map.on('click', e => onMapClick(a, api, e));
    map.on('zoomend', () => render(a, api));

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

    modeBtns.draw.onclick = () => setMode(a, 'draw', api);
    modeBtns.select.onclick = () => setMode(a, 'select', api);

    // Zustand wiederherstellen (Zurück-Navigation)
    if (a.drawn) { drawLayer.addLayer(L.geoJSON(a.drawn).getLayers()[0]); }
    setMode(a, a.mode, api);
    if (a.drawn) map.fitBounds(drawLayer.getBounds().pad(0.3));
    else if (a.parcels.length) map.fitBounds(L.geoJSON(a.parcels).getBounds().pad(0.3));
  }

  function setMode(a, mode, api) {
    a.mode = mode;
    for (const [k, b] of Object.entries(modeBtns)) b.setAttribute('aria-pressed', String(k === mode));
    document.querySelector('.leaflet-draw').style.display = mode === 'draw' ? '' : 'none';
    render(a, api);
  }

  function refreshDrawn(a, api) {
    a.drawnParcels = [];
    a.drawnKey = '';
    render(a, api);
    api.changed();
    refresh(a, api);
  }

  // Wird bei jedem 'idle' der Karte aufgerufen: Daten aus den (nachgeladenen) Tiles auffrischen
  function refresh(a, api) {
    if (!mgl?.isStyleLoaded()) return;
    let changed = false;
    if (a.mode === 'draw' && a.drawn && map.getZoom() >= MIN_ZOOM) {
      const ring = a.drawn.coordinates[0];
      const parcels = Alkis.intersecting(mgl, ring, Geo);
      const b = Geo.bbox(ring), vb = map.getBounds();
      a.drawnPartial = !vb.contains([[b.s, b.w], [b.n, b.e]]);
      const key = parcels.map(f => f.id).sort().join(',') + a.drawnPartial;
      if (key !== a.drawnKey) { a.drawnKey = key; a.drawnParcels = parcels; changed = true; }
    }
    if (a.mode === 'select' && map.getZoom() >= MIN_ZOOM) {
      // unvollständige Geometrien (Tile-Rand) nachladen, sobald weitere Tiles da sind
      a.parcels = a.parcels.map(f => {
        if (f.properties.geometrie_vollstaendig) return f;
        const nf = Alkis.featureFor(mgl, f._raw, f.geometry);
        if (nf.properties.geometrie_vollstaendig) changed = true;
        return nf.properties.geometrie_vollstaendig ? nf : f;
      });
    }
    if (updateFnp(a)) changed = true;
    if (changed) render(a, api);
  }

  // Projektbereich als MultiPolygon-Koordinaten (gewählte Flurstücke vereinigt bzw. gezeichnetes Polygon)
  function areaMulti(a) {
    if (a.mode === 'draw') return a.drawn ? [a.drawn.coordinates] : null;
    const polys = a.parcels.flatMap(f => f.geometry.coordinates);
    return polys.length ? polygonClipping.union(...polys) : null;
  }

  // FNP-Hauptnutzungen zum Projektbereich (aus den Tiles); true, wenn sich das Ergebnis geändert hat
  function updateFnp(a) {
    const multi = a.mode === 'draw' || map.getZoom() >= MIN_ZOOM ? areaMulti(a) : null;
    if (!multi) { const had = !!a.fnp; a.fnp = null; return had; }
    const r = Alkis.fnpSummary(mgl, multi);
    if (!r) return false;
    const key = JSON.stringify([a.mode, r.items.map(i => [i.nutzung, Math.round(i.share * 100)]), a.parcels.map(f => f.id), a.drawn && a.drawn.coordinates[0].length]);
    if (a.fnp?.key === key) return false;
    a.fnp = { ...r, key };
    return true;
  }

  function onMapClick(a, api, e) {
    if (a.mode !== 'select') return;
    if (map.getZoom() < MIN_ZOOM) { api.status(`Bitte weiter hineinzoomen (ab Zoom ${MIN_ZOOM}), um Flurstücke zu wählen.`); return; }
    // das GL-Canvas ist rundum größer als die Karte (padding) -> Klickpunkt umrechnen
    const sz = map.getSize(), cv = mgl.getCanvas();
    const hit = Alkis.parcelAt(mgl, { x: e.containerPoint.x + (cv.clientWidth - sz.x) / 2, y: e.containerPoint.y + (cv.clientHeight - sz.y) / 2 });
    if (!hit) return;
    const i = a.parcels.findIndex(p => p.id === hit.raw.fid);
    if (i >= 0) a.parcels.splice(i, 1); else a.parcels.push(Alkis.featureFor(mgl, hit.raw, hit.geometry));
    render(a, api); api.changed();
  }

  // Infobox: Gemarkung → Flur → Flurstücke + Fläche
  function render(a, api) {
    if (mgl?.isStyleLoaded()) Alkis.setHighlight(mgl, a.mode === 'select' ? a.parcels.map(f => f.id) : []);
    if (a.mode === 'select' && map.getZoom() < MIN_ZOOM) api.status(`Bitte weiter hineinzoomen (ab Zoom ${MIN_ZOOM}), um Flurstücke zu wählen.`);
    else if (a.mode === 'draw' && a.drawn && map.getZoom() < MIN_ZOOM) api.status(`Für die Flurstückliste bitte weiter hineinzoomen (ab Zoom ${MIN_ZOOM}).`);
    else api.status('');
    info.innerHTML = '';
    const parcels = a.mode === 'select' ? a.parcels : (a.drawnParcels ?? []);

    if (a.mode === 'draw') {
      if (!a.drawn) { info.append(el('p', { className: 'hint', textContent: 'Noch kein Bereich gezeichnet. Nutzen Sie die Werkzeuge links oben in der Karte (Polygon oder Rechteck).' })); return; }
      info.append(el('div', { textContent: `Gezeichnete Fläche: ${fmt(Geo.ringArea(a.drawn.coordinates[0]))} m²` }));
    } else if (!parcels.length) {
      info.append(el('p', { className: 'hint', textContent: 'Klicken Sie auf Flurstücke in der Karte, um sie zu (ab)zuwählen.' })); return;
    }

    const sorted = Format.groups(parcels);
    for (const g of sorted) {
      info.append(el('div', { className: 'block' },
        el('div', { textContent: `Gemarkung: ${g.gem}` }),
        el('div', { textContent: `Flur: ${g.flur}` }),
        el('div', { textContent: g.parcelsText }),
        el('div', { textContent: `Größe: ${Format.ca(g.sum)}` })));
    }
    if (sorted.length > 1) {
      const total = parcels.reduce((t, f) => t + f.properties.flaeche_m2, 0);
      info.append(el('div', { className: 'sum', textContent: `Gesamt: ${parcels.length} Flurstücke, Größe ${Format.ca(total)}` }));
    }
    if (a.fnp?.items.length) info.append(el('div', { className: 'block' }, el('div', { textContent: 'FNP Hauptnutzung: ' + fnpText(a.fnp) })));
    if (a.mode === 'draw' && a.drawnPartial)
      info.append(el('p', { className: 'warn', textContent: 'Der Bereich ragt aus dem Kartenausschnitt – Flurstückliste ggf. unvollständig. Bitte so zoomen, dass der ganze Bereich sichtbar ist.' }));
    if (a.mode === 'select' && parcels.some(f => !f.properties.geometrie_vollstaendig))
      info.append(el('p', { className: 'warn', textContent: 'Einzelne Flurstücke ragen aus dem geladenen Kartenbereich – Geometrie noch unvollständig. Kurz verschieben/herauszoomen, dann ergänzt sie sich.' }));
  }

  function isValid(state) {
    const a = state.area;
    return !!a && (a.mode === 'draw' ? !!a.drawn : a.parcels.length > 0);
  }

  const fnpText = f => f.items.map(i => `${i.nutzung} (${Math.max(1, Math.round(i.share * 100))} %)`).join(', ');
  const fnpLines = a => a.fnp?.items.length ? `\nFNP Hauptnutzung: ${fnpText(a.fnp)}` + (a.fnp.recht.length === 1 ? `\n${a.fnp.recht[0]}` : '') : '';

  // Fertige Infobox-Texte (werden im Style per infoboxMapping angezeigt)
  const infoFor = (g, a) => ({
    info_title: `Gemarkung: ${g.gem}`,
    info_text: `Flur: ${g.flur}\n${g.parcelsText}\nGröße: ${Format.ca(g.sum)}` + fnpLines(a),
  });

  function toFeatures(state) {
    const a = state.area;
    if (a.mode === 'draw') {
      const parcels = a.drawnParcels ?? [];
      const gs = Format.groups(parcels);
      const area = Math.round(Geo.ringArea(a.drawn.coordinates[0]));
      return [{
        type: 'Feature', geometry: a.drawn,
        properties: {
          role: 'projektbereich', mode: 'draw', flaeche_m2: area,
          flurstuecke: parcels.map(f => ({ gemarkung: f.properties.gemarkung, flur: f.properties.flur, flurstueck: f.properties.flurstuecksnummer, flaeche_m2: f.properties.flaeche_m2 })),
          info_title: 'Gezeichneter Projektbereich',
          info_text: `Größe: ${Format.ca(area)}\n\n` + gs.map(g => `Gemarkung: ${g.gem}\nFlur: ${g.flur}\n${g.parcelsText}`).join('\n\n') + (fnpLines(a) ? '\n' + fnpLines(a) : ''),
        },
      }];
    }
    const byKey = new Map(Format.groups(a.parcels).map(g => [`${g.gem}|${g.flur}`, g]));
    return a.parcels.map(f => ({
      type: 'Feature', geometry: f.geometry,
      properties: { role: 'projektbereich', mode: 'flurstueck', ...f.properties,
        ...infoFor(byKey.get(`${f.properties.gemarkung}|${f.properties.flur}`), a) },
    }));
  }

  return { id: 'area', title: 'Projektbereich', mount, isValid, toFeatures };
})();
