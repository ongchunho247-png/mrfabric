import { useState } from 'react'
import SingleProcessor from './SingleProcessor'
import BatchProcessor from './BatchProcessor'
import './FabricImageTool.css'

/**
 * Fabric Image Tool — trang admin xử lý ảnh vải.
 * Props:
 *   priceTable   — danh sách bảng đơn giá (để tra mã NCC)
 *   nccCodes     — object map NCC (để hiển thị thông tin nhà cung cấp)
 *   onSaveImages — callback(maNCC, slotImages) để lưu ảnh vào adminMaterials
 */
export default function FabricImageTool({ priceTable = [], nccCodes = {}, onSaveImages }) {
  const [mode, setMode] = useState('single')

  return (
    <div className="fit-wrap">
      <div className="fit-header">
        <h2 className="fit-title">Fabric Image Tool</h2>
        <p className="fit-subtitle">Xử lý và gán ảnh vải vào dữ liệu MrFabric — nhận diện mã NCC từ tên file, tách 6 slot, lưu vào thư viện.</p>

        <div className="fit-mode-tabs">
          <button
            className={`fit-mode-btn${mode === 'single' ? ' fit-mode-btn--on' : ''}`}
            onClick={() => setMode('single')}
          >
            Chế độ A — 1 ảnh
          </button>
          <button
            className={`fit-mode-btn${mode === 'batch' ? ' fit-mode-btn--on' : ''}`}
            onClick={() => setMode('batch')}
          >
            Chế độ B — Hàng loạt
          </button>
        </div>
      </div>

      {mode === 'single' ? (
        <SingleProcessor priceTable={priceTable} nccCodes={nccCodes} onSaveImages={onSaveImages} />
      ) : (
        <BatchProcessor priceTable={priceTable} nccCodes={nccCodes} onSaveImages={onSaveImages} />
      )}
    </div>
  )
}
