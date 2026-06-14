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

MATERIAL: ${desc}
${colorLine}

SCENE: The material displayed filling the entire frame as the sole subject. For flexible materials, a gentle natural drape or soft roll at one edge gives dimension. For rigid materials (slats, panels), flat precise arrangement.

COMPOSITION & CAMERA:
- Material fills 100% of the frame — no background, no props, no ruler
- Slight overhead angle (75–80°) for subtle depth and perspective
- Entire surface in sharp focus edge to edge
- Pattern/grain/texture structure fully centered and visible

LIGHTING:
- Soft directional sidelight at 30–45° from upper left to reveal three-dimensional texture
- No harsh shadows, no hotspots or glare
- Even luminosity across the frame
- Light temperature: warm neutral daylight

STYLE: Premium material swatch photography. Liberty Fabrics / Schumacher / Maharam / Hunter Douglas catalog quality.

CRITICAL: Reproduce exact pattern, colors, surface texture with maximum fidelity. This is the hero texture shot — no alterations, no simplification, no added props. No ruler, no hands, no furniture in this shot.
${scaleLine}
${brandLine}
${noText}`
}

function slot5_ruler(desc, colorLine, brandLine, noText, productType) {
  const materialNote = ['WB', 'AL'].includes(productType)
    ? 'a slat of this material — clearly showing the slat width in centimeters'
    : 'a flat sample of this fabric or material'
  return `Technical measurement reference photography.

MATERIAL: ${desc}
${colorLine}

SCENE:
- ${materialNote} laid perfectly flat on a pure white surface
- A classic wooden ruler (cm markings, 0–15cm clearly visible) placed horizontally across or alongside the material
- Ruler markings crisp and readable (1, 2, 3... cm)
- Material surface and texture visible clearly beside and around the ruler

LIGHTING:
- Bright, even, flat overhead lighting — zero harsh shadows, zero glare on ruler or material
- Material surface texture must be visible (not blown out)

CAMERA:
- Directly overhead (bird's eye view, 90° top-down)
- Perfectly level, no perspective distortion
- Material and ruler fill the frame

BACKGROUND: Pure white seamless surface.

STYLE: Technical specification photography. Clinical, precise.

CRITICAL: Ruler cm markings must be clearly legible. Material surface/texture must be shown.
${brandLine}
${noText}`
}

// ── CUR: Rèm vải (blackout / dimout / sheer) ─────────────────────────────────
const CUR = {
  slot_2: (desc, colorLine, brandLine, noText) => `Professional textile showroom photography.

FABRIC: ${desc}
${colorLine}

SCENE: An elegant woman's hand lightly pinches the top edge of this curtain fabric between thumb and index finger. The fabric cascades downward in soft, natural folds revealing drape and weight. Grip is relaxed and refined, not clutching.

COMPOSITION & CAMERA:
- Medium close-up, 45° diagonal from slightly above
- Shallow depth of field: fabric texture sharp, hand slightly soft
- Fabric fills 70% of frame

LIGHTING: Soft diffused studio key light from upper left. Reveals surface texture and weave.

BACKGROUND: Clean seamless white or very light warm gray studio.

STYLE: Luxury curtain fabric catalogue — Rubelli, Dedar quality.

CRITICAL: Exact fabric pattern, weave, color must be faithfully reproduced. No sofa, no furniture in this shot.
${brandLine}
${noText}`,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional luxury window treatment photography — curtain panels.

FABRIC: ${desc}
${colorLine}

SCENE: Elegant floor-to-ceiling curtain panels of this fabric:
- 2 panels on a slim minimal rod (brushed gold or matte black)
- Panels softly parted in the middle with relaxed natural wave folds
- Full length from ceiling to floor, just grazing the floor
- Soft diffused daylight filtering through or beside the panels

ROOM: Light airy minimal interior. Warm white walls. Parquet or light wood floor. Morning light creating luminous effect through the curtain. Gentle fold shadows reveal fabric depth.

CAMERA: Full vertical composition, slight 3/4 angle showing drape depth, wide enough for room context.

STYLE: High-end window treatment — Designers Guild, Colefax & Fowler. Elegant, airy, architectural.

CRITICAL: Fabric pattern and color must be visible on the curtain surface. Natural soft drape — not stiff or synthetic. No sofa in this shot.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional luxury curtain close-up photography.

FABRIC: ${desc}
${colorLine}

SCENE: A close-up of a hanging curtain panel:
- One or two elegant natural wave folds in frame
- Panel caught in soft side-light showing fabric surface texture
- No hardware visible — fabric and folds only

COMPOSITION & CAMERA:
- Medium close-up: fabric fills 80% of frame
- Slight diagonal angle showing drape depth
- Sharp focus on center fold, slight blur at edges

LIGHTING: Soft side-light revealing woven texture and sheen. Gentle gradient from light to shadow.

BACKGROUND: Soft window light or unobtrusive plain interior wall.

STYLE: Editorial curtain detail. Fabric character and drape quality are the heroes.

CRITICAL: Fabric weave, pattern and color must be recognizable. Natural drape — no CGI perfection. No sofa.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_6: (desc, colorLine, brandLine, noText) => `Luxury macro textile detail photography.

FABRIC: ${desc}
${colorLine}

SCENE: The fabric folded at a crisp 90° angle showing:
- FRONT face with full pattern and surface texture
- Folded EDGE revealing interior weave structure and thread cross-section
- Both surfaces simultaneously visible

LIGHTING: Raking sidelight or macro ring light to emphasize three-dimensional woven structure. Crisp illumination with soft shadow in fold for depth.

CAMERA: Extreme macro close-up — fold edge is primary subject. Razor-sharp focus at fold. Very shallow DOF, background fabric fades to soft blur. 45° angle to fold edge.

BACKGROUND: Softly blurred neutral background (warm cream or matching palette).

STYLE: Premium material sample — Maharam or Kvadrat quality.

CRITICAL: Exact weave structure, fiber texture, pattern and color faithfully reproduced. Show tactile quality and depth.
${brandLine}
${noText}`,
}

// ── FAB: Sofa / Vải bọc ──────────────────────────────────────────────────────
const FAB = {
  slot_2: CUR.slot_2,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional luxury interior design photography — upholstered sofa.

FABRIC: ${desc}
${colorLine}

SCENE: A contemporary 2–3 seat sofa fully upholstered in this fabric:
- Clean straight-lined silhouette, tight seat cushions, low-profile arms
- 1 large square decorative pillow + 1 rectangular lumbar pillow in same fabric
- Small round side table partially visible (light oak or marble top)
- Minimal decor: one tall vase or subtle artwork in background

ROOM: Minimalist Scandinavian-inspired living space. Warm white textured walls. Light wood or matte concrete flooring. Soft natural daylight from left.

CAMERA: 3/4 front view, slight low angle at seat-cushion eye level, showing full sofa.

STYLE: Interior design magazine — Architectural Digest, Elle Decor. Aspirational, warm, refined.

CRITICAL: Exact fabric pattern, texture and color must cover sofa and pillows faithfully. No curtains in this shot. Do not substitute with leather, velvet, or different material.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional luxury sofa detail photography — cushion and fabric close-up.

FABRIC: ${desc}
${colorLine}

SCENE: A close-up of the sofa arm and seat corner or a decorative throw pillow:
- Fabric surface and weave texture are the primary subject
- Natural light catching the woven surface from a low angle
- Cushion depth and any piping/seam detail visible

COMPOSITION: Medium close-up, fabric and cushion fill 85% of frame. Slight overhead angle. Sharp focus on fabric surface, very shallow DOF.

LIGHTING: Soft natural side light from a window. Reveals fabric texture and depth without glare.

BACKGROUND: Blurred sofa and warm residential living room context.

STYLE: Luxury upholstery detail photography.

CRITICAL: Fabric weave, texture and color must be clearly visible and recognizable. No curtains.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_6: CUR.slot_6,
}

// ── CUR_FAB: Rèm + Sofa hỗn hợp ─────────────────────────────────────────────
const CUR_FAB = {
  slot_2: CUR.slot_2,
  slot_3: FAB.slot_3,
  slot_4: CUR.slot_3,
  slot_6: CUR.slot_6,
}

// ── BL: Rèm cuốn ─────────────────────────────────────────────────────────────
const BL = {
  slot_2: (desc, colorLine, brandLine, noText) => `Professional roller blind material close-up photography.

MATERIAL: ${desc}
${colorLine}

SCENE: A hand gently touching or lightly gripping the edge of a roller blind fabric panel. The material is rolled out flat or hanging cleanly, showing its smooth surface and any texture. Hand gives scale and tactile context.

COMPOSITION: Medium close-up, material fills most of frame. Hand at top edge showing the clean hem.

LIGHTING: Even soft studio light revealing surface texture.

BACKGROUND: Clean white or light neutral studio.

STYLE: Premium roller blind fabric sample photography.

CRITICAL: Reproduce exact material texture and color. No sofa, no draping curtain folds — flat clean surface only.
${brandLine}
${noText}`,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional interior photography — roller blind installed in a room.

MATERIAL: ${desc}
${colorLine}

SCENE: A clean minimal interior window with a roller blind:
- Blind approximately 2/3 rolled down showing the flat fabric surface clearly
- Roller tube and chain/cord mechanism visible at top bracket
- Clean aluminum bottom bar at the hem
- Soft filtered light through or beside the blind

ROOM: Modern minimal interior — white walls, clean window frame, contemporary furniture partially visible. Natural daylight setting.

CAMERA: Front-facing at window height, showing full blind width.

STYLE: Premium roller blind installation photography.

CRITICAL: Blind fabric must show actual material texture and color. NOT a draping curtain — flat, clean, taut surface. No sofa.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — roller blind side profile and mechanism.

MATERIAL: ${desc}
${colorLine}

SCENE: A roller blind from a side or 3/4 angle showing:
- The rolled-up fabric on the roller tube at the top
- The fabric dropping cleanly showing a few inches of flat surface
- Chain or cord mechanism on the bracket side
- Clean, precise, product-focused composition

CAMERA: Side or 3/4 angle showing mechanism and fabric.

LIGHTING: Clean product photography — even, no harsh shadows on fabric surface.

BACKGROUND: Clean white or very light neutral.

STYLE: Technical product catalog photography for roller blinds.

CRITICAL: Material texture on the unrolled fabric section must be visible. Not a draping curtain.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_6: (desc, colorLine, brandLine, noText) => `Professional product detail photography — roller blind bottom bar and hem.

MATERIAL: ${desc}
${colorLine}

SCENE: Close-up of the roller blind bottom area:
- Clean aluminum bottom bar visible
- Fabric edge where it meets the bottom bar
- Material surface showing texture detail at the hem

CAMERA: Close-up from slightly below and in front showing hem and bar.

LIGHTING: Even bright light, no harsh shadows.

BACKGROUND: Clean white or light neutral.

STYLE: Product specification photography.

CRITICAL: Show material surface texture and precise hem construction.
${brandLine}
${noText}`,
}

// ── WB: Sáo gỗ ───────────────────────────────────────────────────────────────
const WB = {
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — wood blind slat close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: 2–3 horizontal wood slats in extreme close-up:
- Slats parallel with slight overlap showing depth
- Wood grain texture prominently visible across slat face
- Natural wood tones and finish clearly shown

COMPOSITION: Slightly diagonal (15°), sharp focus across slat surfaces, frame filled with slat textures.

LIGHTING: Raking side-light revealing wood grain three-dimensionally.

BACKGROUND: Softly blurred slats.

STYLE: Premium wood blind material sample photography.

CRITICAL: Wood grain, color, and finish clearly and faithfully shown. Not fabric. Not aluminum.
${brandLine}
${noText}`,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional interior photography — wood venetian blind in a room.

MATERIAL: ${desc}
${colorLine}

SCENE: A wood venetian blind at a full-height window:
- Slats tilted approximately 45° letting in filtered natural light
- Light and shadow playing through slats onto the interior
- Warm residential interior context matching natural wood tones

ROOM: Sophisticated residential or boutique hospitality interior. Warm neutral walls. Natural materials (wood, linen, stone). Natural light from beside/behind the blind.

CAMERA: 3/4 angle from inside, showing full blind width.

STYLE: Premium wood blind interior photography. Warm, sophisticated, architectural.

CRITICAL: Wood grain and color must be recognizable. Not fabric. Not aluminum. No sofa.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — wood blind tilt operation.

MATERIAL: ${desc}
${colorLine}

SCENE: A wood venetian blind showing the tilt operation:
- Slats at two different tilt angles (some open, some tilting closed)
- Ladder cord and tilt wand/cord clearly visible
- 4–6 slats in frame showing the full louver arrangement

CAMERA: 3/4 front angle.

LIGHTING: Studio or window light showing slat depth and ladder cord.

STYLE: Product operation photography.

CRITICAL: Wood slat material, grain, and color clearly shown in both tilt positions.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_6: (desc, colorLine, brandLine, noText) => `Professional product detail photography — wood blind hardware and construction.

MATERIAL: ${desc}
${colorLine}

SCENE: A close-up detail showing one of:
- Ladder tape running vertically between wood slats (if present)
- Cord lock or tilt mechanism hardware at the headrail
- Cross-section of 3–4 slats showing the slat edge thickness

LIGHTING: Sharp detailed product lighting.

STYLE: Technical product detail photography.

CRITICAL: Wood material quality and construction detail accurately shown.
${brandLine}
${noText}`,
}

// ── AL: Sáo nhôm ─────────────────────────────────────────────────────────────
const AL = {
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — aluminum blind slat close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: 2–3 horizontal aluminum slats in extreme close-up:
- Powder-coated or anodized aluminum surface clearly shown
- Smooth metallic finish, any subtle sheen or texture of the coating visible
- Clean, precise metallic character

COMPOSITION: Slightly diagonal, sharp focus across slat faces.

LIGHTING: Even studio light showing aluminum surface finish and subtle metallic sheen.

BACKGROUND: Clean white.

STYLE: Premium aluminum blind sample photography. Precise, modern.

CRITICAL: Aluminum surface, color, and finish clearly shown. Not fabric. Not wood.
${brandLine}
${noText}`,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional interior photography — aluminum venetian blind in a room.

MATERIAL: ${desc}
${colorLine}

SCENE: Aluminum venetian blind at a window, slats tilted open (30–45°):
- Clean metallic surface catching light cleanly
- Linear light/shadow patterns through slats onto the interior
- Modern clean interior context

ROOM: Contemporary office or modern residential interior. Clean lines, minimal palette. Natural light from beside/behind the blind.

CAMERA: 3/4 angle from inside the room.

STYLE: Modern interior / premium window furnishing photography.

CRITICAL: Aluminum material character preserved — metallic, clean finish, not fabric-like, not wood-like. No sofa. No curtains.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — aluminum blind tilt and mechanism.

MATERIAL: ${desc}
${colorLine}

SCENE: Aluminum venetian blind showing tilt states:
- Half slats tilted open, half tilted toward closed position
- Ladder cord and wand/cord mechanism clearly visible
- Clean angular aluminum surfaces catching light at different angles

CAMERA: Front or slight 3/4 angle showing multiple slats.

LIGHTING: Even product lighting showing metallic surface at different angles.

STYLE: Product operation and mechanism photography.

CRITICAL: Aluminum slat material — not fabric, not wood. Show angular, clean metallic character in both tilt states.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_6: (desc, colorLine, brandLine, noText) => `Professional product detail photography — aluminum blind components.

MATERIAL: ${desc}
${colorLine}

SCENE: A close-up detail showing one of:
- Cord ladder with aluminum slats showing slat edge profile (e.g. 25mm or 50mm width)
- Bottom rail with cord lock and bottom bar detail
- Headrail bracket and cord/wand mechanism

LIGHTING: Sharp, clean product lighting showing metallic precision.

STYLE: Technical specification photography.

CRITICAL: Show aluminum slat construction and quality accurately. Not fabric.
${brandLine}
${noText}`,
}

// ── RM: Roman blind ───────────────────────────────────────────────────────────
const RM = {
  slot_2: CUR.slot_2,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional interior photography — Roman blind in a room.

FABRIC: ${desc}
${colorLine}

SCENE: A Roman blind fully lowered at a window:
- Clean horizontal fold/pleat structure characteristic of Roman blinds
- Fabric hanging straight with characteristic horizontal pleats visible at bottom
- Full window width

ROOM: Elegant residential interior — warm neutral palette. Window with natural daylight filtering through or beside the blind.

CAMERA: Front-facing at room level showing full blind width.

STYLE: Premium Roman blind catalog photography.

CRITICAL: Fabric pattern and texture visible on the Roman blind surface. Horizontal fold/pleat structure clearly Roman blind style — not curtain, not roller blind. No sofa.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional detail photography — Roman blind fold structure.

FABRIC: ${desc}
${colorLine}

SCENE: A Roman blind partially raised showing:
- 3–5 horizontal folds visible as the blind lifts
- Fabric accumulating in structured horizontal pleats
- Lifting cord through rings visible at back edge if possible
- Fabric texture clearly shown on the face of each fold

COMPOSITION: 3/4 angle or slight side view showing fold depth and structure.

LIGHTING: Side light revealing fold shadows and fabric texture.

STYLE: Detail photography showing Roman blind construction quality.

CRITICAL: Roman pleat/fold structure clearly shown. Fabric pattern and texture recognizable on each pleat.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_6: (desc, colorLine, brandLine, noText) => `Professional detail photography — Roman blind construction detail.

FABRIC: ${desc}
${colorLine}

SCENE: Close-up of Roman blind construction showing one of:
- Horizontal rod pocket seam stitching on the reverse side
- Ring attachment detail showing lifting cord path
- Front-facing view of bottom bar hem and fabric finish

LIGHTING: Sharp, even close-up detail lighting.

STYLE: Construction quality detail photography.

CRITICAL: Show fabric quality and sewing/construction precision.
${brandLine}
${noText}`,
}

// ── HN: Tổ ong ───────────────────────────────────────────────────────────────
const HN = {
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — honeycomb blind cell close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: Extreme close-up of the honeycomb blind fabric:
- Hexagonal cell structure visible across the frame
- The cellular void depth creating a pronounced 3D structure
- Front face or slight angled view of cells

COMPOSITION: Tight macro shot, cells fill the frame.

LIGHTING: Back-lit or side-lit to reveal translucent cell walls and interior depth.

STYLE: Technical material close-up photography.

CRITICAL: Honeycomb cell structure must be clearly visible as 3D cells with depth. Not flat fabric. Not slats.
${brandLine}
${noText}`,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional interior photography — honeycomb blind in a room.

MATERIAL: ${desc}
${colorLine}

SCENE: A honeycomb (cellular) blind installed at a large window:
- Blind fully lowered, clean face showing
- Subtle cellular texture subtly visible from the room side
- Soft diffused light through the cells (if light-filtering) or solid surface (if blackout)

ROOM: Clean modern interior with white or neutral walls. Contemporary setting.

CAMERA: Front-facing from room level.

STYLE: Premium cellular shade interior photography.

CRITICAL: The cellular blind is recognizable — not a flat roller blind, not a curtain. Cell structure subtly visible. No sofa. No curtains.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — honeycomb blind side section view.

MATERIAL: ${desc}
${colorLine}

SCENE: Cross-sectional or extreme side-angle view of the honeycomb blind:
- Individual cells visible in cross-section from the side edge
- Air pockets within each hexagonal cell clearly shown as depth
- Multiple rows of cells visible showing the full pleat height

CAMERA: Pure side view or extreme 3/4 angle showing cell depth.

LIGHTING: Side light or back light illuminating cell interiors.

STYLE: Technical cross-section photography demonstrating insulation cell structure.

CRITICAL: Honeycomb cell interior structure must be clearly shown as hollow cells with depth. This distinguishes it from roller blinds.
${brandLine}
${noText}`,

  slot_6: (desc, colorLine, brandLine, noText) => `Professional product detail photography — honeycomb blind track and hardware.

MATERIAL: ${desc}
${colorLine}

SCENE: Close-up detail showing one of:
- Top track or bottom rail with blind fabric edge
- Cord or cordless lifting mechanism detail
- Close view of cell face showing texture and translucency quality

LIGHTING: Sharp detail lighting.

STYLE: Technical product photography.

CRITICAL: Show cellular blind construction quality accurately.
${brandLine}
${noText}`,
}

// ── CB: Cầu vồng / Zebra ─────────────────────────────────────────────────────
const CB = {
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — zebra blind fabric close-up.

FABRIC: ${desc}
${colorLine}

SCENE: Close-up of the zebra (dual-layer day/night) blind fabric:
- Alternating sheer (translucent) and opaque horizontal stripes clearly visible
- Stripe pattern filling the frame
- Natural light difference between sheer and opaque bands visible

COMPOSITION: Front or slight angle, stripes running horizontally.

LIGHTING: Back-lit or diffused to distinguish sheer vs opaque stripes.

STYLE: Premium zebra blind fabric sample photography.

CRITICAL: Alternating sheer/opaque stripe structure must be clearly shown. Not solid fabric. Not venetian slats.
${brandLine}
${noText}`,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional interior photography — zebra blind in a room.

FABRIC: ${desc}
${colorLine}

SCENE: A zebra (day/night) blind installed at a window:
- Sheer and opaque bands partially aligned for soft filtered light
- Dual-layer fabric hanging cleanly from the roller mechanism
- Modern clean interior context

ROOM: Modern minimal residential or boutique hospitality interior.

CAMERA: Front-facing or slight 3/4 angle.

STYLE: Premium zebra blind interior photography.

CRITICAL: Alternating sheer/opaque stripe character must be recognizable. Not a plain roller blind. Not a curtain. No sofa.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — zebra blind open/close operation.

FABRIC: ${desc}
${colorLine}

SCENE: The zebra blind demonstrating the stripe alignment mechanism:
- One position: stripes aligned (sheer on sheer) = maximum light through sheer bands
- Other position: stripes offset (opaque covering sheer) = closed/darkened
- Chain cord mechanism visible at side
- Both states or transition state visible

LIGHTING: Backlighting to demonstrate light transmission difference between states.

STYLE: Operation demonstration photography.

CRITICAL: The stripe alignment/offset mechanism clearly shown. Demonstrate how blind controls light through stripe position.
${brandLine}
${noText}`,

  slot_6: (desc, colorLine, brandLine, noText) => `Professional product detail photography — zebra blind stripe detail.

FABRIC: ${desc}
${colorLine}

SCENE: Close-up showing:
- The bottom hem of the zebra blind with the aluminum bottom bar
- Stripe pattern at hem clearly showing sheer/opaque alternation
- OR extreme close-up of the sheer-to-opaque stripe transition zone

LIGHTING: Even close-up lighting.

STYLE: Product detail photography.

CRITICAL: Sheer/opaque stripe character must be preserved and recognizable at close range.
${brandLine}
${noText}`,
}

// ── BB: Trúc / Bamboo ─────────────────────────────────────────────────────────
const BB = {
  slot_2: (desc, colorLine, brandLine, noText) => `Professional product photography — bamboo blind material close-up.

MATERIAL: ${desc}
${colorLine}

SCENE: Extreme close-up of the bamboo/reed blind material:
- Individual bamboo or reed slats or woven structure clearly visible
- Natural bamboo grain, color variation, and weave/binding pattern shown
- Organic natural character of the material prominent

COMPOSITION: Tight macro, material filling the frame.

LIGHTING: Natural or raking side light revealing material texture and dimension.

STYLE: Natural materials sample photography.

CRITICAL: Bamboo/reed material character clearly shown — organic, textured, not synthetic fabric, not metal.
${brandLine}
${noText}`,

  slot_3: (desc, colorLine, brandLine, noText) => `Professional interior photography — bamboo blind in a room.

MATERIAL: ${desc}
${colorLine}

SCENE: A bamboo (or woven wood/reed) blind installed at a window:
- Blind in rolled-down position, full width visible
- Natural bamboo or reed texture visible from the room side
- Organic warmth of the material complementing the interior palette

ROOM: Warm natural interior — wooden furniture, natural textiles, organic color palette. Tropical, coastal, or biophilic design theme.

CAMERA: 3/4 angle from room level.

STYLE: Natural interior photography.

CRITICAL: Bamboo/reed material character recognizable — organic, textured. Not fabric, not aluminum. Show natural grain.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_4: (desc, colorLine, brandLine, noText) => `Professional product photography — bamboo blind rolling and operation.

MATERIAL: ${desc}
${colorLine}

SCENE: A bamboo blind partially rolled upward:
- Material rolling from the bottom upward, showing the roll form
- Natural cotton cord and wooden cleat or cord mechanism visible
- The rolled material showing bamboo/reed cross-section as it curves in the roll

COMPOSITION: 3/4 angle showing roll form and operating cord.

LIGHTING: Natural soft lighting showing bamboo texture.

STYLE: Product operation photography.

CRITICAL: Bamboo/reed rolling structure clearly shown — not fabric folding, not aluminum tilting. Show organic natural material character.
${SCALE_NOTE}
${brandLine}
${noText}`,

  slot_6: (desc, colorLine, brandLine, noText) => `Professional product detail photography — bamboo blind edge and weave detail.

MATERIAL: ${desc}
${colorLine}

SCENE: Close-up showing:
- The edge binding (fabric tape binding the sides) with bamboo slats beside it
- OR a cross-section view of the woven structure where slats/reeds meet
- OR a detail of the bottom hanging bar or ring

LIGHTING: Sharp natural detail lighting.

STYLE: Construction quality detail photography.

CRITICAL: Bamboo/reed weave or construction quality and natural material character must be shown.
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

  const desc = fabricAnalysis
    || `material with exact pattern${colorDesc ? `, ${colorDesc} color` : ''}, and texture from the reference image`

  const colorLine = colorDesc
    ? `COLOR: The material is in ${colorDesc} — maintain this exact color throughout the entire image.`
    : ''

  const scaleLine = buildScaleLine(scaleMetadata)

  const brandLine = [
    supplier                    ? `Supplier: ${supplier}.`                   : '',
    collection                  ? ` Collection: ${collection}.`               : '',
    activeColor                 ? ` Colorway: ${activeColor}.`                : '',
    materialMetadata?.thanhPhan ? ` Composition: ${materialMetadata.thanhPhan}.` : '',
  ].join('')

  const noText = 'No text, no watermarks, no logos, no branding overlays.'

  if (slot === 'slot_1') return slot1_surface(desc, colorLine, scaleLine, brandLine, noText)
  if (slot === 'slot_5') return slot5_ruler(desc, colorLine, brandLine, noText, productType)

  const pType = productType || 'CUR'
  const typeFns = TYPE_SLOT_FNS[pType] || TYPE_SLOT_FNS.CUR
  const fn = typeFns?.[slot]
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
    } = req.body || {}

    const VALID_SLOTS = ['slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5', 'slot_6']
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

    // Step 1: Phân tích vật liệu
    const fabricAnalysis = await analyzeMaterial(client, base64Image, imageType)
    console.log(`[generate-slot:${slot}:${productType || 'CUR'}] analysis:`, fabricAnalysis.slice(0, 120))

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

    // Step 3a: gpt-image-1 via images.edit()
    try {
      const imageFile = await toFile(imageBuffer, `texture.${imageType}`, { type: `image/${imageType}` })
      const response = await client.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt,
        n: 1,
        size: '1024x1024',
      })
      const b64 = response.data[0]?.b64_json
      if (!b64) throw new Error('gpt-image-1 không trả về b64_json')
      return res.status(200).json({
        ok: true, slot,
        imageUrl: `data:image/png;base64,${b64}`,
        model: 'gpt-image-1',
        fabricAnalysis,
        productType: productType || null,
      })
    } catch (e1) {
      console.warn(`[generate-slot:${slot}] gpt-image-1 thất bại (${e1.message}) — fallback dall-e-3`)
    }

    // Step 3b: dall-e-3 fallback
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
      quality: 'hd',
    })
    const b64 = response.data[0]?.b64_json
    if (!b64) throw new Error('dall-e-3 không trả về b64_json')
    return res.status(200).json({
      ok: true, slot,
      imageUrl: `data:image/png;base64,${b64}`,
      model: 'dall-e-3',
      fabricAnalysis,
      productType: productType || null,
    })
  } catch (error) {
    console.error(`[generate-slot]`, error?.message || error)
    return res.status(500).json({ ok: false, error: error?.message || 'Lỗi khi gọi OpenAI tạo ảnh.' })
  }
}
