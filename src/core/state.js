// Persistent progress (localStorage) + photo album (IndexedDB, photos are big).
const KEY = 'hazei-journey-v1';

const defaults = () => ({
  chapter: 'discord',
  started: false,
  flowers: [], // { species, color }
  omakase: [], // chosen option index per round
  donut: null, // chosen donut index at the fair
  drink: null,
  bookmark: false,
  outfit: { hat: false, glasses: false },
  seen: {}, // one-shot flags (toasts, tips)
  settings: { volume: 0.8, muted: false },
});

let data = defaults();

export const state = {
  get data() { return data; },
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = { ...defaults(), ...JSON.parse(raw) };
    } catch { data = defaults(); }
    return data;
  },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode: keep in memory */ }
  },
  set(patch) { Object.assign(data, patch); this.save(); },
  reset({ keepAlbum = false, keepSettings = true } = {}) {
    const settings = data.settings;
    data = defaults();
    if (keepSettings) data.settings = settings;
    this.save();
    if (!keepAlbum) album.clear();
  },
  once(flag) {
    if (data.seen[flag]) return false;
    data.seen[flag] = true;
    this.save();
    return true;
  },
};

// ------------------------------------------------------------ album
const DB = 'hazei-album';
let dbp = null;
function db() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  return dbp;
}
const memAlbum = []; // fallback when IndexedDB is unavailable

export const album = {
  async add(photo) { // { kind, title, dataUrl, created }
    const item = { created: Date.now(), ...photo };
    try {
      const d = await db();
      await new Promise((res, rej) => {
        const tx = d.transaction('photos', 'readwrite');
        tx.objectStore('photos').add(item);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
    } catch { memAlbum.push(item); }
  },
  async list() {
    try {
      const d = await db();
      return await new Promise((res, rej) => {
        const r = d.transaction('photos').objectStore('photos').getAll();
        r.onsuccess = () => res(r.result.concat(memAlbum));
        r.onerror = () => rej(r.error);
      });
    } catch { return memAlbum.slice(); }
  },
  async clear() {
    memAlbum.length = 0;
    try {
      const d = await db();
      d.transaction('photos', 'readwrite').objectStore('photos').clear();
    } catch { /* ignore */ }
  },
};
