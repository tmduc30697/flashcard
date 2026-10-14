// Chế độ học: mỗi lần một thẻ, chạm để lật, đánh dấu Đã thuộc / Chưa thuộc.
import * as store from './store.js';
import { h, icon, snackbar } from './ui-list.js';
import { splitIPA } from './ipa.js';

const $ = (sel) => document.querySelector(sel);

let session = null; // { deckId, queue: [cardId], index, known: [], unknown: [], flipped }
let reverse = store.prefs.get('reverse') === '1';

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Bắt đầu một lượt học. ids: giới hạn danh sách thẻ (dùng cho "Học lại thẻ chưa thuộc").
export function startStudy(ids) {
  const deck = store.currentDeck();
  if (!deck) return false;
  const pool = deck.cards.filter((c) => !c.known && (!ids || ids.includes(c.id)));
  if (!pool.length) return false;
  session = { deckId: deck.id, queue: shuffle(pool.map((c) => c.id)), index: 0, known: [], unknown: [], flipped: false };
  $('#study-title').textContent = deck.name;
  render();
  return true;
}

export function stopStudy() {
  session = null;
  $('#study-body').replaceChildren();
}

function currentCard() {
  const deck = store.getDeck(session.deckId);
  let card = null;
  // Bỏ qua thẻ đã bị xóa giữa chừng
  while (session.index < session.queue.length) {
    card = deck?.cards.find((c) => c.id === session.queue[session.index]);
    if (card) return card;
    session.queue.splice(session.index, 1);
  }
  return null;
}

// Nội dung một mặt thẻ: chữ chính (cỡ chữ theo độ dài) + dòng phiên âm riêng nếu có
function face(text) {
  const [main, ipa] = splitIPA(text);
  if (ipa) return [interlinear(main, ipa)];
  const size = main.length > 60 ? ' long' : main.length > 24 ? ' medium' : '';
  return [h('div', { class: 'flip-main' + size }, main)];
}

// Câu ở trên, phiên âm ngay dưới, mỗi thứ đúng 1 dòng; cùng font monospace nên các từ thẳng hàng.
// Cỡ chữ tự thu nhỏ cho vừa bề rộng thẻ (câu quá dài thì cuộn ngang).
function interlinear(main, ipa) {
  ipa = ipa.replace(/^[/[]|[/\]]$/g, '');
  const el = h('div', { class: 'interlinear', style: 'font-size:26px' },
    h('div', { class: 'il-en' }, main),
    h('div', { class: 'il-ipa' }, ipa));
  // Đo sau khi đã gắn vào thẻ: thu nhỏ chữ cho vừa bề rộng mặt thẻ
  requestAnimationFrame(() => {
    const face = el.parentElement;
    if (!face) return;
    const cs = getComputedStyle(face);
    const avail = face.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (el.scrollWidth > avail) el.style.fontSize = `${Math.max(12, Math.floor(26 * avail / el.scrollWidth * 10) / 10)}px`;
  });
  return el;
}

function render() {
  const body = $('#study-body');
  const total = session.queue.length;
  $('#study-bar').style.width = `${total ? (session.index / total) * 100 : 100}%`;
  $('#study-reverse').setAttribute('aria-pressed', String(reverse));

  const card = currentCard();
  if (!card) return renderSummary();

  session.flipped = false;
  const [first, second] = reverse ? [card.back, card.front] : [card.front, card.back];
  const flip = h('div', { class: 'flip card-enter', role: 'button', tabindex: '0', 'aria-label': 'Chạm để lật thẻ' },
    h('div', { class: 'flip-inner' },
      h('div', { class: 'flip-face front' },
        ...face(first),
        h('div', { class: 'flip-hint' }, 'Chạm để lật')),
      h('div', { class: 'flip-face back' },
        ...face(second),
        card.note && h('div', { class: 'flip-note' }, card.note)),
    ));
  const toggle = () => { session.flipped = !session.flipped; flip.classList.toggle('flipped', session.flipped); };
  flip.addEventListener('click', toggle);
  flip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

  body.replaceChildren(
    h('div', { class: 'study-count' }, `${session.index + 1} / ${total}`),
    flip,
    h('div', { class: 'study-actions' },
      h('button', { type: 'button', class: 'btn btn-unknown ripple', onclick: () => answer(false) }, 'Chưa thuộc'),
      h('button', { type: 'button', class: 'btn btn-known ripple', onclick: () => answer(true) }, 'Đã thuộc')),
  );
}

function answer(isKnown) {
  const card = currentCard();
  if (!card) return;
  (isKnown ? session.known : session.unknown).push(card.id);
  if (isKnown) store.updateCard(session.deckId, card.id, { known: true });
  session.index++;
  render();
}

function renderSummary() {
  $('#study-bar').style.width = '100%';
  const { known, unknown } = session;
  const retry = unknown.slice();
  $('#study-body').replaceChildren(h('div', { class: 'summary card-enter' },
    h('div', { html: icon('done', 'big') }),
    h('h2', {}, unknown.length ? 'Hết lượt!' : 'Tuyệt vời — thuộc hết rồi!'),
    h('div', { class: 'stats' },
      h('div', { class: 'stat ok' }, h('b', {}, known.length), h('span', {}, 'Đã thuộc')),
      h('div', { class: 'stat no' }, h('b', {}, unknown.length), h('span', {}, 'Chưa thuộc'))),
    unknown.length ? h('button', {
      type: 'button', class: 'btn btn-filled ripple', html: icon('refresh'),
      onclick: () => startStudy(retry),
    }, 'Học lại thẻ chưa thuộc') : null,
    h('button', { type: 'button', class: 'btn btn-outline ripple', onclick: () => history.back() }, 'Về danh sách'),
  ));
}

export function initStudy() {
  $('#study-close').addEventListener('click', () => history.back());
  $('#study-reverse').addEventListener('click', () => {
    reverse = !reverse;
    store.prefs.set('reverse', reverse ? '1' : '0');
    snackbar(reverse ? 'Đảo chiều: hiện mặt sau trước' : 'Hiện mặt trước trước', { duration: 1500 });
    if (session && session.index < session.queue.length) render();
    else $('#study-reverse').setAttribute('aria-pressed', String(reverse));
  });
  document.addEventListener('keydown', (e) => {
    if ($('#screen-study').hidden || !session || e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowLeft') answer(false);
    else if (e.key === 'ArrowRight') answer(true);
  });
  $('#study-reverse').setAttribute('aria-pressed', String(reverse));
}
