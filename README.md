# Flashcard

App học flashcard dạng PWA, giao diện kiểu danh sách việc cần làm (Material 3). Chạy hoàn toàn trên trình duyệt, dùng được offline, cài được lên iPhone và Android.

**Link app:** https://tmduc30697.github.io/flashcard/

- Vanilla HTML/CSS/JS, không framework, không bước build.
- Dữ liệu lưu trong `localStorage` của trình duyệt trên từng máy; **đăng nhập Google** (qua Firebase) để dữ liệu tự đồng bộ giữa điện thoại và máy tính.

## Chạy thử trên máy

```bash
python3 -m http.server 8000
```

Mở http://localhost:8000

> Service worker chỉ chạy qua `http://localhost` hoặc `https://`, không chạy khi mở file trực tiếp (`file://`).
> Khi đang sửa code, nếu không thấy thay đổi: DevTools → Application → Service workers → tick "Update on reload".

## Bật GitHub Pages lần đầu

1. Vào repo trên GitHub → **Settings** → **Pages**.
2. **Source**: chọn **Deploy from a branch**.
3. **Branch**: chọn `main`, thư mục `/ (root)` → **Save**.
4. Đợi 1–2 phút, app có ở https://tmduc30697.github.io/flashcard/

Hoặc bằng `gh` CLI:

```bash
gh api -X POST repos/tmduc30697/flashcard/pages -f "source[branch]=main" -f "source[path]=/"
```

> ⚠️ Với tài khoản GitHub miễn phí, repo phải để **Public** thì mới dùng được GitHub Pages.

## Quy trình mỗi lần cập nhật

```bash
# 1. Sửa code
# 2. Tăng phiên bản cache để máy đã cài nhận bản mới
./scripts/bump-version.sh
# 3. Commit và push
git add -A
git commit -m "Mô tả thay đổi"
git push
```

Sau khi push khoảng 1 phút, người dùng mở app sẽ thấy thông báo **"Có bản mới — Cập nhật"**. **Bắt buộc chạy `bump-version.sh`**: app lấy mọi file từ cache của đúng phiên bản (để HTML/CSS/JS luôn khớp nhau), nên nếu không đổi `CACHE_VERSION` thì máy đã cài sẽ **không** nhận code mới.

Khi thêm file tĩnh mới (CSS/JS/icon), nhớ thêm đường dẫn vào mảng `PRECACHE` trong `sw.js`.

### Sinh lại icon

Icon gốc là `icons/icon.svg`. Các file PNG được vẽ bằng Pillow:

```bash
pip3 install Pillow
python3 scripts/gen-icons.py
```

## Cài lên điện thoại

**iPhone / iPad (Safari):**
1. Mở link app bằng **Safari** (Chrome trên iOS cũng được từ iOS 16.4).
2. Bấm nút **Chia sẻ** (ô vuông có mũi tên lên).
3. Chọn **Thêm vào MH chính** → **Thêm**.

**Android (Chrome):**
1. Mở link app bằng **Chrome**.
2. Menu ⋮ của Chrome → **Cài đặt ứng dụng / Thêm vào màn hình chính** (hoặc bấm biểu tượng cài đặt trên thanh địa chỉ).

Sau khi cài, app mở toàn màn hình và dùng được khi không có mạng.

## Sử dụng nhanh

- **Tab trên cùng**: mỗi tab là một bộ thẻ. Bộ thẻ chỉ được tạo bằng cách nhập file JSON.
- **Menu ⋮**: xóa bộ hiện tại, xóa tất cả bộ, nhập file JSON, đăng nhập / đăng xuất.
- **Danh sách** chỉ hiện mặt trước. **Bấm vào một dòng** để mở rộng: hiện mặt sau (câu tiếng Anh, IPA thẳng hàng ngay dưới), ghi chú và 2 nút:
  - **Thuộc** → xóa thẻ (có Hoàn tác).
  - **Chưa thuộc** → thẻ vào **hàng chờ** (ẩn khỏi danh sách).
- Hết thẻ trong danh sách → bấm **Tải lại n thẻ chưa thuộc** để đưa hàng chờ trở lại.
- **Nút xáo trộn** (thanh trên cùng): đổi thứ tự ngẫu nhiên các thẻ (có Hoàn tác).
- **Nút bút chì** trong dòng mở rộng: sửa / xóa thẻ.
- **Nút loa** trong dòng mở rộng: đọc câu tiếng Anh bằng giọng có sẵn của máy (chạy offline).
- **Nút copy** trong dòng mở rộng: copy câu tiếng Anh (ví dụ để dán sang ChatGPT hỏi nghĩa).
- **Vuốt ngang trên danh sách**: chuyển bộ thẻ (sang phải → bộ trước, sang trái → bộ sau).

## Đăng nhập & đồng bộ (Firebase)

Phải **đăng nhập Google** mới dùng được app (màn hình đầu tiên). Mỗi tài khoản có dữ liệu riêng. Máy đã đăng nhập thì mở offline vẫn dùng được; lần đầu đăng nhập trên máy mới cần có mạng. Đăng xuất: menu ⋮ → **Đăng xuất**.

- Đồng bộ **tự động**: sửa trên máy này khoảng 1–2 giây sau đã có trên máy khác đang mở app.
- Offline vẫn dùng bình thường; có mạng lại thì tự đẩy lên.
- Gộp theo **từng thẻ**: sửa trên 2 máy thì giữ bản sửa sau cùng của mỗi thẻ; thẻ đã xóa ở máy này cũng bị xóa ở máy kia.
- Lần đầu đăng nhập trên một máy: dữ liệu đang có trên máy được gộp vào tài khoản (máy mới cài thì lấy nguyên dữ liệu trong tài khoản). Tài khoản mới bắt đầu trống — nhập file JSON để có bộ thẻ.
- **Đăng xuất** xóa dữ liệu khỏi máy đó (vẫn còn trong tài khoản).
- Biểu tượng đám mây trên thanh trên cùng cho biết trạng thái. Đỏ = lỗi, bấm để thử lại.

### Tạo project Firebase (làm một lần, cho người deploy app)

1. https://console.firebase.google.com → **Create a project** (tắt Google Analytics cũng được).
2. **Build → Authentication → Get started → Sign-in method**: bật **Google**.
3. **Authentication → Settings → Authorized domains**: thêm `tmduc30697.github.io` (`localhost` có sẵn).
4. **Build → Firestore Database → Create database**: chọn location (vd. `asia-southeast1`), **production mode**. Tab **Rules** dán vào rồi **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

5. **Project settings → Your apps → Web (`</>`)** → đăng ký app → copy object `firebaseConfig` vào `js/firebase-config.js`.

Gói miễn phí (Spark) đủ dùng cho vài trăm người: 50k lượt đọc, 20k lượt ghi mỗi ngày, 1 GB dữ liệu. Mỗi bộ thẻ là một document (giới hạn 1 MB ≈ vài nghìn thẻ/bộ).

## Định dạng file JSON để nhập

Menu ⋮ → **Nhập từ file JSON**:

```json
{
  "decks": [
    {
      "name": "Friends S01E01",
      "cards": [
        {
          "vi": "Không có gì để kể cả.",
          "en": "There's nothing to tell.",
          "ipa": "ðɛrz ˈnʌθɪŋ tə tɛl",
          "note": "nothing to tell: chẳng có gì để kể"
        }
      ]
    }
  ]
}
```

- `vi` (câu tiếng Việt — hiện trong danh sách) và `en` (câu tiếng Anh — hiện khi mở rộng) là **bắt buộc**; thẻ thiếu một trong hai bị bỏ qua.
- `ipa` và `note` tuỳ chọn. IPA có thể có hoặc không có dấu `/.../`.
- App tự cấp id, thời gian; một file có thể chứa nhiều bộ. Chấp nhận cả mảng các bộ hoặc một bộ đơn lẻ `{ "name": "...", "cards": [...] }`.
- Bộ nhập vào luôn được **thêm mới**, không ghi đè bộ đang có (trùng tên sẽ thành "Tên (2)").
- File kiểu cũ (`front` / `back`, IPA viết chung sau câu tiếng Anh) vẫn nhập được; IPA được tự tách ra.

## Cấu trúc thư mục

```
index.html          Trang duy nhất
manifest.json       Thông tin cài đặt PWA
sw.js               Service worker (cache offline, cập nhật)
css/style.css
js/app.js           Khởi động, điều hướng, đăng ký SW, banner cài đặt/cập nhật
js/store.js         localStorage, nhập JSON, gộp dữ liệu đồng bộ
js/ui-list.js       Tab bộ thẻ, danh sách thẻ, bottom sheet, snackbar
js/ipa.js           Tách phiên âm IPA
js/cloud.js         Đăng nhập + đồng bộ Firebase
js/firebase-config.js  Cấu hình project Firebase
icons/              Icon app (SVG gốc + PNG)
scripts/            gen-icons.py, bump-version.sh
```

Mọi đường dẫn trong app đều là tương đối (`./...`) vì app nằm ở thư mục con `/flashcard/` chứ không phải gốc domain.
