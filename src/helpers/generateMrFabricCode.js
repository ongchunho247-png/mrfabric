// Format mã MrFabric: MC-{NCC}-{TYPE}{CAT3}{PAGE3}
// NCC  = mã nội bộ NCC (VD: ORION, LEO)
// TYPE = viết tắt dòng sản phẩm (VD: CUR, BL, WB…) — rỗng nếu không xác định
// CAT3 = số cuốn mẫu 3 chữ số; PAGE3 = số trang 3 chữ số

import { getNccCode } from './nccCodeStorage'

function padNum(val, len) {
  if (!val) return '0'.repeat(len)
  const n = parseInt(val, 10)
  if (!isNaN(n)) return String(n).padStart(len, '0')
  return String(val).toUpperCase().replace(/[^A-Z0-9]/g, '').padStart(len, '0').slice(-len)
}

const PRODUCT_TYPE_RULES = [
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

export function getProductTypeCode(productLineName) {
  if (!productLineName) return ''
  const lower = productLineName.toLowerCase()
  for (const [keyword, code] of PRODUCT_TYPE_RULES) {
    if (lower.includes(keyword)) return code
  }
  return ''
}

export function generateMrFabricCode(allMaterials, { nhaCungCap, nccCodes, catalogueNum, soTrang, productLineName }) {
  const nccCode = getNccCode(nccCodes, nhaCungCap) || 'XX'
  const typeCode = getProductTypeCode(productLineName)
  const catCode = padNum(catalogueNum, 3)
  const pageCode = padNum(soTrang, 3)

  const candidate = `MC-${nccCode}-${typeCode}${catCode}${pageCode}`

  const exists = allMaterials.some((m) => m.maMrFabric === candidate)
  if (exists) {
    const suffix = Date.now().toString().slice(-3)
    return `${candidate}-${suffix}`
  }

  return candidate
}
