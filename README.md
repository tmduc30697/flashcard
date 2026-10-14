# Flashcard

App học flashcard dạng PWA, giao diện kiểu danh sách việc cần làm (Material 3). Chạy hoàn toàn trên trình duyệt, dùng được offline, cài được lên iPhone và Android.

**Link app:** https://tmduc30697.github.io/flashcard/

- Vanilla HTML/CSS/JS, không framework, không bước build.
- Dữ liệu lưu trong `localStorage` của trình duyệt trên từng máy; có thể bật **đồng bộ qua GitHub Gist** để điện thoại và máy tính dùng chung.

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

Sau khi push khoảng 1 phút, người dùng mở app sẽ thấy thông báo **"Có bản mới — Cập nhật"**. Nếu quên chạy `bump-version.sh`, các file CSS/JS vẫn tự cập nhật ở lần mở sau nữa (stale-while-revalidate), nhưng không có thông báo và cache cũ không được dọn.

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
2. Bấm menu ⋮ trong app → **Cài app**, hoặc menu ⋮ của Chrome → **Cài đặt ứng dụng / Thêm vào màn hình chính**.

Sau khi cài, app mở toàn màn hình và dùng được khi không có mạng.

## Sử dụng nhanh

- **Tab trên cùng**: mỗi tab là một bộ thẻ; tab cuối "+ Bộ mới" để tạo bộ.
- **Menu ⋮**: đổi tên / xóa bộ hiện tại, nhập file JSON, xóa tất cả bộ, đồng bộ Gist, cài app.
- **Vòng tròn bên trái**: đánh dấu "Đã thuộc" — thẻ chuyển xuống mục *Đã thuộc (n)* ở cuối.
- **Bấm vào thẻ**: sửa / xóa. **Vuốt sang trái**: xóa nhanh (có Hoàn tác).
- **Nút +**: thêm thẻ, hoặc chuyển sang **Thêm nhiều** để dán cả danh sách.
- **Học**: học các thẻ chưa thuộc theo thứ tự ngẫu nhiên; chạm để lật; nút ⇄ để đảo chiều (hiện mặt sau trước). Trên máy tính có thể dùng phím ← (chưa thuộc) và → (đã thuộc).

## Đồng bộ giữa các máy (GitHub Gist)

Dữ liệu được lưu vào một **secret gist** (file `flashcard-data.json`) trong tài khoản GitHub của bạn. Không cần server hay đăng ký dịch vụ nào khác.

**Bật lần đầu:**
1. Trong app: menu ⋮ → **Đồng bộ GitHub Gist** → bấm *Mở trang tạo token trên GitHub*
   (hoặc mở thẳng https://github.com/settings/tokens/new?scopes=gist&description=Flashcard%20PWA).
2. Expiration chọn **No expiration**, chỉ tick quyền **gist** → **Generate token**.
3. Copy token (`ghp_...`), dán vào app → **Kết nối**. Lưu token vào ghi chú để dùng cho máy khác.

**Trên máy khác:** cài app, menu ⋮ → Đồng bộ GitHub Gist → dán cùng token. App tự tìm gist cũ và tải dữ liệu về (bộ mẫu trên máy mới sẽ được bỏ đi).

**Cách hoạt động:**
- Mở app / quay lại app → tải dữ liệu mới nhất từ gist.
- Sửa thẻ, tick đã thuộc… → khoảng 2–3 giây sau tự đẩy lên.
- Offline vẫn dùng bình thường; có mạng lại thì tự đồng bộ.
- Gộp theo **từng thẻ**: sửa trên 2 máy khác nhau thì giữ bản sửa sau cùng của mỗi thẻ; thẻ đã xóa ở máy này cũng bị xóa ở máy kia.
- Biểu tượng đám mây trên thanh trên cùng cho biết trạng thái; bấm vào để đồng bộ ngay. Đỏ = lỗi (thường do token hết hạn → kết nối lại).
- Xem/sửa dữ liệu và lịch sử các phiên bản: menu ⋮ → **Mở Gist trên GitHub**.

> Token chỉ có quyền gist và được lưu trong trình duyệt của máy đó. Không dán token trên máy của người khác. Nếu lộ token: xóa nó tại https://github.com/settings/tokens rồi tạo token mới.

## Định dạng "Thêm nhiều"

Mỗi dòng một thẻ, mặt trước và mặt sau ngăn cách bằng ` - `, ` : ` hoặc phím **Tab** (dán thẳng từ Excel/Google Sheets được):

```
deforestation - nạn phá rừng
biodiversity : đa dạng sinh học
mitigate	giảm nhẹ
```

Dòng trống hoặc không có dấu ngăn cách sẽ bị bỏ qua; app hiển thị số thẻ hợp lệ trước khi thêm.

## Định dạng file JSON để nhập

Menu ⋮ → **Nhập từ file JSON**. Định dạng tối thiểu:

```json
{
  "decks": [
    {
      "name": "IELTS – Health",
      "cards": [
        { "front": "obesity /əʊˈbiːsəti/", "back": "béo phì", "note": "Obesity rates have risen sharply." }
      ]
    }
  ]
}
```

- Mỗi thẻ cần `front` và `back`; `note` tuỳ chọn. App tự cấp id, thời gian; mọi thẻ nhập vào là chưa thuộc.
- Chấp nhận: object có `decks`, một mảng các bộ, hoặc một bộ đơn lẻ `{ "name": "...", "cards": [...] }`.
- Bộ nhập vào luôn được **thêm mới**, không ghi đè bộ đang có (trùng tên sẽ thành "Tên (2)").
- Phiên âm IPA đặt ở cuối mặt trước/mặt sau (`word /wɜːd/`, hoặc sau câu: `It's lame. ɪts 'leɪm`) sẽ được tự tách ra dòng riêng, chữ nhỏ hơn.

## Cấu trúc thư mục

```
index.html          Trang duy nhất
manifest.json       Thông tin cài đặt PWA
sw.js               Service worker (cache offline, cập nhật)
css/style.css
js/app.js           Khởi động, điều hướng, đăng ký SW, banner cài đặt/cập nhật
js/store.js         localStorage, nhập JSON, dữ liệu mẫu, gộp dữ liệu đồng bộ
js/ui-list.js       Tab bộ thẻ, danh sách thẻ, bottom sheet, snackbar
js/ui-study.js      Chế độ học
js/sync.js          Đồng bộ với GitHub Gist
icons/              Icon app (SVG gốc + PNG)
scripts/            gen-icons.py, bump-version.sh
```

Mọi đường dẫn trong app đều là tương đối (`./...`) vì app nằm ở thư mục con `/flashcard/` chứ không phải gốc domain.
