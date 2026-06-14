import { useState, useMemo } from 'react'
import { COLOR_GROUPS, findColorEntry, findClosestColorEntry } from '../../data/colorGroups'
import { getProductTypeCode } from '../../helpers/generateMrFabricCode'
import { getNccCode } from '../../helpers/nccCodeStorage'
import { getVariantHex } from '../../helpers/colorDictStorage'
import './MaterialLibraryAdmin.css'

const COLS = [
  { key: 'colCode',      label: 'Tên cuốn mẫu MrFabric', sort: null },
  { key: 'preview',      label: 'Mã MrFabric',            sort: null },
  { key: 'soTrang',      label: 'Số trang',                sort: null },
  { key: 'phanKhuc',     label: 'Phân khúc',               sort: null },
  { key: 'nhaCungCap',   label: 'Tên NCC',                 sort: 'nhaCungCap' },
  { key: 'tenCuon',      label: 'Tên cuốn mẫu NCC',        sort: null },
  { key: 'maNCC',        label: 'Mã NCC',                  sort: 'maNCC' },
  { key: 'dongSanPham',  label: 'Dòng sản phẩm',           sort: null },
  { key: 'thanhPhan',    label: 'Thành phần',              sort: null },
  { key: 'nhomMau',      label: 'Nhóm màu',                sort: 'nhomMau' },
  { key: 'beMat',        label: 'Bề mặt',                  sort: null },
  { key: 'khoVai',       label: 'Khổ',                     sort: 'khoVai' },
  { key: 'giaMua',       label: 'Giá mua',                 sort: 'giaMua' },
  { key: 'giaBanVai',    label: 'Giá bán vải',             sort: 'giaBanVai' },
  { key: 'giaBanRem',    label: 'Giá bán rèm',             sort: 'giaBanRem' },
  { key: 'nhomVatLieu',  label: 'Nhóm biến thể',           sort: null },
  { key: 'catalogue',    label: 'Số cuốn MrFabric',        sort: null },
]

function ColTh({ children, onHide }) {
  return (
    <th className="mla-th-hide">
      <span className="mla-th-label">{children}</span>
      <button className="mla-hide-btn" onClick={onHide} title="Ẩn cột">×</button>
    </th>
  )
}

function SortTh({ children, sortKey, activeKey, activeDir, onSort, onHide }) {
  const active = activeKey === sortKey
  return (
    <th className={`mla-th-sort mla-th-hide${active ? ' mla-th-sort--on' : ''}`}>
      <span className="mla-th-label" onClick={() => onSort(sortKey)}>
        {children}
        <span className="mla-sort-icon">{active ? (activeDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}</span>
      </span>
      <button className="mla-hide-btn" onClick={onHide} title="Ẩn cột">×</button>
    </th>
  )
}

function buildColCode(nccCode, catalogue) {
  if (!nccCode || !catalogue) return null
  const cat = String(catalogue).replace(/\D/g, '').padStart(3, '0')
  if (cat === '000') return null
  return `MC-${nccCode}-${cat}`
}

function buildPreview(nccCode, catalogue, soTrang, dongSanPham) {
  if (!nccCode) return null
  const typeCode = getProductTypeCode(dongSanPham)
  const cat = String(catalogue || '').replace(/\D/g, '').padStart(3, '0')
  const page = String(soTrang || '').replace(/\D/g, '').padStart(3, '0')
  if (cat === '000' && page === '000') return null
  return `MC-${nccCode}-${typeCode}${cat}${page}`
}

function getProductType(e) {
  const ds = e.dongSanPham || (Array.isArray(e.congNang) ? e.congNang[0] : (e.congNang || ''))
  return ds || 'Chưa phân loại'
}

export default function MaterialLibraryAdmin({ priceTable = [], nccCodes = {} }) {
  const [hiddenCols, setHiddenCols] = useState(new Set())
  function toggleCol(key) {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  const [search, setSearch] = useState('')
  const [filterNcc, setFilterNcc] = useState('')
  const [filterBeMat, setFilterBeMat] = useState('')
  const [filterNhomMau, setFilterNhomMau] = useState('')
  const [filterProductType, setFilterProductType] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const activeEntries = useMemo(() => (priceTable || []).filter((e) => !e.deletedAt), [priceTable])

  const productTypeList = useMemo(() => {
    const types = [...new Set(activeEntries.map(getProductType))]
    return types.sort((a, b) => a.localeCompare(b, 'vi'))
  }, [activeEntries])

  const nccList = useMemo(() =>
    [...new Set(activeEntries.map((e) => e.nhaCungCap).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
  [activeEntries])

  const beMatList = useMemo(() => {
    const set = new Set()
    activeEntries.forEach((e) => {
      const b = e.beMat
      if (Array.isArray(b)) b.forEach((v) => v && set.add(v))
      else if (b) set.add(b)
    })
    return [...set].sort()
  }, [activeEntries])

  const nhomMauList = useMemo(() => {
    const codes = [...new Set(activeEntries.map((e) => e.nhomMau).filter(Boolean))]
    return codes.sort((a, b) => {
      const ea = COLOR_GROUPS.find((c) => c.code === a)
      const eb = COLOR_GROUPS.find((c) => c.code === b)
      return (ea?.name_en || a).localeCompare(eb?.name_en || b)
    })
  }, [activeEntries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeEntries.filter((e) => {
      if (filterNcc && e.nhaCungCap !== filterNcc) return false
      if (filterBeMat) {
        const b = e.beMat
        const hasIt = Array.isArray(b) ? b.includes(filterBeMat) : b === filterBeMat
        if (!hasIt) return false
      }
      if (filterNhomMau && e.nhomMau !== filterNhomMau) return false
      if (filterProductType && getProductType(e) !== filterProductType) return false
      if (!q) return true
      return (
        (e.maNCC || '').toLowerCase().includes(q) ||
        (e.nhaCungCap || '').toLowerCase().includes(q) ||
        (e.tenCuon || '').toLowerCase().includes(q)
      )
    })
  }, [activeEntries, search, filterNcc, filterBeMat, filterNhomMau, filterProductType])

  const grouped = useMemo(() => {
    const map = {}
    for (const e of filtered) {
      const group = getProductType(e)
      if (!map[group]) map[group] = []
      map[group].push(e)
    }

    if (sortKey) {
      for (const items of Object.values(map)) {
        items.sort((a, b) => {
          let va = a[sortKey] || ''
          let vb = b[sortKey] || ''
          if (['giaMua', 'giaBanVai', 'giaBanRem'].includes(sortKey)) {
            const na = parseInt(String(va).replace(/\D/g, ''), 10) || 0
            const nb = parseInt(String(vb).replace(/\D/g, ''), 10) || 0
            return sortDir === 'asc' ? na - nb : nb - na
          }
          va = String(va).toLowerCase()
          vb = String(vb).toLowerCase()
          const cmp = va.localeCompare(vb, 'vi')
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
    }

    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'vi'))
  }, [filtered, sortKey, sortDir])

  const hasFilters = search || filterNcc || filterBeMat || filterNhomMau || filterProductType
  const sortProps = { activeKey: sortKey, activeDir: sortDir, onSort: handleSort }

  return (
    <div className="mla-wrap">

      {/* Folder panel theo dòng sản phẩm */}
      <div className="mla-folders">
        <button
          className={`mla-folder${!filterProductType ? ' mla-folder--on' : ''}`}
          onClick={() => setFilterProductType('')}
        >
          📁 Tất cả
          <span className="mla-folder-count">{activeEntries.length}</span>
        </button>
        {productTypeList.map((pt) => {
          const count = activeEntries.filter((e) => getProductType(e) === pt).length
          return (
            <button
              key={pt}
              className={`mla-folder${filterProductType === pt ? ' mla-folder--on' : ''}`}
              onClick={() => setFilterProductType(filterProductType === pt ? '' : pt)}
            >
              📂 {pt}
              <span className="mla-folder-count">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="mla-toolbar">
        <input
          className="form-input mla-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã NCC, NCC, cuốn mẫu..."
        />
        <select className="form-input mla-filter" value={filterNcc} onChange={(e) => setFilterNcc(e.target.value)}>
          <option value="">Tất cả NCC</option>
          {nccList.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className="form-input mla-filter" value={filterBeMat} onChange={(e) => setFilterBeMat(e.target.value)}>
          <option value="">Tất cả bề mặt</option>
          {beMatList.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="form-input mla-filter" value={filterNhomMau} onChange={(e) => setFilterNhomMau(e.target.value)}>
          <option value="">Tất cả màu</option>
          {nhomMauList.map((code) => {
            const entry = COLOR_GROUPS.find((c) => c.code === code)
            return <option key={code} value={code}>{entry ? entry.name_en : code}</option>
          })}
        </select>
        {hasFilters && (
          <button className="btn btn-ghost mla-clear" onClick={() => {
            setSearch(''); setFilterNcc(''); setFilterBeMat(''); setFilterNhomMau(''); setFilterProductType('')
          }}>
            ✕ Xóa lọc
          </button>
        )}
        <span className="mla-count">{filtered.length} / {activeEntries.length}</span>
      </div>

      {hiddenCols.size > 0 && (
        <div className="mla-hidden-bar">
          <span className="mla-hidden-label">Cột ẩn:</span>
          {COLS.filter((c) => hiddenCols.has(c.key)).map((c) => (
            <button key={c.key} className="mla-col-chip" onClick={() => toggleCol(c.key)}>
              + {c.label}
            </button>
          ))}
          <button className="mla-col-chip mla-col-chip--all" onClick={() => setHiddenCols(new Set())}>
            Hiện tất cả
          </button>
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="mla-empty">Không tìm thấy vật liệu phù hợp.</div>
      ) : (
        <div className="mla-groups">
          {grouped.map(([group, items]) => (
            <div key={group} className="mla-group">
              <div className="mla-group-header">
                <span className="mla-group-ncc">{group}</span>
                <span className="mla-group-count">{items.length} mã</span>
              </div>
              <div className="mla-table-wrap">
                <table className="mla-table">
                  <thead>
                    <tr>
                      {COLS.map((col) => {
                        if (hiddenCols.has(col.key)) return null
                        if (col.sort) return (
                          <SortTh key={col.key} sortKey={col.sort} {...sortProps} onHide={() => toggleCol(col.key)}>
                            {col.label}
                          </SortTh>
                        )
                        return <ColTh key={col.key} onHide={() => toggleCol(col.key)}>{col.label}</ColTh>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e) => {
                      const nccCode = getNccCode(nccCodes, e.nhaCungCap)
                      const dsp = e.dongSanPham || (Array.isArray(e.congNang) ? e.congNang[0] : (e.congNang || ''))
                      const colCode = buildColCode(nccCode, e.catalogue)
                      const preview = buildPreview(nccCode, e.catalogue, e.soTrang, dsp)
                      const colorEntry = findColorEntry(e.nhomMau)
                      const beMatStr = Array.isArray(e.beMat) ? e.beMat.join(', ') : (e.beMat || '—')
                      const H = hiddenCols
                      return (
                        <tr key={e.id}>
                          {!H.has('colCode')     && <td>{colCode ? <code className="mla-code">{colCode}</code> : <span className="mla-empty-cell">—</span>}</td>}
                          {!H.has('preview')     && <td>{preview ? <code className="mla-code">{preview}</code> : <span className="mla-empty-cell">—</span>}</td>}
                          {!H.has('soTrang')     && <td className="mla-td-num">{e.soTrang || '—'}</td>}
                          {!H.has('phanKhuc')    && <td>{e.phanKhuc || '—'}</td>}
                          {!H.has('nhaCungCap')  && <td>{e.nhaCungCap || '—'}</td>}
                          {!H.has('tenCuon')     && <td className="mla-td-long">{e.tenCuon || '—'}</td>}
                          {!H.has('maNCC')       && <td><code className="mla-code mla-code--ncc">{e.maNCC || '—'}</code></td>}
                          {!H.has('dongSanPham') && <td>{dsp || '—'}</td>}
                          {!H.has('thanhPhan')   && <td>{e.thanhPhan || '—'}</td>}
                          {!H.has('nhomMau')     && (
                            <td>
                              {(() => {
                                const effectiveHex = getVariantHex(e.maNCC) || e.aiColorHex || null
                                return (
                                  <span className="mla-color">
                                    {colorEntry && <span className="mla-color-dot" style={{ background: effectiveHex || colorEntry.hex }} />}
                                    {(effectiveHex ? findClosestColorEntry(effectiveHex)?.name_en : null) || (colorEntry ? colorEntry.name_en : (e.nhomMau || '—'))}
                                  </span>
                                )
                              })()}
                            </td>
                          )}
                          {!H.has('beMat')       && <td className="mla-td-long">{beMatStr}</td>}
                          {!H.has('khoVai')      && <td>{e.khoVai || '—'}</td>}
                          {!H.has('giaMua')      && <td>{e.giaMua || '—'}</td>}
                          {!H.has('giaBanVai')   && <td>{e.giaBanVai || '—'}</td>}
                          {!H.has('giaBanRem')   && <td>{e.giaBanRem || '—'}</td>}
                          {!H.has('nhomVatLieu') && <td>{e.nhomVatLieu || '—'}</td>}
                          {!H.has('catalogue')   && <td>{e.catalogue || '—'}</td>}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
