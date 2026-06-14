import { useState, useMemo } from 'react'
import { addPriceEntry, updatePriceEntry } from '../../helpers/priceTableStorage'
import { getProductTypeCode } from '../../helpers/generateMrFabricCode'
import { COLOR_GROUPS, findColorEntry } from '../../data/colorGroups'
import { getVariantHex } from '../../helpers/colorDictStorage'
import './PriceTableManager.css'

const CONSTELLATION_CODES = [
  { code: 'ORION', name: 'Orion — Thợ Săn' },
  { code: 'ARIES', name: 'Aries — Bạch Dương' },
  { code: 'TAURUS', name: 'Taurus — Kim Ngưu' },
  { code: 'GEMINI', name: 'Gemini — Song Tử' },
  { code: 'CANCER', name: 'Cancer — Cự Giải' },
  { code: 'LEO', name: 'Leo — Sư Tử' },
  { code: 'VIRGO', name: 'Virgo — Xử Nữ' },
  { code: 'LIBRA', name: 'Libra — Thiên Bình' },
  { code: 'SCORPIO', name: 'Scorpio — Thiên Yết' },
  { code: 'SAGITTARIUS', name: 'Sagittarius — Nhân Mã' },
  { code: 'CAPRICORN', name: 'Capricorn — Ma Kết' },
  { code: 'AQUARIUS', name: 'Aquarius — Bảo Bình' },
  { code: 'PISCES', name: 'Pisces — Song Ngư' },
  { code: 'CYGNUS', name: 'Cygnus — Thiên Nga' },
  { code: 'LYRA', name: 'Lyra — Đàn Cầm' },
  { code: 'AQUILA', name: 'Aquila — Đại Bàng' },
  { code: 'URSA', name: 'Ursa Major — Đại Hùng' },
  { code: 'CASSIOPEIA', name: 'Cassiopeia — Tiên Hậu' },
  { code: 'PERSEUS', name: 'Perseus — Anh Hùng' },
  { code: 'ANDROMEDA', name: 'Andromeda — Tiên Nữ' },
  { code: 'CENTAURUS', name: 'Centaurus — Nhân Mã Nam' },
  { code: 'CRUX', name: 'Crux — Nam Thập Tự' },
  { code: 'PEGASUS', name: 'Pegasus — Phi Mã' },
  { code: 'HERCULES', name: 'Hercules — Anh Hùng Hercules' },
  { code: 'DRACO', name: 'Draco — Thần Long' },
  { code: 'BOOTES', name: 'Boötes — Chăn Bò' },
]

function formatPrice(raw) {
  const digits = String(raw || '').replace(/\./g, '').replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function calcSellPrice(giaMua) {
  const digits = String(giaMua || '').replace(/\./g, '').replace(/\D/g, '')
  if (!digits) return '—'
  return Math.round(parseInt(digits, 10) * 2.5).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const COLOR_VI_EN = [
  ['trắng kem', 'Cream White'], ['trắng sữa', 'Milk White'], ['trắng ngà', 'Ivory White'],
  ['xám tro', 'Ash Gray'], ['xám nhạt', 'Light Gray'], ['xám đậm', 'Dark Gray'],
  ['nâu sáng', 'Light Brown'], ['nâu đỏ', 'Reddish Brown'],
  ['xanh lá', 'Green'], ['xanh dương', 'Blue'], ['xanh nhạt', 'Light Blue'], ['xanh đậm', 'Dark Blue'],
  ['vàng kem', 'Warm Cream'], ['vàng nhạt', 'Pale Yellow'], ['vàng đồng', 'Bronze'],
  ['hồng nhạt', 'Blush Pink'], ['hồng đậm', 'Deep Pink'],
  ['trắng', 'White'], ['đen', 'Black'], ['xám', 'Gray'], ['nâu', 'Brown'],
  ['đỏ', 'Red'], ['xanh', 'Blue'], ['vàng', 'Yellow'], ['hồng', 'Pink'],
  ['kem', 'Cream'], ['be', 'Beige'], ['cam', 'Orange'], ['tím', 'Purple'], ['bạc', 'Silver'],
]

function translateColor(name) {
  if (!name) return ''
  const lower = name.toLowerCase().trim()
  for (const [vi, en] of COLOR_VI_EN) {
    if (lower === vi || lower.startsWith(vi + ' ') || lower.endsWith(' ' + vi) || lower.includes(' ' + vi + ' ') || lower.includes(vi)) {
      return en
    }
  }
  return name
}

function resolveColorCode(input) {
  if (!input) return ''
  const lower = input.trim().toLowerCase()
  const byCode = COLOR_GROUPS.find((c) => c.code.toLowerCase() === lower)
  if (byCode) return byCode.code
  const byName = COLOR_GROUPS.find(
    (c) => c.name_en.toLowerCase() === lower || c.name_vi.toLowerCase() === lower,
  )
  return byName ? byName.code : input.trim()
}

function buildCodePreview(nccCode, catalogue, soTrang, dongSanPham) {
  if (!nccCode) return null
  const typeCode = getProductTypeCode(dongSanPham)
  const cat = String(catalogue || '').replace(/\D/g, '').padStart(3, '0')
  const page = String(soTrang || '').replace(/\D/g, '').padStart(3, '0')
  if (cat === '000' && page === '000') return null
  return `MC-${nccCode}-${typeCode}${cat}${page}`
}

function buildCollectionCode(nccCode, catalogue) {
  if (!nccCode || !catalogue) return null
  const cat = String(catalogue || '').replace(/\D/g, '').padStart(3, '0')
  if (cat === '000') return null
  return `MC-${nccCode}-${cat}`
}

// ── Per-NCC accordion section ─────────────────────────────────────────────────

function NccPriceSection({ nccName, nccCode, nccCodes, entries, priceTable, onUpdate, onUpdateNcc, onDeleteNcc, allMaterials, productLinesList, onSetVariantGroup, onUpdateMaterialByMaNCC, onUploadEntry, onRemoveByMaNCC }) {
  const [open, setOpen] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [addText, setAddText] = useState('')
  const [editId, setEditId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [editingCode, setEditingCode] = useState(false)
  const [draftCode, setDraftCode] = useState('')
  const [editVariantId, setEditVariantId] = useState(null)
  const [editVariantVal, setEditVariantVal] = useState('')
  const [actionStatus, setActionStatus] = useState({})
  const [openCollections, setOpenCollections] = useState({})

  const collectionGroups = useMemo(() => {
    const map = {}
    for (const e of entries) {
      const key = e.tenCuon || '(Chưa có cuốn mẫu)'
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'vi'))
  }, [entries])

  function toggleCollection(key) {
    setOpenCollections((p) => ({ ...p, [key]: !p[key] }))
  }

  function handleUploadCollection(colEntries) {
    colEntries.forEach((e) => {
      if (!e.maNCC || isInLibrary(e.maNCC)) return
      const mat = getMaterialInfo(e.maNCC, e)
      const preview = buildCodePreview(nccCode, e.catalogue, e.soTrang, e.dongSanPham || mat?.dongSanPham)
      doUpload({ ...e, _previewCode: preview })
    })
  }

  function isInLibrary(maNCC) {
    const q = (maNCC || '').trim().toLowerCase()
    return (allMaterials || []).some((m) => !m.deletedAt && (m.maNCC || '').trim().toLowerCase() === q)
  }

  function doUpload(entry) {
    onUploadEntry?.(entry)
    setActionStatus((prev) => ({ ...prev, [entry.maNCC]: 'uploaded' }))
    setTimeout(() => setActionStatus((prev) => { const n = { ...prev }; delete n[entry.maNCC]; return n }), 3000)
  }

  function doRemove(maNCC) {
    onRemoveByMaNCC?.(maNCC)
    setActionStatus((prev) => ({ ...prev, [maNCC]: 'removed' }))
    setTimeout(() => setActionStatus((prev) => { const n = { ...prev }; delete n[maNCC]; return n }), 3000)
  }

  function handleUploadAll() {
    entries.forEach((e) => {
      if (!e.maNCC || isInLibrary(e.maNCC)) return
      const mat = getMaterialInfo(e.maNCC, e)
      const preview = buildCodePreview(nccCode, e.catalogue, e.soTrang, e.dongSanPham || mat?.dongSanPham)
      doUpload({ ...e, _previewCode: preview })
    })
  }

  function getMaterialInfo(maNCC, entry = null) {
    function beMatStr(val) {
      return Array.isArray(val) ? val.join(', ') : (val || '')
    }
    function fromEntry(e) {
      if (!e) return null
      const cg = e.dongSanPham || (Array.isArray(e.congNang) ? e.congNang.join(', ') : (e.congNang || ''))
      const ce = findColorEntry(e.nhomMau)
      return {
        dongSanPham: cg,
        mauSac: ce ? ce.name_en : (e.nhomMau || ''),
        thanhPhan: e.thanhPhan || '',
        beMat: beMatStr(e.beMat),
        khoVai: e.khoVai || '',
        nhomVatLieu: e.nhomVatLieu || '',
      }
    }

    if (!maNCC) return fromEntry(entry)
    const key = maNCC.trim().toLowerCase()
    const matches = (allMaterials || []).filter((m) => (m.maNCC || '').trim().toLowerCase() === key)
    if (!matches.length) return fromEntry(entry)
    const first = matches[0]
    const congNangStr = Array.isArray(first.congNang) ? first.congNang.join(', ') : (first.congNang || '')
    const colorEntry = findColorEntry(first.nhomMau)
    const colorName = colorEntry ? colorEntry.name_en : (first.nhomMau || '')
    return {
      dongSanPham: congNangStr || fromEntry(entry)?.dongSanPham || '',
      mauSac: matches.length > 1 ? `${matches.length} màu` : colorName,
      thanhPhan: first.thanhPhan || entry?.thanhPhan || '',
      beMat: beMatStr(first.beMat) || fromEntry(entry)?.beMat || '',
      khoVai: first.khoVai || entry?.khoVai || '',
      nhomVatLieu: first.nhomVatLieu || entry?.nhomVatLieu || '',
    }
  }

  function handleStartCodeEdit(e) {
    e.stopPropagation()
    setDraftCode(nccCode || '')
    setEditingCode(true)
  }

  function handleSaveCode(e) {
    e && e.stopPropagation()
    const c = draftCode.trim().toUpperCase()
    if (c.length >= 2 && onUpdateNcc) onUpdateNcc(nccName, c)
    setEditingCode(false)
  }

  function handleDeleteNcc(ev) {
    ev.stopPropagation()
    const activeCount = priceTable.filter((e) => e.nhaCungCap === nccName && !e.deletedAt).length
    const msg = activeCount > 0
      ? `Chuyển ${activeCount} mục của NCC "${nccName}" vào thùng rác?`
      : `Xóa NCC "${nccName}"?`
    if (!window.confirm(msg)) return
    const now = new Date().toISOString()
    onUpdate(priceTable.map((e) => e.nhaCungCap === nccName && !e.deletedAt ? { ...e, deletedAt: now } : e))
    onDeleteNcc && onDeleteNcc(nccName)
  }

  function handleDeleteCollection(colName, count) {
    if (!window.confirm(`Chuyển ${count} mục trong cuốn mẫu "${colName}" vào thùng rác?`)) return
    const now = new Date().toISOString()
    onUpdate(priceTable.map((e) =>
      (e.nhaCungCap === nccName && (e.tenCuon || '(Chưa có cuốn mẫu)') === colName && !e.deletedAt)
        ? { ...e, deletedAt: now }
        : e
    ))
  }

  function handleDeleteEntry(id) {
    if (!window.confirm('Chuyển mục này vào thùng rác?')) return
    const now = new Date().toISOString()
    onUpdate(priceTable.map((e) => e.id === id ? { ...e, deletedAt: now } : e))
  }

  // Column order: Số trang | Phân khúc | Tên NCC (ignored) | Tên cuốn mẫu NCC | Mã NCC |
  //               Dòng SP | Thành phần | Nhóm màu | Bề mặt | Khổ | Giá mua | Giá bán vải | Giá bán rèm | Nhóm biến thể | Số cuốn MrFabric
  function handleAddFromPaste() {
    const lines = addText.trim().split(/\r?\n/).filter((l) => l.trim())
    if (lines.length === 0) return
    let next = [...priceTable]
    const matUpdates = []
    for (const line of lines) {
      const cols = line.split('\t').map((c) => c.trim())
      // col 0: Số trang, col 1: Phân khúc, col 2: Tên NCC (ignored — section knows nhaCungCap)
      // col 3: Tên cuốn mẫu NCC, col 4: Mã NCC, col 5: Dòng SP, col 6: Thành phần,
      // col 7: Nhóm màu, col 8: Bề mặt, col 9: Khổ, col 10: Giá mua, col 11: Giá bán vải,
      // col 12: Giá bán rèm, col 13: Nhóm biến thể, col 14: Số cuốn MrFabric
      const maNCC = cols[4] || ''
      if (!maNCC) continue
      const matFields = {}
      if (cols[5]) matFields.dongSanPham = cols[5]
      if (cols[6]) matFields.thanhPhan = cols[6]
      if (cols[7]) matFields.nhomMau = resolveColorCode(cols[7])
      if (cols[8]) matFields.beMat = cols[8]
      if (cols[9]) matFields.khoVai = cols[9]
      if (cols[13]) matFields.nhomVatLieu = cols[13]
      next = addPriceEntry(next, {
        nhaCungCap: nccName,
        soTrang: cols[0] || '',
        phanKhuc: cols[1] || '',
        tenCuon: cols[3] || '',
        maNCC,
        catalogue: cols[14] || '',
        giaMua: formatPrice(cols[10] || ''),
        giaBanVai: formatPrice(cols[11] || ''),
        giaBanRem: formatPrice(cols[12] || ''),
        ...matFields,
      })
      if (Object.keys(matFields).length) matUpdates.push({ maNCC, matUpdate: matFields })
    }
    onUpdate(next)
    matUpdates.forEach(({ maNCC, matUpdate }) => onUpdateMaterialByMaNCC?.(maNCC, matUpdate))
    setAddText('')
    setAddMode(false)
  }

  function handleStartEdit(entry) {
    setEditId(entry.id)
    setEditDraft({ ...entry })
    setAddMode(false)
  }

  function handleSaveEdit() {
    if (!editDraft.maNCC?.trim()) return
    const saved = { ...editDraft, giaMua: formatPrice(editDraft.giaMua) }
    onUpdate(updatePriceEntry(priceTable, editId, saved))

    // Sync to library if a matching material exists
    if (isInLibrary(editDraft.maNCC) && onUpdateMaterialByMaNCC) {
      const matUpdates = {
        collection: saved.tenCuon || '',
        catalogueNum: saved.catalogue || '',
        soTrang: saved.soTrang || '',
        giaMua: saved.giaMua || '',
        giaBan: saved.giaBanVai || '',
        giaBanRem: saved.giaBanRem || '',
        thanhPhan: saved.thanhPhan || '',
        khoVai: saved.khoVai || '',
        nhomVatLieu: saved.nhomVatLieu || '',
        nhomMau: saved.nhomMau || '',
        beMat: saved.beMat
          ? (Array.isArray(saved.beMat) ? saved.beMat : [saved.beMat])
          : [],
      }
      if (saved.dongSanPham) matUpdates.tenDongSanPham = saved.dongSanPham
      onUpdateMaterialByMaNCC(editDraft.maNCC, matUpdates)
    }

    setEditId(null)
    setEditDraft({})
  }

  function handleCancelEdit() { setEditId(null); setEditDraft({}) }

  return (
    <div className={`ptm-ncc-card${open ? ' ptm-ncc-card--open' : ''}`}>
      <div className="ptm-ncc-head" onClick={() => setOpen((v) => !v)}>
        <span className="ptm-ncc-arrow">{open ? '▼' : '▶'}</span>
        <span className="ptm-ncc-name">{nccName}</span>

        {editingCode ? (
          <div className="ptm-ncc-code-edit" onClick={(e) => e.stopPropagation()}>
            <input
              className="form-input ptm-ncc-code-input"
              value={draftCode}
              onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCode(e); if (e.key === 'Escape') setEditingCode(false) }}
              maxLength={12}
              autoFocus
              placeholder="VD: ORION"
            />
            <button className="ptm-ok" onClick={handleSaveCode}>✓</button>
            <button className="ptm-del" onClick={(e) => { e.stopPropagation(); setEditingCode(false) }}>✕</button>
          </div>
        ) : (
          <button
            className={`ptm-ncc-code-badge${!nccCode ? ' ptm-ncc-code-badge--empty' : ''}`}
            onClick={handleStartCodeEdit}
            title="Mã nội bộ — click để sửa"
          >
            {nccCode || '+ Mã'}
          </button>
        )}

        <span className="ptm-ncc-count">{entries.length} mục</span>
        {entries.length > 0 && (() => {
          const inLib = entries.filter((e) => isInLibrary(e.maNCC)).length
          const notInLib = entries.length - inLib
          return (
            <span className="ptm-ncc-lib-status" onClick={(e) => e.stopPropagation()}>
              <span className={`ptm-ncc-lib-count${inLib > 0 ? ' ptm-ncc-lib-count--has' : ''}`}>
                {inLib}/{entries.length} TTV
              </span>
              {notInLib > 0 && onUploadEntry && (
                <button className="ptm-lib-upload-all" onClick={(e) => { e.stopPropagation(); handleUploadAll() }}>
                  ⬆ Upload {notInLib > 1 ? `tất cả (${notInLib})` : ''}
                </button>
              )}
            </span>
          )
        })()}
        {onDeleteNcc && (
          <button
            className="ptm-ncc-del-ncc"
            onClick={handleDeleteNcc}
            title="Xóa NCC này"
          >
            Xóa NCC
          </button>
        )}
      </div>

      {open && (
        <div className="ptm-ncc-body">
          {collectionGroups.map(([colName, colEntries]) => {
            const firstEntry = colEntries[0]
            const colCode = buildCollectionCode(nccCode, firstEntry?.catalogue)
            const colOpen = !!openCollections[colName]
            const colInLib = colEntries.filter((e) => isInLibrary(e.maNCC)).length
            const colNotInLib = colEntries.length - colInLib

            return (
              <div key={colName} className="ptm-col-section">
                <div className="ptm-col-head" onClick={() => toggleCollection(colName)}>
                  <span className="ptm-col-arrow">{colOpen ? '▼' : '▶'}</span>
                  <span className="ptm-col-name">{colName}</span>
                  {colCode && <code className="ptm-col-code">{colCode}</code>}
                  <span className="ptm-col-count">{colEntries.length} mục</span>
                  <span className={`ptm-col-lib${colInLib > 0 ? ' ptm-col-lib--has' : ''}`}>
                    {colInLib}/{colEntries.length} TTV
                  </span>
                  {colNotInLib > 0 && onUploadEntry && (
                    <button
                      className="ptm-col-upload"
                      onClick={(ev) => { ev.stopPropagation(); handleUploadCollection(colEntries) }}
                    >
                      ⬆{colNotInLib > 1 ? ` (${colNotInLib})` : ''}
                    </button>
                  )}
                  <button
                    className="ptm-col-del"
                    onClick={(ev) => { ev.stopPropagation(); handleDeleteCollection(colName, colEntries.length) }}
                    title="Xóa toàn bộ cuốn mẫu này"
                  >
                    Xóa cuốn
                  </button>
                </div>

                {colOpen && (
                  <div className="ptm-table-wrap">
                    <table className="ptm-table">
                      <thead>
                        <tr>
                          <th className="ptm-th-sticky">Tên cuốn mẫu MrFabric</th>
                          <th className="ptm-th-sticky2">Mã MrFabric</th>
                          <th className="ptm-th-sticky3">Số trang</th>
                          <th>Phân khúc</th>
                          <th>Tên NCC</th>
                          <th>Tên cuốn mẫu NCC</th>
                          <th>Mã NCC</th>
                          <th className="ptm-th-mat">Dòng sản phẩm</th>
                          <th className="ptm-th-mat">Thành phần</th>
                          <th className="ptm-th-mat">Nhóm màu</th>
                          <th className="ptm-th-mat">Bề mặt</th>
                          <th className="ptm-th-mat">Khổ</th>
                          <th>Giá mua</th>
                          <th>Giá bán vải</th>
                          <th>Giá bán rèm</th>
                          <th className="ptm-th-mat">Nhóm biến thể</th>
                          <th>Số cuốn MrFabric</th>
                          <th className="ptm-th-lib">Thư viện</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {colEntries.map((e) =>
                          editId === e.id ? (
                            <tr key={e.id} className="ptm-tr--edit">
                              <td className="ptm-td-sticky"><span className="ptm-td-empty">—</span></td>
                              <td className="ptm-td-preview ptm-td-sticky2"><span className="ptm-td-empty">—</span></td>
                              <td className="ptm-td-sticky3"><input className="form-input ptm-edit-input ptm-edit-short" value={editDraft.soTrang || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, soTrang: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} autoFocus /></td>
                              <td><input className="form-input ptm-edit-input ptm-edit-short" value={editDraft.phanKhuc || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, phanKhuc: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="VD: Cao cấp" /></td>
                              <td className="ptm-td-ncc-name">{nccName}</td>
                              <td><input className="form-input ptm-edit-input" value={editDraft.tenCuon || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, tenCuon: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="Tên cuốn mẫu NCC" /></td>
                              <td><input className="form-input ptm-edit-input" value={editDraft.maNCC || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, maNCC: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="Mã NCC" /></td>
                              <td><input className="form-input ptm-edit-input" value={editDraft.dongSanPham || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, dongSanPham: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="VD: Rèm cuốn" /></td>
                              <td><input className="form-input ptm-edit-input" value={editDraft.thanhPhan || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, thanhPhan: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="VD: 100% Polyester" /></td>
                              <td><input className="form-input ptm-edit-input ptm-edit-short" value={editDraft.nhomMau || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, nhomMau: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="Beige" /></td>
                              <td><input className="form-input ptm-edit-input" value={editDraft.beMat || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, beMat: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="Nhám" /></td>
                              <td><input className="form-input ptm-edit-input ptm-edit-short" value={editDraft.khoVai || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, khoVai: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="2.8m" /></td>
                              <td><input className="form-input ptm-edit-input" value={editDraft.giaMua || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, giaMua: formatPrice(ev.target.value) }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} /></td>
                              <td><input className="form-input ptm-edit-input" value={editDraft.giaBanVai || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, giaBanVai: formatPrice(ev.target.value) }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="Giá bán vải" /></td>
                              <td><input className="form-input ptm-edit-input" value={editDraft.giaBanRem || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, giaBanRem: formatPrice(ev.target.value) }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="Giá bán rèm" /></td>
                              <td><input className="form-input ptm-edit-input ptm-edit-short" value={editDraft.nhomVatLieu || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, nhomVatLieu: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="GR-001" /></td>
                              <td><input className="form-input ptm-edit-input ptm-edit-short" value={editDraft.catalogue || ''} onChange={(ev) => setEditDraft((p) => ({ ...p, catalogue: ev.target.value }))} onKeyDown={(ev) => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }} placeholder="Số cuốn" /></td>
                              <td></td>
                              <td>
                                <div className="ptm-actions">
                                  <button className="ptm-ok" onClick={handleSaveEdit}>✓</button>
                                  <button className="ptm-del" onClick={handleCancelEdit}>✕</button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr key={e.id}>
                              {(() => {
                                const mat = getMaterialInfo(e.maNCC, e)
                                const preview = buildCodePreview(nccCode, e.catalogue, e.soTrang, e.dongSanPham || mat?.dongSanPham)
                                const colCode = buildCollectionCode(nccCode, e.catalogue)
                                const status = actionStatus[e.maNCC]
                                const inLib = isInLibrary(e.maNCC)
                                return <>
                                  <td className="ptm-td-sticky">
                                    {colCode ? <code className="ptm-code-preview">{colCode}</code> : <span className="ptm-td-empty">—</span>}
                                  </td>
                                  <td className="ptm-td-preview ptm-td-sticky2">
                                    {preview ? <code className="ptm-code-preview">{preview}</code> : <span className="ptm-td-empty">—</span>}
                                  </td>
                                  <td className="ptm-td-num ptm-td-sticky3">{e.soTrang || '—'}</td>
                                  <td className="ptm-td-mat">{e.phanKhuc || <span className="ptm-td-empty">—</span>}</td>
                                  <td className="ptm-td-ncc-name">{nccName}</td>
                                  <td className="ptm-td-name">{e.tenCuon || <span className="ptm-td-empty">—</span>}</td>
                                  <td className="ptm-td-code"><code>{e.maNCC}</code></td>
                                  <td className="ptm-td-mat">{mat?.dongSanPham || <span className="ptm-td-empty">—</span>}</td>
                                  <td className="ptm-td-mat">{e.thanhPhan || mat?.thanhPhan || <span className="ptm-td-empty">—</span>}</td>
                                  <td className="ptm-td-mat">
                                    {(() => {
                                      const ce = findColorEntry(e.nhomMau)
                                      if (ce) {
                                        // Ưu tiên per-maNCC variant override để hiện đúng màu AI đã render
                                        const varHex = getVariantHex(e.maNCC)
                                        return (
                                          <span className="ptm-color">
                                            <span className="ptm-color-dot" style={{ background: varHex || ce.hex }} />
                                            {varHex
                                              ? <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{varHex.toUpperCase()}</span>
                                              : ce.name_en}
                                          </span>
                                        )
                                      }
                                      const fb = mat ? translateColor(mat.mauSac) : (e.nhomMau || '')
                                      return fb ? <span>{fb}</span> : <span className="ptm-td-empty">—</span>
                                    })()}
                                  </td>
                                  <td className="ptm-td-mat">{mat?.beMat || <span className="ptm-td-empty">—</span>}</td>
                                  <td className="ptm-td-mat">{mat?.khoVai || <span className="ptm-td-empty">—</span>}</td>
                                  <td className="ptm-td-price">{e.giaMua || '—'}</td>
                                  <td className="ptm-td-price">{e.giaBanVai || '—'}</td>
                                  <td className="ptm-td-price">{e.giaBanRem || '—'}</td>
                                  <td className="ptm-td-mat">
                                    {editVariantId === e.id ? (
                                      <div className="ptm-variant-edit">
                                        <input
                                          className="form-input ptm-edit-input ptm-edit-short"
                                          value={editVariantVal}
                                          onChange={(ev) => setEditVariantVal(ev.target.value)}
                                          onKeyDown={(ev) => {
                                            if (ev.key === 'Enter') {
                                              const val = editVariantVal.trim()
                                              onSetVariantGroup?.(e.maNCC, val)
                                              onUpdate(updatePriceEntry(priceTable, e.id, { nhomVatLieu: val }))
                                              setEditVariantId(null)
                                            }
                                            if (ev.key === 'Escape') setEditVariantId(null)
                                          }}
                                          autoFocus
                                          placeholder="VD: GR-001"
                                        />
                                        <button className="ptm-ok" onClick={() => {
                                          const val = editVariantVal.trim()
                                          onSetVariantGroup?.(e.maNCC, val)
                                          onUpdate(updatePriceEntry(priceTable, e.id, { nhomVatLieu: val }))
                                          setEditVariantId(null)
                                        }}>✓</button>
                                        <button className="ptm-del" onClick={() => setEditVariantId(null)}>✕</button>
                                      </div>
                                    ) : (
                                      <span
                                        className="ptm-variant-val"
                                        onClick={() => { setEditVariantId(e.id); setEditVariantVal(mat?.nhomVatLieu || e.nhomVatLieu || '') }}
                                        title="Click để chỉnh nhóm biến thể"
                                      >
                                        {mat?.nhomVatLieu || e.nhomVatLieu || <span className="ptm-td-empty">—</span>}
                                      </span>
                                    )}
                                  </td>
                                  <td className="ptm-td-num">{e.catalogue || '—'}</td>
                                  <td className="ptm-td-lib">
                                    {status === 'uploaded' ? <span className="ptm-lib-done">✓ Đã upload</span>
                                      : status === 'removed' ? <span className="ptm-lib-done">✓ Đã gỡ</span>
                                      : inLib
                                        ? <button className="ptm-lib-remove" onClick={() => doRemove(e.maNCC)} title="Gỡ khỏi thư viện">Gỡ</button>
                                        : <button className="ptm-lib-upload" onClick={() => doUpload({ ...e, _previewCode: preview })} title="Upload lên thư viện">⬆</button>
                                    }
                                  </td>
                                  <td>
                                    <div className="ptm-actions">
                                      <button className="ptm-edit" onClick={() => handleStartEdit(e)} title="Sửa">✎</button>
                                      <button className="ptm-del" onClick={() => handleDeleteEntry(e.id)} title="Xóa mục">✕</button>
                                    </div>
                                  </td>
                                </>
                              })()}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}

          {entries.length === 0 && !addMode && (
            <p className="ptm-ncc-empty">Chưa có mục nào. Thêm mục bên dưới.</p>
          )}

          {addMode ? (
            <div className="ptm-paste-form">
              <p className="ptm-paste-hint">
                Dán từ Excel/Sheets — mỗi hàng một mục, cách bằng Tab:<br />
                <code>Số trang · Phân khúc · Tên NCC · Tên cuốn mẫu NCC · Mã NCC · Dòng SP · Thành phần · Nhóm màu · Bề mặt · Khổ · Giá mua · Giá bán vải · Giá bán rèm · Nhóm biến thể · Số cuốn MrFabric</code>
              </p>
              <textarea
                className="ptm-import-ta"
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
                placeholder={'15\t\tAcacia\tSpring 2024\tA15-8\tRèm vải\t100% Polyester\tBeige\tPlain\t280cm\t150.000\t\t\tGR-001\t5'}
                rows={4}
                autoFocus
              />
              <div className="ptm-inline-btns">
                <button className="btn btn-primary" onClick={handleAddFromPaste} disabled={!addText.trim()}>✓ Thêm</button>
                <button className="btn btn-ghost" onClick={() => { setAddMode(false); setAddText('') }}>Huỷ</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost ptm-add-row-btn" onClick={() => setAddMode(true)}>
              + Thêm mục
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PriceTableManager({ priceTable, onUpdate, nccCodes, onAddNcc, onUpdateNcc, onDeleteNcc, allMaterials, productLinesList, onSetVariantGroup, onUpdateMaterialByMaNCC, onUploadEntry, onRemoveByMaNCC }) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [newNccName, setNewNccName] = useState('')
  const [newNccCode, setNewNccCode] = useState('')
  const [newNccConstellation, setNewNccConstellation] = useState('')

  const [trashOpen, setTrashOpen] = useState(false)

  const nccNames = Object.keys(nccCodes || {}).sort((a, b) => a.localeCompare(b, 'vi'))

  const grouped = {}
  for (const entry of priceTable.filter((e) => !e.deletedAt)) {
    const ncc = entry.nhaCungCap || '__unknown__'
    if (!grouped[ncc]) grouped[ncc] = []
    grouped[ncc].push(entry)
  }

  const trashedEntries = priceTable.filter((e) => e.deletedAt)

  function handleRestoreEntry(id) {
    onUpdate(priceTable.map((e) => e.id === id ? { ...e, deletedAt: undefined } : e))
  }

  function handlePermDeleteEntry(id) {
    if (!window.confirm('Xóa vĩnh viễn mục này? Không thể hoàn tác.')) return
    onUpdate(priceTable.filter((e) => e.id !== id))
  }

  function handlePermDeleteAll() {
    if (!window.confirm(`Xóa vĩnh viễn ${trashedEntries.length} mục trong thùng rác?\nKhông thể hoàn tác.`)) return
    onUpdate(priceTable.filter((e) => !e.deletedAt))
  }

  const allNccNames = [...new Set([...nccNames, ...Object.keys(grouped).filter((k) => k !== '__unknown__')])]
    .sort((a, b) => a.localeCompare(b, 'vi'))

  const unknownEntries = grouped['__unknown__'] || []

  function getNccCode(name) {
    const entry = (nccCodes || {})[name]
    if (!entry) return null
    return typeof entry === 'string' ? entry : (entry.code || null)
  }

  const usedCodes = allNccNames.map(getNccCode).filter(Boolean)

  function handleConstellationChange(e) {
    const val = e.target.value
    setNewNccConstellation(val)
    if (val) setNewNccCode(val)
  }

  function handleAddNcc() {
    const name = newNccName.trim()
    if (!name || !onAddNcc) return
    const code = newNccCode.trim().toUpperCase() || name.replace(/\s+/g, '').toUpperCase().slice(0, 8)
    onAddNcc(name, code)
    setNewNccName('')
    setNewNccCode('')
    setNewNccConstellation('')
  }

  // Column order: Số trang | Phân khúc | Tên NCC | Tên cuốn mẫu NCC | Mã NCC |
  //               Dòng SP | Thành phần | Nhóm màu | Bề mặt | Khổ | Giá mua | Giá bán vải | Giá bán rèm | Nhóm biến thể | Số cuốn MrFabric
  function handlePasteImport() {
    const lines = importText.trim().split('\n').filter((l) => l.trim())
    if (lines.length === 0) return
    let next = [...priceTable]
    const matUpdates = []
    for (const line of lines) {
      const cols = line.split('\t').map((c) => c.trim())
      // col 0: Số trang, col 1: Phân khúc, col 2: Tên NCC, col 3: Tên cuốn mẫu NCC,
      // col 4: Mã NCC, col 5: Dòng SP, col 6: Thành phần, col 7: Nhóm màu, col 8: Bề mặt,
      // col 9: Khổ, col 10: Giá mua, col 11: Giá bán vải, col 12: Giá bán rèm, col 13: Nhóm biến thể, col 14: Số cuốn MrFabric
      const nhaCungCap = cols[2] || ''
      const maNCC = cols[4] || ''
      if (!maNCC) continue
      const matFields = {}
      if (cols[5]) matFields.dongSanPham = cols[5]
      if (cols[6]) matFields.thanhPhan = cols[6]
      if (cols[7]) matFields.nhomMau = resolveColorCode(cols[7])
      if (cols[8]) matFields.beMat = cols[8]
      if (cols[9]) matFields.khoVai = cols[9]
      if (cols[13]) matFields.nhomVatLieu = cols[13]
      next = addPriceEntry(next, {
        nhaCungCap,
        soTrang: cols[0] || '',
        phanKhuc: cols[1] || '',
        tenCuon: cols[3] || '',
        maNCC,
        catalogue: cols[14] || '',
        giaMua: formatPrice(cols[10] || ''),
        giaBanVai: formatPrice(cols[11] || ''),
        giaBanRem: formatPrice(cols[12] || ''),
        ...matFields,
      })
      if (Object.keys(matFields).length) matUpdates.push({ maNCC, matUpdate: matFields })
    }
    onUpdate(next)
    matUpdates.forEach(({ maNCC, matUpdate }) => onUpdateMaterialByMaNCC?.(maNCC, matUpdate))
    setImportText('')
    setImportOpen(false)
  }

  return (
    <div className="ptm-wrap" data-dn-area="Bảng đơn giá">
      <div className="ptm-intro">
        <p className="ptm-desc">
          Quản lý NCC và đơn giá theo từng cuốn mẫu. Mã MrFabric được tự tính từ mã nội bộ + số cuốn + số trang.
        </p>
      </div>

      {/* Batch import */}
      <div className="ptm-import-section">
        <button className="btn btn-ghost ptm-import-toggle" onClick={() => setImportOpen((v) => !v)}>
          {importOpen ? '▲ Ẩn nhập hàng loạt' : '▼ Nhập hàng loạt từ bảng tính'}
        </button>
        {importOpen && (
          <div className="ptm-import-body">
            <p className="ptm-import-hint">
              Dán dữ liệu từ Excel/Sheets (các cột cách nhau bằng Tab):<br />
              <code>Số trang · Phân khúc · Tên NCC · Tên cuốn mẫu NCC · Mã NCC · Dòng SP · Thành phần · Nhóm màu · Bề mặt · Khổ · Giá mua · Giá bán vải · Giá bán rèm · Nhóm biến thể · Số cuốn MrFabric</code>
            </p>
            <textarea
              className="ptm-import-ta"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={'Acacia\tSpring 2024\tA15-8\tRèm vải\tBeige\t100% Polyester\tPlain\t280cm\t5\t15\t150.000\t\t\tGR-001'}
              rows={5}
            />
            <div className="ptm-import-btns">
              <button className="btn btn-primary" onClick={handlePasteImport} disabled={!importText.trim()}>Nhập dữ liệu</button>
              <button className="btn btn-ghost" onClick={() => { setImportOpen(false); setImportText('') }}>Huỷ</button>
            </div>
          </div>
        )}
      </div>

      {/* NCC accordion list */}
      {allNccNames.length === 0 && priceTable.length === 0 ? (
        <div className="ptm-empty">
          Chưa có dữ liệu. Thêm NCC bên dưới hoặc nhập hàng loạt từ bảng tính.
        </div>
      ) : (
        <div className="ptm-ncc-list">
          {allNccNames.map((name) => (
            <NccPriceSection
              key={name}
              nccName={name}
              nccCode={getNccCode(name)}
              nccCodes={nccCodes}
              entries={grouped[name] || []}
              priceTable={priceTable}
              onUpdate={onUpdate}
              onUpdateNcc={onUpdateNcc}
              onDeleteNcc={onDeleteNcc}
              allMaterials={allMaterials}
              productLinesList={productLinesList}
              onSetVariantGroup={onSetVariantGroup}
              onUpdateMaterialByMaNCC={onUpdateMaterialByMaNCC}
              onUploadEntry={onUploadEntry}
              onRemoveByMaNCC={onRemoveByMaNCC}
            />
          ))}
          {unknownEntries.length > 0 && (
            <NccPriceSection
              nccName="(Không rõ NCC)"
              nccCode={null}
              nccCodes={nccCodes}
              entries={unknownEntries}
              priceTable={priceTable}
              onUpdate={onUpdate}
              allMaterials={allMaterials}
              productLinesList={productLinesList}
              onSetVariantGroup={onSetVariantGroup}
              onUpdateMaterialByMaNCC={onUpdateMaterialByMaNCC}
              onUploadEntry={onUploadEntry}
              onRemoveByMaNCC={onRemoveByMaNCC}
            />
          )}
        </div>
      )}

      {/* Trash section */}
      {trashedEntries.length > 0 && (
        <div className="ptm-trash-section">
          <div className="ptm-trash-head" onClick={() => setTrashOpen((v) => !v)}>
            <span className="ptm-trash-arrow">{trashOpen ? '▼' : '▶'}</span>
            <span className="ptm-trash-title">🗑 Thùng rác</span>
            <span className="ptm-trash-count">{trashedEntries.length} mục</span>
            <div className="ptm-trash-head-actions" onClick={(e) => e.stopPropagation()}>
              {trashOpen && (
                <button className="ptm-trash-del-all" onClick={handlePermDeleteAll}>
                  Xóa vĩnh viễn tất cả
                </button>
              )}
            </div>
          </div>
          {trashOpen && (
            <div className="ptm-trash-list">
              {trashedEntries.map((e) => (
                <div key={e.id} className="ptm-trash-item">
                  <span className="ptm-trash-ncc">{e.nhaCungCap}</span>
                  <span className="ptm-trash-sep">›</span>
                  <span className="ptm-trash-cuon">{e.tenCuon || '—'}</span>
                  <span className="ptm-trash-sep">›</span>
                  <code className="ptm-trash-code">{e.maNCC}</code>
                  <span className="ptm-trash-date">{e.deletedAt ? new Date(e.deletedAt).toLocaleDateString('vi-VN') : ''}</span>
                  <div className="ptm-trash-actions">
                    <button className="ptm-trash-restore" onClick={() => handleRestoreEntry(e.id)}>Khôi phục</button>
                    <button className="ptm-trash-perm" onClick={() => handlePermDeleteEntry(e.id)}>Xóa vĩnh viễn</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add new NCC */}
      <div className="ptm-add-ncc">
        <p className="ptm-add-ncc-label">Thêm nhà cung cấp mới:</p>
        <div className="ptm-add-ncc-form">
          <input
            className="form-input ptm-add-ncc-name"
            value={newNccName}
            onChange={(e) => setNewNccName(e.target.value)}
            placeholder="Tên NCC (VD: Acacia)"
            onKeyDown={(e) => e.key === 'Enter' && handleAddNcc()}
          />
          <select
            className="form-input ptm-add-ncc-select"
            value={newNccConstellation}
            onChange={handleConstellationChange}
          >
            <option value="">-- Chòm sao --</option>
            {CONSTELLATION_CODES.map((c) => (
              <option key={c.code} value={c.code} disabled={usedCodes.includes(c.code)}>
                {c.code} — {c.name}{usedCodes.includes(c.code) ? ' (đã dùng)' : ''}
              </option>
            ))}
          </select>
          <input
            className="form-input ptm-add-ncc-code"
            value={newNccCode}
            onChange={(e) => { setNewNccCode(e.target.value.toUpperCase()); setNewNccConstellation('') }}
            placeholder="Mã nội bộ (VD: ORION)"
            maxLength={12}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNcc()}
          />
          <button
            className="btn btn-primary"
            onClick={handleAddNcc}
            disabled={!newNccName.trim() || !onAddNcc}
          >
            + Thêm NCC
          </button>
        </div>
      </div>
    </div>
  )
}
