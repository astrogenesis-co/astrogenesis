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
| [`stars/first-star/site/`](stars/first-star/site/) | First Star’s static homepage and public assets |
| [`stars/first-star/src/`](stars/first-star/src/) | Astro layouts, Explore pages, and the catalog reader |
| `media/` | DAW projects, mixes, and stems (not tracked in git; stays at the top level so DAW file references keep working) |

## Websites

Both websites use static Cloudflare Workers deployments from this repository.
Astrogenesis publishes `site/` directly. First Star uses Astro to combine its
existing static homepage with Explore pages generated from the Markdown catalog.
Its production deployment serves only `stars/first-star/dist/`.

Run these commands from the repository root with a current even-numbered Node.js
release (22.12+ or 24+) and npm available:

```sh
# Install First Star's locked dependencies
npm --prefix stars/first-star ci

# Preview all four catalog collections locally, including unpublished drafts
npm --prefix stars/first-star run dev

# Run content-model tests
npm --prefix stars/first-star test

# Build the review version into preview-dist (never the deployment directory)
npm --prefix stars/first-star run build:preview

# Build only approved public entities into dist
npm --prefix stars/first-star run build

# Publish First Star when ready
npm --prefix stars/first-star run deploy

# Publish the Astrogenesis site
npx wrangler deploy --config wrangler.jsonc
```

Deployment requires a Cloudflare login with access to the `astrogenesis.co` zone.
The First Star configuration attaches `first.astrogenesis.co` as a custom domain;
Cloudflare manages its DNS record and certificate. It has its own Worker,
`astrogenesis-first-star`, so the two sites can be released independently.
Fonts and icons live in the star’s public directory so it can serve them
independently. Everything under either `site/` directory is public static material.

### Explore

Open `http://localhost:4321/explore/` while the First Star dev server is running.
Explore reads `songs/`, `albums/`, `stages/`, and `essays/` directly. README files,
weekly plans, `private/`, and `media/` are excluded. Saving a catalog file reloads
the local preview. The deployed site updates only after a fresh build and deploy.

The first version provides title/body search, collection and status filters,
sorting, direct record URLs, rendered notes, raw Markdown, related records, and
links to each file's GitHub history. `Last committed` comes from Git, not a guessed
creative-work date; `created` is shown separately. Empty files appear as unwritten.
For songs, frontmatter `stage` is song progress (e.g. idea/demo), distinct from
writing `status` (e.g. notes). An empty body is displayed as unwritten even if its
frontmatter still says notes.

**Publication is opt-in.** The local preview shows all records and is labeled as
such. A production build includes a record only if its frontmatter has
`visibility: public` or its collection-qualified ID is listed in
[`explore.public.json`](stars/first-star/explore.public.json). That list contains
the 44 existing records approved for publication after verification
against remote `main`. New records still require opt-in. A public record's full body is published,
even if it is a draft. Removing both forms of opt-in removes it on the next deploy.
Preview builds go to `preview-dist/`; Wrangler only serves `dist/`.

Use `related` to record explicit relationships in an entity's frontmatter:

```yaml
related:
  - songs/genesis
  - stages/1-creation
```

References must point to existing collection-qualified IDs. Explore shows both
directions of each relationship and includes only published targets in public
builds. Album 1's existing stage/essay structure is mapped from the repository's
documented convention; no song-to-stage assignments are guessed. If that structure
changes, update the mapping in `src/lib/catalog.mjs` or use explicit relationships.

## Status

Work is tracked in [GitHub issues](https://github.com/tbutler1132/astrogenesis/issues), organized by milestone:

1. **Album Production Complete** — production of tracks 1–7
2. **Album Mixed and Mastered** — mixing and mastering passes over the full album
3. **Essays complete** — essays 0–7
4. **Website Complete** — the end-to-end experience
5. **Launch**
