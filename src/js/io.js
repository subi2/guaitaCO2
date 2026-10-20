/* guaitaCO2 — importació i exportació: ÖKOBAUDAT (CSV), projectes, selecció de guaitaPreus, elements (CSV), resultats */
const IO = GC.io = {};
const fileDate = () => new Date().toISOString().slice(0, 10);

/* ---------- Biblioteca ÖKOBAUDAT ---------- */
IO.importOdb = async function (file) {
  let bar, msg, closeFn;
  const box = h('div', null, h('p', null, 'Llegint «' + file.name + '» (' + (file.size / 1048576).toFixed(1) + ' MB). Pot trigar uns segons; el fitxer es processa al teu navegador i no es puja enlloc.'),
    h('div', { class: 'progbox' }, bar = h('i')), msg = h('div', { class: 'mu' }, 'Començant…'));
  U.modal('Important la biblioteca ÖKOBAUDAT', box, [], { sticky: true, noFocus: true, onOpen: (m, c) => { closeFn = c; } });
  try {
    const t0 = Date.now();
    const r = await GC.odb.importStream(GC.odb.fileChunks(file), file.size, p => { bar.style.width = (p * 100).toFixed(0) + '%'; msg.textContent = (p * 100).toFixed(0) + ' %'; }, file.name);
    msg.textContent = 'Indexant ' + r.records.length + ' datasets…'; await U.tick();
    GC.odb.set(r.records, r.meta);
    msg.textContent = 'Desant al navegador…'; await U.tick();
    const ok = await GC.odb.save();
    closeFn();
    const m = r.meta;
    U.status('Biblioteca importada: ' + m.datasets + ' datasets (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)' + (ok ? '' : ' · no s\'ha pogut desar al navegador'), ok ? 'ok' : 'wr', 8000);
    if (GC.S.p && !GC.S.p.source.release && m.release) GC.S.p.source.release = m.release;
    GC.S.view = 'lib'; GC.refresh('lib');
  } catch (e) {
    closeFn && closeFn();
    U.info('No s\'ha pogut importar', h('div', { class: 'msg er' }, String(e && e.message || e)));
  }
};

/* ---------- Detecció del tipus de fitxer ---------- */
IO.openFile = async function (file) {
  if (!file) return;
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith('.json')) return await IO.openJson(file);
    if (name.endsWith('.csv') || name.endsWith('.txt')) {
      const head = await U.readText(file.slice(0, 4096), 'windows-1252');
      if (/^﻿?UUID;Version;/.test(head)) return await IO.importOdb(file);
      return await IO.importItemsCsv(file);
    }
    U.info('Fitxer no reconegut', h('div', null, 'guaitaCO2 llegeix el CSV d\'ÖKOBAUDAT, projectes i casos (JSON), seleccions de guaitaPreus (JSON) i llistes d\'elements (CSV).'));
  } catch (e) { U.info('Error en obrir el fitxer', h('div', { class: 'msg er' }, String(e && e.message || e))); }
};
IO.pick = async function (accept) { const f = await U.pickFile(accept); if (f) await IO.openFile(f); };

/* ---------- JSON ---------- */
IO.openJson = async function (file) {
  let o; try { o = JSON.parse(await U.readText(file, 'utf-8')); } catch (e) { throw new Error('El fitxer JSON no és vàlid: ' + e.message); }
  return IO.applyJson(o, file.name);
};
IO.applyJson = async function (o, fname) {
  const S = GC.S;
  if (o && o.format === 'guaitaCO2-projecte') {
    if (S.p && S.items().length && !await U.confirm('Obre el projecte', 'S\'obrirà «' + (o.name || fname) + '» i es substituirà el projecte actual. Si no l\'has desat, es pot recuperar amb Desfés.', 'Obre')) return;
    S.setProject(S.normalize(o)); S.view = 'obra'; GC.refresh('proj'); U.status('Projecte obert: ' + (o.name || fname), 'ok', 5000); return;
  }
  if (o && o.format === 'guaitaCO2-cas') {
    if (!o.project) throw new Error('El cas no conté cap projecte.');
    const p = S.normalize(o.project); p.caseInfo = { title: o.title || p.name, intro: o.intro || '', goal: o.goal || null };
    S.setProject(p); S.view = 'obra'; GC.refresh('proj'); GC.help.showCase(); return;
  }
  if (o && o.format === 'guaitaPreus-seleccio') return IO.addSelection(o);
  throw new Error('Format JSON no reconegut' + (o && o.format ? ' («' + o.format + '»)' : '') + '. Formats acceptats: guaitaCO2-projecte, guaitaCO2-cas, guaitaPreus-seleccio.');
};
/* selecció de guaitaPreus: {format:'guaitaPreus-seleccio', base, items:[{code, unit, summary, qty, price, chapter}]} */
IO.addSelection = function (o) {
  const S = GC.S; const arr = Array.isArray(o.items) ? o.items : [];
  if (!arr.length) throw new Error('La selecció no conté cap concepte.');
  let n = 0;
  S.change(() => {
    for (const x of arr) {
      const price = x.price == null || x.price === '' ? null : Number(x.price);
      S.items().push(S.newItem({ name: [x.code, x.summary].filter(Boolean).join(' · ') || 'Concepte', group: x.chapter || o.base || '', unit: M.itemUnit(x.unit), qty: x.qty == null ? 1 : Number(x.qty) || 0, price: isNaN(price) ? null : price, note: x.code ? 'Codi ' + x.code + (o.base ? ' · ' + o.base : '') : '' }));
      n++;
    }
  });
  S.view = 'obra'; GC.refresh('proj'); U.status(n + ' conceptes afegits. Assigna-hi un dataset d\'ÖKOBAUDAT a cadascun.', 'ok', 8000);
};

/* ---------- CSV d'elements ---------- */
IO.importItemsCsv = async function (file) {
  const txt = (await U.readText(file, 'utf-8')).replace(/^﻿/, '');
  const first = txt.split(/\r?\n/, 1)[0] || ''; const delim = (first.split(';').length >= first.split(',').length) ? ';' : ',';
  const rows = []; const p = new GC.M.CsvParser(r => rows.push(r), delim); p.feed(txt); p.end();
  if (rows.length < 2) throw new Error('El CSV no té cap fila de dades.');
  const hd = rows[0].map(s => GC.odb.norm(s).trim()); const col = (...names) => { for (const n of names) { const i = hd.indexOf(n); if (i >= 0) return i; } return -1; };
  const cN = col('nom', 'name', 'element', 'descripcio', 'resum'), cU = col('unitat', 'unit', 'ud', 'u'), cQ = col('quantitat', 'qty', 'amidament', 'quantity'), cP = col('preu', 'price', 'preu unitari'), cG = col('grup', 'group', 'capitol'), cD = col('dataset', 'uuid');
  if (cN < 0) throw new Error('Cal una columna «nom» (o name). Columnes reconegudes: nom, unitat, quantitat, preu, grup, dataset (UUID).');
  const S = GC.S; let n = 0, linked = 0;
  S.change(() => {
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]; if (!r[cN]) continue; const q = cQ >= 0 ? U.numIn(r[cQ]) : 1; const pr = cP >= 0 ? U.numIn(r[cP]) : null;
      const it = S.newItem({ name: r[cN], unit: cU >= 0 ? M.itemUnit(r[cU]) : '?', qty: q == null || isNaN(q) ? 1 : q, price: pr == null || isNaN(pr) ? null : pr, group: cG >= 0 ? r[cG] : '' });
      if (cD >= 0 && r[cD]) { const d = GC.odb.get(r[cD].trim()); if (d) { S.keepDs(d); it.dsId = d.id; const s = C.suggest(it.unit, d); it.conv = s ? s.f : 1; if (it.unit === '?') it.unit = d.u; linked++; } }
      S.items().push(it); n++;
    }
  });
  S.view = 'obra'; GC.refresh('proj'); U.status(n + ' elements importats (' + linked + ' amb dataset).', 'ok', 6000);
};

/* ---------- Exportacions ---------- */
IO.saveProject = function () {
  const S = GC.S; S.p.modified = new Date().toISOString();
  U.download(U.slug(S.p.name) + '_guaitaCO2.json', JSON.stringify(S.p, null, 1), 'application/json;charset=utf-8'); U.status('Projecte desat com a JSON.', 'ok', 4000);
};
IO.exportCase = async function () {
  const S = GC.S; const ci = S.p.caseInfo || {};
  const a = await U.ask('Exporta com a cas didàctic', [{ k: 't', l: 'Títol del cas', v: ci.title || S.p.name }, { k: 'i', l: 'Enunciat (el veurà l\'alumne en obrir-lo)', v: ci.intro || '', type: 'area' }, { k: 'g1', l: 'Objectiu: reducció mínima de CO₂e respecte a l\'escenari base (%, opcional)', v: ci.goal && ci.goal.minReductionPct != null ? ci.goal.minReductionPct : '' }, { k: 'g2', l: 'Objectiu: increment màxim de cost (%, opcional)', v: ci.goal && ci.goal.maxCostIncreasePct != null ? ci.goal.maxCostIncreasePct : '' }], 'El fitxer inclou el projecte complet amb els valors dels datasets, perquè l\'alumne no necessiti la biblioteca.', 'Exporta');
  if (!a) return; const g1 = U.numIn(a.g1), g2 = U.numIn(a.g2);
  const goal = (g1 != null && !isNaN(g1)) || (g2 != null && !isNaN(g2)) ? { minReductionPct: g1 != null && !isNaN(g1) ? g1 : null, maxCostIncreasePct: g2 != null && !isNaN(g2) ? g2 : null } : null;
  const o = { format: 'guaitaCO2-cas', version: VERSION, title: a.t, intro: a.i, goal, exported: new Date().toISOString(), project: S.p };
  U.download(U.slug(a.t) + '_cas.json', JSON.stringify(o, null, 1), 'application/json;charset=utf-8');
};
IO.rowsFor = function (scn) {
  const S = GC.S; const res = S.res(scn); const ind = M.IND[S.p.settings.ind];
  const head = ['Escenari', 'Grup', 'Element', 'Dataset', 'Tipus', 'País', 'Ud dataset', 'Quantitat', 'Ud element', 'Factor de conversió', 'Preu unitari (€/ud element)', 'Cost (€)']
    .concat(M.MODS.map(m => m + ' (kg CO2e)'), ['Total comptat (kg CO2e)', 'Mòduls amb dada', 'Estat']);
  const out = [head];
  for (const x of res.rows) {
    const r = x.r; out.push([scn.name, x.it.group, x.it.name, x.ds ? (x.ds.composite ? 'Solució: ' + x.it.layers.map(l => (S.dsOf(l.dsId) || {}).n || '?').join(' + ') : x.ds.n) : '', x.ds ? x.ds.typ : '', x.ds ? x.ds.land : '', x.ds ? x.ds.u : '', x.it.qty, x.it.unit, x.it.conv, r.up, r.cost]
      .concat(M.MODS.map(m => r.mods[m]), [r.tot, r.nd + '/' + S.ctx().counted.length, r.status]));
  }
  return { out, res, ind };
};
const csvNum = v => (v == null || typeof v !== 'number' || isNaN(v)) ? (v == null ? '' : v) : String(v).replace('.', ',');
IO.exportCsv = function () {
  const S = GC.S; const { out, res, ind } = IO.rowsFor(S.scn());
  const rows = out.map((r, i) => i === 0 ? r : r.map(csvNum));
  const t = ['', '', 'TOTAL', '', '', '', '', '', '', '', '', csvNum(res.cost)].concat(M.MODS.map(m => csvNum(res.mods[m].sum)), [csvNum(res.total), '', '']);
  rows.push(t); rows.push([]); rows.push(['Indicador: ' + ind.l + ' · Mòduls comptats: ' + S.ctx().counted.join(', ') + ' · D no se suma al total · Font: ÖKOBAUDAT ' + (S.p.source.release || '') + ' (BMWSB/BBSR) · guaitaCO2 v.' + VERSION]);
  U.download(U.slug(S.p.name) + '_' + U.slug(S.scn().name) + '_resultats.csv', U.csv(rows), 'text/csv;charset=utf-8'); U.status('Resultats exportats (CSV amb coma decimal i «;»).', 'ok', 5000);
};
/* JSON de resultats: noms GWP-total_A1-A3… perquè guaitaPreus els pugui incrustar com a ~X al BC3 */
IO.exportResultJson = function () {
  const S = GC.S; const ctx = S.ctx(); const ind = M.IND[S.p.settings.ind];
  const scns = S.p.scenarios.map(sc => {
    const res = S.res(sc);
    return {
      name: sc.name, totals: { counted: res.total, D: res.d, cost: res.cost, byModule: Object.fromEntries(M.MODS.map(m => [ind.k + '_' + m, res.mods[m].sum])) },
      items: res.rows.map(x => ({
        name: x.it.name, group: x.it.group, qty: x.it.qty, unit: x.it.unit, conv: x.it.conv, price: x.r.up, cost: x.r.cost,
        layers: x.it.layers ? x.it.layers.map(l => ({ name: l.name, dataset: l.dsId, qtyPerUnit: l.qty, unit: l.unit, conv: l.conv, rslYears: l.rsl })) : undefined, rslYears: x.it.rsl || undefined,
        dataset: x.ds && !x.ds.composite ? { id: x.ds.id, name: x.ds.n, type: x.ds.typ, unit: x.ds.u, country: x.ds.land, owner: x.ds.own, registration: x.ds.reg } : null,
        perUnit: Object.fromEntries(M.MODS.map(m => [ind.k + '_' + m, x.it.qty ? (x.r.mods[m] == null ? null : x.r.mods[m] / x.it.qty) : null])),
        total: Object.fromEntries(M.MODS.map(m => [ind.k + '_' + m, x.r.mods[m]])), counted: x.r.tot, status: x.r.status
      }))
    };
  });
  const o = { format: 'guaitaCO2-resultat', version: VERSION, exported: new Date().toISOString(), project: S.p.name, unit: 'kg CO2e', indicator: ind.k, counted: ctx.counted, note: 'D no se suma al total. null = sense dada (no és zero).', studyPeriodYears: S.p.settings.period, b4mode: S.p.settings.b4mode, source: S.p.source, scenarios: scns };
  U.download(U.slug(S.p.name) + '_resultats.json', JSON.stringify(o, null, 1), 'application/json;charset=utf-8'); U.status('Resultats exportats (JSON).', 'ok', 5000);
};
/* biblioteca filtrada → CSV */
IO.exportLibCsv = function (list) {
  const ind = M.IND[GC.S.p.settings.ind];
  const rows = [['UUID', 'Nom', 'Categoria', 'Tipus', 'Ud', 'País', 'Any', 'Vàlid fins', 'Propietari', 'Registre'].concat(M.MODS.map(m => ind.l + ' ' + m + ' (kg CO2e/ud)'))];
  for (const d of list) rows.push([d.id, d.n, d.cat.join(' / '), d.typ, d.u, d.land, d.yr, d.valid, d.own, d.reg].concat(M.MODS.map(m => csvNum(C.val(d, m, GC.S.p.settings.ind)))));
  rows.push([]); rows.push(['Font: ÖKOBAUDAT ' + (GC.odb.lib.meta.release || '') + ' (BMWSB/BBSR) · extracte amb guaitaCO2 v.' + VERSION]);
  U.download('guaitaCO2_biblioteca_filtrada.csv', U.csv(rows), 'text/csv;charset=utf-8');
};
