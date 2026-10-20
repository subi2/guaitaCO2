/* guaitaCO2 — nucli: utilitats, icones, modals, preferències. SBS BiM Consulting, Jordi Subirós */
const GC = {}; const U = GC.U = {};
GC.SRC = { name: 'ÖKOBAUDAT', owner: 'BMWSB / BBSR', url: 'https://www.oekobaudat.de', dl: 'https://www.oekobaudat.de/en/service/downloads.html', csv: 'https://www.oekobaudat.de/OEKOBAU.DAT/resource/datastocks/cc64f7e1-14d8-4a57-b11b-2cf03d200c82/exportCSV' };
const $ = id => document.getElementById(id); U.$ = $;

function add(e, kids) {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) add(e, k);
    else if (k.nodeType) e.appendChild(k);
    else e.appendChild(document.createTextNode(String(k)));
  }
}
function h(tag, a) {
  const e = document.createElement(tag);
  if (a) for (const k in a) {
    const v = a[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (k === 'list' || k === 'for' || k.slice(0, 5) === 'data-' || k === 'colspan' || k === 'rowspan') e.setAttribute(k, v);
    else { try { e[k] = v; } catch (_) { e.setAttribute(k, v); } }
  }
  add(e, Array.prototype.slice.call(arguments, 2)); return e;
}
U.h = h;
function svgEl(tag, a, text) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (a) for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]);
  if (text != null) e.textContent = text; return e;
}
U.svg = svgEl;

/* ---------- Icones (SVG de traç, estil guaitaPDF) ---------- */
const ICO = {
  open: '<path d="M3 7.5V19h18V9.5H11.5l-2-2.5H3z"/><path d="M3 11h18"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M12 11v6M9 14h6"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  base: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  fromLib: '<ellipse cx="10" cy="6" rx="6" ry="2.5"/><path d="M4 6v9c0 1.4 2.7 2.5 6 2.5"/><path d="M4 10.5c0 1.4 2.7 2.5 6 2.5"/><path d="M17 14v7M13.5 17.5h7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V4H4v12h4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  chart: '<path d="M4 20V11M10 20V4M16 20v-6"/><path d="M2 20h20"/>',
  scale: '<path d="M12 4v16M6 20h12"/><path d="M5 8h14"/><path d="M5 8l-2.5 6a2.5 2 0 005 0zM19 8l-2.5 6a2.5 2 0 005 0z"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01"/>',
  dl: '<path d="M12 4v11M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
  layers: '<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-5 6-8 10-10"/>'
};
U.ico = n => { const t = document.createElement('template'); t.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICO[n] || '') + '</svg>'; return t.content.firstChild; };

/* ---------- Format de números (català) ---------- */
function loc(v, d) {
  try { return v.toLocaleString('ca-ES', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  catch (e) { return v.toFixed(d).replace('.', ','); }
}
/* nombre amb xifres adaptatives (per a valors de CO2e que van de 1e-6 a 1e6) */
U.fmtV = function (v) {
  if (v == null || typeof v !== 'number' || isNaN(v)) return '';
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1000) return loc(v, 0);
  if (a >= 100) return loc(v, 1);
  if (a >= 1) return loc(v, 2);
  if (a >= 0.01) return loc(v, 3);
  return v.toExponential(2).replace('.', ',').replace('e', 'e');
};
U.fmt = (v, d) => (v == null || typeof v !== 'number' || isNaN(v)) ? '' : loc(v, d == null ? 2 : d);
U.fmtPct = v => (v == null || isNaN(v)) ? '' : (v > 0 ? '+' : '') + loc(v, 1) + ' %';
U.fmtD = (v, d) => (v == null || isNaN(v)) ? '' : (v > 0 ? '+' : '') + loc(v, d == null ? 2 : d);
U.numIn = s => { s = String(s == null ? '' : s).trim(); if (s === '') return null; const n = Number(s.replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? NaN : n; };
U.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
U.slug = s => String(s || 'guaitaCO2').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'guaitaCO2';
U.clone = o => JSON.parse(JSON.stringify(o));
U.esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tick = U.tick = () => new Promise(r => setTimeout(r, 0));

/* ---------- Preferències (localStorage, només comoditats d'UI) ---------- */
const PK = 'guaitaCO2.prefs';
U.pref = (k, d) => { try { const o = JSON.parse(localStorage.getItem(PK) || '{}'); return k in o ? o[k] : d; } catch (e) { return d; } };
U.setPref = (k, v) => { try { const o = JSON.parse(localStorage.getItem(PK) || '{}'); o[k] = v; localStorage.setItem(PK, JSON.stringify(o)); } catch (e) { } };

/* ---------- Estat i progrés ---------- */
let stT = null;
U.status = (t, cls, ms) => { const e = $('status'); if (!e) return; e.textContent = t; e.className = cls || ''; clearTimeout(stT); if (ms) stT = setTimeout(() => { e.textContent = ''; e.className = ''; }, ms); };
U.prog = p => { const e = $('prog'); if (e) e.style.width = (p <= 0 || p >= 1 ? 0 : p * 100) + '%'; };

/* ---------- Modals ---------- */
U.modal = function (title, body, buttons, opts) {
  opts = opts || {};
  return new Promise(res => {
    const close = v => { m.remove(); document.removeEventListener('keydown', kd, true); res(v); };
    const kd = e => { if (e.key !== 'Escape') return; const all = document.querySelectorAll('.modal'); if (all[all.length - 1] !== m) return; e.stopPropagation(); close(undefined); };
    const bs = (buttons || [{ l: 'Tanca', v: true, pri: 1 }]).map(b => h('button', { class: b.pri ? 'pri' : '', onclick: () => { if (b.check && !b.check()) return; close(b.v); } }, b.l));
    const m = h('div', { class: 'modal ' + (opts.cls || ''), onmousedown: e => { if (e.target === m && !opts.sticky) close(undefined); } },
      h('div', { class: 'mbox' }, h('h3', null, title), h('div', { class: 'bd' }, body), h('div', { class: 'ft' }, bs)));
    document.addEventListener('keydown', kd, true); document.body.appendChild(m);
    const f = opts.noFocus ? null : m.querySelector('input,select,textarea'); if (f) setTimeout(() => f.focus(), 0);
    if (opts.onOpen) opts.onOpen(m, close);
  });
};
U.confirm = (title, msg, okLabel) => U.modal(title, h('div', null, msg), [{ l: 'Cancel·la', v: false }, { l: okLabel || 'Accepta', v: true, pri: 1 }]).then(v => !!v);
U.info = (title, body, opts) => U.modal(title, body, [{ l: 'Tanca', v: true, pri: 1 }], opts);
/* fields: [{k,l,v,type:'text'|'number'|'select'|'check'|'area',opts:[[v,l]]}] → objecte o null */
U.ask = async function (title, fields, intro, okLabel) {
  const els = {}; const rows = [];
  if (intro) rows.push(h('p', { class: 'mu' }, intro));
  for (const f of fields) {
    let e;
    if (f.type === 'select') e = h('select', null, f.opts.map(o => h('option', { value: o[0], selected: String(o[0]) === String(f.v) }, o[1])));
    else if (f.type === 'check') e = h('input', { type: 'checkbox', checked: !!f.v });
    else if (f.type === 'area') e = h('textarea', { value: f.v == null ? '' : f.v });
    else e = h('input', { type: 'text', value: f.v == null ? '' : f.v, style: { width: '100%' }, onkeydown: ev => { if (ev.key === 'Enter') { const b = document.querySelector('.mbox .ft .pri'); if (b) b.click(); } } });
    els[f.k] = e;
    rows.push(f.type === 'check' ? h('div', { class: 'row' }, e, h('label', null, f.l)) : h('div', { class: 'f', style: { marginBottom: '8px' } }, h('label', null, f.l), e));
  }
  const ok = await U.modal(title, h('div', null, rows), [{ l: 'Cancel·la', v: false }, { l: okLabel || 'Accepta', v: true, pri: 1 }]);
  if (!ok) return null; const out = {};
  for (const f of fields) out[f.k] = f.type === 'check' ? els[f.k].checked : els[f.k].value;
  return out;
};

/* ---------- Fitxers ---------- */
U.download = function (name, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob); const a = h('a', { href: url, download: name });
  document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
};
U.readBuf = blob => new Promise((res, rej) => {
  if (blob.arrayBuffer) { blob.arrayBuffer().then(res, rej); return; }
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsArrayBuffer(blob);
});
U.readText = async function (file, enc) {
  const buf = await U.readBuf(file); return new TextDecoder(enc || 'utf-8').decode(buf);
};
U.pickFile = function (accept) {
  return new Promise(res => {
    const inp = $('fileIn'); inp.value = ''; inp.accept = accept || ''; let done = false;
    inp.onchange = () => { done = true; res(inp.files && inp.files[0] || null); };
    window.addEventListener('focus', function f() { window.removeEventListener('focus', f); setTimeout(() => { if (!done) res(null); }, 600); });
    inp.click();
  });
};
U.csvEsc = v => { v = v == null ? '' : String(v); return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
U.csv = rows => '﻿' + rows.map(r => r.map(U.csvEsc).join(';')).join('\r\n') + '\r\n';

/* ---------- Tema ---------- */
U.setTheme = function (t) {
  document.body.classList.toggle('light', t === 'light'); U.setPref('theme', t);
  const b = $('bTheme'); if (b) { b.textContent = ''; b.appendChild(U.ico(t === 'light' ? 'moon' : 'sun')); b.title = t === 'light' ? 'Passa al tema fosc' : 'Passa al tema clar'; }
  if (GC.refresh) GC.refresh('theme');
};
U.toggleTheme = () => U.setTheme(document.body.classList.contains('light') ? 'dark' : 'light');
