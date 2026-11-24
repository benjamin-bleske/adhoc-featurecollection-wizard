// Wizard-Gerüst. Neue Fragen = neues Step-Objekt {id,title,mount,isValid,toFeatures} in STEPS vor ResultStep.
const STEPS = [AreaStep, FachdatenStep, ResultStep];
const state = {};
let idx = 0;

const root = document.getElementById('step-root');
const back = document.getElementById('btn-back');
const next = document.getElementById('btn-next');
const statusEl = document.getElementById('status');

const api = {
  status: msg => { statusEl.textContent = msg; },
  changed: () => updateNav(),
  buildFeatureCollection: () => ({
    type: 'FeatureCollection',
    features: STEPS.flatMap(s => s.toFeatures(state)),
    fachdaten: state.fachdaten ?? [],
  }),
};

function updateNav() {
  back.disabled = idx === 0;
  next.hidden = idx === STEPS.length - 1;
  next.disabled = !STEPS[idx].isValid(state);
  [...document.querySelectorAll('#stepper li')].forEach((li, i) => {
    li.className = i === idx ? 'active' : i < idx ? 'done' : '';
  });
}

function show(i) {
  idx = i;
  document.getElementById('stepper').innerHTML = STEPS.map((s, n) => `<li>${n + 1}. ${s.title}</li>`).join('');
  api.status('');
  STEPS[idx].mount(root, state, api);
  updateNav();
}

back.onclick = () => idx > 0 && show(idx - 1);
next.onclick = () => STEPS[idx].isValid(state) && show(idx + 1);
show(0);
