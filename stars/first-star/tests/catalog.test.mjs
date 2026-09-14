import test from "node:test";
import assert from "node:assert/strict";
import {
  parseEntity,
  connectEntities,
  selectPublished,
} from "../src/lib/catalog.mjs";

test("unwritten records and song progress remain separate from writing status", () => {
  const stage = parseEntity("", "stages", "1-creation.md");
  assert.equal(stage.title, "Creation");
  assert.equal(stage.status, "unwritten");
  const song = parseEntity(
    "---\nid: first\nstatus: notes\nstage: demo\n---\nActual notes.",
    "songs",
    "first.md",
  );
  assert.equal(song.status, "notes");
  assert.equal(song.progress, "demo");
  assert.equal(
    parseEntity("_The idea is not yet written._", "songs", "empty.md").status,
    "unwritten",
  );
});

test("rendered notes cannot inject script or unsafe links", () => {
  const entity = parseEntity(
    "<script>alert(1)</script>\n\n[click](javascript:alert(1))\n\n**Safe text**",
    "songs",
    "test.md",
  );
  assert.ok(!entity.html.includes("<script"));
  assert.ok(!entity.html.includes("javascript:"));
  assert.ok(entity.html.includes("<strong>Safe text</strong>"));
});

test("public selection defaults to private and requires deliberate opt-in", () => {
  const items = [
    parseEntity("Private body", "songs", "private.md"),
    parseEntity(
      "---\nvisibility: public\n---\nPublic body",
      "songs",
      "public.md",
    ),
  ];
  assert.deepEqual(
    selectPublished(items, []).map((e) => e.key),
    ["songs/public"],
  );
  assert.equal(selectPublished(items, [], true).length, 2);
  assert.equal(selectPublished(items, ["songs/private"]).length, 2);
  assert.throws(
    () => selectPublished(items, ["songs/typo"]),
    /Unknown public entity/,
  );
});

test("relationships are reciprocal, respect publication, and do not guess song assignments", () => {
  const album = parseEntity("", "albums", "album-1.md");
  const stage = parseEntity("", "stages", "1-creation.md");
  const essay = parseEntity("", "essays", "1-creation.md");
  const song = parseEntity("Notes", "songs", "creation.md");
  const entities = connectEntities([album, stage, essay, song]);
  assert.ok(album.links.some((l) => l.key === stage.key));
  assert.ok(stage.links.some((l) => l.key === album.key));
  assert.ok(essay.links.some((l) => l.key === stage.key));
  assert.equal(song.links.length, 0);
  const privateStage = parseEntity("", "stages", "1-creation.md");
  const publicAlbum = parseEntity("", "albums", "album-1.md");
  const published = connectEntities(
    selectPublished([privateStage, publicAlbum], ["albums/album-1"]),
  );
  assert.equal(published[0].links.length, 0);
});

test("mixes have validated audio paths and reciprocal song relationships", () => {
  const mix = parseEntity(
    "---\nsong: songs/higher\nfile: higher-full-demo.mp3\n---\nDemo",
    "mixes",
    "higher-full-demo.md",
  );
  const song = parseEntity("Notes", "songs", "higher.md");
  connectEntities([mix, song]);
  assert.ok(mix.audio.endsWith("/mixes/higher-full-demo.mp3"));
  assert.equal(mix.links[0].label, "Song");
  assert.equal(song.links[0].label, "Mix");
  assert.throws(
    () =>
      parseEntity(
        "---\nsong: songs/higher\nfile: ../../private.mp3\n---",
        "mixes",
        "unsafe.md",
      ),
    /plain MP3 filename/,
  );
});

test("album tracks connect to albums, stages, and multiple source songs", () => {
  const source = `---
album: albums/album-1
narrative_stage: stages/1-creation
track_number: 1
sources:
  - song: songs/genesis
    part: Opening texture
  - song: songs/higher
    part: Closing melody
---`;
  const track = parseEntity(source, "tracks", "album-1-creation.md");
  const album = parseEntity("", "albums", "album-1.md");
  const stage = parseEntity("", "stages", "1-creation.md");
  const genesis = parseEntity("", "songs", "genesis.md");
  const higher = parseEntity("", "songs", "higher.md");
  connectEntities([track, album, stage, genesis, higher]);
  assert.equal(track.type, "AlbumTrack");
  assert.equal(track.status, "unwritten");
  assert.equal(track.progress, "");
  assert.equal(track.links.length, 4);
  assert.ok(
    album.links.some((l) => l.key === track.key && l.label === "Track 1"),
  );
  assert.ok(stage.links.some((l) => l.key === track.key));
  assert.equal(genesis.links[0].label, "Used in track");
  assert.equal(higher.links[0].key, track.key);
  const publicTrack = parseEntity(source, "tracks", "album-1-creation.md");
  const privateSong = parseEntity("", "songs", "genesis.md");
  connectEntities(
    selectPublished([publicTrack, privateSong], [publicTrack.key]),
  );
  assert.equal(publicTrack.links.length, 0);
  for (const invalid of [
    source.replace("albums/album-1", "songs/genesis"),
    source.replace("track_number: 1", "track_number: 0"),
    source.replace("part: Opening texture", "part: ''"),
    source.replace("stages/1-creation", "songs/genesis"),
  ])
    assert.throws(
      () => parseEntity(invalid, "tracks", "bad.md"),
      /AlbumTrack requires/,
    );
});
