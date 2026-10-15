// Đăng nhập Google và đồng bộ dữ liệu qua Firebase Firestore.
// Dữ liệu mỗi người: users/{uid}/decks/{deckId} = { json } (mỗi bộ thẻ một document),
// users/{uid}/meta/state = { deleted } (thẻ/bộ đã xóa, để máy khác xóa theo).
// Tự đồng bộ: nghe thay đổi từ máy khác (onSnapshot), gộp vào máy (store.mergeRemote),
// và đẩy những bộ thẻ khác với trên server sau khi sửa ~1.5 giây.
import * as store from './store.js';
import { firebaseConfig } from './firebase-config.js';
import { icon, snackbar, confirmDialog, addMenuItems } from './ui-list.js';

// Tải SDK lúc chạy (dynamic import) để app vẫn mở được khi offline hoặc chưa cấu hình Firebase
const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
const PUSH_DELAY = 1500;
const BATCH_MAX = 450; // Firestore cho tối đa 500 thao tác mỗi batch

const $ = (sel) => document.querySelector(sel);

let fb = null; // { auth, db, A: module auth, F: module firestore }
let user = null;
let unsubs = [];
let remoteDecks = new Map(); // deckId → json đang có trên server
let remoteDeleted = '{}';
let decksReady = false;
let metaReady = false;
let pushTimer = null;
let pushing = null;
let again = false;
let status = 'idle'; // idle | syncing | ok | offline | error

// Chuỗi JSON ổn định (sắp xếp khóa) để so sánh với bản trên server
const canon = (obj) => JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));

async function loadSdk() {
  if (fb) return fb;
  const [app, A, F] = await Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map((f) => import(SDK + f)));
  const a = app.initializeApp(firebaseConfig);
  fb = { auth: A.getAuth(a), db: F.getFirestore(a), A, F };
  fb.auth.languageCode = 'vi';
  return fb;
}

// ---------- Trạng thái (nút đám mây trên thanh trên cùng) ----------
function setStatus(s) {
  status = s;
  const btn = $('#btn-cloud');
  if (!btn) return;
  btn.hidden = !user;
  const [ic, label] = {
    idle: ['cloud', 'Đồng bộ'],
    syncing: ['refresh', 'Đang đồng bộ…'],
    ok: ['cloudDone', 'Đã đồng bộ'],
    offline: ['cloudOff', 'Đang offline — có mạng sẽ tự đồng bộ'],
    error: ['cloudOff', 'Lỗi đồng bộ — bấm để thử lại'],
  }[s];
  btn.innerHTML = icon(ic);
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.classList.toggle('syncing', s === 'syncing');
  btn.classList.toggle('sync-error', s === 'error');
}

function timeLabel(t) {
  if (!t) return 'chưa đồng bộ';
  const d = new Date(t);
  const sameDay = d.toDateString() === new Date().toDateString();
  const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `đồng bộ lúc ${hm}` : `đồng bộ ${hm} ${d.toLocaleDateString('vi-VN')}`;
}

function onError(e) {
  console.warn('Đồng bộ lỗi', e);
  if (!navigator.onLine) { setStatus('offline'); return; }
  setStatus('error');
  if (e?.code === 'permission-denied') snackbar('Firestore từ chối truy cập — kiểm tra Rules');
  else if (e?.code === 'resource-exhausted') snackbar('Vượt hạn mức Firestore hôm nay — mai thử lại');
  else snackbar('Lỗi đồng bộ: ' + (e?.message || e));
}

// ---------- Nhận dữ liệu từ server ----------
function stopListening() {
  unsubs.forEach((fn) => fn());
  unsubs = [];
  clearTimeout(pushTimer);
  pushTimer = null;
  remoteDecks = new Map();
  remoteDeleted = '{}';
  decksReady = metaReady = false;
}

function listen() {
  const { F, db } = fb;
  const opts = { includeMetadataChanges: true };
  // Bỏ qua ảnh chụp từ cache hoặc còn ghi chưa xong: chỉ gộp dữ liệu đã có thật trên server
  const settled = (snap) => !snap.metadata.hasPendingWrites && !snap.metadata.fromCache;
  setStatus(navigator.onLine ? 'syncing' : 'offline');
  unsubs.push(F.onSnapshot(F.collection(db, 'users', user.uid, 'decks'), opts, (snap) => {
    if (!settled(snap)) return;
    remoteDecks = new Map(snap.docs.map((d) => [d.id, d.data().json]));
    decksReady = true;
    applyRemote();
  }, onError));
  unsubs.push(F.onSnapshot(F.doc(db, 'users', user.uid, 'meta', 'state'), opts, (snap) => {
    if (!settled(snap)) return;
    remoteDeleted = canon(snap.data()?.deleted || {});
    metaReady = true;
    applyRemote();
  }, onError));
}

function applyRemote() {
  if (!decksReady || !metaReady) return;
  const decks = [...remoteDecks.values()].map((j) => { try { return JSON.parse(j); } catch { return null; } }).filter(Boolean);
  const empty = !decks.length && remoteDeleted === '{}';
  // Máy mới chỉ có bộ mẫu chưa đụng tới → lấy nguyên dữ liệu trên tài khoản, không trộn bộ mẫu vào
  store.mergeRemote({ decks, deleted: JSON.parse(remoteDeleted) }, { dropLocal: store.isPristine() && !empty });
  push(); // đẩy phần máy này có mà server chưa có
}

// ---------- Đẩy dữ liệu lên ----------
function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, PUSH_DELAY);
}

function push() {
  clearTimeout(pushTimer);
  pushTimer = null;
  if (!user || !decksReady || !metaReady) return Promise.resolve();
  if (pushing) { again = true; return pushing; }

  const { decks, deleted } = store.syncSnapshot();
  const changed = [];
  const localIds = new Set();
  for (const d of decks) {
    localIds.add(d.id);
    const json = JSON.stringify(d);
    if (remoteDecks.get(d.id) !== json) changed.push([d.id, json]);
  }
  const removed = [...remoteDecks.keys()].filter((id) => !localIds.has(id) && deleted[id]);
  const deletedJson = canon(deleted);
  if (!changed.length && !removed.length && deletedJson === remoteDeleted) {
    store.prefs.set('cloudLastSync', Date.now());
    setStatus(navigator.onLine ? 'ok' : 'offline');
    return Promise.resolve();
  }

  const { F, db } = fb;
  const uid = user.uid;
  setStatus(navigator.onLine ? 'syncing' : 'offline');
  pushing = (async () => {
    try {
      const col = F.collection(db, 'users', uid, 'decks');
      const commits = [];
      let batch = F.writeBatch(db);
      let n = 0;
      const add = (op) => {
        op(batch);
        if (++n >= BATCH_MAX) { commits.push(batch.commit()); batch = F.writeBatch(db); n = 0; }
      };
      for (const [id, json] of changed) add((b) => b.set(F.doc(col, id), { json }));
      for (const id of removed) add((b) => b.delete(F.doc(col, id)));
      if (deletedJson !== remoteDeleted) add((b) => b.set(F.doc(db, 'users', uid, 'meta', 'state'), { deleted }));
      if (n) commits.push(batch.commit());
      // Ghi nhận ngay để lần đẩy sau chỉ gửi phần mới đổi
      for (const [id, json] of changed) remoteDecks.set(id, json);
      for (const id of removed) remoteDecks.delete(id);
      remoteDeleted = deletedJson;
      await Promise.all(commits); // offline: Firestore giữ lại, có mạng thì tự gửi
      store.prefs.set('cloudLastSync', Date.now());
      setStatus('ok');
    } catch (e) {
      // Lần sau so lại toàn bộ với server
      remoteDecks.clear();
      onError(e);
    } finally {
      pushing = null;
      if (again) { again = false; push(); }
    }
  })();
  return pushing;
}

// ---------- Tài khoản ----------
function onUser(u) {
  stopListening();
  user = u;
  if (!u) { setStatus('idle'); return; }
  const owner = store.prefs.get('cloudOwner');
  if (owner && owner !== u.uid) store.resetLocal(); // máy này từng đăng nhập tài khoản khác
  store.prefs.set('cloudOwner', u.uid);
  listen();
}

async function logout() {
  const ok = await confirmDialog('Đăng xuất?',
    'Dữ liệu sẽ được xóa khỏi máy này nhưng vẫn còn trong tài khoản. Đăng nhập lại để lấy về.', 'Đăng xuất', false);
  if (!ok) return;
  if (!navigator.onLine) { snackbar('Cần có mạng để đăng xuất (để không mất thay đổi chưa đồng bộ)'); return; }
  try {
    await push();
    stopListening();
    await fb.A.signOut(fb.auth);
  } catch (e) {
    snackbar('Không đăng xuất được: ' + e.message);
    return;
  }
  store.prefs.remove('cloudOwner');
  store.prefs.remove('cloudLastSync');
  store.resetLocal();
  snackbar('Đã đăng xuất');
}

const AUTH_ERRORS = {
  'auth/network-request-failed': 'Không có mạng',
  'auth/popup-blocked': 'Trình duyệt chặn cửa sổ đăng nhập — cho phép popup rồi thử lại',
  'auth/unauthorized-domain': 'Tên miền này chưa được thêm vào Firebase (Authorized domains)',
  'auth/operation-not-allowed': 'Chưa bật đăng nhập Google trong Firebase',
  'auth/too-many-requests': 'Thử quá nhiều lần — đợi một lúc rồi thử lại',
};

async function login() {
  try {
    // SDK đã tải sẵn thì gọi ngay trong lượt bấm, để Safari không chặn popup đăng nhập
    const { auth, A } = fb || await loadSdk();
    const cred = await A.signInWithPopup(auth, new A.GoogleAuthProvider());
    snackbar(`Đã đăng nhập ${cred.user.email || ''} — dữ liệu sẽ tự đồng bộ`);
  } catch (e) {
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return;
    snackbar(AUTH_ERRORS[e?.code] || 'Không đăng nhập được: ' + (e?.message || e), { duration: 6000 });
  }
}

function menuItems() {
  if (!firebaseConfig) return [];
  if (!user) return ['-', { icon: 'account', text: 'Đăng nhập Google để đồng bộ', onClick: login }];
  return [
    '-',
    { label: `${user.email || 'Tài khoản'} · ${timeLabel(Number(store.prefs.get('cloudLastSync')) || 0)}` },
    { icon: 'logout', text: 'Đăng xuất', onClick: logout },
  ];
}

export function initCloud() {
  // Dọn dữ liệu của cách đồng bộ cũ (GitHub Gist)
  ['gistToken', 'gistId', 'gistUser', 'gistLastSync', 'gistDirty'].forEach((k) => store.prefs.remove(k));
  addMenuItems(menuItems);
  setStatus('idle');
  if (!firebaseConfig) return;

  $('#btn-cloud').addEventListener('click', () => {
    if (status === 'ok') snackbar(timeLabel(Number(store.prefs.get('cloudLastSync')) || 0).replace(/^./, (c) => c.toUpperCase()));
    else if (status === 'error') { stopListening(); listen(); }
  });
  store.subscribe((source) => { if (source === 'local' && user) schedulePush(); });
  // Firestore tự kết nối lại khi có mạng; chỉ cần đẩy phần còn chờ
  window.addEventListener('online', () => { if (user) { setStatus('syncing'); push(); } });
  window.addEventListener('offline', () => user && setStatus('offline'));
  // Rời app khi còn thay đổi chưa đẩy → đẩy ngay
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pushTimer) push();
  });

  loadSdk()
    .then(({ auth, A }) => A.onAuthStateChanged(auth, onUser))
    .catch((e) => {
      console.warn('Không tải được Firebase', e);
      // Offline lúc mở app: lần sau có mạng mở lại app sẽ đồng bộ
      if (store.prefs.get('cloudOwner')) snackbar('Đang offline — chưa đồng bộ được');
    });
}
