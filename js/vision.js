// Planungsphase 2: Zukunftsvision einer Fläche als Flächengedächnis.
// Geltungsbereich = Projektbereich, nach außen gepuffert auf die doppelte Fläche. Entwurf = kleine Baufelder in Bauabschnitten:
// Abschnitt 1 auf dem heutigen Projektbereich, die weiteren nach außen. Rein rechnerisch (kein Zufall), wie js/entwurf.js.
// Benötigt: Fachdaten.merc/unmerc, Entwurf (Geometrie-Helfer) und polygonClipping.
const Vision = (() => {
  const FLAECHEN_FAKTOR = 2;
  const TEXT = 'Zukunftsvision der Fläche: Bei großen Flächen mit heterogenen Eigentümerstrukturen ist der Ausgleich der Interessen oft langwierig. Deshalb wird die Fläche in kleine Baufelder geteilt und über Jahre in Bauabschnitten entwickelt. Ergeben sich Gelegenheitsfenster, etwa durch Eigentümerwechsel, wird die Vision fortgesetzt. Diese Ebene dient als Flächengedächnis.';
  // Zeithorizonte und Auslöser sind beispielhaft
  const ABSCHNITTE = [
    { horizont: 'kurzfristig (0 bis 5 Jahre)', ausloeser: 'Start auf dem heutigen Projektbereich', farbe: '#f2c879' },
    { horizont: 'mittelfristig (5 bis 10 Jahre)', ausloeser: 'Gelegenheitsfenster, z. B. Eigentümerwechsel angrenzender Flächen', farbe: '#e8a598' },
    { horizont: 'langfristig (10 bis 20 Jahre)', ausloeser: 'Gelegenheitsfenster, z. B. Auslaufen bestehender Nutzungen', farbe: '#b9a7d4' },
    { horizont: 'sehr langfristig (über 20 Jahre)', ausloeser: 'Fortschreibung der Vision bei sich bietender Gelegenheit', farbe: '#9fbfd9' },
  ];
  // Maße in Bodenmetern
  const M = { feld: 45, weg: 6, gruenzug: 16, baumR: 2.2, maxFelder: 40 };

  // ---- Geltungsbereich: Puffer um den Projektbereich, bis die Fläche FLAECHEN_FAKTOR-mal so groß ist
  // Douglas-Peucker: weniger Stützpunkte für den Puffer (das Original wird immer mit vereinigt)
  function simplify(pts, tol) {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts.at(-1)], vx = b[0] - a[0], vy = b[1] - a[1], len = vx * vx + vy * vy || 1;
    let max = 0, at = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const t = Math.max(0, Math.min(1, ((pts[i][0] - a[0]) * vx + (pts[i][1] - a[1]) * vy) / len));
      const d = Math.hypot(pts[i][0] - a[0] - t * vx, pts[i][1] - a[1] - t * vy);
      if (d > max) { max = d; at = i; }
    }
    return max <= tol ? [a, b] : [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
  }
  const cm = p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100];
  const circle = ([x, y], r, n = 16) => { const ring = Array.from({ length: n }, (_, k) => cm([x + r * Math.cos(k / n * 2 * Math.PI), y + r * Math.sin(k / n * 2 * Math.PI)])); return [[...ring, ring[0]]]; };

  function buffer(P, rings, r) {
    const pieces = [];
    for (const ring of rings) for (let i = 0; i < ring.length - 1; i++) {
      const [a, b] = [ring[i], ring[i + 1]], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      pieces.push(circle(a, r));
      if (d < 0.01) continue;
      const nx = -(b[1] - a[1]) / d * r, ny = (b[0] - a[0]) / d * r;
      const q = [cm([a[0] + nx, a[1] + ny]), cm([b[0] + nx, b[1] + ny]), cm([b[0] - nx, b[1] - ny]), cm([a[0] - nx, a[1] - ny])];
      pieces.push([[...q, q[0]]]);
    }
    const grown = polygonClipping.union(P, ...pieces);
    return polygonClipping.union(...grown.map(poly => [poly[0]])); // Löcher schließen
  }

  function enlarge(P, s) {
    const target = FLAECHEN_FAKTOR * Entwurf.multiArea(P);
    const rings = P.map(poly => simplify(poly[0], 2 * s));
    let lo = 0, hi = Math.sqrt(target), best = buffer(P, rings, hi);
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2, res = buffer(P, rings, mid), a = Entwurf.multiArea(res);
      if (a < target) lo = mid; else { hi = mid; best = res; }
      if (Math.abs(a - target) < 0.005 * target) return res;
    }
    return best;
  }

  // ---- Entwurf
  function build(fc) {
    const src = fc.features.flatMap(f => Entwurf.polysOf(f.geometry)).map(poly => poly.map(ring => ring.map(Fachdaten.merc)));
    if (!src.length) return { area: { type: 'FeatureCollection', features: [] }, design: { type: 'FeatureCollection', features: [], stats: { abschnitte: 0, baufelder: 0, haeuser: 0, baeume: 0 } } };
    const origin = polygonClipping.union(...src);
    const s = Entwurf.frame(origin).s;
    const P = enlarge(origin, s);
    const { L, Wd, toM, rect } = Entwurf.frame(P);

    // Bodengröße der Flächen
    const area = multi => Math.round(Entwurf.multiArea(multi) / (s * s));
    const m2 = area(P), vorher = area(origin);

    const feats = [];
    const clip = (poly, kind, props = {}) => {
      let res; try { res = polygonClipping.intersection(poly, P); } catch { return 0; }
      if (res.length) feats.push({ kind, geometry: res, props });
      return Entwurf.multiArea(res);
    };
    const fits = poly => { try { return Entwurf.multiArea(polygonClipping.intersection(poly, P)) >= 0.97 * Entwurf.multiArea([poly]); } catch { return false; } };

    // Modul: bei kleinen Flächen alles verkleinern, bei sehr großen Baufelder vergrößern
    const f = Math.min(1, Math.max(0.2, Math.min(L, Wd) / (2 * M.feld + M.gruenzug)));
    const gz = M.gruenzug * f, weg = M.weg * f;
    const nCols = Math.min(M.maxFelder, Math.max(1, Math.round(L / (M.feld * f))));
    const nRows = Math.min(M.maxFelder / 2, Math.max(1, Math.round((Wd - gz) / 2 / (M.feld * f)))); // je Seite des Grünzugs
    const cw = L / nCols, ch = Math.max(1, (Wd - gz) / 2 / nRows);

    // Baufelder, nach Abstand zum heutigen Projektbereich in Abschnitte geteilt
    const cells = [];
    for (const sd of [1, -1]) for (let r = 0; r < nRows; r++) for (let i = 0; i < nCols; i++) {
      const ua = -L / 2 + i * cw + weg / 2, ub = -L / 2 + (i + 1) * cw - weg / 2;
      const near = gz / 2 + r * ch + weg / 2, far = gz / 2 + (r + 1) * ch - weg / 2;
      const va = Math.min(sd * near, sd * far), vb = Math.max(sd * near, sd * far);
      if (ub <= ua || vb <= va) continue;
      const poly = rect(ua, ub, va, vb);
      let part; try { part = polygonClipping.intersection(poly, P); } catch { continue; }
      if (Entwurf.multiArea(part) < 0.15 * Entwurf.multiArea([poly])) continue;
      const center = toM((ua + ub) / 2, (va + vb) / 2);
      cells.push({ ua, ub, va, vb, part, center, i, r, sd });
    }
    const pts = origin.flatMap(poly => poly[0].slice(0, -1));
    const mid = [pts.reduce((t, p) => t + p[0], 0) / pts.length, pts.reduce((t, p) => t + p[1], 0) / pts.length];
    const dist = c => Math.hypot(c.center[0] - mid[0], c.center[1] - mid[1]);
    cells.sort((a, b) => dist(a) - dist(b) || a.sd - b.sd || a.i - b.i);
    let first = cells.filter(c => Entwurf.contains(origin, c.center));
    if (!first.length) first = cells.slice(0, Math.ceil(cells.length / ABSCHNITTE.length));
    first.forEach(c => { c.ba = 1; });
    const rest = cells.filter(c => !c.ba);
    rest.forEach((c, k) => { c.ba = 2 + Math.floor(k * (ABSCHNITTE.length - 1) / rest.length); });

    const info = ba => ({ abschnitt: ba, horizont: ABSCHNITTE[ba - 1].horizont, ausloeser: ABSCHNITTE[ba - 1].ausloeser });

    feats.push({ kind: 'grund', geometry: P, props: { titel: 'Wege und Freiraum' } });
    for (const c of cells) feats.push({ kind: 'baufeld', geometry: c.part, props: { titel: `Baufeld ${cells.indexOf(c) + 1}`, farbe: ABSCHNITTE[c.ba - 1].farbe, ...info(c.ba) } });

    // zentraler Grünzug mit Quartiersplatz
    clip(rect(-L / 2, L / 2, -gz / 2, gz / 2), 'gruenzug', { titel: 'Grünzug' });
    const platz = rect(-gz, gz, -gz / 2, gz / 2);
    if (fits(platz)) feats.push({ kind: 'platz', geometry: [platz], props: { titel: 'Quartiersplatz' } });

    // Gebäude je Baufeld (nur vollständig innerhalb), Typ wechselt: Hofhaus, Zeilen, Punkthäuser
    let haeuser = 0, baeume = 0;
    const tree = (u, v) => { const pt = toM(u, v); if (Entwurf.contains(P, pt)) { feats.push({ kind: 'baum', geometry: circle(pt, M.baumR * f * s), props: { titel: 'Baum' } }); baeume++; } };
    const TYPEN = [
      ['Hofhaus', [[0.12, 0.88, 0.66, 0.86], [0.12, 0.32, 0.14, 0.66], [0.68, 0.88, 0.14, 0.66]]],
      ['Zeilenbau', [[0.12, 0.88, 0.16, 0.36], [0.12, 0.88, 0.64, 0.84]]],
      ['Punkthaus', [[0.14, 0.4, 0.14, 0.4], [0.6, 0.86, 0.14, 0.4], [0.14, 0.4, 0.6, 0.86], [0.6, 0.86, 0.6, 0.86]]],
    ];
    cells.forEach(c => {
      const [typ, parts] = TYPEN[(c.i + c.r + (c.sd > 0 ? 0 : 1)) % TYPEN.length];
      const w = c.ub - c.ua, h = c.vb - c.va;
      parts.forEach(([a, b, d, e], k) => {
        const poly = rect(c.ua + a * w, c.ua + b * w, c.va + d * h, c.va + e * h);
        if (!fits(poly)) return;
        const gruen = (c.i + k) % 2 === 0;
        feats.push({ kind: gruen ? 'dach_gruen' : 'haus', geometry: [poly], props: { titel: typ + (gruen ? ' mit Gründach' : ''), ...info(c.ba) } });
        haeuser++;
      });
      tree(c.ua + w / 2, c.va + h * (typ === 'Hofhaus' ? 0.4 : 0.5));
      if (Entwurf.contains(P, c.center)) feats.push({ kind: 'abschnitt_label', geometry: { type: 'Point', coordinates: toM(c.ua + w / 2, c.va + h * 0.07) }, props: { text: `BA ${c.ba}`, ...info(c.ba) } });
    });
    for (let u = -L / 2 + cw / 2; u < L / 2; u += Math.max(8, 14 * f)) for (const v of [-gz * 0.3, gz * 0.3]) if (Math.abs(u) > gz + M.baumR) tree(u, v);

    // heutiger Projektbereich als Bezug
    feats.push({ kind: 'ausgang', geometry: origin, props: { titel: 'Heutiger Projektbereich' } });

    const ring = Entwurf.toGeoJSON([{ kind: 'x', geometry: P, props: {} }])[0].geometry;
    return {
      area: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: ring, properties: {
        role: 'zukunftsvision', flaeche_m2: m2, info_title: 'Flächengedächnis',
        info_text: `Größe: ${Format.ca(m2)}\nHeutiger Projektbereich: ${Format.ca(vorher)}` } }] },
      design: { type: 'FeatureCollection', features: Entwurf.toGeoJSON(feats),
        stats: { abschnitte: new Set(cells.map(c => c.ba)).size, baufelder: cells.length, haeuser, baeume, flaeche_m2: m2, ausgangsflaeche_m2: vorher } },
    };
  }

  // Infobox für Objekte des Entwurfs (eine Zeile im Style)
  const INFOBOX = "function createInfoBoxInfo(p){ var t = p.abschnitt ? 'Bauabschnitt ' + p.abschnitt + ', ' + p.horizont : 'Zukunftsvision'; return { header: 'Planungsphase 2: Zukunftsvision', headerColor: p.farbe || '#4f6d8f', title: p.titel || p.text, subtitle: t, additionalInfo: p.ausloeser ? 'Auslöser (beispielhaft): ' + p.ausloeser : '' }; }";

  const layers = source => {
    const is = kind => ['==', ['get', 'kind'], kind];
    const fill = (id, kind, paint) => ({ id: `vision-${id}`, type: 'fill', source, filter: is(kind), paint });
    const line = (id, kind, paint) => ({ id: `vision-${id}`, type: 'line', source, filter: is(kind), layout: { 'line-join': 'round' }, paint });
    return [
      fill('grund', 'grund', { 'fill-color': '#e6e2da' }),
      fill('baufeld', 'baufeld', { 'fill-color': ['get', 'farbe'], 'fill-opacity': 0.85 }),
      line('baufeld-rand', 'baufeld', { 'line-color': '#7a6f63', 'line-width': 1 }),
      fill('gruenzug', 'gruenzug', { 'fill-color': '#9cc58a' }),
      fill('platz', 'platz', { 'fill-color': '#f4efe2', 'fill-outline-color': '#8a7f6a' }),
      fill('haus', 'haus', { 'fill-color': '#ffffff' }),
      line('haus-rand', 'haus', { 'line-color': '#333333', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 20, 2] }),
      fill('dach', 'dach_gruen', { 'fill-color': '#6f9f58' }),
      line('dach-rand', 'dach_gruen', { 'line-color': '#2f4a24', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 20, 2] }),
      fill('baum', 'baum', { 'fill-color': '#4f8a45', 'fill-outline-color': '#2c5226' }),
      line('ausgang', 'ausgang', { 'line-color': '#000000', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 16, 3, 20, 5] }),
      { id: 'vision-label', type: 'symbol', source, filter: is('abschnitt_label'),
        layout: { 'text-field': ['get', 'text'], 'text-font': ['Open Sans Semibold'], 'text-size': 12 },
        paint: { 'text-color': '#1d1d1d', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } },
    ];
  };

  return { build, layers, TEXT, INFOBOX };
})();
