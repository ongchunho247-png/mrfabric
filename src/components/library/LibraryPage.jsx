import { useState, useMemo } from 'react'
import { filterMaterials } from '../../helpers/filterMaterials'
import { getFilterGroups } from '../../helpers/getFilterOptions'
import { addToMoodboard, removeFromMoodboard } from '../../helpers/moodboardStorage'
import { loadLibraryViews, saveLibraryViews } from '../../helpers/libraryViewStorage'
import { loadPriceTable } from '../../helpers/priceTableStorage'
import { loadNccCodes, getNccCode } from '../../helpers/nccCodeStorage'
import { getProductTypeCode } from '../../helpers/generateMrFabricCode'
import { filterByVisibility } from '../../helpers/materialVisibilityStorage'
import SearchBar from './SearchBar'
import FilterPanel from './FilterPanel'
import MaterialGrid from './MaterialGrid'
import Moodboard from '../moodboard/Moodboard'
import MaterialDetailModal from './MaterialDetailModal'
import RecommendedSetPanel from './RecommendedSetPanel'
import './LibraryPage.css'

function buildMaMrFabric(nccCode, catalogue, soTrang, dongSanPham) {
  if (!nccCode) return null
  const typeCode = getProductTypeCode(dongSanPham)
  const cat = String(catalogue || '').replace(/\D/g, '').padStart(3, '0')
  const page = String(soTrang || '').replace(/\D/g, '').padStart(3, '0')
  if (cat === '000' && page === '000') return null
  return `MC-${nccCode}-${typeCode}${cat}${page}`
}

export default function LibraryPage({ allMaterials, moodboardItems, setMoodboardItems, onUpdateMaterialImage }) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [libraryConfig, setLibraryConfig] = useState(() => loadLibraryViews())

  // Load fresh from localStorage on mount (LibraryPage remounts on tab switch)
  const [priceTable] = useState(() => loadPriceTable())
  const [nccCodes] = useState(() => loadNccCodes())

  // Active view for role-based filter visibility
  const activeView = useMemo(() => {
    const v = libraryConfig.views.find((v) => v.id === libraryConfig.activeViewId)
    return v ?? libraryConfig.views[libraryConfig.views.length - 1]
  }, [libraryConfig])

  function handleViewChange(id) {
    setLibraryConfig((prev) => {
      const next = { ...prev, activeViewId: id }
      saveLibraryViews(next)
      return next
    })
    setFilters({})
    setSearch('')
  }

  // Build libraryMaterials directly from priceTable — always in sync with real data
  const libraryMaterials = useMemo(() => {
    // Build image/id lookup from allMaterials by maNCC and by id
    const adminByMaNCC = {}
    const adminById = {}
    for (const m of allMaterials) {
      if (!m.deletedAt) {
        if (m.maNCC) adminByMaNCC[m.maNCC.trim().toLowerCase()] = m
        adminById[m.id] = m
      }
    }

    const materials = priceTable
      .filter((e) => !e.deletedAt && !e.hidden)
      .map((e) => {
        const nccCode = getNccCode(nccCodes, e.nhaCungCap)
        const dsp = e.dongSanPham || ''
        const adminMat = adminById[e.id] || adminByMaNCC[(e.maNCC || '').trim().toLowerCase()]

        const maMrFabric =
          adminMat?.maMrFabric ||
          buildMaMrFabric(nccCode, e.catalogue, e.soTrang, dsp) ||
          e.maNCC ||
          e.id

        return {
          // Use adminMat id if it exists so image uploads still work
          id: adminMat?.id || e.id,
          maMrFabric,
          maNCC: e.maNCC || '',
          nhaCungCap: e.nhaCungCap || '',
          collection: e.tenCuon || '',
          nhomMau: e.nhomMau || '',
          toneMau: e.toneMau || '',
          beMat: Array.isArray(e.beMat) ? e.beMat : (e.beMat ? [e.beMat] : []),
          khoVai: e.khoVai || '',
          thanhPhan: e.thanhPhan || '',
          phanKhuc: e.phanKhuc || '',
          tenDongSanPham: dsp,
          congNang: dsp ? [dsp] : [],
          nhomVatLieu: e.nhomVatLieu || '',
          giaBan: e.giaBanVai || '',
          giaBanRem: e.giaBanRem || '',
          trangThai: 'active',
          images: adminMat?.images || {},
          soTrang: e.soTrang || '',
          catalogue: e.catalogue || '',
        }
      })

    return filterByVisibility(materials)
  }, [priceTable, nccCodes, allMaterials])

  // Filter groups from libraryMaterials, filtered by active view
  const allFilterGroups = useMemo(() => getFilterGroups(libraryMaterials), [libraryMaterials])
  const filterGroups = useMemo(() => {
    if (!activeView?.visibleFilters?.length) return allFilterGroups
    return allFilterGroups.filter((g) => activeView.visibleFilters.includes(g.key))
  }, [allFilterGroups, activeView])

  // Kết quả sau search + filter
  const filteredMaterials = useMemo(
    () => filterMaterials(libraryMaterials, { search, filters }),
    [libraryMaterials, search, filters],
  )

  // Build variant color strip map — all mã shown individually, no grouping
  const variantGroupsMap = useMemo(() => {
    const groups = {}
    for (const m of libraryMaterials) {
      if (m.nhomVatLieu) {
        if (!groups[m.nhomVatLieu]) groups[m.nhomVatLieu] = []
        groups[m.nhomVatLieu].push(m)
      }
    }
    return groups
  }, [libraryMaterials])

  function handleFilterChange(key, value, checked) {
    setFilters((prev) => {
      const current = prev[key] || []
      const updated = checked ? [...current, value] : current.filter((v) => v !== value)
      return { ...prev, [key]: updated }
    })
  }

  function handleClearFilters() {
    setSearch('')
    setFilters({})
  }

  function handleSaveToMoodboard(material) {
    setMoodboardItems((prev) => addToMoodboard(prev, material))
  }

  function handleRemoveFromMoodboard(maMrFabric) {
    setMoodboardItems((prev) => removeFromMoodboard(prev, maMrFabric))
  }

  function handleUpdateImage(materialId, imageKey, dataUrl) {
    onUpdateMaterialImage?.(materialId, imageKey, dataUrl)
    setSelectedMaterial((prev) => {
      if (prev?.id !== materialId) return prev
      return {
        ...prev,
        images: {
          ...(prev.images || {}),
          [imageKey]: { ...(prev.images?.[imageKey] || {}), path: dataUrl },
        },
      }
    })
  }

  const showPrice = activeView?.showPrice ?? true

  const hasActiveFilters =
    search.trim().length > 0 ||
    Object.values(filters).some((v) => v && v.length > 0)

  return (
    <div className="library-page">
      <div className="library-sidebar">
        {/* View selector — role-based filter visibility */}
        {libraryConfig.views.length > 1 && (
          <div className="lv-selector">
            <p className="lv-selector-label">Chế độ xem</p>
            <div className="lv-pills">
              {libraryConfig.views.map((v) => (
                <button
                  key={v.id}
                  className={`lv-pill${libraryConfig.activeViewId === v.id ? ' lv-pill--on' : ''}`}
                  onClick={() => handleViewChange(v.id)}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <FilterPanel
          filterGroups={filterGroups}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          hasActive={hasActiveFilters}
        />
        <RecommendedSetPanel items={moodboardItems} />
        <Moodboard
          items={moodboardItems}
          setItems={setMoodboardItems}
          allMaterials={libraryMaterials}
          onViewDetail={setSelectedMaterial}
          onRemove={handleRemoveFromMoodboard}
        />
      </div>

      <div className="library-content">
        <div className="library-count">
          {hasActiveFilters
            ? <span><strong>{filteredMaterials.length}</strong> / {libraryMaterials.length} vật liệu</span>
            : <span><strong>{libraryMaterials.length}</strong> vật liệu</span>
          }
        </div>
        <SearchBar value={search} onChange={setSearch} />
        <MaterialGrid
          materials={filteredMaterials}
          variantGroupsMap={variantGroupsMap}
          moodboardItems={moodboardItems}
          onCardClick={setSelectedMaterial}
          onSave={handleSaveToMoodboard}
        />
      </div>

      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          moodboardItems={moodboardItems}
          onSave={handleSaveToMoodboard}
          onClose={() => setSelectedMaterial(null)}
          onUpdateImage={handleUpdateImage}
          showPrice={showPrice}
          allMaterials={libraryMaterials}
          onSwitchVariant={setSelectedMaterial}
        />
      )}
    </div>
  )
}
