import { useState, useMemo } from 'react'
import {
  loadHiddenGroups, toggleHideGroup, isGroupHidden,
  loadHiddenNccs, toggleHideNcc, isNccHidden,
  loadHiddenCollections, toggleHideCollection, isCollectionHidden,
  loadHiddenItems, toggleHideMaterial,
} from '../../helpers/materialVisibilityStorage'
import './VisibilityManager.css'

function daysLeft(deletedAt) {
  return Math.max(0, 30 - Math.floor((Date.now() - deletedAt) / (24 * 60 * 60 * 1000)))
}

export default function VisibilityManager({
  allMaterials, onSoftDelete, onSoftDeleteMany, onRestoreDeleted, onPermanentDelete, onPermanentDeleteMany,
}) {
  const [hiddenNccs, setHiddenNccs] = useState(() => loadHiddenNccs())
  const [hiddenCollections, setHiddenCollections] = useState(() => loadHiddenCollections())
  const [hiddenGroups, setHiddenGroups] = useState(() => loadHiddenGroups())
  const [hiddenItems, setHiddenItems] = useState(() => loadHiddenItems())
  const [openNccs, setOpenNccs] = useState({})
  const [openCols, setOpenCols] = useState({})
  const [openGroups, setOpenGroups] = useState({})
  const [trashOpen, setTrashOpen] = useState(false)

  const uploaded = useMemo(() => allMaterials.filter((m) => !m.deletedAt), [allMaterials])
  const trashed = useMemo(
    () => allMaterials.filter((m) => m.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt),
    [allMaterials],
  )

  // 4-level tree: ncc → collection → group → [materials]
  const tree = useMemo(() => {
    const map = {}
    for (const m of uploaded) {
      const ncc = m.nhaCungCap || '(Chưa có NCC)'
      const col = m.collection || '(Chưa có cuốn mẫu)'
      const grp = m.nhomVatLieu || '(Chưa nhóm)'
      if (!map[ncc]) map[ncc] = {}
      if (!map[ncc][col]) map[ncc][col] = {}
      if (!map[ncc][col][grp]) map[ncc][col][grp] = []
      map[ncc][col][grp].push(m)
    }
    return map
  }, [uploaded])

  const nccList = useMemo(() => Object.keys(tree).sort(), [tree])
  const hiddenItemsSet = useMemo(() => new Set(hiddenItems), [hiddenItems])

  // Visibility toggles
  function toggleNcc(ncc) { setHiddenNccs(toggleHideNcc(ncc)) }
  function toggleCol(col) { setHiddenCollections(toggleHideCollection(col)) }
  function toggleGrp(grp) { setHiddenGroups(toggleHideGroup(grp)) }
  function toggleItem(code) { setHiddenItems(toggleHideMaterial(code)) }

  // Accordion toggles
  function flipNcc(ncc) { setOpenNccs((p) => ({ ...p, [ncc]: !p[ncc] })) }
  function flipCol(key) { setOpenCols((p) => ({ ...p, [key]: !p[key] })) }
  function flipGrp(key) { setOpenGroups((p) => ({ ...p, [key]: !p[key] })) }

  // Collect ids for bulk soft-delete
  function nccIds(ncc) {
    return Object.values(tree[ncc] || {})
      .flatMap((colData) => Object.values(colData).flat())
      .map((m) => m.id)
  }
  function colIds(ncc, col) {
    return Object.values(tree[ncc]?.[col] || {}).flat().map((m) => m.id)
  }
  function grpIds(ncc, col, grp) {
    return (tree[ncc]?.[col]?.[grp] || []).map((m) => m.id)
  }

  function confirmDelete(ids, label) {
    if (!ids.length) return
    if (window.confirm(`Xóa ${ids.length} vật liệu trong "${label}"?\nCó thể khôi phục trong 30 ngày.`))
      onSoftDeleteMany?.(ids)
  }

  return (
    <div className="vis-mgr">
      <div className="vis-header">
        <h2 className="vis-title">Quản lý Cây thư mục</h2>
        <p className="vis-subtitle">Ẩn hoặc xóa theo NCC → Cuốn mẫu → Nhóm biến thể → Vật liệu.</p>
      </div>

      {nccList.length === 0 && trashed.length === 0 ? (
        <div className="vis-empty">Chưa có vật liệu nào trong thư viện.</div>
      ) : (
        <div className="vis-ncc-list">
          {nccList.map((ncc) => {
            const nccHidden = isNccHidden(ncc)
            const nccOpen = !!openNccs[ncc]
            const colMap = tree[ncc]
            const colList = Object.keys(colMap).sort()
            const totalMats = colList.reduce((s, col) => s + Object.values(colMap[col]).flat().length, 0)

            return (
              <div key={ncc} className={`vis-ncc${nccHidden ? ' vis-ncc--hidden' : ''}`}>
                {/* Level 1: NCC */}
                <div className="vis-ncc-head">
                  <button className="vis-expand-btn" onClick={() => flipNcc(ncc)}>
                    {nccOpen ? '▼' : '▶'}
                  </button>
                  <span className="vis-ncc-name">{ncc}</span>
                  <span className="vis-ncc-meta">{colList.length} cuốn · {totalMats} vật liệu</span>
                  <button
                    className={`vis-toggle-btn${nccHidden ? ' vis-toggle-btn--hidden' : ''}`}
                    onClick={() => toggleNcc(ncc)}
                  >{nccHidden ? '🚫 Đang ẩn' : '👁 Hiện'}</button>
                  <button
                    className="vis-del-all-btn"
                    onClick={() => confirmDelete(nccIds(ncc), ncc)}
                    title="Xóa toàn bộ vật liệu trong NCC này"
                  >🗑</button>
                </div>

                {/* Level 2: Collections */}
                {nccOpen && (
                  <div className="vis-cols">
                    {colList.map((col) => {
                      const colHidden = isCollectionHidden(col)
                      const colKey = `${ncc}::${col}`
                      const colOpen = !!openCols[colKey]
                      const grpMap = colMap[col]
                      const grpList = Object.keys(grpMap).sort()
                      const colTotal = grpList.reduce((s, g) => s + grpMap[g].length, 0)

                      return (
                        <div key={col} className={`vis-col${colHidden ? ' vis-col--hidden' : ''}`}>
                          <div className="vis-col-head">
                            <button className="vis-expand-btn vis-expand-btn--sm" onClick={() => flipCol(colKey)}>
                              {colOpen ? '▼' : '▶'}
                            </button>
                            <span className="vis-col-name">{col}</span>
                            <span className="vis-col-meta">{grpList.length} nhóm · {colTotal} vật liệu</span>
                            <button
                              className={`vis-toggle-btn vis-toggle-btn--sm${colHidden ? ' vis-toggle-btn--hidden' : ''}`}
                              onClick={() => toggleCol(col)}
                            >{colHidden ? '🚫 Ẩn' : '👁 Hiện'}</button>
                            <button
                              className="vis-del-all-btn"
                              onClick={() => confirmDelete(colIds(ncc, col), col)}
                              title="Xóa toàn bộ vật liệu trong cuốn này"
                            >🗑</button>
                          </div>

                          {/* Level 3: Groups */}
                          {colOpen && (
                            <div className="vis-groups">
                              {grpList.map((grp) => {
                                const grpHidden = isGroupHidden(grp)
                                const grpKey = `${ncc}::${col}::${grp}`
                                const grpOpen = !!openGroups[grpKey]
                                const mats = grpMap[grp]

                                return (
                                  <div key={grp} className={`vis-group${grpHidden ? ' vis-group--hidden' : ''}`}>
                                    <div className="vis-group-head">
                                      <button className="vis-expand-btn vis-expand-btn--sm" onClick={() => flipGrp(grpKey)}>
                                        {grpOpen ? '▼' : '▶'}
                                      </button>
                                      <span className="vis-group-name">{grp}</span>
                                      <span className="vis-group-count">{mats.length} vật liệu</span>
                                      <button
                                        className={`vis-toggle-btn vis-toggle-btn--sm${grpHidden ? ' vis-toggle-btn--hidden' : ''}`}
                                        onClick={() => toggleGrp(grp)}
                                      >{grpHidden ? '🚫 Ẩn' : '👁 Hiện'}</button>
                                      <button
                                        className="vis-del-all-btn"
                                        onClick={() => confirmDelete(grpIds(ncc, col, grp), grp)}
                                        title="Xóa toàn bộ vật liệu trong nhóm này"
                                      >🗑</button>
                                    </div>

                                    {/* Level 4: Items */}
                                    {grpOpen && (
                                      <div className="vis-children">
                                        {mats.map((m) => {
                                          const code = m.maMrFabric || m.id
                                          const itemHidden = hiddenItemsSet.has(code)
                                          return (
                                            <div key={m.id} className="vis-child">
                                              <span className="vis-child-code">{code}</span>
                                              {m.maNCC && <span className="vis-child-ncc">{m.maNCC}</span>}
                                              <span className="vis-child-spacer" />
                                              <button
                                                className={`vis-item-toggle${itemHidden ? ' vis-item-toggle--hidden' : ''}`}
                                                onClick={() => toggleItem(code)}
                                                title={itemHidden ? 'Đang ẩn — click để hiện' : 'Click để ẩn'}
                                              >{itemHidden ? '🚫' : '👁'}</button>
                                              <button
                                                className="vis-del-btn"
                                                onClick={() => {
                                                  if (window.confirm(`Xóa "${code}"?\nCó thể khôi phục trong 30 ngày.`))
                                                    onSoftDelete?.(m.id)
                                                }}
                                                title="Xóa (có thể khôi phục)"
                                              >🗑</button>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Thùng rác */}
      {trashed.length > 0 && (
        <div className="vis-trash">
          <div className="vis-trash-head">
            <button className="vis-trash-toggle" onClick={() => setTrashOpen((v) => !v)}>
              <span>🗑 Thùng rác ({trashed.length})</span>
              <span className="vis-trash-toggle-icon">{trashOpen ? '▲' : '▼'}</span>
            </button>
            <button
              className="vis-perm-del-all-btn"
              onClick={() => {
                if (window.confirm(`Xóa vĩnh viễn tất cả ${trashed.length} vật liệu trong thùng rác?\nThao tác này không thể hoàn tác!`))
                  onPermanentDeleteMany?.(trashed.map((m) => m.id))
              }}
              title="Xóa vĩnh viễn toàn bộ thùng rác"
            >Xóa vĩnh viễn tất cả</button>
          </div>
          {trashOpen && (
            <div className="vis-trash-list">
              <p className="vis-trash-hint">Vật liệu đã xóa sẽ tự động xóa vĩnh viễn sau 30 ngày.</p>
              {trashed.map((m) => {
                const days = daysLeft(m.deletedAt)
                return (
                  <div key={m.id} className="vis-trash-row">
                    <div className="vis-trash-info">
                      <span className="vis-trash-code">{m.maMrFabric || m.id}</span>
                      {m.maNCC && <span className="vis-child-ncc">{m.maNCC}</span>}
                      {m.nhaCungCap && <span className="vis-trash-nha">{m.nhaCungCap}</span>}
                    </div>
                    <span className={`vis-trash-days${days <= 7 ? ' vis-trash-days--warn' : ''}`}>
                      {days} ngày còn lại
                    </span>
                    <div className="vis-trash-actions">
                      <button className="vis-restore-btn" onClick={() => onRestoreDeleted?.(m.id)}>
                        ↩ Khôi phục
                      </button>
                      <button
                        className="vis-perm-del-btn"
                        onClick={() => {
                          if (window.confirm(`Xóa vĩnh viễn "${m.maMrFabric || m.maNCC}"?\nKhông thể hoàn tác.`))
                            onPermanentDelete?.(m.id)
                        }}
                      >Xóa vĩnh viễn</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
