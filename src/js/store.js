/* guaitaCO2 — emmagatzematge local (IndexedDB): biblioteca ÖKOBAUDAT, preus i projecte de treball */
const ST = GC.store = {};
let _idb = null;
function openIDB() {
  if (_idb) return _idb;
  _idb = new Promise((res, rej) => {
    try {
      const r = indexedDB.open('guaitaCO2', 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('IndexedDB bloquejada'));
    } catch (e) { rej(e); }
  });
  return _idb;
}
ST.ok = true;
ST.get = async function (k) {
  try { const d = await openIDB(); return await new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
  catch (e) { ST.ok = false; return undefined; }
};
ST.set = async function (k, v) {
  try { const d = await openIDB(); return await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(true); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); }
  catch (e) { ST.ok = false; return false; }
};
ST.del = async function (k) {
  try { const d = await openIDB(); return await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = () => res(true); t.onerror = () => rej(t.error); }); }
  catch (e) { ST.ok = false; return false; }
};
