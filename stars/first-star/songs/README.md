# Songs

A song represents an idea. It becomes real when it is named — everything about it (lyrics, sound, arrangement) can theoretically be completely replaced and it remains the same song.

Songs live here as a flat catalog, independent of any album. They are worked on continuously; when an album is being made, tracks are assembled from parts of one or more songs in separate [`AlbumTrack` records](../tracks/). A song can contribute to multiple tracks (see [`albums/`](../albums/)).

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

- Notes, history, and fragments go here, with one thought or closely related group of thoughts per bullet.
```

The body holds notes, history, and fragments as a bulleted list — raw material, written as it comes. Use `-` bullets, group related thoughts together, and use consistent punctuation. Short fragments are welcome; unfinished thoughts can end with an ellipsis. `status` tracks the state of that writing: `notes` means raw history in progress; a later state (e.g. `distilled`) will mark a body that has been rewritten into its finished public form. For songs without notes, use `_The idea is not yet written._` as the body. This placeholder appears only while the body is otherwise empty; once notes exist, it comes out.

Audio for a song — DAW projects, dated mixes, and stems — lives under `media/` at the repo root (untracked), keyed by the same song id.
