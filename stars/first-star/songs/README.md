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
status: notes
---

_The idea is not yet written._

Notes, history, and fragments follow.
```

The body holds notes, history, and fragments — raw material, written as it comes. `status` tracks the state of that writing: `notes` means raw history in progress; a later state (e.g. `distilled`) will mark a body that has been rewritten into its finished public form. The placeholder line appears only while the body is otherwise empty; once notes exist, it comes out.

Audio for a song — DAW projects, dated mixes, and stems — lives under `media/` at the repo root (untracked), keyed by the same song id.
