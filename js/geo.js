// Kleine Geometrie-Helfer (GeoJSON-Koordinaten [lon, lat], WGS84)
const Geo = (() => {
  const R = 6371008.8;
  const rad = d => d * Math.PI / 180;

  // Geodätische Fläche eines Rings in m² (sphärische Näherung)
  function ringArea(ring) {
    let s = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [l1, p1] = ring[i], [l2, p2] = ring[i + 1];
      s += rad(l2 - l1) * (2 + Math.sin(rad(p1)) + Math.sin(rad(p2)));
    }
    return Math.abs(s * R * R / 2);
  }

  function pointInRing(pt, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function segCross(a, b, c, d) {
    const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    return (o(a, b, c) > 0) !== (o(a, b, d) > 0) && (o(c, d, a) > 0) !== (o(c, d, b) > 0);
  }

  // Schneiden sich zwei Außenringe (inkl. Enthaltensein)?
  function ringsIntersect(r1, r2) {
    if (r1.some(p => pointInRing(p, r2)) || r2.some(p => pointInRing(p, r1))) return true;
    for (let i = 0; i < r1.length - 1; i++)
      for (let j = 0; j < r2.length - 1; j++)
        if (segCross(r1[i], r1[i + 1], r2[j], r2[j + 1])) return true;
    return false;
  }

  function bbox(ring) {
    let w = 180, s = 90, e = -180, n = -90;
    for (const [x, y] of ring) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
    return { w, s, e, n };
  }

  return { ringArea, pointInRing, ringsIntersect, bbox };
})();
