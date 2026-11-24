// Frage 2: Fachdaten als Kartenebenen im Projektbereich
const FachdatenStep = (() => {
  function mount(root, state, api) {
    state.fachdaten ??= [];
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'result-step';
    wrap.innerHTML = '<h2>2. Fachdaten</h2><p class="hint">Welche Fachdaten sollen im Projektbereich als Kartenebene hinterlegt werden? Daraus entstehen die Styles „Planungsphase 0: Planungsrecht“ und „Planungsphase 0: Fachkonzepte“; dazu kommen „Planungsphase 1: Ready2Use“ und „Planungsphase 1: Ready2hack“. Alle beziehen sich auf denselben Projektbereich; die Fachdaten werden in einem (nicht eingezeichneten) Quadrat geladen, das mittig um den Projektbereich liegt und 3× so groß ist.</p>';
    for (const [gid, g] of Object.entries(Fachdaten.GROUPS)) {
      const h = document.createElement('h3');
      h.textContent = g.title;
      wrap.append(h);
      for (const c of Fachdaten.CATALOG.filter(x => x.group === gid)) {
      const label = document.createElement('label');
      label.className = 'fd-item';
      const cb = Object.assign(document.createElement('input'), { type: 'checkbox', checked: state.fachdaten.includes(c.id) });
      cb.onchange = () => { state.fachdaten = Fachdaten.CATALOG.map(x => x.id).filter(id => id === c.id ? cb.checked : state.fachdaten.includes(id)); api.changed(); };
      const txt = document.createElement('span');
      txt.innerHTML = `<b></b><br><small></small>`;
      txt.querySelector('b').textContent = c.label;
      txt.querySelector('small').textContent = `${c.description} Quelle: ${c.source}`;
      label.append(cb, txt);
      wrap.append(label);
      }
    }
    root.append(wrap);
  }
  return { id: 'fachdaten', title: 'Fachdaten', mount, isValid: () => true, toFeatures: () => [] };
})();
