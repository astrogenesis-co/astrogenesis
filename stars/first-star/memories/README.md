# Memories

A memory holds a moment or period from life: a place, an encounter, an ordinary afternoon, or something that stayed with you. These records provide personal material for the journey alongside [songs](../songs/), recordings, and reflections.

Memories live here as a flat catalog, independent of the album's [stages](../stages/). The stages give shape to an interpretation of a life; the memories preserve its particular moments, overlaps, and uncertainties. A memory can connect to several stages or none. It does not need to fit neatly into an arc.

## File format

One Markdown file per memory, named by its stable lowercase, hyphen-separated id. This is a starting convention for authoring; website support has not been implemented yet.

Illustrative template, not an actual memory:

```markdown
---
id: an-afternoon
type: Memory
title: An afternoon
created: 2026-09-15
when: "Summer before college"
status: notes
related: []
---

## Memory

- What you remember: where you were, what happened, what you noticed or felt.
- Fragments and uncertain details are welcome.

## Reflection

### 2026-09-15

- What you make of this memory now, or a connection you noticed later.
```

- `created` is the date this record was written down, in `YYYY-MM-DD` format. It is separate from when the remembered experience happened.
- `when` describes when the experience took place. Use a quoted exact date (`"2018-09-23"`), month (`"2018-09"`), year (`"2018"`), range (`"2018–2019"`), age, or phrase such as `"Summer before college"`. Keep estimates visibly approximate; do not invent a day just to make sorting easier. Omit the field if the timing is unknown.
- `status` describes the writing: start with `notes`; use `distilled` when it has been rewritten into the form you want to share. Being unfinished does not make a memory less useful.
- `related` optionally lists existing collection-qualified IDs for songs, mixes, stages, or other relevant records. Leave it empty until a connection is chosen. These references are an authoring convention for now; they are not yet validated or rendered by Explore for memories.

Keep **Memory** and **Reflection** separate. The first holds the recollection, including uncertainty about it. The second holds its present-day interpretation. Date reflections so a later understanding does not silently become part of the original recollection. Omit the reflection section until there is something to add; there is no need to force a lesson out of every memory.

## Connections and the journey

A musical connection can mean several things: a recording made around the same time, a song inspired by an experience, or something made years later that now evokes it. Explain the relationship in the reflection rather than assuming that a link proves chronology or causation. Life dates and recording dates remain distinct.

The journey can bring together a selected memory, a piece of music, and a later reflection. It can revisit the same memory in a different context. Stage names and assignments guide the composition behind the scenes; the visitor-facing experience can express their feeling without naming the framework.

These records should support either a sequence of pages or a continuous single-page experience. Their format does not decide the eventual interface, and adding a record does not automatically place it in the journey.

## Website status

This folder currently documents the idea and provides a place to begin writing. Memories are not yet loaded by Explore or the journey; the journey's memory prompts are still placeholders. Publication controls and website integration will need to be added when the collection is connected.

Files committed here are part of the repository and visible to anyone with repository access, independently of whether the website displays them.
