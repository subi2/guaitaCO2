/* guaitaCO2 — selector d'alternatives: mateixa unitat i categoria, Δ CO2e i Δ cost respecte a l'element actual */

const QCOL = { gg: 'var(--green)', cc: 'var(--cyan)', ce: 'var(--warn)', pp: 'var(--danger)', '': 'var(--text-dim)' };
/* dispersió SVG genèrica: pts [{x,y,c,t,big}] ; x,y en unitats natives */
UI.scatter = function (pts, o) {
  const W = 640, Hh = 330, m = { l: 62, r: 16, t: 14, b: 40 }; const s = U.svg('svg', { class: 'ch', viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'aria-label': o.title || 'Dispersió' });
  if (!pts.length) return s;
  let x0 = Math.min(0, ...pts.map(p => p.x)), x1 = Math.max(0, ...pts.map(p => p.x)), y0 = Math.min(0, ...pts.map(p => p.y)), y1 = Math.max(0, ...pts.map(p => p.y));
  if (x0 === x1) { x0 -= 1; x1 += 1; } if (y0 === y1) { y0 -= 1; y1 += 1; }
  const px = (x1 - x0) * .06, py = (y1 - y0) * .08; x0 -= px; x1 += px; y0 -= py; y1 += py;
  const X = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r), Y = v => Hh - m.b - (v - y0) / (y1 - y0) * (Hh - m.t - m.b);
  const tk = (a, b) => { const n = 5, st = (b - a) / n, e = Math.pow(10, Math.floor(Math.log10(st))), f = st / e, q = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; const r = []; for (let v = Math.ceil(a / q) * q; v <= b; v += q) r.push(Math.abs(v) < q / 1e6 ? 0 : v); return r; };
  for (const v of tk(x0, x1)) { s.appendChild(U.svg('line', { class: 'gl', x1: X(v), x2: X(v), y1: m.t, y2: Hh - m.b })); s.appendChild(U.svg('text', { x: X(v), y: Hh - m.b + 14, 'text-anchor': 'middle', class: 'mono' }, U.fmtV(v))); }
  for (const v of tk(y0, y1)) { s.appendChild(U.svg('line', { class: 'gl', x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) })); s.appendChild(U.svg('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'mono' }, U.fmtV(v))); }
  s.appendChild(U.svg('line', { class: 'ax', x1: X(0), x2: X(0), y1: m.t, y2: Hh - m.b })); s.appendChild(U.svg('line', { class: 'ax', x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0) }));
  s.appendChild(U.svg('text', { x: (m.l + W - m.r) / 2, y: Hh - 6, 'text-anchor': 'middle' }, o.xl)); const yl = U.svg('text', { transform: 'translate(13,' + (m.t + Hh - m.b) / 2 + ') rotate(-90)', 'text-anchor': 'middle' }, o.yl); s.appendChild(yl);
  if (o.quadLabels) { const q = (t, x, y, a) => s.appendChild(U.svg('text', { x, y, 'text-anchor': a, style: 'fill:var(--text-dim2);font-size:10px' }, t));
    q('← més barat · menys CO₂e ↓', m.l + 4, Hh - m.b - 6, 'start'); }
  for (const p of pts) {
    const c = U.svg('circle', { cx: X(p.x), cy: Y(p.y), r: p.big ? 7 : 4.5, fill: p.c, stroke: 'var(--bg-panel)', 'stroke-width': 2, style: p.onclick ? 'cursor:pointer' : '' });
    c.appendChild(U.svg('title', null, p.t)); if (p.onclick) c.addEventListener('click', p.onclick); s.appendChild(c);
  }
  return s;
};

UI.altDlg = async function (itemId, o) {
  o = o || {}; const it = o.layer ? Object.assign(C.layerItem(o.parent, o.layer), { id: 'layer', name: o.layer.name, dsId: o.layer.dsId, unit: o.layer.unit }) : S.item(itemId); if (!it) return;
  if (it.layers) return UI.altSolDlg(it); const ds = S.dsOf(it.dsId);
  if (!GC.odb.lib) { U.info('Biblioteca buida', 'Cal importar ÖKOBAUDAT per veure alternatives.'); return; }
  if (!ds) { U.info('Sense dataset', 'Assigna primer un dataset a l\'element.'); return; }
  const st = { level: Math.min(2, Math.max(1, ds.cat.length - 1)), types: { average: true, generic: true, specific: false, template: false, representative: false }, land: false, onlyCompl: true, sortK: 'dco', lim: 80 };
  st.level = C.autoLevel(it, S.ctx(), { types: st.types, land: null }, 3);
  const body = h('div'); let close = null; const ks = S.kscale();
  const draw = () => {
    body.textContent = '';
    const A = C.alts(it, S.ctx(), { level: st.level, types: st.types, land: st.land ? ds.land : null });
    const base = A.base; let list = A.list.filter(a => !st.onlyCompl || a.complete);
    list.sort((a, b) => st.sortK === 'dcost' ? ((a.dcost == null) - (b.dcost == null)) || a.dcost - b.dcost : ((a.dco == null) - (b.dco == null)) || a.dco - b.dco);
    const lv = h('select', { onchange: e => { st.level = Number(e.target.value); draw(); } }, ds.cat.map((c, i) => h('option', { value: i + 1, selected: st.level === i + 1 }, (i + 1) + ' nivell' + (i ? 's' : '') + ': ' + ds.cat.slice(0, i + 1).join(' ▸ ').slice(0, 90))));
    const lvl0 = h('option', { value: 0, selected: st.level === 0 }, 'Qualsevol categoria (mateixa unitat)'); lv.insertBefore(lvl0, lv.firstChild);
    body.appendChild(h('div', { class: 'cards' },
      h('div', { class: 'card' }, h('div', { class: 'k' }, 'Element actual'), h('div', { class: 's', style: { color: 'var(--text)' } }, ds.n), h('div', { class: 's' }, 'Dataset per ' + M.unitLabel(ds.u) + ' · ' + (M.TYPES[ds.typ] || ds.typ) + ' · ' + ds.land)),
      h('div', { class: 'card ac' }, h('div', { class: 'k' }, 'CO₂e actual (' + S.p.settings.counted.join('+') + ')'), h('div', { class: 'v' }, base && base.status === 'ok' ? U.fmtV(base.tot * ks) : 'sense dada'), h('div', { class: 's' }, S.kunit() + ' · quantitat ' + U.fmtV(it.qty) + ' ' + it.unit)),
      h('div', { class: 'card' }, h('div', { class: 'k' }, 'Cost actual'), h('div', { class: 'v' }, base && base.cost != null ? U.fmt(base.cost, 2) + ' €' : '—'), h('div', { class: 's' }, base && base.cost != null ? '' : 'Informa un preu per veure Δ€'))));
    body.appendChild(h('div', { class: 'row', style: { flexWrap: 'wrap' } }, h('label', null, 'Comparar dins de'), lv,
      Object.keys(M.TYPES).map(k => h('label', { class: 'chk', title: M.TYPE_HINT[k] }, h('input', { type: 'checkbox', checked: !!st.types[k], onchange: e => { st.types[k] = e.target.checked; draw(); } }), ' ' + M.TYPES[k])),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: st.land, onchange: e => { st.land = e.target.checked; draw(); } }), ' només ' + (ds.land || 'mateix país')),
      h('label', { class: 'chk', title: 'Amaga datasets que no tenen dada a tots els mòduls comptats' }, h('input', { type: 'checkbox', checked: st.onlyCompl, onchange: e => { st.onlyCompl = e.target.checked; draw(); } }), ' només amb dades completes')));
    body.appendChild(h('div', { class: 'hint' }, 'Comparació a igual unitat funcional (' + M.unitLabel(ds.u) + ' del dataset). Comprova que l\'alternativa compleix la mateixa funció (resistència, aïllament, durabilitat…): el CO₂e no ho garanteix. ' + (st.level === 0 ? 'Atenció: sense filtre de categoria es comparen materials de famílies molt diferents.' : (st.level < ds.cat.length ? 'Nivell triat automàticament: el més específic amb almenys 3 alternatives; amplia o redueix-lo amb el selector.' : 'Mateixa família que l\'element actual.'))));
    if (!base || base.status !== 'ok') { body.appendChild(h('div', { class: 'warnx' }, 'L\'element actual no té dades a tots els mòduls comptats; no es pot calcular Δ. Canvia els mòduls comptats a la barra superior.')); }
    const withBoth = list.filter(a => a.dco != null && a.dcost != null);
    if (withBoth.length) {
      const pts = withBoth.map(a => ({ x: a.dcost, y: a.dco * ks, c: QCOL[a.quad], t: a.ds.n + '\nΔ€ ' + U.fmtD(a.dcost, 2) + ' · Δ' + S.kunit() + ' ' + U.fmtD(a.dco * ks, 2), onclick: () => apply(a.ds) }));
      body.appendChild(h('div', { class: 'chartbox' }, h('h4', null, 'Pla de decisió: Δ cost vs Δ CO₂e'), UI.scatter(pts, { xl: 'Δ cost (€) respecte a l\'actual', yl: 'Δ ' + S.kunit(), quadLabels: true, title: 'Pla de decisió' }),
        h('div', { class: 'legend' }, ['gg', 'cc', 'ce', 'pp'].map(q => h('span', null, h('i', { style: { background: QCOL[q] } }), C.QUAD[q])))));
    } else if (list.length && !S.p.prices || !withBoth.length && list.some(a => a.dco != null)) body.appendChild(h('div', { class: 'hint' }, 'Sense preus no hi ha pla de decisió: informa un preu a l\'element o als datasets per veure Δ€ (el preu és opcional).'));
    const apply = async d => {
      if (o.onApply) { o.onApply(d); if (close) close(true); return; }
      const r = await U.modal('Substitueix el dataset', h('div', null, h('p', null, 'Tria què fer amb «' + d.n + '»:')), [{ l: 'Cancel·la', v: false }, { l: 'Crea escenari nou amb la substitució', v: 'scn' }, { l: 'Substitueix a l\'escenari actual', v: 'cur', pri: 1 }]);
      if (!r) return;
      if (r === 'scn') { const nm = await U.ask('Nou escenari', [{ k: 'n', l: 'Nom', v: S.scn().name + ' + ' + d.n.slice(0, 30) }]); if (!nm) return; const id = S.newScenario(nm.n, S.scn().id); const it2 = S.item(itemId); if (it2) S.assignDs(it2.id, d, true); }
      else S.assignDs(itemId, d, true);
      if (close) close(true);
    };
    const shown = list.slice(0, st.lim); const mx = Math.max(1e-12, ...shown.map(a => Math.abs(a.dco || 0)));
    const th = (t, k, c) => h('th', { class: (c || '') + (k ? ' srt' : ''), onclick: k ? () => { st.sortK = k; draw(); } : null }, t + (st.sortK === k ? ' ▲' : ''));
    const tb = h('tbody', null, shown.map(a => h('tr', { ondblclick: () => UI.dsDetail(a.ds, { onPick: apply, pickLabel: 'Substitueix' }) },
      h('td', { class: 'nm', title: a.ds.n + '\n' + a.ds.cat.join(' ▸ ') }, a.ds.n), h('td', null, UI.typeTag(a.ds)), h('td', null, a.ds.land),
      h('td', { class: 'num' }, a.r.status === 'no' ? '·' : U.fmtV(a.r.tot * ks) + (a.complete ? '' : '*')),
      h('td', { class: 'num', style: { background: a.dco != null ? UI.heat(a.dco, mx) : null, fontWeight: '600' } }, a.dco != null ? U.fmtD(a.dco * ks, 2) : '·'),
      h('td', { class: 'num' }, a.dco != null && base.tot ? U.fmtPct(a.dco / Math.abs(base.tot) * 100) : ''),
      h('td', { class: 'num' }, a.dcost != null ? U.fmtD(a.dcost, 2) : '·'),
      h('td', null, a.quad ? h('span', { class: 'q', style: { color: QCOL[a.quad], borderColor: QCOL[a.quad] }, title: C.QUAD[a.quad] }, a.quad.toUpperCase()) : ''),
      h('td', { class: 'num' }, (() => { const ab = C.abate(a.dco, a.dcost); return ab != null ? U.fmt(ab, 0) : ''; })()),
      h('td', { class: 'act' }, h('button', { class: 'sm', onclick: () => apply(a.ds) }, 'Substitueix')))));
    body.appendChild(h('div', { class: 'scroll', style: { maxHeight: '36vh', border: '1px solid var(--border)' } }, h('table', { class: 'gt' },
      h('thead', null, h('tr', null, th('Alternativa'), th('Tipus'), th('País'), th('Total ' + S.kunit(), null, 'num'), th('Δ CO₂e', 'dco', 'num'), th('Δ %', null, 'num'), th('Δ €', 'dcost', 'num'), th('Quadrant'), th('€/t evitada', null, 'num'), th(''))), tb)));
    body.appendChild(h('div', { class: 'hint' }, list.length + ' alternatives' + (list.length > shown.length ? ' (es mostren ' + shown.length + ')' : '') + '. Δ negatiu = menys CO₂e que l\'actual. * dades incompletes. Doble clic: fitxa. «€/t evitada»: sobrecost per tona de CO₂e estalviada.'));
    if (list.length > shown.length) body.appendChild(h('button', { onclick: () => { st.lim += 100; draw(); } }, 'Mostra\'n més'));
  };
  draw();
  await U.modal('Alternatives per a «' + (it.name || ds.n) + '»', body, [{ l: 'Tanca', v: true, pri: 1 }], { cls: 'vwide', noFocus: true, onOpen: (m, c) => { close = c; } });
};

/* alternatives per a una solució composta: altres solucions de la llibreria amb la mateixa unitat */
UI.altSolDlg = async function (it) {
  const A = C.altsSol(it, S.ctx(), S.allSols().map(x => Object.assign({}, x)).filter(x => x.layers.every(l => S.dsOf(l.dsId) || (x.ds && x.ds[l.dsId]))));
  const ks = S.kscale(); const base = A.base; let close = null;
  const sols = A.list.sort((a, b) => ((a.dco == null) - (b.dco == null)) || a.dco - b.dco);
  const body = h('div', null, h('p', null, 'Solució actual: ', h('b', null, it.name), ' · ', base.status === 'ok' ? U.fmtV(base.tot * ks) + ' ' + S.kunit() : 'dades incompletes', '. Alternatives: altres solucions de la llibreria (mateixa unitat). Per canviar un material concret, edita la solució i usa ⇄ a la capa.'),
    sols.length ? h('div', { class: 'scroll', style: { maxHeight: '50vh', border: '1px solid var(--border)' } }, h('table', { class: 'gt' }, h('thead', null, h('tr', null, ['Solució', 'On', 'Total ' + S.kunit(), 'Δ CO₂e', 'Δ %', 'Δ €', ''].map((t, i) => h('th', { class: i >= 2 && i < 6 ? 'num' : '' }, t)))),
      h('tbody', null, sols.map(a => h('tr', null, h('td', null, a.sol.name), h('td', null, a.sol.where), h('td', { class: 'num' }, a.r.status === 'no' ? '·' : U.fmtV(a.r.tot * ks) + (a.complete ? '' : '*')),
        h('td', { class: 'num', style: { fontWeight: '600' } }, a.dco != null ? U.fmtD(a.dco * ks, 2) : '·'), h('td', { class: 'num' }, a.dco != null && base.tot ? U.fmtPct(a.dco / Math.abs(base.tot) * 100) : ''), h('td', { class: 'num' }, a.dcost != null ? U.fmtD(a.dcost, 2) : '·'),
        h('td', { class: 'act' }, h('button', { class: 'sm', onclick: async () => { const r = await U.modal('Substitueix la solució', h('div', null, 'Tria què fer amb «' + a.sol.name + '».'), [{ l: 'Cancel·la', v: false }, { l: 'Crea escenari nou', v: 'scn' }, { l: 'Substitueix a l\'escenari actual', v: 'cur', pri: 1 }]); if (!r) return;
          const sub = () => { const t = S.item(it.id); if (!t) return; S.change(() => { t.layers = U.clone(a.sol.layers); t.solId = a.sol.id; for (const l of t.layers) { const d = S.dsOf(l.dsId) || (a.sol.ds && a.sol.ds[l.dsId]); if (d && !S.p.ds[d.id] && !GC.odb.get(d.id)) S.p.ds[d.id] = d; } }); };
          if (r === 'scn') { const nm = await U.ask('Nou escenari', [{ k: 'n', l: 'Nom', v: S.scn().name + ' + ' + a.sol.name.slice(0, 30) }]); if (!nm) return; S.newScenario(nm.n, S.scn().id); } sub(); close && close(true); } }, 'Substitueix'))))))) : h('div', { class: 'empty' }, 'Cap altra solució de la llibreria amb la mateixa unitat. Crea\'n a Edita ▸ Solucions per capes.'));
  await U.modal('Alternatives de la solució', body, [{ l: 'Tanca', v: true, pri: 1 }], { cls: 'wide', noFocus: true, onOpen: (m, c) => { close = c; } });
};
