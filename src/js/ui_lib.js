/* guaitaCO2 — vista Biblioteca: arbre de categories, filtres, taula amb columnes A1…D i fitxa de dataset */
const UI = GC.ui = {};

/* ---------- Columnes de mòduls visibles ---------- */
S.ui.vis = { A: true, Adet: true, A4: true, B: true, C: true, D: true };
UI.visMods = function () {
  const v = S.ui.vis; let a = [];
  if (v.Adet) a = a.concat(['A1', 'A2', 'A3']); if (v.A) a.push('A1-A3'); if (v.A4) a = a.concat(['A4', 'A5']);
  if (v.B) a = a.concat(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7']); if (v.C) a = a.concat(['C1', 'C2', 'C3', 'C4']); if (v.D) a.push('D');
  return a;
};
UI.visChips = function (onChange) {
  const defs = [['A', 'A1–A3'], ['Adet', 'A1·A2·A3'], ['A4', 'A4–A5'], ['B', 'B'], ['C', 'C'], ['D', 'D']]; const cls = { A: 'gA', Adet: 'gA', A4: 'gA4', B: 'gB', C: 'gC', D: 'gD' };
  const box = h('span', { class: 'chips' }, h('span', { class: 'mu', style: { fontSize: '11px' } }, 'Columnes:'));
  for (const [k, l] of defs) {
    const c = h('span', { class: 'mchip ' + cls[k] + (S.ui.vis[k] ? ' on' : ''), title: 'Mostra o amaga les columnes ' + l, onclick: () => { S.ui.vis[k] = !S.ui.vis[k]; U.setPref('vis', S.ui.vis); c.classList.toggle('on', S.ui.vis[k]); onChange(); } }, l);
    box.appendChild(c);
  }
  return box;
};
/* capçaleres de dues files: grup + mòdul. lead/trail: nombre de columnes abans i després. */
UI.modHead = function (mods, leadCols, trailCols, sortCb, sortKey, sortDir) {
  const r1 = h('tr', { class: 'g1' }), r2 = h('tr', { class: 'g2' });
  if (leadCols.length) { r1.appendChild(h('th', { colspan: leadCols.length, style: { background: 'var(--bg-deep2)' } })); }
  for (const g of M.GROUPS) {
    const ms = g.mods.filter(m => mods.indexOf(m) >= 0); if (!ms.length) continue;
    r1.appendChild(h('th', { colspan: ms.length, 'data-g': 1, class: g.cls, style: { '--gc': 'var(--' + (g.cls === 'gA' ? 'gA' : g.cls) + ')' } }, g.t));
  }
  if (trailCols.length) r1.appendChild(h('th', { colspan: trailCols.length, style: { background: 'var(--bg-deep2)' } }));
  leadCols.forEach(c => r2.appendChild(c));
  for (const m of mods) {
    const g = M.grpOf(m);
    r2.appendChild(h('th', { class: 'num srt ' + g.cls, 'data-g': 1, style: { '--gc': 'var(--' + g.cls + ')' }, title: M.INFO[m] + (m === 'A1-A3' ? '' : ''), onclick: sortCb ? () => sortCb('m:' + m) : null }, m + (sortKey === 'm:' + m ? (sortDir > 0 ? ' ▲' : ' ▼') : '')));
  }
  trailCols.forEach(c => r2.appendChild(c));
  return h('thead', null, r1, r2);
};
UI.heat = function (v, max) {
  if (v == null || !max) return null; const a = 0.04 + 0.30 * Math.sqrt(Math.min(1, Math.abs(v) / max));
  return 'rgba(var(' + (v < 0 ? '--heat-neg' : '--heat-pos') + '),' + a.toFixed(3) + ')';
};
UI.typeTag = d => h('span', { class: 'tp ' + d.typ, title: M.TYPE_HINT[d.typ] || d.typ }, (M.TYPES[d.typ] || d.typ).slice(0, 3).toUpperCase());

/* ---------- Fitxa d'un dataset ---------- */
UI.dsDetail = async function (d, o) {
  o = o || {}; const ind = S.p.settings.ind; const rows = [];
  for (const m of M.MODS) {
    const arr = d.m[m]; if (!arr) continue;
    arr.forEach((x, i) => rows.push(h('tr', null, h('td', null, h('b', null, m)), h('td', null, x.s || (arr.length > 1 ? '—' : '')), h('td', { class: 'mu' }, x.d || ''),
      ['t', 'f', 'b', 'l'].map(k => h('td', { class: 'num', style: { fontWeight: k === ind ? '600' : '400' } }, U.fmtV(x.v[M.IND[k].i]) || '·')))));
  }
  const priceIn = h('input', { type: 'text', class: 'n', value: S.p.prices[d.id] != null ? String(S.p.prices[d.id]).replace('.', ',') : '', placeholder: '—' });
  const kv = h('dl', { class: 'kv' },
    h('dt', null, 'Tipus'), h('dd', null, UI.typeTag(d), ' ', M.TYPE_HINT[d.typ] || ''),
    h('dt', null, 'Unitat de referència'), h('dd', null, '1 ' + M.unitLabel(d.u) + (C.massPerUnit(d) && d.u !== 'kg' ? ' (≈ ' + U.fmtV(C.massPerUnit(d)) + ' kg)' : '')),
    h('dt', null, 'Categoria'), h('dd', null, d.cat.join(' ▸ ')),
    h('dt', null, 'País / any'), h('dd', null, [d.land, d.yr && ('referència ' + d.yr), d.valid && ('vàlid fins ' + d.valid)].filter(Boolean).join(' · ')),
    h('dt', null, 'Propietari'), h('dd', null, d.own || '—'),
    h('dt', null, 'Registre'), h('dd', null, [d.reg, d.op].filter(Boolean).join(' · ') || '—'),
    h('dt', null, 'Norma'), h('dd', null, d.conf || '—'),
    h('dt', null, 'Versió / UUID'), h('dd', { class: 'mono', style: { fontSize: '11px' } }, d.v + ' · ' + d.id),
    d.nd ? [h('dt', null, 'Nom (de)'), h('dd', null, d.nd)] : null,
    (d.rho || d.bulk || d.fl || d.th || d.lw || d.sw) ? [h('dt', null, 'Dades físiques'), h('dd', null, [d.rho && ('densitat bruta ' + d.rho + ' kg/m³'), d.bulk && ('densitat aparent ' + d.bulk + ' kg/m³'), d.fl && (d.fl + ' kg/m²'), d.th && ('gruix ' + d.th + ' m'), d.lw && (d.lw + ' kg/m'), d.sw && (d.sw + ' kg/peça')].filter(Boolean).join(' · '))] : null,
    d.bc ? [h('dt', null, 'Carboni biogènic'), h('dd', null, d.bc + ' kg C per unitat')] : null,
    d.url ? [h('dt', null, 'ÖKOBAUDAT'), h('dd', null, h('a', { class: 'ext', href: d.url, target: '_blank', rel: 'noopener noreferrer' }, 'Obre el dataset original'))] : null);
  const tb = h('table', { class: 'gt' }, h('thead', null, h('tr', null, ['Mòdul', 'Escenari', 'Descripció', 'GWP-total', 'Fòssil', 'Biogènic', 'Luluc'].map((x, i) => h('th', { class: i > 2 ? 'num' : '' }, x)))), h('tbody', null, rows));
  const hasA = !d.m['A1-A3'] && d.m['A1'] && d.m['A2'] && d.m['A3'];
  const body = h('div', null, kv, h('h4', null, 'Valors per ' + M.unitLabel(d.u) + ' (kg CO₂e)'), h('div', { class: 'scroll', style: { maxHeight: '38vh' } }, tb),
    h('div', { class: 'hint' }, 'Una cel·la buida («·») vol dir que el mòdul no està declarat: no és zero. ' + (hasA ? 'A1–A3 es calcula com a suma d\'A1, A2 i A3. ' : '') + 'Si un mòdul té diverses variants d\'escenari, s\'usa per defecte la que no porta escenari (o S0/S1) i es pot canviar a l\'element.'),
    h('div', { class: 'row' }, h('label', null, 'Preu propi (€ per ' + M.unitLabel(d.u) + '):'), priceIn, h('span', { class: 'mu' }, 'Opcional. Permet calcular Δ€ a les alternatives.')));
  const btns = [{ l: 'Tanca', v: 'close' }];
  if (o.onPick) btns.push({ l: o.pickLabel || 'Tria aquest dataset', v: 'pick', pri: 1 }); else if (!o.noAdd) btns.push({ l: 'Afegeix a l\'obra', v: 'add', pri: 1 });
  const r = await U.modal(d.n, body, btns, { cls: 'wide' });
  const pv = U.numIn(priceIn.value); const cur = S.p.prices[d.id];
  if (priceIn.value.trim() === '' ? cur != null : (!isNaN(pv) && pv !== cur)) S.setPrice(d.id, priceIn.value.trim() === '' ? null : pv);
  if (r === 'pick' && o.onPick) o.onPick(d); else if (r === 'add') { S.addFromDs(d); U.status('«' + d.n + '» afegit a l\'obra.', 'ok', 3500); }
};

/* ---------- Vista Biblioteca (també dins d'un modal en mode «tria») ---------- */
UI.libView = function (host, o) {
  o = o || {};
  const st = { q: o.q || '', path: [], types: { average: true, generic: true, specific: true, template: false, representative: false }, unit: o.unit || '', land: '', mod: '', sortK: 'n', sortD: 1, lim: 250, open: new Set(), sel: null };
  const L = GC.odb.lib;
  if (!L) {
    host.appendChild(h('div', { class: 'pad', style: { flex: 1 } }, h('div', { class: 'welcome' },
      h('h1', null, 'Guaita', h('em', null, 'CO2')), h('p', null, 'Compara materials i solucions constructives pel seu CO₂e, no només pel cost. Les dades vénen de la base oberta ÖKOBAUDAT (BMWSB/BBSR), que cada usuari carrega al seu navegador.'),
      h('div', { class: 'bt' }, h('a', { class: 'abtn', href: GC.SRC.csv, target: '_blank', rel: 'noopener noreferrer', title: 'Descarrega el CSV d\'ÖKOBAUDAT 2024-II (punt decimal) des de oekobaudat.de' }, U.ico('dl'), ' Descarrega ÖKOBAUDAT'), h('button', { class: 'pri', onclick: () => IO.pick('.csv') }, 'Importa el CSV d\'ÖKOBAUDAT…')),
      h('p', { class: 'mu' }, 'Descarrega «ÖKOBAUDAT 2024-II as a CSV file with a period as the decimal separator» a ', h('a', { class: 'ext', href: 'https://www.oekobaudat.de/en/service/downloads.html', target: '_blank', rel: 'noopener noreferrer' }, 'oekobaudat.de ▸ Downloads'), ' i arrossega\'l aquí o fes servir el botó. El fitxer (~50 MB) es llegeix en local, es filtra a EN 15804+A2 i es desa al navegador; no es puja enlloc.'),
      h('p', { class: 'mu' }, 'També pots obrir un projecte o un cas didàctic (JSON): inclouen els valors dels datasets que fan servir.'),
      h('div', { class: 'bt' }, h('button', { onclick: () => IO.pick('.json') }, 'Obre un projecte o cas (JSON)…'), h('button', { onclick: () => { S.view = 'obra'; GC.refresh('view'); } }, 'Ves a l\'obra')))));
    return;
  }
  if (!o.onPick) { const sv = U.pref('libf', null); if (sv && typeof sv === 'object') { Object.assign(st, sv); if (st.unit && !L.counts.units[st.unit]) st.unit = ''; for (let k = 1; k <= st.path.length; k++) st.open.add(st.path.slice(0, k).join('\u0001')); } }
  const left = h('div', { class: 'col', style: { width: '270px', flex: 'none', borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' } });
  const right = h('div', { class: 'col', style: { flex: 1 } });
  host.appendChild(left); host.appendChild(right);
  const qIn = h('input', { type: 'search', placeholder: 'Cerca…', title: 'Cerca per nom, categoria, fabricant o país', value: st.q, oninput: () => { st.q = qIn.value; st.lim = 250; renderTable(); } });
  const unitSel = h('select', { onchange: () => { st.unit = unitSel.value; st.lim = 250; renderTable(); } }, h('option', { value: '' }, 'Totes les unitats'),
    Object.keys(L.counts.units).sort((a, b) => L.counts.units[b] - L.counts.units[a]).map(u => h('option', { value: u, selected: st.unit === u }, M.unitLabel(u) + ' (' + L.counts.units[u] + ')')));
  if (o.unit) unitSel.disabled = !!o.lockUnit;
  const landSel = h('select', { onchange: () => { st.land = landSel.value; st.lim = 250; renderTable(); } }, h('option', { value: '' }, 'Tots els països'),
    Object.keys(L.counts.lands).sort((a, b) => L.counts.lands[b] - L.counts.lands[a]).map(u => h('option', { value: u }, (u || '—') + ' (' + L.counts.lands[u] + ')')));
  const modSel = h('select', { onchange: () => { st.mod = modSel.value; st.lim = 250; renderTable(); } }, h('option', { value: '' }, 'Qualsevol mòdul'), ['A1-A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'C1', 'C2', 'C3', 'C4', 'D'].map(m => h('option', { value: m }, 'Amb ' + m)));
  landSel.value = st.land; modSel.value = st.mod;
  const typBox = h('div', { class: 'typ' }, Object.keys(M.TYPES).map(k => h('label', { title: M.TYPE_HINT[k] }, h('input', { type: 'checkbox', checked: !!st.types[k], onchange: e => { st.types[k] = e.target.checked; st.lim = 250; renderTable(); } }), M.TYPES[k])));
  const tree = h('div', { class: 'ctree' });
  left.appendChild(h('div', { class: 'lfilt' }, h('div', { class: 'r' }, h('span', { class: 'srch-in' }, U.ico('search'), qIn)), h('div', { class: 'r' }, unitSel, landSel), h('div', { class: 'r' }, modSel), typBox));
  left.appendChild(tree);
  const info = h('span', { class: 'info' });
  const head = h('div', { class: 'lhead' }, UI.visChips(() => renderTable()), info);
  const sc = h('div', { class: 'scroll' }); right.appendChild(head); if (o.banner) right.insertBefore(h('div', { class: 'banner' }, o.banner), head); right.appendChild(sc);

  function renderTree() {
    tree.textContent = '';
    const row = (nd, lv, isRoot) => {
      const key = nd.path.join('\u0001'); const has = nd.kids.size > 0; const op = st.open.has(key); const sel = st.path.join('\u0001') === key;
      const el = h('div', { class: 'cn' + (sel ? ' sel' : '') + (op ? ' op' : ''), style: { '--lv': lv }, onclick: () => { st.path = nd.path.slice(); if (has) st.open.add(key); st.lim = 250; renderTree(); renderTable(); } },
        h('span', { class: 'tg', onclick: e => { if (!has) return; e.stopPropagation(); if (st.open.has(key)) st.open.delete(key); else st.open.add(key); renderTree(); } }, has ? U.ico('chev') : null),
        h('span', { class: 'nm', title: isRoot ? '' : nd.name }, isRoot ? 'Totes les categories' : nd.name), h('span', { class: 'n' }, nd.n));
      tree.appendChild(el);
      if (op || isRoot) Array.from(nd.kids.values()).sort((a, b) => a.name.localeCompare(b.name)).forEach(k => row(k, lv + (isRoot ? 0 : 1), false));
    };
    row(L.tree, 0, true);
  }
  function renderTable() {
    const f = { q: st.q, path: st.path, types: st.types, unit: st.unit, land: st.land, mod: st.mod };
    let list = GC.odb.filter(f); const ind = S.p.settings.ind;
    const keyOf = st.sortK;
    if (keyOf !== 'n') { const mm = keyOf.slice(2); const val = d => { const v = C.val(d, mm, ind); return v; };
      list = list.map(d => [d, val(d)]).sort((a, b) => (a[1] == null) - (b[1] == null) || (a[1] - b[1]) * st.sortD).map(x => x[0]); }
    else if (st.sortD < 0) list = list.slice().reverse();
    st.list = list; const mods = UI.visMods(); sc.scrollTop = 0;
    const max = {}; for (const m of mods) { let mx = 0; for (const d of list) { const v = C.val(d, m, ind); if (v != null && Math.abs(v) > mx) mx = Math.abs(v); } max[m] = mx; }
    const sortCb = k => { if (st.sortK === k) st.sortD = -st.sortD; else { st.sortK = k; st.sortD = 1; } renderTable(); };
    const lead = [h('th', { class: 'stk srt', onclick: () => sortCb('n'), style: { minWidth: '280px' } }, 'Dataset' + (st.sortK === 'n' ? (st.sortD > 0 ? ' ▲' : ' ▼') : '')), h('th', null, 'Tipus'), h('th', null, 'Ud'), h('th', null, 'País'), h('th', null, 'Any')];
    const thead = UI.modHead(mods, lead.slice(), [], sortCb, st.sortK, st.sortD);
    const body = h('tbody'); const nCols = 5 + mods.length, RH = 31;
    const mkRow = d => {
      const tr = h('tr', { class: st.sel === d.id ? 'sel' : '', ondblclick: () => UI.dsDetail(d, o.onPick ? { onPick: o.onPick, pickLabel: o.pickLabel } : {}) });
      const act = h('button', { class: 'ib sm', title: o.onPick ? (o.pickLabel || 'Tria') : 'Afegeix a l\'obra', onclick: e => { e.stopPropagation(); if (o.onPick) o.onPick(d); else { S.addFromDs(d); U.status('«' + d.n + '» afegit a l\'obra.', 'ok', 3000); } } }, U.ico(o.onPick ? 'link' : 'plus'));
      tr.appendChild(h('td', { class: 'stk nm', title: d.n + (d.nd ? '\n' + d.nd : '') + '\n' + d.cat.join(' ▸ ') }, act, ' ', h('a', { class: 'ext', style: { cursor: 'pointer', color: 'var(--text)' }, onclick: () => { st.sel = d.id; UI.dsDetail(d, o.onPick ? { onPick: o.onPick, pickLabel: o.pickLabel } : {}); } }, d.n)));
      tr.appendChild(h('td', null, UI.typeTag(d))); tr.appendChild(h('td', null, M.unitLabel(d.u))); tr.appendChild(h('td', null, d.land)); tr.appendChild(h('td', { class: 'mu' }, d.yr));
      for (const m of mods) {
        const v = C.val(d, m, ind); const arr = d.m[m];
        if (v == null) tr.appendChild(h('td', { class: 'nd', title: 'Sense dada: mòdul no declarat' }, '·'));
        else tr.appendChild(h('td', { class: 'num', style: { background: UI.heat(v, max[m]) }, title: (arr && arr.length > 1 ? arr.length + ' variants d\'escenari' : '') }, U.fmtV(v) + (arr && arr.length > 1 ? '*' : '')));
      }
      return tr;
    };
    let vs = -1, ve = -1;
    const paint = force => {
      const top = Math.max(0, sc.scrollTop - 50), hgt = sc.clientHeight || 600;
      const s0 = Math.max(0, Math.floor(top / RH) - 6), e0 = Math.min(list.length, Math.ceil((top + hgt) / RH) + 6);
      if (!force && vs >= 0 && s0 >= vs && e0 <= ve) return;
      vs = Math.max(0, s0 - 25); ve = Math.min(list.length, e0 + 25); body.textContent = '';
      if (vs > 0) body.appendChild(h('tr', { class: 'spc', style: { height: vs * RH + 'px' } }, h('td', { colspan: nCols })));
      for (let i = vs; i < ve; i++) body.appendChild(mkRow(list[i]));
      if (ve < list.length) body.appendChild(h('tr', { class: 'spc', style: { height: (list.length - ve) * RH + 'px' } }, h('td', { colspan: nCols })));
    };
    sc.textContent = ''; let rq = false;
    sc.onscroll = () => { if (!rq) { rq = true; requestAnimationFrame(() => { rq = false; paint(); }); } };
    if (!list.length) sc.appendChild(h('div', { class: 'empty' }, 'Cap dataset coincideix amb els filtres.'));
    else { sc.appendChild(h('table', { class: 'gt vt' }, thead, body)); paint(true); }
    if (!o.onPick) U.setPref('libf', { q: st.q, path: st.path, types: st.types, unit: st.unit, land: st.land, mod: st.mod, sortK: st.sortK, sortD: st.sortD });
    const m = L.meta; info.textContent = list.length + ' de ' + L.list.length + ' datasets · ' + M.IND[ind].l + ' en kg CO₂e per unitat del dataset · ÖKOBAUDAT ' + (m.release || '');
    if (o.exportBtn !== false && !head.querySelector('.xp')) head.insertBefore(h('button', { class: 'xp', title: 'Exporta els datasets filtrats a CSV', onclick: () => IO.exportLibCsv(st.list) }, 'CSV'), info);
  }
  renderTree(); renderTable();
  host._lib = { st, render: renderTable };
};
