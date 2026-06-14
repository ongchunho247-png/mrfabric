import { useState, useEffect } from 'react'
import { loadNccCodes, saveNccCodes, setNccEntry, removeNccCode } from '../../helpers/nccCodeStorage'
import { loadPriceTable, savePriceTable } from '../../helpers/priceTableStorage'
import { generateMrFabricCode } from '../../helpers/generateMrFabricCode'
import LibraryViewManager from './LibraryViewManager'
import PriceTableManager from './PriceTableManager'
import MaterialLibraryAdmin from './MaterialLibraryAdmin'
import VisibilityManager from './VisibilityManager'
import BatchImageUpdater from './BatchImageUpdater'
import FabricImageTool from './imageTool/FabricImageTool'
import ColorDictEditor from './ColorDictEditor'
import './AdminPage.css'

export default function AdminPage({ allMaterials, adminMaterials, setAdminMaterials, onGoToLibrary, onUpdateMaterialImage }) {
  const [adminTab, setAdminTab] = useState('price-table')
  const [nccCodes, setNccCodes] = useState(() => loadNccCodes())
  const [priceTable, setPriceTable] = useState(() => loadPriceTable())

  // ── Upload entry lên thư viện ────────────────────────────────────────────────
  function handleUploadEntry(entry) {
    const maMrFabric = entry._previewCode || generateMrFabricCode(allMaterials, {
      nhaCungCap: entry.nhaCungCap,
      nccCodes,
      catalogueNum: entry.catalogue || '',
      soTrang: entry.soTrang || '',
      productLineName: '',
    })
    const newMaterial = {
      id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      maMrFabric,
      maNCC: entry.maNCC || '',
      nhaCungCap: entry.nhaCungCap || '',
      collection: entry.tenCuon || '',
      catalogueNum: entry.catalogue || '',
      soTrang: entry.soTrang || '',
      giaMua: entry.giaMua || '',
      giaBan: entry.giaBanVai || '',
      giaBanRem: entry.giaBanRem || '',
      thanhPhan: entry.thanhPhan || '',
      khoVai: entry.khoVai || '',
      nhomVatLieu: entry.nhomVatLieu || '',
      beMat: Array.isArray(entry.beMat) ? entry.beMat : (entry.beMat ? [entry.beMat] : []),
      nhomMau: entry.nhomMau || '',
      tenDongSanPham: entry.dongSanPham || '',
      congNang: entry.dongSanPham ? [entry.dongSanPham] : (Array.isArray(entry.congNang) ? entry.congNang : (entry.congNang ? [entry.congNang] : [])),
      trangThai: 'active',
      hashtag: [],
      images: {},
      source: { type: 'price-table', createdAt: new Date().toISOString() },
    }
    setAdminMaterials((prev) => {
      const next = [...prev, newMaterial]
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  }

  // ── Gỡ bỏ vật liệu khỏi thư viện theo maNCC ─────────────────────────────────
  function handleRemoveByMaNCC(maNCC) {
    const q = (maNCC || '').trim().toLowerCase()
    setAdminMaterials((prev) => {
      const next = prev.map((m) =>
        !m.deletedAt && (m.maNCC || '').trim().toLowerCase() === q
          ? { ...m, deletedAt: Date.now() }
          : m,
      )
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  }

  // ── Xóa / khôi phục vật liệu ──────────────────────────────────────────────
  function handleSoftDelete(id) {
    setAdminMaterials((prev) => {
      const next = prev.map((m) => m.id === id ? { ...m, deletedAt: Date.now() } : m)
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  }

  function handleSoftDeleteMany(ids) {
    const idSet = new Set(ids)
    setAdminMaterials((prev) => {
      const now = Date.now()
      const next = prev.map((m) => idSet.has(m.id) && !m.deletedAt ? { ...m, deletedAt: now } : m)
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  }

  function handleRestoreDeleted(id) {
    setAdminMaterials((prev) => {
      const next = prev.map((m) => {
        if (m.id !== id) return m
        const { deletedAt, ...rest } = m
        return rest
      })
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  }

  function handlePermanentDelete(id) {
    setAdminMaterials((prev) => {
      const next = prev.filter((m) => m.id !== id)
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  }

  function handlePermanentDeleteMany(ids) {
    const idSet = new Set(ids)
    setAdminMaterials((prev) => {
      const next = prev.filter((m) => !idSet.has(m.id))
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  }

  // ── Backfill tenDongSanPham/congNang cho các materials đã upload trước đây ──────
  useEffect(() => {
    const needsUpdate = adminMaterials.some(
      (m) => m.maNCC && !m.tenDongSanPham && !m.deletedAt,
    )
    if (!needsUpdate) return
    const ptByMaNCC = {}
    for (const e of priceTable) {
      if (e.maNCC && e.dongSanPham && !ptByMaNCC[e.maNCC]) ptByMaNCC[e.maNCC] = e
    }
    setAdminMaterials((prev) => {
      let changed = false
      const next = prev.map((m) => {
        if (!m.maNCC || m.tenDongSanPham) return m
        const ptEntry = ptByMaNCC[m.maNCC]
        if (!ptEntry?.dongSanPham) return m
        changed = true
        return {
          ...m,
          tenDongSanPham: ptEntry.dongSanPham,
          congNang: m.congNang?.length ? m.congNang : [ptEntry.dongSanPham],
        }
      })
      if (!changed) return prev
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Xóa entries rác do syncPriceTableToLibrary cũ tạo ra (id bắt đầu bằng "pt-pt-") ─
  useEffect(() => {
    const hasJunk = adminMaterials.some((m) => m.id?.startsWith('pt-pt-'))
    if (!hasJunk) return
    setAdminMaterials((prev) => {
      const next = prev.filter((m) => !m.id?.startsWith('pt-pt-'))
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Lưu ảnh đã xử lý từ Fabric Image Tool vào adminMaterials ────────────────
  function handleSaveFabricImages(maNCC, slotImages) {
    // slotImages: { surface_texture: dataUrl, main_hand_image: dataUrl, … }
    // Ảnh nên được nén trước khi gọi để tránh localStorage quota
    const key = (maNCC || '').trim().toLowerCase()
    setAdminMaterials((prev) => {
      const existingIdx = prev.findIndex(
        (m) => !m.deletedAt && (m.maNCC || '').trim().toLowerCase() === key,
      )
      const existing = existingIdx >= 0 ? prev[existingIdx] : null
      const updatedImages = {
        ...(existing?.images || {}),
        ...Object.fromEntries(
          Object.entries(slotImages).map(([k, url]) => [k, { path: url }]),
        ),
      }
      let next
      if (existing) {
        next = [...prev]
        next[existingIdx] = { ...existing, images: updatedImages }
      } else {
        const newMat = {
          id: `fit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          maNCC,
          images: updatedImages,
          trangThai: 'active',
          source: { type: 'fabric-image-tool', createdAt: new Date().toISOString() },
        }
        next = [...prev, newMat]
      }
      try {
        localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      } catch (e) {
        console.error('[handleSaveFabricImages] localStorage quota exceeded:', e)
      }
      return next
    })
  }

  // ── Auto-purge materials deleted > 30 days ago ─────────────────────────────
  useEffect(() => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const toDelete = adminMaterials.filter((m) => m.deletedAt && (now - m.deletedAt) >= THIRTY_DAYS_MS)
    if (!toDelete.length) return
    const ids = new Set(toDelete.map((m) => m.id))
    setAdminMaterials((prev) => {
      const next = prev.filter((m) => !ids.has(m.id))
      localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-title">Admin</h1>
            <p className="admin-subtitle">Quản lý vật liệu trong thư viện MrFabric.</p>
          </div>
          <button className="btn btn-secondary" onClick={onGoToLibrary}>← Thư viện</button>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab-btn${adminTab === 'price-table' ? ' admin-tab-btn--active' : ''}`}
            onClick={() => setAdminTab('price-table')}
          >
            Bảng đơn giá
            <span className="admin-tab-count">{Object.keys(nccCodes).length} NCC</span>
          </button>
          <button
            className={`admin-tab-btn${adminTab === 'lib-overview' ? ' admin-tab-btn--active' : ''}`}
            onClick={() => setAdminTab('lib-overview')}
          >
            Thư viện tổng hợp
            <span className="admin-tab-count">{priceTable.filter((e) => !e.deletedAt).length}</span>
          </button>
          <button
            className={`admin-tab-btn${adminTab === 'library-views' ? ' admin-tab-btn--active' : ''}`}
            onClick={() => setAdminTab('library-views')}
          >
            Cài đặt Thư viện
          </button>
          <button
            className={`admin-tab-btn${adminTab === 'fabric-image-tool' ? ' admin-tab-btn--active' : ''}`}
            onClick={() => setAdminTab('fabric-image-tool')}
          >
            Fabric Image Tool
          </button>
          <button
            className={`admin-tab-btn${adminTab === 'color-dict' ? ' admin-tab-btn--active' : ''}`}
            onClick={() => setAdminTab('color-dict')}
          >
            Bảng màu AI
          </button>
        </div>

        {adminTab === 'price-table' && (
          <PriceTableManager
            priceTable={priceTable}
            onUpdate={(updated) => { setPriceTable(updated); savePriceTable(updated) }}
            nccCodes={nccCodes}
            allMaterials={allMaterials}
            onAddNcc={(name, code) => {
              const updated = setNccEntry(nccCodes, name, code, code)
              setNccCodes(updated); saveNccCodes(updated)
            }}
            onUpdateNcc={(name, code) => {
              const updated = setNccEntry(nccCodes, name, code, code)
              setNccCodes(updated); saveNccCodes(updated)
            }}
            onDeleteNcc={(name) => {
              const updated = removeNccCode(nccCodes, name)
              setNccCodes(updated); saveNccCodes(updated)
            }}
            onSetVariantGroup={(maNCC, nhomVatLieu) => {
              const q = maNCC.trim().toLowerCase()
              setAdminMaterials((prev) => {
                const next = prev.map((m) =>
                  (m.maNCC || '').trim().toLowerCase() === q ? { ...m, nhomVatLieu } : m,
                )
                localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
                return next
              })
            }}
            onUploadEntry={handleUploadEntry}
            onRemoveByMaNCC={handleRemoveByMaNCC}
            onUpdateMaterialByMaNCC={(maNCC, updates) => {
              const q = maNCC.trim().toLowerCase()
              setAdminMaterials((prev) => {
                const next = prev.map((m) =>
                  (m.maNCC || '').trim().toLowerCase() === q ? { ...m, ...updates } : m,
                )
                localStorage.setItem('mrfabric_admin_materials', JSON.stringify(next))
                return next
              })
            }}
          />
        )}

        {adminTab === 'visibility' && (
          <VisibilityManager
            allMaterials={allMaterials}
            onSoftDelete={handleSoftDelete}
            onSoftDeleteMany={handleSoftDeleteMany}
            onRestoreDeleted={handleRestoreDeleted}
            onPermanentDelete={handlePermanentDelete}
            onPermanentDeleteMany={handlePermanentDeleteMany}
          />
        )}

        {adminTab === 'library-views' && (
          <LibraryViewManager />
        )}

        {adminTab === 'lib-overview' && (
          <>
            <BatchImageUpdater
              allMaterials={allMaterials}
              onUpdateImage={onUpdateMaterialImage}
            />
            <MaterialLibraryAdmin priceTable={priceTable} nccCodes={nccCodes} />
          </>
        )}

        {adminTab === 'fabric-image-tool' && (
          <FabricImageTool
            priceTable={priceTable}
            nccCodes={nccCodes}
            onSaveImages={handleSaveFabricImages}
          />
        )}

        {adminTab === 'color-dict' && (
          <ColorDictEditor />
        )}
      </div>
    </div>
  )
}
