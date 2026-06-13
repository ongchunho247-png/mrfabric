import { useState } from 'react'
import { loadLibraryViews, saveLibraryViews, ALL_FILTER_KEYS } from '../../helpers/libraryViewStorage'
import './LibraryViewManager.css'

export default function LibraryViewManager() {
  const [config, setConfig] = useState(() => loadLibraryViews())

  function update(newConfig) {
    setConfig(newConfig)
    saveLibraryViews(newConfig)
  }

  function handleToggleFilter(viewId, filterKey) {
    update({
      ...config,
      views: config.views.map((v) => {
        if (v.id !== viewId) return v
        const has = v.visibleFilters.includes(filterKey)
        return {
          ...v,
          visibleFilters: has
            ? v.visibleFilters.filter((k) => k !== filterKey)
            : [...v.visibleFilters, filterKey],
        }
      }),
    })
  }

  function handleToggleShowPrice(viewId) {
    update({
      ...config,
      views: config.views.map((v) =>
        v.id !== viewId ? v : { ...v, showPrice: !(v.showPrice ?? true) }
      ),
    })
  }

  function handleToggleAll(viewId, on) {
    update({
      ...config,
      views: config.views.map((v) =>
        v.id !== viewId ? v : { ...v, visibleFilters: on ? ALL_FILTER_KEYS.map((f) => f.key) : [] }
      ),
    })
  }

  function handleRename(viewId, newName) {
    update({
      ...config,
      views: config.views.map((v) => (v.id === viewId ? { ...v, name: newName } : v)),
    })
  }

  function handleAddView() {
    const newView = {
      id: `view-${Date.now()}`,
      name: 'Kiểu xem mới',
      visibleFilters: ['nhomMau', 'beMat', 'phanKhuc'],
    }
    update({ ...config, views: [...config.views, newView] })
  }

  function handleDeleteView(viewId) {
    if (config.views.length <= 1) return
    const newViews = config.views.filter((v) => v.id !== viewId)
    const newActiveId = config.activeViewId === viewId ? newViews[0].id : config.activeViewId
    update({ ...config, views: newViews, activeViewId: newActiveId })
  }

  return (
    <div className="lvm-wrap">
      <div className="lvm-intro">
        <p className="section-title">Kiểu xem cho thư viện</p>
        <p className="lvm-hint">
          Mỗi kiểu xem quy định bộ lọc nào hiển thị với từng nhóm người dùng.
          Khách hàng/KTS xem bộ lọc đơn giản, Sale/Kinh doanh xem đầy đủ hơn.
        </p>
      </div>

      {config.views.map((view) => {
        const checkedCount = view.visibleFilters.length
        const allOn = checkedCount === ALL_FILTER_KEYS.length
        return (
          <div key={view.id} className="lvm-card">
            <div className="lvm-card-head">
              <input
                className="lvm-name-input"
                value={view.name}
                onChange={(e) => handleRename(view.id, e.target.value)}
                placeholder="Tên kiểu xem..."
              />
              <span className="lvm-filter-count">
                {checkedCount}/{ALL_FILTER_KEYS.length} bộ lọc
              </span>
              <button
                className="lvm-toggle-all"
                onClick={() => handleToggleAll(view.id, !allOn)}
                title={allOn ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              >
                {allOn ? 'Bỏ tất cả' : 'Chọn tất cả'}
              </button>
              {config.views.length > 1 && (
                <button
                  className="lvm-del-btn"
                  onClick={() => handleDeleteView(view.id)}
                  title="Xóa kiểu xem này"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="lvm-checks">
              <label className="lvm-check lvm-check--special">
                <input
                  type="checkbox"
                  checked={view.showPrice ?? true}
                  onChange={() => handleToggleShowPrice(view.id)}
                />
                <span>Hiển thị đơn giá</span>
              </label>
              {ALL_FILTER_KEYS.map(({ key, label }) => (
                <label key={key} className="lvm-check">
                  <input
                    type="checkbox"
                    checked={view.visibleFilters.includes(key)}
                    onChange={() => handleToggleFilter(view.id, key)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}

      <button className="btn btn-ghost lvm-add-btn" onClick={handleAddView}>
        + Thêm kiểu xem
      </button>
    </div>
  )
}
