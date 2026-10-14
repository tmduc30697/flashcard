// Giao diện danh sách: tab bộ thẻ, danh sách thẻ, bottom sheet, menu, hộp thoại, snackbar.
import * as store from './store.js';

const $ = (sel) => document.querySelector(sel);

// ---------- Icon SVG inline ----------
const P = {
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  expand: 'M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  upload: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
  install: 'M17 1.01 7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-1-6h-3V8h-2v5H8l4 4 4-4z',
  note: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  share: 'M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3a2 2 0 0 1 2 2z',
  refresh: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  cloud: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  cloudDone: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17 15.18 9l1.41 1.41L10 17z',
  cloudOff: 'M19.35 10.04A7.49 7.49 0 0 0 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46A5.497 5.497 0 0 1 17.5 11.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z',
  open: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
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
export function promptDialog(title, value = '', okText = 'Lưu') {
  return dialog((done) => {
    const input = h('input', { type: 'text', value, maxlength: '80', placeholder: 'Tên bộ thẻ', enterkeyhint: 'done' });
    const submit = (e) => { e.preventDefault(); const v = input.value.trim(); if (v) done(v); };
    return h('form', { class: 'dialog', onsubmit: submit },
      h('h2', {}, title),
      h('label', { class: 'field' }, input),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-text ripple', onclick: () => done(null) }, 'Hủy'),
        h('button', { type: 'submit', class: 'btn btn-text ripple' }, okText),
      ),
    );
  });
}

// ---------- Xuất / nhập file ----------
export async function downloadJSON(data, filename) {
  const text = JSON.stringify(data, null, 2);
  const file = new File([text], filename, { type: 'application/json' });
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  // Trong app đã cài trên iOS, tải file trực tiếp không ổn định → dùng bảng Chia sẻ nếu có.
  if (standalone && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slug(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bo-the';
}
export function exportDeck(deck) {
  downloadJSON(store.exportData(deck.id), `flashcard-${slug(deck.name)}.json`);
}
export function exportAll() {
  const d = new Date().toISOString().slice(0, 10);
  downloadJSON(store.exportData(), `flashcard-backup-${d}.json`);
}
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
function renderTabs() {
  const nav = $('#tabs');
  const cur = store.currentDeck();
  const tabs = store.getDecks().map((d) => h('button', {
    type: 'button', role: 'tab', class: 'tab ripple',
    'aria-selected': String(d.id === cur?.id),
    onclick: () => store.setCurrentDeck(d.id),
  }, d.name));
  tabs.push(h('button', {
    type: 'button', class: 'tab ripple', html: icon('plus'), onclick: newDeck,
  }, 'Bộ mới'));
  nav.replaceChildren(...tabs);
  const active = nav.querySelector('[aria-selected="true"]');
  if (active) {
    const left = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    nav.scrollTo({ left, behavior: 'auto' });
  }
}

export async function newDeck() {
  const name = await promptDialog('Bộ thẻ mới', '', 'Tạo');
  if (name) store.addDeck(name);
}

// ---------- Danh sách thẻ ----------
let knownOpen = store.prefs.get('knownOpen') === '1';
let flashId = null;

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
  $('#deck-title').textContent = deck?.name || 'Flashcard';
  document.title = deck ? `${deck.name} · Flashcard` : 'Flashcard';
  $('#fab').hidden = !deck;
  $('#btn-study').hidden = !deck;
  if (!deck) {
    main.replaceChildren(h('div', { class: 'empty', html: EMPTY_SVG },
      h('p', {}, 'Chưa có bộ thẻ nào'),
      h('button', { type: 'button', class: 'btn btn-filled ripple', html: icon('plus'), onclick: newDeck }, 'Tạo bộ thẻ'),
    ));
    return;
  }

  const todo = deck.cards.filter((c) => !c.known);
  const known = deck.cards.filter((c) => c.known);
  $('#btn-study').disabled = !todo.length;

  if (!deck.cards.length) {
    main.replaceChildren(h('div', { class: 'empty', html: EMPTY_SVG }, h('p', {}, 'Chưa có thẻ nào — bấm + để thêm')));
    return;
  }

  const parts = [];
  if (todo.length) parts.push(h('ul', { class: 'card-list' }, todo.map((c) => cardRow(deck, c))));
  else parts.push(h('p', { class: 'all-known' }, 'Bạn đã thuộc hết bộ này 🎉'));

  if (known.length) {
    parts.push(h('button', {
      type: 'button', class: 'known-head ripple', 'aria-expanded': String(knownOpen),
      onclick: () => { knownOpen = !knownOpen; store.prefs.set('knownOpen', knownOpen ? '1' : '0'); renderList(); },
    }, h('span', { style: 'flex:1' }, `Đã thuộc (${known.length})`), h('span', { html: icon('expand'), style: 'display:flex' })));
    if (knownOpen) parts.push(h('ul', { class: 'card-list' }, known.map((c) => cardRow(deck, c))));
  }
  main.replaceChildren(...parts);
  flashId = null;
}

function cardRow(deck, card) {
  const row = h('div', {
    class: 'row' + (card.known ? ' known' : '') + (card.id === flashId ? ' pop' : ''),
    role: 'button', tabindex: '0',
    'aria-label': `${card.front} — ${card.back}`,
  },
  h('button', {
    type: 'button', class: 'check ripple',
    'aria-label': card.known ? 'Bỏ đánh dấu đã thuộc' : 'Đánh dấu đã thuộc',
    html: `<span class="circle">${icon('check')}</span>`,
    onclick: (e) => {
      e.stopPropagation();
      flashId = card.id;
      store.updateCard(deck.id, card.id, { known: !card.known });
      snackbar(card.known ? 'Đã đánh dấu thuộc' : 'Đã chuyển về chưa thuộc', {
        action: 'Hoàn tác', onAction: () => store.updateCard(deck.id, card.id, { known: !card.known }),
      });
    },
  }),
  h('div', { class: 'row-text' },
    h('div', { class: 'row-front' }, card.front),
    card.back && h('div', { class: 'row-back' }, card.back),
    card.note && h('div', { class: 'row-note', html: icon('note') }, h('span', {}, card.note)),
  ));
  row.addEventListener('click', () => { if (!row.dataset.swiped) openEditSheet(deck, card); });
  row.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === row) openEditSheet(deck, card); });

  const wrap = h('li', { class: 'row-wrap' }, h('div', { class: 'row-bg', html: icon('delete') }), row);
  attachSwipe(wrap, row, () => removeCard(deck, card));
  return wrap;
}

function removeCard(deck, card) {
  const res = store.deleteCard(deck.id, card.id);
  if (!res) return;
  snackbar('Đã xóa', { action: 'Hoàn tác', onAction: () => store.restoreCard(deck.id, res.card, res.index) });
}

// Vuốt sang trái để xóa
function attachSwipe(wrap, row, onDelete) {
  const bg = wrap.firstChild;
  let startX = 0, startY = 0, dx = 0, id = null, mode = null;
  row.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.check')) return;
    id = e.pointerId; startX = e.clientX; startY = e.clientY; dx = 0; mode = null;
    delete row.dataset.swiped;
  });
  row.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const mx = e.clientX - startX, my = e.clientY - startY;
    if (!mode) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      mode = Math.abs(mx) > Math.abs(my) && mx < 0 ? 'swipe' : 'scroll';
      if (mode === 'swipe') { row.setPointerCapture(id); row.classList.add('dragging'); }
    }
    if (mode !== 'swipe') return;
    dx = Math.min(0, mx);
    row.style.transform = `translateX(${dx}px)`;
    bg.style.opacity = Math.min(1, -dx / 80);
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    if (mode !== 'swipe') return;
    row.dataset.swiped = '1';
    setTimeout(() => delete row.dataset.swiped, 50);
    row.classList.remove('dragging');
    if (-dx > Math.min(140, row.offsetWidth * 0.35)) {
      row.style.transform = 'translateX(-100%)';
      wrap.style.transition = 'height .2s ease';
      wrap.style.height = wrap.offsetHeight + 'px';
      setTimeout(() => { wrap.style.height = '0px'; }, 150);
      setTimeout(onDelete, 330);
    } else {
      row.style.transform = '';
      bg.style.opacity = 0;
    }
  };
  row.addEventListener('pointerup', end);
  row.addEventListener('pointercancel', end);
}

// ---------- Sheet thêm / sửa thẻ ----------
function field(label, el) {
  return h('label', { class: 'field' }, h('span', {}, label), el);
}

export function openAddSheet(startMode = 'single') {
  const deck = store.currentDeck();
  if (!deck) return;
  let mode = startMode;

  const front = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', enterkeyhint: 'next' });
  const back = h('input', { type: 'text', autocomplete: 'off', enterkeyhint: 'next' });
  const note = h('textarea', { rows: '2', placeholder: 'Ví dụ, ghi chú… (tuỳ chọn)' });
  const save = h('button', { type: 'submit', class: 'btn btn-filled ripple', disabled: true }, 'Lưu');
  const updateSave = () => { save.disabled = !(front.value.trim() && back.value.trim()); };
  front.addEventListener('input', updateSave);
  back.addEventListener('input', updateSave);
  front.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); back.focus(); } });
  back.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !save.disabled) { e.preventDefault(); single.requestSubmit(); } });

  const single = h('form', {
    onsubmit: (e) => {
      e.preventDefault();
      if (save.disabled) return;
      store.addCards(deck.id, [{ front: front.value, back: back.value, note: note.value }]);
      front.value = back.value = note.value = '';
      updateSave();
      front.focus();
      snackbar(`Đã thêm vào “${deck.name}”`, { duration: 1800 });
    },
  },
  field('Mặt trước', front),
  field('Mặt sau', back),
  field('Ví dụ / ghi chú', note),
  h('div', { class: 'actions' },
    h('button', { type: 'button', class: 'btn btn-text ripple', onclick: closeSheet }, 'Xong'),
    h('span', { class: 'spacer' }), save),
  );

  const bulkText = h('textarea', {
    class: 'bulk', autocapitalize: 'off', spellcheck: 'false',
    placeholder: 'deforestation - nạn phá rừng\nbiodiversity : đa dạng sinh học\nmitigate\tgiảm nhẹ',
  });
  const preview = h('div', { class: 'preview' });
  const addBulk = h('button', { type: 'submit', class: 'btn btn-filled ripple', disabled: true }, 'Thêm');
  let parsed = [];
  const updatePreview = () => {
    parsed = store.parseBulk(bulkText.value);
    const lines = bulkText.value.split(/\r?\n/).filter((l) => l.trim()).length;
    const bad = lines - parsed.length;
    preview.replaceChildren(
      h('div', {}, h('b', {}, `${parsed.length} thẻ hợp lệ`), bad > 0 ? ` · ${bad} dòng bị bỏ qua` : ''),
      parsed.length ? h('ol', {}, parsed.slice(0, 5).map((c) => h('li', {}, `${c.front} → ${c.back}`)), parsed.length > 5 ? h('li', { style: 'list-style:none' }, '…') : null) : null,
    );
    addBulk.disabled = !parsed.length;
    addBulk.textContent = parsed.length ? `Thêm ${parsed.length} thẻ` : 'Thêm';
  };
  bulkText.addEventListener('input', updatePreview);
  const bulk = h('form', {
    onsubmit: (e) => {
      e.preventDefault();
      if (!parsed.length) return;
      const added = store.addCards(deck.id, parsed);
      closeSheet();
      snackbar(`Đã thêm ${added.length} thẻ`);
    },
  },
  field('Mỗi dòng một thẻ', bulkText),
  h('p', { class: 'hint' }, 'Ngăn cách mặt trước và mặt sau bằng “ - ”, “ : ” hoặc phím Tab.'),
  preview,
  h('div', { class: 'actions' },
    h('button', { type: 'button', class: 'btn btn-text ripple', onclick: closeSheet }, 'Hủy'),
    h('span', { class: 'spacer' }), addBulk),
  );

  const segSingle = h('button', { type: 'button', onclick: () => setMode('single') }, 'Một thẻ');
  const segBulk = h('button', { type: 'button', onclick: () => setMode('bulk') }, 'Thêm nhiều');
  const body = h('div');
  function setMode(m) {
    mode = m;
    segSingle.setAttribute('aria-pressed', String(m === 'single'));
    segBulk.setAttribute('aria-pressed', String(m === 'bulk'));
    body.replaceChildren(m === 'single' ? single : bulk);
    if (m === 'bulk') updatePreview();
    setTimeout(() => (m === 'single' ? front : bulkText).focus(), 50);
  }

  openSheet(h('div', {},
    h('div', { class: 'sheet-head' }, h('h2', {}, 'Thêm thẻ')),
    h('div', { class: 'seg', role: 'group' }, segSingle, segBulk),
    body,
  ));
  setMode(mode);
}

function openEditSheet(deck, card) {
  const front = h('input', { type: 'text', value: card.front, autocomplete: 'off', autocapitalize: 'off' });
  const back = h('input', { type: 'text', value: card.back, autocomplete: 'off' });
  const note = h('textarea', { rows: '3', placeholder: 'Ví dụ, ghi chú… (tuỳ chọn)' });
  note.value = card.note || '';
  const save = h('button', { type: 'submit', class: 'btn btn-filled ripple' }, 'Lưu');
  const check = () => { save.disabled = !(front.value.trim() && back.value.trim()); };
  front.addEventListener('input', check);
  back.addEventListener('input', check);

  openSheet(h('form', {
    onsubmit: (e) => {
      e.preventDefault();
      if (save.disabled) return;
      store.updateCard(deck.id, card.id, { front: front.value.trim(), back: back.value.trim(), note: note.value.trim() });
      closeSheet();
    },
  },
  h('div', { class: 'sheet-head' }, h('h2', {}, 'Sửa thẻ')),
  field('Mặt trước', front),
  field('Mặt sau', back),
  field('Ví dụ / ghi chú', note),
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
// Các module khác (cài app, đồng bộ) góp thêm mục vào menu ⋮
const menuProviders = [];
export function addMenuItems(fn) { menuProviders.push(fn); }

function openDeckMenu(anchor) {
  const deck = store.currentDeck();
  const decks = store.getDecks();
  openMenu(anchor, [
    ...(deck ? [{ icon: 'edit', text: 'Đổi tên bộ thẻ', onClick: async () => {
      const name = await promptDialog('Đổi tên bộ thẻ', deck.name);
      if (name) store.renameDeck(deck.id, name);
    } },
    { icon: 'download', text: 'Xuất bộ này (JSON)', onClick: () => exportDeck(deck) },
    { icon: 'delete', text: 'Xóa bộ thẻ', danger: true, onClick: async () => {
      const ok = await confirmDialog('Xóa bộ thẻ?', `Bộ “${deck.name}” và ${deck.cards.length} thẻ bên trong sẽ bị xóa vĩnh viễn. Nên xuất JSON để sao lưu trước.`);
      if (ok) { store.deleteDeck(deck.id); snackbar('Đã xóa bộ thẻ'); }
    } },
    '-'] : []),
    { icon: 'upload', text: 'Nhập từ file JSON', onClick: importFile },
    ...(decks.length ? [
      { icon: 'download', text: 'Xuất toàn bộ (sao lưu)', onClick: exportAll },
      { icon: 'delete', text: 'Xóa tất cả bộ thẻ', danger: true, onClick: deleteAll },
    ] : []),
    ...menuProviders.flatMap((fn) => fn()),
  ]);
}

async function deleteAll() {
  const decks = store.getDecks();
  const cards = decks.reduce((n, d) => n + d.cards.length, 0);
  const ok = await confirmDialog('Xóa tất cả bộ thẻ?',
    `${decks.length} bộ với ${cards} thẻ sẽ bị xóa (cả trên Gist nếu đang đồng bộ). Nên chọn “Xuất toàn bộ” để sao lưu trước.`,
    'Xóa tất cả');
  if (!ok) return;
  const removed = store.deleteAllDecks();
  snackbar(`Đã xóa ${removed.length} bộ thẻ`, { action: 'Hoàn tác', onAction: () => store.restoreDecks(removed), duration: 8000 });
}

export function initList({ onStudy }) {
  $('#fab').addEventListener('click', () => openAddSheet());
  $('#btn-menu').addEventListener('click', (e) => openDeckMenu(e.currentTarget));
  $('#btn-study').addEventListener('click', onStudy);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); closeSheet(); }
  });
  const render = () => { renderTabs(); renderList(); };
  store.subscribe(render);
  render();
}
