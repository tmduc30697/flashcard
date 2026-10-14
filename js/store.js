// Lưu trữ dữ liệu: localStorage, xuất/nhập JSON, dữ liệu mẫu.

const KEY = 'flashcard:data';
const FORMAT = 'flashcard-pwa';

let state = { decks: [], currentDeckId: null };
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
export const prefs = {
  get: (k) => safeGet('flashcard:' + k),
  set: (k, v) => safeSet('flashcard:' + k, String(v)),
};

function normCard(c) {
  if (!c || typeof c !== 'object') return null;
  const front = String(c.front ?? '').trim();
  const back = String(c.back ?? '').trim();
  if (!front && !back) return null;
  return {
    id: typeof c.id === 'string' && c.id ? c.id : uid(),
    front,
    back,
    note: String(c.note ?? '').trim(),
    known: !!c.known,
    createdAt: Number(c.createdAt) || Date.now(),
  };
}

function normDeck(d) {
  if (!d || typeof d !== 'object') return null;
  return {
    id: typeof d.id === 'string' && d.id ? d.id : uid(),
    name: String(d.name ?? '').trim() || 'Bộ không tên',
    createdAt: Number(d.createdAt) || Date.now(),
    cards: Array.isArray(d.cards) ? d.cards.map(normCard).filter(Boolean) : [],
  };
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
    id: uid(),
    name: 'IELTS – Environment',
    createdAt: now,
    cards: words.map(([front, back, note], i) => ({
      id: uid() + i, front, back, note, known: false, createdAt: now + i,
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
    state.currentDeckId = data.currentDeckId;
  } else {
    state.decks = [sampleDeck()];
  }
  if (!state.decks.length) state.decks = [{ id: uid(), name: 'Bộ thẻ của tôi', createdAt: Date.now(), cards: [] }];
  if (!state.decks.some((d) => d.id === state.currentDeckId)) state.currentDeckId = state.decks[0].id;
  save();
}

export function save() {
  safeSet(KEY, JSON.stringify({ version: 1, decks: state.decks, currentDeckId: state.currentDeckId }));
  listeners.forEach((fn) => fn());
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
  if (getDeck(id)) { state.currentDeckId = id; save(); }
}

export function addDeck(name) {
  const deck = { id: uid(), name: name.trim() || 'Bộ mới', createdAt: Date.now(), cards: [] };
  state.decks.push(deck);
  state.currentDeckId = deck.id;
  save();
  return deck;
}

export function renameDeck(id, name) {
  const d = getDeck(id);
  if (d && name.trim()) { d.name = name.trim(); save(); }
}

export function deleteDeck(id) {
  const i = state.decks.findIndex((d) => d.id === id);
  if (i < 0) return;
  state.decks.splice(i, 1);
  if (!state.decks.length) state.decks.push({ id: uid(), name: 'Bộ thẻ của tôi', createdAt: Date.now(), cards: [] });
  if (state.currentDeckId === id) state.currentDeckId = state.decks[Math.max(0, i - 1)].id;
  save();
}

// ---- Thẻ ----
export function addCards(deckId, items) {
  const d = getDeck(deckId);
  if (!d) return [];
  const now = Date.now();
  const added = items
    .map((it, i) => normCard({ ...it, id: uid() + i, known: false, createdAt: now + i }))
    .filter(Boolean);
  d.cards.push(...added);
  save();
  return added;
}

export function updateCard(deckId, cardId, patch) {
  const c = getDeck(deckId)?.cards.find((x) => x.id === cardId);
  if (!c) return;
  Object.assign(c, patch);
  save();
}

export function deleteCard(deckId, cardId) {
  const d = getDeck(deckId);
  if (!d) return null;
  const i = d.cards.findIndex((x) => x.id === cardId);
  if (i < 0) return null;
  const [card] = d.cards.splice(i, 1);
  save();
  return { card, index: i };
}

export function restoreCard(deckId, card, index) {
  const d = getDeck(deckId);
  if (!d) return;
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

  const imported = decks.map(normDeck).filter(Boolean).map((d) => {
    const names = new Set(state.decks.map((x) => x.name));
    let name = d.name;
    for (let n = 2; names.has(name); n++) name = `${d.name} (${n})`;
    return { ...d, id: uid(), name, cards: d.cards.map((c) => ({ ...c, id: uid() + Math.random().toString(36).slice(2, 5) })) };
  });
  if (!imported.length) throw new Error('Không tìm thấy bộ thẻ nào trong file');
  state.decks.push(...imported);
  state.currentDeckId = imported[0].id;
  save();
  return imported;
}
