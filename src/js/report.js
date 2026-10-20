/* guaitaCO2 — informe imprimible (superposició a pantalla completa; s'imprimeix o es desa com a PDF des del navegador) */
const RP = GC.report = {};
RP.open = function () {
  const prevLight = document.body.classList.contains('light'); if (!prevLight) U.setTheme('light');
  const ks = S.kscale(), st = S.p.settings, res = S.res(), scn = S.scn(); const L = GC.odb.lib; const rel = (L && L.meta.release) || S.p.source.release || '';
  const close = () => { ov.remove(); document.removeEventListener('keydown', kd, true); if (!prevLight) U.setTheme('dark'); };
  const kd = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const sec = (t, ...kids) => h('section', { class: 'rsec' }, h('h2', null, t), kids);
  const doc = h('div', { class: 'rdoc' });
  doc.appendChild(h('header', { class: 'rhead' }, h('div', { class: 'brand2' }, h('span', { class: 'cells' }, h('i'), h('i'), h('i'), h('i')), 'GUAITA', h('em', null, 'CO2'), h('span', { class: 'mu' }, ' · Informe de CO₂e embegut')),
    h('h1', null, S.p.name), h('div', { class: 'mu' }, 'Escenari: ' + scn.name + ' · ' + new Date().toLocaleDateString('ca-ES') + ' · guaitaCO2 v.' + VERSION)));
  doc.appendChild(sec('Criteris de càlcul', h('table', { class: 'gt' }, h('tbody', null,
    [['Indicador', M.IND[st.ind].l + ' (' + S.kunit() + ')'], ['Mòduls comptats', st.counted.join(', ') || 'cap'], ['Mòdul D', 'Es mostra a part; no se suma al total'], ['Període d\'estudi', st.period + ' anys'], ['Origen de B4', st.b4mode === 'rsl' ? 'Càlcul per vida útil quan l\'element en té; si no, valor del dataset' : 'Valor del dataset'], ['Dades', 'ÖKOBAUDAT ' + rel + ' (BMWSB / BBSR), EN 15804+A2'], ['Superfície de referència', st.area ? U.fmt(st.area, 0) + ' m²' : '—']].map(r => h('tr', null, h('td', null, h('b', null, r[0])), h('td', null, r[1])))))));
  doc.appendChild(sec('1. Resum', h('div', { class: 'cards' },
    h('div', { class: 'card' }, h('div', { class: 'k' }, 'Total comptat'), h('div', { class: 'v' }, U.fmtV(res.total * ks)), h('div', { class: 's' }, S.kunit())),
    st.area ? h('div', { class: 'card' }, h('div', { class: 'k' }, 'Per m²'), h('div', { class: 'v' }, U.fmtV(res.total / st.area)), h('div', { class: 's' }, 'kg CO₂e/m²')) : null,
    h('div', { class: 'card' }, h('div', { class: 'k' }, 'Mòdul D (a part)'), h('div', { class: 'v' }, res.dn ? U.fmtV(res.d * ks) : '·'), h('div', { class: 's' }, S.kunit())),
    h('div', { class: 'card' }, h('div', { class: 'k' }, 'Cost'), h('div', { class: 'v' }, res.costMiss === res.n ? '—' : U.fmt(res.cost, 0) + ' €'), h('div', { class: 's' }, res.costMiss ? res.costMiss + ' sense preu' : 'tots amb preu')),
    h('div', { class: 'card' }, h('div', { class: 'k' }, 'Qualitat de dades'), h('div', { class: 'v' }, res.ok + '/' + res.n), h('div', { class: 's' }, res.pa + ' parcials · ' + res.no + ' sense dada')))));
  const gs = UI.groupSums(res);
  doc.appendChild(sec('2. Per fase del cicle de vida', UI.stack([{ name: scn.name, g: gs }], { title: 'Fases' }), UI.stackLegend(), h('p', { class: 'mu' }, M.GROUPS.slice(0, 4).map(g => g.t + ': ' + U.fmtV(gs[g.id] * ks)).join(' · '))));
  const tb = h('tbody', null, res.rows.map((x, i) => h('tr', null, h('td', null, i + 1), h('td', null, x.it.name), h('td', null, x.it.group || ''),
    h('td', null, x.it.layers ? 'Solució: ' + x.it.layers.map(l => (S.dsOf(l.dsId) || {}).n || '?').join(' + ') : (x.ds ? x.ds.n : 'sense dataset')), h('td', { class: 'num' }, U.fmtV(x.it.qty) + ' ' + x.it.unit),
    h('td', { class: 'num' }, x.r.nd || !st.counted.length ? U.fmtV(x.r.tot * ks) : '·'), h('td', { class: 'num' }, res.total > 0 && x.r.tot > 0 ? U.fmt(x.r.tot / res.total * 100, 1) + ' %' : ''), h('td', { class: 'num' }, x.r.cost != null ? U.fmt(x.r.cost, 0) : '·'), h('td', null, x.r.status.toUpperCase()))));
  doc.appendChild(sec('3. Elements', h('table', { class: 'gt' }, h('thead', null, h('tr', null, ['#', 'Element', 'Grup', 'Dataset', 'Quantitat', 'Total ' + S.kunit(), '% obra', 'Cost €', 'Dada'].map((t, i) => h('th', { class: i >= 4 && i <= 7 ? 'num' : '' }, t)))), tb,
    h('tfoot', null, h('tr', null, h('td', { colspan: 5 }, 'Total'), h('td', { class: 'num' }, U.fmtV(res.total * ks)), h('td'), h('td', { class: 'num' }, res.costMiss === res.n ? '—' : U.fmt(res.cost, 0)), h('td'))))));
  const par = C.pareto(res).slice(0, 10); if (par.length) doc.appendChild(sec('4. Punts calents', UI.pareto(par)));
  const scs = S.p.scenarios;
  if (scs.length > 1) {
    const R = scs.map(sc => ({ sc, r: S.res(sc) })); const base = R[0];
    const body = [UI.stack(R.map(x => ({ name: x.sc.name, g: UI.groupSums(x.r) })), { title: 'Escenaris' }), UI.stackLegend(),
      h('table', { class: 'gt' }, h('thead', null, h('tr', null, ['Escenari', 'Total ' + S.kunit(), 'Δ respecte a «' + base.sc.name + '»', 'Δ %', 'Cost €'].map((t, i) => h('th', { class: i ? 'num' : '' }, t)))),
        h('tbody', null, R.map(x => h('tr', null, h('td', null, x.sc.name), h('td', { class: 'num' }, U.fmtV(x.r.total * ks)), h('td', { class: 'num' }, x === base ? '—' : U.fmtD((x.r.total - base.r.total) * ks, 2)), h('td', { class: 'num' }, x === base || !base.r.total ? '' : U.fmtPct((x.r.total - base.r.total) / Math.abs(base.r.total) * 100)), h('td', { class: 'num' }, x.r.costMiss === x.r.n ? '—' : U.fmt(x.r.cost, 0))))))];
    const tg = R.find(x => x.sc.id === S.p.active && x !== base) || R[1]; body.push(h('h3', null, 'Cascada: «' + base.sc.name + '» → «' + tg.sc.name + '»'), UI.waterfall(base.r, tg.r, base.sc.name, tg.sc.name));
    doc.appendChild(sec('5. Escenaris', body));
  }
  if (st.area) doc.appendChild(sec('6. Referència per m²', UI.refChart(res.total / st.area, UI.allRefs()), h('p', { class: 'mu' }, 'Valors orientatius d\'edifici complet. LETI: A1–A5; RIBA: A1–C4 sense B6/B7. Només comparables si els mòduls comptats coincideixen. Fonts: ' + UI.allRefs().filter((r, i, a) => a.findIndex(q => q.src === r.src) === i).map(r => r.src + (r.url ? ' (' + r.url + ')' : '')).join(' · '))));
  const hyp = []; for (const x of res.rows) { const it = x.it; if (it.layers) hyp.push('«' + it.name + '»: solució de ' + it.layers.length + ' capes (' + it.layers.map(l => ((S.dsOf(l.dsId) || {}).n || '?') + ' ×' + U.fmtV(l.qty) + ' ' + l.unit + (l.conv !== 1 ? ' (factor ' + U.fmtV(l.conv) + ')' : '') + (l.rsl ? ', vida ' + l.rsl + ' a' : '')).join('; ') + ').');
    else { if (x.ds && it.conv !== 1) hyp.push('«' + it.name + '»: factor de conversió ' + U.fmtV(it.conv) + ' de ' + it.unit + ' a ' + M.unitLabel(x.ds.u) + '.'); if (it.rsl) hyp.push('«' + it.name + '»: vida útil ' + it.rsl + ' anys' + (x.r.b4n != null ? ' (' + x.r.b4n + ' substitucions en ' + st.period + ' anys)' : '') + '.'); }
    if (x.r.status !== 'ok') hyp.push('«' + it.name + '»: ' + (x.r.status === 'no' ? 'sense dades als mòduls comptats' : 'dades parcials (mòduls no declarats no compten com a zero)') + '.'); }
  doc.appendChild(sec('7. Hipòtesis i avisos', hyp.length ? h('ul', null, hyp.map(t => h('li', null, t))) : h('p', null, 'Cap hipòtesi destacable: tots els elements tenen dades i factor 1.')));
  doc.appendChild(sec('8. Font i limitacions', h('p', null, 'Dades: ÖKOBAUDAT ' + rel + ', Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen (BMWSB) / Bundesinstitut für Bau-, Stadt- und Raumforschung (BBSR), ' + GC.SRC.url + '. Càlcul amb guaitaCO2 v.' + VERSION + ' (SBS BIM Consulting).'),
    h('p', { class: 'mu' }, 'Resultats orientatius per a decisions de disseny relatives i docència; no constitueixen una ACV d\'edifici ni una certificació. ÖKOBAUDAT no està pensada per fer l\'ACV d\'un producte. Un mòdul no declarat («·») no és zero. Guaita Apps es distribueix «tal com és», sense cap garantia; la verificació dels resultats recau en l\'usuari final.')));
  const ov = h('div', { class: 'report light' }, h('div', { class: 'rbar' }, h('b', null, 'Informe'), h('span', { class: 'mu' }, 'Imprimeix o desa com a PDF des del navegador.'), h('span', { class: 'sp' }), h('button', { class: 'pri', onclick: () => window.print() }, 'Imprimeix / Desa PDF'), h('button', { onclick: close }, 'Tanca')), doc);
  document.body.appendChild(ov); document.addEventListener('keydown', kd, true);
};
