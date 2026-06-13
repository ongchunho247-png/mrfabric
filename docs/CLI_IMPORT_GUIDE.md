# MrFabric Import Guide

Hướng dẫn nhập dữ liệu vào thư viện MrFabric: nhập từ bảng tính (Excel/Sheets) và nhập hàng loạt ảnh qua CLI.

---

## 📊 Nhập từ bảng tính (Excel / Google Sheets)

### Thứ tự cột

Cả hai luồng (nhập trong tab NCC và nhập hàng loạt toàn bộ) dùng cùng 14 cột, cách nhau bằng Tab:

| # | Cột | Trường | Ghi chú |
|---|-----|--------|---------|
| 1 | Tên NCC | nhaCungCap | Bỏ qua khi dán trong tab NCC cụ thể |
| 2 | Cuốn mẫu | tenCuon | Tên cuốn mẫu / collection |
| 3 | Mã NCC | maNCC | **Bắt buộc** — hàng thiếu mã này bị bỏ qua |
| 4 | Dòng sản phẩm | congNang | VD: Rèm vải, Vải bọc |
| 5 | Nhóm màu | nhomMau | Tên tiếng Anh/Việt hoặc mã 2 ký tự (VD: BG) |
| 6 | Thành phần | thanhPhan | VD: 100% Polyester |
| 7 | Bề mặt | beMat | VD: Plain, Jacquard, Velvet |
| 8 | Khổ | khoVai | VD: 280cm |
| 9 | Số cuốn mẫu | catalogue | Số thứ tự cuốn mẫu |
| 10 | Số trang | soTrang | Số trang trong cuốn |
| 11 | Giá mua | giaMua | VD: 150.000 |
| 12 | Giá bán vải | giaBanVai | Để trống nếu chưa có |
| 13 | Giá bán rèm | giaBanRem | Để trống nếu chưa có |
| 14 | Nhóm biến thể | nhomVatLieu | VD: GR-001 |

### Quy tắc nhập
- Cột trống **không ghi đè** dữ liệu đã có — chỉ điền vào trường còn trống
- Cột 3 (Mã NCC) bắt buộc — hàng không có mã NCC bị bỏ qua hoàn toàn
- Cột 5 (Nhóm màu) tự động đối chiếu sang mã màu 2 ký tự nội bộ
- Giá mua / Giá bán tự động format số có dấu chấm phân cách nghìn

### Ví dụ hàng Excel

```
Acacia	Spring 2024	A15-8	Rèm vải	Beige	100% Polyester	Plain	280cm	5	15	150.000		 	GR-001
```

### Cách dán

**Nhập trong tab NCC cụ thể** (cột 1 "Tên NCC" được bỏ qua):
1. Mở bảng đơn giá → Accordion NCC cần nhập
2. Nhấn **+ Thêm mục**
3. Dán dữ liệu Tab-separated → **✓ Thêm**

**Nhập hàng loạt toàn bộ** (nhiều NCC cùng lúc):
1. Mở bảng đơn giá → **▼ Nhập hàng loạt từ bảng tính**
2. Dán dữ liệu → **Nhập dữ liệu**

---

## 🖼️ MrFabric Batch Image Importer CLI

Công cụ dòng lệnh để import hàng loạt ảnh vật liệu vải vào thư viện MrFabric.

## ⚡ Quick Start

### **1. Chuẩn bị ảnh**
Đặt tên file theo mã NCC (Supplier Code):
```
KC-03.jpg       ← Match maNCC = "KC-03"
A15-8.jpg       ← Match maNCC = "A15-8"
B112.png        ← Match maNCC = "B112"
```

### **2. Chạy CLI**

**Option A: Dùng npm script**
```bash
npm run import:batch ./images --preview
npm run import:batch ./images --save
```

**Option B: Dùng Node.js trực tiếp**
```bash
node scripts/batchImport.js ./images --preview
node scripts/batchImport.js ./images --save
```

**Option C: Dùng standalone executable (Linux/Mac)**
```bash
chmod +x ./mr-fabric-import
./mr-fabric-import ./images --preview
```

### **3. Xem preview**
```bash
npm run import:batch ./images --preview
```
Output:
```
🖼️  MrFabric Batch Image Importer
═════════════════════════════════════════════

📦 Đã tải 156 sản phẩm từ thư viện

📁 Tìm thấy 10 ảnh:

  ✅ KC-03.jpg
     Mã: KC-03 | NCC: Duni | MrFabric: MF-2025-DUNI-001
  ✅ KC-04.jpg
     Mã: KC-04 | NCC: Duni | MrFabric: MF-2025-DUNI-002
  ✅ A15-8.jpg
     Mã: A15-8 | NCC: Daewoo | MrFabric: MF-2025-DAEWOO-005
  ❌ NEW-01.jpg
     Không tìm mã - Không match

═════════════════════════════════════════════
✅ Match thành công: 3/10
❌ Match thất bại: 7/10

💾 Kết quả đã lưu: import-results-1718192400000.json
```

### **4. Xác nhận & Import**
```bash
npm run import:batch ./images --preview
# Sẽ hỏi: "Tiếp tục import? (y/n): "
# Gõ: y
# ✅ Hoàn tất!
```

---

## 📋 Chi tiết Command

### **Preview Mode** (Khuyến nghị)
```bash
npm run import:batch ./path/to/images --preview
```
- ✅ Xem trước kết quả match
- ✅ Hiển thị dữ liệu sẽ được import
- ⚠️ Hỏi xác nhận trước import
- ✅ Tạo file JSON backup

**Output:**
- `import-results-{timestamp}.json` - Danh sách sản phẩm match

### **Save Mode** (Direct Import)
```bash
npm run import:batch ./path/to/images --save
```
- ⚡ Import trực tiếp không hỏi
- ✅ Tự động lưu vào localStorage
- ⚠️ Không thể undo

---

## 🎯 Tên File Hợp Lệ

### ✅ **Format được hỗ trợ**

| Tên File | Kết quả |
|----------|---------|
| `KC-03.jpg` | ✅ Match maNCC = KC-03 |
| `A15-8.jpg` | ✅ Match maNCC = A15-8 |
| `B112.png` | ✅ Match maNCC = B112 |
| `KC-03_RED.jpg` | ✅ Match maNCC = KC-03 (bỏ phần `_RED`) |
| `A15-8_color.jpg` | ✅ Match maNCC = A15-8 (bỏ phần `_color`) |

### ❌ **Format không hỗ trợ**

| Tên File | Kết quả |
|----------|---------|
| `anh_san_pham.jpg` | ❌ Không tìm mã → Manual input |
| `fabric_new.png` | ❌ Không theo format → Manual input |
| `IMG_2025_03_12.jpg` | ❌ Không có mã NCC → Manual input |

---

## 📊 Kết Quả Import

### **JSON Output Format**
File `import-results-{timestamp}.json`:

```json
{
  "timestamp": "2025-06-12T10:30:00.000Z",
  "sourceFolder": "./images",
  "totalImages": 10,
  "successCount": 3,
  "results": [
    {
      "filename": "KC-03.jpg",
      "maNCC": "KC-03",
      "nhaCungCap": "Duni",
      "maMrFabric": "MF-2025-DUNI-001",
      "collection": "Spring-2025"
    },
    {
      "filename": "KC-04.jpg",
      "maNCC": "KC-04",
      "nhaCungCap": "Duni",
      "maMrFabric": "MF-2025-DUNI-002",
      "collection": "Spring-2025"
    }
  ]
}
```

---

## 🔧 Advanced Usage

### **Batch import từ Multiple Folders**

```bash
# Import từ folder 1
npm run import:batch ./images/duni --preview

# Import từ folder 2
npm run import:batch ./images/daewoo --preview

# Import từ folder 3
npm run import:batch ./images/new --preview
```

### **Dry-run (Test không lưu)**

```bash
# Xem kết quả mà không lưu
npm run import:batch ./images --preview
# Chọn "n" khi được hỏi
```

### **Rename ảnh batch (Windows PowerShell)**

Đổi tên nhiều file cùng lúc:

```powershell
# Rename IMG_001.jpg → KC-03.jpg, IMG_002.jpg → KC-04.jpg
$images = Get-ChildItem *.jpg
$codes = @('KC-03', 'KC-04', 'KC-05')
for ($i = 0; $i -lt $images.Count; $i++) {
  Rename-Item $images[$i] "$($codes[$i]).jpg"
}
```

### **Rename batch (Linux/Mac)**

```bash
# Rename multiple files
for i in *.jpg; do mv "$i" "NEW_${i}"; done

# Batch rename với loop
i=1
for file in *.jpg; do
  mv "$file" "KC-$(printf "%02d" $i).jpg"
  ((i++))
done
```

---

## ⚠️ Lỗi & Giải Pháp

### **Lỗi 1: Không tìm thấy ảnh**
```
❌ Không tìm thấy ảnh nào trong: ./images
```
**Giải pháp:**
```bash
# Kiểm tra đường dẫn folder
ls ./images
# Hoặc dùng đường dẫn tuyệt đối
npm run import:batch /Users/user/Downloads/images
```

### **Lỗi 2: Không match sản phẩm**
```
❌ Match thất bại: 7/10
```
**Giải pháp:**
- Kiểm tra tên file có chứa maNCC không
- Kiểm tra maNCC có đúng trong thư viện không
- Sử dụng app UI để import thủ công với dữ liệu OCR

### **Lỗi 3: Permission denied (Mac/Linux)**
```
./mr-fabric-import: permission denied
```
**Giải pháp:**
```bash
chmod +x ./mr-fabric-import
./mr-fabric-import ./images
```

---

## 💡 Tips & Tricks

### **Tip 1: Tạo folder organized**
```
images/
├─ duni/
│  ├─ KC-03.jpg
│  ├─ KC-04.jpg
├─ daewoo/
│  ├─ A15-8.jpg
│  ├─ A15-9.jpg
```

### **Tip 2: Validate trước import**
```bash
# Chạy preview 3 lần
npm run import:batch ./images --preview  # Lần 1
# Chỉnh sửa tên file nếu cần
npm run import:batch ./images --preview  # Lần 2
# Xác nhận & import
npm run import:batch ./images --save
```

### **Tip 3: Auto-rename từ collection**
```bash
# Extract mã từ ảnh metadata (requires ExifTool)
exiftool -Filename="$(exiftool -s -s -s -ImageDescription '%d-%f') -%-c.%e" *.jpg
```

---

## 🔄 Integration với App

CLI tool tự động:
1. ✅ Đọc ảnh từ folder
2. ✅ Match với maNCC từ filename
3. ✅ Tìm material trong app data
4. ✅ Xuất JSON kết quả
5. ✅ (Optional) Import vào localStorage

Khi dùng `--save`:
- Dữ liệu được lưu vào localStorage (giống như upload qua UI)
- Có thể refresh app để thấy dữ liệu mới
- Có thể export/backup qua UI

---

## 📚 Tài liệu thêm

- [SmartImageUploader Guide](../docs/SMART_UPLOADER.md)
- [Material Format Reference](../docs/MATERIAL_FORMAT.md)
- [Admin Panel Guide](../docs/ADMIN_PANEL.md)

---

## ❓ FAQ

**Q: Có thể import mà không qua terminal không?**
```
A: Dùng UI của app! Vào Admin Panel → Upload từng ảnh hoặc batch.
   SmartImageUploader sẽ tự động match theo tên file.
```

**Q: Có thể undo import không?**
```
A: Không trực tiếp. Nhưng có thể:
   1. Vào "Thư viện tổng hợp" tab
   2. Tìm sản phẩm vừa import
   3. Chỉnh sửa hoặc xóa (soft delete)
```

**Q: CLI có hỗ trợ Windows không?**
```
A: Có! Dùng:
   - PowerShell: npm run import:batch ./images --preview
   - Git Bash: npm run import:batch ./images --preview
   - WSL: npm run import:batch ./images --preview
```

---

## 🚀 Next Steps

1. ✅ Đặt tên file theo maNCC
2. ✅ Chạy preview để test
3. ✅ Import khi chắc chắn
4. ✅ Kiểm tra dữ liệu trong app
5. ✅ Chỉnh sửa giá/thông tin nếu cần

Happy importing! 🎉
