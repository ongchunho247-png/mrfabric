const KEY = 'mrfabric_library_views'
const CONFIG_VERSION = 3  // bump to reset old localStorage without phongCach / showPrice

export const ALL_FILTER_KEYS = [
  { key: 'tenDongSanPham', label: 'Dòng sản phẩm' },
  { key: 'nhaCungCap',     label: 'Nhà cung cấp' },
  { key: 'collection',     label: 'Tên cuốn mẫu' },
  { key: 'nhomMau',        label: 'Nhóm màu' },
  { key: 'toneMau',        label: 'Tone màu' },
  { key: 'beMat',          label: 'Bề mặt' },
  { key: 'khoVai',         label: 'Khổ' },
  { key: 'thanhPhan',      label: 'Thành phần' },
  { key: 'tieuChuan',      label: 'Tiêu chuẩn' },
  { key: 'phanKhuc',       label: 'Phân khúc' },
  { key: 'trangThai',      label: 'Trạng thái' },
  { key: 'congNang',       label: 'Công năng' },
  { key: 'ungDung',        label: 'Ứng dụng' },
  { key: 'phongCach',      label: 'Phong cách thiết kế' },
  { key: 'hashtag',        label: 'Hashtag' },
]

const ALL_KEYS = ALL_FILTER_KEYS.map((f) => f.key)

const DEFAULT_VIEWS = [
  {
    id: 'khach-hang',
    name: 'Khách hàng / KTS',
    visibleFilters: ['tenDongSanPham', 'nhomMau', 'beMat', 'congNang', 'ungDung', 'phanKhuc', 'phongCach'],
    showPrice: false,
  },
  {
    id: 'sale',
    name: 'Sale / Kinh doanh',
    visibleFilters: ['tenDongSanPham', 'nhaCungCap', 'collection', 'nhomMau', 'beMat', 'khoVai', 'thanhPhan', 'phanKhuc', 'trangThai', 'congNang', 'ungDung', 'phongCach', 'hashtag'],
    showPrice: true,
  },
  {
    id: 'all',
    name: 'Tất cả',
    visibleFilters: ALL_KEYS,
    showPrice: true,
  },
]

export const DEFAULT_CONFIG = { version: CONFIG_VERSION, activeViewId: 'all', views: DEFAULT_VIEWS }

export function loadLibraryViews() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_CONFIG
    const stored = JSON.parse(raw)
    // Version bump resets to defaults (ensures phongCach + showPrice present)
    if (!stored.version || stored.version < CONFIG_VERSION) {
      return DEFAULT_CONFIG
    }
    return stored
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveLibraryViews(config) {
  localStorage.setItem(KEY, JSON.stringify({ ...config, version: CONFIG_VERSION }))
}
