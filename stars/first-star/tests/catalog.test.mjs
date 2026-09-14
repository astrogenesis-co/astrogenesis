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
