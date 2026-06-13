// Đọc nhãn vật liệu vải bằng Claude Vision API
// API key được inject server-side qua middleware — không bao giờ expose ra browser
// Cấu hình: thêm CLAUDE_API_KEY= vào file .env.local

const EXTRACTION_PROMPT = `Đây là ảnh nhãn sản phẩm vải nội thất. Hãy đọc và trích xuất CHÍNH XÁC thông tin nhìn thấy được trên nhãn.

QUY TẮC BẮT BUỘC:
- Chỉ điền thông tin thực sự nhìn thấy rõ ràng trên ảnh
- Nếu không thấy hoặc không chắc chắn → để rỗng ""
- TUYỆT ĐỐI không đoán, không suy diễn, không bịa đặt
- Giữ nguyên cách viết trên nhãn: HOA/thường, số, dấu gạch ngang, khoảng trắng
- Với font đặc biệt hoặc chữ nhỏ: đọc chậm từng ký tự, phân biệt kỹ O/0, I/1/l, S/5, B/8

Trả về đúng JSON sau đây (và chỉ JSON, không có text khác):
{
  "nhaCungCap": "",
  "maNCC": "",
  "collection": "",
  "tenMau": "",
  "khoVai": "",
  "thanhPhan": "",
  "tieuChuan": "",
  "nhomMau": "",
  "beMat": ""
}

Giải thích từng trường — đọc RẤT CẨN THẬN nhãn (label) trên ảnh để lấy đúng giá trị:

- nhaCungCap: tên thương hiệu / nhà sản xuất / supplier — thường là tên lớn nổi bật nhất trên nhãn, hoặc sau nhãn "Brand:", "Supplier:", "Manufacturer:"

- maNCC: mã sản phẩm của nhà cung cấp — CHỈ điền khi trên nhãn có một trong các từ khóa: "Article:", "Art.No:", "Art No:", "Item No:", "Item:", "Code:", "Ref:", "Product No:", "SKU:". KHÔNG lấy giá trị từ dòng "Collection:", "Design:", "Serie:". Đọc từng ký tự cẩn thận, đặc biệt phân biệt số 1 và chữ l.

- collection: tên bộ sưu tập — CHỈ lấy từ dòng có nhãn "Collection:", "Collection :", "Serie:", "Serie :", "Line:". Ví dụ: nếu nhãn ghi "Collection : A15-8" thì collection = "A15-8". KHÔNG lấy từ dòng "Design:", "Style:". Đọc từng ký tự chính xác, phân biệt kỹ "A15" ≠ "A115", "1" ≠ "11".

- tenMau: tên màu — CHỈ lấy từ dòng có nhãn "Color:", "Colour:", "Colore:", "Farbe:", "Couleur:". KHÔNG đoán màu từ ảnh vải.

- khoVai: khổ vải — thường là số + đơn vị cm hoặc inch, VD: "280 cm - 110\"", "Width: 280cm", "W: 280"

- thanhPhan: thành phần vải — chuỗi phần trăm, VD: "100% Polyester", "30% Linen - 70% Polyester"

- tieuChuan: chứng nhận / tiêu chuẩn / grade kỹ thuật — VD: "OEKO-TEX Standard 100", "Grade 4-6", "ISO 9001", "CE"

- nhomMau: nhóm màu sắc — suy luận từ tên màu (tenMau) hoặc dòng chữ "Color:" trên nhãn. Trả về màu đơn giản tiếng Việt: "Be", "Trắng", "Xám", "Nâu", "Xanh", "Đen", "Hồng", "Vàng". Nếu không xác định được → để rỗng "".

- beMat: bề mặt / kết cấu vải — lấy từ tên sản phẩm hoặc mô tả trên nhãn. VD: "Linen Look", "Jacquard", "Velvet", "Sheer", "Blackout", "Dimout". Nếu không có thông tin → để rỗng "".

LƯU Ý QUAN TRỌNG về đọc mã chữ-số (như A15-8, KC-03, B112):
- Đọc chậm từng ký tự một
- "A15-8": A → 1 → 5 → dấu gạch → 8 (không phải A115-8)
- Phân biệt rõ: chữ O ≠ số 0, chữ I/l ≠ số 1, chữ S ≠ số 5, chữ B ≠ số 8`

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function emptyData() {
  return {
    nhaCungCap: '', maNCC: '', collection: '', tenMau: '',
    khoVai: '', thanhPhan: '', tieuChuan: '',
    nhomMau: '', beMat: '',
  }
}

function parseClaudeResponse(text) {
  const clean = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

export async function readLabelFromImage(imageFile) {
  try {
    const base64 = await fileToBase64(imageFile)
    const mediaType = imageFile.type || 'image/jpeg'

    const res = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 640,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              { type: 'text', text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
    })

    if (res.status === 401) {
      return {
        success: false,
        reason: 'no_api_key',
        message: 'Chưa cấu hình CLAUDE_API_KEY trong .env.local. Tiếp tục điền thủ công.',
        data: emptyData(),
      }
    }

    if (!res.ok) {
      return {
        success: false,
        reason: 'api_error',
        message: `Lỗi API (${res.status}). Tiếp tục điền thủ công.`,
        data: emptyData(),
      }
    }

    const json = await res.json()
    const text = json.content?.[0]?.text || ''

    if (!text) {
      return {
        success: false,
        reason: 'empty_response',
        message: 'Không nhận được kết quả từ AI. Tiếp tục điền thủ công.',
        data: emptyData(),
      }
    }

    const parsed = parseClaudeResponse(text)

    const nonEmpty = Object.values(parsed).filter((v) => v && v.trim()).length
    return {
      success: true,
      fieldsFound: nonEmpty,
      message:
        nonEmpty > 0
          ? `Đọc được ${nonEmpty} trường từ nhãn. Kiểm tra và bổ sung thông tin còn lại.`
          : 'Không đọc được thông tin nào từ nhãn. Vui lòng điền thủ công.',
      data: parsed,
    }
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      return {
        success: false,
        reason: 'network',
        message: 'Không kết nối được API. Kiểm tra CLAUDE_API_KEY trong .env.local.',
        data: emptyData(),
      }
    }
    return {
      success: false,
      reason: 'parse_error',
      message: 'Không phân tích được kết quả từ AI. Tiếp tục điền thủ công.',
      data: emptyData(),
    }
  }
}
