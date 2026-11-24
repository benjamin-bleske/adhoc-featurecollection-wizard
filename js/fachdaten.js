// Fachdaten, die als Kartenebenen in den Style des Projektbereichs übernommen werden können.
//  - kind 'wms':   Raster-WMS, MapLibre fragt Kacheln per GetMap in EPSG:3857 ab.
//  - kind 'style': externer Vektor-Style (tiles.cismet.de), wird beim Publishen geladen und in den Style eingebaut
//                  (Sources/Layer mit Präfix fd-<id>; Beschriftungs-Layer mit Sprite entfallen).
// `bounds` begrenzt die Quellen auf das Rechteck um den Projektbereich.
const Fachdaten = (() => {
  const wms = (base, params) => `${base}?service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}&${params}`;
  const caps = base => `${base}?REQUEST=GetCapabilities&SERVICE=WMS`;

  const CATALOG = [
    { id: 'fnp', kind: 'style', label: 'FNP Hauptnutzungen',
      styleUrl: 'https://tiles.cismet.de/hauptnutzungen/style.json', sourceLayer: 'hauptnutzungen',
      description: 'Flächennutzungsplan der Stadt Wuppertal, Hauptnutzungen (Vektordaten).',
      source: 'Stadt Wuppertal, tiles.cismet.de/hauptnutzungen',
      // der Style bringt keine Infobox mit: eigene Zuordnung (eine Zeile, siehe Geoportal-Regel "nur Zeilen mit function")
      infobox: "function createInfoBoxInfo(p){ return { header: 'FNP Hauptnutzungen', headerColor: p.farbe || '#7C7CA6', title: p.nutzung, subtitle: p.text_recht || '', additionalInfo: p.name || '' }; }" },
    { id: 'regionalplan', kind: 'wms', label: 'WMS Regionalplan NRW',
      description: 'Stellt Rasterdaten der Regionalpläne der sechs Planungsgebiete in NRW sowie des Regionalen Flächennutzungsplans im Kern-Ruhrgebiet dar.',
      source: 'Land NRW, wms.nrw.de/wms/wms_nw_regionalplan',
      capabilities: caps('https://www.wms.nrw.de/wms/wms_nw_regionalplan'),
      tiles: wms('https://www.wms.nrw.de/wms/wms_nw_regionalplan', 'layers=regionalplan&styles=&format=image/png&transparent=true'), opacity: 0.7 },
    { id: 'lep', kind: 'wms', label: 'WMS Landesentwicklungsplan NRW',
      description: 'Rasterdaten der zeichnerischen Festlegungen des geltenden Landesentwicklungsplans NRW.',
      source: 'Land NRW, wms.nrw.de/wms/wms_nw_landesentwicklungsplan',
      capabilities: caps('https://www.wms.nrw.de/wms/wms_nw_landesentwicklungsplan'),
      tiles: wms('https://www.wms.nrw.de/wms/wms_nw_landesentwicklungsplan', 'layers=landesentwicklungsplan&styles=&format=image/png&transparent=true'), opacity: 0.7 },
    { id: 'bplan', kind: 'style', label: 'B-Plan-Verfahren (rechtsverbindlich)',
      styleUrl: 'https://tiles.cismet.de/bplanverfahren/rechtsverbindlich.style.json', sourceLayer: 'bplanverfahren',
      description: 'Räumliche Geltungsbereiche rechtsverbindlicher Bebauungsplanverfahren in Wuppertal.',
      source: 'Stadt Wuppertal, tiles.cismet.de/bplanverfahren' },
    { id: 'landschaft', kind: 'style', label: 'Landschafts- und Naturschutz',
      styleUrl: 'https://tiles.cismet.de/landschaftsundnaturschutz/style.json', sourceLayer: 'landschaftsundnaturschutz',
      description: 'Landschafts- und Naturschutzgebiete der Stadt Wuppertal.',
      source: 'Stadt Wuppertal, tiles.cismet.de/landschaftsundnaturschutz' },
    { id: 'boden', kind: 'style', label: 'Gesamtbewertung der Bodenfunktionen',
      styleUrl: 'https://tiles.cismet.de/bodenfunktion/style.json', sourceLayer: 'bodenfunktion',
      description: 'Gesamtbewertung der Bodenfunktionen in Wuppertal.',
      source: 'Stadt Wuppertal, tiles.cismet.de/bodenfunktion' },
  ];

  const byId = id => CATALOG.find(c => c.id === id);
  const selected = ids => (ids ?? []).map(byId).filter(Boolean);

  // ---- Laden (async): externe Styles und WMS-Capabilities
  const loaded = {}; // id -> { style?, infobox?, caps?, error? }

  const stripTags = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const firstSentences = (s, max = 260) => { const t = stripTags(s); if (t.length <= max) return t; const cut = t.slice(0, max); return cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, 80)) || cut; };

  function parseCaps(xml) {
    const first = re => (xml.match(re) ?? [])[1];
    return {
      title: first(/<Service>[\s\S]*?<Title>([^<]*)<\/Title>/),
      abstract: first(/<Service>[\s\S]*?<Abstract>([\s\S]*?)<\/Abstract>/),
      org: first(/<ContactOrganization>([^<]*)<\/ContactOrganization>/),
    };
  }

  // Mapbox-Style: Infobox-Funktion aus den layerInfo.keywords ziehen
  const styleInfobox = style => (style.metadata?.carmaConf?.layerInfo?.keywords ?? [])
    .find(k => /^carmaconf:\/\/infoboxmapping:/i.test(k) && k.includes('function') && !k.includes('\n'))
    ?.replace(/^carmaconf:\/\/infoboxmapping:/i, '');

  async function load(ids) {
    await Promise.all(selected(ids).map(async c => {
      if (loaded[c.id]) return;
      try {
        if (c.kind === 'style') {
          const style = await (await fetch(c.styleUrl)).json();
          loaded[c.id] = { style, infobox: c.infobox ?? styleInfobox(style) };
        } else if (c.capabilities) {
          loaded[c.id] = { caps: parseCaps(await (await fetch(c.capabilities)).text()) };
        }
      } catch (e) { loaded[c.id] = { error: e.message }; }
    }));
    return errors(ids);
  }
  const errors = ids => selected(ids).filter(c => loaded[c.id]?.error).map(c => `${c.label}: ${loaded[c.id].error}`);

  // ---- Style-Bausteine
  const padBounds = ([w, s, e, n]) => {
    const dx = (e - w) * 0.05 || 0.0005, dy = (n - s) * 0.05 || 0.0005;
    return [w - dx, s - dy, e + dx, n + dy].map(v => +v.toFixed(6));
  };

  // -> { sources, layers, byEntry: { id: [layer-ids] } }
  function toStyleParts(ids, bounds) {
    const sources = {}, layers = [], byEntry = {};
    const b = bounds && padBounds(bounds);
    for (const c of selected(ids)) {
      byEntry[c.id] = [];
      if (c.kind === 'wms') {
        sources[`fd-${c.id}`] = { type: 'raster', tileSize: 256, tiles: [c.tiles], ...(b && { bounds: b }), attribution: c.source };
        layers.push({ id: `fd-${c.id}`, type: 'raster', source: `fd-${c.id}`, paint: { 'raster-opacity': c.opacity ?? 1 }, metadata: { fachdaten: c.label } });
        byEntry[c.id].push(`fd-${c.id}`);
      } else if (loaded[c.id]?.style) {
        const st = loaded[c.id].style;
        for (const [k, def] of Object.entries(st.sources)) sources[`fd-${c.id}-${k}`] = { ...def, ...(b && { bounds: b }), attribution: c.source };
        for (const l of st.layers) {
          if (l.type === 'symbol') continue; // Beschriftungen brauchen Sprite/Glyphs des Quell-Styles
          const id = `fd-${c.id}-${l.id}`;
          layers.push({ ...l, id, source: `fd-${c.id}-${l.source}`, metadata: { ...l.metadata, fachdaten: c.label } });
          byEntry[c.id].push(id);
        }
      }
    }
    return { sources, layers, byEntry };
  }

  // Ein Dropdown "Fachdaten" im Layer-Chip (carmaConf.dynamicStyling, Typ list): Alle / je Kartenwerk einzeln / Keine
  function toDynamicStyling(ids, byEntry) {
    const sel = selected(ids).filter(c => byEntry[c.id]?.length);
    if (!sel.length) return [];
    const opt = (id, title, on) => { const o = { id, title }; for (const c of sel) o[`vis_${c.id}`] = on.includes(c) ? 'visible' : 'none'; return o; };
    const options = [
      ...(sel.length > 1 ? [opt('alle', 'Alle Fachdaten', sel)] : []),
      ...sel.map(c => opt(c.id, c.label, [c])),
      opt('keine', 'Keine Fachdaten', []),
    ];
    return [{
      type: 'list', label: 'Fachdaten', default: options[0].id, showIcon: false, options,
      targets: Object.fromEntries(sel.map(c => [`vis_${c.id}`, byEntry[c.id].map(id => `layers.${id}.layout.visibility`)])),
    }];
  }

  // ---- Infobox: eine Zuordnungsfunktion (eine Zeile!) für alle Quellen; Verteilung nach carmaInfo.sourceLayer
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // HTML-Zeilen zu den WMS-Diensten (aus den Capabilities)
  function capabilitiesHtml(ids) {
    return selected(ids).filter(c => c.kind === 'wms').map(c => {
      const k = loaded[c.id]?.caps ?? {};
      const abs = k.abstract ? firstSentences(k.abstract) : c.description;
      return `<b>${esc(c.label)}</b><br/>Dienst: ${esc(k.title ?? c.label)}${k.org ? ` (${esc(k.org)})` : ''}<br/>${esc(abs)}<br/><a href="${c.capabilities.replace(/&/g, '&amp;')}">GetCapabilities</a>`;
    }).join('<br/><br/>');
  }

  function infoboxMapping(ids) {
    const fns = selected(ids).filter(c => c.sourceLayer && loaded[c.id]?.infobox)
      .map(c => `${JSON.stringify(c.sourceLayer)}: ${loaded[c.id].infobox}`);
    const capsHtml = capabilitiesHtml(ids);
    const adhoc = `var t = (p.info_text || '').split('\\n').join('<br/>'); return { title: p.info_title, additionalInfo: '<html>' + t + ${JSON.stringify(capsHtml ? '<br/><br/>' + capsHtml : '')} + '</html>' };`;
    const code = `function createInfoBoxInfo(p){ var M = { ${fns.join(', ')} }; var sl = p.carmaInfo && p.carmaInfo.sourceLayer; if (sl && M[sl]) { return M[sl](p); } ${adhoc} }`;
    return code.replace(/\s*\n\s*/g, ' ');
  }

  const describe = ids => selected(ids).map(c => `${c.label}: ${c.description} (Quelle: ${c.source})`);
  const links = ids => selected(ids).flatMap(c => [c.styleUrl && { url: c.styleUrl, text: `${c.label} (Style)` }, c.capabilities && { url: c.capabilities, text: `${c.label} (GetCapabilities)` }].filter(Boolean));

  return { CATALOG, load, errors, toStyleParts, toDynamicStyling, infoboxMapping, describe, links };
})();
