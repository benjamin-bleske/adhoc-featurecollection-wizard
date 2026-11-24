// Flurstücke aus dem NRW-ALKIS-WFS (vereinfacht, Open Data, CORS-fähig)
const Alkis = (() => {
  const WFS = 'https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht';
  const CRS = 'urn:ogc:def:crs:EPSG::4326'; // Achsenreihenfolge: lat lon

  const txt = (el, tag) => el.getElementsByTagNameNS('*', tag)[0]?.textContent?.trim() ?? '';

  function posListToRing(s) {
    const v = s.trim().split(/\s+/).map(Number);
    const ring = [];
    for (let i = 0; i < v.length; i += 2) ring.push([v[i + 1], v[i]]); // -> [lon, lat]
    return ring;
  }

  function parseGeometry(el) {
    const polys = [];
    for (const poly of el.getElementsByTagNameNS('*', 'Polygon')) {
      const rings = [];
      for (const kind of ['exterior', 'interior']) {
        for (const r of poly.getElementsByTagNameNS('*', kind)) {
          const pl = r.getElementsByTagNameNS('*', 'posList')[0];
          if (pl) rings.push(posListToRing(pl.textContent));
        }
      }
      if (rings.length) polys.push(rings);
    }
    return { type: 'MultiPolygon', coordinates: polys };
  }

  function parse(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length || doc.getElementsByTagNameNS('*', 'Exception').length)
      throw new Error('WFS-Antwort nicht lesbar');
    return [...doc.getElementsByTagNameNS('*', 'Flurstueck')].map(el => {
      const zae = txt(el, 'flstnrzae'), nen = txt(el, 'flstnrnae');
      return {
        type: 'Feature',
        id: txt(el, 'idflurst') || el.getAttribute('gml:id'),
        geometry: parseGeometry(el),
        properties: {
          idflurst: txt(el, 'idflurst'),
          gemarkung: txt(el, 'gemarkung'),
          gemarkungsschluessel: txt(el, 'gemaschl'),
          flur: txt(el, 'flur'),
          flurstuecksnummer: nen ? `${zae}/${nen}` : zae,
          flaeche_m2: Number(txt(el, 'flaeche')) || 0,
          gemeinde: txt(el, 'gemeinde'),
        },
      };
    });
  }

  async function inBbox({ w, s, e, n }, count = 500, signal) {
    const q = new URLSearchParams({
      service: 'WFS', version: '2.0.0', request: 'GetFeature', typeNames: 'ave:Flurstueck',
      count, srsName: CRS, bbox: `${s},${w},${n},${e},${CRS}`,
    });
    const res = await fetch(`${WFS}?${q}`, { signal });
    if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
    return parse(await res.text());
  }

  return { inBbox };
})();
