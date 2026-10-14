// Lưu trữ dữ liệu: localStorage, xuất/nhập JSON, dữ liệu mẫu, gộp dữ liệu khi đồng bộ.

const KEY = 'flashcard:data';
const FORMAT = 'flashcard-pwa';
const TOMBSTONE_TTL = 90 * 24 * 3600 * 1000; // nhớ thẻ/bộ đã xóa 90 ngày để máy khác cũng xóa theo

// deleted: { [id]: thời điểm xóa } — dùng khi gộp với dữ liệu trên Gist
// pristine: dữ liệu vẫn chỉ là bộ mẫu chưa đụng tới (bỏ đi khi đồng bộ lần đầu)
let state = { decks: [], deleted: {}, currentDeckId: null, pristine: false };
const listeners = new Set();

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function safeRemove(key) {
  try { localStorage.removeItem(key); } catch { /* bỏ qua */ }
}
export const prefs = {
  get: (k) => safeGet('flashcard:' + k),
  set: (k, v) => safeSet('flashcard:' + k, String(v)),
  remove: (k) => safeRemove('flashcard:' + k),
};

function normCard(c) {
  if (!c || typeof c !== 'object') return null;
  const front = String(c.front ?? '').trim();
  const back = String(c.back ?? '').trim();
  if (!front && !back) return null;
  const createdAt = Number(c.createdAt) || Date.now();
  return {
    id: typeof c.id === 'string' && c.id ? c.id : uid(),
    front,
    back,
    note: String(c.note ?? '').trim(),
    known: !!c.known,
    createdAt,
    updatedAt: Number(c.updatedAt) || createdAt,
  };
}

function normDeck(d) {
  if (!d || typeof d !== 'object') return null;
  const createdAt = Number(d.createdAt) || Date.now();
  return {
    id: typeof d.id === 'string' && d.id ? d.id : uid(),
    name: String(d.name ?? '').trim() || 'Bộ không tên',
    createdAt,
    updatedAt: Number(d.updatedAt) || createdAt,
    cards: Array.isArray(d.cards) ? d.cards.map(normCard).filter(Boolean) : [],
  };
}

function normDeleted(obj) {
  const out = {};
  const now = Date.now();
  if (obj && typeof obj === 'object') {
    for (const [id, t] of Object.entries(obj)) {
      if (Number(t) && now - Number(t) < TOMBSTONE_TTL) out[id] = Number(t);
    }
  }
  return out;
}

function newDeck(name) {
  const now = Date.now();
  return { id: uid(), name, createdAt: now, updatedAt: now, cards: [] };
}

function sampleDeck() {
  const words = [
    ['deforestation', 'nạn phá rừng', 'Deforestation is destroying the habitats of many species.'],
    ['biodiversity', 'đa dạng sinh học', 'Coral reefs support an incredible level of biodiversity.'],
    ['carbon footprint', 'lượng khí thải carbon (của một cá nhân/tổ chức)', 'Cycling to work can reduce your carbon footprint.'],
    ['renewable energy', 'năng lượng tái tạo', 'Many countries are investing heavily in renewable energy.'],
    ['endangered species', 'loài có nguy cơ tuyệt chủng', 'The tiger is an endangered species.'],
    ['sustainable', 'bền vững', 'We need more sustainable ways of producing food.'],
    ['pollutant', 'chất gây ô nhiễm', 'Factories release pollutants into rivers.'],
    ['mitigate', 'giảm nhẹ, làm dịu bớt', 'Planting trees can help mitigate climate change.'],
  ];
  const now = Date.now();
  return {
    ...newDeck('IELTS – Environment'),
    cards: words.map(([front, back, note], i) => ({
      id: uid() + i, front, back, note, known: false, createdAt: now + i, updatedAt: now + i,
    })),
  };
}

export function load() {
  const raw = safeGet(KEY);
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = null; }
  }
  if (data && Array.isArray(data.decks)) {
    state.decks = data.decks.map(normDeck).filter(Boolean);
    state.deleted = normDeleted(data.deleted);
    state.currentDeckId = data.currentDeckId;
    state.pristine = !!data.pristine;
  } else {
    state.decks = [sampleDeck()];
    state.pristine = true;
  }
  ensureDeck();
  persist();
}

function ensureDeck() {
  if (!state.decks.some((d) => d.id === state.currentDeckId)) state.currentDeckId = state.decks[0]?.id ?? null;
}

function persist() {
  safeSet(KEY, JSON.stringify({
    version: 1, decks: state.decks, deleted: state.deleted,
    currentDeckId: state.currentDeckId, pristine: state.pristine,
  }));
}

// source: 'local' = người dùng sửa (cần đẩy lên Gist), 'sync' = vừa nhận từ Gist, 'view' = chỉ đổi bộ đang xem
export function save(source = 'local') {
  if (source === 'local') state.pristine = false;
  persist();
  listeners.forEach((fn) => fn(source));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---- Bộ thẻ ----
export const getDecks = () => state.decks;
export const getDeck = (id) => state.decks.find((d) => d.id === id) || null;
export const currentDeck = () => getDeck(state.currentDeckId) || state.decks[0] || null;

export function setCurrentDeck(id) {
  if (getDeck(id)) { state.currentDeckId = id; save('view'); }
}

export function addDeck(name) {
  const deck = newDeck(name.trim() || 'Bộ mới');
  state.decks.push(deck);
  state.currentDeckId = deck.id;
  save();
  return deck;
}

export function renameDeck(id, name) {
  const d = getDeck(id);
  if (d && name.trim()) { d.name = name.trim(); d.updatedAt = Date.now(); save(); }
}

export function deleteDeck(id) {
  const i = state.decks.findIndex((d) => d.id === id);
  if (i < 0) return;
  state.decks.splice(i, 1);
  state.deleted[id] = Date.now();
  if (state.currentDeckId === id) state.currentDeckId = state.decks[Math.max(0, i - 1)]?.id ?? null;
  save();
}

// Xóa mọi bộ thẻ; trả về danh sách đã xóa để có thể hoàn tác
export function deleteAllDecks() {
  const removed = state.decks;
  const now = Date.now();
  for (const d of removed) state.deleted[d.id] = now;
  state.decks = [];
  state.currentDeckId = null;
  save();
  return removed;
}

export function restoreDecks(decks) {
  const now = Date.now();
  for (const d of decks) {
    delete state.deleted[d.id];
    d.updatedAt = now; // mới hơn lần xóa → thắng khi gộp ở máy khác
    if (!getDeck(d.id)) state.decks.push(d);
  }
  ensureDeck();
  save();
}

// ---- Thẻ ----
export function addCards(deckId, items) {
  const d = getDeck(deckId);
  if (!d) return [];
  const now = Date.now();
  const added = items
    .map((it, i) => normCard({ ...it, id: uid() + i, known: false, createdAt: now + i, updatedAt: now + i }))
    .filter(Boolean);
  d.cards.push(...added);
  save();
  return added;
}

export function updateCard(deckId, cardId, patch) {
  const c = getDeck(deckId)?.cards.find((x) => x.id === cardId);
  if (!c) return;
  Object.assign(c, patch, { updatedAt: Date.now() });
  save();
}

export function deleteCard(deckId, cardId) {
  const d = getDeck(deckId);
  if (!d) return null;
  const i = d.cards.findIndex((x) => x.id === cardId);
  if (i < 0) return null;
  const [card] = d.cards.splice(i, 1);
  state.deleted[cardId] = Date.now();
  save();
  return { card, index: i };
}

export function restoreCard(deckId, card, index) {
  const d = getDeck(deckId);
  if (!d) return;
  delete state.deleted[card.id];
  card.updatedAt = Date.now();
  d.cards.splice(Math.min(index, d.cards.length), 0, card);
  save();
}

// ---- "Thêm nhiều": mỗi dòng `mặt trước - mặt sau`, hoặc tab, hoặc " : " ----
export function parseBulk(text) {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let parts = null;
    if (line.includes('\t')) {
      const i = line.indexOf('\t');
      parts = [line.slice(0, i), line.slice(i + 1)];
    } else {
      const m = line.match(/^(.*?)\s+[-–—:]\s+(.*)$/) || line.match(/^(.*?)\s*[–—]\s*(.*)$/) || line.match(/^([^-]*?)\s*-\s*(.*)$/);
      if (m) parts = [m[1], m[2]];
    }
    if (!parts) continue;
    const front = parts[0].trim();
    const back = parts[1].trim();
    if (front && back) out.push({ front, back });
  }
  return out;
}

// ---- Xuất / nhập JSON ----
export function exportData(deckId) {
  const decks = deckId ? [getDeck(deckId)].filter(Boolean) : state.decks;
  return {
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    decks: JSON.parse(JSON.stringify(decks)),
  };
}

// Nhập: nhận {decks:[...]}, một deck {name, cards}, hoặc mảng deck.
// Bộ nhập vào luôn được thêm mới (id mới) để không ghi đè dữ liệu đang có.
export function importData(json) {
  let decks;
  if (Array.isArray(json)) decks = json;
  else if (json && Array.isArray(json.decks)) decks = json.decks;
  else if (json && Array.isArray(json.cards)) decks = [json];
  else throw new Error('File không đúng định dạng');

  const now = Date.now();
  const imported = decks.map(normDeck).filter(Boolean).map((d) => {
    const names = new Set(state.decks.map((x) => x.name));
    let name = d.name;
    for (let n = 2; names.has(name); n++) name = `${d.name} (${n})`;
    return {
      ...d, id: uid(), name, updatedAt: now,
      cards: d.cards.map((c) => ({ ...c, id: uid() + Math.random().toString(36).slice(2, 5), updatedAt: now })),
    };
  });
  if (!imported.length) throw new Error('Không tìm thấy bộ thẻ nào trong file');
  state.decks.push(...imported);
  state.currentDeckId = imported[0].id;
  save();
  return imported;
}

// ---- Đồng bộ ----
// Dữ liệu ghi lên Gist (không gồm bộ đang xem — cái đó riêng từng máy)
export function syncSnapshot() {
  return { format: FORMAT, version: 1, decks: state.decks, deleted: state.deleted };
}

export const isPristine = () => state.pristine;

// Gộp dữ liệu từ Gist vào máy: theo từng bộ/thẻ, bản nào sửa sau thì thắng;
// thẻ/bộ đã xóa (tombstone) thắng nếu bị xóa sau lần sửa cuối.
export function mergeRemote(remote, { dropLocal = false } = {}) {
  const local = dropLocal ? { decks: [], deleted: {} } : { decks: state.decks, deleted: state.deleted };
  const rDecks = Array.isArray(remote?.decks) ? remote.decks.map(normDeck).filter(Boolean) : [];
  const deleted = { ...normDeleted(remote?.deleted) };
  for (const [id, t] of Object.entries(local.deleted)) deleted[id] = Math.max(deleted[id] || 0, t);
  const alive = (x) => !(deleted[x.id] >= x.updatedAt);

  const pick = (a, b) => (!a ? b : !b ? a : b.updatedAt > a.updatedAt ? b : a);
  const mergeList = (la, ra, mergeItem) => {
    const rMap = new Map(ra.map((x) => [x.id, x]));
    const seen = new Set();
    const out = [];
    for (const l of la) { seen.add(l.id); out.push(mergeItem(l, rMap.get(l.id))); }
    for (const r of ra) if (!seen.has(r.id)) out.push(mergeItem(null, r));
    return out.filter(alive);
  };

  const decks = mergeList(local.decks, rDecks, (l, r) => {
    const base = pick(l, r);
    return { ...base, cards: mergeList(l?.cards || [], r?.cards || [], (lc, rc) => ({ ...pick(lc, rc) })) };
  });

  state.decks = decks;
  state.deleted = deleted;
  if (dropLocal) state.pristine = false;
  ensureDeck();
  save('sync');
}
