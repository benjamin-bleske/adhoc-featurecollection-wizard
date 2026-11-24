// Veröffentlicht den Style (inkl. FeatureCollection) per GitHub Contents API ins Repo.
// Feste Zielpfad-Datei -> jede neue Veröffentlichung überschreibt die vorherige.
const Publish = (() => {
  const CFG = { owner: 'benjamin-bleske', repo: 'adhoc-featurecollection-wizard', branch: 'main', path: 'published/style.json' };
  const api = `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.path}`;
  const rawUrl = `https://raw.githubusercontent.com/${CFG.owner}/${CFG.repo}/${CFG.branch}/${CFG.path}`;

  const b64 = s => { const b = new TextEncoder().encode(s); let t = ''; b.forEach(c => t += String.fromCharCode(c)); return btoa(t); };

  // MapLibre-Style, wie ihn das Geoportal per Drop erwartet (URL auf .json):
  // FeatureCollection inline als geojson-Source + Fill/Line-Layer + carmaConf-Metadaten.
  function buildStyle(fc) {
    const title = 'Adhoc-Projektbereich';
    return {
      version: 8, name: title,
      metadata: { carmaConf: { instant: true, layerInfo: { title, description: 'Ad-hoc FeatureCollection aus dem Wizard', keywords: ['adhoc'] } } },
      sources: { adhoc: { type: 'geojson', data: fc } },
      layers: [
        { id: 'adhoc-fill', type: 'fill', source: 'adhoc', paint: { 'fill-color': '#e8590c', 'fill-opacity': 0.35 } },
        { id: 'adhoc-line', type: 'line', source: 'adhoc', paint: { 'line-color': '#e8590c', 'line-width': 2 } },
      ],
    };
  }

  async function publish(json, token) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    // vorhandene Datei -> sha nötig zum Überschreiben
    const cur = await fetch(`${api}?ref=${CFG.branch}`, { headers, cache: 'no-store' });
    if (cur.status !== 404 && !cur.ok) throw new Error(`GitHub HTTP ${cur.status}`);
    const sha = cur.ok ? (await cur.json()).sha : undefined;
    const res = await fetch(api, {
      method: 'PUT', headers,
      body: JSON.stringify({
        message: `Publish FeatureCollection ${new Date().toISOString()}`,
        content: b64(json), branch: CFG.branch, ...(sha && { sha }),
      }),
    });
    if (!res.ok) throw new Error(`GitHub HTTP ${res.status}: ${(await res.json().catch(() => ({}))).message ?? ''}`);
    return { replaced: !!sha, url: rawUrl };
  }

  return { publish, buildStyle, rawUrl, CFG };
})();
