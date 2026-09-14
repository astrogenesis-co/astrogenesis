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

| Directory | Contents |
| --------- | -------- |
| [`stars/first-star/`](stars/first-star/) | The first star — everything it produces lives here |
| [`stars/first-star/albums/`](stars/first-star/albums/) | Album concepts — the planned track sequence and the idea behind it |
| [`stars/first-star/stages/`](stars/first-star/stages/) | One file per track of the current album, following its narrative stages |
| [`stars/first-star/songs/`](stars/first-star/songs/) | The song catalog — each file is one named song idea |
| [`stars/first-star/essays/`](stars/first-star/essays/) | Essays 1–7, one per stage, plus essay 0 introducing the album |
| [`writing/`](writing/) | Essays in the voice of Astrogenesis itself — the scaffold, not the star |
| [`site/`](site/) | The website — astrogenesis.co, the public interface |
| [`stars/first-star/site/`](stars/first-star/site/) | First Star’s public website — first.astrogenesis.co |
| `media/` | DAW projects, mixes, and stems (not tracked in git; stays at the top level so DAW file references keep working) |

## Websites

Both websites are static Cloudflare Workers deployments from this repository.
Astrogenesis publishes only `site/`; First Star publishes only
`stars/first-star/site/`. Songs, draft essays, and other source material outside
those directories are not uploaded by these deployments.

Run these commands from the repository root with Node.js and Wrangler available:

```sh
# Preview First Star locally
npx wrangler dev --config stars/first-star/wrangler.jsonc

# Validate its deployment without publishing
npx wrangler deploy --config stars/first-star/wrangler.jsonc --dry-run

# Publish First Star before publishing the homepage link to it
npx wrangler deploy --config stars/first-star/wrangler.jsonc

# Publish the Astrogenesis site
npx wrangler deploy --config wrangler.jsonc
```

Deployment requires a Cloudflare login with access to the `astrogenesis.co` zone.
The First Star configuration attaches `first.astrogenesis.co` as a custom domain;
Cloudflare manages its DNS record and certificate. It has its own Worker,
`astrogenesis-first-star`, so the two sites can be released independently.
Fonts and icons are copied into the star’s public directory so it can serve them
independently. Only place material intended for publication in either site directory.

## Status

Work is tracked in [GitHub issues](https://github.com/tbutler1132/astrogenesis/issues), organized by milestone:

1. **Album Production Complete** — production of tracks 1–7
2. **Album Mixed and Mastered** — mixing and mastering passes over the full album
3. **Essays complete** — essays 0–7
4. **Website Complete** — the end-to-end experience
5. **Launch**
