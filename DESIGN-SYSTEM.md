# Leep Audio — Player & Waveform Design System

A guide to recreate the Leep audio player and its signature **hybrid waveform**
(measured strip + particle-field selection). Written so another agent can rebuild
the component from scratch and keep it on-brand.

---

## 1. Design language

Editorial, dark, technical. Think a music tool, not a streaming app. Serif display
type over a near-black canvas, one restrained teal used only for the primary action
and the active sample selection.

- **Primary color is teal (`#2BD4C0`)**, used sparingly: play button, selection,
  active nav underline, key numbers. Never as large fills or gradients-for-decoration.
- **No neon rainbows, no glowing EQ bars, no glassmorphism clutter.** Character comes
  from contrast, rhythm, density, typography, and intentional motion.

---

## 2. Tokens

All tokens live on `:root` in `assets/css/leep.css`.

### Color
> The accent is Leep **teal** (#2BD4C0). For brevity the CSS tokens keep the `--green*` names but hold teal values.
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0B` | page canvas |
| `--surface-1` | `#141416` | cards, player |
| `--surface-2` | `#1A1A1D` | insets, waveform bg |
| `--surface-3` | `#212125` | popovers, slider track |
| `--line` | `rgba(240,239,233,0.08)` | hairline borders |
| `--line-strong` | `rgba(240,239,233,0.14)` | emphasized borders |
| `--text` | `#F2F1EC` | primary text (warm off-white) |
| `--dim` | `#9B9B9E` | secondary text |
| `--faint` | `#67676B` | labels, captions |
| `--green` | `#2BD4C0` | primary / selection |
| `--green-hover` | `#46DDCB` | primary hover |
| `--green-ink` | `#05332E` | text on green fills |
| `--green-wash` | `rgba(43,212,192,0.12)` | selection background |
| `--green-line` | `rgba(43,212,192,0.5)` | selection edges, active rules |

Contrast: `--text` on `--bg` ≈ 17:1; `--dim` on `--bg` ≈ 6:1; `--green-ink` on
`--green` ≈ 8:1. All pass WCAG AA. Never put plain black/gray text on a teal fill —
use `--green-ink`.

### Type
- **Display / headings:** Fraunces (variable serif), weight 500, `letter-spacing:-0.01em`.
- **UI / body:** Inter, weights 400/500.
- **Data / time / ASCII:** JetBrains Mono.

Scale: h1 26px, section h2 24px, card h3 18px, body 15px, label 11px uppercase
`letter-spacing:0.2em`, time/mono 12px. Minimum rendered text 11px.

### Motion
- `--ease: cubic-bezier(.4,0,.2,1)`, `--dur: .2s`.
- Hover/press: background + border transitions, `active` scale `.96–.98`.
- Dock slide-in: `transform` over `.34s`.
- Selection toolbar: opacity + 6px rise over `.2s`.
- Waveform particles: continuous, but **only inside the selection** (cheap on mobile).
- Honor `prefers-reduced-motion: reduce` (disables transitions/animations).

### Layout
- Radius: controls 8px, cards 12–16px, pills 20px. Icon buttons are circles.
- Grid: `200px | 1fr | 300px` (nav rail / content / info rail). Collapses the left
  rail < 1080px, right rail < 860px, single column < 860px.

---

## 3. The hybrid waveform (the signature)

**Concept:** the whole track renders as a precise **measuring strip** (ruler ticks that
accurately reflect amplitude). The instant the user selects a region, that span
dissolves into a **living particle field** with a dimension bracket showing its length.
Precision where you read; personality where you create.

### Anatomy (left→right, bottom→top)
1. **Baseline** at ~74% of canvas height. Faint full-width rule.
2. **Ticks**: one every 6px (full) / 4px (mini). Height = amplitude × (baseline − topPad).
   Color: `--text@55%` if before playhead (played), `--text@17%` if after (unplayed).
3. **Grid**: 8 faint vertical guides (full view only).
4. **Selection** `[a,b]` (fractions 0–1):
   - Ticks inside the span are **replaced** by a particle field: per column, N dots
     (N = round(amplitude × 9)), stacked from baseline up, green, with per-dot sine
     jitter and twinkling alpha. Mini uses N × 6 and smaller radius.
   - `--green-wash` fill behind it; solid `--green-line` edges.
   - **Dimension bracket** across the top with the sample length in mono (full view).
5. **Playhead**: 1px warm-white line + a 2.6px dot cap at the top.

### Data
Amplitude comes from **real peaks** decoded from the master, not random bars.
`assets/js/peaks.js` exports `window.LEEP_PEAKS = { dur, peaks:[512 floats 0..1] }`,
generated once at build time (ffmpeg → mono PCM → max+RMS blend per bucket → normalize).
`LeepWaveform.amp(frac)` linearly interpolates the 512 peaks.

### Interaction model (critical)
- **Tap = scrub.** A click/short drag (<4px) moves the playhead (`onScrub`).
- **Drag = select.** A deliberate horizontal drag sets the selection (`onSelect`),
  live while dragging. This separation stops users nuking a selection while seeking.
- Selection persists until a new drag or an explicit **Clear**.
- `touch-action: none` on the canvas so drags do not scroll the page.

### Rendering cost
Canvas 2D, one `requestAnimationFrame` loop per instance. Static strip ticks + particles
only inside the selection. No WebGL, no per-frame DOM. DPR-aware; re-measures on resize
and via `ResizeObserver`.

---

## 4. Player component

Two presentations share one controller and one renderer:

- **Full view** (`.player` on the track page): mini cover + title/artist, like, time row,
  waveform (112px), hint, selection toolbar (Clear / Preview / Download sample),
  **centered transport** (restart · big green play · forward), and a bottom row with
  volume (left) and follow (right).
- **Mini view** (`.dock`, fixed bottom): cover + title/artist, transport, compact
  waveform (46px), time, volume, like, expand. A floating `.dock-sel` toolbar appears
  above the bar when a selection exists (Preview / Download / **Expand to edit**).

### What stays available in the mini-player
Play/pause, restart/forward, scrub, **select and download a sample**, volume, like,
and expand. Precise handle-dragging and the full sample toolbar live in the expanded
(full) view — "Expand to edit" deep-links back to it with the selection intact.

### Controller (`assets/js/player.js` → `window.LeepPlayer`)
Single detached `Audio` element + state persisted to `localStorage` (`leep.player.v1`),
so the mini-player resumes position, selection, volume, like, and follow across pages.

API: `on(fn)`, `play/pause/toggle`, `seek(frac)`, `setVolume(v)`,
`setSelection(a,b)`, `clearSelection()`, `toggleLike()`, `toggleFollow()`,
`previewSelection()` (plays only `[a,b]`), `downloadSample()`, `getState()`, `resume()`.

`getState()` returns `{progress, selA, selB, duration, playing}` — the only thing the
waveform needs. UI subscribes via `on()` and re-renders on every state change.

### Sample extraction (`assets/js/wav.js`)
`LeepWav.sliceToWav(audioBuffer, startSec, endSec)` → 16-bit PCM WAV `Blob`
(handles mono/stereo, interleaved). `download(blob, name)` saves it. The buffer is
decoded lazily via `fetch + decodeAudioData` on first download/preview.

---

## 5. File structure

```
leep-audio-player/
  index.html            full track page
  browse.html           Discover feed + docked mini-player
  exploration.html      phase-1 concept board (6 waveforms)
  exploration-2.html    plucks + the chosen hybrid
  DESIGN-SYSTEM.md       this file
  assets/
    css/leep.css        tokens + layout + player + mini + responsive
    js/peaks.js         real peak data (generated from the master)
    js/waveform.js      LeepWaveform — hybrid renderer + tap/drag input
    js/player.js        LeepPlayer — audio, state, persistence, WAV export
    js/wav.js           AudioBuffer → WAV slice
    audio/track.mp3     the master
```

### To reuse the waveform elsewhere
```html
<canvas id="w"></canvas>
<script src="assets/js/peaks.js"></script>
<script src="assets/js/waveform.js"></script>
<script>
  new LeepWaveform(document.getElementById('w'), {
    peaks: LEEP_PEAKS.peaks,
    mini: false,                       // true for the dock size
    getState: LeepPlayer.getState,     // {progress, selA, selB, duration, playing}
    onScrub: f => LeepPlayer.seek(f),
    onSelect: (a,b) => LeepPlayer.setSelection(a,b)
  });
</script>
```

---

## 6. Accessibility & responsive notes
- Every control has an `aria-label`; the canvas is labelled as draggable-to-select.
- Focus-visible rings on buttons (2px green, offset from bg).
- Touch targets ≥ 34px; dock reflows to two rows under 720px (id + controls, then
  full-width waveform).
- Text never relies on color alone; selection is shown by particles + brackets + fill.
- `prefers-reduced-motion` disables all transitions/animation.

