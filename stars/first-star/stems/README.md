# Stems

A **Stems** record describes one curated, presentable set of channels for a Song.
It is separate from a Mix (a finished stereo bounce) and from raw DAW exports.

```yaml
---
id: coldness-simplified
type: Stems
title: Coldness · Simplified stems
song: songs/coldness
status: notes
visibility: public
channels:
  - label: Instruments
    file: coldness-instruments.mp3
  - label: Vocals
    file: coldness-vocals.mp3
---
Notes about this set.
```

Use 2–16 channels, unique plain lowercase MP3 filenames, and descriptive labels.
Export all channels from the same start to the same end, retaining leading silence
and relative levels. Do not normalize channels separately. Put listening files in
`stems/audio/`; these small curated copies are tracked in Git. Public builds copy
only explicitly published records’ audio into generated `site/audio/stems/`.
Missing audio fails the build. Omit `visibility: public` to keep a new set private,
or publish its key through `explore.public.json`. Local draft previews include it.

The mixer loads audio on first play, schedules all channels on a shared Web Audio
clock, and offers pause/resume, seeking, volume, mute, multi-solo, and reset.
Mute wins over solo. Reset restores channel levels and master volume, leaving the
playback position alone. Master starts at 70%, with a compressor for summed peaks.
Audio stays local to the browser; mix adjustments are not saved.

## Coldness

The eight original 32-bit stereo WAVs were copied unchanged from the supplied
`simplified-stems` folder to `media/curated-stems/coldness/` (local, Git-ignored).
All have 2,764,478 samples at 44.1 kHz, about 62.69 seconds. The matching listening
copies in `audio/` are 256 kbps MP3s with no gain adjustment or trimming (~15 MiB
total). Existing raw stems are not used. The site serves these copies directly,
independently of the R2 storage used for full mixes.

To encode another aligned source, with ffmpeg installed:

```sh
ffmpeg -i input.wav -map_metadata -1 -codec:a libmp3lame -b:a 256k output.mp3
```

Check equal decoded durations and playback alignment before publishing a set.
