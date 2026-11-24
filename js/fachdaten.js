// Fachdaten, die als WMS-Kartenebenen in den Style des Projektbereichs übernommen werden können.
// MapLibre fragt die Kacheln als WMS-GetMap in EPSG:3857 ab; `bounds` begrenzt sie auf das Rechteck um den Projektbereich.
const Fachdaten = (() => {
  const wms = (base, params) => `${base}?service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}&${params}`;

  const CATALOG = [
    { id: 'luftbild', short: 'Luftbild', icon: 'image', label: 'Luftbild (Wuppertal, True-Ortho 2024)', opacity: 1,
      source: 'Stadt Wuppertal, maps.wuppertal.de/karten',
      tiles: wms('https://maps.wuppertal.de/karten', 'layers=R102:trueortho2024&styles=&format=image/jpeg') },
    { id: 'fnp', short: 'FNP', icon: 'map', label: 'FNP-Arbeitskarte (aktualisiert), Hauptnutzungen', opacity: 0.6,
      source: 'Stadt Wuppertal, maps.wuppertal.de/planung',
      tiles: wms('https://maps.wuppertal.de/planung', 'layers=r102_fnp_haupt_fl&styles=default&format=image/png&transparent=true') },
    { id: 'regionalplan', short: 'Regionalplan', icon: 'layer-group', label: 'Regionalplan (NRW)', opacity: 0.6,
      source: 'Land NRW, wms.nrw.de/wms/wms_nw_regionalplan',
      tiles: wms('https://www.wms.nrw.de/wms/wms_nw_regionalplan', 'layers=regionalplan&styles=&format=image/png&transparent=true') },
  ];

  const byId = id => CATALOG.find(c => c.id === id);

  // Rechteck [w,s,e,n] um den Projektbereich, leicht aufgeweitet
  const padBounds = ([w, s, e, n]) => {
    const dx = (e - w) * 0.05 || 0.0005, dy = (n - s) * 0.05 || 0.0005;
    return [w - dx, s - dy, e + dx, n + dy].map(v => +v.toFixed(6));
  };

  // -> { sources, layers } für den Style; Reihenfolge Luftbild unten, dann Pläne
  function toStyleParts(ids, bounds) {
    const sources = {}, layers = [];
    for (const id of ids ?? []) {
      const c = byId(id);
      if (!c) continue;
      sources[`fd-${id}`] = { type: 'raster', tiles: [c.tiles], tileSize: 256, ...(bounds && { bounds: padBounds(bounds) }), attribution: c.source };
      layers.push({ id: `fd-${id}`, type: 'raster', source: `fd-${id}`, paint: { 'raster-opacity': c.opacity }, metadata: { fachdaten: c.label } });
    }
    return { sources, layers };
  }

  // Bedienelemente im Geoportal (carmaConf.dynamicStyling): je Fachdatum ein An/Aus-Schalter und eine Deckkraft-Auswahl.
  // Ziele sind Pfade im Style: layers.<layer-id>.<layout|paint>.<eigenschaft>
  const ICON_BASE = 'https://benjamin-bleske.github.io/adhoc-featurecollection-wizard/icons';
  const OPACITIES = [['voll', 'Deckkraft 100 %', 1], ['mittel', 'Deckkraft 60 %', 0.6], ['schwach', 'Deckkraft 30 %', 0.3]];
  function toDynamicStyling(ids) {
    return (ids ?? []).map(byId).filter(Boolean).flatMap(c => {
      const lid = `fd-${c.id}`;
      const def = (OPACITIES.find(o => o[2] === c.opacity) ?? OPACITIES[0])[0];
      return [
        { type: 'toggle', label: c.short, default: 'an', showIcon: false,
          options: [
            { id: 'an', title: `${c.short} ausblenden`, visibility: 'visible', icon: `${ICON_BASE}/${c.id}-an.svg` },
            { id: 'aus', title: `${c.short} einblenden`, visibility: 'none', icon: `${ICON_BASE}/${c.id}-aus.svg`, faded: true },
          ],
          targets: { visibility: [`layers.${lid}.layout.visibility`] } },
        { type: 'list', label: `${c.short}: Deckkraft`, default: def, showIcon: false,
          options: OPACITIES.map(([id, title, v]) => ({ id, title, opacity: v, icon: `${ICON_BASE}/${c.id}-${id}.svg` })),
          targets: { opacity: [`layers.${lid}.paint.raster-opacity`] } },
      ];
    });
  }

  return { CATALOG, toStyleParts, toDynamicStyling };
})();
