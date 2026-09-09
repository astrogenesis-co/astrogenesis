# Songs

A song represents an idea. It becomes real when it is named — everything about it (lyrics, sound, arrangement) can theoretically be completely replaced and it remains the same song.

Songs live here as a flat catalog, independent of any album. They are worked on continuously; when an album is being made, tracks are made from songs (see [`albums/`](../albums/)).

## File format

One markdown file per song, named by its id, with frontmatter:

```markdown
---
id: coldness
type: Song
title: Coldness
created: 2026-09-06
---

_The idea is not yet written._

Notes, history, and fragments follow.
```

The body holds the song's idea once it is articulated; until then it carries the placeholder line plus any notes worth keeping.

Audio for a song — DAW projects, dated mixes, and stems — lives under `media/` at the repo root (untracked), keyed by the same song id.
