# Tài liệu Thiết kế Hệ thống: Ứng dụng Quản lý Mua sắm (Shopping List App)

* **Ngày lập**: 2026-05-20
* **Tác giả**: Antigravity AI
* **Trạng thái**: Đã phê duyệt (Approved)
* **Nền tảng mục tiêu**: Mobile Web / Progressive Web App (PWA)

---

## 1. Tổng quan Dự án (Goal & Product Overview)
Mục tiêu là xây dựng một ứng dụng web app quản lý danh sách mua sắm tối ưu hóa 100% cho điện thoại di động, thay thế việc đọc và tương tác trực tiếp bất tiện trên file Excel (`JAPAN 2026.xlsx`).

Ứng dụng cho phép người dùng đăng nhập tài khoản riêng tư, tải file Excel lên để nạp nhanh danh sách sản phẩm, tự tải hình ảnh lên từ camera/thư viện điện thoại, tăng giảm số lượng, ghi chú, và tích chọn sản phẩm đã mua vào một phân khu riêng biệt kèm theo việc cập nhật giá mua thực tế để kiểm soát chi tiêu chính xác.

---

## 2. Kịch bản Người dùng (User Stories)
* **Đăng nhập/Đăng ký**: Người dùng có tài khoản riêng để lưu trữ danh sách mua sắm cá nhân, tránh lộ thông tin và cho phép đồng bộ trên nhiều điện thoại.
* **Tải dữ liệu từ Excel**: Người dùng có thể chọn file Excel có sẵn trên điện thoại, hệ thống tự động lọc và nạp các sản phẩm vào danh sách mua sắm.
* **Quản lý danh sách "Cần Mua"**: Hiển thị danh sách trực quan dạng thẻ (Card) dọc, cho phép sửa số lượng nhanh qua nút bấm `+` / `-`, xem ghi chú và sản phẩm thay thế.
* **Tải ảnh sản phẩm**: Người dùng chạm vào khung ảnh để chụp hình trực tiếp sản phẩm tại kệ hàng hoặc chọn từ thư viện ảnh, giúp dễ dàng nhận diện sản phẩm khi đi mua.
* **Luồng "Đăng ký mua" thông minh**: Khi tích chọn đã mua, ứng dụng hiển thị popup nhập giá thực tế (điền sẵn giá tham chiếu). Khi xác nhận, sản phẩm trượt mượt mà sang tab "Đã Mua".
* **Kiểm soát chi tiêu "Đã Mua"**: Tab "Đã Mua" hiển thị danh sách sản phẩm đã hoàn thành, tổng số tiền thực tế đã chi tiêu, hỗ trợ hoàn tác trả lại nếu bấm nhầm.

---

## 3. Thiết kế Giao diện (UI/UX Design System)
* **Chủ đề (Theme)**: Premium Dark Mode
  * Nền chính: Slate Dark (`#0f172a`)
  * Thẻ Card: Glassmorphism (Nền mờ `#1e293b` với opacity `80%`, viền mờ `1px solid rgba(255,255,255,0.08)`, hiệu ứng `backdrop-filter: blur(12px)`)
  * Màu nhấn chủ đạo (Primary Accent): Neon Blue (`#3b82f6`)
  * Màu thành công (Success Accent): Emerald Green (`#10b981`)
  * Màu cảnh báo / ghi chú: Amber Orange (`#f59e0b`)
* **Bố cục (Layout)**:
  * **Header**: Tiêu đề app + Nút Đăng xuất + Nút nạp Excel.
  * **Hai Tab Chuyển Đổi**:
    * **Tab "Cần Mua"**: Bộ lọc, ô tìm kiếm nhanh, danh sách thẻ sản phẩm chưa mua.
    * **Tab "Đã Mua"**: Bảng thống kê chi tiêu thực tế, danh sách thẻ sản phẩm đã mua gọn gàng.
  * **Thẻ sản phẩm (Shopping Item Card)**:
    * Phần trên: Số thứ tự, Tên sản phẩm cỡ chữ to, Checkbox đã mua kích thước lớn (độ rộng tối thiểu `44px` để dễ chạm).
    * Phần giữa: Thumbnail ảnh bên trái (có nút upload); Grid giá tham chiếu, số lượng (`+`/`-`), thành tiền tạm tính bên phải.
    * Phần dưới: Vùng ghi chú & sản phẩm thay thế (collapsible).

---

## 4. Cấu trúc Cơ sở dữ liệu (Firestore Database Schema)

Hệ thống lưu trữ trên **Cloud Firestore** cô lập theo tài khoản người dùng:

### Thư mục dữ liệu: `users/{userId}/items/{itemId}`
| Trường dữ liệu | Kiểu dữ liệu | Mô tả |
|----------------|-------------|-------|
| `id` | `string` | ID ngẫu nhiên của sản phẩm (khóa chính). |
| `stt` | `number` | Số thứ tự sản phẩm (đọc từ Excel hoặc tự tăng). |
| `name` | `string` | Tên sản phẩm cần mua (ví dụ: "DHC collagen 60V"). |
| `imageUrl` | `string` | Link ảnh trên Firebase Storage. Mặc định là chuỗi rỗng `""`. |
| `referencePrice`| `number` | Giá tham chiếu từ file Excel. |
| `actualPrice` | `number` | Giá mua thực tế (nhập khi tích đã mua, mặc định bằng `referencePrice`). |
| `quantity` | `number` | Số lượng cần mua (mặc định từ Excel, cho phép tăng giảm). |
| `notes` | `string` | Ghi chú thêm (ví dụ: "Thảo 2, Hương 2"). |
| `alternative` | `string` | Sản phẩm thay thế nếu hết hàng. |
| `purchased` | `boolean` | Trạng thái mua hàng (`false`: Cần mua, `true`: Đã mua). |
| `createdAt` | `timestamp` | Thời gian tạo để sắp xếp thứ tự hiển thị. |

### Bộ lưu trữ tệp tin: **Firebase Storage**
* Đường dẫn ảnh: `users/{userId}/images/{itemId}_{timestamp}.jpg`

---

## 5. Kiến trúc Component (React Architecture)
```
src/
├── components/
│   ├── Auth.jsx             # Biểu mẫu Đăng ký/Đăng nhập
│   ├── ExcelImporter.jsx    # Component chọn và parse file Excel (dùng thư viện xlsx)
│   ├── Header.jsx           # Thanh công cụ trên cùng và thông tin tài khoản
│   ├── ShoppingCard.jsx     # Thẻ hiển thị sản phẩm mua sắm (Cần mua / Đã mua)
│   ├── PriceConfirmModal.jsx # Popup nhập nhanh giá mua thực tế khi tích chọn
│   └── SpendingSummary.jsx  # Card hiển thị tiến độ và thống kê ngân sách thực tế
├── firebase/
│   └── config.js            # Khởi tạo Firebase Auth, Firestore, Storage
├── App.jsx                  # Điều phối trạng thái Tab và hiển thị chính
├── index.css                # Hệ thống CSS Variables và phong cách thiết kế Premium
└── main.jsx
```

---

## 6. Đặc tả Kỹ thuật nổi bật (Technical Specifications)

### A. Phân tích file Excel (Excel Client-side Parser)
Sử dụng thư viện `xlsx` (SheetJS) để xử lý hoàn toàn ở client:
1. Người dùng chọn file Excel.
2. Script đọc Sheet đầu tiên, tìm kiếm các dòng tiêu đề tương ứng:
   * Cột **STT** hoặc tương tự -> `stt`
   * Cột **TÊN** hoặc **TÊN SẢNH PHẨM** -> `name`
   * Cột **GIÁ THAM CHIẾU** hoặc **GIÁ** -> `referencePrice`
   * Cột **SỐ LƯỢNG** -> `quantity`
   * Cột **GHI CHÚ** -> `notes`
   * Cột **SẢN PHẨM THAY THẾ** -> `alternative`
3. Chuẩn hóa dữ liệu (ví dụ bỏ dấu chấm phân tách phần nghìn trong giá như `2.200` thành `2200` để tính toán chính xác).
4. Đồng bộ hàng loạt vào Firestore bằng `writeBatch` của Firebase để tối ưu hóa hiệu năng và giảm số lượng request.

### B. Tải ảnh trực tiếp (Image Upload Flow)
1. Trong thẻ sản phẩm, khi chạm vào vùng ảnh chưa có, thẻ `<input type="file" accept="image/*">` được kích hoạt (trên điện thoại sẽ tự động hiển thị tùy chọn Camera hoặc Thư viện ảnh).
2. Tải ảnh lên Firebase Storage dưới định dạng nén JPEG.
3. Nhận `downloadURL` từ Storage và cập nhật trường `imageUrl` của sản phẩm tương ứng trong Firestore.

### C. Khả năng chạy PWA (Progressive Web App)
* Cấu hình Manifest (`manifest.json`) cho phép hiển thị app toàn màn hình trên điện thoại (định nghĩa `display: standalone`, hướng màn hình `portrait`).
* Tạo Service Worker để lưu trữ cache các file tĩnh (HTML, CSS, JS), giúp app tải tức thì trên điện thoại ngay cả khi sóng yếu trong siêu thị.

---

## 7. Kế hoạch Kiểm thử & Xác thực (Verification Plan)
* **Đăng nhập**: Kiểm tra đăng ký mới, đăng nhập đúng/sai tài khoản, cô lập dữ liệu (tài khoản A không thấy danh sách của tài khoản B).
* **Nạp Excel**: Test tải file Excel có định dạng cột khác nhau, kiểm tra xử lý lọc dòng trống, định dạng lại số tiền (`2.200` -> `2200`).
* **Tính toán giá trị**: Xác nhận `Thành tiền = Giá * Số lượng` tự động cập nhật khi nhấn nút `+` / `-`.
* **Upload ảnh**: Test chụp ảnh trực tiếp từ camera điện thoại, tải lên thành công, cập nhật giao diện hiển thị mượt mà.
* **Cơ chế chuyển Tab**: Tích chọn sản phẩm -> Nhập giá thực tế -> Sản phẩm biến mất khỏi Tab 1 và xuất hiện tại Tab 2 với giá mua thực tế -> Tổng tiền thực tế thay đổi chính xác.
