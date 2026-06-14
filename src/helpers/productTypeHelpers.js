// Mapping từ khóa "Dòng sản phẩm" → Mã type
// Thứ tự quan trọng: 'sáo nhôm' phải trước 'sáo gỗ' để tránh nhầm
export const PRODUCT_TYPE_RULES = [
  ['sáo nhôm', 'AL'],
  ['rèm vải',  'CUR'],
  ['rèm cuốn', 'BL'],
  ['sáo gỗ',   'WB'],
  ['roman',    'RM'],
  ['tổ ong',   'HN'],
  ['cầu vồng', 'CB'],
  ['trúc',     'BB'],
  ['sofa',     'FAB'],
]

export function detectProductType(dongSanPham) {
  if (!dongSanPham) return null
  const lower = dongSanPham.toLowerCase()
  for (const [keyword, code] of PRODUCT_TYPE_RULES) {
    if (lower.includes(keyword)) return code
  }
  return null
}

export const ALL_PRODUCT_TYPES = [
  { code: 'CUR', label: 'Rèm vải' },
  { code: 'FAB', label: 'Sofa / Vải bọc' },
  { code: 'BL',  label: 'Rèm cuốn' },
  { code: 'WB',  label: 'Sáo gỗ' },
  { code: 'AL',  label: 'Sáo nhôm' },
  { code: 'RM',  label: 'Roman' },
  { code: 'HN',  label: 'Tổ ong' },
  { code: 'CB',  label: 'Cầu vồng / Zebra' },
  { code: 'BB',  label: 'Trúc / Tre' },
]

// Template 4 slot theo từng type — slot 3 (Cầm nắm) và slot 5 (Không gian tổng thể) đã bỏ
// Active: 1=Bề mặt | 2=Cận chất liệu | 4=Không gian gần | 6=Ruler tỉ lệ
export const SLOT_TEMPLATES = {
  CUR: {
    name: 'Rèm vải Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Cận chất liệu' },
      { key: 'slot_4', label: 'Rèm gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  FAB: {
    name: 'Sofa / Vải bọc Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Cận chất liệu' },
      { key: 'slot_4', label: 'Sofa gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  CUR_FAB: {
    name: 'Rèm + Sofa (Hỗn hợp)',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Cận chất liệu' },
      { key: 'slot_4', label: 'Sofa gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  BL: {
    name: 'Rèm cuốn Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Cận chất liệu' },
      { key: 'slot_4', label: 'Rèm cuốn gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  WB: {
    name: 'Sáo gỗ Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vân gỗ' },
      { key: 'slot_2', label: 'Cận lá sáo' },
      { key: 'slot_4', label: 'Sáo gỗ gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  AL: {
    name: 'Sáo nhôm Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt nhôm' },
      { key: 'slot_2', label: 'Cận lá nhôm' },
      { key: 'slot_4', label: 'Sáo nhôm gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  RM: {
    name: 'Roman Blind Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Cận chất liệu' },
      { key: 'slot_4', label: 'Roman gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  HN: {
    name: 'Tổ ong Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt tổ ong' },
      { key: 'slot_2', label: 'Cận ô tổ ong' },
      { key: 'slot_4', label: 'Tổ ong gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  CB: {
    name: 'Cầu vồng / Zebra Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt cầu vồng' },
      { key: 'slot_2', label: 'Cận sọc vải' },
      { key: 'slot_4', label: 'Cầu vồng gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
  BB: {
    name: 'Trúc / Tre Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt trúc' },
      { key: 'slot_2', label: 'Cận thanh trúc' },
      { key: 'slot_4', label: 'Rèm trúc gần (~1m)' },
      { key: 'slot_6', label: 'Ruler tỉ lệ' },
    ],
  },
}

export function getSlotTemplate(typeCode, { useForSofa = false, useForCurtain = false } = {}) {
  if (!typeCode) return null
  if ((typeCode === 'CUR' && useForSofa) || (typeCode === 'FAB' && useForCurtain)) {
    return SLOT_TEMPLATES.CUR_FAB
  }
  return SLOT_TEMPLATES[typeCode] || null
}
