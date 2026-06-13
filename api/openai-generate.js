import OpenAI from 'openai'

const SYSTEM_INSTRUCTION = `Bạn là trợ lý AI cho app MrFabric — hệ thống quản lý thư viện vật liệu vải.
Nhiệm vụ: hỗ trợ tạo nội dung/prompt xử lý ảnh vật liệu vải cho admin.
Nguyên tắc:
- Luôn ưu tiên đúng chất liệu, đúng texture, đúng mã NCC, không tự bịa dữ liệu sản phẩm.
- surface_texture là nguồn chính cho mọi ảnh ứng dụng.
- Không tạo họa tiết mới, không thay đổi pattern sẵn có.
- Giữ rõ vân vải trong mọi ảnh output.
- Ảnh sofa phải có gối và rõ vân vật liệu trên sofa + gối.
- Ảnh rèm phải rõ vân vải khi ánh sáng chiếu tới.
- Ảnh tay phụ nữ cầm vải phải đa góc để tránh lặp lại.
- Ảnh thước phải rõ tỉ lệ sợi và cấu trúc vải.
Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt trừ khi yêu cầu tiếng Anh.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      ok: false,
      error: 'Thiếu OPENAI_API_KEY trong Vercel Environment Variables.',
    })
  }

  try {
    const {
      type = 'text',
      prompt,
      nccCode,
      color,
      surfaceTextureUrl,
      scaleMetadata,
    } = req.body || {}

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Thiếu prompt.' })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const userInput = `Loại yêu cầu: ${type}
Mã NCC: ${nccCode || '(chưa có)'}
Màu: ${color || '(chưa có)'}
Surface texture: ${surfaceTextureUrl ? '(có)' : '(chưa có)'}
Scale metadata: ${JSON.stringify(scaleMetadata || {})}

Yêu cầu:
${prompt}`

    const response = await client.responses.create({
      model: 'gpt-5.5',
      input: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: userInput },
      ],
    })

    return res.status(200).json({ ok: true, type, result: response.output_text })
  } catch (error) {
    console.error('[OpenAI]', error?.message || error)
    return res.status(500).json({ ok: false, error: error?.message || 'Lỗi khi gọi OpenAI API.' })
  }
}
