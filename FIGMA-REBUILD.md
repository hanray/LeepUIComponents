# Leep Audio Player — Figma Rebuild Spec

A complete handoff for rebuilding the **Leep audio player** in Figma with full
fidelity and prototyped functionality. Working reference implementation:
`index.html` / `browse.html` in this repo (https://github.com/hanray/LeepUIComponents).
Live-code behavior details are in `DESIGN-SYSTEM.md`.

> **Scope note.** Figma can faithfully reproduce the *look* and *interaction model*
> (variants, hover, click-through, smart-animate). It cannot run real audio,
> encode WAV files, or render the live canvas. Where a behavior is live-only,
> this doc says how to **represent** it statically and what to **annotate** as a
> prototype note. Build order is bottom-up: Variables → text/effect styles →
> atoms → waveform → player → page → prototype.

---

## 1. Foundations (create as Figma Variables + styles)

### 1.1 Fonts (install / enable)
- **Fraunces** — display serif (headings, track title, card titles). Weight 500.
- **Geist** — UI sans (body, controls, labels). Weights 400 / 500 / 600.
- **Geist Mono** — data/time/numeric (timestamps, "USES", stats).

### 1.2 Color variables (collection: `color`)
| Variable | Hex / value | Use |
|---|---|---|
| `bg` | `#0A0A0B` | page canvas |
| `surface-1` | `#141416` | cards, player |
| `surface-2` | `#1A1A1D` | insets, inputs, waveform bg |
| `surface-3` | `#212125` | popovers, slider track |
| `line` | `#F0EFE9` @ 8% | hairline borders |
| `line-strong` | `#F0EFE9` @ 14% | emphasized borders |
| `text` | `#F2F1EC` | primary text |
| `dim` | `#9B9B9E` | secondary text |
| `faint` | `#67676B` | labels, captions |
| `teal` (primary) | `#2BD4C0` | selection, play, active states |
| `teal-hover` | `#46DDCB` | primary hover |
| `teal-ink` | `#05332E` | text on teal fills |
| `teal-wash` | `#2BD4C0` @ 12% | selection background |
| `teal-line` | `#2BD4C0` @ 50% | selection edges, active rules |
| `rep-number` | `#9FB6E0` | reputation "88" (blue) |
| `rep-bar` | `#7E97C9` | reputation progress bar |
| `marker-violet` | `#A796E8` | sample marker (remix 1) |
| `marker-amber` | `#E0A95C` | sample marker (remix 2) |
| `danger` | `#F0999B` | form error text |
| `hero-eyebrow` | `#BFEEE6` | "NEW RELEASE" over image |

> Primary accent is **teal**. Use it only for: the play button, the active
> sample selection, active nav/section rules, and key numbers. Never as a large
> fill. Reputation uses its own **blue**; sample markers use their own hues.

### 1.3 Text styles
| Style | Font | Size / weight | Tracking | Use |
|---|---|---|---|---|
| Display/XL | Fraunces 500 | 34–60 (hero title) | -2% | "House Baby" |
| H1 | Fraunces 500 | 26 | -1% | artist name |
| H2 | Fraunces 500 | 24 | -1% | section headers |
| H3 | Fraunces 500 | 18 | -1% | card titles |
| Body | Geist 400 | 15 / 1.55 | 0 | paragraphs |
| Label | Geist 500 | 11, UPPERCASE | +20% | eyebrows, rail headers |
| Control | Geist 500 | 13 | 0 | buttons |
| Mono/Time | Geist Mono 500 | 12 | 0 | timestamps, "USES", stats |
| Mono/micro | Geist Mono 500 | 9–11 | +10% | selection duration, chips |

Use **sentence case** everywhere except the small UPPERCASE labels.

### 1.4 Radius / spacing / effects
- Radius: controls **8**, cards **12–16**, pills/chips **20**, avatars/icon-buttons **full**.
- Icon button: **38** circle (34 in dock). Big play (on image): **42** circle. Transport skip: 40.
- Effects (Effect styles):
  - `shadow-card`: y10 blur30 black 40%.
  - `glow-teal`: outer glow teal @ ~45%, blur ~8 (for selected waveform bars + big play).
  - `blur-bg`: Layer Blur **4–5** (applied to the cover image in hover/selection states).
  - `glass`: Background Blur 10 + fill `#0E1013` @ ~66% (selection modal, tooltip, dock).

### 1.5 Motion (for Smart Animate / Prototype)
- Base transition: **200 ms**, ease `cubic-bezier(.4,0,.2,1)` (Figma "Ease out").
- Dock slide-in: **340 ms**. Tooltip/modal fade+rise: **150–200 ms**, 4–6px travel.
- Press feedback: scale 0.96–0.98.

---

## 2. Component inventory (build these, with the listed variants)

| Component | Variants / properties |
|---|---|
| `Waveform` | `state = idle · active`, `selection = none · active`, `markers = on · off`, `size = full · mini` |
| `Marker dot` | `color = violet · amber`, `state = rest · hover` |
| `Sampled-by tooltip` | (swatch color is an instance swap / variable) |
| `Selection modal` | single (shown state) |
| `Big play` | `playing = false · true` |
| `Icon button` | `type = like · follow · download · expand · report · add`, `state = default · active` |
| `Volume` | slider (track + fill + 14px thumb) |
| `Nav bar` | `width = desktop · mobile` |
| `Left rail item` | `state = default · active`, `count = on · off` |
| `Breadcrumb` | — |
| `Remix card` | `hover = false · true` (true = teal ring "flash") |
| `Comment row` | — |
| `Side card` | `type = talent · inspired · reputation · track-info · people` |
| `Mini-player dock` | `selection = none · active` |
| `Track page` | `device = desktop · mobile` (the assembled frame) |

---

## 3. The waveform (signature element)

A dense, **single-sided** bar waveform (bars rise from a baseline — NOT mirrored).

### 3.1 Bars
- Vertical rounded rects: **width 2**, **pitch 3** (≈1px gap). Across the full width,
  that's ~`floor(width/3)` bars. Mini size: width 1.6.
- Baseline at **82%** of the waveform height; bars grow **up** from it toward a top
  pad at **10%**. Max bar height = baseline − topPad.
- Heights follow a music-amplitude envelope. Use the real profile in
  `assets/js/peaks.js` (512 normalized peaks, 0–1) resampled to your bar count, or
  approximate a believable envelope (louder middle, quieter head/tail). Keep it the
  SAME profile across every state so states line up.
- Bar fill by zone:
  - **Unplayed** (right of playhead): `text` @ 20%.
  - **Played** (left of playhead): `text` @ 60%.
  - **Selected** (inside the active selection): `teal`, with `glow-teal`.
- Baseline: 1px line `text` @ 20%. Optional 8 faint vertical gridlines `text` @ 5%
  (full size only; omit on the over-image hero and mini).

### 3.2 Playhead
- 1px vertical line in `#F4F2EC` from top to baseline, with a 2.6px dot cap at the top.
- Position = current time / duration (prototype: show at ~a representative point).

### 3.3 Selection (the "sample lights up")
When a region is selected, within `[start,end]`:
1. A dark **glass** panel behind the selected bars (isolates them from the artwork).
2. The bars in range render in **teal** with `glow-teal` (replace the gray bars).
3. 1px `teal-line` edges at both boundaries.
4. A small top **bracket** `⎡‒‒‒⎤` in `teal-line` with the duration centered above it
   in Mono/micro teal (e.g. `0:26`).
   *(Live build also animates faint rising teal sparks — in Figma just use the solid
   glowing bars; optionally scatter a few 1.5px teal dots for texture.)*

### 3.4 Sample markers ("where others sampled") — DOTS, not bars
Markers must **scale** (dozens of samples), so they are small pins, not spans:
- An **8px dot** in the marker color, with a **3px dark ring** (`bg` @ 65%) and a soft
  colored glow, sitting in a lane just **above** the waveform, centered on the sample's
  **start** x (`left = startTime/duration`).
- Always full-opacity (they sit in a layer ABOVE the dimmable waveform — see 3.6).
- `rest` → 8px; `hover` → scale 1.4.
- **Clustering (for scale):** when two dots would sit within ~14px, collapse them into
  one dot badged with a count (`+3`); hovering expands a small list. Build this as a
  `Marker cluster` variant for the data-heavy case.

### 3.5 Sampled-by tooltip
Glass panel, radius 11, padding 10×13, pointer-less. Contents, left→right:
`[13px color swatch]` + stacked `Sampled by {Artist}` (Fraunces 13.5) over
`{Track} · {start}–{end}` (Geist 12 `dim`). Appears above the hovered dot.

### 3.6 Idle vs active (hover focus) — desktop only
- **Idle:** the waveform (bars + selection + playhead) sits at **20% opacity**; the
  marker dots stay 100%.
- **Hover/active:** waveform → 100%, the **cover image blurs** (`blur-bg` + brightness
  ~58%) and the controls go to 100% — focusing the player.
- On **touch** there is no hover: the waveform is always 100% (no dim, no blur).
  Build this as the `state = idle · active` variant and wire hover in prototype.

---

## 4. Full track page — layout & layers (desktop)

Page bg `bg`. Top-level: sticky **Nav**, then a 2-column **Layout**, then **Footer**.

### 4.1 Nav (height 60, padding 0×28, bottom `line`, glass)
`[Leep Audio` (Fraunces 19) + `BETA` pill]  ·  center links `Discover`(active, teal
underline) `Collaborations` `My Music` `Competitions` `Promo Studio`  ·  right
`[search field 230w]` `142 CR` (mono) `[30px avatar]`.

### 4.2 Layout grid
Auto-layout / grid, max-width ~1300, padding 30×28: **left rail 190** | **main 1fr**,
gap 36.

**Left rail** (sticky): sections with 11px UPPERCASE headers.
- `Discover`: For you · Trending · People (each: 16px line icon + label).
- `Your sound`: **Liked tracks** (active, teal heart) count `28`; **Saved samples**
  (bookmark icon) count badge — hidden at 0, shows a number once ≥1.
- `Genres`: Electronic · Rock & metal · Alt pop · Soul / R&B · Hip-hop.

**Main column** (top → bottom):
1. **Breadcrumb**: `Home` (dim) `›` `Liked tracks` (teal).
2. **Artist header**: 38px round avatar (photo) + `Grugz` (H1) + full-width `teal-line` divider.
3. **Hero player** (section 4.3).
4. **Hint row**: "Right-click and drag to select a sample" (desktop) / on touch a
   "Select sample" button + "Tap Select sample, then drag" (see §7).
5. **Below grid**: content `1fr` | side rail `300`, gap 40.
   - Content: Leave feedback form → Open stems → Inspired remixes → **Comments (last)**.
   - Side rail (stacked, gap 18): Leep has talent · Inspired by the sound? ·
     Leep reputation · Track info · People to follow.

### 4.3 Hero player (player OVER the artwork)
Frame, radius 14, **aspect ≈ 2.9:1** (wide banner), clipped.
Layers back→front:
1. **Cover image** (`assets/img/house-baby.webp`), fill, object-fit cover.
2. **Scrim**: bottom-up gradient `bg`→transparent (so title/wave/controls read).
3. **Top-left stack**: `NEW RELEASE` (label, `hero-eyebrow`) + `House Baby` (Display/XL).
4. **Top-right chip**: "Created from a sample of **HD's "Jump"**" (glass pill, teal link).
5. **Marker lane + dots** (§3.4) at the top of the waveform.
6. **Waveform** (§3) — bars + selection + playhead.
7. **Selection modal** (§5) — centered, visible only in the `selection = active` variant.
8. **Control bar** (bottom, padding 16): left `[42px play]` + `0:00 / 3:24` (mono, current
   in teal) + volume (speaker icon + 88px slider); right `[+ Follow artist]` pill +
   `[like heart]` icon button.

### 4.4 Feedback form
`Leave feedback` label → textarea (`surface-2`, `line-strong`, radius 10, min-h 92,
teal focus ring) → `Timestamp (optional)` label + input → helper text (`faint`) →
`Comment` button (arrow icon). Posting prepends a Comment row.

### 4.5 Open stems
Section header `Open stems` / `03 files`. Rows (`surface-1`, radius 10): name +
mono meta (`WAV · 124 BPM`) + download icon button.

### 4.6 Inspired remixes (links to the markers)
Header `Inspired remixes` / `02 tracks`. Two cards (`remix = default/hover`):
small cover tile with index (01/02) · `[color swatch]` + `USES 0:36 — 1:02` (mono,
swatch = that remix's marker color) · track title (Fraunces) · `by {artist} · {when}`
· play icon. **Hover = teal ring flash** + its marker dot + waveform region highlight.

### 4.7 Comments (last section)
Header `Comments` / count. Rows: 40px round avatar (photo) · `@ {time}` (Fraunces,
time in teal) · comment bubble (`surface-2`, radius 10) · like + report (!) icon buttons.

### 4.8 Side rail cards
- **Leep has talent** (`surface-1`, radius 14): 16:9 photo inset on top; below, `Leep
  has talent.` (H3) + "This track was created using an audio sample from **HD's
  "Jump"**. Visit the **artist page**." (teal links).
- **Inspired by the sound?** (H3) + copy + full-width `Upload my idea` button (upload icon).
- **Leep reputation**: `Leep reputation` (Geist 17) + `88` (Geist 500, **46px**, `rep-number`
  blue) · hairline · progress bar (`rep-bar`, ~88%) · 3 stats (Geist Mono) `24 Tracks ·
  18 Remixed · 96% Would collab again`.
- **Track info**: rows Genre `House` / BPM `124` / Key `F minor` (mono values).
- **People to follow**: rows — 34px initials avatar (MK/SV/PR) + name + role + `＋`
  follow button (`default/active`): Mika Kero/Producer, Sora Vale/Vocalist, Prenida V/Artist.

### 4.9 Footer
4 columns (About / Features / Resources / Legal) + bottom row: `Leep Audio` wordmark +
tagline, and `© 2026 Leep Audio. All rights reserved.`

---

## 5. Selection modal (shown when a selection exists)
Centered over the artwork; while shown, the cover **blurs/darkens** so it reads.
Glass panel, radius 14, padding 14×18, min-width 300, auto-layout vertical, gap 11:
- **Header row**: left = Leep logo (see below) + `Leep` (Fraunces 15); right = `×`
  close (27px round, clears the selection).
- **Label**: `SELECTED 0:36 — 1:02` (Mono/micro, teal).
- **Actions row**: `Save` (bookmark) · `Preview` (play) · **`Download sample`** (primary
  teal, download icon). Save increments the "Saved samples" rail count.

**Leep logo mark:** four teal rounded bars of rising/falling height (a mini waveform) —
heights ≈ [4,10,14,6], width 2.6, in `teal`.

---

## 6. Now-playing dock (persistent, on other pages -- see `browse.html`)
A **full-width** fixed bottom bar (glass, top border `line-strong`, slides up 340ms),
its content padded symmetrically (~28px, lining up with the nav). Three stacked parts:

1. **Waveform** (top, `size=mini`, ~46px): spans the padded content width (lines up with
   the avatar on the left and the controls on the right). Tap=play, drag=scrub,
   right-drag/hold=select. A floating **selection toolbar** appears above the bar when a
   region is selected: `Sample / {len}` + Save + Preview + Download + `Expand to edit`.
2. **Controls row** -- left: **clickable avatar** (the profile link; on hover it shows a
   teal ring + an open-link badge, which replaces any separate Profile link) / track
   title (Fraunces) / artist + `ARTIST` badge / `[play]` / `{time}`. Right: volume / like /
   **share** / expand / **Follow / Following** / **close (x)** -- the x is the OUTERMOST
   item; it pauses and dismisses the dock.
3. **Artist row** (left-justified under the avatar): a location pin + `{location}` /
   `{n} followers` / genre chips / one-line **bio** (ellipsis; cap ~90 chars then
   "...more").

No prev/next skip buttons and **no metric tiles**. Variant: `selection = none / active`.
Mobile: volume / time / expand / chips / bio drop away progressively; **Follow** becomes
an icon-only `+` (teal when following); row 1 keeps avatar / title / play / like / share /
close, row 2 keeps location / followers / Follow.

---

## 7. Responsive / mobile variant (`device = mobile`, ~375 wide)
- Nav: hide center links and the **search**; keep logo + `142 CR` + avatar.
- Hero: taller aspect (~16:13) so the overlaid title/wave/controls fit; control bar wraps
  (play/time/volume on one row, follow/like on the next). Waveform always 100% (no hover).
- The hint becomes "**Tap "Select sample", then drag across the waveform**" and a
  **Select sample** button appears (touch-only). Below grid stacks to one column.
- Selection modal + dots + tooltip behave the same (modal fits 375).

---

## 8. Interactions & prototyping (the "functionality")

Build with **interactive components** (variant swaps on hover/press) + prototype links
+ **Smart Animate** for fades/slides. Represent audio state via the `playing` variant.

| # | Interaction | Trigger | Result (how to prototype) |
|---|---|---|---|
| 1 | Play / pause | click big play | swap `Big play` variant play↔pause (On Click) |
| 2 | Play from a point | click waveform | playhead moves to click x; `playing=true` (annotate: seeks) |
| 3 | Scrub | drag on waveform | playhead follows (annotate: drag-seek; left-drag on desktop) |
| 4 | Select a sample | right-click-drag (desktop) / tap **Select** then drag (touch) | reveal `selection=active` + Selection modal (Smart Animate fade/rise) |
| 5 | Close selection | click `×` | hide modal, clear selection (back to `selection=none`) |
| 6 | Save / Preview / Download | click modal buttons | Save → increment "Saved samples" count; Preview → play range; Download → (live-only, annotate "renders WAV") |
| 7 | Hover a marker dot | hover | dot scales 1.4 + show tooltip + highlight that region on the waveform |
| 8 | Click a marker dot | click | scroll to the matching remix card + flash it (teal ring) |
| 9 | Hover a remix card | hover | card teal-ring flash + its marker dot scales + region highlights |
| 10 | Like / Follow | click | toggle `active` variant (teal) |
| 11 | Volume | drag thumb | fill width changes (annotate) |
| 12 | Navigate away | click a nav/browse link | go to Discover frame; the **now-playing dock** slides up and keeps state |
| 13 | Expand (dock) | click expand / `Expand to edit` | return to the full track page |
| 14 | Idle → focus | hover the player (desktop) | waveform 20%→100%, cover blurs, controls 100% (`state` variant) |
| 15 | Post comment | click `Comment` | prepend a Comment row `@ current-time` (validate non-empty) |
| 16 | Open artist profile | click the dock **avatar** | go to the artist page (avatar hover = ring + open-link badge) |
| 17 | Share | click **share** | native share sheet; falls back to copying the link (annotate) |
| 18 | Close player | click the dock **x** | pause and slide the dock away |
| 19 | Follow (dock) | click **Follow** | toggle Following (teal) |

---

## 9. Live-only behaviors (represent + annotate, don't attempt to run)
- **Real audio playback / scrub / volume** — Figma can't play audio. Prototype the
  visual state (playhead position, play/pause variant) and annotate.
- **WAV sample export** — annotate the Download action ("slices + encodes the selected
  range to a .wav"). No file output in Figma.
- **Canvas particle animation** — the selection is already solid glowing teal bars;
  render that. Skip the live sparks (optional static teal speckles).
- **Persistence across pages** (mini-player resume) — represent with the dock frame
  carrying the same track/selection; annotate "state persists via localStorage".

---

## 10. Asset list
- `house-baby.webp` — hero cover art (in `assets/img/`).
- Dummy avatars — artist, commenters (any placeholder photos).
- `leep-has-talent` photo — side card inset.
- Icons (line, 1.6–2px): search, home, trending, people, heart, bookmark, play, pause,
  volume, plus, download, upload, expand (arrows), close (×), alert-circle (report),
  comment-arrow, chevron. Match Tabler-style outline.
- Fonts: Fraunces, Geist, Geist Mono.

---

## 11. Acceptance checklist
- [ ] Color/number variables + text/effect styles created and applied (no raw hex on layers).
- [ ] Waveform component: single-sided bars, played/unplayed/selected, playhead, idle/active.
- [ ] Selection modal with Leep logo + close + Save/Preview/Download.
- [ ] Marker dots (scalable) + sampled-by tooltip + region highlight; bidirectional with remix cards.
- [ ] Full track page assembled (nav, breadcrumb, hero player, feedback, comments, stems, remixes, side rail, footer).
- [ ] Mini-player dock + Discover page, with slide-in and state carry.
- [ ] Mobile variant (search hidden, taller hero, Select button, stacked below-grid).
- [ ] Prototype wiring for interactions 1–15; live-only items annotated.

_Reference build: `index.html`, `browse.html`, `assets/`, and `DESIGN-SYSTEM.md`._

