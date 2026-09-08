# Astrogenesis

Astrogenesis exists to form stars.

A star is a social organization together with the work it produces. At its core is the community itself. People organized around a shared purpose, a shared practice, and the actual social experience of a group. What radiates outward is the light. Art, writing, software, and experiences the community makes. Astrogenesis is the scaffold around that. The infrastructure, knowledge, and practices for forming stars.

There is one star so far which is built to become participatory. This repository holds that star's first light. An album, essays that accompany it, and a website where the whole thing is experienced. The repo is the canonical source — songs, album concepts, and essays are versioned here — and the website is the public interface to it. The repo is the implementation and the website is where the world begins.

## How it works

- A **song** is an idea. It becomes real when it is named, and it persists even as every part of it is replaced. Songs are worked on continuously, independent of any album.
- An **album** is a concept, planned in advance as a sequence of tracks. **Tracks are made from songs** — a song is the raw material, a track is its realization inside an album's structure.
- Each track on an album corresponds to a **stage** of the album's narrative arc.
- Each stage gets an **essay** presenting the lesson or story derived from that part of the arc, plus an introductory essay for the album as a whole.
- The **website** is the public interface to all of it — the finished work is meant to be experienced there, not read out of this repo.

## Album 1

The first album follows the biblical narrative in seven tracks:

1. Creation
2. Fall
3. Promise
4. Incarnation
5. Crucifixion
6. Resurrection
7. Love

Underneath the structure is a personal conviction: that a life should be a redemption arc — a shape so embedded in the western psyche that even fully secular stories still run on it.

## Repository layout

| Directory            | Contents                                                                |
| -------------------- | ----------------------------------------------------------------------- |
| [`albums/`](albums/) | Album concepts — the planned track sequence and the idea behind it      |
| [`stages/`](stages/) | One file per track of the current album, following its narrative stages |
| [`songs/`](songs/)   | The song catalog — each file is one named song idea                     |
| [`essays/`](essays/) | Essays 1–7, one per stage, plus essay 0 introducing the album           |
| [`site/`](site/)     | The website — astrogenesis.co, the public interface                     |
| `media/`             | DAW projects, mixes, and stems (not tracked in git)                     |

## Status

Work is tracked in [GitHub issues](https://github.com/tbutler1132/astrogenesis/issues), organized by milestone:

1. **Album Production Complete** — production of tracks 1–7
2. **Album Mixed and Mastered** — mixing and mastering passes over the full album
3. **Essays complete** — essays 0–7
4. **Website Complete** — the end-to-end experience
5. **Launch**
