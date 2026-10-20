/* guaitaCO2 — estat del projecte: elements, escenaris, preus, desfés/refés i desat automàtic */
const S = GC.S = {
  p: null,            // projecte
  sel: null,          // id d'element seleccionat
  view: 'lib',        // vista activa
  cmp: null,          // id de l'escenari base de comparació
  ui: { vis: { A: true, A4: false, B: false, C: false, D: true } }
};
const EMPTY_SETTINGS = () => ({ ind: 't', counted: ['A1-A3'], cprice: null, unitOut: 'kg', area: null, period: 50, b4mode: 'dataset' });
S.newProject = function (name) {
  const sid = U.uid();
  return {
    format: 'guaitaCO2-projecte', version: VERSION, name: name || 'Projecte sense títol', created: new Date().toISOString(), modified: new Date().toISOString(),
    source: { db: 'ÖKOBAUDAT', release: '', note: 'Dades d\'ÖKOBAUDAT (BMWSB / BBSR). Distribució gratuïta de dades sense modificar amb citació de la font.' },
    settings: EMPTY_SETTINGS(), prices: {}, ds: {}, solutions: [], refs: [],
    scenarios: [{ id: sid, name: 'Base', items: [] }], active: sid,
    caseInfo: null
  };
};
S.scn = () => S.p.scenarios.find(s => s.id === S.p.active) || S.p.scenarios[0];
S.scnById = id => S.p.scenarios.find(s => s.id === id);
S.items = () => S.scn().items;
S.item = id => S.items().find(i => i.id === id);
/* dataset d'un identificador: biblioteca activa, o la còpia de seguretat incrustada al projecte */
S.dsOf = function (id) {
  if (!id) return null; const d = GC.odb.get(id); if (d) return d; return (S.p && S.p.ds && S.p.ds[id]) || null;
};
S.ctx = function () {
  const st = S.p.settings; return { ind: st.ind, counted: st.counted.filter(m => M.COUNTABLE.indexOf(m) >= 0), prices: S.p.prices, ds: S.dsOf, cprice: st.cprice, period: st.period, b4mode: st.b4mode };
};
S.res = function (scn) { return C.scn((scn || S.scn()).items, S.ctx()); };
S.kscale = () => S.p.settings.unitOut === 't' ? 0.001 : 1;
S.kunit = () => S.p.settings.unitOut === 't' ? 't CO₂e' : 'kg CO₂e';

/* ---------- Desfés / refés (instantànies del projecte) ---------- */
const UNDO = [], REDO = [];
S.canUndo = () => UNDO.length > 0; S.canRedo = () => REDO.length > 0;
let lastSnap = null;
S.snap = function () { lastSnap = JSON.stringify(S.p); };
/* aplica un canvi: desa instantània prèvia, executa fn, desa i refresca */
S.change = function (fn, what) {
  if (!lastSnap) S.snap();
  UNDO.push(lastSnap); if (UNDO.length > 80) UNDO.shift(); REDO.length = 0;
  fn(); S.p.modified = new Date().toISOString(); S.snap(); S.save(); if (GC.refresh) GC.refresh(what || 'data');
};
S.undo = function () { if (!UNDO.length) return; REDO.push(JSON.stringify(S.p)); S.p = JSON.parse(UNDO.pop()); S.snap(); S.save(); if (GC.refresh) GC.refresh('proj'); };
S.redo = function () { if (!REDO.length) return; UNDO.push(JSON.stringify(S.p)); S.p = JSON.parse(REDO.pop()); S.snap(); S.save(); if (GC.refresh) GC.refresh('proj'); };
S.setProject = function (p, keepUndo) {
  S.p = p; S.sel = null; S.cmp = null; S.cmp2 = null; if (!keepUndo) { UNDO.length = 0; REDO.length = 0; } S.snap(); S.save(); if (GC.refresh) GC.refresh('proj');
};

/* ---------- Desat automàtic ---------- */
let saveT = null;
S.save = function () {
  clearTimeout(saveT);
  saveT = setTimeout(() => { if (S.p) GC.store.set('project', S.p).then(ok => { if (!ok && !S.warnedStore) { S.warnedStore = true; U.status('No es pot desar al navegador (emmagatzematge no disponible). Desa el projecte en un fitxer JSON.', 'wr', 8000); } }); }, 400);
};
S.flush = async function () { clearTimeout(saveT); if (S.p) await GC.store.set('project', S.p); };
S.loadSaved = async function () {
  const p = await GC.store.get('project'); if (p && p.format === 'guaitaCO2-projecte' && Array.isArray(p.scenarios) && p.scenarios.length) { S.p = S.normalize(p); S.snap(); return true; }
  return false;
};
/* completa camps absents (projectes d'altres versions) */
S.normalize = function (p) {
  p.settings = Object.assign(EMPTY_SETTINGS(), p.settings || {}); p.prices = p.prices || {}; p.ds = p.ds || {}; p.solutions = p.solutions || []; p.refs = p.refs || [];
  if (!Array.isArray(p.settings.counted)) p.settings.counted = ['A1-A3'];
  for (const sc of p.scenarios) { sc.items = sc.items || []; for (const it of sc.items) { if (it.conv == null) it.conv = 1; if (it.qty == null) it.qty = 0; if (!it.unit) it.unit = '?'; } }
  if (!p.active || !p.scenarios.find(s => s.id === p.active)) p.active = p.scenarios[0].id;
  return p;
};

/* ---------- Operacions amb elements ---------- */
S.newItem = function (o) {
  return Object.assign({ id: U.uid(), name: '', group: '', dsId: null, qty: 1, unit: '?', conv: 1, price: null, vi: null, note: '' }, o || {});
};
/* guarda còpia del dataset al projecte perquè es pugui obrir sense la biblioteca */
S.keepDs = function (d) { if (d && S.p.ds && !S.p.ds[d.id]) { const o = Object.assign({}, d); delete o._s; S.p.ds[d.id] = o; } };
S.addFromDs = function (d, qty) {
  let id; S.change(() => {
    S.keepDs(d); const rel = GC.odb.lib && GC.odb.lib.meta && GC.odb.lib.meta.release; if (rel && !S.p.source.release) S.p.source.release = rel;
    const it = S.newItem({ name: d.n, dsId: d.id, unit: d.u, qty: qty == null ? 1 : qty }); id = it.id; S.items().push(it);
  });
  S.sel = id; if (GC.refresh) GC.refresh('sel'); return id;
};
S.addBlank = function () { let id; S.change(() => { const it = S.newItem({ name: 'Element nou' }); id = it.id; S.items().push(it); }); S.sel = id; if (GC.refresh) GC.refresh('sel'); return id; };
S.dupItem = function (id) {
  const it = S.item(id); if (!it) return; let nid;
  S.change(() => { const c = U.clone(it); c.id = U.uid(); c.name = it.name + ' (còpia)'; nid = c.id; const a = S.items(); a.splice(a.indexOf(it) + 1, 0, c); });
  S.sel = nid; if (GC.refresh) GC.refresh('sel');
};
S.delItem = function (id) {
  const it = S.item(id); if (!it) return; S.change(() => { const a = S.items(); a.splice(a.indexOf(it), 1); });
  if (S.sel === id) S.sel = null; if (GC.refresh) GC.refresh('sel');
};
/* assigna un dataset a un element, amb conversió suggerida si la unitat difereix */
S.assignDs = function (itemId, d, keepConv) {
  const it = S.item(itemId); if (!it) return;
  S.change(() => {
    S.keepDs(d); const old = S.dsOf(it.dsId); it.dsId = d.id; it.vi = null;
    const itU = M.itemUnit(it.unit);
    if (!keepConv) {
      if (itU === '?' || !itU) { it.unit = d.u; it.conv = 1; }
      else { const s = C.suggest(itU, d); it.conv = s ? s.f : 1; if (!s && itU !== d.u) it.convWarn = true; else delete it.convWarn; }
    }
    if (old && old.id !== d.id && it.price != null) { it.price = null; }
  });
};
S.setScenario = function (id) { if (S.scnById(id)) { S.p.active = id; S.sel = null; if (GC.refresh) GC.refresh('scn'); S.save(); } };
S.newScenario = function (name, fromId) {
  const src = S.scnById(fromId) || S.scn(); let id;
  S.change(() => { const c = { id: U.uid(), name: name || ('Escenari ' + (S.p.scenarios.length + 1)), items: U.clone(src.items) }; id = c.id; S.p.scenarios.push(c); S.p.active = id; }, 'scn');
  return id;
};
S.renameScenario = function (id, name) { const s = S.scnById(id); if (s) S.change(() => { s.name = name; }, 'scn'); };
S.delScenario = function (id) {
  if (S.p.scenarios.length < 2) return; S.change(() => { const a = S.p.scenarios; a.splice(a.findIndex(s => s.id === id), 1); if (S.p.active === id) S.p.active = a[0].id; }, 'scn');
  if (S.cmp === id) S.cmp = null;
};
S.setSetting = function (k, v) { S.change(() => { S.p.settings[k] = v; }, 'set'); };
S.toggleCounted = function (mod) {
  S.change(() => { const a = S.p.settings.counted; const i = a.indexOf(mod); if (i >= 0) a.splice(i, 1); else a.push(mod); a.sort((x, y) => M.COUNTABLE.indexOf(x) - M.COUNTABLE.indexOf(y)); }, 'set');
};
S.setPrice = function (dsId, v) { S.change(() => { if (v == null || isNaN(v)) delete S.p.prices[dsId]; else S.p.prices[dsId] = v; }, 'price'); };

/* ---------- Solucions compostes (capes) ---------- */
S.newLayer = function (d, o) { return Object.assign({ id: U.uid(), name: d ? d.n : '', dsId: d ? d.id : null, qty: 1, unit: d ? d.u : '?', conv: 1, rsl: null, vi: null }, o || {}); };
S.layerAssign = function (l, d) {
  S.keepDs(d); l.dsId = d.id; l.vi = null; if (!l.name) l.name = d.n; const lu = M.itemUnit(l.unit);
  if (lu === '?' || !lu) { l.unit = d.u; l.conv = 1; } else { const s = C.suggest(lu, d); l.conv = s ? s.f : 1; }
};
S.addSolution = function (sol, qty) {
  let id; S.change(() => {
    const layers = U.clone(sol.layers); for (const l of layers) { l.id = U.uid(); const d = S.dsOf(l.dsId) || (sol.ds && sol.ds[l.dsId]); if (d && !S.p.ds[d.id] && !GC.odb.get(d.id)) S.p.ds[d.id] = d; }
    const it = S.newItem({ name: sol.name, unit: sol.unit || 'm2', qty: qty == null ? 1 : qty, layers, solId: sol.id, group: sol.group || '' }); id = it.id; S.items().push(it);
  }); S.sel = id; if (GC.refresh) GC.refresh('sel'); return id;
};
/* instantània d'una solució amb els datasets que usa (per a la llibreria local, que viatja sola) */
S.solSnapshot = function (name, unit, layers, id) {
  const ds = {}; for (const l of layers) { const d = S.dsOf(l.dsId); if (d) { const o = Object.assign({}, d); delete o._s; ds[d.id] = o; } }
  return { id: id || U.uid(), name, unit: unit || 'm2', layers: U.clone(layers), ds };
};
S.saveSolution = function (sol) { S.change(() => { const a = S.p.solutions; const i = a.findIndex(x => x.id === sol.id); if (i >= 0) a[i] = sol; else a.push(sol); }, 'sol'); };
S.delSolution = function (id) { S.change(() => { S.p.solutions = S.p.solutions.filter(x => x.id !== id); }, 'sol'); };
S.localSols = [];
S.loadLocalSols = async function () { const a = await GC.store.get('sollib'); S.localSols = Array.isArray(a) ? a : []; };
S.saveLocalSols = async function () { return GC.store.set('sollib', S.localSols); };
/* totes les solucions disponibles (projecte + llibreria local), sense duplicar ids */
S.allSols = function () { const seen = new Set(); const out = []; for (const x of S.p.solutions.map(s => Object.assign({ where: 'projecte' }, s)).concat(S.localSols.map(s => Object.assign({ where: 'local' }, s)))) { if (seen.has(x.id + x.where)) continue; seen.add(x.id + x.where); out.push(x); } return out; };
/* converteix un element simple en solució per capes (el seu dataset passa a ser la primera capa) */
S.toSolution = function (itemId) {
  const it = S.item(itemId); if (!it || it.layers) return; const d = S.dsOf(it.dsId);
  S.change(() => { const l = S.newLayer(d, { name: it.name, qty: 1, unit: d ? d.u : it.unit, conv: 1, vi: it.vi, rsl: it.rsl || null }); it.layers = d ? [l] : []; it.unit = 'm2'; it.conv = 1; it.dsId = null; it.vi = null; delete it.convWarn; });
};
