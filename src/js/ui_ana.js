/* guaitaCO2 — vista Anàlisi: resum, fases, grups i punts calents (Pareto) de l'escenari actiu */

UI.pareto = function (list, o) {
  const ks = S.kscale(); const n = list.length; const W = 760, rh = 24, m = { l: 190, r: 170, t: 8, b: 24 }; const Hh = m.t + m.b + n * rh;
  const s = U.svg('svg', { class: 'ch', viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'aria-label': 'Punts calents' });
  const mx = Math.max(1e-12, ...list.map(p => Math.abs(p.x.r.tot))); const X = v => m.l + Math.abs(v) / mx * (W - m.l - m.r);
  [0, .25, .5, .75, 1].forEach(f => { const x = m.l + f * (W - m.l - m.r); s.appendChild(U.svg('line', { class: 'gl', x1: x, x2: x, y1: m.t, y2: Hh - m.b })); s.appendChild(U.svg('text', { x, y: Hh - m.b + 14, 'text-anchor': 'middle', class: 'mono' }, U.fmtV(f * mx * ks))); });
  list.forEach((p, i) => {
    const y = m.t + i * rh + 4; const nm = p.x.it.name || (p.x.ds && p.x.ds.n) || '—';
    s.appendChild(U.svg('text', { x: m.l - 8, y: y + 12, 'text-anchor': 'end', class: 'lab' }, nm.length > 28 ? nm.slice(0, 27) + '…' : nm));
    const r = U.svg('rect', { x: m.l, y, width: Math.max(1, X(p.x.r.tot) - m.l), height: rh - 8, fill: p.x.r.tot >= 0 ? 'var(--gA)' : 'var(--green)', rx: 2, style: 'cursor:pointer' });
    r.appendChild(U.svg('title', null, nm + '\n' + U.fmtV(p.x.r.tot * ks) + ' ' + S.kunit() + (p.x.ds ? '\n' + p.x.ds.n : ''))); r.addEventListener('click', () => UI.itemDlg(p.x.it.id)); s.appendChild(r);
    s.appendChild(U.svg('text', { x: X(p.x.r.tot) + 6, y: y + 12, class: 'mono' }, U.fmtV(p.x.r.tot * ks) + (p.cum != null ? ' · ' + U.fmt(p.cum * 100, 0) + ' % acum.' : '')));
  });
  return s;
};

/* referències de kg CO2e/m² amb font citada (edificis complets, per m² de superfície construïda) */
UI.REFS = [
  { id: 'leti20r', name: 'LETI 2020 · Residencial', v: 500, mods: 'A1–A5', yr: 2020 }, { id: 'leti20c', name: 'LETI 2020 · Comercial', v: 600, mods: 'A1–A5', yr: 2020 }, { id: 'leti20e', name: 'LETI 2020 · Educació', v: 600, mods: 'A1–A5', yr: 2020 },
  { id: 'leti30r', name: 'LETI 2030 · Residencial', v: 300, mods: 'A1–A5', yr: 2030 }, { id: 'leti30c', name: 'LETI 2030 · Comercial', v: 350, mods: 'A1–A5', yr: 2030 }, { id: 'leti30e', name: 'LETI 2030 · Educació', v: 350, mods: 'A1–A5', yr: 2030 }
].map(r => Object.assign(r, { src: 'Objectius LETI (Taula 2) citats a IStructE, «Setting carbon targets: an introduction to the proposed SCORS rating scheme», 2020', url: 'https://www.istructe.org/IStructE/media/Public/TSE-Archive/2020/Setting-carbon-targets-an-introduction-to-the-proposed-SCORS-rating-scheme.pdf' })).concat([
  { id: 'riba30', name: 'RIBA 2030 · A1–C4 (sense B6, B7)', v: 540, mods: 'A1–C4', yr: 2030, src: 'RIBA 2030 Climate Challenge, citat en documentació de planejament de Camden (Londres)', url: 'https://camdocs.camden.gov.uk/CMWebDrawer/Record/10344793/file/document' }]);
UI.allRefs = () => UI.REFS.concat((S.p.refs || []).map(r => Object.assign({ user: true }, r)));
UI.refChart = function (val, refs) {
  const rows = [{ name: 'Aquesta obra', v: val, me: true }].concat(refs.map(r => ({ name: r.name, v: r.v }))).sort((a, b) => b.v - a.v);
  const W = 700, rh = 26, m = { l: 210, r: 70, t: 8, b: 22 }; const Hh = m.t + m.b + rows.length * rh; const s = U.svg('svg', { class: 'ch', viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'aria-label': 'Comparació amb referències per m²' });
  const mx = Math.ceil(Math.max(...rows.map(r => r.v)) / 200) * 200 || 1; const X = v => m.l + v / mx * (W - m.l - m.r);
  [0, .25, .5, .75, 1].forEach(f => { s.appendChild(U.svg('line', { class: 'gl', x1: m.l + f * (W - m.l - m.r), x2: m.l + f * (W - m.l - m.r), y1: m.t, y2: Hh - m.b })); s.appendChild(U.svg('text', { x: m.l + f * (W - m.l - m.r), y: Hh - m.b + 14, 'text-anchor': 'middle', class: 'mono' }, U.fmtV(f * mx))); });
  rows.forEach((r, i) => { const y = m.t + i * rh + 3; s.appendChild(U.svg('text', { x: m.l - 8, y: y + 13, 'text-anchor': 'end', class: r.me ? 'lab' : '', style: r.me ? 'font-weight:600' : '' }, r.name.length > 32 ? r.name.slice(0, 31) + '…' : r.name));
    const b = U.svg('rect', { x: m.l, y, width: Math.max(1, X(Math.max(0, r.v)) - m.l), height: rh - 8, fill: r.me ? 'var(--gA)' : 'var(--gD)', rx: 2 }); b.appendChild(U.svg('title', null, r.name + ': ' + U.fmtV(r.v) + ' kg CO₂e/m²')); s.appendChild(b);
    s.appendChild(U.svg('text', { x: X(Math.max(0, r.v)) + 6, y: y + 13, class: 'mono' }, U.fmtV(r.v))); });
  return s;
};
UI.refBlock = function (res) {
  const st = S.p.settings, area = st.area; const refs = UI.allRefs(); const box = h('div', { class: 'chartbox' }, h('h4', null, 'Referència per m² construït'));
  if (!area) { box.appendChild(h('div', { class: 'hint' }, 'Indica la superfície construïda de referència (a dalt) per comparar el resultat amb valors de referència en kg CO₂e/m².')); return box; }
  const val = res.total / area; box.appendChild(UI.refChart(val, refs));
  const c = st.counted.join(', '); const okMods = ['A1-A3', 'A4', 'A5'].every(m => st.counted.indexOf(m) >= 0) && st.counted.every(m => ['A1-A3', 'A4', 'A5'].indexOf(m) >= 0);
  box.appendChild(h('div', { class: okMods ? 'hint' : 'hint warnx' }, 'Obra: ' + U.fmtV(val) + ' kg CO₂e/m² amb els mòduls comptats (' + c + '). ' + (okMods ? '' : 'Compte: les referències LETI són A1–A5 d\'edifici complet (RIBA, A1–C4 sense B6/B7); la comparació només és vàlida si compts els mateixos mòduls i l\'obra inclou tot l\'edifici. ') + 'Valors orientatius: revisa la font abans de citar-los.'));
  box.appendChild(h('div', { class: 'hint' }, 'Fonts: ', refs.filter((r, i, a) => a.findIndex(q => q.src === r.src) === i).map((r, i) => [i ? ' · ' : '', r.url ? h('a', { class: 'ext', href: r.url, target: '_blank', rel: 'noopener noreferrer' }, r.src) : r.src])));
  box.appendChild(h('div', { class: 'row' }, h('button', { class: 'sm', onclick: async () => { const a = await U.ask('Referència pròpia', [{ k: 'n', l: 'Nom', v: '' }, { k: 'v', l: 'Valor (kg CO₂e/m²)', v: '' }, { k: 's', l: 'Font (opcional)', v: '' }]); if (!a) return; const v = U.numIn(a.v); if (!a.n.trim() || v == null || isNaN(v)) return; S.change(() => { S.p.refs.push({ id: U.uid(), name: a.n.trim(), v, src: a.s.trim() || 'referència pròpia', mods: '' }); }, 'ref'); } }, U.ico('plus'), ' Afegeix referència'),
    (S.p.refs || []).map(r => h('span', { class: 'pill2', title: r.src }, r.name + ' ' + U.fmtV(r.v) + ' ', h('a', { style: { cursor: 'pointer' }, title: 'Elimina', onclick: () => S.change(() => { S.p.refs = S.p.refs.filter(q => q.id !== r.id); }, 'ref') }, '✕')))));
  return box;
};
UI.anaView = function (host) {
  const ks = S.kscale(); const res = S.res(); const st = S.p.settings; const sc = h('div', { class: 'pad', style: { flex: 1 } }); host.appendChild(sc);
  if (!res.n) { sc.appendChild(h('div', { class: 'empty' }, 'Afegeix elements a l\'obra per veure\'n l\'anàlisi.')); return; }
  const area = st.area; const areaIn = h('input', { type: 'text', class: 'n', value: area != null ? String(area).replace('.', ',') : '', placeholder: 'm²', style: { width: '80px' }, onchange: e => { const v = U.numIn(e.target.value); S.setSetting('area', v == null || isNaN(v) || v <= 0 ? null : v); } });
  sc.appendChild(h('div', { class: 'row' }, h('label', null, 'Superfície construïda de referència:'), areaIn, h('span', { class: 'mu' }, 'Opcional: permet expressar el resultat en kg CO₂e/m².')));
  sc.appendChild(h('div', { class: 'cards' },
    h('div', { class: 'card ac' }, h('div', { class: 'k' }, 'Total comptat'), h('div', { class: 'v' }, U.fmtV(res.total * ks)), h('div', { class: 's' }, S.kunit() + ' · ' + st.counted.join(' + ') + ' · ' + M.IND[st.ind].l)),
    area ? h('div', { class: 'card' }, h('div', { class: 'k' }, 'Per m² construït'), h('div', { class: 'v' }, U.fmtV(res.total / area)), h('div', { class: 's' }, 'kg CO₂e/m²')) : null,
    h('div', { class: 'card' }, h('div', { class: 'k' }, 'Mòdul D (a part)'), h('div', { class: 'v' }, res.dn ? U.fmtV(res.d * ks) : '·'), h('div', { class: 's' }, res.dn ? S.kunit() + ' · ' + res.dn + ' elements amb D' : 'cap element amb D')),
    h('div', { class: 'card' }, h('div', { class: 'k' }, 'Cost'), h('div', { class: 'v' }, res.costMiss === res.n ? '—' : U.fmt(res.cost, 0) + ' €'), h('div', { class: 's' }, res.costMiss ? res.costMiss + ' elements sense preu' : 'tots amb preu')),
    res.ctot != null ? h('div', { class: 'card' }, h('div', { class: 'k' }, 'Cost + preu ombra del carboni'), h('div', { class: 'v' }, U.fmt(res.ctot, 0) + ' €'), h('div', { class: 's' }, U.fmt(st.cprice, 0) + ' €/t CO₂e')) : null,
    h('div', { class: 'card' }, h('div', { class: 'k' }, 'Qualitat de les dades'), h('div', { class: 'v' }, res.ok + '/' + res.n), h('div', { class: 's' }, res.pa + ' parcials · ' + res.no + ' sense dada'))));
  if (res.pa + res.no) sc.appendChild(h('div', { class: 'hint warnx' }, 'Atenció: ' + (res.pa + res.no) + ' elements tenen dades incompletes en els mòduls comptats. Els mòduls no declarats no compten com a zero; el total és un mínim.'));
  /* fases */
  const gs = UI.groupSums(res);
  sc.appendChild(h('div', { class: 'cols2' },
    h('div', { class: 'chartbox' }, h('h4', null, 'Per fase del cicle de vida'), UI.stack([{ name: S.scn().name, g: gs }], { title: 'Fases' }), UI.stackLegend(),
      h('div', { class: 'hint' }, M.GROUPS.slice(0, 4).map(g => g.t + ': ' + U.fmtV(gs[g.id] * ks)).join(' · '))),
    h('div', { class: 'chartbox' }, h('h4', null, 'Per grup d\'elements'), (() => {
      const bg = C.byGroup(res).slice(0, 12); const sub = bg.map(g => ({ name: g.g, g: { A: g.tot } })); return UI.stack(sub, { title: 'Grups' });
    })(), h('div', { class: 'hint' }, 'El camp «Grup» s\'assigna a cada element de l\'obra.'))));
  sc.appendChild(UI.refBlock(res));
  /* pareto */
  const par = C.pareto(res).slice(0, 15);
  sc.appendChild(h('div', { class: 'chartbox' }, h('h4', null, 'Punts calents: els elements que més pesen (clic per editar)'), par.length ? UI.pareto(par) : h('div', { class: 'mu' }, 'Sense valors.'),
    h('div', { class: 'hint' }, 'Treballa primer els elements de dalt: és on una substitució de material té més efecte. Barres verdes = valor negatiu (captura de carboni biogènic, etc.).')));
};
