# MrFabric — Thư viện vật liệu vải online

## 1. Mục tiêu project

MrFabric là website thư viện vật liệu vải online phục vụ kiến trúc sư, đơn vị nội thất, sale tư vấn và khách hàng cuối.

Người dùng có thể:
- Xem vật liệu vải online theo dòng sản phẩm
- Lọc nhanh theo nhãn / đặc tính vật liệu
- Xem chi tiết từng mã vật liệu với 4 trạng thái ảnh
- Tải ảnh map/texture để phục vụ render/diễn họa
- Lưu các mẫu phù hợp vào Bộ mẫu tư vấn (Moodboard)
- Copy thông tin bộ mẫu theo 3 format (KTS, Sale, Khách hàng)
- Admin thêm vật liệu mới qua ảnh nhãn + mock OCR

---

## 2. Đối tượng sử dụng

| Đối tượng | Nhu cầu chính |
|---|---|
| KTS / Nội thất | Tìm vật liệu theo màu, bề mặt, công năng. Tải map texture render. |
| Sale MrFabric | Lọc nhanh, lưu bộ mẫu, copy thông tin gửi khách. |
| Khách hàng cuối | Xem mẫu vải online đẹp, dễ hiểu, hiểu phù hợp không gian nào. |
| Admin MrFabric | Thêm vật liệu mới qua ảnh nhãn và mock OCR. |

---

## 3. Phạm vi MVP

**Đã làm:**
- Website thư viện vật liệu với dữ liệu mẫu local
- Chọn dòng sản phẩm
- Lọc và tìm kiếm vật liệu
- Xem chi tiết với 4 trạng thái ảnh
- Nút tải map/texture render
- Moodboard / bộ mẫu tư vấn
- Copy thông tin bộ mẫu theo 3 format
- Admin thêm vật liệu bằng ảnh nhãn + mock OCR
- Lưu vật liệu mới bằng localStorage

**Không thuộc MVP:**
- Backend / database thật
- Đăng nhập / phân quyền
- AI/OCR thật
- Báo giá / đơn hàng / thanh toán
- Quản lý kho / upload file lên server

---

## 4. Cấu trúc dữ liệu — Dòng sản phẩm

```js
{
  id: 'linen-look-dimout',          // ID duy nhất
  name: 'MrFabric Linen Look Dimout', // Tên đầy đủ
  shortName: 'Linen Look Dimout',   // Tên ngắn hiển thị selector
  description: '...',               // Mô tả dòng sản phẩm
  category: 'Rèm chính',            // Nhóm sản phẩm
  applications: ['Rèm chính', ...], // Ứng dụng
  defaultUse: 'Rèm chính',
  status: 'active',                 // active | inactive
  coverImage: null,                 // Ảnh bìa (null nếu chưa có)
  materialCount: 8,                 // Số mã vật liệu
}
```

---

## 5. Cấu trúc dữ liệu — Mã vật liệu

```js
{
  id: 'mc-sgn-be-003',
  productLineId: 'linen-look-dimout',
  maMrFabric: 'MC-SGN-BE-003',
  maNCC: 'AC-KANVAS-BE-03',
  tenDongSanPham: 'MrFabric Linen Look Dimout',
  tenMau: 'Natural Beige',
  collection: 'Kanvas',
  nhaCungCap: 'Acacia',
  nhomMau: 'Be',
  toneMau: 'Tone trung tính',
  beMat: 'Linen look',
  ungDung: ['Rèm chính', 'Phòng khách'],  // Array
  congNang: ['Dimout', 'Linen look'],      // Array
  phongCach: ['Modern', 'Minimal'],        // Array
  phanKhuc: 'Premium',
  khoVai: '280cm',
  thanhPhan: 'Polyester linen look',
  tieuChuan: 'Interior fabric',
  moTaNgan: '...',
  ghiChuTuVan: '...',
  ghiChuTuVanKTS: '...',
  ghiChuTuVanSale: '...',
  ghiChuNganGuiKhach: '...',
  images: { closeup, curtain, sofaPillow, renderTexture },
  files: { renderTexture, specSheet },
}
```

---

## 6. Quy ước ảnh vật liệu

```
public/materials/{productLineId}/{maMrFabric}/closeup.jpg
public/materials/{productLineId}/{maMrFabric}/curtain.jpg
public/materials/{productLineId}/{maMrFabric}/sofa-pillow.jpg
public/materials/{productLineId}/{maMrFabric}/render-texture.jpg
```

Nếu ảnh chưa có, giao diện tự hiện placeholder — không lỗi.

---

## 7. Quy ước file tải map/render

```
public/materials/{productLineId}/{maMrFabric}/render-texture.jpg  ← file texture
public/materials/{productLineId}/{maMrFabric}/spec.pdf            ← spec sheet
```

---

## 8. Cách thêm dòng sản phẩm mới

1. Mở [src/data/productLines.js](src/data/productLines.js)
2. Thêm object mới theo cấu trúc trên
3. Tạo folder ảnh tương ứng trong `public/materials/{id}/`

---

## 9. Cách thêm mã vật liệu mới (thủ công)

1. Mở [src/data/initialMaterials.js](src/data/initialMaterials.js)
2. Thêm object vật liệu mới theo đúng cấu trúc
3. Đặt `productLineId` khớp với dòng sản phẩm
4. Đặt ảnh vào `public/materials/{productLineId}/{maMrFabric}/`

---

## 10. Admin thêm vật liệu (qua giao diện)

**Luồng:**
1. Bấm tab **Admin**
2. Kéo thả hoặc chọn ảnh nhãn sản phẩm (JPG/PNG/WebP)
3. Bấm **Đọc nhãn** — hệ thống chuyển trạng thái "Đang đọc..."
4. Sau ~2 giây, form tự điền dữ liệu mẫu (mock OCR)
5. Admin kiểm tra, chỉnh sửa từng trường
6. Bấm **Tạo mã MrFabric** để tự tạo mã theo quy tắc
7. Bấm **Lưu vật liệu**
8. Vật liệu mới xuất hiện trong Thư viện

**Trường bắt buộc:** Dòng sản phẩm, Mã MrFabric, Mã NCC, Tên màu, Nhóm màu, Ứng dụng, Công năng.

---

## 11. Đọc nhãn bằng Claude Vision AI

**Tính năng hiện tại:**
- Admin upload ảnh nhãn → bấm **Đọc nhãn** → Claude Vision API đọc và điền tự động các trường NCC.
- Chỉ điền thông tin nhìn thấy rõ trên nhãn — không đoán, không bịa.
- Nếu chưa cài API key, hệ thống báo lỗi rõ và cho phép điền thủ công.

**Cách cài đặt CLAUDE_API_KEY:**

1. Lấy API key tại [https://console.anthropic.com/](https://console.anthropic.com/) → mục **API Keys**
2. Tạo file `.env.local` ở thư mục gốc project (nếu chưa có):
   ```
   CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxx
   ```
3. Khởi động lại dev server (`npm run dev`) — Vite tự load biến môi trường mới.

> **Lưu ý bảo mật:**  
> - Biến `CLAUDE_API_KEY` **không** có prefix `VITE_` → không bao giờ bị đưa vào bundle client.  
> - Key được inject server-side qua Vite proxy — browser không bao giờ thấy key.  
> - File `.env.local` đã được chặn trong `.gitignore` — không commit lên git.

**Nếu không có API key:**
- Bấm "Đọc nhãn" → hệ thống hiện thông báo "Chưa cấu hình CLAUDE_API_KEY".
- Admin tự điền thủ công toàn bộ form — mọi chức năng khác hoạt động bình thường.

**Model đang dùng:** `claude-haiku-4-5-20251001` (nhanh, chi phí thấp, đủ cho đọc nhãn)

**File liên quan:**
- [src/helpers/labelReader.js](src/helpers/labelReader.js) — gọi Claude Vision API
- [vite.config.js](vite.config.js) — cấu hình proxy, inject API key server-side

---

## 12. localStorage đang lưu gì

| Key | Nội dung |
|---|---|
| `mrfabric_moodboard` | Danh sách mẫu trong bộ mẫu tư vấn (kèm trạng thái) |
| `mrfabric_admin_materials` | Vật liệu mới do Admin thêm qua giao diện |

Dữ liệu gốc (`initialMaterials`) không lưu vào localStorage — đây là dữ liệu hard-code trong source.

---

## 13. Cách chạy project

```bash
# 1. Cài dependencies
npm install

# 2. Cấu hình API key (bắt buộc để dùng chức năng đọc nhãn AI)
#    Tạo file .env.local ở thư mục gốc:
echo CLAUDE_API_KEY=sk-ant-api03-xxx > .env.local
#    Thay sk-ant-api03-xxx bằng key thật từ https://console.anthropic.com/

# 3. Chạy dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

App mặc định chạy tại: http://localhost:5173

> **Không có API key?** App vẫn chạy đầy đủ — chỉ chức năng đọc nhãn AI sẽ yêu cầu điền thủ công.

---

## 14. Checklist test MVP

### Thư viện
- [ ] Mở app thấy Header MrFabric và subtitle "Thư viện vật liệu vải online"
- [ ] Có nút Thư viện và Admin, mặc định mở Thư viện
- [ ] ProductLineSelector hiển thị 2 dòng sản phẩm
- [ ] Chọn Linen Look Dimout → 8 mã màu
- [ ] Chọn Sheer Linen Look → 5 mã màu
- [ ] ProductLineIntro đổi thông tin đúng khi chuyển dòng
- [ ] Filter options thay đổi theo dòng sản phẩm
- [ ] Search theo mã MrFabric hoạt động
- [ ] Search theo tên màu hoạt động
- [ ] Filter nhóm màu, công năng hoạt động đúng
- [ ] Filter cùng nhóm = OR, khác nhóm = AND
- [ ] Nút "Xóa lọc" trả lại đủ mã của dòng đang chọn

### Chi tiết vật liệu
- [ ] Bấm card → mở modal chi tiết
- [ ] Modal có đủ thông tin vật liệu
- [ ] Modal có 4 tab ảnh, mặc định "Cận bề mặt"
- [ ] Chuyển từng tab không lỗi
- [ ] Ảnh lỗi hiện placeholder, không hiện icon lỗi browser
- [ ] Tab render có nút "Tải map render"
- [ ] Nút tải không làm app lỗi khi chưa có file thật
- [ ] Bấm ESC hoặc ngoài modal → đóng modal, giữ nguyên search/filter

### Moodboard
- [ ] Lưu vật liệu vào Moodboard
- [ ] Không lưu trùng
- [ ] Lưu được mẫu từ nhiều dòng sản phẩm
- [ ] Moodboard item hiển thị tên dòng sản phẩm
- [ ] Đổi trạng thái mẫu
- [ ] Reload trang → giữ Moodboard và trạng thái
- [ ] Xem chi tiết từ Moodboard → mở đúng modal
- [ ] Copy KTS / Sale / Khách đúng format
- [ ] Xóa từng mẫu / xóa tất cả
- [ ] Moodboard trống → nút copy disabled

### Admin — Tạo vật liệu
- [ ] Bấm Admin → mở màn hình thêm vật liệu
- [ ] Khi chưa có ảnh, nút "Đọc nhãn" disabled
- [ ] Chọn ảnh nhãn → hiện preview ảnh
- [ ] Bấm "Đọc nhãn" → hiện trạng thái "Đang đọc nhãn bằng AI..."
- [ ] **Có API key:** form tự điền các trường đọc được, trường nào đọc được gắn badge 📋
- [ ] **Không có API key:** hiện thông báo lỗi rõ, form để trống cho điền thủ công
- [ ] Admin chỉnh được từng trường (kể cả trường đã điền bởi AI)
- [ ] Bấm "Tạo mã MrFabric" → mã được tạo theo quy tắc, không trùng
- [ ] Thiếu trường bắt buộc → hiện cảnh báo đỏ dưới trường
- [ ] Lưu thành công → hiện thông báo, vật liệu xuất hiện trong Thư viện
- [ ] Search và filter nhận diện vật liệu mới
- [ ] Reload trang → vật liệu mới vẫn còn (localStorage)

### Admin — Tổng hợp vật liệu
- [ ] Tab "Tổng hợp vật liệu" hiện danh sách tất cả vật liệu
- [ ] Lọc theo dòng SP, nhóm màu, phân khúc, NCC, nguồn
- [ ] Badge "Admin" / "Có sẵn" đúng với từng vật liệu
- [ ] Nút "Chi tiết" → mở modal với đủ 3 luồng thông tin (NCC / MrFabric / Thiết kế)
- [ ] Nút "Sửa" → chỉ hiện với vật liệu Admin thêm, chuyển sang form edit
- [ ] Nút "Xóa" → chỉ hiện với vật liệu Admin thêm, xác nhận trước khi xóa

### Responsive / Tổng quát
- [ ] Mobile không vỡ layout
- [ ] Desktop hiển thị thoáng, grid rộng
- [ ] Không có lỗi console nghiêm trọng
