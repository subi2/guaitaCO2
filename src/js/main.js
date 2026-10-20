/* guaitaCO2 — arrencada: menús, barres, vistes, arrossegar i deixar anar, dreceres */
const VIEWS = [['lib', 'Biblioteca', 'base'], ['obra', 'Obra', 'doc'], ['scn', 'Escenaris', 'scale'], ['ana', 'Anàlisi', 'chart']];
let libEl = null;

function fnNew() { return U.confirm('Projecte nou', 'Es crearà un projecte buit. El projecte actual es pot recuperar amb Desfés mentre no tanquis la pàgina.', 'Crea').then(ok => { if (ok) { S.setProject(S.newProject()); S.view = 'obra'; GC.refresh('proj'); } }); }
function menuDefs() {
  const has = !!GC.odb.lib, sel = !!S.item(S.sel);
  return [
    ['Fitxer', [
      { l: 'Projecte nou…', fn: fnNew }, { l: 'Obre projecte, cas o selecció (JSON)…', fn: () => IO.pick('.json') }, { l: 'Desa el projecte (JSON)', k: 'Ctrl+S', fn: () => IO.saveProject() }, { sep: 1 },
      { l: 'Descarrega ÖKOBAUDAT (web oficial)…', fn: () => window.open(GC.SRC.dl, '_blank', 'noopener') }, { l: 'Importa ÖKOBAUDAT (CSV)…', fn: () => IO.pick('.csv') }, { l: 'Importa elements (CSV)…', fn: () => IO.pick('.csv') }, { sep: 1 },
      { l: 'Informe imprimible…', fn: () => GC.report.open() }, { l: 'Exporta', sub: [{ l: 'Elements de l\'obra (CSV)', fn: () => IO.exportCsv() }, { l: 'Resultats (JSON)', fn: () => IO.exportResultJson() }, { l: 'Cas didàctic (JSON, només estructura)…', fn: () => IO.exportCase() }] }, { sep: 1 },
      { l: 'Esborra la biblioteca del navegador…', dis: !has, fn: async () => { if (await U.confirm('Esborra la biblioteca', 'S\'eliminaran del navegador els datasets importats. Els projectes en conserven una còpia dels que fan servir.', 'Esborra')) GC.odb.clear(); } }]],
    ['Edita', [
      { l: 'Desfés', k: 'Ctrl+Z', dis: !S.canUndo(), fn: () => S.undo() }, { l: 'Refés', k: 'Ctrl+Y', dis: !S.canRedo(), fn: () => S.redo() }, { sep: 1 },
      { l: 'Solucions per capes…', fn: () => UI.solLib() }, { l: 'Afegeix un element', fn: () => { const id = S.addBlank(); UI.itemDlg(id, true); } }, { l: 'Afegeix des de la biblioteca…', dis: !has, fn: async () => { const d = await UI.pickDs({ title: 'Afegeix un dataset a l\'obra' }); if (d) S.addFromDs(d); } },
      { l: 'Edita l\'element seleccionat…', dis: !sel, fn: () => UI.itemDlg(S.sel) }, { l: 'Alternatives de l\'element seleccionat…', dis: !sel, fn: () => UI.altDlg(S.sel) },
      { l: 'Duplica l\'element', dis: !sel, fn: () => S.dupItem(S.sel) }, { l: 'Elimina l\'element', dis: !sel, fn: () => S.delItem(S.sel) }]],
    ['Visualitza', VIEWS.map(v => ({ l: v[1], chk: S.view === v[0], fn: () => { S.view = v[0]; GC.refresh('view'); } })).concat([{ sep: 1 }, { l: 'Tema clar / fosc', fn: () => U.toggleTheme() }])],
    ['Ajuda', [{ l: 'Ajuda i glossari', k: 'F1', fn: () => HP.show() }, { l: 'Enunciat del cas', dis: !(S.p && S.p.caseInfo), fn: () => HP.showCase() }, { sep: 1 },
      { l: 'Sobre guaitaCO2', fn: () => U.info('guaitaCO2 v.' + VERSION, h('div', null, h('p', null, 'Eina pedagògica i independent per decidir amb criteri ambiental: CO₂e embegut per mòdul del cicle de vida (EN 15804+A2) amb dades d\'ÖKOBAUDAT.'), h('p', { class: 'mu' }, 'SBS BiM Consulting · Jordi Subirós · AGPL-3.0-only. Relacionada amb guaitaPreus.'))) }]]
  ];
}
function buildMenu() {
  const nav = $('menu'); nav.textContent = '';
  const mk = (it) => {
    if (it.sep) return h('div', { class: 'sep' });
    const el = h('div', { class: 'it' + (it.dis ? ' dis' : '') + (it.chk ? ' chk' : '') + (it.sub ? ' sub' : ''), onclick: e => { if (it.sub) { e.stopPropagation(); return; } closeMenus(); it.fn && it.fn(); } },
      h('span', null, it.l), it.k ? h('span', { class: 'k' }, it.k) : (it.sub ? h('span', { class: 'k' }, '▸') : null));
    if (it.sub) el.appendChild(h('div', { class: 'dd' }, it.sub.map(mk))); return el;
  };
  for (const [t, items] of menuDefs()) {
    const mi = h('div', { class: 'mi' }, h('button', { class: 'mb', onclick: e => { e.stopPropagation(); const o = mi.classList.contains('open'); closeMenus(); if (!o) mi.classList.add('open'); }, onmouseenter: () => { if (nav.querySelector('.mi.open') && !mi.classList.contains('open')) { closeMenus(); mi.classList.add('open'); } } }, t),
      h('div', { class: 'dd' }, items.map(mk)));
    nav.appendChild(mi);
  }
}
function closeMenus() { document.querySelectorAll('.mi.open').forEach(m => m.classList.remove('open')); }

function buildTbar() {
  const t = $('tbar'); t.textContent = ''; const has = !!GC.odb.lib, sel = !!S.item(S.sel);
  const b = (ico, tip, fn, dis) => h('button', { class: 'ib', title: tip, disabled: !!dis, onclick: fn }, U.ico(ico));
  t.appendChild(h('div', { class: 'grp' }, b('open', 'Obre un fitxer (CSV d\'ÖKOBAUDAT, projecte, cas…)', () => IO.pick('.json,.csv')), b('save', 'Desa el projecte (Ctrl+S)', () => IO.saveProject()), b('base', 'Importa ÖKOBAUDAT', () => IO.pick('.csv'))));
  t.appendChild(h('div', { class: 'grp' }, b('undo', 'Desfés (Ctrl+Z)', () => S.undo(), !S.canUndo()), b('redo', 'Refés (Ctrl+Y)', () => S.redo(), !S.canRedo())));
  t.appendChild(h('div', { class: 'grp' }, b('plus', 'Afegeix un element', () => { const id = S.addBlank(); UI.itemDlg(id, true); }), b('fromLib', 'Afegeix des de la biblioteca', async () => { const d = await UI.pickDs({ title: 'Afegeix un dataset a l\'obra' }); if (d) S.addFromDs(d); }, !has),
    b('swap', 'Alternatives de l\'element seleccionat', () => UI.altDlg(S.sel), !sel || !has), b('copy', 'Duplica l\'element seleccionat', () => S.dupItem(S.sel), !sel), b('trash', 'Elimina l\'element seleccionat', () => S.delItem(S.sel), !sel)));
  t.appendChild(h('div', { class: 'sp' }));
  t.appendChild(h('div', { class: 'grp' }, b('help', 'Ajuda (F1)', () => HP.show())));
}
function buildCbar() {
  const c = $('cbar'); c.textContent = ''; const st = S.p.settings;
  c.appendChild(h('label', { class: 'l', title: 'Indicador de canvi climàtic' }, 'Indicador'));
  c.appendChild(h('select', { title: 'GWP-total = fòssil + biogènic + luluc', onchange: e => S.setSetting('ind', e.target.value) }, Object.keys(M.IND).map(k => h('option', { value: k, selected: st.ind === k }, M.IND[k].l))));
  c.appendChild(h('select', { title: 'Unitat de sortida', onchange: e => S.setSetting('unitOut', e.target.value) }, [['kg', 'kg CO₂e'], ['t', 't CO₂e']].map(o => h('option', { value: o[0], selected: st.unitOut === o[0] }, o[1]))));
  c.appendChild(h('label', { class: 'l', title: 'Mòduls que se sumen al total (D no se suma mai)' }, 'Mòduls comptats'));
  for (const g of M.GROUPS.slice(0, 4)) {
    const grp = h('span', { class: 'mgrp ' + g.cls });
    for (const m of g.mods.filter(x => M.COUNTABLE.indexOf(x) >= 0)) grp.appendChild(h('span', { class: 'mchip' + (st.counted.indexOf(m) >= 0 ? ' on' : ''), title: M.INFO[m] + '. Clic per comptar-lo o no.', onclick: () => S.toggleCounted(m) }, m === 'A1-A3' ? 'A1–A3' : m));
    c.appendChild(grp);
  }
    c.appendChild(h('label', { class: 'l', title: 'Període d\'estudi en anys (per calcular B4 amb la vida útil). D es mostra sempre a part.' }, 'Període (a)'));
  c.appendChild(h('input', { type: 'text', class: 'cp', style: { width: '48px' }, value: String(st.period), title: 'Anys', onchange: e => { const v = U.numIn(e.target.value); S.setSetting('period', v == null || isNaN(v) || v <= 0 ? 50 : v); } }));
  c.appendChild(h('select', { title: 'Origen del B4 (substitucions): valor del dataset o càlcul per vida útil. Es mostren els dos a l\'obra.', onchange: e => S.setSetting('b4mode', e.target.value) }, [['dataset', 'B4: dataset'], ['rsl', 'B4: vida útil']].map(o => h('option', { value: o[0], selected: st.b4mode === o[0] }, o[1]))));
  c.appendChild(h('span', { class: 'sp' }));
  c.appendChild(h('label', { class: 'l', title: 'Preu ombra del carboni (€ per t CO₂e). Buit = inactiu.' }, 'CO₂e €/t'));
  c.appendChild(h('input', { type: 'text', class: 'cp', placeholder: 'inactiu', value: st.cprice != null ? String(st.cprice).replace('.', ',') : '', title: 'Buit i inactiu per defecte: només si el decideixes tu', onchange: e => { const v = U.numIn(e.target.value); S.setSetting('cprice', v == null || isNaN(v) || v < 0 ? null : v); } }));
}
function buildVbar() {
  const v = $('vbar'); v.textContent = '';
  for (const [k, l, ico] of VIEWS) v.appendChild(h('button', { class: 'vtab' + (S.view === k ? ' act' : ''), role: 'tab', onclick: () => { S.view = k; GC.refresh('view'); } }, U.ico(ico), l,
    k === 'obra' ? h('span', { class: 'pill2 cnt' }, S.items().length) : null, k === 'lib' && GC.odb.lib ? h('span', { class: 'pill2 cnt' }, GC.odb.lib.list.length) : null));
  v.appendChild(h('div', { class: 'sp' }));
  v.appendChild(h('div', { class: 'scn' }, h('label', null, 'Escenari actiu:'), h('select', { onchange: e => S.setScenario(e.target.value) }, S.p.scenarios.map(s => h('option', { value: s.id, selected: s.id === S.p.active }, s.name))),
    h('button', { class: 'ib sm', title: 'Escenari nou (còpia de l\'actual)', onclick: () => UI.newScn() }, U.ico('plus'))));
}
function buildWork() {
  const w = $('work'); const sc = w.querySelector('.scroll,.pad'); const top = sc ? sc.scrollTop : 0; const view = S.view;
  if (view === 'lib') {
    if (!libEl || !libEl.isConnected) { libEl = h('div', { class: 'view' }); UI.libView(libEl); w.textContent = ''; w.appendChild(libEl); } return;
  }
  w.textContent = ''; const host = h('div', { class: 'view' }); w.appendChild(host);
  ({ obra: UI.obraView, scn: UI.scnView, ana: UI.anaView })[view](host);
  const sc2 = host.querySelector('.scroll,.pad'); if (sc2 && w._lastView === view) sc2.scrollTop = top; w._lastView = view;
}
function buildGbar() {
  const g = $('gbar'); g.textContent = ''; const ci = S.p.caseInfo; g.classList.toggle('on', !!ci); if (!ci) return;
  const gs = HP.goalStatus(); g.appendChild(h('b', null, 'Cas: ' + (ci.title || S.p.name)));
  if (gs) {
    if (gs.g.minReductionPct != null) g.appendChild(h('span', null, 'Objectiu CO₂e: ≥ −' + gs.g.minReductionPct + ' % · ara ' + (gs.red == null ? '—' : (gs.red >= 0 ? '−' : '+') + U.fmt(Math.abs(gs.red), 1) + ' %') + ' ', h('span', { class: gs.okR ? 'ok' : 'ko' }, gs.okR ? '✔' : '✘')));
    if (gs.g.maxCostIncreasePct != null) g.appendChild(h('span', null, 'Cost: ≤ +' + gs.g.maxCostIncreasePct + ' % · ara ' + (gs.dc == null ? 'cal preu a tots els elements' : U.fmtD(gs.dc, 1) + ' %') + ' ', h('span', { class: gs.okC ? 'ok' : 'ko' }, gs.okC ? '✔' : '✘')));
    g.appendChild(h('span', { class: 'mu' }, 'respecte a «' + gs.base + '»'));
  }
  g.appendChild(h('span', { class: 'sp' })); g.appendChild(h('button', { class: 'sm', onclick: () => HP.showCase() }, 'Enunciat'));
  g.appendChild(h('button', { class: 'sm ghost', title: 'Treu l\'enunciat i l\'objectiu del projecte', onclick: () => S.change(() => { S.p.caseInfo = null; }) }, 'Surt del cas'));
}
function buildFooter() { const f = $('ftinfo'), L = GC.odb.lib; f.textContent = L ? 'Font: ÖKOBAUDAT ' + (L.meta.release || '') + ' (BMWSB/BBSR) · ' + L.list.length + ' datasets' : 'Sense biblioteca'; }

GC.refresh = function (what) {
  if (!S.p) return; what = what || 'proj';
  buildMenu(); buildTbar(); buildCbar(); buildVbar(); buildGbar(); buildFooter();
  if (what === 'theme') { if (S.view !== 'lib') buildWork(); return; }
  if (S.view === 'lib') {
    if (what === 'lib' || what === 'proj' || what === 'view') { if (what === 'lib' || what === 'proj') libEl = null; buildWork(); if (what === 'view' && libEl) $('work').firstChild !== libEl && ($('work').textContent = '', $('work').appendChild(libEl)); }
    else if (what === 'set' && libEl && libEl._lib) libEl._lib.render();
    return;
  }
  buildWork();
};

/* ---------- Esdeveniments globals ---------- */
document.addEventListener('click', closeMenus);
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase(); const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); IO.saveProject(); return; }
  if ((e.ctrlKey || e.metaKey) && !typing && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? S.redo() : S.undo(); return; }
  if ((e.ctrlKey || e.metaKey) && !typing && e.key.toLowerCase() === 'y') { e.preventDefault(); S.redo(); return; }
  if (e.key === 'F1') { e.preventDefault(); HP.show(); }
});
let dragN = 0;
document.addEventListener('dragenter', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0) { dragN++; document.body.classList.add('dragging'); } });
document.addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) document.body.classList.remove('dragging'); });
document.addEventListener('dragover', e => { if (document.body.classList.contains('dragging')) e.preventDefault(); });
document.addEventListener('drop', e => { dragN = 0; document.body.classList.remove('dragging'); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) { e.preventDefault(); IO.openFile(f); } });
window.addEventListener('beforeunload', () => { S.flush && S.flush(); });

/* ---------- Init ---------- */
(async function init() {
  window.GC = GC;
  const vis = U.pref('vis', null); if (vis) Object.assign(S.ui.vis, vis);
  U.setTheme(U.pref('theme', 'dark'));
  const hasLib = await GC.odb.load().catch(() => false); await S.loadLocalSols();
  if (!(await S.loadSaved())) { S.p = S.newProject(); S.snap(); }
  S.view = hasLib ? (S.items().length ? 'obra' : 'lib') : 'lib';
  GC.refresh('proj');
  if (!GC.store.ok) U.status('Emmagatzematge del navegador no disponible: desa el projecte en JSON.', 'wr', 9000);
})();
