/* guaitaCO2 — vista Obra: taula d'elements (dataset + quantitat + factor) amb columnes de mòdul i totals */

/* tria un dataset de la biblioteca en un modal; retorna el dataset o null */
UI.pickDs = function (o) {
  o = o || {};
  return new Promise(res => {
    if (!GC.odb.lib) { U.info('Biblioteca buida', h('div', null, 'Primer cal importar el CSV d\'ÖKOBAUDAT (menú Fitxer ▸ Importa ÖKOBAUDAT).')); res(null); return; }
    const host = h('div', { class: 'view', style: { height: '68vh', border: '1px solid var(--border)' } });
    U.modal(o.title || 'Tria un dataset', host, [{ l: 'Cancel·la', v: false }], {
      cls: 'vwide', noFocus: true,
      onOpen: (m, close) => UI.libView(host, Object.assign({ pickLabel: 'Tria' }, o, { onPick: d => { close(true); res(d); } }))
    }).then(v => { if (!v) res(null); });
  });
};
UI.assign = async function (itemId) {
  const it = S.item(itemId); if (!it) return; const iu = M.itemUnit(it.unit);
  const d = await UI.pickDs({ title: 'Dataset per a «' + (it.name || 'element') + '»', q: '', unit: iu !== '?' && M.UNITS[iu] ? '' : '', banner: 'Unitat de l\'element: ' + M.unitLabel(iu) + '. Si el dataset té una altra unitat, es proposarà un factor de conversió.' });
  if (!d) return; S.assignDs(itemId, d); const it2 = S.item(itemId);
  if (it2 && it2.convWarn) { U.status('No hi ha factor de conversió automàtic: indica\'l a l\'element.', 'wr', 7000); UI.itemDlg(itemId); }
};

/* mòduls del grup (per ordre) amb nombre de variants */
UI.itemDlg = async function (itemId, isNew) {
  const it = S.item(itemId); if (!it) return; if (it.layers) return UI.solDlg(itemId, isNew); const ds = S.dsOf(it.dsId);
  const f = {
    name: h('input', { type: 'text', value: it.name, style: { width: '100%' } }),
    group: h('input', { type: 'text', value: it.group || '', list: 'dlGroups', style: { width: '100%' } }),
    qty: h('input', { type: 'text', class: 'n', value: String(it.qty).replace('.', ',') }),
    unit: h('input', { type: 'text', class: 'n', value: it.unit, style: { width: '70px' } }),
    conv: h('input', { type: 'text', class: 'n', value: String(it.conv).replace('.', ',') }),
    price: h('input', { type: 'text', class: 'n', value: it.price != null ? String(it.price).replace('.', ',') : '', placeholder: 'del dataset' }),
    rsl: h('input', { type: 'text', class: 'n', value: it.rsl ? String(it.rsl).replace('.', ',') : '', placeholder: 'anys' }),
    note: h('textarea', { value: it.note || '', style: { width: '100%', height: '50px' } })
  };
  const groups = Array.from(new Set(S.items().map(i => i.group).filter(Boolean)));
  const dl = h('datalist', { id: 'dlGroups' }, groups.map(g => h('option', { value: g })));
  const sugg = h('div', { class: 'hint' });
  const b4info = (() => { if (!ds) return null; const x = C.modsOf(it, ds, Object.assign(S.ctx(), { b4mode: 'rsl' })); const dsv = C.modsOf(it, ds, Object.assign(S.ctx(), { b4mode: 'dataset' })).b4ds; return h('span', { class: 'mu' }, 'B4 dataset: ' + (dsv == null ? '·' : U.fmtV(dsv * S.kscale())) + ' · B4 per vida útil (' + S.p.settings.period + ' anys): ' + (x.b4rsl == null ? '·' : U.fmtV(x.b4rsl * S.kscale()) + ' (' + x.b4n + ' subst.)')); })();
  const upSugg = () => {
    sugg.textContent = ''; if (!ds) return; const s = C.suggest(f.unit.value, ds);
    if (s) { sugg.appendChild(document.createTextNode('Suggeriment: factor ' + U.fmtV(s.f) + ' (' + s.why + ') '));
      if (Math.abs(s.f - U.numIn(f.conv.value)) > 1e-12) sugg.appendChild(h('button', { class: 'sm', onclick: () => { f.conv.value = String(s.f).replace('.', ','); upSugg(); } }, 'Aplica')); }
    else if (M.itemUnit(f.unit.value) !== ds.u) sugg.appendChild(h('span', { class: 'warnx' }, 'Cap factor automàtic de ' + M.unitLabel(M.itemUnit(f.unit.value)) + ' a ' + M.unitLabel(ds.u) + ': introdueix-lo (quantitat en ' + M.unitLabel(ds.u) + ' per cada ' + M.unitLabel(M.itemUnit(f.unit.value)) + ').'));
  };
  f.unit.addEventListener('input', upSugg); f.conv.addEventListener('input', upSugg);
  const vi = Object.assign({}, it.vi || {}); const vsel = [];
  if (ds) for (const m of M.MODS) { const arr = ds.m[m]; if (arr && arr.length > 1) {
    const cur = vi[m] != null ? vi[m] : C.pickDef(arr);
    vsel.push(h('div', { class: 'row' }, h('label', { style: { width: '60px' } }, h('b', null, m)), h('select', { onchange: e => { vi[m] = Number(e.target.value); } },
      arr.map((x, i) => h('option', { value: i, selected: i === cur }, (x.s || 'sense escenari') + ' · ' + U.fmtV(x.v[M.IND[S.p.settings.ind].i]) + (x.d ? ' · ' + x.d.slice(0, 70) : ''))))));
  } }
  let chosen = ds;
  const dsLine = h('div', { class: 'row' }, h('span', { id: 'dlgDs' }, ds ? ds.n : 'Sense dataset'), h('button', { class: 'sm', onclick: async () => { const d = await UI.pickDs({ title: 'Dataset per a l\'element' }); if (d) { chosen = d; document.getElementById('dlgDs').textContent = d.n; vsel.length = 0; const s = C.suggest(f.unit.value, d); if (s && M.itemUnit(f.unit.value) !== d.u) { f.conv.value = String(s.f).replace('.', ','); } else if (M.itemUnit(f.unit.value) === '?' || M.itemUnit(f.unit.value) === d.u) { f.unit.value = d.u; f.conv.value = '1'; } if (!f.name.value.trim()) f.name.value = d.n; } } }, 'Canvia…'));
  const body = h('div', null, dl,
    h('div', { class: 'f' }, h('label', null, 'Nom'), f.name), h('div', { class: 'f' }, h('label', null, 'Grup (p. ex. Estructura, Façana…)'), f.group),
    h('div', { class: 'f' }, h('label', null, 'Dataset d\'ÖKOBAUDAT'), dsLine),
    h('div', { class: 'row' }, h('label', null, 'Quantitat'), f.qty, h('label', null, 'Unitat'), f.unit, h('label', { title: 'Quantitat en unitats del dataset per cada unitat de l\'element' }, 'Factor'), f.conv),
    sugg, h('div', { class: 'row' }, h('label', { title: 'Vida útil de referència (RSL). Permet calcular B4 segons el període d\'estudi.' }, 'Vida útil (anys)'), f.rsl, b4info),
    h('div', { class: 'row' }, h('label', null, 'Preu (€/' + (f.unit.value || 'ud') + ')'), f.price, h('span', { class: 'mu' }, 'Buit = preu del dataset × factor, si n\'hi ha.')),
    vsel.length ? h('div', null, h('h4', null, 'Variants d\'escenari'), vsel) : null,
    h('div', { class: 'f' }, h('label', null, 'Nota'), f.note));
  upSugg();
  const r = await U.modal(isNew ? 'Element nou' : 'Element', body, [{ l: 'Elimina', v: 'del' }, { l: 'Converteix en solució per capes', v: 'sol' }, { l: 'Cancel·la', v: false }, { l: 'Accepta', v: true, pri: 1 }], { cls: 'wide' });
  if (r === 'del') { S.delItem(itemId); return; } if (r === 'sol') { S.toSolution(itemId); UI.solDlg(itemId); return; } if (!r) return;
  S.change(() => {
    const q = U.numIn(f.qty.value), cv = U.numIn(f.conv.value), pr = U.numIn(f.price.value), rs = U.numIn(f.rsl.value);
    it.name = f.name.value.trim(); it.group = f.group.value.trim(); it.qty = isNaN(q) || q == null ? 0 : q; it.unit = f.unit.value.trim() || '?';
    it.rsl = rs == null || isNaN(rs) || rs <= 0 ? null : rs; it.conv = isNaN(cv) || cv == null ? 1 : cv; it.price = pr == null || isNaN(pr) ? null : pr; it.note = f.note.value;
    if (chosen && chosen.id !== it.dsId) { S.keepDs(chosen); it.dsId = chosen.id; it.vi = null; } else if (Object.keys(vi).length) it.vi = vi;
    const d2 = S.dsOf(it.dsId); if (d2 && M.itemUnit(it.unit) !== d2.u && !C.suggest(it.unit, d2) && it.conv === 1) it.convWarn = true; else delete it.convWarn;
  });
};

UI.statusTag = function (r) {
  const t = { ok: ['OK', 'Tots els mòduls comptats tenen dada'], pa: ['PAR', 'Dades parcials: algun mòdul comptat no està declarat (no compta com a zero)'], no: ['SENSE', 'Sense dataset o sense dades als mòduls comptats'] }[r.status];
  return h('span', { class: 'q ' + r.status, title: t[1] }, t[0]);
};

UI.obraView = function (host) {
  const res = S.res(); const ks = S.kscale(); const mods = UI.visMods(); const ind = S.p.settings.ind; const items = S.items();
  const head = h('div', { class: 'lhead' }, UI.visChips(() => GC.refresh('view')),
    h('button', { onclick: () => S.addBlank() && UI.itemDlg(S.sel, true) }, U.ico('plus'), ' Element'),
    h('button', { onclick: async () => { const d = await UI.pickDs({ title: 'Afegeix un dataset a l\'obra' }); if (d) { S.addFromDs(d); } } }, U.ico('fromLib'), ' Des de la biblioteca'),
    h('button', { title: 'Solucions per capes (mur, forjat, coberta…)', onclick: () => UI.solLib() }, U.ico('layers'), ' Solucions'),
    UI.bulkBar(),
    h('span', { class: 'info' }, items.length + ' elements · ' + M.IND[ind].l + ' en ' + S.kunit() + ' · mòduls comptats: ' + (S.p.settings.counted.join(', ') || 'cap')));
  const sc = h('div', { class: 'scroll' });
  host.appendChild(h('div', { class: 'col', style: { flex: 1 } }, head, sc));
  if (!items.length) {
    sc.appendChild(h('div', { class: 'empty' }, h('p', null, 'L\'obra és buida. Afegeix elements des de la biblioteca d\'ÖKOBAUDAT, importa un CSV de mesuraments, o carrega un cas didàctic.'),
      h('div', { class: 'bt' }, h('button', { class: 'pri', onclick: () => { S.view = 'lib'; GC.refresh('view'); } }, 'Ves a la biblioteca'), h('button', { onclick: () => IO.pick('.csv,.json') }, 'Importa CSV d\'elements…'))));
    return;
  }
  const max = {}; for (const m of mods) { let mx = 0; for (const x of res.rows) { const v = x.r.mods[m]; if (v != null && Math.abs(v) > mx) mx = Math.abs(v); } max[m] = mx; }
  const lead = ['#', 'Element', 'Grup', 'Dataset', 'Quantitat', 'Ud', 'Factor', 'Dada'].map((t, i) => h('th', { class: i === 1 ? 'stk' : (i === 4 || i === 6 ? 'num' : ''), style: i === 1 ? { minWidth: '250px' } : null }, i === 1 ? [h('input', { type: 'checkbox', title: 'Selecciona\'ls tots', checked: items.length > 0 && items.every(x => UI.multi.has(x.id)), onchange: e => { if (e.target.checked) items.forEach(x => UI.multi.add(x.id)); else UI.multi.clear(); GC.refresh('view'); } }), ' ', t] : t));
  const trail = [h('th', { class: 'num', title: 'Suma dels mòduls comptats' }, 'Total ' + S.kunit()), h('th', { class: 'num' }, '% obra'), h('th', { class: 'num', title: 'Preu unitari (€ per unitat de l\'element)' }, '€/ud'), h('th', { class: 'num' }, 'Cost €'), h('th', null, '')];
  const thead = UI.modHead(mods, lead, trail);
  const tb = h('tbody'); const tot = res.total;
  const numCell = (val, onc, w) => { const i = h('input', { type: 'text', class: 'n', value: val, style: w ? { width: w } : null, onchange: () => onc(i.value) }); return i; };
  res.rows.forEach((x, n) => {
    const it = x.it, r = x.r;
    const tr = h('tr', { class: S.sel === it.id ? 'sel' : '', onclick: () => { if (S.sel !== it.id) { S.sel = it.id; Array.from(tb.children).forEach(t => t.classList.remove('sel')); tr.classList.add('sel'); } } });
    tr.appendChild(h('td', { class: 'mu' }, n + 1));
    tr.appendChild(h('td', { class: 'stk' }, h('input', { type: 'checkbox', checked: UI.multi.has(it.id), onclick: e => { e.stopPropagation(); if (e.shiftKey && UI.lastChk) { const a = items.findIndex(q => q.id === UI.lastChk), b = items.findIndex(q => q.id === it.id); for (let k = Math.min(a, b); k <= Math.max(a, b); k++) UI.multi.add(items[k].id); } else if (e.target.checked) UI.multi.add(it.id); else UI.multi.delete(it.id); UI.lastChk = it.id; GC.refresh('view'); } }), ' ', h('input', { type: 'text', value: it.name, style: { minWidth: '210px', width: 'calc(100% - 24px)' }, onchange: e => S.change(() => { it.name = e.target.value; }) })));
    tr.appendChild(h('td', null, h('input', { type: 'text', value: it.group || '', list: 'dlGroups2', style: { width: '110px' }, onchange: e => S.change(() => { it.group = e.target.value.trim(); }) })));
    tr.appendChild(it.layers ? h('td', { class: 'nm', title: it.layers.map(l => ((S.dsOf(l.dsId) || {}).n || '?') + ' × ' + l.qty).join('\n') }, h('button', { class: 'ib sm', title: 'Edita les capes', onclick: e => { e.stopPropagation(); UI.solDlg(it.id); } }, U.ico('layers')), ' ', h('span', { class: 'tp specific' }, 'SOL'), ' ', it.layers.length + ' capes: ', h('span', { class: 'mu' }, it.layers.map(l => ((S.dsOf(l.dsId) || {}).n || '?').slice(0, 22)).join(' + ')))
      : h('td', { class: 'nm', title: x.ds ? x.ds.n + '\n' + x.ds.cat.join(' ▸ ') : '' }, h('button', { class: 'ib sm', title: 'Assigna o canvia el dataset', onclick: e => { e.stopPropagation(); UI.assign(it.id); } }, U.ico('link')), ' ',
      x.ds ? [UI.typeTag(x.ds), ' ', x.ds.n, ' ', h('span', { class: 'mu' }, '(' + M.unitLabel(x.ds.u) + ')')] : h('span', { class: 'warnx' }, 'sense dataset')));
    tr.appendChild(h('td', null, numCell(String(it.qty).replace('.', ','), v => { const q = U.numIn(v); S.change(() => { it.qty = q == null || isNaN(q) ? 0 : q; }); })));
    tr.appendChild(h('td', null, h('input', { type: 'text', value: it.unit, style: { width: '52px' }, onchange: e => S.change(() => { it.unit = e.target.value.trim() || '?'; const d = S.dsOf(it.dsId); if (d) { const s = C.suggest(it.unit, d); if (s) { it.conv = s.f; delete it.convWarn; } } }) })));
    tr.appendChild(h('td', { class: 'num' }, numCell(String(it.conv).replace('.', ','), v => { const c = U.numIn(v); S.change(() => { it.conv = c == null || isNaN(c) ? 1 : c; delete it.convWarn; }); }, '70px'),
      it.convWarn ? h('span', { class: 'warnx', title: 'Unitats diferents sense factor de conversió: revisa\'l' }, ' ⚠') : null));
    tr.appendChild(h('td', null, UI.statusTag(r)));
    for (const m of mods) {
      const v = r.mods[m]; const cnt = M.COUNTABLE.indexOf(m) >= 0 && S.p.settings.counted.indexOf(m) >= 0;
      if (v == null) tr.appendChild(h('td', { class: 'nd', title: x.ds ? 'Sense dada (no és zero)' : 'Sense dataset' }, '·'));
      else { const alt = m === 'B4' && !r.composite && r.b4rsl != null ? (S.p.settings.b4mode === 'rsl' ? ['dataset', r.b4ds] : ['vida', r.b4rsl]) : null;
        tr.appendChild(h('td', { class: 'num', title: r.partial && r.partial[m] === false ? 'Alguna capa no declara aquest mòdul' : (alt ? 'B4 segons ' + (S.p.settings.b4mode === 'rsl' ? 'vida útil; alternativa: dataset' : 'dataset; alternativa: vida útil') : ''), style: { background: UI.heat(v, max[m]), fontWeight: cnt ? '600' : '400', opacity: cnt || m === 'D' ? 1 : .6 } }, U.fmtV(v * ks) + (r.partial && r.partial[m] === false ? '*' : ''), alt ? h('div', { class: 'mu', style: { fontSize: '10px', fontWeight: '400' } }, alt[0] + ' ' + (alt[1] == null ? '·' : U.fmtV(alt[1] * ks))) : null)); }
    }
    tr.appendChild(h('td', { class: 'num', style: { fontWeight: '600' } }, r.nd || !S.p.settings.counted.length ? U.fmtV(r.tot * ks) : '·'));
    tr.appendChild(h('td', { class: 'num mu' }, tot > 0 && r.tot > 0 ? U.fmt(r.tot / tot * 100, 1) + ' %' : ''));
    tr.appendChild(h('td', { class: 'num' }, numCell(r.up != null ? String(Math.round(r.up * 1e4) / 1e4).replace('.', ',') : '', v => { const p = U.numIn(v); S.change(() => { it.price = p == null || isNaN(p) ? null : p; }); }, '70px')));
    tr.appendChild(h('td', { class: 'num' }, r.cost != null ? U.fmt(r.cost, 2) : h('span', { class: 'nd' }, '·')));
    tr.appendChild(h('td', { class: 'act' },
      h('button', { class: 'ib', title: 'Alternatives amb menys CO₂e', onclick: e => { e.stopPropagation(); UI.altDlg(it.id); } }, U.ico('swap')),
      h('button', { class: 'ib', title: 'Edita l\'element', onclick: e => { e.stopPropagation(); UI.itemDlg(it.id); } }, U.ico('doc')),
      h('button', { class: 'ib', title: 'Duplica', onclick: e => { e.stopPropagation(); S.dupItem(it.id); } }, U.ico('copy')),
      h('button', { class: 'ib', title: 'Elimina', onclick: e => { e.stopPropagation(); S.delItem(it.id); } }, U.ico('trash'))));
    tb.appendChild(tr);
  });
  const foot = h('tfoot', null, h('tr', null, h('td', { colspan: 2, class: 'stk' }, 'Total obra'), h('td', { colspan: 6 }, res.n + ' elements · ' + res.ok + ' OK · ' + res.pa + ' parcials · ' + res.no + ' sense dada'),
    mods.map(m => res.mods[m].n ? h('td', { class: 'num' }, U.fmtV(res.mods[m].sum * ks)) : h('td', { class: 'nd' }, '·')),
    h('td', { class: 'num' }, U.fmtV(res.total * ks)), h('td'), h('td'), h('td', { class: 'num' }, U.fmt(res.cost, 2) + (res.costMiss ? '*' : '')), h('td')));
  sc.appendChild(h('table', { class: 'gt' }, thead, tb, foot));
  const groups = Array.from(new Set(items.map(i => i.group).filter(Boolean)));
  sc.appendChild(h('datalist', { id: 'dlGroups2' }, groups.map(g => h('option', { value: g }))));
  const notes = [];
  if (res.no + res.pa) notes.push('Els elements amb dada parcial o sense dada NO compten com a zero: el total és un mínim fins que s\'hi assigni dataset.');
  if (res.costMiss) notes.push('* El cost només suma els elements amb preu.');
  notes.push('D (fora dels límits) es mostra a part i no se suma al total. Una cel·la «·» és mòdul no declarat, no zero.');
  sc.appendChild(h('div', { class: 'hint', style: { padding: '8px 14px' } }, notes.join(' ')));
};

/* ---------- Selecció múltiple i edició massiva ---------- */
UI.multi = new Set(); UI.lastChk = null;
UI.bulkBar = function () {
  const ids = new Set(S.items().map(i => i.id)); for (const id of Array.from(UI.multi)) if (!ids.has(id)) UI.multi.delete(id);
  const n = UI.multi.size; if (!n) return null; const sel = () => S.items().filter(i => UI.multi.has(i.id));
  return h('span', { class: 'bulk' }, h('b', null, n + ' seleccionats'),
    h('button', { class: 'sm', onclick: async () => { if (await U.confirm('Elimina elements', 'S\'eliminaran ' + n + ' elements de l\'escenari actiu (es pot desfer).', 'Elimina')) { S.change(() => { const a = S.items(); for (const it of sel()) a.splice(a.indexOf(it), 1); }); UI.multi.clear(); GC.refresh('view'); } } }, 'Elimina'),
    h('button', { class: 'sm', onclick: () => { S.change(() => { const a = S.items(); for (const it of sel()) { const c = U.clone(it); c.id = U.uid(); c.name += ' (còpia)'; a.push(c); } }); } }, 'Duplica'),
    h('button', { class: 'sm', onclick: async () => { const a = await U.ask('Grup dels elements seleccionats', [{ k: 'g', l: 'Grup', v: '' }]); if (a) S.change(() => { for (const it of sel()) it.group = a.g.trim(); }); } }, 'Grup…'),
    h('button', { class: 'sm', onclick: async () => { const a = await U.ask('Vida útil dels elements seleccionats', [{ k: 'r', l: 'Anys (buit = sense vida útil)', v: '' }]); if (a) { const v = U.numIn(a.r); S.change(() => { for (const it of sel()) if (!it.layers) it.rsl = v == null || isNaN(v) || v <= 0 ? null : v; }); } } }, 'Vida útil…'),
    h('button', { class: 'sm', onclick: async () => { const a = await U.ask('Preu dels elements seleccionats', [{ k: 'p', l: '€ per unitat de l\'element (buit = preu del dataset)', v: '' }]); if (a) { const v = U.numIn(a.p); S.change(() => { for (const it of sel()) it.price = v == null || isNaN(v) ? null : v; }); } } }, 'Preu…'),
    h('button', { class: 'sm ghost', onclick: () => { UI.multi.clear(); GC.refresh('view'); } }, 'Treu la selecció'));
};

/* ---------- Solucions per capes ---------- */
UI.layersEditor = function (layers, o) {
  o = o || {}; const box = h('div'); const per = () => S.p.settings.period;
  const draw = () => {
    box.textContent = ''; const c = S.ctx(); let sumA = 0, anyA = false; const tb = h('tbody');
    const dsOf = id => S.dsOf(id) || (o.dsMap && o.dsMap[id]) || null;
    layers.forEach((l, i) => {
      const ds = dsOf(l.dsId); const r = C.modsOf({ qty: Number(l.qty) || 0, conv: l.conv == null ? 1 : l.conv, vi: l.vi, rsl: l.rsl }, ds, Object.assign({}, c, { ds: dsOf })); const a = r.mods['A1-A3']; if (a != null) { sumA += a; anyA = true; }
      const inp = (key, w, num) => h('input', { type: 'text', class: num ? 'n' : '', value: l[key] == null ? '' : String(l[key]).replace('.', ','), style: { width: w }, onchange: e => { if (num) { const v = U.numIn(e.target.value); l[key] = (v == null || isNaN(v)) ? (key === 'rsl' ? null : (key === 'conv' ? 1 : 0)) : v; } else l[key] = e.target.value; draw(); } });
      tb.appendChild(h('tr', null, h('td', { class: 'mu' }, i + 1), h('td', null, inp('name', '160px')),
        h('td', { class: 'nm', title: ds ? ds.n + '\n' + ds.cat.join(' ▸ ') : '' }, h('button', { class: 'ib sm', title: 'Canvia el dataset', onclick: async () => { const d = await UI.pickDs({ title: 'Dataset per a la capa «' + l.name + '»' }); if (d) { S.layerAssign(l, d); draw(); } } }, U.ico('link')), ' ', ds ? [UI.typeTag(ds), ' ', ds.n, ' ', h('span', { class: 'mu' }, '(' + M.unitLabel(ds.u) + ')')] : h('span', { class: 'warnx' }, 'sense dataset')),
        h('td', { class: 'num' }, inp('qty', '70px', true)), h('td', null, inp('unit', '50px')), h('td', { class: 'num' }, inp('conv', '66px', true)), h('td', { class: 'num' }, inp('rsl', '56px', true)),
        h('td', { class: 'num', title: 'A1–A3 per unitat de solució' }, a == null ? '·' : U.fmtV(a * S.kscale())),
        h('td', { class: 'act' }, h('button', { class: 'ib sm', title: 'Alternatives per a aquesta capa', disabled: !ds || !GC.odb.lib, onclick: () => UI.altDlg(null, { layer: l, parent: o.parent || { qty: 1, conv: 1, unit: 'm2' }, onApply: d => { S.layerAssign(l, d); draw(); } }) }, U.ico('swap')),
          h('button', { class: 'ib sm', title: 'Elimina la capa', onclick: () => { layers.splice(i, 1); draw(); } }, U.ico('trash')))));
    });
    const th = ['#', 'Capa', 'Dataset', 'Quantitat per ud solució', 'Ud', 'Factor', 'Vida útil (anys)', 'A1–A3 ' + S.kunit().split(' ')[0] + '/ud', ''].map((t, i) => h('th', { class: i === 3 || i === 5 || i === 6 || i === 7 ? 'num' : '' }, t));
    box.appendChild(h('div', { class: 'scroll', style: { maxHeight: '40vh', border: '1px solid var(--border)' } }, h('table', { class: 'gt' }, h('thead', null, h('tr', null, th)), tb,
      h('tfoot', null, h('tr', null, h('td', { colspan: 7 }, 'Total A1–A3 per unitat de solució (només capes amb dada)'), h('td', { class: 'num' }, anyA ? U.fmtV(sumA * S.kscale()) : '·'), h('td'))))));
    box.appendChild(h('div', { class: 'row', style: { marginTop: '6px' } }, h('button', { onclick: async () => { if (!GC.odb.lib) { U.info('Biblioteca buida', 'Cal importar ÖKOBAUDAT.'); return; } const d = await UI.pickDs({ title: 'Afegeix una capa' }); if (d) { const l = S.newLayer(d); S.keepDs(d); layers.push(l); draw(); } } }, U.ico('plus'), ' Afegeix capa'),
      h('span', { class: 'mu' }, 'Quantitat de cada capa per 1 unitat de solució (p. ex. per m² de mur), en la unitat de la capa; el factor converteix cap a la unitat del dataset. Període d\'estudi: ' + per() + ' anys.')));
  };
  draw(); return { el: box, draw };
};
UI.solDlg = async function (itemId) {
  const it = S.item(itemId); if (!it || !it.layers) return; const layers = U.clone(it.layers);
  const f = { name: h('input', { type: 'text', value: it.name, style: { width: '100%' } }), group: h('input', { type: 'text', value: it.group || '', style: { width: '100%' } }), qty: h('input', { type: 'text', class: 'n', value: String(it.qty).replace('.', ',') }), unit: h('input', { type: 'text', class: 'n', value: it.unit, style: { width: '60px' } }), price: h('input', { type: 'text', class: 'n', value: it.price != null ? String(it.price).replace('.', ',') : '', placeholder: 'suma capes' }), note: h('textarea', { value: it.note || '', style: { width: '100%', height: '44px' } }) };
  const ed = UI.layersEditor(layers, { parent: it });
  const body = h('div', null, h('div', { class: 'f' }, h('label', null, 'Nom de la solució'), f.name), h('div', { class: 'f' }, h('label', null, 'Grup'), f.group),
    h('div', { class: 'row' }, h('label', null, 'Quantitat'), f.qty, h('label', null, 'Unitat'), f.unit, h('label', null, 'Preu (€/ud)'), f.price, h('span', { class: 'mu' }, 'Buit = suma dels preus de les capes, si tenen preu.')), h('h4', null, 'Capes'), ed.el, h('div', { class: 'f' }, h('label', null, 'Nota'), f.note));
  const r = await U.modal('Solució per capes', body, [{ l: 'Elimina', v: 'del' }, { l: 'Desa a la llibreria…', v: 'lib' }, { l: 'Cancel·la', v: false }, { l: 'Accepta', v: true, pri: 1 }], { cls: 'vwide', noFocus: true });
  if (r === 'del') { S.delItem(itemId); return; } if (!r) return;
  S.change(() => { const q = U.numIn(f.qty.value), pr = U.numIn(f.price.value); it.name = f.name.value.trim(); it.group = f.group.value.trim(); it.qty = q == null || isNaN(q) ? 0 : q; it.unit = f.unit.value.trim() || 'm2'; it.price = pr == null || isNaN(pr) ? null : pr; it.note = f.note.value; it.layers = layers; });
  if (r === 'lib') await UI.saveToLib(it.name, it.unit, layers, it.solId);
};
UI.saveToLib = async function (name, unit, layers, id) {
  const a = await U.ask('Desa a la llibreria de solucions', [{ k: 'n', l: 'Nom', v: name }, { k: 'w', l: 'On', type: 'select', v: 'project', opts: [['project', 'Aquest projecte'], ['local', 'Llibreria local del navegador (tots els projectes)'], ['both', 'Ambdues']] }]); if (!a || !a.n.trim()) return;
  const snap = S.solSnapshot(a.n.trim(), unit, layers, id);
  if (a.w !== 'local') S.saveSolution(Object.assign({}, snap, { ds: undefined }));
  if (a.w !== 'project') { const i = S.localSols.findIndex(x => x.id === snap.id); if (i >= 0) S.localSols[i] = snap; else S.localSols.push(snap); await S.saveLocalSols(); }
  U.status('Solució «' + snap.name + '» desada.', 'ok', 4000);
};
UI.solEdit = async function (sol) {
  const layers = U.clone(sol.layers); const f = { name: h('input', { type: 'text', value: sol.name, style: { width: '100%' } }), unit: h('input', { type: 'text', value: sol.unit || 'm2', style: { width: '60px' } }) };
  const ed = UI.layersEditor(layers, { dsMap: sol.ds });
  const ok = await U.modal(sol.name ? 'Edita la solució' : 'Solució nova', h('div', null, h('div', { class: 'f' }, h('label', null, 'Nom'), f.name), h('div', { class: 'row' }, h('label', null, 'Unitat'), f.unit), ed.el), [{ l: 'Cancel·la', v: false }, { l: 'Accepta', v: true, pri: 1 }], { cls: 'vwide', noFocus: true });
  if (!ok) return null; return S.solSnapshot(f.name.value.trim() || 'Solució', f.unit.value.trim() || 'm2', layers, sol.id);
};
UI.solLib = function () {
  const body = h('div'); let closeFn;
  const val = sol => { const dsOf = id => S.dsOf(id) || (sol.ds && sol.ds[id]) || null; const r = C.solRes({ id: 'x', qty: 1, conv: 1, layers: sol.layers }, Object.assign(S.ctx(), { ds: dsOf, counted: ['A1-A3'] })); return r.mods['A1-A3'] == null ? null : r.mods['A1-A3'] * S.kscale(); };
  const draw = () => {
    body.textContent = ''; const all = S.allSols();
    body.appendChild(h('div', { class: 'row' }, h('button', { class: 'pri', onclick: async () => { const s2 = await UI.solEdit({ id: U.uid(), name: '', unit: 'm2', layers: [], ds: {} }); if (s2) { await UI.saveToLibDirect(s2); draw(); } } }, U.ico('plus'), ' Solució nova'),
      h('span', { class: 'mu' }, 'Les solucions del projecte viatgen amb el JSON; les de la llibreria local només viuen en aquest navegador.')));
    if (!all.length) { body.appendChild(h('div', { class: 'empty' }, 'Encara no hi ha cap solució. Crea\'n una o converteix un element de l\'obra («Converteix en solució per capes») i desa-la a la llibreria.')); return; }
    body.appendChild(h('div', { class: 'scroll', style: { maxHeight: '55vh', border: '1px solid var(--border)' } }, h('table', { class: 'gt' }, h('thead', null, h('tr', null, ['Solució', 'Capes', 'Ud', 'A1–A3 /ud', 'On', ''].map((t, i) => h('th', { class: i === 3 ? 'num' : '' }, t)))),
      h('tbody', null, all.map(sol => h('tr', null, h('td', { class: 'nm', title: sol.layers.map(l => (((S.dsOf(l.dsId) || (sol.ds && sol.ds[l.dsId]) || {}).n) || '?')).join('\n') }, sol.name), h('td', null, sol.layers.length), h('td', null, sol.unit), h('td', { class: 'num' }, val(sol) == null ? '·' : U.fmtV(val(sol))), h('td', null, sol.where),
        h('td', { class: 'act' }, h('button', { class: 'sm', onclick: async () => { const a = await U.ask('Afegeix a l\'obra', [{ k: 'q', l: 'Quantitat (' + sol.unit + ')', v: '1' }]); if (a) { const q = U.numIn(a.q); S.addSolution(sol, q == null || isNaN(q) ? 1 : q); closeFn && closeFn(); S.view = 'obra'; GC.refresh('view'); } } }, 'Afegeix'),
          h('button', { class: 'sm', onclick: async () => { const s2 = await UI.solEdit(sol); if (s2) { await UI.saveToLibDirect(s2, sol.where); draw(); } } }, 'Edita'),
          h('button', { class: 'sm', title: 'Copia a l\'altra ubicació', onclick: async () => { await UI.saveToLibDirect(Object.assign({}, S.solSnapshot(sol.name, sol.unit, sol.layers, sol.id), { ds: Object.assign({}, sol.ds || {}) }), sol.where === 'local' ? 'project' : 'local'); draw(); } }, sol.where === 'local' ? '→ projecte' : '→ local'),
          h('button', { class: 'ib sm', title: 'Elimina', onclick: async () => { if (!await U.confirm('Elimina la solució', 'S\'eliminarà «' + sol.name + '» de ' + (sol.where === 'local' ? 'la llibreria local' : 'aquest projecte') + '.', 'Elimina')) return; if (sol.where === 'local') { S.localSols = S.localSols.filter(x => x.id !== sol.id); await S.saveLocalSols(); } else S.delSolution(sol.id); draw(); } }, U.ico('trash')))))))));
  };
  draw(); return U.modal('Solucions per capes', body, [{ l: 'Tanca', v: true, pri: 1 }], { cls: 'wide', noFocus: true, onOpen: (m, c) => { closeFn = c; } });
};
/* desa sense preguntar (projecte o local) */
UI.saveToLibDirect = async function (snap, where) {
  where = where || 'project';
  if (where === 'project') { const p = Object.assign({}, snap); if (S.p.solutions.length === 0 || true) p.ds = undefined; S.saveSolution(p); }
  else { const i = S.localSols.findIndex(x => x.id === snap.id); if (i >= 0) S.localSols[i] = snap; else S.localSols.push(snap); await S.saveLocalSols(); }
};
