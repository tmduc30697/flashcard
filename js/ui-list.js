// Giao diện danh sách: tab bộ thẻ, danh sách thẻ, bottom sheet, menu, hộp thoại, snackbar.
import * as store from './store.js';

const $ = (sel) => document.querySelector(sel);

// ---------- Icon SVG inline ----------
const P = {
  expand: 'M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  upload: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
  note: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  share: 'M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3a2 2 0 0 1 2 2z',
  refresh: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  cloud: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  account: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  speak: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  cloudDownload: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z',
  cloudUpload: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z',
  cloudDone: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17 15.18 9l1.41 1.41L10 17z',
  cloudOff: 'M19.35 10.04A7.49 7.49 0 0 0 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46A5.497 5.497 0 0 1 17.5 11.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z',
  open: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
  shuffle: 'M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z',
  done: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
};
export function icon(name, cls = '') {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"${cls ? ` class="${cls}"` : ''}><path d="${P[name]}"/></svg>`;
}

// Tạo phần tử DOM; chuỗi con được gán bằng textContent để tránh chèn HTML từ dữ liệu nhập.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// ---------- Ripple ----------
export function initRipple() {
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.ripple');
    if (!el || el.disabled) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    el.append(wave);
    setTimeout(() => wave.remove(), 550);
  });
}

// ---------- Snackbar ----------
let snackTimer = null;
export function snackbar(message, { action, onAction, duration = 4000 } = {}) {
  const el = $('#snackbar');
  clearTimeout(snackTimer);
  el.replaceChildren(h('span', { class: 'msg' }, message));
  if (action) {
    el.append(h('button', {
      type: 'button', class: 'ripple',
      onclick: () => { hideSnackbar(); onAction?.(); },
    }, action));
  }
  el.hidden = false;
  document.body.classList.add('has-snack');
  // Ép chạy lại animation khi snackbar mới thay snackbar cũ
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  if (duration) snackTimer = setTimeout(hideSnackbar, duration);
}
export function hideSnackbar() {
  clearTimeout(snackTimer);
  $('#snackbar').hidden = true;
  document.body.classList.remove('has-snack');
}

// ---------- Bottom sheet ----------
let sheetOnClose = null;
export function openSheet(content, { onClose } = {}) {
  const sheet = $('#sheet');
  const scrim = $('#scrim');
  sheetOnClose = onClose || null;
  sheet.replaceChildren(h('div', { class: 'sheet-handle' }), content);
  sheet.hidden = false;
  scrim.hidden = false;
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => { sheet.classList.add('show'); scrim.classList.add('show'); });
  scrim.onclick = closeSheet;
}
export function closeSheet() {
  const sheet = $('#sheet');
  const scrim = $('#scrim');
  if (sheet.hidden) return;
  sheet.classList.remove('show');
  scrim.classList.remove('show');
  document.body.classList.remove('no-scroll');
  setTimeout(() => {
    if (!sheet.classList.contains('show')) { sheet.hidden = true; scrim.hidden = true; sheet.replaceChildren(); }
  }, 250);
  const cb = sheetOnClose; sheetOnClose = null; cb?.();
}

// ---------- Menu ----------
export function openMenu(anchor, items) {
  const menu = $('#menu');
  menu.replaceChildren(...items.map((it) => {
    if (it === '-') return h('div', { class: 'menu-sep' });
    if (it.label && !it.onClick) return h('div', { class: 'menu-label' }, it.label);
    return h('button', {
      type: 'button', role: 'menuitem', class: 'menu-item ripple' + (it.danger ? ' danger' : ''),
      html: icon(it.icon),
      onclick: () => { closeMenu(); it.onClick(); },
    }, it.text);
  }));
  menu.hidden = false;
  const r = anchor.getBoundingClientRect();
  const mw = menu.offsetWidth;
  menu.style.top = `${r.bottom + 4}px`;
  menu.style.left = `${Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8))}px`;
  setTimeout(() => document.addEventListener('pointerdown', outsideMenu, true));
}
function outsideMenu(e) {
  if (!$('#menu').contains(e.target)) closeMenu();
}
export function closeMenu() {
  $('#menu').hidden = true;
  document.removeEventListener('pointerdown', outsideMenu, true);
}

// ---------- Hộp thoại ----------
function dialog(build) {
  return new Promise((resolve) => {
    const wrap = $('#dialog-wrap');
    const done = (v) => { wrap.hidden = true; wrap.replaceChildren(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') done(null); };
    wrap.replaceChildren(build(done));
    wrap.hidden = false;
    wrap.onclick = (e) => { if (e.target === wrap) done(null); };
    document.addEventListener('keydown', onKey);
    wrap.querySelector('input')?.focus();
  });
}
export function confirmDialog(title, message, okText = 'Xóa', danger = true) {
  return dialog((done) => h('div', { class: 'dialog', role: 'alertdialog' },
    h('h2', {}, title),
    h('p', {}, message),
    h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'btn btn-text ripple', onclick: () => done(false) }, 'Hủy'),
      h('button', { type: 'button', class: `btn ${danger ? 'btn-danger' : 'btn-text'} ripple`, onclick: () => done(true) }, okText),
    ),
  ));
}

// ---------- Nhập file ----------
export function importFile() {
  const input = $('#file-input');
  input.value = '';
  input.onchange = async () => {
    const f = input.files?.[0];
    if (!f) return;
    try {
      const decks = store.importData(JSON.parse(await f.text()));
      const n = decks.reduce((s, d) => s + d.cards.length, 0);
      snackbar(`Đã nhập ${decks.length} bộ, ${n} thẻ`);
    } catch (e) {
      snackbar('Không nhập được: ' + (e instanceof SyntaxError ? 'file JSON bị lỗi' : e.message));
    }
  };
  input.click();
}

// ---------- Tab bộ thẻ ----------
// Số thẻ còn lại trong danh sách (không tính hàng chờ)
const remaining = (deck) => deck.cards.filter((c) => !c.queued).length;

function renderTabs() {
  const nav = $('#tabs');
  const cur = store.currentDeck();
  const tabs = store.getDecks().map((d) => h('button', {
    type: 'button', role: 'tab', class: 'tab ripple',
    'aria-selected': String(d.id === cur?.id),
    onclick: () => store.setCurrentDeck(d.id),
  }, d.name, h('span', { class: 'tab-count' }, remaining(d))));
  nav.replaceChildren(...tabs);
  const active = nav.querySelector('[aria-selected="true"]');
  if (active) {
    const left = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    nav.scrollTo({ left, behavior: 'auto' });
  }
}

// ---------- Danh sách thẻ ----------
// Dòng thu gọn chỉ hiện mặt trước; bấm vào thì mở rộng (kiểu Google Tasks) để xem mặt sau + IPA
// và chọn "Chưa thuộc" (vào hàng chờ) hoặc "Đã thuộc" (xóa thẻ).
let openId = null;

const EMPTY_SVG = `<svg viewBox="0 0 180 150" aria-hidden="true">
  <rect x="38" y="30" width="96" height="70" rx="12" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="3" transform="rotate(-10 86 65)"/>
  <rect x="46" y="38" width="96" height="70" rx="12" fill="var(--surface-2)" stroke="currentColor" stroke-opacity=".35" stroke-width="3"/>
  <rect x="62" y="58" width="50" height="7" rx="3.5" fill="var(--primary)" opacity=".7"/>
  <rect x="62" y="74" width="66" height="6" rx="3" fill="currentColor" opacity=".2"/>
  <rect x="62" y="86" width="40" height="6" rx="3" fill="currentColor" opacity=".2"/>
  <circle cx="142" cy="112" r="18" fill="var(--primary-container)"/>
  <path d="M142 104v16M134 112h16" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"/>
</svg>`;

function renderList() {
  const deck = store.currentDeck();
  const main = $('#list');
  $('#deck-title').replaceChildren(deck?.name || 'Flashcard', deck ? h('span', { class: 'title-count' }, remaining(deck)) : '');
  document.title = deck ? `${deck.name} · Flashcard` : 'Flashcard';
  if (!deck) {
    $('#btn-shuffle').hidden = true;
    main.replaceChildren(h('div', { class: 'empty', html: EMPTY_SVG },
      h('p', {}, 'Chưa có bộ thẻ nào'),
      h('button', { type: 'button', class: 'btn btn-filled ripple', html: icon('upload'), onclick: importFile }, 'Nhập từ file JSON'),
    ));
    return;
  }

  const visible = deck.cards.filter((c) => !c.queued);
  const queued = deck.cards.length - visible.length;
  $('#btn-shuffle').hidden = visible.length < 2;

  if (!deck.cards.length) {
    main.replaceChildren(h('div', { class: 'empty', html: EMPTY_SVG }, h('p', {}, 'Bộ thẻ này trống')));
    return;
  }

  const parts = [];
  if (visible.length) {
    parts.push(h('ul', { class: 'card-list' }, visible.map((c) => cardRow(deck, c))));
    if (queued) parts.push(h('p', { class: 'queue-note' }, `${queued} thẻ chưa thuộc trong hàng chờ`));
  } else {
    parts.push(h('div', { class: 'done-box' },
      h('div', { class: 'done-icon', html: icon('done') }),
      h('p', { class: 'done-title' }, 'Hết lượt rồi!'),
      h('p', {}, `Còn ${queued} thẻ chưa thuộc trong hàng chờ.`),
      h('button', {
        type: 'button', class: 'btn btn-filled ripple', html: icon('refresh'),
        onclick: () => { openId = null; store.reloadQueue(deck.id); },
      }, `Tải lại ${queued} thẻ chưa thuộc`),
    ));
  }
  main.replaceChildren(...parts);
}

// ---------- Đọc câu tiếng Anh (giọng có sẵn của máy, chạy offline) ----------
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

function englishVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  return voices.find((v) => /^en[-_]US/i.test(v.lang) && v.localService)
    || voices.find((v) => /^en[-_]US/i.test(v.lang))
    || voices.find((v) => v.localService)
    || voices[0] || null;
}

function speak(text) {
  speechSynthesis.cancel(); // bấm lại khi đang đọc → đọc lại từ đầu
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  const voice = englishVoice();
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
if (canSpeak) speechSynthesis.getVoices(); // một số trình duyệt nạp danh sách giọng chậm → gọi sớm

// ---------- Copy câu tiếng Anh (để dán sang chỗ khác hỏi nghĩa) ----------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Trình duyệt cũ / không cho dùng Clipboard API → cách cũ
    const ta = h('textarea', { readonly: true, style: 'position:fixed;opacity:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (!ok) { snackbar('Không copy được'); return; }
  }
  snackbar('Đã copy câu tiếng Anh');
}

// Câu tiếng Anh, IPA ngay dưới (cùng font, cỡ chữ với câu tiếng Việt)
function backText(card) {
  return h('div', { class: 'detail-back' },
    h('div', {}, card.back),
    card.ipa && h('div', { class: 'detail-ipa' }, card.ipa));
}

function cardRow(deck, card) {
  const open = card.id === openId;
  const act = (fn) => (e) => { e.stopPropagation(); openId = null; fn(); };
  const row = h('div', {
    class: 'row' + (open ? ' open' : ''),
    role: 'button', tabindex: '0', 'aria-expanded': String(open),
  },
  h('div', { class: 'row-text' },
    h('div', { class: 'row-front' }, card.front),
    open && h('div', { class: 'detail', onclick: (e) => e.stopPropagation() },
      card.back && backText(card),
      card.note && h('div', { class: 'detail-note' }, card.note),
      h('div', { class: 'detail-actions' },
        h('button', {
          type: 'button', class: 'icon-btn ripple', 'aria-label': 'Sửa thẻ', html: icon('edit'),
          onclick: (e) => { e.stopPropagation(); openEditSheet(deck, card); },
        }),
        canSpeak && h('button', {
          type: 'button', class: 'icon-btn ripple', 'aria-label': 'Đọc câu tiếng Anh', title: 'Đọc câu tiếng Anh', html: icon('speak'),
          onclick: (e) => { e.stopPropagation(); speak(card.back); },
        }),
        h('button', {
          type: 'button', class: 'icon-btn ripple', 'aria-label': 'Copy câu tiếng Anh', title: 'Copy câu tiếng Anh', html: icon('copy'),
          onclick: (e) => { e.stopPropagation(); copyText(card.back); },
        }),
        h('span', { class: 'spacer' }),
        // "Chưa thuộc" nằm ngoài cùng bên phải cho ngón cái tay phải bấm
        h('button', { type: 'button', class: 'chip chip-primary ripple', onclick: act(() => markKnown(deck, card)) }, 'Thuộc'),
        h('button', { type: 'button', class: 'chip ripple', onclick: act(() => markQueued(deck, card)) }, 'Chưa thuộc'),
      ),
    ),
  ));
  const toggle = () => { openId = open ? null : card.id; renderList(); };
  row.addEventListener('click', toggle);
  row.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === row) toggle(); });

  return h('li', {}, row);
}

function markKnown(deck, card) {
  const res = store.deleteCard(deck.id, card.id);
  if (!res) return;
  snackbar('Đã thuộc — đã xóa thẻ', { action: 'Hoàn tác', onAction: () => store.restoreCard(deck.id, res.card, res.index) });
}

function markQueued(deck, card) {
  store.setQueued(deck.id, card.id, true);
  snackbar('Đã chuyển vào hàng chờ', { action: 'Hoàn tác', onAction: () => store.setQueued(deck.id, card.id, false) });
}

function removeCard(deck, card) {
  const res = store.deleteCard(deck.id, card.id);
  if (!res) return;
  snackbar('Đã xóa', { action: 'Hoàn tác', onAction: () => store.restoreCard(deck.id, res.card, res.index) });
}

function shuffle() {
  const deck = store.currentDeck();
  if (!deck) return;
  openId = null;
  const before = store.shuffleDeck(deck.id);
  snackbar('Đã xáo trộn', { action: 'Hoàn tác', onAction: () => store.setOrder(deck.id, before) });
}

// Vuốt ngang trên danh sách để chuyển bộ thẻ: sang phải → bộ trước, sang trái → bộ sau
function attachDeckSwipe(el) {
  let id = null, x0 = 0, y0 = 0, t0 = 0, dx = 0, mode = null, swallowClick = false;
  const neighbors = () => {
    const decks = store.getDecks();
    const i = decks.findIndex((d) => d.id === store.currentDeck()?.id);
    return { prev: decks[i - 1], next: decks[i + 1] };
  };
  const slide = (x, animate) => {
    el.style.transition = animate ? 'transform .18s ease-out' : 'none';
    el.style.transform = x ? `translateX(${x}px)` : '';
  };
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('input, textarea')) return;
    id = e.pointerId; x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); dx = 0; mode = null;
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!mode) {
      if (Math.abs(mx) < 12 && Math.abs(my) < 12) return;
      mode = Math.abs(mx) > Math.abs(my) * 1.2 ? 'swipe' : 'scroll';
      if (mode === 'swipe') el.setPointerCapture(id);
    }
    if (mode !== 'swipe') return;
    const { prev, next } = neighbors();
    dx = (mx > 0 && !prev) || (mx < 0 && !next) ? mx / 4 : mx; // hết bộ → chỉ nhún nhẹ
    slide(dx, false);
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    if (mode !== 'swipe') return;
    swallowClick = true;
    setTimeout(() => { swallowClick = false; }, 50);
    const { prev, next } = neighbors();
    const target = dx > 0 ? prev : next;
    const fast = Math.abs(dx) / (performance.now() - t0) > 0.5;
    if (!target || (Math.abs(dx) < el.offsetWidth * 0.25 && !fast)) return slide(0, true);
    const w = el.offsetWidth * Math.sign(dx);
    slide(w, true);
    setTimeout(() => {
      openId = null;
      store.setCurrentDeck(target.id);
      window.scrollTo(0, 0);
      slide(-w * 0.3, false);
      requestAnimationFrame(() => requestAnimationFrame(() => slide(0, true)));
    }, 180);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  // Không coi cú vuốt là bấm vào dòng
  el.addEventListener('click', (e) => { if (swallowClick) { e.stopPropagation(); e.preventDefault(); } }, true);
}

// ---------- Sheet sửa thẻ ----------
export function field(label, el) {
  return h('label', { class: 'field' }, h('span', {}, label), el);
}

function openEditSheet(deck, card) {
  const front = h('input', { type: 'text', value: card.front, autocomplete: 'off', autocapitalize: 'off' });
  const back = h('input', { type: 'text', value: card.back, autocomplete: 'off', autocapitalize: 'off' });
  const ipa = h('input', { type: 'text', value: card.ipa || '', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'tuỳ chọn' });
  const note = h('textarea', { rows: '3', placeholder: 'tuỳ chọn' });
  note.value = card.note || '';
  const save = h('button', { type: 'submit', class: 'btn btn-filled ripple' }, 'Lưu');
  const check = () => { save.disabled = !(front.value.trim() && back.value.trim()); };
  front.addEventListener('input', check);
  back.addEventListener('input', check);

  openSheet(h('form', {
    onsubmit: (e) => {
      e.preventDefault();
      if (save.disabled) return;
      store.updateCard(deck.id, card.id, { front: front.value.trim(), back: back.value.trim(), ipa: ipa.value.trim(), note: note.value.trim() });
      closeSheet();
    },
  },
  h('div', { class: 'sheet-head' }, h('h2', {}, 'Sửa thẻ')),
  field('Câu tiếng Việt', front),
  field('Câu tiếng Anh', back),
  field('IPA', ipa),
  field('Ghi chú', note),
  h('div', { class: 'actions' },
    h('button', {
      type: 'button', class: 'btn btn-danger ripple', html: icon('delete'),
      onclick: () => { closeSheet(); removeCard(deck, card); },
    }, 'Xóa'),
    h('span', { class: 'spacer' }),
    h('button', { type: 'button', class: 'btn btn-text ripple', onclick: closeSheet }, 'Hủy'),
    save),
  ));
}

// ---------- Menu ⋮ ----------
// Module khác (đồng bộ) góp thêm mục vào menu ⋮
const menuProviders = [];
export function addMenuItems(fn) { menuProviders.push(fn); }

function openDeckMenu(anchor) {
  const deck = store.currentDeck();
  const decks = store.getDecks();
  openMenu(anchor, [
    ...(deck ? [{ icon: 'delete', text: 'Xóa bộ thẻ', danger: true, onClick: async () => {
      const ok = await confirmDialog('Xóa bộ thẻ?', `Bộ “${deck.name}” và ${deck.cards.length} thẻ bên trong sẽ bị xóa.`);
      if (!ok) return;
      store.deleteDeck(deck.id);
      snackbar('Đã xóa bộ thẻ', { action: 'Hoàn tác', onAction: () => store.restoreDecks([deck]), duration: 8000 });
    } }] : []),
    ...(decks.length ? [{ icon: 'delete', text: 'Xóa tất cả bộ thẻ', danger: true, onClick: deleteAll }] : []),
    { icon: 'upload', text: 'Nhập từ file JSON', onClick: importFile },
    ...menuProviders.flatMap((fn) => fn()),
  ]);
}

async function deleteAll() {
  const decks = store.getDecks();
  const cards = decks.reduce((n, d) => n + d.cards.length, 0);
  const ok = await confirmDialog('Xóa tất cả bộ thẻ?',
    `${decks.length} bộ với ${cards} thẻ sẽ bị xóa (cả trong tài khoản nếu đang đăng nhập).`,
    'Xóa tất cả');
  if (!ok) return;
  const removed = store.deleteAllDecks();
  snackbar(`Đã xóa ${removed.length} bộ thẻ`, { action: 'Hoàn tác', onAction: () => store.restoreDecks(removed), duration: 8000 });
}

export function initList() {
  $('#btn-menu').addEventListener('click', (e) => openDeckMenu(e.currentTarget));
  $('#btn-shuffle').addEventListener('click', shuffle);
  attachDeckSwipe($('#list'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); closeSheet(); }
  });
  const render = () => { renderTabs(); renderList(); };
  store.subscribe(render);
  render();
}
