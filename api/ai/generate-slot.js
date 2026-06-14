import OpenAI, { toFile } from 'openai'

export const config = { maxDuration: 60 }

// ── Step 1: Phân tích vật liệu bằng GPT-4o Vision ────────────────────────────
async function analyzeMaterial(client, base64Image, imageType) {
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/${imageType};base64,${base64Image}` } },
            {
              type: 'text',
              text: `You are a window furnishing and upholstery material expert. Analyze this material image precisely for product photography.
Describe:
- Material type (e.g. "woven linen-look fabric", "wood veneer slat", "powder-coated aluminum slat", "honeycomb cellular structure", "bamboo woven slat", "dual-layer zebra sheer/opaque fabric")
- Exact colors and surface finish (e.g. "warm oat/cream base with ivory jacquard motifs", "dark walnut stain with visible grain", "matte white powder-coated aluminum with subtle brushed texture")
- Visual texture quality (e.g. "soft woven surface with raised jacquard detail", "smooth aluminum with slight metallic sheen", "irregular organic bamboo grain")
- Style and character (e.g. "classic European residential", "modern minimalist", "natural organic tropical")
Factual, specific, concise. Max 3 sentences. English only.`,
            },
          ],
        },
      ],
      max_tokens: 200,
    })
    return res.choices[0]?.message?.content?.trim() || ''
  } catch (e) {
    console.warn('[analyzeMaterial] GPT-4o vision failed:', e.message)
    return ''
  }
}

// ── Scale metadata hint ───────────────────────────────────────────────────────
function buildScaleLine(scaleMetadata) {
  if (!scaleMetadata) return ''
  const { reference_length_detected, pixel_per_mm, scale_source } = scaleMetadata
  if (scale_source === 'skip' || (!reference_length_detected && !pixel_per_mm)) return ''
  const parts = []
  if (reference_length_detected) parts.push(`Scale reference: ${reference_length_detected}`)
  if (pixel_per_mm) parts.push(`(${pixel_per_mm.toFixed(1)} px/mm)`)
  return parts.length
    ? `SCALE ACCURACY: ${parts.join(' ')}. Reproduce the pattern at exact physical scale from the reference — do not enlarge, shrink, or distort the pattern repeat.`
    : ''
}

// General scale principle for all application shots (slot_3, slot_4)
const SCALE_NOTE = `SCALE PRINCIPLE: Maintain the exact real-world scale of the pattern/texture/grain from the reference image. In medium or wide-angle shots the pattern naturally appears smaller — this is correct. Do NOT artificially enlarge, sharpen, or exaggerate pattern/texture beyond its real scale. Goal: accurate scale + recognizable material character, not maximum visual clarity.`

// ── Shared slot builders ──────────────────────────────────────────────────────

function slot1_surface(desc, colorLine, scaleLine, brandLine, noText) {
  return `Professional premium material surface texture photography.

!!!CRITICAL FIRST: The reference image may contain a ruler, measuring tape, or scale bar at the bottom or edge. YOU MUST COMPLETELY REMOVE IT from the output. The ruler is only used to determine scale — it must NOT appear in this image. Output: clean fabric/material surface only, no ruler, no measuring tools whatsoever.

MATERIAL: ${desc}
${colorLine}

SCENE: The material displayed filling the entire frame as the sole subject. Material must be completely FLAT and taut — no folds, no drapes, no rolls, no curled edges anywhere. For all materials (fabric or rigid panels), the surface lies perfectly flat across the entire frame. The area previously occupied by the ruler (if any) must be filled with the fabric pattern — no empty space, no ruler ghost.

COMPOSITION & CAMERA:
- Material fills 100% of the frame — no background, no props, no ruler, no measuring tools
- Slight overhead angle (75–80°) for subtle depth and perspective
- Entire surface in sharp focus edge to edge
- Pattern/grain/texture structure fully centered and visible

LIGHTING:
- Soft directional sidelight at 30–45° from upper left to reveal three-dimensional texture
- No harsh shadows, no hotspots or glare
- Even luminosity across the frame
- Light temperature: warm neutral daylight

STYLE: Premium material swatch photography. Liberty Fabrics / Schumacher / Maharam / Hunter Douglas catalog quality.

CRITICAL OUTPUT RULES:
1. NO ruler, NO measuring tape, NO scale bar, NO graduation marks anywhere in the image.
2. Reproduce exact pattern, colors, surface texture with maximum fidelity.
3. This is the hero texture shot — no props, no hands, no furniture, no labels.
4. Fill the entire frame with fabric/material surface.
5. Material COMPLETELY FLAT — absolutely NO folds, NO drapes, NO curled edges, NO rolls anywhere in the image.
${scaleLine}
${brandLine}
${noText}`
}

// ── Slot 2: Cận chất liệu — macro close-up, no hand, no interior ─────────────
function slot2_fabric_closeup(desc, colorLine, brandLine, noText) {
  return `Premium material surface macro photography — extreme close-up for texture analysis.

MATERIAL: ${desc}
${colorLine}

SCENE: An extreme macro close-up of the material surface, closer and more detailed than the hero surface shot. Shows:
- Individual thread, fiber, grain, or structural element clearly visible
- Weave direction, surface relief, texture quality and tactile character
- Any surface finish, sheen, micro-pattern or coating effect
- Clean top-down or slight overhead angle — material fills 100% of frame

REQUIREMENTS:
- No hands, no ruler, no measuring tape anywhere
- No interior context, no background objects
- No furniture or props — material surface only

COMPOSITION & CAMERA:
- Extreme macro framing: one section of material fills the entire frame
- Angle: flat top-down or slight overhead (80°)
- Razor-sharp focus edge to edge

LIGHTING:
- Raking sidelight at 20–30° from upper left to reveal three-dimensional surface structure
- Emphasizes thread crossings, weave texture, surface relief
- No glare, no blown-out highlights

STYLE: Material specification macro photography. Maharam / Kvadrat / Dedar fabric detail quality.

CRITICAL: Maximum surface texture clarity. Surface structure must be significantly more detailed than Slot 1. No props, no people, no interior.
${brandLine}
${noText}`
}

function slot4_technical_diagram(desc, colorLine, brandLine, noText, productType, grainLine) {
  return `Technical fabric specification diagram — fabric sample with L-shaped scale rulers.

MATERIAL: ${desc}
${colorLine}

LAYOUT — follow exactly:

RULERS:
- LEFT RULER (Y-axis): white ruler strip running the FULL HEIGHT of the image, flush to the LEFT EDGE
  · Pure white background, crisp sharp black tick marks and numbers
  · Every 1 cm tick mark; NUMBER LABELS ONLY at: 0, 5, 10, 15 — absolutely no other numbers
  · Numbers: large, bold, black, clearly legible — printed inside the white ruler strip
  · Scale: 0 at bottom, 15 at top
  · Ruler width: narrow — approx 6% of image width
- BOTTOM RULER (X-axis): white ruler strip running the FULL WIDTH of the image, flush to the BOTTOM EDGE
  · Pure white background, crisp sharp black tick marks and numbers
  · Every 1 cm tick mark; NUMBER LABELS ONLY at: 0, 5, 10, 15 — absolutely no other numbers
  · Numbers: large, bold, black, clearly legible — printed inside the white ruler strip
  · Scale: 0 at left, 15 at right
  · Ruler height: narrow — approx 6% of image height
- Rulers meet at BOTTOM-LEFT corner (origin 0,0) — clean 90° joint
- Both rulers extend edge-to-edge across the full image width/height with NO gaps

FABRIC SAMPLE:
- Fills ALL remaining space — occupies the TOP-RIGHT area after the two ruler strips (~88% of image)
- A perfectly square, flat fabric swatch with a SHARP crisp border on all 4 sides (thin dark outline)
- Fabric lies completely flat — no folds, no drape, no curl, no shadow at edges
- Surface texture and pattern reproduced faithfully, evenly lit

BACKGROUND: Pure white.
CAMERA: 90° top-down, perfectly level, zero perspective distortion.
LIGHTING: Bright, flat, shadowless — fabric surface evenly lit, ruler numbers fully legible.

CRITICAL:
1. Ruler numbers at EXACTLY 0, 5, 10, 15 — bold, black, sharp — no other numbers
2. Ruler strips extend full image edge, flush, no gaps
3. Fabric swatch perfectly square with a clear sharp border
4. No grain direction icons, no symbols, no labels on the fabric surface
5. 90° overhead only, white background only
${brandLine}
${noText}`
}

function slot6_ruler(desc, colorLine, brandLine, noText, productType, grainLine) {
  const materialNote = ['WB', 'AL'].includes(productType)
    ? 'aluminum or wood slat sample (full width visible)'
    : 'flat fabric/material sample (approx 25cm × 20cm)'

  const isGrainKho  = grainLine && grainLine.includes('HORIZONTALLY')
  const isGrainCuon = grainLine && grainLine.includes('VERTICALLY')

  const grainArrows = (isGrainKho || isGrainCuon) ? `
DIRECTIONAL ANNOTATIONS — render clearly on the image:
- LEFT side of material: vertical double-headed arrow (↕) with label "Cuộn" — marks the roll/length direction (chiều cuộn vải)
- BELOW material (above ruler gap): horizontal double-headed arrow (↔) with label "Khổ" — marks the fabric width direction (chiều khổ vải)
- ON material surface: a bold grain direction arrow labeled "Vân":
  ${isGrainKho ? '→ HORIZONTAL arrow (→) across the center of the material — grain runs left-to-right along the width' : '→ VERTICAL arrow (↓) down the center of the material — grain runs top-to-bottom along the roll length'}
- All arrows: thin clean dark lines, filled arrowheads, clinical diagram style
- All labels ("Cuộn", "Khổ", "Vân"): small crisp sans-serif Vietnamese text` : ''

  return `Technical scale reference diagram — material sample with ruler and directional annotations.

MATERIAL: ${desc}
${colorLine}
${grainLine ? `GRAIN DIRECTION: ${grainLine}` : ''}

COMPOSITION (follow exactly):
- ${materialNote} fills the upper 50% of the frame, laid flat on a pure white surface
- A classic wooden ruler (30cm long) placed HORIZONTALLY in the lower 30% of the frame
- RULER MUST BE FULLY WITHIN THE IMAGE — both ends completely visible, NOT cut off
- Ruler centered horizontally; graduation marks (1, 2, 3 … 25 cm) LARGE, crisp, readable black on wood
- Small gap between material bottom edge and ruler top
- Material surface texture clearly visible
${grainArrows}

LIGHTING:
- Bright, flat, even overhead lighting — zero shadows
- All ruler numbers and tick marks readable, no glare
- Material texture not blown out

CAMERA:
- Directly overhead, 90° top-down bird's-eye view
- Perfectly level, zero perspective distortion

BACKGROUND: Pure white seamless.

STYLE: Technical specification sheet. Clinical diagram — similar to a fabric data card with dimension and grain annotations.

CRITICAL:
1. Ruler FULLY visible — NEVER cut off at any edge
2. All cm numbers legible
3. Material texture visible
4. 90° overhead only
5. Annotation arrows (if present) must be clean thin lines, no decorative styling
${brandLine}
${noText}`
}

// ── CUR: Rèm vải (blackout / dimout / sheer) ─────────────────────────────────
const CUR = {
  // slot_2: cận chất liệu — macro, no hand, no interior
  slot_2: slot2_fabric_closeup,

  // slot_3: cầm nắm — hand + light interior context
  slot_3: (desc, colorLine, brandLine, noText) => `Professional textile lifestyle photography — fabric touch and drape.

FABRIC: ${desc}
${colorLine}

SCENE: An elegant woman's hand lightly pinches the top edge of this curtain fabric between thumb and index finger. The fabric cascades downward in soft, natural folds revealing drape and weight. Grip is relaxed and refined, not clutching.

COMPOSITION & CAMERA:
- Medium close-up, 45° diagonal from slightly above
- Shallow depth of field: fabric texture sharp, hand slightly soft
- Fabric fills 70% of frame

INTERIOR CONTEXT (subtle):
- Warm natural indoor light, slightly soft-focused background
- Hint of window light or airy room visible behind — very blurred, not dominant

LIGHTING: Soft diffused natural or studio key light from upper left. Reveals surface texture and weave.

BACKGROUND: Warm airy interior — softly blurred window or room behind the fabric.

STYLE: Luxury curtain fabric catalogue — Rubelli, Dedar quality.

CRITICAL: Exact fabric pattern, weave, color must be faithfully reproduced. Fabric is the hero. No sofa visible. Background is soft context only.
${brandLine}
${noText}`,

  // slot_4: không gian gần ~1m — product close shot in room
  slot_4: (desc, colorLine, brandLine, noText) => `Professional luxury curtain photography — close view at 1 metre distance.

FABRIC: ${desc}
${colorLine}

SCENE: A hanging curtain panel photographed from approximately 1 metre away:
- One or two elegant natural wave folds clearly in frame
- Panel catching soft side-light — fabric surface texture richly visible
- No hardware visible — fabric and folds only
- Camera distance: approximately 1 metre from the curtain face

COMPOSITION & CAMERA:
- Medium shot: curtain fabric fills 80% of frame
- Slight diagonal angle showing drape depth and fold dimension
- Sharp focus on center fold, very slight blur at extreme edges

LIGHTING: Soft side-light from upper left or window. Reveals woven texture and gentle sheen. Gentle light-to-shadow gradient across the folds.

BACKGROUND: Soft interior — plain wall or window light blurred behind curtain.

STYLE: Editorial curtain detail. Fabric character and drape quality are the heroes.

CRITICAL: Fabric weave, pattern and color must be clearly recognizable at this distance. Natural drape. No sofa. No wide-room context in this shot.
${SCALE_NOTE}
${brandLine}
${noText}`,

  // slot_5: nội thất ~2m — full room, ripple-wave curtains, refined interior
  slot_5: (desc, colorLine, brandLine, noText) => `Luxury interior architecture photography — floor-to-ceiling curtains in a refined living space.

FABRIC: ${desc}
${colorLine}

CURTAIN SPECIFICATION — precise manufacturing standard (follow exactly):
- PLEAT STYLE: Steam-set ripple fold (S-fold / wave pleat) — factory steam-pressed permanent waves
  · Wave pitch: 7 cm — each complete wave cycle (peak to peak) is exactly 7 cm wide
  · Fullness ratio: 2.5× — fabric is 2.5 times the finished width, creating full, rounded waves
  · Wave shape: each wave is a smooth, round cylinder-like column — soft rounded crest and soft rounded trough
  · ALL waves IDENTICAL from left to right: same 7 cm width, same depth, same curvature — no variation
  · Waves are PERMANENT (steam-set): they hold their shape rigidly from the header tape at top to the hem at bottom
  · Each wave column runs perfectly plumb vertical — straight from ceiling to floor without tapering or twisting
  · Fabric surface between wave peaks: smooth, taut — no bunching, no gathering, no secondary creases
  · The overall curtain face looks like a row of identical soft cylinders standing side by side
- HANG: Ceiling-mounted concealed track — fabric drops perfectly vertical, all waves in perfect alignment
- HEM: Bottom hem exactly 1 cm above floor — precise, intentional, not pooling, not short
- COVERAGE: Full wall-to-wall, floor-to-ceiling curtain — panels span the entire window/wall width

ROOM — refined luxury interior (like a high-end residential project):
- Large living space, high ceiling (2.8–3.2m)
- Neutral warm palette: cream, taupe, warm white walls and floor
- Light wood or warm stone flooring
- Furniture PARTIALLY visible — low-profile sofa or chaise at one side, a round coffee table, possibly a low compact floral arrangement (NOT tall vases, NOT large plants)
- Soft ambient lighting: warm downlights or natural light — no harsh overhead fluorescence
- Calm, sophisticated atmosphere — not cluttered

CAMERA: Wide interior angle, 3/4 view from inside the room. Camera at approximately 1.2–1.5m height. Full curtain height and room breadth visible. Distance approximately 2 metres from curtain face.

STYLE: High-end interior design — Fendi Casa, Minotti, Bentley Home showroom quality. Calm, architectural, aspirational.

CRITICAL:
1. Waves MUST follow factory steam-set standard: 7 cm pitch, 2.5× fullness, round uniform columns top to bottom
   WRONG: large irregular folds / pinch-pleat bunching / waves that taper or change shape toward the bottom
   CORRECT: a mechanical row of identical soft cylinders — like sine wave columns, every wave the same
2. Waves are IDENTICAL from the very top header tape to the very bottom hem — no variation anywhere
3. Hem exactly 1 cm from floor — precise
4. Curtain fabric color and surface texture clearly visible on the wave faces
5. Interior refined and minimal — curtain wall is the hero, furniture supports only
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── FAB: Sofa / Vải bọc ──────────────────────────────────────────────────────
const FAB = {
  // slot_2: cận chất liệu
  slot_2: slot2_fabric_closeup,

  // slot_3: cầm nắm — hand touching sofa fabric with interior context
  slot_3: (desc, colorLine, brandLine, noText) => `Professional upholstery lifestyle photography — hand touching sofa fabric.

FABRIC: ${desc}
${colorLine}

SCENE: An elegant hand rests gently on the arm or seat cushion of a sofa upholstered in this fabric. Fingertips lightly feel the surface texture. The gesture is natural and refined.

COMPOSITION:
- Medium close-up: sofa arm/cushion and hand fill 75% of frame
- Slight overhead angle showing fabric surface texture
- Shallow DOF: fabric surface sharp, hand soft, background pleasantly blurred

INTERIOR CONTEXT (subtle):
- Warm living room light from the side or behind
- Soft suggestion of room context in the background — blurred, not dominant

LIGHTING: Soft natural or warm studio light from the side. Reveals fabric weave and texture.

BACKGROUND: Blurred warm interior living room context.

STYLE: Luxury upholstery lifestyle photography. Architectural Digest quality.

CRITICAL: Fabric pattern, weave and color clearly visible on the sofa surface. Hand is a supporting element only. No curtains in this shot.
${brandLine}
${noText}`,

  // slot_4: không gian gần ~1m — sofa close shot
  slot_4: (desc, colorLine, brandLine, noText) => `Professional luxury sofa photography — close view at 1 metre distance.

FABRIC: ${desc}
${colorLine}

SCENE: A contemporary sofa or cushion photographed from approximately 1 metre away:
- Sofa arm and seat corner clearly in frame — fabric surface and weave texture are primary subjects
- 1 decorative pillow in same fabric visible
- Natural light catching the woven surface from a low angle
- Camera distance: approximately 1 metre from the sofa

COMPOSITION: Medium shot, sofa and cushion fill 85% of frame. Slight overhead or eye-level angle. Sharp focus on fabric surface.

LIGHTING: Soft natural side light from a window. Reveals fabric texture and depth without glare.

BACKGROUND: Warm residential living room context, softly blurred.

STYLE: Luxury upholstery detail photography. Aspirational, warm.

CRITICAL: Fabric weave, texture and color must be clearly visible and recognizable. No curtains.
${SCALE_NOTE}
${brandLine}
${noText}`,

  // slot_5: không gian tổng thể ~2m — full sofa in room
  slot_5: (desc, colorLine, brandLine, noText) => `Professional luxury interior design photography — sofa in full room context at 2 metres.

FABRIC: ${desc}
${colorLine}

SCENE: A contemporary 2–3 seat sofa fully upholstered in this fabric, photographed from approximately 2 metres away showing full room context:
- Clean straight-lined silhouette, tight seat cushions, low-profile arms
- 1 large square decorative pillow + 1 rectangular lumbar pillow in same fabric
- Small round side table partially visible (light oak or marble top)
- Minimal decor: one tall vase or subtle artwork in background
- Camera distance: approximately 2 metres — full sofa and surrounding room visible

ROOM: Minimalist Scandinavian-inspired living space. Warm white walls. Light wood or matte concrete flooring. Soft natural daylight from left.

CAMERA: 3/4 front view, slight low angle at seat-cushion eye level, full sofa in frame.

STYLE: Interior design magazine — Architectural Digest, Elle Decor. Aspirational, warm, refined.

CRITICAL: Exact fabric pattern, texture and color must cover sofa and pillows faithfully. No curtains in this shot.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── CUR_FAB: Rèm + Sofa hỗn hợp ─────────────────────────────────────────────
const CUR_FAB = {
  slot_2: slot2_fabric_closeup,
  slot_3: CUR.slot_3,

  // slot_4: sofa close-up at 1m (fabric visible, interior hint)
  slot_4: FAB.slot_4,

  // slot_5: full room with curtain at 2m (sofa also visible)
  slot_5: (desc, colorLine, brandLine, noText) => `Professional luxury interior photography — curtain and sofa in full room at 2 metres.

FABRIC: ${desc}
${colorLine}

SCENE: A full interior room photographed from approximately 2 metres away showing both window treatment and upholstery in this fabric:
- Floor-to-ceiling curtain panels on a slim rod — same fabric on curtains
- A sofa partially visible in the foreground or mid-ground — same fabric on sofa and cushions
- The composition shows the versatility of this fabric across both applications
- Camera distance: approximately 2 metres — showing full room context

ROOM: Elegant contemporary interior. Warm white walls. Parquet or light wood floor. Natural daylight from the curtained window. Tasteful furniture arrangement.

CAMERA: 3/4 angle from inside room, wide enough to show curtain + sofa relationship.

STYLE: Luxury interior design presentation. Shows fabric used across multiple furnishing elements.

CRITICAL: Fabric pattern and color must be recognizable on BOTH curtains and sofa. Show the design harmony of using the same material for both.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── BL: Rèm cuốn ─────────────────────────────────────────────────────────────
const BL = {
  // slot_2: cận chất liệu — flat material surface macro
  slot_2: (desc, colorLine, brandLine, noText) => `Premium roller blind material macro photography — extreme close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: Extreme close-up of the roller blind material surface laid flat:
- Material fills 100% of frame in a flat, taut configuration
- Surface texture, coating finish, and any micro-pattern clearly visible
- NOT showing mechanism, tube, or hem — material surface only

COMPOSITION: Top-down or very slight overhead angle. Razor-sharp focus across the material surface.

LIGHTING: Even soft light with slight side-rake to reveal surface texture and coating character.

BACKGROUND: None visible — material fills frame entirely.

STYLE: Technical material specification photography.

CRITICAL: Flat, clean surface only. No hands, no ruler, no interior. Reproduce exact material texture and color.
${brandLine}
${noText}`,

  // slot_3: cầm nắm — hand touching blind with interior hint
  slot_3: (desc, colorLine, brandLine, noText) => `Professional roller blind lifestyle photography — hand touching material.

MATERIAL: ${desc}
${colorLine}

SCENE: A hand gently touches or lightly grips the edge of a roller blind fabric panel. The material is hanging cleanly, showing its flat surface and texture. Hand gives scale and tactile context.

COMPOSITION: Medium close-up, material fills 70% of frame. Hand at side or top edge.

INTERIOR CONTEXT (subtle):
- Soft indoor light visible in background
- Hint of a clean modern interior window behind — very softly blurred

LIGHTING: Even soft natural or studio light revealing surface texture.

BACKGROUND: Softly blurred clean interior context.

STYLE: Premium roller blind lifestyle photography.

CRITICAL: Reproduce exact material texture and color. No sofa, no draping curtain folds. Background is subtle context only.
${brandLine}
${noText}`,

  // slot_4: không gian gần ~1m — blind at window close
  slot_4: (desc, colorLine, brandLine, noText) => `Professional interior photography — roller blind installed at window, close view at 1 metre.

MATERIAL: ${desc}
${colorLine}

SCENE: A clean minimal interior window with a roller blind, photographed from approximately 1 metre away:
- Blind approximately 2/3 rolled down showing the flat fabric surface clearly
- Roller tube and chain/cord mechanism visible at top bracket
- Clean aluminum bottom bar at the hem
- Camera distance: approximately 1 metre — blind fills most of frame
- Soft filtered light through or beside the blind

ROOM: Modern minimal interior — white walls, clean window frame. Natural daylight.

CAMERA: Front-facing at window height, blind fills the frame.

STYLE: Premium roller blind installation photography.

CRITICAL: Blind fabric must show actual material texture and color. NOT a draping curtain — flat, clean, taut surface.
${SCALE_NOTE}
${brandLine}
${noText}`,

  // slot_5: không gian tổng thể ~2m — full room view
  slot_5: (desc, colorLine, brandLine, noText) => `Professional interior photography — roller blind in full room context at 2 metres.

MATERIAL: ${desc}
${colorLine}

SCENE: A roller blind at a full window photographed from approximately 2 metres away — wide room context visible:
- Blind fully or partially lowered, showing flat surface and straight hem
- Full window and surrounding room visible in frame
- Contemporary furniture partially visible (desk, chair, or minimal shelf)
- Camera distance: approximately 2 metres — full window and room context in frame

ROOM: Modern minimal residential or office interior — white walls, clean window frame, natural daylight. Furniture at sides not dominant.

CAMERA: Slight 3/4 or front angle, wide enough to show window + room context.

STYLE: Premium roller blind in situ photography showing full room integration.

CRITICAL: Blind fabric texture and color still recognizable at this distance. Flat, taut surface — not curtain draping.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── WB: Sáo gỗ ───────────────────────────────────────────────────────────────
const WB = {
  // slot_2: cận lá sáo — slat close-up, already material close-up, no hand
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — wood blind slat extreme close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: 2–3 horizontal wood slats in extreme close-up:
- Slats parallel, wood grain texture prominently visible across slat face
- Natural wood tones, finish quality, and any grain variation clearly shown
- No mechanism, no cord — slat surface only

COMPOSITION: Slightly diagonal (15°), sharp focus across slat surfaces, frame filled with slat textures.

LIGHTING: Raking side-light from upper left, revealing wood grain three-dimensionally.

BACKGROUND: Softly blurred slats in background.

STYLE: Premium wood blind material specification photography.

CRITICAL: Wood grain, color, finish clearly and faithfully shown. Not fabric. Not aluminum. No hands, no ruler.
${brandLine}
${noText}`,

  // slot_3: cầm chạm — hand adjusting slat with interior context
  slot_3: (desc, colorLine, brandLine, noText) => `Professional lifestyle photography — hand adjusting wood blind slat.

MATERIAL: ${desc}
${colorLine}

SCENE: A hand gently tilts or adjusts 2–3 horizontal wood slats:
- Fingers lightly grip a slat to demonstrate the tilt adjustment
- Natural wood grain visible on the slat surface beside the hand
- Soft light from a window partially visible in background (blurred)

COMPOSITION:
- Medium close-up: slats fill 65% of frame, hand as supporting element
- Slight diagonal, natural casual interaction

INTERIOR CONTEXT (subtle):
- Warm residential interior background, softly blurred
- Natural daylight feeling from window area behind

LIGHTING: Soft natural side light revealing wood grain and depth.

STYLE: Premium wood blind lifestyle photography. Warm, residential.

CRITICAL: Wood grain and color clearly shown. Hand is supporting element only. Background subtle and warm.
${brandLine}
${noText}`,

  // slot_4: không gian gần ~1m — tilt mechanism shown close
  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — wood blind tilt operation, close view at 1 metre.

MATERIAL: ${desc}
${colorLine}

SCENE: A wood venetian blind showing the tilt operation from approximately 1 metre away:
- Slats at two different tilt angles (some open, some tilting closed)
- Ladder cord and tilt wand/cord clearly visible
- 4–6 slats in frame showing the full louver arrangement and mechanism
- Camera distance: approximately 1 metre — product fills most of frame

CAMERA: 3/4 front angle, close enough to see slat material clearly.

LIGHTING: Studio or window light showing slat depth and ladder cord.

STYLE: Product operation photography showing mechanism and material detail.

CRITICAL: Wood slat material, grain, and color clearly shown in both tilt positions.
${SCALE_NOTE}
${brandLine}
${noText}`,

  // slot_5: không gian tổng thể ~2m — full room view
  slot_5: (desc, colorLine, brandLine, noText) => `Professional interior photography — wood venetian blind in full room at 2 metres.

MATERIAL: ${desc}
${colorLine}

SCENE: A wood venetian blind at a full-height window, photographed from approximately 2 metres away:
- Slats tilted approximately 45° letting in filtered natural light
- Light and shadow playing through slats onto the interior
- Full blind width and surrounding room context visible
- Camera distance: approximately 2 metres — full window + room in frame

ROOM: Sophisticated residential or boutique hospitality interior. Warm neutral walls. Natural materials (wood, linen, stone). Natural light from the blind area.

CAMERA: 3/4 angle from inside, wide enough to show full blind and room context.

STYLE: Premium wood blind interior photography. Warm, sophisticated, architectural.

CRITICAL: Wood grain and color recognizable at this distance. Show warm room integration.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── AL: Sáo nhôm ─────────────────────────────────────────────────────────────
const AL = {
  // slot_2: cận lá nhôm — slat close-up
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — aluminum blind slat extreme close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: 2–3 horizontal aluminum slats in extreme close-up:
- Powder-coated or anodized aluminum surface clearly shown
- Smooth metallic finish, coating sheen or texture of the coating visible
- Clean, precise, metallic character prominent

COMPOSITION: Slightly diagonal, sharp focus across slat faces, filling the frame.

LIGHTING: Even studio light with slight side-rake showing aluminum surface finish and metallic sheen.

BACKGROUND: Clean neutral — softly blurred slats.

STYLE: Premium aluminum blind specification photography. Precise, modern.

CRITICAL: Aluminum surface, color, finish clearly shown. Not fabric. Not wood. No hands, no ruler.
${brandLine}
${noText}`,

  // slot_3: cầm chạm — hand adjusting slat
  slot_3: (desc, colorLine, brandLine, noText) => `Professional lifestyle photography — hand adjusting aluminum blind slat.

MATERIAL: ${desc}
${colorLine}

SCENE: A hand lightly tilts or adjusts 2–3 aluminum slats:
- Fingers lightly grip a slat to show the tilt adjustment
- Metallic surface catching light beside the hand
- Clean modern interior window area in background (blurred)

COMPOSITION:
- Medium close-up: slats fill 65% of frame, hand as supporting element
- Slight diagonal, natural casual interaction

INTERIOR CONTEXT (subtle):
- Clean modern or office interior background, softly blurred
- Natural daylight feeling

LIGHTING: Even studio or natural light revealing metallic surface character.

STYLE: Modern premium product lifestyle photography.

CRITICAL: Aluminum surface, color, finish clearly shown. Hand is supporting element only. Background minimal and clean.
${brandLine}
${noText}`,

  // slot_4: không gian gần ~1m — tilt mechanism
  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — aluminum blind tilt mechanism, close view at 1 metre.

MATERIAL: ${desc}
${colorLine}

SCENE: Aluminum venetian blind showing tilt states from approximately 1 metre away:
- Half slats tilted open, half tilted toward closed position
- Ladder cord and wand/cord mechanism clearly visible
- Clean angular aluminum surfaces catching light at different angles
- Camera distance: approximately 1 metre

CAMERA: Front or slight 3/4 angle showing multiple slats and mechanism.

LIGHTING: Even product lighting showing metallic surface at different tilt angles.

STYLE: Product operation photography showing mechanism and material detail.

CRITICAL: Aluminum slat material — not fabric, not wood. Show angular, clean metallic character.
${SCALE_NOTE}
${brandLine}
${noText}`,

  // slot_5: không gian tổng thể ~2m — full room view
  slot_5: (desc, colorLine, brandLine, noText) => `Professional interior photography — aluminum venetian blind in full room at 2 metres.

MATERIAL: ${desc}
${colorLine}

SCENE: Aluminum venetian blind at a window, photographed from approximately 2 metres away:
- Slats tilted open (30–45°), clean metallic surface catching light
- Linear light/shadow patterns through slats onto interior
- Full blind width and surrounding room visible
- Camera distance: approximately 2 metres — full window + room context

ROOM: Contemporary office or modern residential interior. Clean lines, minimal palette. Natural light.

CAMERA: 3/4 angle from inside the room, wide enough to see full blind and room context.

STYLE: Modern interior / premium window furnishing photography.

CRITICAL: Aluminum material character preserved at this distance — metallic, clean, precise.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── RM: Roman blind ───────────────────────────────────────────────────────────
const RM = {
  // slot_2: cận chất liệu — fabric macro, shared with CUR
  slot_2: slot2_fabric_closeup,

  // slot_3: cầm nắm — hand holding roman fabric
  slot_3: CUR.slot_3,

  // slot_4: không gian gần ~1m — roman close, fold detail
  slot_4: (desc, colorLine, brandLine, noText) => `Professional detail photography — Roman blind fold structure, close view at 1 metre.

FABRIC: ${desc}
${colorLine}

SCENE: A Roman blind partially raised, photographed from approximately 1 metre away:
- 3–5 horizontal folds clearly visible as the blind lifts
- Fabric accumulating in structured horizontal pleats
- Lifting cord through rings visible at back edge if possible
- Fabric texture clearly shown on the face of each fold
- Camera distance: approximately 1 metre — fold structure fills frame

COMPOSITION: 3/4 angle or slight side view showing fold depth and structure.

LIGHTING: Side light revealing fold shadows and fabric texture.

STYLE: Detail photography showing Roman blind construction quality and fabric character.

CRITICAL: Roman pleat/fold structure clearly shown. Fabric pattern and texture recognizable on each pleat.
${SCALE_NOTE}
${brandLine}
${noText}`,

  // slot_5: không gian tổng thể ~2m — roman in full room
  slot_5: (desc, colorLine, brandLine, noText) => `Professional interior photography — Roman blind in full room at 2 metres.

FABRIC: ${desc}
${colorLine}

SCENE: A Roman blind fully lowered at a window, photographed from approximately 2 metres away:
- Clean horizontal fold/pleat structure characteristic of Roman blinds
- Fabric hanging straight with horizontal pleats visible
- Full window width and surrounding room context visible
- Camera distance: approximately 2 metres

ROOM: Elegant residential interior — warm neutral palette. Window with natural daylight. Furniture and decor partially visible at sides.

CAMERA: Front-facing at room level showing full blind and room context.

STYLE: Premium Roman blind catalog photography.

CRITICAL: Fabric pattern and texture visible on the Roman blind surface. Roman blind style clearly distinct from curtain or roller blind.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── HN: Tổ ong ───────────────────────────────────────────────────────────────
const HN = {
  // slot_2: cận ô tổ ong — honeycomb cell extreme close-up, no hand
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — honeycomb blind cell extreme close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: Extreme macro close-up of the honeycomb blind fabric:
- Hexagonal cell structure visible across the entire frame
- The cellular void depth creating a pronounced 3D structure
- Front face or slight angled view of cells showing depth

COMPOSITION: Tight macro shot, cells fill 100% of the frame.

LIGHTING: Back-lit or side-lit to reveal translucent cell walls and interior depth.

STYLE: Technical material specification close-up photography.

CRITICAL: Honeycomb cell structure must be clearly visible as 3D cells with depth. Not flat fabric. Not slats. No hands, no ruler.
${brandLine}
${noText}`,

  // slot_3: cầm chạm — hand touching honeycomb with interior context
  slot_3: (desc, colorLine, brandLine, noText) => `Professional lifestyle photography — hand touching honeycomb blind.

MATERIAL: ${desc}
${colorLine}

SCENE: A hand gently touches or lightly compresses the face of the honeycomb blind:
- Fingertips lightly press the cellular surface demonstrating its soft, structured texture
- Cell structure subtly visible around the hand
- Clean window or room visible softly behind

COMPOSITION:
- Medium close-up: blind fills 70% of frame, hand as supporting element
- Slight overhead angle

INTERIOR CONTEXT (subtle):
- Soft natural indoor light
- Clean modern interior background, very softly blurred

LIGHTING: Soft even light showing cellular texture.

STYLE: Premium cellular shade lifestyle photography.

CRITICAL: Cell structure visible. Hand is supporting element. Background is subtle context only.
${brandLine}
${noText}`,

  // slot_4: không gian gần ~1m — cross-section / side view
  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — honeycomb blind cross-section view at 1 metre.

MATERIAL: ${desc}
${colorLine}

SCENE: Cross-sectional or extreme side-angle view of the honeycomb blind from approximately 1 metre away:
- Individual cells visible in cross-section from the side edge
- Air pockets within each hexagonal cell clearly shown as depth
- Multiple rows of cells visible showing the full pleat height
- Camera distance: approximately 1 metre

CAMERA: Pure side view or extreme 3/4 angle showing cell depth.

LIGHTING: Side light or back light illuminating cell interiors.

STYLE: Technical cross-section photography demonstrating insulation cell structure.

CRITICAL: Honeycomb cell interior structure must be clearly shown as hollow cells with depth.
${brandLine}
${noText}`,

  // slot_5: không gian tổng thể ~2m — full room
  slot_5: (desc, colorLine, brandLine, noText) => `Professional interior photography — honeycomb blind in full room at 2 metres.

MATERIAL: ${desc}
${colorLine}

SCENE: A honeycomb (cellular) blind installed at a large window, photographed from approximately 2 metres away:
- Blind fully lowered, clean face showing
- Subtle cellular texture visible from the room side
- Full blind width and surrounding room context visible
- Camera distance: approximately 2 metres

ROOM: Clean modern interior with white or neutral walls. Contemporary setting with minimal furniture partially visible.

CAMERA: Front-facing from room level, wide enough to see full blind and room context.

STYLE: Premium cellular shade interior photography.

CRITICAL: Cellular blind recognizable at this distance. Not a flat roller blind, not a curtain.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── CB: Cầu vồng / Zebra ─────────────────────────────────────────────────────
const CB = {
  // slot_2: cận sọc vải — stripe macro, no hand
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — zebra blind fabric stripe extreme close-up.

FABRIC: ${desc}
${colorLine}

SCENE: Extreme macro close-up of the zebra (dual-layer day/night) blind fabric:
- Alternating sheer (translucent) and opaque horizontal stripes clearly visible
- Stripe pattern fills the frame edge-to-edge
- Natural light transmission difference between sheer and opaque bands prominent

COMPOSITION: Front or very slight overhead, stripes running horizontally, filling frame.

LIGHTING: Back-lit or diffused from behind to distinguish sheer vs opaque stripes clearly.

STYLE: Premium zebra blind fabric specification photography.

CRITICAL: Alternating sheer/opaque stripe structure clearly shown. Not solid fabric. Not venetian slats. No hands, no ruler.
${brandLine}
${noText}`,

  // slot_3: cầm nắm — hand touching zebra fabric with interior context
  slot_3: (desc, colorLine, brandLine, noText) => `Professional lifestyle photography — hand touching zebra blind fabric.

FABRIC: ${desc}
${colorLine}

SCENE: A hand lightly touches or holds the edge of the zebra blind fabric:
- Alternating sheer and opaque stripes visible beside the hand
- Fabric hanging cleanly from a roller mechanism
- Clean modern interior window background visible (blurred)

COMPOSITION:
- Medium close-up: fabric fills 70% of frame, hand as supporting element

INTERIOR CONTEXT (subtle):
- Modern clean interior or office background, softly blurred
- Natural daylight feeling

LIGHTING: Even soft light, slightly back-lit to show stripe translucency.

STYLE: Premium zebra blind lifestyle photography.

CRITICAL: Sheer/opaque stripe character recognizable. Hand is supporting element. Background is subtle.
${brandLine}
${noText}`,

  // slot_4: không gian gần ~1m — stripe alignment mechanism
  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — zebra blind open/close demonstration at 1 metre.

FABRIC: ${desc}
${colorLine}

SCENE: The zebra blind demonstrating stripe alignment from approximately 1 metre away:
- One position: stripes aligned (sheer on sheer) = maximum light
- Other position: stripes offset (opaque covering sheer) = closed
- Chain cord mechanism visible at side
- Camera distance: approximately 1 metre — blind fills most of frame

LIGHTING: Backlighting to demonstrate light transmission difference between stripe states.

STYLE: Product operation demonstration photography.

CRITICAL: Stripe alignment/offset mechanism clearly shown. Demonstrate light control function.
${brandLine}
${noText}`,

  // slot_5: không gian tổng thể ~2m — full room
  slot_5: (desc, colorLine, brandLine, noText) => `Professional interior photography — zebra blind in full room at 2 metres.

FABRIC: ${desc}
${colorLine}

SCENE: A zebra (day/night) blind installed at a window, photographed from approximately 2 metres away:
- Sheer and opaque bands partially aligned for soft filtered light
- Full blind width and surrounding room visible
- Camera distance: approximately 2 metres — full window + room context

ROOM: Modern minimal residential or boutique hospitality interior.

CAMERA: Front-facing or slight 3/4 angle, wide enough to show full blind and room.

STYLE: Premium zebra blind in situ photography.

CRITICAL: Alternating sheer/opaque stripe character recognizable at this distance. Not a plain roller blind.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── BB: Trúc / Bamboo ─────────────────────────────────────────────────────────
const BB = {
  // slot_2: cận thanh trúc — bamboo material macro, no hand
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — bamboo blind material extreme close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: Extreme macro close-up of the bamboo/reed blind material:
- Individual bamboo or reed slats or woven structure fills the frame
- Natural bamboo grain, color variation, organic texture, and weave/binding pattern shown
- Organic natural character of the material at maximum detail

COMPOSITION: Tight macro, material filling 100% of frame.

LIGHTING: Natural or raking side light revealing material texture and organic dimension.

STYLE: Natural materials specification photography.

CRITICAL: Bamboo/reed material character clearly shown — organic, textured, not synthetic, not metal. No hands, no ruler.
${brandLine}
${noText}`,

  // slot_3: cầm chạm — hand touching bamboo with interior context
  slot_3: (desc, colorLine, brandLine, noText) => `Professional lifestyle photography — hand touching bamboo blind material.

MATERIAL: ${desc}
${colorLine}

SCENE: A hand lightly touches or holds the edge of the bamboo blind:
- Natural bamboo texture visible beside the hand
- Blind in rolled-down or partially raised position
- Warm natural interior or outdoor-adjacent space in background

COMPOSITION:
- Medium close-up: material fills 70% of frame, hand as supporting element

INTERIOR CONTEXT (subtle):
- Warm natural interior — wood tones, natural textiles visible very softly behind
- Tropical or biophilic interior feeling

LIGHTING: Soft natural light revealing bamboo texture.

STYLE: Natural lifestyle photography. Warm, organic, tactile.

CRITICAL: Bamboo/reed material character clearly visible. Hand is supporting element. Background warm and natural.
${brandLine}
${noText}`,

  // slot_4: không gian gần ~1m — rolling operation
  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — bamboo blind rolling operation at 1 metre.

MATERIAL: ${desc}
${colorLine}

SCENE: A bamboo blind partially rolled upward, photographed from approximately 1 metre away:
- Material rolling from the bottom upward, showing the roll form
- Natural cotton cord and wooden cleat or cord mechanism visible
- The rolled material showing bamboo/reed cross-section as it curves
- Camera distance: approximately 1 metre

COMPOSITION: 3/4 angle showing roll form and operating cord.

LIGHTING: Natural soft lighting showing bamboo texture and roll structure.

STYLE: Product operation photography.

CRITICAL: Bamboo/reed rolling structure clearly shown — organic natural material character visible.
${SCALE_NOTE}
${brandLine}
${noText}`,

  // slot_5: không gian tổng thể ~2m — full room
  slot_5: (desc, colorLine, brandLine, noText) => `Professional interior photography — bamboo blind in full room at 2 metres.

MATERIAL: ${desc}
${colorLine}

SCENE: A bamboo (or woven wood/reed) blind installed at a window, photographed from approximately 2 metres away:
- Blind in rolled-down position, full width visible
- Natural bamboo or reed texture recognizable from room side
- Organic warmth complementing the interior palette
- Camera distance: approximately 2 metres — full window + room context

ROOM: Warm natural interior — wooden furniture, natural textiles, organic color palette. Tropical, coastal, or biophilic design theme.

CAMERA: 3/4 angle from room level, wide enough to show blind + room context.

STYLE: Natural interior photography.

CRITICAL: Bamboo/reed material character recognizable at 2m distance. Show organic warmth in room context.
${SCALE_NOTE}
${brandLine}
${noText}`,
}

// ── Type → slot function map ─────────────────────────────────────────────────
const TYPE_SLOT_FNS = { CUR, FAB, CUR_FAB, BL, WB, AL, RM, HN, CB, BB }

// ── Main prompt builder ───────────────────────────────────────────────────────
function buildPrompt(slot, { fabricAnalysis, colorName, targetColor, supplier, collection, materialMetadata, scaleMetadata, productType }) {
  const activeColor = targetColor?.name || colorName || null
  const colorHex    = targetColor?.hex  || null
  const colorDesc   = activeColor ? `${activeColor}${colorHex ? ` (${colorHex})` : ''}` : null

  // beMat = "Linen look", "Matte smooth", v.v. — phải inject vào desc để AI render đúng surface texture
  const beMat = materialMetadata?.beMat || ''
  // grainDirection: 'kho' = grain along fabric width (↔ ngang), 'cuon' = grain along roll length (↕ dọc)
  const grainDir = materialMetadata?.grainDirection || ''
  const grainLine = grainDir === 'kho'
    ? 'Fabric grain runs HORIZONTALLY across the fabric width (↔ Khổ vải) — weave lines perpendicular to roll direction.'
    : grainDir === 'cuon'
    ? 'Fabric grain runs VERTICALLY along the roll length (↕ Chiều cuộn) — weave lines parallel to roll direction.'
    : ''

  const baseDesc = fabricAnalysis
    || `material with exact texture from reference${colorDesc ? ` in ${colorDesc}` : ''}`
  // Đặt beMat trước analysis để AI ưu tiên surface type từ database
  const desc = beMat
    ? `[Surface type: ${beMat}] ${baseDesc}`
    : baseDesc

  const colorLine = colorDesc
    ? `COLOR: The material is in ${colorDesc} — maintain this exact color throughout the entire image.`
    : ''

  const scaleLine = buildScaleLine(scaleMetadata)

  const brandLine = [
    supplier                    ? `Supplier: ${supplier}.`                    : '',
    collection                  ? ` Collection: ${collection}.`                : '',
    activeColor                 ? ` Colorway: ${activeColor}.`                 : '',
    materialMetadata?.thanhPhan ? ` Composition: ${materialMetadata.thanhPhan}.` : '',
    beMat                       ? ` Surface: ${beMat}.`                        : '',
    grainLine                   ? ` ${grainLine}`                               : '',
  ].join('')

  const noText = 'No text, no watermarks, no logos, no branding overlays.'

  if (slot === 'slot_1') return slot1_surface(desc, colorLine, scaleLine, brandLine, noText)
  if (slot === 'slot_4') return slot4_technical_diagram(desc, colorLine, brandLine, noText, productType, grainLine)

  const pType = productType || 'CUR'
  const typeFns = TYPE_SLOT_FNS[pType] || TYPE_SLOT_FNS.CUR
  // slot_2 → ~1m product shot (typeFns.slot_4), slot_3 → ~2m room shot (typeFns.slot_5)
  const internalSlot = slot === 'slot_2' ? 'slot_4' : slot === 'slot_3' ? 'slot_5' : slot
  const fn = typeFns?.[internalSlot]
  return fn ? fn(desc, colorLine, brandLine, noText) : ''
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ ok: false, error: 'Thiếu OPENAI_API_KEY trong Vercel Environment Variables.' })
  }

  try {
    const {
      slot,
      surfaceTextureUrl,
      nccCode,
      colorName,
      targetColor,
      supplier,
      collection,
      materialMetadata,
      scaleMetadata,
      productType,
      quality,                        // 'low' | 'medium' | 'high' — từ QualityCard
      fabricAnalysis: cachedAnalysis, // tái sử dụng từ slot trước, bỏ qua GPT-4o call
    } = req.body || {}

    const VALID_QUALITY = ['low', 'medium', 'high']
    const imageQuality = VALID_QUALITY.includes(quality) ? quality : 'medium'

    const VALID_SLOTS = ['slot_1', 'slot_2', 'slot_3', 'slot_4']
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ ok: false, error: `Slot không hợp lệ. Cần: ${VALID_SLOTS.join(', ')}.` })
    }

    if (!surfaceTextureUrl) {
      return res.status(400).json({ ok: false, error: 'Thiếu surfaceTextureUrl.' })
    }

    const match = surfaceTextureUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!match) {
      return res.status(400).json({ ok: false, error: 'surfaceTextureUrl phải là base64 dataURL.' })
    }
    const [, imageType, base64Image] = match

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const imageBuffer = Buffer.from(base64Image, 'base64')

    // Step 1: Phân tích vật liệu — bỏ qua nếu đã có kết quả từ slot trước
    const fabricAnalysis = cachedAnalysis || await analyzeMaterial(client, base64Image, imageType)
    if (!cachedAnalysis) {
      console.log(`[generate-slot:${slot}:${productType || 'CUR'}] analysis:`, fabricAnalysis.slice(0, 120))
    }

    // Step 2: Build prompt theo type
    const prompt = buildPrompt(slot, {
      fabricAnalysis,
      colorName,
      targetColor,
      supplier,
      collection,
      materialMetadata,
      scaleMetadata,
      productType,
      nccCode,
    })

    // Step 3a: gpt-image-1 via images.edit() — preserves reference texture
    try {
      const imageFile = await toFile(imageBuffer, `texture.${imageType}`, { type: `image/${imageType}` })
      const editResponse = await client.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt,
        n: 1,
        size: '1024x1024',
        quality: imageQuality,
      })
      const b64 = editResponse.data[0]?.b64_json
      if (!b64) throw new Error('images.edit trả về rỗng')
      return res.status(200).json({
        ok: true, slot,
        imageUrl: `data:image/png;base64,${b64}`,
        model: 'gpt-image-1-edit',
        fabricAnalysis,
        productType: productType || null,
      })
    } catch (e1) {
      if (e1.status === 429 || String(e1.message).includes('Billing') || String(e1.message).includes('billing')) {
        throw e1 // Lỗi billing/rate-limit: không cần fallback, throw ngay
      }
      console.warn(`[generate-slot:${slot}] images.edit thất bại — HTTP ${e1.status || '?'}: ${e1.message}`)
    }

    // Step 3b: gpt-image-1 generate fallback (không cần reference image)
    const genResponse = await client.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium',
    })
    const b64Gen = genResponse.data[0]?.b64_json
    if (!b64Gen) throw new Error('images.generate trả về rỗng')
    return res.status(200).json({
      ok: true, slot,
      imageUrl: `data:image/png;base64,${b64Gen}`,
      model: 'gpt-image-1-gen',
      fabricAnalysis,
      productType: productType || null,
    })
  } catch (error) {
    console.error(`[generate-slot]`, error?.message || error)
    const msg = error?.message || ''
    const userError = (msg.includes('Billing') || msg.includes('billing') || msg.includes('hard limit'))
      ? 'Tài khoản OpenAI đã chạm giới hạn thanh toán. Vui lòng nạp thêm credit tại platform.openai.com/account/billing.'
      : msg || 'Lỗi khi gọi OpenAI tạo ảnh.'
    return res.status(500).json({ ok: false, error: userError })
  }
}
