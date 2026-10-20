/* guaitaCO2 — vista Escenaris: comparació d'alternatives de projecte */

/* barres apilades horitzontals per grup de mòduls comptats. rows: [{name, g:{A:..,A4:..,B:..,C:..}, d}] */
UI.stack = function (rows, o) {
  o = o || {}; const ks = S.kscale(); const W = 700, rh = 30, m = { l: 150, r: 70, t: 8, b: 26 }; const Hh = m.t + m.b + rows.length * rh;
  const s = U.svg('svg', { class: 'ch', viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'aria-label': o.title || 'Barres apilades' });
  const tot = r => M.GROUPS.slice(0, 4).reduce((a, g) => a + (r.g[g.id] || 0), 0);
  let mn = 0, mx = 0; for (const r of rows) { let p = 0, n = 0; for (const g of M.GROUPS.slice(0, 4)) { const v = r.g[g.id] || 0; if (v >= 0) p += v; else n += v; } mx = Math.max(mx, p); mn = Math.min(mn, n); }
  if (mx === mn) mx = mn + 1; const X = v => m.l + (v - mn) / (mx - mn) * (W - m.l - m.r);
  const tk = (() => { const n = 5, st = (mx - mn) / n, e = Math.pow(10, Math.floor(Math.log10(st))), f = st / e, q = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; const r = []; for (let v = Math.ceil(mn / q) * q; v <= mx; v += q) r.push(Math.abs(v) < q / 1e6 ? 0 : v); return r; })();
  for (const v of tk) { s.appendChild(U.svg('line', { class: 'gl', x1: X(v), x2: X(v), y1: m.t, y2: Hh - m.b })); s.appendChild(U.svg('text', { x: X(v), y: Hh - m.b + 14, 'text-anchor': 'middle', class: 'mono' }, U.fmtV(v * ks))); }
  s.appendChild(U.svg('line', { class: 'ax', x1: X(0), x2: X(0), y1: m.t, y2: Hh - m.b }));
  rows.forEach((r, i) => {
    const y = m.t + i * rh + 5; let p = 0, n = 0;
    s.appendChild(U.svg('text', { x: m.l - 8, y: y + 14, 'text-anchor': 'end', class: 'lab' }, r.name.length > 22 ? r.name.slice(0, 21) + '…' : r.name));
    for (const g of M.GROUPS.slice(0, 4)) {
      const v = r.g[g.id] || 0; if (!v) continue; const a = v >= 0 ? p : n + v, b = v >= 0 ? p + v : n; if (v >= 0) p += v; else n += v;
      const w = Math.max(1, X(b) - X(a) - 2); const rect = U.svg('rect', { x: X(a), y, width: w, height: rh - 10, fill: 'var(--' + g.cls + ')', rx: 2 });
      rect.appendChild(U.svg('title', null, r.name + '\n' + g.t + ': ' + U.fmtV(v * ks) + ' ' + S.kunit())); s.appendChild(rect);
    }
    s.appendChild(U.svg('text', { x: X(p) + 6, y: y + 14, class: 'mono' }, U.fmtV(tot(r) * ks)));
  });
  return s;
};
UI.stackLegend = () => h('div', { class: 'legend' }, M.GROUPS.slice(0, 4).map(g => h('span', null, h('i', { style: { background: 'var(--' + g.cls + ')' } }), g.t)), h('span', { class: 'mu' }, 'D es mostra a part.'));
/* sumes per grup dels mòduls comptats d'un resultat d'escenari */
UI.groupSums = function (res) {
  const cnt = S.p.settings.counted; const o = {};
  for (const g of M.GROUPS.slice(0, 4)) o[g.id] = g.mods.filter(m => cnt.indexOf(m) >= 0 && M.COUNTABLE.indexOf(m) >= 0).reduce((a, m) => a + res.mods[m].sum, 0);
  return o;
};

/* cascada: de l'escenari base a l'escenari comparat, element a element (només mòduls comptats) */
UI.waterfall = function (rb, rt, nb, nt) {
  const ks = S.kscale(); const mb = new Map(rb.rows.map(x => [x.it.id, x])), mt = new Map(rt.rows.map(x => [x.it.id, x]));
  const ids = new Set([...mb.keys(), ...mt.keys()]); let ds = [];
  for (const id of ids) { const a = mb.get(id), b = mt.get(id); const d = (b ? b.r.tot : 0) - (a ? a.r.tot : 0); if (Math.abs(d) > 1e-12) ds.push({ name: (b || a).it.name || '—', d, tag: !a ? 'nou' : (!b ? 'eliminat' : '') }); }
  ds.sort((x, y) => Math.abs(y.d) - Math.abs(x.d)); const TOP = 9; if (ds.length > TOP + 1) { const rest = ds.slice(TOP); ds = ds.slice(0, TOP); ds.push({ name: 'Altres (' + rest.length + ')', d: rest.reduce((a, x) => a + x.d, 0), tag: '' }); }
  const bars = [{ name: nb, v: rb.total, total: true }]; let acc = rb.total; for (const x of ds) { bars.push({ name: x.name + (x.tag ? ' (' + x.tag + ')' : ''), from: acc, to: acc + x.d, d: x.d }); acc += x.d; } bars.push({ name: nt, v: rt.total, total: true });
  const W = 720, Hh = 330, m = { l: 64, r: 14, t: 18, b: 96 }; const s = U.svg('svg', { class: 'ch', viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'aria-label': 'Cascada entre escenaris' });
  const vals = bars.flatMap(b => b.total ? [0, b.v] : [b.from, b.to]); let y0 = Math.min(0, ...vals), y1 = Math.max(0, ...vals); if (y0 === y1) y1 = y0 + 1; const pad = (y1 - y0) * .08; y1 += pad; if (y0 < 0) y0 -= pad;
  const Y = v => Hh - m.b - (v - y0) / (y1 - y0) * (Hh - m.t - m.b); const bw = (W - m.l - m.r) / bars.length;
  const tk = (() => { const n = 5, st = (y1 - y0) / n, e = Math.pow(10, Math.floor(Math.log10(st))), f = st / e, q = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; const r = []; for (let v = Math.ceil(y0 / q) * q; v <= y1; v += q) r.push(Math.abs(v) < q / 1e6 ? 0 : v); return r; })();
  for (const v of tk) { s.appendChild(U.svg('line', { class: 'gl', x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) })); s.appendChild(U.svg('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'mono' }, U.fmtV(v * ks))); }
  s.appendChild(U.svg('line', { class: 'ax', x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0) }));
  bars.forEach((b, i) => {
    const x = m.l + i * bw + bw * .14, w = bw * .72; const a = b.total ? 0 : b.from, c = b.total ? b.v : b.to; const top = Math.min(Y(a), Y(c)), hh = Math.max(1.5, Math.abs(Y(a) - Y(c)));
    const fill = b.total ? 'var(--gD)' : (b.d < 0 ? 'var(--green)' : 'var(--danger)');
    const r = U.svg('rect', { x, y: top, width: w, height: hh, fill, rx: 2 }); r.appendChild(U.svg('title', null, b.name + '\n' + (b.total ? U.fmtV(b.v * ks) : U.fmtD(b.d * ks, 2)) + ' ' + S.kunit())); s.appendChild(r);
    if (i < bars.length - 1) { const nxt = bars[i + 1]; const lvl = b.total ? b.v : b.to; s.appendChild(U.svg('line', { x1: x + w, x2: m.l + (i + 1) * bw + bw * .14, y1: Y(lvl), y2: Y(lvl), class: 'gl', 'stroke-dasharray': '3 3' })); }
    s.appendChild(U.svg('text', { x: x + w / 2, y: (b.total || b.d >= 0 ? top - 4 : top + hh + 12), 'text-anchor': 'middle', class: 'mono', style: 'font-size:10px' }, b.total ? U.fmtV(b.v * ks) : U.fmtD(b.d * ks, 2)));
    const lbl = U.svg('text', { transform: 'translate(' + (x + w / 2) + ',' + (Hh - m.b + 12) + ') rotate(-35)', 'text-anchor': 'end', style: 'font-size:10px' }, b.name.length > 24 ? b.name.slice(0, 23) + '…' : b.name); s.appendChild(lbl);
  });
  return s;
};
UI.scnView = function (host) {
  const ks = S.kscale(); const scs = S.p.scenarios; const base = S.scnById(S.cmp) || scs[0]; S.cmp = base.id; const tgt = (S.cmp2 && S.cmp2 !== base.id && S.scnById(S.cmp2)) || (S.p.active !== base.id ? S.scnById(S.p.active) : scs.find(q => q.id !== base.id)) || null; if (tgt) S.cmp2 = tgt.id;
  const R = scs.map(sc => ({ sc, r: S.res(sc) })); const rb = R.find(x => x.sc.id === base.id).r;
  const sc = h('div', { class: 'pad', style: { flex: 1 } }); host.appendChild(sc);
  const bsel = h('select', { onchange: e => { S.cmp = e.target.value; GC.refresh('view'); } }, scs.map(s => h('option', { value: s.id, selected: s.id === base.id }, s.name)));
  sc.appendChild(h('div', { class: 'row', style: { marginBottom: '10px', flexWrap: 'wrap' } },
    h('button', { onclick: () => UI.newScn() }, U.ico('plus'), ' Escenari nou (còpia de l\'actual)'),
    h('button', { onclick: async () => { const a = await U.ask('Reanomena l\'escenari', [{ k: 'n', l: 'Nom', v: S.scn().name }]); if (a && a.n.trim()) S.renameScenario(S.scn().id, a.n.trim()); } }, 'Reanomena l\'actual'),
    h('button', { disabled: scs.length < 2, onclick: async () => { if (await U.confirm('Elimina l\'escenari', 'S\'eliminarà «' + S.scn().name + '». Es pot desfer amb Ctrl+Z.', 'Elimina')) S.delScenario(S.scn().id); } }, 'Elimina l\'actual'),
    h('label', null, 'Escenari de referència:'), bsel, scs.length > 1 ? [h('label', null, 'Compara amb:'), h('select', { onchange: e => { S.cmp2 = e.target.value; GC.refresh('view'); } }, scs.filter(q => q.id !== base.id).map(q => h('option', { value: q.id, selected: tgt && q.id === tgt.id }, q.name)))] : null));
  if (scs.length < 2) sc.appendChild(h('div', { class: 'hint' }, 'Crea un segon escenari (còpia de l\'actual), canvia\'n materials amb el selector d\'alternatives i compara\'n els totals aquí.'));
  sc.appendChild(h('div', { class: 'cards' }, R.map(x => {
    const d = x.r.total - rb.total, isb = x.sc.id === base.id;
    return h('div', { class: 'card' + (x.sc.id === S.p.active ? ' ac' : ''), style: { cursor: 'pointer' }, title: 'Fes actiu aquest escenari', onclick: () => S.setScenario(x.sc.id) },
      h('div', { class: 'k' }, x.sc.name + (x.sc.id === S.p.active ? ' · actiu' : '') + (isb ? ' · referència' : '')), h('div', { class: 'v' }, U.fmtV(x.r.total * ks)),
      h('div', { class: 's' }, S.kunit() + (isb ? '' : ' · Δ ' + U.fmtD(d * ks, 2) + (rb.total ? ' (' + U.fmtPct(d / Math.abs(rb.total) * 100) + ')' : ''))),
      h('div', { class: 's' }, 'Cost ' + (x.r.costMiss === x.r.n ? '—' : U.fmt(x.r.cost, 0) + ' €' + (x.r.costMiss ? '*' : '')) + (!isb && x.r.costMiss === 0 && rb.costMiss === 0 ? ' · Δ ' + U.fmtD(x.r.cost - rb.cost, 0) + ' €' : '')),
      (x.r.no + x.r.pa) ? h('div', { class: 's warnx' }, (x.r.no + x.r.pa) + ' elements amb dades incompletes') : null);
  })));
  sc.appendChild(h('div', { class: 'chartbox' }, h('h4', null, 'CO₂e per escenari i fase (' + S.p.settings.counted.join(', ') + ')'),
    UI.stack(R.map(x => ({ name: x.sc.name, g: UI.groupSums(x.r) })), { title: 'CO₂e per escenari' }), UI.stackLegend()));
  if (tgt) sc.appendChild(h('div', { class: 'chartbox' }, h('h4', null, 'Cascada: de «' + base.name + '» a «' + tgt.name + '» (' + S.p.settings.counted.join(', ') + ')'), UI.waterfall(R.find(x => x.sc.id === base.id).r, R.find(x => x.sc.id === tgt.id).r, base.name, tgt.name),
    h('div', { class: 'legend' }, h('span', null, h('i', { style: { background: 'var(--green)' } }), 'Redueix el CO₂e'), h('span', null, h('i', { style: { background: 'var(--danger)' } }), 'L\'augmenta'), h('span', null, h('i', { style: { background: 'var(--gD)' } }), 'Totals')), h('div', { class: 'hint' }, 'Cada barra és el canvi d\'un element (o la suma dels menors) entre els dos escenaris; els elements nous o eliminats s\'indiquen.')));
  /* diferències element a element */
  const ids = []; const seen = new Set();
  for (const x of R) for (const row of x.r.rows) if (!seen.has(row.it.id)) { seen.add(row.it.id); ids.push({ id: row.it.id, name: row.it.name }); }
  const val = (x, id) => { const row = x.r.rows.find(q => q.it.id === id); return row ? row : null; };
  const trs = ids.map(e => {
    const cells = R.map(x => { const row = val(x, e.id); return row ? row : null; }); const b = cells[R.findIndex(x => x.sc.id === base.id)];
    const diff = cells.some(c => c && b && (c.it.dsId !== b.it.dsId || Math.abs(c.r.tot - b.r.tot) > 1e-9 || c.it.qty !== b.it.qty));
    return { e, cells, b, diff };
  });
  const only = h('input', { type: 'checkbox', checked: true, onchange: () => draw() });
  const tbHost = h('div', { class: 'scroll', style: { maxHeight: '44vh', border: '1px solid var(--border)' } });
  const draw = () => {
    tbHost.textContent = '';
    const rowsS = trs.filter(t => !only.checked || t.diff);
    const th = [h('th', { class: 'stk' }, 'Element')]; R.forEach(x => th.push(h('th', { class: 'num' }, x.sc.name)));
    const tb = h('tbody', null, rowsS.map(t => h('tr', null, h('td', { class: 'stk nm' }, t.e.name || '—'), t.cells.map((c, i) => {
      if (!c) return h('td', { class: 'nd' }, '—'); const isb = R[i].sc.id === base.id; const d = t.b ? c.r.tot - t.b.r.tot : 0;
      return h('td', { class: 'num', title: c.ds ? c.ds.n : 'sense dataset' }, U.fmtV(c.r.tot * ks), !isb && t.b && Math.abs(d) > 1e-9 ? h('span', { style: { color: d < 0 ? 'var(--green)' : 'var(--danger)' } }, ' (' + U.fmtD(d * ks, 2) + ')') : null, c.ds && t.b && t.b.ds && c.ds.id !== t.b.ds.id ? h('span', { class: 'mu', title: c.ds.n }, ' ⇄') : null);
    }))));
    const tf = h('tfoot', null, h('tr', null, h('td', { class: 'stk' }, 'Total'), R.map(x => h('td', { class: 'num' }, U.fmtV(x.r.total * ks)))));
    tbHost.appendChild(h('table', { class: 'gt' }, h('thead', null, h('tr', null, th)), tb, tf));
  };
  sc.appendChild(h('h4', null, 'Element a element'));
  sc.appendChild(h('div', { class: 'row' }, only, h('label', null, 'Només els elements que difereixen de la referència'), h('span', { class: 'mu' }, '⇄ = dataset diferent. Entre parèntesis, Δ ' + S.kunit() + ' respecte a la referència.')));
  sc.appendChild(tbHost); draw();
};
UI.newScn = async function () {
  const a = await U.ask('Escenari nou', [{ k: 'n', l: 'Nom', v: 'Alternativa ' + S.p.scenarios.length }], 'Es crea com a còpia de l\'escenari actual i passa a ser l\'actiu.'); if (!a || !a.n.trim()) return;
  S.newScenario(a.n.trim(), S.scn().id); S.view = 'obra'; GC.refresh('view');
};
