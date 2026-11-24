// Datenblatt zu den TwinFlows als eigenständige HTML-Seite (wird bei jedem Publishen neu erzeugt und per GitHub Pages ausgeliefert).
// Aufruf aus der Infobox eines TwinFlow-Punktes (Info-Symbol "Datenblatt", genericLinks).
// Inhalt: Projektbereich, Tabelle aller TwinFlows (Lage, Koordinaten) und je TwinFlow das Ressort mit zuständigen Stellen,
// Beitrag zum Planungsprozess und Datenangebot (Open-Data-Portal NRW).
// Die eigentliche carma-Variante (React-Komponente "twinFlowSIM") liegt als Entwurf in docs/carma-datenblatt/.
const Datenblatt = (() => {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const slug = name => name.toLowerCase().replace(/\s+/g, '-');
  const deg = v => v.toFixed(6);

  // points: Features (Point) mit properties { name, lage, ... }; projekt: { id, zeilen: [..] }
  function build(points, projekt) {
    const rows = points.map(f => {
      const r = Ressorts.byTwinflow(f.properties.name);
      const [lon, lat] = f.geometry.coordinates;
      return { f, r, lon, lat };
    });
    const geoportal = (lat, lon) => `https://digital-twin-wuppertal-live.github.io/geoportal/#/?lat=${deg(lat)}&lng=${deg(lon)}&zoom=20`;
    const osm = (lat, lon) => `https://www.openstreetmap.org/?mlat=${deg(lat)}&mlon=${deg(lon)}#map=19/${deg(lat)}/${deg(lon)}`;

    const table = rows.map(({ f, r, lon, lat }) => `
      <tr><td><span class="dot" style="background:${esc(r.farbe)}"></span><a href="#${slug(f.properties.name)}">${esc(f.properties.name)}</a></td>
      <td>Ressort ${esc(r.id)}<br><small>${esc(r.name)}</small></td><td>${esc(r.regel)}</td>
      <td class="num">${deg(lat)}, ${deg(lon)}</td>
      <td><a href="${geoportal(lat, lon)}">Geoportal</a> · <a href="${osm(lat, lon)}">OSM</a></td></tr>`).join('');

    const sections = rows.map(({ f, r, lon, lat }) => `
      <section id="${slug(f.properties.name)}">
        <h2><span class="dot" style="background:${esc(r.farbe)}"></span>${esc(f.properties.name)}: Ressort ${esc(r.id)} ${esc(r.name)}</h2>
        <p class="meta">Lage: ${esc(r.regel)} · ${deg(lat)}, ${deg(lon)} (WGS84)</p>
        <h3>Zuständige Stellen</h3>
        <ul>${r.stellen.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <h3>Beitrag zum Planungsprozess</h3>
        <ul>${r.beitraege.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <h3>Datenangebot (${r.daten.length})</h3>
        <table class="daten"><thead><tr><th>Datensatz</th><th>Herausgeber</th><th>Formate</th><th>Lizenz</th></tr></thead><tbody>${r.daten.map(d => `
          <tr><td><a href="${esc(Ressorts.ckan(d.slug))}">${esc(d.titel)}</a>${d.hinweis ? `<br><small>${esc(d.hinweis)}</small>` : ''}</td>
          <td>${esc(d.herausgeber)}</td><td>${esc((d.formate || []).join(', '))}</td><td>${esc(d.lizenz)}</td></tr>`).join('')}</tbody></table>
      </section>`).join('');

    return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Datenblatt TwinFlow</title>
<style>
:root{--bg:#f6f7f9;--fg:#1d2330;--muted:#5d667a;--card:#fff;--line:#d9dde5;--accent:#0b6bcb}
@media (prefers-color-scheme:dark){:root{--bg:#14171d;--fg:#e8ebf1;--muted:#9aa3b5;--card:#1d222b;--line:#2c3240;--accent:#4c9aff}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:18px 16px 40px}
h1{font-size:22px;margin:.2em 0}h2{font-size:18px;margin:0 0 4px}h3{font-size:14px;margin:14px 0 4px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
a{color:var(--accent)}section,.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:14px 0}
table{border-collapse:collapse;width:100%}th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid var(--line);font-size:14px}
th{color:var(--muted);font-weight:600}.num{font-variant-numeric:tabular-nums;white-space:nowrap}.meta,small{color:var(--muted)}
.dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:7px;vertical-align:-1px}
ul{margin:4px 0;padding-left:20px}footer{color:var(--muted);font-size:13px;margin-top:20px}
@media print{body{background:#fff;color:#000}section,.card{break-inside:avoid}}
</style></head><body><main>
<h1>Datenblatt: TwinFlows</h1>
<p class="meta">Planungsphase 1: Ready2hack · Projektbereich ${esc(projekt.id)}</p>
<div class="card"><b>Projektbereich</b><br>${(projekt.zeilen || []).map(esc).join('<br>')}</div>
<div class="card"><b>TwinFlows im Geltungsbereich</b>
<p class="meta">Die Lage folgt festen Abstandsregeln relativ zur Ausdehnung (umschließendes Rechteck) des Geltungsbereichs „Planungsphase 1: Ready2Use“.</p>
<div style="overflow:auto"><table><thead><tr><th>TwinFlow</th><th>Ressort</th><th>Abstandsregel</th><th>Koordinaten (Breite, Länge)</th><th>Karte</th></tr></thead><tbody>${table}</tbody></table></div></div>
${sections}
<footer>Datenangebot: Open-Data-Portal NRW (Organisation Wuppertal), Stand ${esc(Ressorts.STAND)}. Die Texte zum Beitrag der Ressorts fassen zusammen, was Datensätze und Leistungen der genannten Stellen für einen Planungsprozess hergeben; sie sind keine amtliche Aufgabenbeschreibung.
Die Zuordnung „TwinFlow NNN gehört zum Ressort NNN“ ist eine Annahme. Erzeugt von Adhoc-FeatureCollection-Wizard.</footer>
</main></body></html>`;
  }

  return { build, slug };
})();
