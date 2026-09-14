import {
  mkdirSync,
  copyFileSync,
  readdirSync,
  unlinkSync,
  statSync,
  realpathSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { resolve, join, sep } from "node:path";
import { getCatalog, preview } from "./catalog.mjs";

// This directory is generated and ignored by Git. Never copy the media tree.
export function prepareAudio() {
  const storage = JSON.parse(
    readFileSync(resolve("audio.storage.json"), "utf8"),
  );
  const remote = storage.enabled && !preview;
  const source = resolve("../../media/listening");
  const destination = resolve("site/audio/mixes");
  const mixes = remote ? [] : getCatalog().filter((e) => e.group === "mixes");
  const selected = mixes
    .map((mix) => {
      // During local development a newly written record may precede its encoded file.
      if (preview && !existsSync(join(source, mix.file))) return null;
      const path = realpathSync(join(source, mix.file));
      if (!path.startsWith(source + sep) || !statSync(path).isFile())
        throw new Error(`Invalid audio source: ${mix.file}`);
      if (statSync(path).size > 25 * 1024 * 1024)
        throw new Error(`Mix exceeds the hosting limit of 25 MiB: ${mix.file}`);
      return { path, file: mix.file };
    })
    .filter(Boolean);
  mkdirSync(destination, { recursive: true });
  for (const file of readdirSync(destination)) {
    if (!selected.some((m) => m.file === file) && file.endsWith(".mp3"))
      unlinkSync(join(destination, file));
  }
  for (const mix of selected)
    copyFileSync(mix.path, join(destination, mix.file));
}
