# PSG President Simulator 3D

Game mô phỏng quản lý Paris Saint-Germain, chạy bằng Vite + Three.js.

## Chạy khi phát triển

```bash
npm install
npm run dev
```

## Build và triển khai GitHub Pages

```bash
npm run build
```

Lệnh build tạo `dist/` và tự sinh `dist/sw.js`. GitHub Actions dùng `npm install` và `npm run build`, vì vậy Service Worker ngoại tuyến được tạo tự động trong mỗi lần deploy.

## Chơi offline trên iPhone

1. Đưa toàn bộ mã nguồn lên repository GitHub và chờ GitHub Actions deploy thành công.
2. Trên iPhone, mở URL GitHub Pages bằng Safari khi đang có Wi-Fi/Internet.
3. Giữ trang mở cho đến khi tải xong game; đợi thêm một chút để Service Worker cài đặt và lưu toàn bộ tài nguyên build vào bộ nhớ cache.
4. Trong Safari chọn Chia sẻ → Thêm vào Màn hình chính.
5. Mở game từ biểu tượng vừa thêm. Sau lần tải/cài cache đầu tiên, game có thể mở lại và chơi offline.

## Cách hoạt động offline

- Three.js được đóng gói từ dependency npm và nằm trong bundle của game; không tải thư viện từ CDN.
- Build script quét toàn bộ `dist/` và tạo danh sách precache cho HTML, JavaScript, CSS, manifest và icon.
- Service Worker cache-first các tài nguyên cùng origin, đồng thời có fallback trang chính khi điều hướng offline.
- Khi có mạng và người dùng mở lại game, ứng dụng yêu cầu Service Worker kiểm tra bản cập nhật.
- Tiến trình game vẫn lưu cục bộ bằng IndexedDB, có fallback LocalStorage.

## Lưu ý quan trọng trên iOS

- Không thể chơi offline ngay lần đầu: cần mở game online ít nhất một lần để tải và cache tài nguyên.
- Phải mở bằng HTTPS (GitHub Pages đáp ứng yêu cầu này); không mở file `index.html` trực tiếp từ ứng dụng Tệp.
- Không xóa dữ liệu website/Safari hoặc gỡ biểu tượng web app nếu muốn giữ cache và dữ liệu cục bộ.
- iOS có thể tự giải phóng dữ liệu website khi thiếu dung lượng. Vì vậy offline và lưu cục bộ không phải bản sao lưu vĩnh viễn; nên bổ sung/ sử dụng chức năng xuất bản sao lưu nếu có.
- Các tính năng cần máy chủ, dữ liệu trực tuyến hoặc CDN bên ngoài (nếu được thêm về sau) sẽ không hoạt động khi offline. Phiên bản hiện tại loại bỏ CDN Three.js; các tài nguyên build của game được precache.

## Cập nhật

Khi có bản mới, cập nhật mã nguồn và push lên nhánh `main`. GitHub Actions build lại và triển khai. Khi thiết bị có mạng, mở lại web app để Service Worker tải phiên bản mới. Nếu vẫn thấy bản cũ, đóng hẳn web app rồi mở lại khi có Internet.


## Cài đặt PWA và chơi offline trên iPhone

Xem hướng dẫn chi tiết tại [OFFLINE_IOS_GUIDE.md](./OFFLINE_IOS_GUIDE.md). Game cần được mở lần đầu bằng Safari trên HTTPS để cài Service Worker và tải bộ tài nguyên offline. Sau đó chọn Chia sẻ → Thêm vào Màn hình chính.
