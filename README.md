# Leep UI Components — Audio Player

A distinctive, lightweight waveform audio player for **Leep**, a platform for
music creators to discover, remix, and collaborate. Built as a static,
zero-build prototype (vanilla HTML / CSS / Canvas).

## What it does

- Play, pause, scrub, and volume control on a real track.
- **Hybrid waveform** — a precise measuring strip of bars; selecting a region
  lights it up as a glowing teal sample with a dimension bracket.
- **Sampling** — grab any part of the track and download it as a real WAV
  (Web Audio slice + encode), or save it for later.
- **Full-page player** over the cover art, plus a **persistent docked
  mini-player** that resumes across pages.
- Like / follow / comments / feedback, People to follow, reputation, stems.
- Responsive with touch support; subtle motion; accessible contrast.

## Interaction

| | Desktop | Touch |
|---|---|---|
| Play from a point | click waveform | tap waveform |
| Scrub | left-drag | drag |
| Select a sample | right-click-drag | tap **Select sample**, then drag (or long-press-drag) |

Idle, the waveform sits at 20%; on hover it comes to full and the artwork
blurs to focus the controls (desktop only — touch stays fully active).

## Run locally

It must be served over HTTP (the sample export uses `fetch` + Web Audio):

```bash
python -m http.server 5178
# then open http://localhost:5178/index.html
```

Or drag the folder onto https://app.netlify.com/drop for a live URL.

## Structure

```
index.html            full track page (player over the artwork)
browse.html           Discover feed + docked mini-player
exploration*.html     waveform concept exploration boards
DESIGN-SYSTEM.md      tokens, type, component + waveform specs
assets/css/leep.css   design tokens + layout + components
assets/js/
  waveform.js         hybrid waveform renderer + input
  player.js           audio controller (blob-URL seeking, persisted state)
  wav.js              AudioBuffer -> WAV slice
  peaks.js            real peak data decoded from the master
assets/audio/         the track
assets/img/           cover art
```

See `DESIGN-SYSTEM.md` to rebuild or extend the component.
