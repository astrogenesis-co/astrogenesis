import test from "node:test";
import assert from "node:assert/strict";
import {
  parseEntity,
  connectEntities,
  selectPublished,
} from "../src/lib/catalog.mjs";
import { channelGain } from "../src/lib/stem-state.mjs";
const source = `---
song: songs/coldness
channels:
  - label: Bass
    file: coldness-bass.mp3
  - label: Vocals
    file: coldness-vocals.mp3
---
Curated channels.`;

test("curated stems validate filenames, stay private by default and link to their song", () => {
  const stems = parseEntity(source, "stems", "coldness-simplified.md");
  const song = parseEntity("Notes", "songs", "coldness.md");
  assert.equal(stems.type, "Stems");
  assert.equal(stems.channels[0].audio, "/audio/stems/coldness-bass.mp3");
  assert.equal(selectPublished([stems], []).length, 0);
  connectEntities([stems, song]);
  assert.equal(stems.links[0].label, "Song");
  assert.equal(song.links[0].label, "Stems");
  for (const invalid of [
    source.replace("coldness-bass.mp3", "../private.mp3"),
    source.replace("coldness-bass.mp3", "coldness-vocals.mp3"),
    source.replace("label: Bass", "label: ''"),
    source.replace("songs/coldness", "mixes/coldness"),
    source.replace("  - label: Vocals\n    file: coldness-vocals.mp3\n", ""),
  ])
    assert.throws(
      () => parseEntity(invalid, "stems", "invalid.md"),
      /Stems requires/,
    );
});

test("solo combinations preserve levels, mute wins, and unsolo restores the mix", () => {
  const channels = [
    { volume: 0.7, mute: false, solo: false },
    { volume: 1, mute: false, solo: false },
    { volume: 0.3, mute: false, solo: false },
  ];
  const levels = () => channels.map((_, i) => channelGain(channels, i));
  assert.deepEqual(levels(), [0.7, 1, 0.3]);
  channels[0].solo = channels[2].solo = true;
  assert.deepEqual(levels(), [0.7, 0, 0.3]);
  channels[0].mute = true;
  assert.deepEqual(levels(), [0, 0, 0.3]);
  channels[0].solo = channels[2].solo = false;
  assert.deepEqual(levels(), [0, 1, 0.3]);
});
