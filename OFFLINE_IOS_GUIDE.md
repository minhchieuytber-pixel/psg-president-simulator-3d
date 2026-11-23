# Cài PSG President 3D dạng PWA để chơi offline trên iPhone

## Triển khai lần đầu

1. Đưa toàn bộ nội dung thư mục dự án lên repository GitHub (không chỉ tải file ZIP).
2. Repository cần giữ nguyên thư mục `.github/workflows`, `src`, `public`, `scripts` và các file cấu hình ở thư mục gốc.
3. Trong GitHub, mở **Settings → Pages** và chọn **Source: GitHub Actions**.
4. Mở tab **Actions**, chờ workflow **Deploy game to GitHub Pages** hoàn tất thành công.

## Cài trên iPhone

1. Kết nối Internet và mở URL HTTPS của GitHub Pages bằng **Safari**.
2. Đợi game tải xong, màn hình game khởi động được và Service Worker cài đặt bộ cache. Với lần đầu, nên giữ trang mở thêm một lúc để tải hết tài nguyên.
3. Trong Safari, chọn **Chia sẻ → Thêm vào Màn hình chính → Thêm**.
4. Mở game từ biểu tượng **PSG President 3D** trên màn hình chính ít nhất một lần khi vẫn có Internet.

## Kiểm tra offline

1. Đóng game từ trình chuyển ứng dụng (không xóa dữ liệu website).
2. Bật Chế độ máy bay.
3. Mở lại biểu tượng PSG President 3D.
4. Kiểm tra game vào được và tiến trình đã lưu vẫn còn.

## Cách hoạt động và giới hạn

- Build tạo `dist/sw.js` với danh sách toàn bộ tệp trong bản build; Service Worker precache các tài nguyên cùng origin.
- Three.js được đóng gói từ dependency npm trong bundle, không cần tải CDN lúc chơi.
- Game dùng IndexedDB/LocalStorage hiện có để lưu tiến trình; cache offline và dữ liệu mùa giải là hai phần riêng biệt.
- Khi có mạng, Service Worker kiểm tra bản mới. Bản mới được tải vào cache riêng; cache phiên bản trước chỉ bị dọn sau khi bản mới cài đặt thành công.
- Không xóa dữ liệu Safari/website hoặc gỡ biểu tượng PWA nếu muốn giữ dữ liệu cục bộ. iOS vẫn có thể thu hồi dữ liệu website trong một số tình huống thiếu dung lượng; nên dùng chức năng sao lưu trong game nếu có.
- Chỉ các tài nguyên đã được đóng gói/cache mới chạy offline. Những tính năng cần máy chủ hoặc Internet (nếu được bổ sung sau này) sẽ không hoạt động khi mất mạng.
- Chế độ PWA không phải ứng dụng IPA và không cần App Store. iPhone yêu cầu cài PWA từ Safari trên HTTPS.

## Nếu không mở được khi offline

1. Tắt Chế độ máy bay, mở lại trang bằng Safari và đợi Service Worker cài đặt xong.
2. Tải lại trang một lần, sau đó mở biểu tượng trên màn hình chính để thử lại.
3. Vào GitHub Actions xác nhận workflow triển khai thành công và kiểm tra URL Pages đang trỏ đúng repository.
4. Không xóa dữ liệu website trong Safari trong lúc khắc phục, vì thao tác đó có thể xóa cả dữ liệu lưu game.
