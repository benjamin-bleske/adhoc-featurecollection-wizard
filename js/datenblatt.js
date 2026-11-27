// Datenblatt zu den TwinFlows als eigenständige HTML-Seite (wird bei jedem Publishen neu erzeugt und per GitHub Pages ausgeliefert).
// Aufruf aus der Infobox eines TwinFlow-Punktes (Info-Symbol "Datenblatt", genericLinks).
// Aufbau und Optik folgen den Datenblättern des Geoportals (Kopfzeile "Datenblatt: …", blauer Kennwert-Kasten mit Tabelle,
// Umschalter, grüne/gelbe/graue Panels, Ganglinie, Fußzeile mit "Ok").
// Je TwinFlow: Ressort, zuständige Stellen, Beispiel-Stellungnahme (simuliert), Datenangebot und simulierte Diskussion;
// bei 104 eine Illustration (Schlagloch), bei 106 die Ganglinie eines Pegels des Wupperverbands (echte Messwerte, js/sensordaten.js).
// Die eigentliche carma-Variante (React-Komponente "twinFlowSIM") liegt als Entwurf in docs/carma-datenblatt/.
const Datenblatt = (() => {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const slug = name => name.toLowerCase().replace(/\s+/g, '-');
  const deg = v => v.toFixed(6);
  const de = (n, d = 1) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtTime = (iso, o) => new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', ...o });

  // Ganglinie als SVG (Stil wie im Geoportal: dunkelblaue Linie, graue Gitterlinien, Datum/Uhrzeit auf der x-Achse)
  function chartSvg() {
    const R = Sensordaten.REIHE.map(([t, v]) => [new Date(t).getTime(), v]);
    const W = 740, H = 300, L = 52, Rr = 16, T = 14, B = 44;
    const t0 = R[0][0], t1 = R.at(-1)[0];
    const vmin = Math.floor(Math.min(...R.map(p => p[1])) / 10) * 10, vmax = Math.ceil(Math.max(...R.map(p => p[1])) / 10) * 10;
    const X = t => L + (t - t0) / (t1 - t0) * (W - L - Rr), Y = v => T + (1 - (v - vmin) / (vmax - vmin)) * (H - T - B);
    const grid = []; for (let v = vmin; v <= vmax; v += 10) grid.push(`<line x1="${L}" x2="${W - Rr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#e3e3e3"/><text x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`);
    const ticks = []; for (let t = t0 + 2 * 3600e3; t <= t1; t += 24 * 3600e3) ticks.push(`<text x="${X(t).toFixed(1)}" y="${H - 22}" text-anchor="middle">${esc(fmtTime(new Date(t), { day: '2-digit', month: '2-digit' }) + ', ' + fmtTime(new Date(t), { hour: '2-digit', minute: '2-digit' }))}</text>`);
    const line = R.map(([t, v], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    const peak = R.reduce((a, b) => b[1] > a[1] ? b : a), base = [...R.filter(p => p[0] < peak[0]).map(p => p[1])].sort((a, b) => a - b);
    const med = base[Math.floor(base.length / 2)];
    const px = X(peak[0]), py = Y(peak[1]), right = px > W - 180;
    return { svg: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ganglinie Wasserstand" style="width:100%;height:auto;font:12px Helvetica,Arial,sans-serif;fill:#666">
      ${grid.join('')}<path d="${line}" fill="none" stroke="#1b1b73" stroke-width="1.6"/>${ticks.join('')}
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="#d9381e"/>
      <text x="${(px + (right ? -10 : 10)).toFixed(1)}" y="${(py + 4).toFixed(1)}" text-anchor="${right ? 'end' : 'start'}" fill="#d9381e" font-weight="700">Spitze ${de(peak[1])} cm · ${esc(fmtTime(new Date(peak[0]), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))}</text></svg>`,
      peak, med, von: fmtTime(new Date(t0), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), bis: fmtTime(new Date(t1), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) };
  }

  // points: Features (Point) mit properties { name, lage, verschoben_m }; projekt: { id, zeilen: [..], namen: [..] }
  function build(points, projekt) {
    const liste = Ressorts.fuer(projekt.namen);
    const rows = points.map(f => ({ f, r: liste.find(r => r.twinflow === f.properties.name), lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }));
    const geoportal = (lat, lon) => `https://digital-twin-wuppertal-live.github.io/geoportal/#/?lat=${deg(lat)}&lng=${deg(lon)}&zoom=20`;
    const osm = (lat, lon) => `https://www.openstreetmap.org/?mlat=${deg(lat)}&mlon=${deg(lon)}#map=19/${deg(lat)}/${deg(lon)}`;
    const chart = chartSvg();
    const switcher = cur => `<div class="ctl"><span class="lbl">TwinFlow:</span><span class="seg">${rows.map(({ f }) => `<a href="#${slug(f.properties.name)}"${f.properties.name === cur ? ' class="on"' : ''}>${esc(f.properties.name.replace('TwinFlow ', ''))}</a>`).join('')}</span>
      <span class="hint">Ressort-Datenblatt umschalten</span></div>`;

    const sections = rows.map(({ f, r, lon, lat }) => {
      const p = f.properties, name = p.name, moved = p.verschoben_m > 0;
      const st = r.stellungnahme;
      const thread = [{ von: r.id, text: r.auftakt }, ...r.diskussion].map(d => { const o = Ressorts.LISTE.find(x => x.id === d.von); return `<div class="msg"><span class="dot" style="background:${esc(o.farbe)}"></span><b>Ressort ${esc(o.id)} ${esc(o.name)}</b><div>${esc(d.text)}</div></div>`; }).join('');
      return `
      <section class="tf" id="${slug(name)}" hidden>
        <div class="top">
          <div class="kpi"><div class="kh">Ressort ${esc(r.id)}</div><div class="kb"><div class="big">${esc(name)}</div><div class="sub">${esc(r.name)}</div></div>
            <div class="stand">Datenstand: ${esc(Ressorts.STAND)} <span class="tag">SIMULIERT</span></div></div>
          <table class="kv"><tbody>
            <tr><td>Zuständige Stellen</td><td>${r.stellen.map(esc).join('<br>')}</td></tr>
            <tr><td>Abstandsregel</td><td>${esc(r.regel)}</td></tr>
            ${moved ? `<tr><td>Lage</td><td>auf die nächstgelegene Stelle innerhalb des Geltungsbereichs verschoben (ca. ${de(p.verschoben_m, 0)} m)</td></tr>` : ''}
            <tr><td>Koordinaten</td><td class="num">${deg(lat)}, ${deg(lon)}<br><a href="${geoportal(lat, lon)}">Geoportal</a> · <a href="${osm(lat, lon)}">OSM</a></td></tr>
            <tr><td>Projektbereich</td><td>${esc(projekt.id)}<br><small>${(projekt.zeilen || []).slice(0, 3).map(esc).join(' · ')}</small></td></tr>
            <tr><td>Datenangebot</td><td>${r.daten.length} Datensätze</td></tr>
          </tbody></table>
        </div>
        ${switcher(name)}
        <div class="panel green"><div class="ph">Stellungnahme (Beispiel, simuliert): ${esc(st.titel)}</div><div class="pb">
          <p>${esc(st.text)}</p><ul>${st.hinweise.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
          <p class="note">Generische Beispiel-Stellungnahme, die zu jeder Bebauung passen soll. Keine Aussage des Ressorts.</p></div></div>
        ${r.bild ? `<div class="panel green"><div class="ph">Bestandsaufnahme Fahrbahn (Illustration)</div><div class="pb"><img src="${esc(r.bild)}" alt="Schlagloch (Illustration)" style="width:100%;border-radius:3px"><p class="note">${esc(r.bild_hinweis)}</p></div></div>` : ''}
        ${r.grafik === 'sensor' ? `<div class="panel green"><div class="ph">Ganglinie: Wasserstand (cm)</div><div class="pb">${chart.svg}
          <p class="note">${esc(Sensordaten.META.name)} (Wupperverband, ${esc(Sensordaten.META.sensor)}), Stundenmittel ${esc(chart.von)} bis ${esc(chart.bis)}. Normalstand um ${de(chart.med)} cm, Spitze ${de(chart.peak[1])} cm: Anstieg um etwa ${de(chart.peak[1] - chart.med, 0)} cm binnen weniger Stunden.
          Seit 27.08.2026 liefert der Server des Wupperverbands für diese Messreihe keine neuen Werte. Echte Messwerte, Quelle: <a href="${esc(Sensordaten.META.api)}">FROST-API des Wupperverbands</a>, Datastream ${Sensordaten.META.datastream}.</p></div></div>` : ''}
        <div class="panel yellow"><div class="ph">Datenangebot (${r.daten.length})</div><div class="pb"><table class="daten"><thead><tr><th>Datensatz</th><th>Herausgeber</th><th>Formate</th><th>Lizenz</th></tr></thead><tbody>${r.daten.map(d => `
          <tr><td><a href="${esc(Ressorts.ckan(d.slug))}">${esc(d.titel)}</a>${d.hinweis ? `<br><small>${esc(d.hinweis)}</small>` : ''}</td><td>${esc(d.herausgeber)}</td><td>${esc((d.formate || []).join(', '))}</td><td>${esc(d.lizenz)}</td></tr>`).join('')}</tbody></table>
          <p class="note">Beitrag zum Planungsprozess: ${r.beitraege.map(esc).join(' · ')}</p></div></div>
        <div class="panel grey"><div class="ph">Diskussion (simuliert)</div><div class="pb">
          ${thread}</div></div>
      </section>`;
    }).join('');

    return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Datenblatt TwinFlow</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#ececec;color:#333;font:14px/1.42857 "Helvetica Neue",Helvetica,Arial,sans-serif}
.modal{max-width:860px;margin:18px auto;background:#fff;border-radius:6px;box-shadow:0 4px 24px rgba(0,0,0,.25);overflow:hidden}
.mh{padding:14px 18px;border-bottom:1px solid #dcdcdc;font-size:24px;font-weight:500}.mh .i{display:inline-block;width:22px;height:22px;border-radius:50%;background:#222;color:#fff;font:700 15px/22px Georgia,serif;text-align:center;vertical-align:3px;margin-right:6px}
.mb{padding:16px 18px}.mf{padding:12px 18px;border-top:1px solid #dcdcdc;display:flex;align-items:center;gap:14px;font-size:12px}.mf .sp{flex:1}.mf b{font-weight:700}
.btn{background:#1f6bff;color:#fff;border:0;border-radius:4px;padding:7px 18px;font-size:15px;cursor:pointer}
.top{display:flex;gap:26px;flex-wrap:wrap}.kpi{width:330px;max-width:100%}.kh{background:#1f78d1;color:#fff;text-align:center;font-weight:700;padding:3px 6px}
.kb{background:#b7dbf7;text-align:center;padding:14px 8px 12px}.big{font-size:30px;font-weight:700;color:#222;line-height:1.1}.sub{color:#555;margin-top:2px}.stand{font-size:12px;margin-top:6px}
.tag{background:#9e9e9e;color:#fff;font-size:9px;font-weight:700;padding:0 4px;border-radius:2px;margin-left:4px;vertical-align:1px}
.kv{flex:1;min-width:260px;border-collapse:collapse}.kv td{padding:5px 8px;border-bottom:1px solid #e6e6e6;vertical-align:top}.kv td:first-child{color:#666;white-space:nowrap}.kv td:last-child{text-align:right}
.num{font-variant-numeric:tabular-nums}small,.note,.hint{color:#777}.note{font-size:12.5px;margin:8px 0 0}
.ctl{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:18px 0 12px}.lbl{color:#444}.seg{display:inline-flex;border:1px solid #bbb;border-radius:4px;overflow:hidden}
.seg a{padding:3px 11px;color:#333;text-decoration:none;border-left:1px solid #bbb;background:#fff}.seg a:first-child{border-left:0}.seg a.on{background:#1f6bff;color:#fff}
.panel{border:1px solid #d6d6d6;border-radius:4px;margin:14px 0;overflow:hidden}.ph{padding:9px 14px;font-size:16px;border-bottom:1px solid #d6d6d6}.pb{padding:12px 14px;background:#fff}
.green .ph{background:#d8ecd5;color:#2f6b2f}.yellow .ph{background:#fcf3dc;color:#7a5a1f}.grey .ph{background:#f2f2f2;color:#333}
.pb p{margin:0 0 8px}.pb ul{margin:4px 0 8px;padding-left:20px}a{color:#1f6bff}
.daten{width:100%;border-collapse:collapse}.daten th,.daten td{text-align:left;vertical-align:top;padding:5px 6px;border-bottom:1px solid #eee;font-size:13px}.daten th{color:#666}
.msg{padding:6px 0;border-bottom:1px solid #e8e8e8}.msg:last-child{border:0}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}.msg div{margin:2px 0 0 16px}
@media print{body{background:#fff}.modal{box-shadow:none;margin:0}section.tf[hidden]{display:block}.btn,.ctl{display:none}}
</style></head><body><div class="modal">
<div class="mh"><span class="i">i</span>Datenblatt: TwinFlows</div>
<div class="mb">${sections}</div>
<div class="mf"><div class="sp"><b>Adhoc-FeatureCollection-Wizard</b> · Planungsphase 1: Ready2hack · Projektbereich ${esc(projekt.id)}<br>
Datenangebot: <a href="https://ckan.open.nrw.de/organization/wuppertal">Open-Data-Portal NRW</a>, Stand ${esc(Ressorts.STAND)}. Stellungnahmen, Diskussionen und die Schlagloch-Illustration sind simuliert; die Ganglinie zeigt echte Messwerte des Wupperverbands.<br>
Zuordnung „TwinFlow NNN gehört zum Ressort NNN“ ist eine Annahme.</div><button class="btn" onclick="window.close();history.length>1&&history.back()">Ok</button></div>
</div>
<script>(function(){var s=[].slice.call(document.querySelectorAll('section.tf'));function show(){var id=(location.hash||'').slice(1);if(!s.some(function(x){return x.id===id}))id=s[0].id;s.forEach(function(x){x.hidden=x.id!==id});}addEventListener('hashchange',show);show();})();</script>
</body></html>`;
  }

  return { build, slug };
})();
