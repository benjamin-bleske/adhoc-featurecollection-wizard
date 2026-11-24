// Veröffentlicht die FeatureCollection per GitHub Contents API ins Repo.
// Feste Zielpfad-Datei -> jede neue Veröffentlichung überschreibt die vorherige.
const Publish = (() => {
  const CFG = { owner: 'benjamin-bleske', repo: 'adhoc-featurecollection-wizard', branch: 'main', path: 'published/featurecollection.geojson' };
  const api = `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.path}`;
  const rawUrl = `https://raw.githubusercontent.com/${CFG.owner}/${CFG.repo}/${CFG.branch}/${CFG.path}`;

  const b64 = s => { const b = new TextEncoder().encode(s); let t = ''; b.forEach(c => t += String.fromCharCode(c)); return btoa(t); };

  async function publish(json, token) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    // vorhandene Datei -> sha nötig zum Überschreiben
    const cur = await fetch(`${api}?ref=${CFG.branch}`, { headers });
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

  return { publish, rawUrl, CFG };
})();
