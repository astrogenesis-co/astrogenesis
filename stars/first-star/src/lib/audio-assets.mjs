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
  // Curated stem listening copies are versioned with their records. The raw
  // media tree is never scanned, and private sets never enter public builds.
  const stemSource = realpathSync(resolve("stems/audio"));
  const stemDestination = resolve("site/audio/stems");
  const channels = getCatalog()
    .filter((e) => e.group === "stems")
    .flatMap((e) => e.channels);
  mkdirSync(stemDestination, { recursive: true });
  for (const file of readdirSync(stemDestination))
    if (!channels.some((c) => c.file === file) && file.endsWith(".mp3"))
      unlinkSync(join(stemDestination, file));
  for (const channel of channels) {
    const path = realpathSync(join(stemSource, channel.file));
    if (
      !path.startsWith(stemSource + sep) ||
      !statSync(path).isFile() ||
      statSync(path).size > 25 * 1024 * 1024
    )
      throw new Error(`Invalid stem audio source: ${channel.file}`);
    copyFileSync(path, join(stemDestination, channel.file));
  }
}
