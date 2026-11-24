// Frage 2: Fachdaten als Kartenebenen im Projektbereich
const FachdatenStep = (() => {
  function mount(root, state, api) {
    state.fachdaten ??= [];
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'result-step';
    wrap.innerHTML = '<h2>2. Fachdaten</h2><p class="hint">Welche Fachdaten sollen im Projektbereich als Kartenebene hinterlegt werden? Sie werden im Style des Projektbereichs mit veröffentlicht und nur im Rechteck um den Projektbereich geladen.</p>';
    for (const c of Fachdaten.CATALOG) {
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
    root.append(wrap);
  }
  return { id: 'fachdaten', title: 'Fachdaten', mount, isValid: () => true, toFeatures: () => [] };
})();
