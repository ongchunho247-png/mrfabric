import OpenAI from 'openai'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST' })
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ ok: false, error: 'Thiếu OPENAI_API_KEY.' })
  }

  try {
    const { imageUrl } = req.body || {}
    if (!imageUrl) return res.status(400).json({ ok: false, error: 'Thiếu imageUrl.' })

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            {
              type: 'text',
              text: `Analyze this fabric image carefully for any ruler, measuring tape, or scale bar.

Return ONLY valid JSON (no markdown fences, no text outside JSON):
{
  "ruler_detected": true or false,
  "confidence": "high", "medium", or "low",
  "unit": "cm" or "mm",
  "range_start": number or null,
  "range_end": number or null,
  "pixel_per_mm": number or null,
  "orientation": "horizontal" or "vertical" or null,
  "message_vn": "Mô tả ngắn bằng tiếng Việt"
}

Rules:
- ruler_detected = true only if you clearly see a ruler/measuring tape with visible markings.
- range_start = first visible number on ruler (usually 0 or 1).
- range_end = last visible number (e.g. 15 if ruler shows 0-15cm).
- pixel_per_mm = estimate the pixel width of 1mm based on the ruler markings (null if unsure).
- confidence = "high" if ruler and scale are clearly readable; "medium" if partially visible; "low" if unclear.
- If no ruler: ruler_detected=false, all numeric fields null.
- message_vn examples: "Phát hiện thước 15cm theo chiều ngang, độ tin cậy cao." or "Không tìm thấy thước đo trong ảnh."`,
            },
          ],
        },
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    let data
    try {
      data = JSON.parse(response.choices[0]?.message?.content || '{}')
    } catch {
      data = { ruler_detected: false, confidence: 'low', message_vn: 'Không phân tích được kết quả.' }
    }

    return res.status(200).json({ ok: true, ...data })
  } catch (error) {
    console.error('[detect-ruler]', error?.message)
    return res.status(500).json({ ok: false, error: error?.message || 'Lỗi phát hiện thước.' })
  }
}
