/* guaitaCO2 — constants del cicle de vida i biblioteca ÖKOBAUDAT (importador CSV en streaming, índex, cerca) */
const M = GC.M = {};
M.MODS = ['A1', 'A2', 'A3', 'A1-A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'C1', 'C2', 'C3', 'C4', 'D'];
M.COUNTABLE = ['A1-A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'C1', 'C2', 'C3', 'C4'];
M.GROUPS = [
  { id: 'A', t: 'A · Producte', mods: ['A1', 'A2', 'A3', 'A1-A3'], cls: 'gA' },
  { id: 'A4', t: 'A4–A5 · Construcció', mods: ['A4', 'A5'], cls: 'gA4' },
  { id: 'B', t: 'B1–B7 · Ús', mods: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'], cls: 'gB' },
  { id: 'C', t: 'C1–C4 · Final de vida', mods: ['C1', 'C2', 'C3', 'C4'], cls: 'gC' },
  { id: 'D', t: 'D · Fora dels límits', mods: ['D'], cls: 'gD' }
];
M.grpOf = mod => M.GROUPS.find(g => g.mods.indexOf(mod) >= 0);
M.INFO = {
  'A1': 'A1 · Extracció i processament de matèries primeres', 'A2': 'A2 · Transport fins a la fàbrica', 'A3': 'A3 · Fabricació',
  'A1-A3': 'A1–A3 · Fase de producte (suma d\'A1, A2 i A3)', 'A4': 'A4 · Transport fins a l\'obra', 'A5': 'A5 · Instal·lació i construcció',
  'B1': 'B1 · Ús del producte', 'B2': 'B2 · Manteniment', 'B3': 'B3 · Reparació', 'B4': 'B4 · Substitució', 'B5': 'B5 · Rehabilitació',
  'B6': 'B6 · Ús d\'energia operativa', 'B7': 'B7 · Ús d\'aigua operativa', 'C1': 'C1 · Desconstrucció i enderroc', 'C2': 'C2 · Transport dels residus',
  'C3': 'C3 · Tractament dels residus', 'C4': 'C4 · Eliminació (abocador)', 'D': 'D · Beneficis i càrregues fora dels límits del sistema (reutilització, recuperació, reciclatge)'
};
M.IND = {
  t: { i: 0, l: 'GWP-total', k: 'GWP-total' }, f: { i: 1, l: 'GWP-fòssil', k: 'GWP-fossil' },
  b: { i: 2, l: 'GWP-biogènic', k: 'GWP-biogenic' }, l: { i: 3, l: 'GWP-luluc', k: 'GWP-luluc' }
};
M.TYPES = { average: 'Mitjana', generic: 'Genèric', specific: 'Específic', template: 'Plantilla', representative: 'Representatiu' };
M.TYPE_HINT = {
  average: 'Mitjana sectorial o de grup de productes (EPD col·lectiva)', generic: 'Conjunt genèric d\'ÖKOBAUDAT (valor típic prudent)',
  specific: 'Dataset d\'un producte i fabricant concrets (EPD de fabricant)', template: 'Plantilla', representative: 'Representatiu d\'un grup de productes'
};
M.UNITS = { m2: 'm²', m3: 'm³', kg: 'kg', ud: 'ud', m: 'm', MJ: 'MJ', kgkm: 'kg·km', a: 'a', t: 't', h: 'h', '?': '?' };
const UMAP = { qm: 'm2', m2: 'm2', m3: 'm3', kg: 'kg', 'pcs.': 'ud', pcs: 'ud', m: 'm', mj: 'MJ', kgkm: 'kgkm', a: 'a' };
M.dsUnit = s => { s = String(s || '').trim().toLowerCase(); return UMAP[s] || (s ? s : '?'); };
M.itemUnit = function (s) {
  s = String(s == null ? '' : s).trim().toLowerCase().replace('²', '2').replace('³', '3').replace('·', '');
  if (/^(m2|qm)$/.test(s)) return 'm2'; if (s === 'm3') return 'm3'; if (s === 'kg') return 'kg';
  if (/^(t|tn|tm|ton|tona|tones)$/.test(s)) return 't'; if (/^(u|ud|uds|und|unid|unitat|pcs|pc|pça|pieza|peça|unidad)\.?$/.test(s)) return 'ud';
  if (/^(m|ml)$/.test(s)) return 'm'; if (s === 'mj') return 'MJ'; if (s === 'kgkm') return 'kgkm'; if (s === 'h') return 'h'; if (s === 'a') return 'a';
  return s || '?';
};
M.unitLabel = u => M.UNITS[u] || u;

/* ---------- Analitzador CSV en streaming (separador «;», cometes dobles, qualsevol salt de línia) ---------- */
function CsvParser(onRow, delim) {
  const D = (delim || ';').charCodeAt(0);
  let inQ = false, pendQ = false, row = [], field = '';
  this.feed = function (s) {
    let i = 0; const n = s.length;
    if (pendQ) { pendQ = false; if (n && s.charCodeAt(0) === 34) { field += '"'; i = 1; } else inQ = false; }
    while (i < n) {
      if (inQ) {
        const j = s.indexOf('"', i);
        if (j < 0) { field += s.slice(i); i = n; break; }
        field += s.slice(i, j);
        if (j + 1 >= n) { pendQ = true; i = n; break; }
        if (s.charCodeAt(j + 1) === 34) { field += '"'; i = j + 2; } else { inQ = false; i = j + 1; }
      } else {
        const st = i;
        while (i < n) { const c = s.charCodeAt(i); if (c === D || c === 10 || c === 13 || c === 34) break; i++; }
        if (i > st) field += s.slice(st, i);
        if (i >= n) break;
        const c = s.charCodeAt(i);
        if (c === D) { row.push(field); field = ''; i++; }
        else if (c === 10) { row.push(field); field = ''; if (!(row.length === 1 && row[0] === '')) onRow(row); row = []; i++; }
        else if (c === 13) { i++; }
        else { if (field === '') inQ = true; else field += '"'; i++; }
      }
    }
  };
  this.end = function () {
    if (pendQ) { pendQ = false; inQ = false; }
    if (field !== '' || row.length) { row.push(field); if (!(row.length === 1 && row[0] === '')) onRow(row); }
    row = []; field = '';
  };
}
M.CsvParser = CsvParser;
const num = s => { if (s == null || s === '') return null; const v = parseFloat(s); return isNaN(v) ? null : v; };
const REQ = ['UUID', 'Modul', 'Konformitaet', 'Typ', 'Bezugseinheit', 'Bezugsgroesse', 'GWPtotal (A2)', 'GWPfossil (A2)', 'GWPbiogenic (A2)', 'GWPluluc (A2)'];

/* ---------- Importador ---------- */
const ODB = GC.odb = { lib: null };

/* chunks: iterable (síncron o asíncron) de Uint8Array; el CSV d'ÖKOBAUDAT és Windows-1252 */
ODB.importStream = async function (chunks, total, onProg, fileName) {
  const dec = new TextDecoder('windows-1252'); let hdr = null, ix = null;
  const byId = new Map(); const st = { rowsRead: 0, nonA2: 0, empty: 0, kept: 0 };
  const onRow = r => {
    if (!hdr) {
      hdr = r; ix = {}; r.forEach((c, i) => { ix[c.trim()] = i; });
      for (const k of REQ) if (!(k in ix)) throw new Error('Aquest fitxer no sembla un CSV d\'ÖKOBAUDAT: falta la columna «' + k + '».');
      return;
    }
    st.rowsRead++;
    const g = k => { const i = ix[k]; return i == null ? '' : (r[i] || ''); };
    if (g('Konformitaet').indexOf('A2') < 0) { st.nonA2++; return; }
    const t = num(g('GWPtotal (A2)')), f = num(g('GWPfossil (A2)')), b = num(g('GWPbiogenic (A2)')), l = num(g('GWPluluc (A2)'));
    if (t == null && f == null && b == null && l == null) { st.empty++; return; }
    const id = g('UUID'), ver = g('Version'); let d = byId.get(id);
    if (d && d.v !== ver) { if (ver > d.v) { d = null; } else return; }
    if (!d) {
      const cat = g('Kategorie (en)') || g('Kategorie (original)');
      const nen = g('Name (en)'), nde = g('Name (de)');
      d = {
        id, v: ver, n: nen || nde, nd: (nde && nde !== nen) ? nde : '',
        cat: cat.split(' / ').map(x => x.trim().replace(/^'|'$/g, '')).filter(Boolean),
        typ: g('Typ').replace(/ dataset$/, '') || 'average', u: M.dsUnit(g('Bezugseinheit')),
        land: g('Laenderkennung'), yr: g('Referenzjahr'), valid: g('Gueltig bis'), own: g('Declaration owner'), pub: g('Veroeffentlicht am'),
        reg: g('Registrierungsnummer'), op: g('Registrierungsstelle'), url: g('URL'), conf: g('Konformitaet'),
        rho: num(g('Rohdichte (kg/m3)')), bulk: num(g('Schuettdichte (kg/m3)')), fl: num(g('Flaechengewicht (kg/m2)')), th: num(g('Schichtdicke (m)')),
        lw: num(g('Laengengewicht (kg/m)')), sw: num(g('Stueckgewicht (kg)')), cf: num(g('Umrechungsfaktor auf 1kg')), bc: num(g('biogener Kohlenstoffgehalt in kg')),
        m: {}
      };
      byId.set(id, d);
    }
    let bz = num(g('Bezugsgroesse')); if (!bz) bz = 1;
    const sc = n => n == null ? null : n / bz;
    const mod = g('Modul').trim(); if (!mod) return;
    (d.m[mod] = d.m[mod] || []).push({ s: g('Szenario'), d: g('Szenariobeschreibung'), v: [sc(t), sc(f), sc(b), sc(l)] });
    st.kept++;
  };
  const p = new CsvParser(onRow, ';'); let done = 0;
  for await (const ch of chunks) {
    p.feed(dec.decode(ch, { stream: true })); done += ch.length;
    if (onProg) { onProg(total ? Math.min(1, done / total) : 0); }
    await tick();
  }
  p.feed(dec.decode()); p.end();
  if (!hdr) throw new Error('El fitxer és buit.');
  const recs = Array.from(byId.values());
  if (!recs.length) throw new Error('No s\'ha trobat cap dataset EN 15804+A2 amb GWP al fitxer.');
  const rel = /OBD[_ -]?(\d{4})[_ -]?(I{1,3}|IV)?/i.exec(fileName || '');
  const meta = {
    name: 'ÖKOBAUDAT', release: rel ? rel[1] + (rel[2] ? '-' + rel[2].toUpperCase() : '') : '', file: fileName || '', bytes: total || done,
    rowsRead: st.rowsRead, rowsKept: st.kept, nonA2: st.nonA2, empty: st.empty, datasets: recs.length, importedAt: new Date().toISOString()
  };
  return { records: recs, meta };
};

/* Iterador asíncron de blocs d'un File/Blob (llegeix per parts per no omplir la memòria) */
ODB.fileChunks = async function* (file, step) {
  step = step || 4 * 1024 * 1024;
  for (let o = 0; o < file.size; o += step) yield new Uint8Array(await U.readBuf(file.slice(o, Math.min(file.size, o + step))));
};

/* ---------- Biblioteca en memòria ---------- */
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
ODB.norm = norm;
ODB.set = function (records, meta) {
  const list = records.slice().sort((a, b) => a.n.localeCompare(b.n, 'en'));
  const byId = new Map(); const tree = { name: '', n: list.length, kids: new Map(), path: [] };
  const counts = { types: {}, units: {}, lands: {} };
  for (const d of list) {
    byId.set(d.id, d); d._s = norm(d.n + ' ' + d.nd + ' ' + d.cat.join(' ') + ' ' + d.own + ' ' + d.reg + ' ' + d.land);
    let nd = tree;
    for (let i = 0; i < d.cat.length; i++) {
      let k = nd.kids.get(d.cat[i]); if (!k) { k = { name: d.cat[i], n: 0, kids: new Map(), path: d.cat.slice(0, i + 1) }; nd.kids.set(d.cat[i], k); }
      k.n++; nd = k;
    }
    counts.types[d.typ] = (counts.types[d.typ] || 0) + 1; counts.units[d.u] = (counts.units[d.u] || 0) + 1; counts.lands[d.land] = (counts.lands[d.land] || 0) + 1;
  }
  ODB.lib = { list, byId, meta, tree, counts };
  if (GC.refresh) GC.refresh('lib');
};
ODB.get = id => ODB.lib ? ODB.lib.byId.get(id) : null;
ODB.save = async function () {
  if (!ODB.lib) return false;
  const recs = ODB.lib.list.map(d => { const o = Object.assign({}, d); delete o._s; return o; });
  return GC.store.set('lib', { meta: ODB.lib.meta, records: recs });
};
ODB.load = async function () {
  const o = await GC.store.get('lib'); if (!o || !o.records || !o.records.length) return false;
  ODB.set(o.records, o.meta); return true;
};
ODB.clear = async function () { ODB.lib = null; await GC.store.del('lib'); if (GC.refresh) GC.refresh('lib'); };

/* filtre: {q, path:[...], types:{average:true,...}|null, unit, land, mod} */
ODB.filter = function (f) {
  if (!ODB.lib) return [];
  const toks = norm(f.q || '').split(/\s+/).filter(Boolean); const pth = f.path || [];
  return ODB.lib.list.filter(d => {
    if (f.types && !f.types[d.typ]) return false;
    if (f.unit && d.u !== f.unit) return false;
    if (f.land && d.land !== f.land) return false;
    for (let i = 0; i < pth.length; i++) if (d.cat[i] !== pth[i]) return false;
    if (f.mod && !d.m[f.mod]) return false;
    for (const t of toks) if (d._s.indexOf(t) < 0) return false;
    return true;
  });
};
