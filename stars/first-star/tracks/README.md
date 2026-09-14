# Album tracks

An album track is an arrangement made from song material within an album's structure. Each track belongs to an album and corresponds to a narrative stage. A track can draw from parts of multiple songs, and a song can contribute to multiple tracks.

Songs retain their independent identities in [`songs/`](../songs/). Narrative concepts belong in [`stages/`](../stages/); track bodies hold arrangement notes, transitions, and production decisions.

## File format

One Markdown file per track, named by its album-qualified id:

```yaml
---
id: album-1-creation
type: AlbumTrack
title: Creation
album: albums/album-1
track_number: 1
narrative_stage: stages/1-creation
sources: []
created: 2026-09-14
status: notes
---
```

`track_number` gives the track's position in the album. `narrative_stage` references the narrative chapter; it is distinct from a song's progress field, `stage`. All references use existing collection-qualified IDs.

`sources` stays empty until source material is chosen. Each source records a song and an informal description of the part used. For example (illustrative, not an assignment):

```yaml
sources:
  - song: songs/genesis
    part: Opening texture and main motif
```

The same song may appear more than once when different parts are used. Exact mix references and timestamps can be added to the schema later if needed. Writing status and the unwritten placeholder follow the song convention. New tracks follow the catalog's existing publication opt-in rules.

## Album 1 tracks

1. [Creation](album-1-creation.md) — [narrative stage](../stages/1-creation.md)
2. [Fall](album-1-fall.md) — [narrative stage](../stages/2-fall.md)
3. [Promise](album-1-promise.md) — [narrative stage](../stages/3-promise.md)
4. [Incarnation](album-1-incarnation.md) — [narrative stage](../stages/4-incarnation.md)
5. [Crucifixion](album-1-crucifixion.md) — [narrative stage](../stages/5-crucifixion.md)
6. [Resurrection](album-1-resurrection.md) — [narrative stage](../stages/6-resurrection.md)
7. [Love](album-1-love.md) — [narrative stage](../stages/7-love.md)
