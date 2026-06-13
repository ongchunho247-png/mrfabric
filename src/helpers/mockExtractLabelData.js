// Mock OCR – MVP: trả về rỗng vì chưa có OCR/AI thật.
// Sau này thay bằng API gọi AI Vision để đọc nhãn thật.
// Không tự đoán – nếu không đọc được trường nào, để rỗng.
export function mockExtractLabelData() {
  return {
    productLineId: '',
    tenDongSanPham: '',
    maNCC: '',
    tenMau: '',
    collection: '',
    nhaCungCap: '',
    nhomMau: '',
    toneMau: '',
    beMat: '',
    ungDung: [],
    congNang: [],
    phongCach: [],
    phanKhuc: '',
    khoVai: '',
    thanhPhan: '',
    tieuChuan: '',
    moTaNgan: '',
    ghiChuTuVan: '',
    ghiChuTuVanKTS: '',
    ghiChuTuVanSale: '',
    ghiChuNganGuiKhach: '',
  }
}
