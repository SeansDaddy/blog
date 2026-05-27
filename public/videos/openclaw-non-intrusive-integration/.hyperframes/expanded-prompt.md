# Prompt Expansion: OpenClaw 非侵入式集成

## Source
- Blog post: `openclaw-non-intrusive-integration.md`
- Date: 2026-05-25
- Category: AI Agent

## Style
- Palette (Dark / Premium, tech + cinematic): `#0D1B2A` (bg) / `#1B263B` (fg mid) / `#415A77` (neutral) / `#778DA9` (text secondary) / `#E0E1DD` (text primary) / `#FCA311` (accent — OpenClaw orange)
- Accent hue: `#FCA311` (amber/orange, thematic for OpenClaw branding)
- Mood: Cinematic, architectural diagram energy, premium tech explainer
- Typography: Serif + sans pairing (e.g. Source Serif 4 + Inter)

## Rhythm
`fast-build-SLOW-BUILD-PEAK-breathe-resolve`
Slow: opener tension → SLOW: architecture reveal → BUILD: 5 pillars montage → PEAK: integration closing → breathe: summary

---

## Global Rules
- Background: `#0D1B2A` across all scenes
- Ghost type: "外挂式集成" / "NON-INTRUSIVE" at 3-5% opacity, large, slow drift
- Accent glow: `#FCA311` at 15% opacity, breathing scale
- Hairline rules: `#415A77` at 50% opacity, subtle pulse
- Grid pattern: subtle, in BG layer
- Transition primary: blur crossfade, 0.5s, power2.inOut
- Transition accent: shader cross-warp morph for architecture reveal

---

## Scene Breakdown

### Scene 1: Hook — The Dilemma
**Concept:** Two forces collide — the weight of a legacy system's stability vs. the pull of AI capability. We open on a visual split: left side shows a massive, rigid enterprise system; right side shows a glowing AI signal reaching toward it. The tension is: how do you connect them without breaking what already works?

**Mood:** Cinematic tension. "Two worlds, one decision." Think product reveal trailer energy.

**Depth layers:**
- BG: `#0D1B2A` fill + radial glow center-split (two colors meeting at center)
- MG: Left block "原系统 零改动" (heavy, dark, static); Right block "AI 能力 零侵入" (glowing, breathing)
- FG: Hairline dividing the two worlds + small label "外挂式集成"

**Animation choreography:**
- Scene enters with the split-screen already in place (no entrance needed for BG)
- Left block: CASCADE down from top with heavy ease (power3.in), slight tilt, lands with weight
- Right block: SLIDES in from right with glow pulse on arrival
- Hairline rule: DRAWS across center from left to right, 0.8s
- Label "外挂式集成": TYPES on character by character, 0.05s per char

**Transition:** Blur crossfade out, 0.4s, power2.in

---

### Scene 2: Architecture Overview
**Concept:** The full system is revealed as a living architectural diagram. Data flows like light through fiber — from the browser through the Gateway, through OpenClaw, into the legacy system, then back up the same path. We see the architecture not as a static diagram but as a data flow: packets of intent traveling through layers.

**Mood:** Technical precision meets cinematic reveal. The diagram breathes.

**Depth layers:**
- BG: `#0D1B2A` + subtle grid pattern + `#FCA311` glow emanating from center
- MG: Three vertical lanes (用户端 / AI平台 / 原系统) connected by flowing data particles
- FG: Layer labels (Gateway / OpenClaw / DataProxy) + architectural annotation arrows

**Animation choreography:**
- Three lane containers: DROP in staggered 0.2s per lane, ease `power2.out`
- Data particles: FLOW along connection paths (SVG path animation), continuous loop
- Lane labels: FADE in after lane lands, 0.3s delay each
- Central glow pulse: breathe animation, 3s cycle, infinite

**Transition:** Shader cross-warp morph, 0.7s, power2.inOut — morphs the diagram into a zoomed view

---

### Scene 3: Five Design Pillars
**Concept:** Five pillars rise from the architecture like vertebrae of a spine. Each pillar is a key design point — not text blocks, but visual icons with brief labels that capture the essence. We move through them one by one, each with a distinct visual marker.

**Mood:** Structured revelation. Each pillar has identity. The viewer builds understanding sequentially.

**Depth layers:**
- BG: `#0D1B2A` + five pillar silhouettes in perspective (3D feel, isometric-adjacent)
- MG: Pillar icons (numbered, accent color) + pillar labels
- FG: Connecting spine line that draws as we progress through pillars

**Animation choreography:**
- Pillars CASCADE in from bottom, staggered 0.4s each, ease `elastic.out`
- Each pillar number: SCALES up from 0.5 with bounce
- Spine line: DRAWS horizontally as each pillar appears
- Pillar labels: FADE in 0.2s after their pillar lands
- Ambient: pillars have subtle breathe, 2s cycle, staggered

**Transition:** Whip pan left, 0.4s, power3.inOut

---

### Scene 4: Deep Dives — Pair 1 (认证透传 + 多租隔离)
**Concept:** Two design points explained in detail — authentication passthrough and multi-tenant isolation. We show the mechanism: Session Cookie → Gateway Token → Redis swap → original identity. Then show the isolation layers: enterprise-level vs. user-level. The visual metaphor is layers of glass — each layer transparent but providing structural separation.

**Mood:** Analytical but not dry. "Watch how it works."

**Depth layers:**
- BG: `#0D1B2A` + radial glow behind content area
- MG: Two card panels side by side — left for auth mechanism, right for tenant isolation
- FG: Flow arrows between card panels + legend labels

**Animation choreography:**
- Left card: SLIDES in from left, 0.5s, power2.out
- Right card: SLIDES in from right, 0.5s, power2.out (simultaneous, staggered 0.2s)
- Flow arrows: DRAW one by one, 0.3s each, 0.2s delay between
- Panel labels: FADE in after cards land
- Auth flow step labels: TYPE on sequentially

**Transition:** Blur crossfade, 0.4s, power2.inOut

---

### Scene 5: Deep Dives — Pair 2 (能力边界 + 三层流控)
**Concept:** Capability boundary and three-layer concurrency control. The visual metaphor for boundary: a fence with a gate that only SELECT queries pass through. For the three layers: three concentric rings (Redis / Gateway / OpenClaw sandbox) with labeled protection zones.

**Mood:** Security and control. "Boundaries are a feature."

**Depth layers:**
- BG: `#0D1B2A` + concentric ring pattern center-right
- MG: Left side: fence metaphor with gate icon and "SELECT only" label; Right side: three rings labeled L1/L2/L3
- FG: Layer protection labels + callout annotations

**Animation choreography:**
- Fence: DRAWS around the content area, SVG stroke-dashoffset animation
- Gate icon: DROPS in from top with bounce
- Three rings: SCALE in from center, staggered 0.3s, ease `back.out(1.2)`
- Ring labels: FADE in with scale 0.8→1, 0.2s after ring appears
- Callout lines: DRAW from rings to labels, 0.2s each

**Transition:** Velocity-matched upward, exit blur→entry blur, 0.5s total

---

### Scene 6: Closing — Enterprise Value
**Concept:** The five design principles converge into a single takeaway: non-intrusive integration means the enterprise keeps full control while gaining AI capability. We close with the "外挂式集成" concept restated as a value proposition: evolve without disruption. The final frame is clean, confident — the architecture shown at the top, the five pillars below, a single closing statement.

**Mood:** Confident resolve. "This is how it's done."

**Depth layers:**
- BG: `#0D1B2A` + broad radial glow center-bottom (gold/amber, `#FCA311` at 20%)
- MG: Five pillars reduced in scale, arranged at bottom third
- FG: Closing statement in large type: "复用而非替代" + subtitle: "零侵入 · 企业级 · 可进化"

**Animation choreography:**
- Background glow: PULSES in once, strong
- Statement text: SLAMS in from slight left offset, 0.4s, power3.out
- Subtitle: FADES in 0.3s after statement
- Pillars (scaled): FADE in at bottom, staggered 0.1s, subtle float upward
- All elements: hold for 2s, then FADE to black

**Transition:** Fade to black, 1s, power2.in

---

## Recurring Motifs
- `#FCA311` (OpenClaw amber) as the single accent — used sparingly but distinctly
- Ghost text "NON-INTRUSIVE" or "外挂式" drifting in BG of scenes 2-5
- Grid lines in BG (subtle, `#415A77` at 10% opacity)
- Hairline rules between content sections

## Negative Prompt
- No gradient text fills
- No purple-to-blue gradients
- No centered equal-weight layouts (always lead the eye to a focal point)
- No more than 3 text elements per scene competing for attention
- No static decorative elements (all must have ambient motion)