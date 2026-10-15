// Đồng bộ dữ liệu với một secret gist trên GitHub (chỉ cho chính chủ, dùng token có quyền "gist").
// Chỉ chạy khi người dùng bấm nút (tránh lỗi GitHub "too many requests"); sửa trên máy chỉ đánh dấu "chưa đồng bộ".
// Pull: kéo gist về → gộp vào máy (store.mergeRemote), không ghi lên gist.
// Push: kéo gist về → gộp → ghi bản đã gộp lên gist (gộp trước để không đè mất thay đổi từ máy khác).
import * as store from './store.js';
import { h, icon, snackbar, openSheet, closeSheet, confirmDialog, addMenuItems } from './ui-list.js';

const API = 'https://api.github.com';
const FILE = 'flashcard-data.json';
const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Flashcard%20PWA';

const $ = (sel) => document.querySelector(sel);

let status = 'idle'; // idle | syncing | ok | offline | error
let running = null;
let runningMode = null; // 'pull' | 'push'
let changedDuringSync = false;

const cfg = {
  get token() { return store.prefs.get('gistToken'); },
  get gistId() { return store.prefs.get('gistId'); },
  get user() { return store.prefs.get('gistUser'); },
  get lastSync() { return Number(store.prefs.get('gistLastSync')) || 0; },
  get dirty() { return store.prefs.get('gistDirty') === '1'; },
};
export const isConnected = () => !!(cfg.token && cfg.gistId);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function api(path, { method = 'GET', body, token = cfg.token } = {}) {
  const res = await fetch(API + path, {
    method,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message || msg; } catch { /* bỏ qua */ }
    throw new HttpError(res.status, msg);
  }
  return res.status === 204 ? null : res.json();
}

const serialize = () => JSON.stringify(store.syncSnapshot(), null, 1);

async function readGist(id) {
  const gist = await api(`/gists/${id}`);
  const file = gist.files?.[FILE];
  if (!file) return { content: null, gist };
  let content = file.content;
  // File > 1 MB bị cắt ngắn trong API → tải bản đầy đủ
  if (file.truncated) content = await (await fetch(file.raw_url, { cache: 'no-store' })).text();
  return { content, gist };
}

function writeGist(content) {
  return api(`/gists/${cfg.gistId}`, { method: 'PATCH', body: { files: { [FILE]: { content } } } });
}

async function findGist(token) {
  for (let page = 1; page <= 10; page++) {
    const list = await api(`/gists?per_page=100&page=${page}`, { token });
    const found = list.find((g) => g.files && g.files[FILE]);
    if (found) return found;
    if (list.length < 100) break;
  }
  return null;
}

// ---------- Trạng thái (2 nút Pull / Push trên thanh trên cùng) ----------
function renderButton(btn, mode, s) {
  btn.hidden = !isConnected();
  const busy = s === 'syncing' && runningMode === mode;
  const pending = mode === 'push' && cfg.dirty && s !== 'syncing';
  const base = mode === 'pull' ? 'Pull — tải dữ liệu từ Gist về máy' : 'Push — đẩy dữ liệu trên máy lên Gist';
  const label = busy ? (mode === 'pull' ? 'Đang tải về…' : 'Đang đẩy lên…')
    : s === 'offline' ? 'Đang offline'
    : s === 'error' ? 'Lỗi đồng bộ — bấm để thử lại'
    : pending ? 'Có thay đổi chưa đẩy lên — bấm để Push'
    : base;
  btn.innerHTML = icon(busy ? 'refresh' : mode === 'pull' ? 'cloudDownload' : 'cloudUpload');
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.disabled = s === 'syncing';
  btn.classList.toggle('syncing', busy);
  btn.classList.toggle('sync-error', s === 'error');
  btn.classList.toggle('sync-pending', pending);
}

function setStatus(s) {
  status = s;
  const pull = $('#btn-pull');
  const push = $('#btn-push');
  if (pull) renderButton(pull, 'pull', s);
  if (push) renderButton(push, 'push', s);
}

function timeLabel(t) {
  if (!t) return 'chưa đồng bộ';
  const d = new Date(t);
  const sameDay = d.toDateString() === new Date().toDateString();
  const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `lúc ${hm}` : `${hm} ${d.toLocaleDateString('vi-VN')}`;
}

// ---------- Đồng bộ ----------
export function syncNow({ manual = false, mode = 'push' } = {}) {
  if (!isConnected()) return Promise.resolve();
  if (!navigator.onLine) {
    setStatus('offline');
    if (manual) snackbar('Đang offline — có mạng thì bấm đồng bộ lại');
    return Promise.resolve();
  }
  if (running) return running;
  changedDuringSync = false;
  runningMode = mode;
  setStatus('syncing');
  running = (async () => {
    try {
      const { content } = await readGist(cfg.gistId);
      let remote = null;
      if (content) {
        try { remote = JSON.parse(content); } catch { remote = null; }
      }
      // Máy mới chỉ có bộ mẫu chưa đụng tới → lấy nguyên dữ liệu trên Gist (kể cả khi Gist đã trống), không trộn bộ mẫu vào
      const dropLocal = store.isPristine() && Array.isArray(remote?.decks);
      if (remote) store.mergeRemote(remote, { dropLocal });
      const next = serialize();
      if (mode === 'push' && next !== content) await writeGist(next);
      store.prefs.set('gistLastSync', Date.now());
      // Sau Pull, máy vẫn còn thay đổi chưa có trên gist thì giữ dấu "chưa đẩy lên"
      if (!changedDuringSync && (mode === 'push' || next === content)) store.prefs.remove('gistDirty');
      setStatus('ok');
      if (manual) snackbar(mode === 'pull' ? 'Đã tải dữ liệu từ Gist về' : 'Đã đẩy lên Gist');
    } catch (e) {
      handleError(e, manual);
    } finally {
      running = null;
      runningMode = null;
    }
  })();
  return running;
}

function handleError(e, manual) {
  console.warn('Đồng bộ lỗi', e);
  if (e instanceof HttpError && e.status === 401) {
    setStatus('error');
    snackbar('Token GitHub không hợp lệ hoặc đã hết hạn', { action: 'Kết nối lại', onAction: openConnectSheet, duration: 8000 });
  } else if (e instanceof HttpError && e.status === 404) {
    // Gist đã bị xóa → tạo gist mới từ dữ liệu trên máy
    store.prefs.remove('gistId');
    createGist(cfg.token).then(() => syncNow()).catch((err) => { setStatus('error'); snackbar('Không tạo lại được Gist: ' + err.message); });
  } else if (!(e instanceof HttpError)) {
    setStatus(navigator.onLine ? 'error' : 'offline'); // lỗi mạng
    if (manual) snackbar('Không kết nối được GitHub');
  } else {
    setStatus('error');
    if (manual || e.status === 403) snackbar(`Lỗi GitHub (${e.status}): ${e.message}`);
  }
}

async function createGist(token) {
  const gist = await api('/gists', {
    method: 'POST', token,
    body: { description: 'Flashcard PWA — dữ liệu đồng bộ (đừng đổi tên file)', public: false, files: { [FILE]: { content: serialize() } } },
  });
  store.prefs.set('gistId', gist.id);
  return gist;
}

async function connect(token) {
  const user = await api('/user', { token });
  let gist = await findGist(token);
  store.prefs.set('gistToken', token);
  store.prefs.set('gistUser', user.login);
  if (gist) {
    store.prefs.set('gistId', gist.id);
  } else {
    gist = await createGist(token);
  }
  await syncNow();
  if (status !== 'ok') throw new Error('kết nối được nhưng đồng bộ lỗi');
  return user.login;
}

function disconnect() {
  ['gistToken', 'gistId', 'gistUser', 'gistLastSync', 'gistDirty'].forEach((k) => store.prefs.remove(k));
  setStatus('idle');
}

// ---------- Giao diện ----------
export function openConnectSheet() {
  const input = h('input', {
    type: 'password', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    placeholder: 'ghp_…', enterkeyhint: 'go',
  });
  const btn = h('button', { type: 'submit', class: 'btn btn-filled ripple', disabled: true }, 'Kết nối');
  const err = h('p', { class: 'hint error', hidden: true });
  input.addEventListener('input', () => { btn.disabled = input.value.trim().length < 20; });

  openSheet(h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = 'Đang kết nối…';
      err.hidden = true;
      try {
        const user = await connect(input.value.trim());
        closeSheet();
        snackbar(`Đã kết nối GitHub @${user} — dùng nút Pull / Push để đồng bộ`);
      } catch (e2) {
        disconnect();
        err.textContent = e2 instanceof HttpError && e2.status === 401
          ? 'Token không đúng hoặc đã hết hạn.'
          : e2 instanceof HttpError && (e2.status === 403 || e2.status === 404)
            ? 'Token chưa có quyền "gist".'
            : 'Không kết nối được GitHub: ' + e2.message;
        err.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Kết nối';
      }
    },
  },
  h('div', { class: 'sheet-head' }, h('h2', {}, 'Đồng bộ GitHub Gist')),
  h('p', { class: 'sheet-text' }, 'Dữ liệu được lưu vào một secret gist trong tài khoản GitHub của bạn, để điện thoại và máy tính dùng chung. Mỗi máy chỉ cần dán token một lần.'),
  h('ol', { class: 'steps' },
    h('li', {}, h('a', { href: TOKEN_URL, target: '_blank', rel: 'noopener' }, 'Mở trang tạo token trên GitHub'), ' (đăng nhập nếu được hỏi).'),
    h('li', {}, 'Ở Expiration chọn ', h('b', {}, 'No expiration'), ', giữ nguyên quyền ', h('b', {}, 'gist'), ', bấm ', h('b', {}, 'Generate token'), '.'),
    h('li', {}, 'Copy token (bắt đầu bằng ghp_) và dán vào đây. Lưu token vào ghi chú để dán trên máy khác.')),
  h('label', { class: 'field' }, h('span', {}, 'Token GitHub'), input),
  err,
  h('div', { class: 'actions' },
    h('button', { type: 'button', class: 'btn btn-text ripple', onclick: closeSheet }, 'Hủy'),
    h('span', { class: 'spacer' }), btn),
  ));
  setTimeout(() => input.focus(), 300);
}

function menuItems() {
  if (!isConnected()) {
    return ['-', { icon: 'cloud', text: 'Đồng bộ GitHub Gist', onClick: openConnectSheet }];
  }
  return [
    '-',
    { label: `Gist @${cfg.user || '?'} · ${timeLabel(cfg.lastSync)}${cfg.dirty ? ' · có thay đổi chưa đồng bộ' : ''}` },
    { icon: 'open', text: 'Mở Gist trên GitHub', onClick: () => window.open(`https://gist.github.com/${cfg.gistId}`, '_blank', 'noopener') },
    { icon: 'cloudOff', text: 'Ngắt đồng bộ', onClick: async () => {
      const ok = await confirmDialog('Ngắt đồng bộ?', 'Máy này sẽ quên token. Dữ liệu trên máy và trên Gist vẫn giữ nguyên.', 'Ngắt', false);
      if (ok) { disconnect(); snackbar('Đã ngắt đồng bộ'); }
    } },
  ];
}

export function initSync() {
  addMenuItems(menuItems);
  $('#btn-pull').addEventListener('click', () => syncNow({ manual: true, mode: 'pull' }));
  $('#btn-push').addEventListener('click', () => syncNow({ manual: true, mode: 'push' }));
  // Sửa trên máy → chỉ đánh dấu "chưa đồng bộ", không tự gọi GitHub
  store.subscribe((source) => {
    if (source !== 'local' || !isConnected()) return;
    store.prefs.set('gistDirty', '1');
    if (running) changedDuringSync = true;
    else setStatus(status);
  });
  window.addEventListener('online', () => isConnected() && status === 'offline' && setStatus('idle'));
  window.addEventListener('offline', () => isConnected() && setStatus('offline'));
  setStatus('idle');
}
