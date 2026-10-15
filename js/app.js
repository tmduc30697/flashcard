// Khởi động app: service worker, banner cài đặt / cập nhật.
import * as store from './store.js';
import { initList, initRipple, snackbar, h, icon } from './ui-list.js';
import { initSync } from './sync.js';

const $ = (sel) => document.querySelector(sel);

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

// Android / Chrome tự hiện gợi ý cài app của trình duyệt; chỉ iOS cần hướng dẫn
function initInstall() {
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
initList();
initInstall();
initSync();
initServiceWorker();
