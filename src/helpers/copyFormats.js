import { COLOR_GROUPS, findColorEntry, findClosestColorEntry } from '../data/colorGroups'

function resolveColorName(item) {
  if (item.aiColorHex) {
    const closest = findClosestColorEntry(item.aiColorHex)
    if (closest) return closest.name_en
  }
  const entry = findColorEntry(item.nhomMau)
  return entry ? entry.name_en : (item.nhomMau || '—')
}

function joinArr(val) {
  if (!val) return ''
  return Array.isArray(val) ? val.join(', ') : val
}

export function formatForKTS(items) {
  const lines = ['MrFabric - Bộ mẫu vật liệu đề xuất', '']
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.maMrFabric}`)
    lines.push(`   Dòng sản phẩm: ${item.tenDongSanPham}`)
    lines.push(`   Trạng thái: ${item.moodboardStatus || 'Đề xuất chính'}`)
    lines.push(`   Nhóm màu: ${resolveColorName(item)}`)
    lines.push(`   Tone màu: ${item.toneMau}`)
    lines.push(`   Ứng dụng: ${joinArr(item.ungDung)}`)
    lines.push(`   Công năng: ${joinArr(item.congNang)}`)
    lines.push(`   Phân khúc: ${item.phanKhuc}`)
    lines.push(`   Khổ: ${item.khoVai}`)
    lines.push(`   Thành phần: ${item.thanhPhan}`)
    if (item.ghiChuTuVanKTS) {
      lines.push(`   Ghi chú: ${item.ghiChuTuVanKTS}`)
    }
    lines.push('')
  })
  return lines.join('\n').trim()
}

export function formatForSale(items) {
  const lines = ['Bộ mẫu tư vấn MrFabric', '']
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.maMrFabric}`)
    lines.push(`   Dòng sản phẩm: ${item.tenDongSanPham}`)
    lines.push(`   Trạng thái: ${item.moodboardStatus || 'Đề xuất chính'}`)
    lines.push(`   Màu: ${resolveColorName(item)} / ${item.toneMau}`)
    lines.push(`   Công năng: ${joinArr(item.congNang)}`)
    lines.push(`   Phân khúc: ${item.phanKhuc}`)
    if (item.ghiChuTuVanSale) {
      lines.push(`   Gợi ý tư vấn: ${item.ghiChuTuVanSale}`)
    }
    lines.push('')
  })
  return lines.join('\n').trim()
}

export function formatShortForClient(items) {
  const lines = [
    'Em gửi anh/chị một số mã màu MrFabric phù hợp để mình tham khảo:',
    '',
  ]
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.maMrFabric}`)
    lines.push(`   Dòng: ${item.tenDongSanPham.replace('MrFabric ', '')}`)
    if (item.ghiChuNganGuiKhach) {
      lines.push(`   ${item.ghiChuNganGuiKhach}`)
    }
    lines.push('')
  })
  lines.push('Mình nên xem mẫu thật tại công trình để kiểm tra màu theo ánh sáng thực tế.')
  return lines.join('\n').trim()
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
}

export function formatAsTable(items) {

  function statusLabel(s) {
    if (!s || s === 'Đề xuất chính') return '✓ Đề xuất chính'
    if (s === 'Phương án thay thế') return '⟳ Phương án thay thế'
    if (s === 'Cần kiểm tra mẫu thật') return '○ Cần kiểm mẫu thật'
    return s
  }

  const headers = ['#', 'Mã MrFabric', 'Dòng sản phẩm', 'Nhóm màu', 'Khổ', 'Thành phần', 'Trạng thái']

  const dataRows = items.map((item, i) => [
    String(i + 1),
    item.maMrFabric || '—',
    (item.tenDongSanPham || '—').replace(/^MrFabric\s+/, ''),
    resolveColorName(item),
    item.khoVai || '—',
    item.thanhPhan || '—',
    statusLabel(item.moodboardStatus),
  ])

  const allRows = [headers, ...dataRows]
  const widths = headers.map((_, ci) => Math.max(...allRows.map((row) => row[ci].length)))

  function pad(str, w) { return str + ' '.repeat(Math.max(0, w - str.length)) }
  function makeRow(cells) { return ' ' + cells.map((c, i) => pad(c, widths[i])).join(' │ ') + ' ' }
  function makeSep() { return widths.map((w) => '─'.repeat(w + 2)).join('┼') }

  const title = 'BẢNG VẬT LIỆU TƯ VẤN — MrFabric'
  return [
    title,
    '═'.repeat(title.length),
    '',
    makeRow(headers),
    makeSep(),
    ...dataRows.map((r) => makeRow(r)),
    '',
    `Tổng cộng: ${items.length} mã  ·  MrFabric`,
  ].join('\n')
}
