// Gewerbepotenzialflächen (Kataster der Stadt Wuppertal, Vector Tiles) als direkte Quelle für den Projektbereich.
// Quelle und Darstellung kommen aus dem Style; Attribute/Geometrie direkt aus den Tiles.
const Potenzial = (() => {
  const STYLE = 'https://tiles.cismet.de/pf_gewerbepotenzialflaechen/style.json';
  const LAYER = 'pf_gewerbepotenzialflaechen'; // source-layer
  const SOURCE = 'adhoc-pf';
  const FILL = 'adhoc-pf-fill';
  const MIN_ZOOM = 14; // darunter ist die Geometrie aus den Tiles zu grob -> beim Wählen wird auf die Fläche gezoomt

  const parse = (s, fallback) => { try { return JSON.parse(s) ?? fallback; } catch { return fallback; } };

  // "053001-003-00015/0002" -> Gemarkung 3001, Flur 3, Flurstück 15/2
  function parcel(kz) {
    const [gem, flur, nr = ''] = kz.split('-');
    const nummer = Number(gem.slice(2));
    return { gemarkung: Alkis.GEMARKUNGEN[nummer] ?? `Gemarkung ${nummer}`, flur: String(Number(flur)),
      flurstuecksnummer: nr.split('/').map(Number).join('/'), flaeche_m2: 0 };
  }

  // Nur diese Attribute übernehmen: die FeatureCollection wird veröffentlicht (keine internen Hinweise, Eigentümer usw.)
  const toProps = p => ({
    nummer: p.nummer ?? '',
    bezeichnung: p.bezeichnung ?? '',
    flaeche_m2: Number(p.groesse) || 0,
    flurstuecke: parse(p.flurstuecke, []).map(parcel),
    steckbrief: `https://tiles.cismet.de/potenzialflaechenreport/gewerbeflaechen/Steckbrief.${p.fid}.pdf`,
  });

  // [[süd, west], [nord, ost]] für Leaflet, aus der mitgelieferten `bounds`-Angabe
  const latLngBounds = raw => { const b = parse(raw.bounds, null); return b && [[b[1], b[0]], [b[3], b[2]]]; };

  function featureFor(mgl, raw, fallbackGeom, zoom) {
    const g = Alkis.geometryOf(mgl, raw, SOURCE, LAYER);
    const fallback = fallbackGeom.type === 'Polygon' ? [fallbackGeom.coordinates] : fallbackGeom.coordinates;
    return {
      type: 'Feature', id: raw.fid,
      geometry: g?.geometry ?? { type: 'MultiPolygon', coordinates: fallback },
      properties: toProps(raw),
      complete: !!g?.complete && zoom >= MIN_ZOOM,
      _raw: raw,
    };
  }

  // Quelle und Layer aus dem Style in die Karte einhängen (zunächst unsichtbar), dazu die Hervorhebung der Auswahl
  async function add(mgl) {
    const res = await fetch(STYLE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const style = await res.json();
    if (!mgl.style || mgl.getSource(SOURCE)) return; // Karte inzwischen entfernt oder schon eingehängt
    mgl.addSource(SOURCE, Object.values(style.sources)[0]);
    const base = { source: SOURCE, 'source-layer': LAYER, layout: { visibility: 'none' } };
    for (const l of style.layers) {
      const id = l.type === 'fill' ? FILL : `adhoc-${l.id}`;
      mgl.addLayer({ ...l, ...base, id, layout: { ...l.layout, ...base.layout } });
    }
    const none = ['in', ['get', 'fid'], ['literal', []]];
    mgl.addLayer({ ...base, id: 'adhoc-pf-sel-fill', type: 'fill', filter: none, paint: { 'fill-color': '#e8590c', 'fill-opacity': 0.45 } });
    mgl.addLayer({ ...base, id: 'adhoc-pf-sel-line', type: 'line', filter: none, paint: { 'line-color': '#e8590c', 'line-width': 3 } });
  }

  // Ebene ein-/ausblenden und gewählte Flächen hervorheben
  function show(mgl, visible, fids) {
    if (!mgl.style || !mgl.getLayer('adhoc-pf-sel-line')) return;
    const value = visible ? 'visible' : 'none';
    for (const l of mgl.getStyle().layers.filter(l => l.source === SOURCE)) {
      if (mgl.getLayoutProperty(l.id, 'visibility') !== value) mgl.setLayoutProperty(l.id, 'visibility', value);
      if (l.id.startsWith('adhoc-pf-sel')) mgl.setFilter(l.id, ['in', ['get', 'fid'], ['literal', fids]]);
    }
  }

  // Potenzialfläche unter dem Klickpunkt (Pixel im GL-Canvas)
  function at(mgl, point) {
    if (!mgl.getLayer(FILL)) return null;
    const f = mgl.queryRenderedFeatures([point.x, point.y], { layers: [FILL] })[0];
    return f ? { raw: f.properties, geometry: f.geometry } : null;
  }

  return { STYLE, MIN_ZOOM, add, show, at, featureFor, latLngBounds };
})();
