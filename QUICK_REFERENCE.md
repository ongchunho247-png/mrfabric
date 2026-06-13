# Quick Reference - MrFabric Implementation

## 🎯 Mục Tiêu Chính
Tự động tạo vật liệu từ bảng đơn giá + Quản lý ẩn/hiện vật liệu

---

## 📋 Checklist Triển Khai

### **✅ Code Hoàn Thành**
- [x] Tạo vật liệu từ bảng giá (nút ➕)
- [x] Ẩn/hiện từng vật liệu
- [x] Ẩn/hiện theo nhóm
- [x] Filter vật liệu bị ẩn ở Thư viện
- [x] UI Quản lý ẩn/hiện
- [x] Styling hoàn chỉnh

### **⏳ Cần Làm (Tuỳ chọn)**
- [ ] Thêm notification khi ẩn/hiện
- [ ] Export danh sách ẩn/nhóm ẩn
- [ ] Batch operations (ẩn nhiều cùng lúc)
- [ ] Trạng thái "Ngừng kinh doanh" riêng
- [ ] Analytics: vật liệu active vs ẩn

---

## 🔧 Quick Commands

### **Clear Storage (Nếu cần reset)**
```javascript
// F12 → Console
localStorage.removeItem('mrfabric_hidden_items')
localStorage.removeItem('mrfabric_hidden_groups')
location.reload()
```

### **Check Hidden Status**
```javascript
console.log('Hidden items:', localStorage.getItem('mrfabric_hidden_items'))
console.log('Hidden groups:', localStorage.getItem('mrfabric_hidden_groups'))
```

---

## 📂 File Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminPage.jsx ✏️ (updated)
│   │   ├── PriceTableManager.jsx ✏️ (updated)
│   │   ├── PriceTableManager.css ✏️ (updated)
│   │   ├── VisibilityManager.jsx ✨ (new)
│   │   └── VisibilityManager.css ✨ (new)
│   └── library/
│       └── LibraryPage.jsx ✏️ (updated)
├── helpers/
│   └── materialVisibilityStorage.js ✨ (new)
└── ...
```

---

## 🌐 User Flows

### **Flow 1: Tạo Vật Liệu Nhanh**
```
Admin Tab "Bảng đơn giá" 
  → Thêm dòng dữ liệu (NCC, mã NCC, giá, v.v.)
  → Click "➕ Tạo vật liệu"
  → Form auto-fill
  → Upload ảnh
  → Click "Lưu vật liệu" ✅
```

### **Flow 2: Ẩn Từng Vật Liệu**
```
Admin Tab "🚫 Ẩn/Hiện" 
  → Tab "📌 Ẩn Từng Vật liệu"
  → Tìm kiếm vật liệu
  → Click toggle "👁" → "🚫" ✅
  → Vật liệu biến mất khỏi Thư viện ✅
```

### **Flow 3: Ẩn Theo Nhóm**
```
Admin Tab "🚫 Ẩn/Hiện"
  → Tab "🏷 Ẩn Theo Nhóm"
  → Chọn nhóm
  → Click toggle "👁" → "🚫" ✅
  → Tất cả vật liệu trong nhóm ẩn ✅
```

---

## 🎨 UI Components

### **Button Styles**
```css
.ptm-create {      /* Nút "➕ Tạo vật liệu" */
  border-color: #2d8a4e;
  color: #2d8a4e;
}

.vis-btn--hidden { /* Nút "🚫 Đã ẩn" */
  border-color: #c0392b;
  background: #fbeae8;
}
```

### **Colors**
- Success (Hiển thị): `#2d8a4e` (xanh)
- Danger (Ẩn): `#c0392b` (đỏ)
- Warning (Nhóm ẩn): `#856404` (vàng)

---

## 🧪 Test Cases

| Test | Expected | Status |
|------|----------|--------|
| Click "➕" → form auto-fill | Dữ liệu điền đầy đủ | ✅ |
| Upload ảnh → Lưu | Vật liệu xuất hiện | ✅ |
| Ẩn vật liệu → Thư viện | Vật liệu biến mất | ✅ |
| Hiện lại → Thư viện | Vật liệu xuất hiện | ✅ |
| Ẩn nhóm → Các vật liệu | Tất cả ẩn | ✅ |
| Tìm kiếm ở Ẩn/Hiện | Filter hoạt động | ✅ |

---

## 📞 Support

**Nếu có lỗi:**
1. Kiểm tra browser console (F12)
2. Clear localStorage: `localStorage.clear()`
3. Reload page
4. Check network requests

**Common Issues:**
- "Vật liệu không xuất hiện" → Check storage keys
- "UI không update" → Check state management
- "Ẩn không hoạt động" → Verify material ID matching

---

**Version:** 1.0
**Last Updated:** 2026-06-13
**Status:** 🟢 Production Ready
