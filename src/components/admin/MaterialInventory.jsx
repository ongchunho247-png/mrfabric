import { useState, useMemo } from 'react'
import AdminMaterialModal from './AdminMaterialModal'
import './MaterialInventory.css'

function displayPrice(val) {
  if (!val) return '—'
  const digits = String(val).replace(/\./g, '').replace(/\D/g, '')
  if (!digits) return String(val)
  return parseInt(digits, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const STATUS_LABEL = {
  active: 'Active',
  archived: 'Archived',
  discontinued: 'Discontinued',
}

function getUniqueValues(materials, key) {
  const set = new Set()
  for (const m of materials) {
    const val = m[key]
    if (Array.isArray(val)) val.forEach((v) => set.add(v))
    else if (val) set.add(val)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
}

function ThumbCell({ material }) {
  const src = material.images?.closeup?.path || material.productImage
  const [err, setErr] = useState(false)

  if (!src || err) {
    return (
      <div className="mi-thumb mi-thumb--ph">
        <span>{(material.nhomMau || '?')[0]}</span>
      </div>
    )
  }

  return (
    <div className="mi-thumb-wrap">
      <img className="mi-thumb" src={src} alt={material.maMrFabric} onError={() => setErr(true)} />
      <img className="mi-thumb-zoom" src={src} alt={material.maMrFabric} onError={() => setErr(true)} />
    </div>
  )
}

function SortTh({ children, sortKey, currentKey, currentDir, onSort, className }) {
  const isActive = currentKey === sortKey
  const icon = isActive ? (currentDir === 'asc' ? ' ▲' : ' ▼') : ' ↕'
  return (
    <th
      className={`mi-th-sortable${isActive ? ' mi-th--sorted' : ''}${className ? ` ${className}` : ''}`}
      onClick={() => onSort(sortKey)}
      title={isActive ? (currentDir === 'asc' ? 'Đang tăng dần — click để đảo' : 'Đang giảm dần — click để đảo') : 'Click để sắp xếp'}
    >
      {children}<span className="mi-sort-icon">{icon}</span>
    </th>
  )
}

function PriceMinInput({ label, value, onChange }) {
  return (
    <label className="mi-price-filter">
      <span className="mi-price-label">{label} ≥</span>
      <input
        className="form-input mi-price-input"
        type="number"
        min="0"
        step="1000"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    </label>
  )
}

function parsePrice(val) {
  if (!val) return 0
  const digits = String(val).replace(/\./g, '').replace(/\D/g, '')
  return parseInt(digits, 10) || 0
}

export default function MaterialInventory({ allMaterials, adminMaterials, onEdit, onDelete, allProductLines }) {
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  const adminIds = useMemo(() => new Set(adminMaterials.map((m) => m.id)), [adminMaterials])

  const filtered = useMemo(() => {
    if (!search.trim()) return allMaterials
    const q = search.trim().toLowerCase()
    return allMaterials.filter((m) =>
      [m.maMrFabric, m.maNCC, m.collection, m.nhaCungCap, m.soTrang,
        m.catalogueNum, ...(m.hashtag || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(q),
    )
  }, [allMaterials, search])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      let va = a[sortKey] ?? ''
      let vb = b[sortKey] ?? ''
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = va.localeCompare(vb, 'vi')
        return sortDir === 'asc' ? cmp : -cmp
      }
      const na = parseInt(String(va).replace(/\D/g, ''), 10) || 0
      const nb = parseInt(String(vb).replace(/\D/g, ''), 10) || 0
      return sortDir === 'asc' ? na - nb : nb - na
    })
  }, [filtered, sortKey, sortDir])

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleDelete(m) {
    if (window.confirm(`Xóa vật liệu "${m.maMrFabric}"?`)) onDelete(m.id)
  }

  const sortProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort }

  return (
    <>
    <div className="mi-wrap">
      <div className="mi-filters">
        <div className="mi-search-wrap">
          <input
            className="form-input mi-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã MrFabric, tên màu, mã NCC, số trang..."
          />
          {search && <button className="mi-search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      <div className="mi-count">
        Hiển thị <strong>{sorted.length}</strong> / {allMaterials.length} mã vật liệu
        {sortKey && <span className="mi-sort-active"> · Đang sắp xếp theo {sortKey}</span>}
      </div>

      {sorted.length === 0 ? (
        <div className="mi-empty">Không tìm thấy vật liệu phù hợp.</div>
      ) : (
        <div className="mi-table-wrap">
          <table className="mi-table">
            <thead>
              <tr>
                <th className="mi-th-stt">STT</th>
                <th className="mi-th-img">Ảnh</th>
                <SortTh sortKey="catalogueNum" {...sortProps} className="mi-th-cat">Số cuốn mẫu</SortTh>
                <SortTh sortKey="collection" {...sortProps}>Cuốn NCC</SortTh>
                <SortTh sortKey="maNCC" {...sortProps}>Mã NCC</SortTh>
                <SortTh sortKey="soTrang" {...sortProps} className="mi-th-page">Trang</SortTh>
                <SortTh sortKey="maMrFabric" {...sortProps}>Mã MrFabric</SortTh>
                <SortTh sortKey="giaMua" {...sortProps}>Giá mua</SortTh>
                <SortTh sortKey="giaBan" {...sortProps}>Giá bán vải</SortTh>
                <SortTh sortKey="giaBanRem" {...sortProps}>Giá bán rèm</SortTh>
                <SortTh sortKey="trangThai" {...sortProps}>Trạng thái</SortTh>
                <th>Hashtag</th>
                <th className="mi-th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, idx) => {
                const isAdmin = adminIds.has(m.id)
                const status = m.trangThai || 'active'
                return (
                  <tr key={m.id} className={isAdmin ? 'mi-tr--admin' : ''}>
                    <td className="mi-td-stt">{idx + 1}</td>
                    <td className="mi-td-img">
                      <ThumbCell material={m} />
                    </td>
                    <td className="mi-td-cat">{m.catalogueNum || '—'}</td>
                    <td className="mi-td-collection">{m.collection || '—'}</td>
                    <td className="mi-td-mancc"><code>{m.maNCC || '—'}</code></td>
                    <td className="mi-td-page">{m.soTrang || '—'}</td>
                    <td className="mi-td-code">
                      <code className="mi-mamrfabric">{m.maMrFabric}</code>
                    </td>
                    <td className="mi-td-price">{displayPrice(m.giaMua)}</td>
                    <td className="mi-td-price">{displayPrice(m.giaBan)}</td>
                    <td className="mi-td-price">{displayPrice(m.giaBanRem)}</td>
                    <td>
                      <span className={`mi-status mi-status--${status}`}>
                        {STATUS_LABEL[status] || status}
                      </span>
                    </td>
                    <td className="mi-td-hashtag">
                      {Array.isArray(m.hashtag) && m.hashtag.length > 0
                        ? m.hashtag.map((h) => (
                          <span key={h} className="mi-hashtag">#{h}</span>
                        ))
                        : <span className="mi-td-empty">—</span>
                      }
                    </td>
                    <td className="mi-td-actions">
                      <button className="btn btn-ghost mi-action-btn" onClick={() => setSelectedMaterial(m)}>
                        Chi tiết
                      </button>
                      <button className="btn btn-secondary mi-action-btn" onClick={() => onEdit(m)}>
                        ✎ Sửa
                      </button>
                      {isAdmin && (
                        <button className="btn btn-danger mi-action-btn" onClick={() => handleDelete(m)}>
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {selectedMaterial && (
      <AdminMaterialModal
        material={selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        onEdit={(m) => { setSelectedMaterial(null); onEdit(m) }}
      />
    )}
    </>
  )
}
