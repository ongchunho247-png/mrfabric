import { useState, useEffect } from 'react'
import MaterialCard from './MaterialCard'
import './MaterialGrid.css'

const PAGE_SIZE = 24

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages <= 10 || i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="mg-pagination">
      <button className="mg-page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`el-${i}`} className="mg-page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`mg-page-btn${p === page ? ' mg-page-btn--active' : ''}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button className="mg-page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>›</button>
    </div>
  )
}

export default function MaterialGrid({ materials, moodboardItems, onCardClick, onSave }) {
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [materials])

  if (materials.length === 0) {
    return (
      <div className="mg-empty">
        <p>Không tìm thấy vật liệu phù hợp.</p>
        <p className="mg-empty-hint">Thử xóa bộ lọc hoặc thay đổi từ khóa tìm kiếm.</p>
      </div>
    )
  }

  const savedCodes = new Set(moodboardItems.map((i) => i.maMrFabric))
  const totalPages = Math.ceil(materials.length / PAGE_SIZE)
  const paged = materials.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handlePageChange(p) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="mg-grid">
        {paged.map((m) => (
          <MaterialCard
            key={m.id}
            material={m}
            isSaved={savedCodes.has(m.maMrFabric)}
            onCardClick={onCardClick}
            onSave={onSave}
          />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
    </>
  )
}
