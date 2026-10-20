/* guaitaCO2 — motor de càlcul: valors per mòdul, totals, cobertura, cost, alternatives i punts calents */
const C = GC.calc = {};

/* Variant per defecte d'un mòdul: sense escenari → S0 → S1 → la primera */
C.pickDef = function (arr) {
  let i = arr.findIndex(x => !x.s); if (i >= 0) return i;
  i = arr.findIndex(x => x.s === 'S0'); if (i >= 0) return i;
  i = arr.findIndex(x => x.s === 'S1'); return i >= 0 ? i : 0;
};
/* Valor d'un dataset per a un mòdul i indicador (per unitat de referència); null = sense dada (mai 0) */
C.val = function (ds, mod, ind, vi) {
  if (!ds) return null;
  const arr = ds.m[mod], k = M.IND[ind].i;
  if (arr && arr.length) { const i = (vi != null && arr[vi]) ? vi : C.pickDef(arr); const x = arr[i].v[k]; return x == null ? null : x; }
  if (mod === 'A1-A3') {
    let s = 0; for (const m of ['A1', 'A2', 'A3']) { const a = ds.m[m]; if (!a || !a.length) return null; const x = a[C.pickDef(a)].v[k]; if (x == null) return null; s += x; }
    return s;
  }
  return null;
};
/* massa (kg) per unitat de referència del dataset, si es coneix */
C.massPerUnit = function (ds) {
  if (!ds) return null; if (ds.cf) return ds.cf;
  if (ds.u === 'kg') return 1; if (ds.u === 'm2') return ds.fl || null; if (ds.u === 'm3') return ds.rho || ds.bulk || null;
  if (ds.u === 'm') return ds.lw || null; if (ds.u === 'ud') return ds.sw || null; return null;
};
/* proposta de factor de conversió: quantitat en unitats del dataset = quantitat de l'element × factor */
C.suggest = function (itemUnit, ds) {
  if (!ds) return null; const iu = M.itemUnit(itemUnit), du = ds.u;
  if (iu === du) return { f: 1, why: 'mateixa unitat' };
  const mpu = C.massPerUnit(ds);
  if ((iu === 'kg' || iu === 't') && du !== 'kg' && mpu) return { f: (iu === 't' ? 1000 : 1) / mpu, why: 'massa del dataset: ' + U.fmtV(mpu) + ' kg per ' + M.unitLabel(du) };
  if (iu === 't' && du === 'kg') return { f: 1000, why: '1 t = 1000 kg' };
  if (du === 'kg') {
    if (iu === 'm3' && (ds.rho || ds.bulk)) return { f: ds.rho || ds.bulk, why: 'densitat ' + (ds.rho || ds.bulk) + ' kg/m³ del dataset' };
    if (iu === 'm2' && ds.fl) return { f: ds.fl, why: 'pes superficial ' + ds.fl + ' kg/m² del dataset' };
    if (iu === 'm' && ds.lw) return { f: ds.lw, why: 'pes lineal ' + ds.lw + ' kg/m del dataset' };
    if (iu === 'ud' && ds.sw) return { f: ds.sw, why: 'pes per peça ' + ds.sw + ' kg del dataset' };
  }
  if (du === 'm2' && iu === 'm3' && ds.th) return { f: 1 / ds.th, why: 'gruix de capa ' + ds.th + ' m del dataset' };
  return null;
};

C.unitPrice = function (it, ds, ctx) {
  if (it.price != null && !isNaN(it.price)) return it.price;
  const p = ds && ctx.prices ? ctx.prices[ds.id] : null;
  return (p != null && !isNaN(p)) ? p * (it.conv == null ? 1 : it.conv) : null;
};
/* Mòduls (kg CO2e de la quantitat total) d'un element simple. B4 per vida útil: (⌈període/vida⌉−1) × (A1–A3 + A4 + A5 + C1–C4 declarats) */
C.modsOf = function (it, ds, ctx) {
  const a = (Number(it.qty) || 0) * (it.conv == null ? 1 : Number(it.conv)); const mods = {};
  for (const m of M.MODS) { const v = ds ? C.val(ds, m, ctx.ind, it.vi && it.vi[m]) : null; mods[m] = v == null ? null : v * a; }
  const b4ds = mods['B4']; let b4rsl = null, b4n = null; const rsl = Number(it.rsl), per = Number(ctx.period);
  if (ds && rsl > 0 && per > 0) {
    b4n = Math.max(0, Math.ceil(per / rsl - 1e-9) - 1);
    if (mods['A1-A3'] != null) { let sum = 0; for (const m of ['A1-A3', 'A4', 'A5', 'C1', 'C2', 'C3', 'C4']) if (mods[m] != null) sum += mods[m]; b4rsl = b4n * sum; }
  }
  if (ctx.b4mode === 'rsl' && b4rsl != null) mods['B4'] = b4rsl;
  return { mods, a, b4ds, b4rsl, b4n };
};
/* Solució composta (capes): resultat sumant les capes; un mòdul només és «complet» si totes les capes el declaren */
C.solDs = it => ({ id: 'sol:' + it.id, n: it.name || 'Solució', u: M.itemUnit(it.unit), cat: ['Solució'], typ: '', land: '', m: {}, composite: true, nl: (it.layers || []).length });
C.layerItem = (it, l) => ({ qty: (Number(it.qty) || 0) * (it.conv == null ? 1 : Number(it.conv)) * (Number(l.qty) || 0), conv: l.conv == null ? 1 : l.conv, vi: l.vi, rsl: l.rsl, price: null });
C.solRes = function (it, ctx) {
  const L = it.layers || []; const mods = {}, cov = {}; for (const m of M.MODS) { mods[m] = null; cov[m] = L.length > 0; }
  let cost = 0, costOk = L.length > 0, b4ds = 0, b4rsl = 0, any4 = false;
  for (const l of L) {
    const ds = ctx.ds(l.dsId), li = C.layerItem(it, l), r = C.modsOf(li, ds, ctx);
    for (const m of M.MODS) { if (r.mods[m] == null) cov[m] = false; else mods[m] = (mods[m] || 0) + r.mods[m]; }
    const up = C.unitPrice(li, ds, ctx); if (up == null) costOk = false; else cost += li.qty * up * (1);
  }
  let tot = 0, nd = 0; for (const m of ctx.counted) if (mods[m] != null) { tot += mods[m]; if (cov[m]) nd++; }
  const status = !L.length ? 'no' : (!ctx.counted.length ? 'ok' : (nd === ctx.counted.length ? 'ok' : (ctx.counted.some(m => mods[m] != null) ? 'pa' : 'no')));
  let up = null, c = null; if (it.price != null && !isNaN(it.price)) { up = it.price; c = (Number(it.qty) || 0) * up; } else if (costOk) { c = cost; up = (Number(it.qty) || 0) ? c / Number(it.qty) : null; }
  return { mods, partial: cov, tot, nd, status, d: mods['D'], cost: c, up, a: (Number(it.qty) || 0) * (it.conv == null ? 1 : Number(it.conv)), composite: true };
};
/* Resultat d'un element: valors per mòdul (kg CO2e totals de la quantitat), total dels mòduls comptats, estat de dades i cost */
C.itemRes = function (it, ds, ctx) {
  if (it.layers) return C.solRes(it, ctx);
  const x = C.modsOf(it, ds, ctx), mods = x.mods, counted = ctx.counted;
  let tot = 0, nd = 0; for (const m of counted) if (mods[m] != null) { tot += mods[m]; nd++; }
  const status = !ds ? 'no' : (!counted.length ? 'ok' : (nd === counted.length ? 'ok' : nd > 0 ? 'pa' : 'no'));
  const up = C.unitPrice(it, ds, ctx); const cost = up == null ? null : (Number(it.qty) || 0) * up;
  return { mods, tot, nd, status, d: mods['D'], cost, up, a: x.a, b4ds: x.b4ds, b4rsl: x.b4rsl, b4n: x.b4n };
};
/* Resultat d'una llista d'elements */
C.scn = function (items, ctx) {
  const rows = items.map(it => { const ds = it.layers ? C.solDs(it) : ctx.ds(it.dsId); return { it, ds, r: C.itemRes(it, ds, ctx) }; });
  const mods = {}; for (const m of M.MODS) mods[m] = { sum: 0, n: 0 };
  let total = 0, d = 0, dn = 0, cost = 0, costMiss = 0, ok = 0, pa = 0, no = 0;
  for (const x of rows) {
    for (const m of M.MODS) if (x.r.mods[m] != null) { mods[m].sum += x.r.mods[m]; mods[m].n++; }
    total += x.r.tot; if (x.r.d != null) { d += x.r.d; dn++; }
    if (x.r.cost != null) cost += x.r.cost; else costMiss++;
    if (x.r.status === 'ok') ok++; else if (x.r.status === 'pa') pa++; else no++;
  }
  const cp = ctx.cprice; const ctot = (cp != null && !isNaN(cp)) ? cost + total / 1000 * cp : null;
  return { rows, mods, total, d, dn, cost, costMiss, ok, pa, no, n: rows.length, ctot };
};
/* totals per grup d'elements (camp group) */
C.byGroup = function (res) {
  const m = new Map();
  for (const x of res.rows) { const g = x.it.group || '—'; const o = m.get(g) || { g, tot: 0, cost: 0, n: 0, miss: 0 }; o.tot += x.r.tot; if (x.r.cost != null) o.cost += x.r.cost; o.n++; if (x.r.status !== 'ok') o.miss++; m.set(g, o); }
  return Array.from(m.values()).sort((a, b) => Math.abs(b.tot) - Math.abs(a.tot));
};
/* punts calents: elements ordenats pel total comptat (valor absolut) */
C.pareto = function (res) {
  const rows = res.rows.filter(x => x.r.tot !== 0).slice().sort((a, b) => b.r.tot - a.r.tot);
  const pos = rows.filter(x => x.r.tot > 0); const sum = pos.reduce((s, x) => s + x.r.tot, 0); let acc = 0;
  return rows.map(x => { if (x.r.tot > 0) acc += x.r.tot; return { x, share: sum ? x.r.tot / sum : 0, cum: sum && x.r.tot > 0 ? acc / sum : null }; });
};
/* alternatives: datasets de la mateixa unitat i categoria (primers L nivells), amb Δ CO2e i Δ cost respecte a l'actual */
C.alts = function (it, ctx, o) {
  if (it.layers) return { base: null, list: [] }; const ds = ctx.ds(it.dsId); if (!ds || !GC.odb.lib) return { base: null, list: [] };
  const base = C.itemRes(it, ds, ctx); const L = Math.max(0, Math.min(o.level == null ? 2 : o.level, ds.cat.length)); const pre = ds.cat.slice(0, L);
  const list = [];
  for (const d of GC.odb.lib.list) {
    if (d.id === ds.id || d.u !== ds.u) continue; if (o.types && !o.types[d.typ]) continue; if (o.land && d.land !== o.land) continue;
    let okc = true; for (let i = 0; i < pre.length; i++) if (d.cat[i] !== pre[i]) { okc = false; break; } if (!okc) continue;
    const alt = Object.assign({}, it, { dsId: d.id, vi: null, price: null });
    const r = C.itemRes(alt, d, ctx); const complete = r.status === 'ok';
    const dco = complete && base.status === 'ok' ? r.tot - base.tot : null;
    const dcost = r.cost != null && base.cost != null ? r.cost - base.cost : null;
    list.push({ ds: d, r, complete, dco, dcost, quad: C.quad(dco, dcost) });
  }
  return { base, list };
};
C.quad = function (dco, dcost) {
  if (dco == null || dcost == null) return '';
  if (dco < 0 && dcost <= 0) return 'gg'; if (dco < 0 && dcost > 0) return 'cc'; if (dco >= 0 && dcost < 0) return 'ce'; return 'pp';
};
C.QUAD = { gg: 'Menys CO₂e i menys cost', cc: 'Menys CO₂e, més cost', ce: 'Menys cost, més CO₂e', pp: 'Més CO₂e i més cost' };
/* cost de l'estalvi: €/t CO2e evitada (només si estalvia CO2e i costa més) */
C.abate = function (dco, dcost) { return (dco != null && dco < 0 && dcost != null && dcost > 0) ? dcost / (-dco / 1000) : null; };

/* alternatives per a solucions compostes: altres solucions de la mateixa unitat */
C.altsSol = function (it, ctx, sols) {
  const base = C.itemRes(it, null, ctx); const list = [];
  for (const sol of sols) {
    if (sol.id === it.solId || M.itemUnit(sol.unit) !== M.itemUnit(it.unit)) continue;
    const alt = Object.assign({}, it, { layers: U.clone(sol.layers), solId: sol.id, price: null });
    const r = C.itemRes(alt, null, ctx); const complete = r.status === 'ok';
    const dco = complete && base.status === 'ok' ? r.tot - base.tot : null; const dcost = r.cost != null && base.cost != null ? r.cost - base.cost : null;
    list.push({ sol, r, complete, dco, dcost, quad: C.quad(dco, dcost) });
  }
  return { base, list };
};
/* nivell de categoria per defecte: el més específic amb almenys n alternatives completes */
C.autoLevel = function (it, ctx, o, n) {
  const ds = ctx.ds(it.dsId); if (!ds) return 1; n = n || 3;
  for (let L = ds.cat.length; L >= 1; L--) { const A = C.alts(it, ctx, Object.assign({}, o, { level: L })); if (A.list.filter(a => a.complete).length >= n) return L; }
  return 1;
};
