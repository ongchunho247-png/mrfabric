export async function callOpenAI({ type, prompt, nccCode, color, surfaceTextureUrl, scaleMetadata }) {
  const response = await fetch('/api/openai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, prompt, nccCode, color, surfaceTextureUrl, scaleMetadata }),
  })

  const data = await response.json()
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Không gọi được OpenAI API.')
  }
  return data.result
}

export const AI_PROMPT_TYPES = [
  {
    type: 'sofa',
    label: 'Sofa',
    buildPrompt: ({ nccCode, color }) =>
      `Tạo prompt tiếng Anh cho ảnh ứng dụng sofa từ surface_texture vải mã ${nccCode || ''}${color ? ` màu ${color}` : ''}.
Yêu cầu: sofa phải có gối. Bề mặt sofa và gối phải rõ vân vật liệu vải.
Giữ đúng màu, texture, tỉ lệ sợi vải. Không tạo họa tiết mới.
Lighting: ánh sáng tự nhiên, studio trắng.`,
  },
  {
    type: 'curtain',
    label: 'Rèm',
    buildPrompt: ({ nccCode, color }) =>
      `Tạo prompt tiếng Anh cho ảnh ứng dụng rèm cửa từ surface_texture vải mã ${nccCode || ''}${color ? ` màu ${color}` : ''}.
Yêu cầu: rèm phải rõ vân vải khi ánh sáng chiếu tới, nếp gấp tự nhiên.
Giữ đúng màu, texture, tỉ lệ sợi vải. Không tạo họa tiết mới.`,
  },
  {
    type: 'hand',
    label: 'Tay cầm',
    buildPrompt: ({ nccCode, color }) =>
      `Tạo prompt tiếng Anh cho ảnh tay phụ nữ cầm mẫu vải mã ${nccCode || ''}${color ? ` màu ${color}` : ''}.
Yêu cầu: góc chụp đa dạng (không lặp lại), rõ vân vải, tay thanh lịch.
Nền sáng studio hoặc trắng. Phải rõ texture vải.`,
  },
  {
    type: 'ruler',
    label: 'Thước đo',
    buildPrompt: ({ nccCode, color }) =>
      `Tạo prompt tiếng Anh cho ảnh thước đo tỉ lệ sợi vải mã ${nccCode || ''}${color ? ` màu ${color}` : ''}.
Yêu cầu: rõ tỉ lệ sợi vải, có thước cm hoặc vật tham chiếu kích thước bên cạnh.
Macro shot, rõ từng sợi vải.`,
  },
  {
    type: 'detail',
    label: 'Chi tiết',
    buildPrompt: ({ nccCode, color }) =>
      `Tạo prompt tiếng Anh cho ảnh cận cảnh chi tiết vải mã ${nccCode || ''}${color ? ` màu ${color}` : ''}.
Yêu cầu: macro, rõ từng sợi vải, texture bề mặt, cấu trúc dệt. Không blur background.
Depth of field nông, focus vào texture.`,
  },
  {
    type: 'fabric_prompt',
    label: 'Ảnh 6 ô',
    buildPrompt: ({ nccCode, color }) =>
      `Tạo mô tả ngắn (tiếng Anh) cho bộ ảnh 6 ô (fabric_6_grid_A) của vải mã ${nccCode || ''}${color ? ` màu ${color}` : ''}.
6 ô: surface_texture / main_hand_image / sofa_image / curtain_image / ruler_image / detail_image.
Mỗi ô: purpose, composition gợi ý, lighting.`,
  },
  {
    type: 'text',
    label: 'Hỏi về vải',
    buildPrompt: ({ nccCode, color }) =>
      `Mô tả ngắn gọn về đặc điểm, ứng dụng và cách chụp ảnh tốt nhất cho vải mã ${nccCode || ''}${color ? ` màu ${color}` : ''}.
Trả lời bằng tiếng Việt.`,
  },
]
