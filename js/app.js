// Khởi động app: điều hướng, service worker, banner cài đặt / cập nhật.
import * as store from './store.js';
import { initList, initRipple, setExtraMenuItems, snackbar, closeSheet, closeMenu, h, icon } from './ui-list.js';
import { initStudy, startStudy, stopStudy } from './ui-study.js';

const $ = (sel) => document.querySelector(sel);

// ---------- Điều hướng bằng hash: '' = danh sách, '#study' = học ----------
function route() {
  const study = location.hash === '#study';
  closeSheet();
  closeMenu();
  if (study && !startStudy()) {
    history.replaceState(null, '', location.pathname + location.search);
    return route();
  }
  if (!study) stopStudy();
  $('#screen-list').hidden = study;
  $('#screen-study').hidden = !study;
  window.scrollTo(0, 0);
}

function goStudy() {
  const deck = store.currentDeck();
  if (!deck?.cards.some((c) => !c.known)) {
    snackbar(deck?.cards.length ? 'Bạn đã thuộc hết bộ này' : 'Bộ này chưa có thẻ nào');
    return;
  }
  location.hash = 'study';
}

// ---------- Service worker & cập nhật ----------
function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener('load', async () => {
    let reg;
    try {
      reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    } catch (e) {
      console.warn('Không đăng ký được service worker', e);
      return;
    }
    const promptUpdate = (worker) => {
      snackbar('Có bản mới', {
        action: 'Cập nhật', duration: 0,
        onAction: () => worker.postMessage({ type: 'SKIP_WAITING' }),
      });
    };
    if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(nw);
      });
    });
    // Kiểm tra bản mới mỗi khi người dùng quay lại app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  });
}

// ---------- Cài đặt ----------
const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

let installPrompt = null;
function initInstall() {
  // Android / Chrome: giữ sự kiện để hiện mục "Cài app" trong menu ⋮
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    snackbar('Đã cài app');
  });
  setExtraMenuItems(() => installPrompt ? ['-', {
    icon: 'install', text: 'Cài app',
    onClick: async () => {
      const p = installPrompt;
      installPrompt = null;
      p.prompt();
      await p.userChoice.catch(() => null);
    },
  }] : []);

  // iOS Safari: không có sự kiện cài đặt → hiện hướng dẫn một lần
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS || isStandalone() || store.prefs.get('iosBannerDismissed') === '1') return;
  const banner = $('#ios-banner');
  banner.replaceChildren(
    h('img', { src: './icons/apple-touch-icon.png', alt: '' }),
    h('div', { class: 'msg', html: `Cài app: bấm <b>Chia sẻ</b> ${icon('share', 'inline')} → <b>Thêm vào MH chính</b>` }),
    h('button', {
      type: 'button', class: 'icon-btn ripple', 'aria-label': 'Đóng', html: icon('close'),
      onclick: () => { banner.hidden = true; store.prefs.set('iosBannerDismissed', '1'); },
    }),
  );
  setTimeout(() => { banner.hidden = false; }, 1500);
}

// ---------- Khởi động ----------
store.load();
initRipple();
initList({ onStudy: goStudy });
initStudy();
if (location.hash === '#study') history.replaceState(null, '', location.pathname + location.search);
window.addEventListener('hashchange', route);
route();
initInstall();
initServiceWorker();
