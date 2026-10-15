import { study, at as atFn, sgn } from './study.js';
import { $, $$, esc } from './util.js';
import { initShell } from './shell.js';

initShell();

(async function () {
  const data = await study();
  const T = data.temperatures, M = data.metrics;
  const by = k => M.find(m => m.key === k);

  const range = $('#t-range'), tval = $('#t-val'), badge = $('#t-badge');
  const sel = $('#metric-sel'), note = $('#chart-note');
  let temp = 100;

  const at = (m, t) => atFn(m, T, t);
  const isCase = t => T.includes(t);

  /* ---- case buttons + selector ---- */
  $('#case-btns').innerHTML = T.map(t => `<button class="chip-btn" type="button" data-t="${t}" aria-pressed="false">${t} °C</button>`).join('');
  sel.innerHTML = M.map(m => `<option value="${m.key}">${esc(m.label)} (${esc(m.unit)})</option>`).join('');
  sel.value = 'cooler';

  /* ---- table ---- */
  function drawTable() {
    const head = `<thead><tr><th scope="col">Quantity</th>${T.map(t => `<th scope="col" data-t="${t}">${t} °C</th>`).join('')}<th scope="col" id="sel-th"></th><th scope="col">Change 60→140 °C</th></tr></thead>`;
    const rows = M.map(m => {
      const a = m.values[0], b = m.values[m.values.length - 1];
      const pct = a !== 0 ? ((b - a) / Math.abs(a)) * 100 : 0;
      const pctTxt = Math.abs(pct) < 0.001 ? '< 0.001 %' : (pct > 0 ? '+' : '−') + Math.abs(pct).toFixed(1) + ' %';
      return `<tr data-k="${m.key}"><th scope="row">${esc(m.label)} <span class="muted">(${esc(m.unit)})</span></th>` +
        m.values.map((v, i) => `<td data-t="${T[i]}">${sgn(m, v)}</td>`).join('') +
        `<td class="sel-cell"></td><td>${pctTxt}</td></tr>`;
    }).join('');
    $('#tbl').innerHTML = head + `<tbody>${rows}</tbody>`;
  }

  /* ---- readout + highlight ---- */
  function update() {
    tval.textContent = temp;
    const exact = isCase(temp);
    badge.textContent = exact ? 'Simulated case' : 'Interpolated, not simulated';
    badge.classList.toggle('sim', exact);
    range.value = temp;
    $$('#case-btns button').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.t) === temp)));
    $('#sim-readout').innerHTML = M.map(m =>
      `<div><dt>${esc(m.label)}</dt><dd><b>${sgn(m, at(m, temp))}</b> ${esc(m.unit)}</dd></div>`).join('');
    $('#sel-th').textContent = `At ${temp} °C${exact ? '' : ' (interp.)'}`;
    $$('#tbl .sel-cell').forEach((td, i) => (td.textContent = sgn(M[i], at(M[i], temp))));
    $$('#tbl [data-t]').forEach(c => c.classList.toggle('hl', Number(c.dataset.t) === temp));
    drawChart();
  }

  /* ---- chart ---- */
  let chart = null;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function drawChart() {
    if (typeof Chart === 'undefined') { note.textContent = 'The chart library could not be loaded. The table below has all the numbers.'; return; }
    const m = by(sel.value);
    const mean = m.values.reduce((a, b) => a + b, 0) / m.values.length;
    const spread = (Math.max(...m.values) - Math.min(...m.values)) / (Math.abs(mean) || 1);
    const flat = spread < 1e-3;
    const ax = flat ? { min: mean - Math.abs(mean) * 0.05, max: mean + Math.abs(mean) * 0.05 } : {};
    note.textContent = flat
      ? `This quantity varies by less than 0.1% across the cases, so the differences are numerical noise, not a trend. The axis spans ±5% of the value to show that honestly.`
      : `Dots are the five simulated cases. The amber marker is your selected temperature${isCase(temp) ? '' : ' (interpolated)'}.`;
    const ink = css('--ink'), muted = css('--muted'), line = css('--line'), accent = css('--accent');
    chart?.destroy();
    chart = new Chart($('#chart'), {
      type: 'scatter',
      data: { datasets: [
        { label: m.label, data: T.map((t, i) => ({ x: t, y: m.values[i] })), showLine: true, borderColor: ink, backgroundColor: ink, pointRadius: 5, tension: 0 },
        { label: 'Selected', data: [{ x: temp, y: at(m, temp) }], borderColor: accent, backgroundColor: accent, pointRadius: 9, pointStyle: 'rectRot' }
      ] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.y.toFixed(m.decimals)} ${m.unit} at ${c.parsed.x} °C` } } },
        scales: {
          x: { min: 55, max: 145, title: { display: true, text: 'Reactor outlet temperature (°C)', color: muted }, ticks: { color: muted, stepSize: 20 }, grid: { color: line } },
          y: { ...ax, title: { display: true, text: `${m.label} (${m.unit})`, color: muted }, ticks: { color: muted, callback: v => Number(v).toFixed(m.decimals > 3 ? 4 : m.decimals) }, grid: { color: line } }
        }
      }
    });
    $('#chart').setAttribute('aria-label', `${m.label} against reactor outlet temperature. ${T.map((t, i) => `${t} degrees: ${m.values[i].toFixed(m.decimals)}`).join('; ')} ${m.unit}.`);
  }
  new MutationObserver(drawChart).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---- events ---- */
  range.addEventListener('input', () => { temp = Number(range.value); update(); });
  $('#case-btns').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { temp = Number(b.dataset.t); update(); } });
  sel.addEventListener('change', drawChart);

  /* ---- stoichiometric yield check ---- */
  const eIn = $('#c-eth'), iIn = $('#c-iso');
  function calc() {
    const E = Math.max(0, Number(eIn.value) || 0), I = Math.max(0, Number(iIn.value) || 0);
    const fromE = E / 2, fromI = I, max = Math.min(fromE, fromI);
    const limiting = fromE < fromI ? 'Ethylene' : fromE > fromI ? 'Isobutane' : 'Neither (stoichiometric feed)';
    let html = `<div><dt>Limiting reactant</dt><dd><b>${limiting}</b></dd></div><div><dt>Stoichiometric maximum n-octane</dt><dd><b>${max.toFixed(2)}</b> kmol/h</dd></div>`;
    if (E === 100 && I === 50) {
      const o = by('octane').values[T.indexOf(100)];
      html += `<div><dt>Simulated n-octane (Aspen, 100 °C)</dt><dd><b>${o.toFixed(2)}</b> kmol/h</dd></div><div><dt>Simulated as share of maximum</dt><dd><b>${(o / max * 100).toFixed(2)}</b> %</dd></div>`;
    }
    $('#c-out').innerHTML = html;
  }
  eIn.addEventListener('input', calc); iIn.addEventListener('input', calc); calc();

  /* ---- flowsheet ---- */
  const i100 = T.indexOf(100);
  const v = (k, i = i100, unit = true) => { const m = by(k); return `${sgn(m, m.values[i])}${unit ? ' ' + m.unit : ''}`; };
  const EQ = {
    mixer: ['Mixer M-101', 'Combines fresh ethylene (100 kmol/h) and fresh isobutane (50 kmol/h) with the recycle stream before the feed is heated.'],
    heater: ['Heater', `Raises the mixed feed to reaction conditions. Duty is about ${v('heater')} in every case. It sits upstream of the reactor, so changing the reactor outlet temperature does not change it.`],
    reactor: ['Reactor R-101 (RStoic)', 'Runs the simplified reaction 2 C₂H₄ + C₄H₁₀ → C₈H₁₈ at 10 bar with a specified 80% ethylene conversion. The outlet temperature is the variable studied (60–140 °C). Because conversion is specified, not calculated from kinetics, the study cannot say how temperature affects the real reaction.'],
    cooler: ['Cooler', `Cools the reactor effluent to flash conditions. This is where the outlet temperature shows up: a hotter outlet means more heat to remove. Duty goes from ${v('cooler', 0)} at 60 °C to ${v('cooler', T.length - 1)} at 140 °C. Negative means heat removed.`],
    flash: ['Flash separator V-101 (FLASH2)', `Splits the cooled stream into vapour and liquid at 20 °C and 10 bar. Vapour is about ${v('vapor')} and liquid about ${v('liquid')}, almost unchanged across the cases.`],
    column: ['Distillation column T-101 (RadFrac)', `15 stages with the feed on stage 3. Reboiler duty is about ${v('reboiler')} and condenser duty about ${v('condenser')}. n-Octane leaves at about ${v('octane')} with a mole purity of ${v('purity', i100, false)}.`],
    splitter: ['Splitter S-101', 'Divides the light overhead stream: 95% is recycled to the front of the process and 5% is purged so unreacted light components do not build up.']
  };
  const info = $('#eq-info');
  function pick(g) {
    $$('.eq').forEach(x => x.setAttribute('aria-pressed', String(x === g)));
    const [t, d] = EQ[g.dataset.eq];
    info.innerHTML = `<h3>${esc(t)}</h3><p style="margin:0">${esc(d)}</p>`;
  }
  $$('.eq').forEach(g => {
    g.addEventListener('click', () => pick(g));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g); } });
  });

  drawTable();
  update();
})().catch(e => { console.error(e); $('#t-badge').textContent = 'Could not load the study data. Refresh to try again.'; });
