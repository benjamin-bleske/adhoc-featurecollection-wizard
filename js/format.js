// Textformat für Infobox (Wizard und Geoportal): Gemarkung / Flur / Flurstücke / Größe
const Format = (() => {
  const fmt = n => n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const num = x => parseInt(x, 10) || 0;
  const und = l => l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} und ${l.at(-1)}`;
  // "ca." mit Rundung: ab 1.000 m² auf 100 m², darunter auf 10 m²
  const ca = m2 => `ca. ${fmt(m2 >= 1000 ? Math.round(m2 / 100) * 100 : Math.round(m2 / 10) * 10)} m²`;

  // Gruppen je Gemarkung + Flur, sortiert; ps = Properties der Flurstücke
  function groups(parcels) {
    const m = new Map();
    for (const f of parcels) {
      const p = f.properties ?? f, key = `${p.gemarkung}|${p.flur}`;
      (m.get(key) ?? m.set(key, { gem: p.gemarkung, flur: p.flur, ps: [] }).get(key)).ps.push(p);
    }
    const out = [...m.values()].sort((x, y) => x.gem.localeCompare(y.gem) || num(x.flur) - num(y.flur));
    for (const g of out) {
      g.ps.sort((x, y) => num(x.flurstuecksnummer) - num(y.flurstuecksnummer));
      g.sum = g.ps.reduce((t, p) => t + p.flaeche_m2, 0);
      g.parcelsText = `${g.ps.length > 1 ? 'Flurstücke' : 'Flurstück'} ${und(g.ps.map(p => p.flurstuecksnummer))}`;
    }
    return out;
  }

  return { fmt, ca, und, groups };
})();
