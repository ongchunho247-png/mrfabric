import SingleProcessor from './SingleProcessor'
import './FabricImageTool.css'

export default function FabricImageTool({ priceTable = [], nccCodes = {}, onSaveImages }) {
  return (
    <div className="fit-wrap">
      <div className="fit-header">
        <h2 className="fit-title">Fabric Image Tool</h2>
        <p className="fit-subtitle">Xử lý và gán ảnh vải vào dữ liệu MrFabric — nhận diện mã NCC từ tên file, tách 6 slot, lưu vào thư viện.</p>
      </div>

      <SingleProcessor priceTable={priceTable} nccCodes={nccCodes} onSaveImages={onSaveImages} />
    </div>
  )
}
