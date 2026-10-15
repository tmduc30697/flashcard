// Lưu trữ dữ liệu: localStorage, nhập JSON, dữ liệu mẫu, gộp dữ liệu khi đồng bộ (Firebase).

import { splitIPA } from './ipa.js';

const KEY = 'flashcard:data';
const FORMAT = 'flashcard-pwa';
const TOMBSTONE_TTL = 90 * 24 * 3600 * 1000; // nhớ thẻ/bộ đã xóa 90 ngày để máy khác cũng xóa theo

// deleted: { [id]: thời điểm xóa } — dùng khi gộp với dữ liệu trên server
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

// Thẻ: front = câu tiếng Việt, back = câu tiếng Anh, ipa = phiên âm, note = ghi chú.
// File nhập dùng tên trường vi / en / ipa / note (vẫn nhận front / back kiểu cũ).
function normCard(c) {
  if (!c || typeof c !== 'object') return null;
  const front = String(c.vi ?? c.front ?? '').trim();
  let back = String(c.en ?? c.back ?? '').trim();
  let ipa = String(c.ipa ?? '').trim();
  if (!front || !back) return null; // cần đủ câu tiếng Việt và câu tiếng Anh
  if (!ipa) [back, ipa] = splitIPA(back); // dữ liệu cũ: IPA viết chung sau câu tiếng Anh
  ipa = ipa.replace(/^[/[]\s*|\s*[/\]]$/g, '');
  const createdAt = Number(c.createdAt) || Date.now();
  return {
    id: typeof c.id === 'string' && c.id ? c.id : uid(),
    front,
    back,
    ipa,
    note: String(c.note ?? '').trim(),
    queued: !!c.queued, // "Chưa thuộc" → nằm trong hàng chờ, ẩn khỏi danh sách
    queuedAt: Number(c.queuedAt) || 0,
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
    ['Nạn phá rừng đang huỷ hoại môi trường sống của nhiều loài.', 'Deforestation is destroying the habitats of many species.', 'ˌdiːˌfɒrɪˈsteɪʃn ɪz dɪˈstrɔɪɪŋ ðə ˈhæbɪtæts əv ˈmeni ˈspiːʃiːz', 'deforestation: nạn phá rừng'],
    ['Rạn san hô có mức đa dạng sinh học đáng kinh ngạc.', 'Coral reefs support an incredible level of biodiversity.', 'ˈkɒrəl riːfs səˈpɔːt ən ɪnˈkredəbl ˈlevl əv ˌbaɪəʊdaɪˈvɜːsəti', 'biodiversity: đa dạng sinh học'],
    ['Đạp xe đi làm có thể giảm lượng khí thải carbon của bạn.', 'Cycling to work can reduce your carbon footprint.', 'ˈsaɪklɪŋ tə wɜːk kən rɪˈdjuːs jɔː ˈkɑːbən ˈfʊtprɪnt', 'carbon footprint: lượng khí thải carbon'],
    ['Nhiều nước đang đầu tư mạnh vào năng lượng tái tạo.', 'Many countries are investing heavily in renewable energy.', 'ˈmeni ˈkʌntriz ə ɪnˈvestɪŋ ˈhevɪli ɪn rɪˈnjuːəbl ˈenədʒi', 'renewable energy: năng lượng tái tạo'],
    ['Hổ là loài có nguy cơ tuyệt chủng.', 'The tiger is an endangered species.', 'ðə ˈtaɪɡə ɪz ən ɪnˈdeɪndʒəd ˈspiːʃiːz', 'endangered species: loài có nguy cơ tuyệt chủng'],
    ['Chúng ta cần những cách sản xuất lương thực bền vững hơn.', 'We need more sustainable ways of producing food.', 'wi niːd mɔː səˈsteɪnəbl weɪz əv prəˈdjuːsɪŋ fuːd', 'sustainable: bền vững'],
    ['Các nhà máy thải chất gây ô nhiễm ra sông.', 'Factories release pollutants into rivers.', 'ˈfæktəriz rɪˈliːs pəˈluːtənts ˈɪntə ˈrɪvəz', 'pollutant: chất gây ô nhiễm'],
    ['Trồng cây có thể giúp giảm nhẹ biến đổi khí hậu.', 'Planting trees can help mitigate climate change.', 'ˈplɑːntɪŋ triːz kən help ˈmɪtɪɡeɪt ˈklaɪmət tʃeɪndʒ', 'mitigate: giảm nhẹ'],
  ];
  const now = Date.now();
  return {
    ...newDeck('IELTS – Environment'),
    cards: words.map(([front, back, ipa, note], i) => ({
      id: uid() + i, front, back, ipa, note, queued: false, queuedAt: 0, createdAt: now + i, updatedAt: now + i,
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

// source: 'local' = người dùng sửa (cần đẩy lên server), 'sync' = vừa nhận từ server, 'view' = chỉ đổi bộ đang xem
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
  if (decks[0]) state.currentDeckId = decks[0].id;
  ensureDeck();
  save();
}

// ---- Thẻ ----
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

// Đưa thẻ vào hàng chờ ("Chưa thuộc") hoặc lấy ra
export function setQueued(deckId, cardId, queued) {
  updateCard(deckId, cardId, { queued, queuedAt: queued ? Date.now() : 0 });
}

// Đưa toàn bộ hàng chờ về cuối danh sách, theo thứ tự đã xếp vào hàng chờ
export function reloadQueue(deckId) {
  const d = getDeck(deckId);
  if (!d) return 0;
  const queued = d.cards.filter((c) => c.queued).sort((a, b) => a.queuedAt - b.queuedAt);
  const now = Date.now();
  d.cards = d.cards.filter((c) => !c.queued).concat(queued);
  for (const c of queued) Object.assign(c, { queued: false, queuedAt: 0, updatedAt: now });
  save();
  return queued.length;
}

// Xáo trộn thứ tự thẻ; trả về thứ tự cũ để hoàn tác
export function shuffleDeck(deckId) {
  const d = getDeck(deckId);
  if (!d) return null;
  const before = d.cards.map((c) => c.id);
  for (let i = d.cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d.cards[i], d.cards[j]] = [d.cards[j], d.cards[i]];
  }
  save();
  return before;
}

export function setOrder(deckId, ids) {
  const d = getDeck(deckId);
  if (!d) return;
  const pos = new Map(ids.map((id, i) => [id, i]));
  d.cards.sort((a, b) => (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity));
  save();
}

export function restoreCard(deckId, card, index) {
  const d = getDeck(deckId);
  if (!d) return;
  delete state.deleted[card.id];
  card.updatedAt = Date.now();
  d.cards.splice(Math.min(index, d.cards.length), 0, card);
  save();
}

// ---- Nhập JSON ----
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
// Dữ liệu đồng bộ lên server (không gồm bộ đang xem — cái đó riêng từng máy)
export function syncSnapshot() {
  return { format: FORMAT, version: 1, decks: state.decks, deleted: state.deleted };
}

export const isPristine = () => state.pristine;

// Xóa sạch dữ liệu trên máy (khi đăng xuất / đổi tài khoản); không coi là thay đổi cần đẩy lên
export function resetLocal() {
  state = { decks: [], deleted: {}, currentDeckId: null, pristine: true };
  save('sync');
}

// Gộp dữ liệu từ server vào máy: theo từng bộ/thẻ, bản nào sửa sau thì thắng;
// thẻ/bộ đã xóa (tombstone) thắng nếu bị xóa sau lần sửa cuối.
export function mergeRemote(remote, { dropLocal = false } = {}) {
  const local = dropLocal ? { decks: [], deleted: {} } : { decks: state.decks, deleted: state.deleted };
  const rDecks = Array.isArray(remote?.decks) ? remote.decks.map(normDeck).filter(Boolean) : [];
  const deleted = { ...normDeleted(remote?.deleted) };
  for (const [id, t] of Object.entries(local.deleted)) deleted[id] = Math.max(deleted[id] || 0, t);
  const alive = (x) => !(deleted[x.id] >= x.updatedAt);

  const pick = (a, b) => (!a ? b : !b ? a : b.updatedAt > a.updatedAt ? b : a);
  // Cùng thời điểm sửa mà một bên mất IPA (do bản app cũ làm rơi) → giữ IPA của bên còn lại
  const pickCard = (a, b) => {
    const winner = pick(a, b);
    const other = winner === a ? b : a;
    const win = { ...winner };
    if (other && other.updatedAt === win.updatedAt && !win.ipa && other.ipa) win.ipa = other.ipa;
    return win;
  };
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
    return { ...base, cards: mergeList(l?.cards || [], r?.cards || [], pickCard) };
  });

  state.decks = decks;
  state.deleted = deleted;
  if (dropLocal) state.pristine = false;
  ensureDeck();
  save('sync');
}
