// Bebauungsentwurf (Lageplan im Stil eines Reihenhaus-Entwurfs) aus dem Projektbereich / Geltungsbereich.
// Rein rechnerisch (kein Zufall): gleiche Geometrie -> gleicher Entwurf, daher immer synchron mit Ready2Use.
//
// Aufbau (lokales Koordinatensystem u = Hauptachse des Geltungsbereichs, v = quer dazu):
//   mittig eine Privatstraße, beidseits Stellplatzreihen, dahinter Grünstreifen mit Reihenhaus-Zeilen (Einheiten mit Teilungslinien),
//   Bäume zwischen den Stellplatzgruppen, Hecken (dunkle Umrandung der Grünflächen), Beschriftungen.
// Alle Maße sind auf die Ausdehnung skaliert (Modul f) und werden auf die tatsächliche Fläche zugeschnitten.
// Benötigt: Fachdaten.merc/unmerc (js/fachdaten.js) und polygonClipping (CDN, index.html).
const Entwurf = (() => {
  const RAD = Math.PI / 180;

  // Grundmaße in Metern (bei Modul f = 1)
  const M = { strasse: 5, stellplatzTiefe: 2.5, stellplatzBreite: 2.5, vorgarten: 3, haustiefe: 10, einheitBreite: 5.4, einheitenProHaus: 5, hausLuecke: 6, rand: 2, baumR: 1.4 };
  const NEEDED_HALF_WIDTH = M.strasse / 2 + M.stellplatzTiefe + M.vorgarten + M.haustiefe + M.rand; // 20 m je Seite

  const polysOf = g => g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  const ringArea = r => Math.abs(r.reduce((s, p, i) => s + (p[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * p[1]), 0) / 2);
  const multiArea = mp => mp.reduce((t, poly) => t + ringArea(poly[0]) - poly.slice(1).reduce((h, r) => h + ringArea(r), 0), 0);

  function build(fc) {
    const geoPolys = fc.features.flatMap(f => polysOf(f.geometry));
    if (!geoPolys.length) return empty();
    const P = geoPolys.map(poly => poly.map(ring => ring.map(Fachdaten.merc))); // Mercator
    const pts = P.flatMap(poly => poly[0].slice(0, -1));
    const lat0 = Fachdaten.unmerc([pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length])[1];
    const s = 1 / Math.cos(lat0 * RAD); // Mercator-Einheiten je Bodenmeter

    // Hauptachse (PCA der Eckpunkte); Winkel gegen die x-Achse
    const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
    let th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    if (Math.abs(sxx - syy) + Math.abs(sxy) < 1e-9 || Math.hypot(sxx - syy, 2 * sxy) < 0.1 * (sxx + syy)) th = 0; // fast isotrop: achsparallel
    const c = Math.cos(th), sn = Math.sin(th);
    const toU = ([x, y]) => (x - mx) * c + (y - my) * sn, toV = ([x, y]) => -(x - mx) * sn + (y - my) * c;
    const us = pts.map(toU), vs = pts.map(toV);
    const u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs);
    // Mitte des orientierten Rechtecks
    const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
    const L = (u1 - u0) / s, Wd = (v1 - v0) / s; // Bodenmeter
    if (L < 6 || Wd < 6) return empty();

    // lokal (u,v in Bodenmetern, Ursprung = Mitte) -> Mercator
    const toM = (u, v) => { const uu = (cu + u * s), vv = (cv + v * s); return [mx + uu * c - vv * sn, my + uu * sn + vv * c]; };
    const rect = (ua, ub, va, vb) => [[toM(ua, va), toM(ub, va), toM(ub, vb), toM(ua, vb), toM(ua, va)]];

    // Modul: Breite bestimmt die Größe, Länge muss mindestens einen Hausblock fassen
    let f = Math.min(1.5, Math.max(0.15, Wd / (2 * NEEDED_HALF_WIDTH)));
    const blockLen = () => M.einheitenProHaus * M.einheitBreite * f;
    const margin = M.rand * f;
    if (L - 2 * margin < blockLen()) f = Math.max(0.1, (L - 2 * margin) / (M.einheitenProHaus * M.einheitBreite));
    const bl = blockLen(), gap = M.hausLuecke * f, avail = L - 2 * margin;
    const nBlocks = Math.max(1, Math.floor((avail + gap) / (bl + gap)));
    const totalLen = nBlocks * bl + (nBlocks - 1) * gap, start = -totalLen / 2;
    const uMin = -L / 2 + margin, uMax = L / 2 - margin;
    const sH = M.strasse * f / 2, bayD = M.stellplatzTiefe * f, bayW = M.stellplatzBreite * f;
    const plotNear = sH + bayD, vMax = Wd / 2 - margin / 2;

    const feats = [];
    const clip = (poly, kind, props = {}) => { // auf den Geltungsbereich zuschneiden
      let res; try { res = polygonClipping.intersection(poly, P); } catch { return; }
      if (res.length) feats.push({ kind, geometry: res, props });
    };
    const keepIfInside = (poly, kind, props = {}) => { // nur vollständig innerhalb
      let res; try { res = polygonClipping.intersection(poly, P); } catch { return false; }
      if (!res.length || multiArea(res) < 0.97 * multiArea([poly])) return false;
      feats.push({ kind, geometry: [poly], props });
      return true;
    };
    const line = (a, b, kind, props = {}) => { // Linie nur, wenn Mitte im Geltungsbereich
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (inside(mid)) feats.push({ kind, geometry: { type: 'LineString', coordinates: [a, b] }, props });
    };
    const inside = pt => P.some(poly => pip(pt, poly[0]) && !poly.slice(1).some(h => pip(pt, h)));
    const pip = (pt, ring) => { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) ins = !ins; } return ins; };

    // Grünflächen (beidseits, mit Hecke), Straße, Stellplatzreihen
    for (const sd of [1, -1]) clip(rect(uMin - margin / 2, uMax + margin / 2, sd > 0 ? plotNear : -vMax, sd > 0 ? vMax : -plotNear), 'gruen');
    clip(rect(uMin, uMax, -sH, sH), 'strasse');
    feats.push({ kind: 'strassenachse', geometry: { type: 'LineString', coordinates: [toM(uMin, 0), toM(uMax, 0)] }, props: { text: 'Privatstraße' } });
    const nBays = Math.max(1, Math.floor((uMax - uMin) / bayW));
    const bays0 = uMin + ((uMax - uMin) - nBays * bayW) / 2;
    for (const sd of [1, -1]) {
      clip(rect(bays0, bays0 + nBays * bayW, sd > 0 ? sH : -sH - bayD, sd > 0 ? sH + bayD : -sH), 'parken');
      const brown = sd > 0 ? Math.min(nBays, Math.round(nBays * 0.25)) : Math.min(nBays, Math.round(nBays * 0.15)); // einige Stellplätze gepflastert (braun)
      if (brown) clip(rect(bays0, bays0 + brown * bayW, sd > 0 ? sH : -sH - bayD, sd > 0 ? sH + bayD : -sH), 'parken_braun');
      for (let i = 0; i <= nBays; i++) { // Trennlinien der Stellplätze
        const u = bays0 + i * bayW; line(toM(u, sd * sH), toM(u, sd * (sH + bayD)), 'stellplatz_linie');
      }
    }

    // Reihenhaus-Zeilen: entlang der Straße suchen, wo ein Block (5, sonst 4 … 1 Einheiten) vollständig in den Geltungsbereich passt
    let haeuser = 0, einheiten = 0, nr = 0;
    const unit = M.einheitBreite * f;
    for (const sd of [1, -1]) {
      const va = sd * (plotNear + M.vorgarten * f), vb = sd * (plotNear + (M.vorgarten + M.haustiefe) * f);
      const vlo = Math.min(va, vb), vhi = Math.max(va, vb), vm = (va + vb) / 2;
      let u = start;
      while (u + unit <= uMax + 1e-6) {
        let placed = 0;
        for (let n = M.einheitenProHaus; n >= 1 && !placed; n--) {
          const ua = u, ub = u + n * unit;
          if (ub > uMax + 1e-6) continue;
          const label = `${nr % 2 ? 145 : 120} ${String.fromCharCode(97 + (nr % 6))}`;
          if (!keepIfInside(rect(ua, ub, vlo, vhi), 'haus', { titel: `Reihenhaus ${label}`, text: `${n} Einheit${n > 1 ? 'en' : ''}` })) continue;
          placed = n; nr++; haeuser++; einheiten += n;
          for (let k = 1; k < n; k++) { const uk = ua + k * unit; feats.push({ kind: 'haus_teilung', geometry: { type: 'LineString', coordinates: [toM(uk, va), toM(uk, vb)] }, props: {} }); }
          feats.push({ kind: 'haus_teilung', geometry: { type: 'LineString', coordinates: [toM(ua, vm), toM(ub, vm)] }, props: {} }); // Firstlinie
          feats.push({ kind: 'beschriftung', geometry: { type: 'Point', coordinates: toM((ua + ub) / 2, vm) }, props: { text: label } });
        }
        u += placed ? placed * unit + gap : unit / 2;
      }
    }

    // Bäume: zwischen den Stellplatzgruppen entlang der Straße
    let baeume = 0;
    for (const sd of [1, -1]) {
      for (let i = 4; i < nBays; i += 5) {
        const u = bays0 + i * bayW, v = sd * (sH + bayD + M.baumR * f * 0.9);
        const r = M.baumR * f * s, [x, y] = toM(u, v);
        const ring = Array.from({ length: 17 }, (_, k) => [x + r * Math.cos(k / 16 * 2 * Math.PI), y + r * Math.sin(k / 16 * 2 * Math.PI)]);
        if (inside([x, y])) { feats.push({ kind: 'baum', geometry: [ring], props: { titel: 'Baum' } }); baeume++; }
      }
    }

    // nach Lon/Lat zurück
    const ll = p => Fachdaten.unmerc(p).map(v => +v.toFixed(7));
    const toLL = g => Array.isArray(g) ? (typeof g[0] === 'number' ? ll(g) : g.map(toLL)) : g;
    const features = feats.map(({ kind, geometry, props }) => ({
      type: 'Feature', properties: { kind, ...props },
      geometry: Array.isArray(geometry)
        ? (geometry[0]?.[0]?.[0]?.[0] !== undefined ? { type: 'MultiPolygon', coordinates: toLL(geometry) } : { type: 'Polygon', coordinates: toLL(geometry) })
        : { type: geometry.type, coordinates: toLL(geometry.coordinates) },
    }));
    return { type: 'FeatureCollection', features, stats: { haeuser, einheiten, baeume, stellplaetze: 2 * nBays, winkel_grad: +(th / RAD).toFixed(1), modul: +f.toFixed(2) } };
  }
  const empty = () => ({ type: 'FeatureCollection', features: [], stats: { haeuser: 0, einheiten: 0, baeume: 0, stellplaetze: 0 } });

  // Layer im Stil des Lageplans (Grün mit dunkler Hecke, weiße Reihenhäuser mit Teilung, graue Privatstraße, braune Pflasterflächen)
  const layers = source => [
    { id: 'entwurf-gruen', type: 'fill', source, filter: ['==', ['get', 'kind'], 'gruen'], paint: { 'fill-color': '#a9bd88' } },
    { id: 'entwurf-hecke', type: 'line', source, filter: ['==', ['get', 'kind'], 'gruen'], layout: { 'line-join': 'round' }, paint: { 'line-color': '#5d7430', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.5, 20, 5] } },
    { id: 'entwurf-strasse', type: 'fill', source, filter: ['==', ['get', 'kind'], 'strasse'], paint: { 'fill-color': '#d8d8d8' } },
    { id: 'entwurf-parken', type: 'fill', source, filter: ['==', ['get', 'kind'], 'parken'], paint: { 'fill-color': '#ececec' } },
    { id: 'entwurf-parken-braun', type: 'fill', source, filter: ['==', ['get', 'kind'], 'parken_braun'], paint: { 'fill-color': '#a8795a', 'fill-outline-color': '#5b3d2a' } },
    { id: 'entwurf-stellplatz-linie', type: 'line', source, filter: ['==', ['get', 'kind'], 'stellplatz_linie'], paint: { 'line-color': '#8d8d8d', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.3, 20, 1.2] } },
    { id: 'entwurf-haus', type: 'fill', source, filter: ['==', ['get', 'kind'], 'haus'], paint: { 'fill-color': '#ffffff' } },
    { id: 'entwurf-haus-rand', type: 'line', source, filter: ['==', ['get', 'kind'], 'haus'], paint: { 'line-color': '#1c1c1c', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 20, 2] } },
    { id: 'entwurf-haus-teilung', type: 'line', source, filter: ['==', ['get', 'kind'], 'haus_teilung'], paint: { 'line-color': '#1c1c1c', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 20, 1.4] } },
    { id: 'entwurf-baum', type: 'fill', source, filter: ['==', ['get', 'kind'], 'baum'], paint: { 'fill-color': '#86ab62', 'fill-outline-color': '#41602b' } },
    { id: 'entwurf-baum-rand', type: 'line', source, filter: ['==', ['get', 'kind'], 'baum'], paint: { 'line-color': '#41602b', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 20, 1.5] } },
    { id: 'entwurf-strassenname', type: 'symbol', source, filter: ['==', ['get', 'kind'], 'strassenachse'],
      layout: { 'symbol-placement': 'line', 'text-field': ['get', 'text'], 'text-font': ['Open Sans Semibold'], 'text-size': 11, 'text-letter-spacing': 0.05 }, paint: { 'text-color': '#222222', 'text-opacity': ['interpolate', ['linear'], ['zoom'], 16.5, 0, 17.5, 1] } },
    { id: 'entwurf-hausnummer', type: 'symbol', source, filter: ['==', ['get', 'kind'], 'beschriftung'],
      layout: { 'text-field': ['get', 'text'], 'text-font': ['Open Sans Semibold'], 'text-size': 11, 'text-allow-overlap': false }, paint: { 'text-color': '#111111', 'text-halo-color': '#ffffff', 'text-halo-width': 1, 'text-opacity': ['interpolate', ['linear'], ['zoom'], 17, 0, 18, 1] } },
  ];

  return { build, layers };
})();
