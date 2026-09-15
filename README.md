# Astrogenesis

Astrogenesis exists to form stars.

A star is a social organization together with the work it produces. At its core is the community itself. People organized around a shared purpose, a shared practice, and the actual social experience of a group. What radiates outward is the light. Art, writing, software, and experiences the community makes. Astrogenesis is the scaffold around that. The infrastructure, knowledge, and practices for forming stars.

There is one star so far which is built to become participatory. This repository holds that star's first light. An album, essays that accompany it, and a website where the whole thing is experienced. The repo is the canonical source — songs, album concepts, and essays are versioned here — and the website is the public interface to it. The repo is the implementation and the website is where the world begins.

## How it works

- A **song** is an idea. It becomes real when it is named, and it persists even as every part of it is replaced. Songs are worked on continuously, independent of any album.
- An **album** is a concept, planned in advance as a sequence of tracks. **Tracks are made from songs** — a song is the raw material, an **AlbumTrack** is an arrangement made from parts of one or more songs inside an album's structure.
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
| [`stars/first-star/stages/`](stars/first-star/stages/) | Narrative concepts, one per stage |
| [`stars/first-star/tracks/`](stars/first-star/tracks/) | Album track arrangements, with album, narrative stage, and source-song references |
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

# Preview all catalog collections locally, including unpublished drafts
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

### Continuous deployment

GitHub Actions validates pull requests and deploys changes pushed to `main`.
The [First Star workflow](.github/workflows/first-star.yml) runs tests, builds
approved public content, and validates the Worker before publishing. The
[Astrogenesis workflow](.github/workflows/astrogenesis.yml) validates and publishes
the static site. Each workflow watches its own site files; changes to the shared
Wrangler dependency also trigger Astrogenesis. Both can be rerun manually with
**Actions → workflow → Run workflow**, selecting `main`.

Deployment jobs use the GitHub environment `PROD`, with environment secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Pull request checks do not
access that environment. The Cloudflare token must have permission to deploy
Workers and manage their configured custom domains in the Astrogenesis account.
Production jobs are serialized per site and deploy only from `main`.

First Star fetches full Git history to preserve catalog dates and uses the normal
production build, including the existing publication opt-in rules. Audio remains
in R2; upload new listening copies before pushing public catalog entries that
reference them. Local preview builds and private notes are not deployed.

### Explore

Open `http://localhost:4321/explore/` while the First Star dev server is running.
Explore reads `songs/`, `albums/`, `tracks/`, `stages/`, `essays/`, `mixes/`, and `stems/` directly. README files,
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

Album tracks use `album`, `narrative_stage`, `track_number`, and `sources` to record their structure (see [track format](stars/first-star/tracks/README.md)). These relationships appear in both directions in Explore.

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

### Mixes and normalized audio

Mix records live in `stars/first-star/mixes/`. `song` links each version to a
song; `mix_date` is derived from the filename, not filesystem timestamps.
`normalized`, `duration_seconds`, `source_file`, and `source_sha256` preserve the
listening version's provenance. Newly imported mixes remain private until reviewed.
The two undated Higher versions and nine redundant dated versions were removed
at the owner’s request. Their source audio remains archived locally.

For new mixes, use `scripts/import-mixes.py`. It scans `media/mixes/` for WAV,
MP3, M4A, AIFF, and FLAC files named `song-slug-YYYY-MM-DD[-version]`, validates
the song and date, and skips existing records without rewriting notes or visibility.
Changed originals imported by this command require a new version filename. Historical
records have no original hash, so their raw files cannot be checked for changes.
`scripts/excluded-mixes.json` blocks the nine deliberately removed versions even
if their audio is copied back into the import folder.

Originals stay unchanged. The importer measures loudness and applies a fixed gain
adjustment toward -16 LUFS, limited by a -1 dBTP ceiling; peak-limited mixes remain
quieter to preserve dynamics. It creates 24-bit / 48 kHz WAVs in
`media/mixes-normalized/` and LAME quality 2 / 48 kHz MP3s in `media/listening/`.
The true-peak ceiling is checked on the normalized WAV; lossy MP3 encoding can
change peaks. Records retain original and normalized hashes, gain, measured output
loudness, and the normalization policy. MP3 filenames include a content/settings
hash. New records start with `visibility: private` for local review.

From the repository root, after the export or file copy finishes:

```sh
# Inspect new mixes without changing files
python3 scripts/import-mixes.py --dry-run

# Import all new mixes, or select a single filename stem
python3 scripts/import-mixes.py
python3 scripts/import-mixes.py --mix wont-let-you-go-2026-09-02

# Preview private records and local listening copies
npm --prefix stars/first-star run dev

# After reviewing, set the mix record's visibility to public, then upload
# before pushing/deploying the catalog change.
npm --prefix stars/first-star run audio:upload
```

The historical `prepare-listening-audio.py` imported already-normalized WAVs;
it does not normalize raw audio and can overwrite record metadata. Use the new
import command for routine additions. Existing normalized versions are preserved.
Mix audio remains outside Git. Removed audio is archived under
`private/removed-mixes/`, outside the import folders. Curated stems follow the
separate workflow below.

The R2 bucket `astrogenesis-audio` hosts the normalized MP3 listening copies
through `media.astrogenesis.co`. R2 is enabled in
`stars/first-star/audio.storage.json`; public builds link to R2 and exclude audio
binaries. Local preview continues to use `media/listening/`. Upload and verify new
listening copies before deploying catalog changes that reference them.

Upload receipts are stored locally in `media/listening/r2-uploaded.json` to allow
resuming interrupted uploads. Only dated mixes are uploaded. The old dated Reason MP3 URL redirects to its normalized copy; the removed
Stars and undated Higher URLs return 404.
Normalized source WAVs are local archives; only the compressed listening copies
are intended for the public bucket.

On song pages, dated mixes are ordered newest first and normalized copies are
labeled. Playback is user-initiated; starting another player on the same page
pauses the previous one. Restart the dev server after replacing an audio file.


### Curated stems

`stars/first-star/stems/` holds **Stems** records: deliberately prepared, named
channel sets linked to a Song. Explore includes a Stems collection and shows a
synchronized mixer on each set’s page and its song page. See
[the stems guide](stars/first-star/stems/README.md) for the schema and workflow.
Raw `media/stems/` exports are never scanned or published by this feature.
