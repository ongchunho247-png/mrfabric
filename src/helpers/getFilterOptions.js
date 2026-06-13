import { COLOR_GROUPS } from '../data/colorGroups'

const FILTER_KEYS = [
  { key: 'tenDongSanPham', label: 'Dòng sản phẩm' },
  { key: 'nhaCungCap', label: 'Nhà cung cấp' },
  { key: 'collection', label: 'Tên cuốn mẫu' },
  { key: 'nhomMau', label: 'Nhóm màu' },
  { key: 'toneMau', label: 'Tone màu' },
  { key: 'beMat', label: 'Bề mặt' },
  { key: 'khoVai', label: 'Khổ' },
  { key: 'thanhPhan', label: 'Thành phần' },
  { key: 'tieuChuan', label: 'Tiêu chuẩn' },
  { key: 'phanKhuc', label: 'Phân khúc' },
  { key: 'trangThai', label: 'Trạng thái' },
  { key: 'congNang', label: 'Dòng sản phẩm' },
  { key: 'ungDung', label: 'Ứng dụng' },
  { key: 'phongCach', label: 'Phong cách thiết kế' },
]

export function getFilterGroups(materials) {
  const groups = []
  for (const { key, label } of FILTER_KEYS) {
    const optionSet = new Set()
    for (const m of materials) {
      const val = m[key]
      if (key === 'nhomMau') {
        if (val) {
          const entry = COLOR_GROUPS.find((c) => c.code === val)
          optionSet.add(entry ? entry.name_en : val)
        }
      } else if (Array.isArray(val)) {
        val.forEach((v) => optionSet.add(v))
      } else if (val) {
        optionSet.add(val)
      }
    }
    if (optionSet.size > 0) {
      groups.push({ key, label, options: Array.from(optionSet).sort() })
    }
  }
  return groups
}
