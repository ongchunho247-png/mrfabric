import { useState } from 'react'
import SingleProcessor from './SingleProcessor'
import DirectImporter from './DirectImporter'
import './FabricImageTool.css'

export default function FabricImageTool({ priceTable = [], nccCodes = {}, onSaveImages }) {
  const [mode, setMode] = useState('ai') // 'ai' | 'import'

  return (
    <div className="fit-wrap">
      <div className="fit-header">
        <h2 className="fit-title">Fabric Image Tool</h2>
        <p className="fit-subtitle">Xử lý và gán ảnh vải vào dữ liệu MrFabric — nhận diện mã NCC từ tên file, tách slot, lưu vào thư viện.</p>
      </div>

      <div className="fit-mode-tabs">
        <button
          className={`fit-mode-btn${mode === 'ai' ? ' fit-mode-btn--on' : ''}`}
          onClick={() => setMode('ai')}
        >Tạo ảnh AI</button>
        <button
          className={`fit-mode-btn${mode === 'import' ? ' fit-mode-btn--on' : ''}`}
          onClick={() => setMode('import')}
        >Import trực tiếp</button>
      </div>

      {mode === 'ai'
        ? <SingleProcessor priceTable={priceTable} nccCodes={nccCodes} onSaveImages={onSaveImages} />
        : <DirectImporter  priceTable={priceTable} onSaveImages={onSaveImages} />
      }
    </div>
  )
}
