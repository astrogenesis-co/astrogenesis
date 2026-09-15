import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { marked } from "marked";
import sanitize from "sanitize-html";

export const kinds = {
  songs: "Song",
  albums: "Album",
  tracks: "AlbumTrack",
  stages: "Stage",
  essays: "Essay",
  mixes: "Mix",
  stems: "Stems",
};
// npm runs these scripts from this package root; import.meta.url moves when
// Astro bundles the module into its temporary prerender directory.
const root = process.cwd();
const repo = "https://github.com/tbutler1132/astrogenesis";
export const preview = process.env.EXPLORE_PREVIEW === "1";
const audioStorage = JSON.parse(
  readFileSync(join(root, "audio.storage.json"), "utf8"),
);
export const href = (key) => `/explore/${key}/`;
export const dateLabel = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Not recorded";

export function parseEntity(source, group, filename) {
  const { data, content } = matter(source);
  const id = data.id || basename(filename, ".md");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error(`Invalid ID in ${filename}`);
  const inferredTitle = id
    .replace(/^\d+-/, "")
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  const body = content.trim();
  const placeholder = !body || /^_The idea is not yet written\._$/.test(body);
  const key = `${group}/${id}`;
  if (
    group === "mixes" &&
    (!/^songs\/[a-z0-9-]+$/.test(data.song || "") ||
      !/^[a-z0-9-]+\.mp3$/.test(data.file || ""))
  )
    throw new Error(
      `Mix requires a song reference and a plain MP3 filename: ${filename}`,
    );
  if (group === "stems") {
    if (
      !/^songs\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.song || "") ||
      !Array.isArray(data.channels) ||
      data.channels.length < 2 ||
      data.channels.length > 16 ||
      data.channels.some(
        (c) =>
          !c ||
          typeof c.label !== "string" ||
          !c.label.trim() ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*\.mp3$/.test(c.file || ""),
      ) ||
      new Set(data.channels.map((c) => c.file)).size !== data.channels.length
    )
      throw new Error(
        `Stems requires a song and 2–16 uniquely named MP3 channels: ${filename}`,
      );
  }
  if (group === "tracks") {
    const ref = (value, collection) =>
      typeof value === "string" &&
      new RegExp(`^${collection}/[a-z0-9]+(?:-[a-z0-9]+)*$`).test(value);
    if (
      !ref(data.album, "albums") ||
      !ref(data.narrative_stage, "stages") ||
      !Number.isInteger(data.track_number) ||
      data.track_number < 1 ||
      !Array.isArray(data.sources) ||
      data.sources.some(
        (source) =>
          !source ||
          !ref(source.song, "songs") ||
          typeof source.part !== "string" ||
          !source.part.trim(),
      )
    )
      throw new Error(
        `AlbumTrack requires album, narrative_stage, a positive track_number, and sources with song and part: ${filename}`,
      );
  }
  return {
    key,
    id,
    group,
    type: kinds[group],
    title:
      data.title ||
      (id === "0-what-is-star" ? "What is a star" : inferredTitle),
    status: placeholder ? "unwritten" : data.status || "draft",
    progress: group === "songs" ? data.stage || "not recorded" : "",
    created: data.created ? new Date(data.created).toISOString() : null,
    songCreated:
      group === "songs" && data.song_created
        ? new Date(data.song_created).toISOString()
        : null,
    visibility: data.visibility || "private",
    album: group === "tracks" ? data.album : null,
    narrativeStage: group === "tracks" ? data.narrative_stage : null,
    trackNumber: group === "tracks" ? data.track_number : null,
    sources: group === "tracks" ? data.sources : [],
    song: ["mixes", "stems"].includes(group) ? data.song : null,
    channels:
      group === "stems"
        ? data.channels.map((c) => ({ ...c, audio: `/audio/stems/${c.file}` }))
        : [],
    file: group === "mixes" ? data.file : null,
    audio:
      group === "mixes"
        ? `${audioStorage.enabled && !preview ? audioStorage.publicBaseUrl : "/audio/mixes"}/${data.file}`
        : null,
    normalized: data.normalized === true,
    duration: data.duration_seconds || null,
    mixDate: data.mix_date ? new Date(data.mix_date).toISOString() : null,
    body: placeholder ? "" : body,
    html: placeholder
      ? ""
      : sanitize(marked.parse(body), {
          allowedTags: sanitize.defaults.allowedTags.concat(["del"]),
          allowedAttributes: { a: ["href", "title"], code: ["class"] },
        }),
    excerpt: placeholder
      ? "A place for work still to come."
      : sanitize(marked.parse(body), { allowedTags: [], allowedAttributes: {} })
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180),
    references: data.related || [],
    source: `stars/first-star/${group}/${filename}`,
    links: [],
  };
}

export function connectEntities(entities) {
  const byKey = new Map(entities.map((e) => [e.key, e]));
  const connect = (a, b, label, reverse) => {
    if (!byKey.has(a) || !byKey.has(b)) return;
    const add = (from, to, relationship) => {
      const entity = byKey.get(from),
        target = byKey.get(to);
      if (!entity.links.some((l) => l.key === to))
        entity.links.push({
          key: to,
          title: target.title,
          type: target.type,
          label: relationship,
        });
    };
    add(a, b, label);
    add(b, a, reverse);
  };
  // Album 1's structure is explicitly documented in albums/README.md,
  // stages/README.md, and essays/README.md. Song assignments are not inferred.
  for (const e of entities) {
    if (e.album) connect(e.key, e.album, "Album", `Track ${e.trackNumber}`);
    if (e.narrativeStage)
      connect(e.key, e.narrativeStage, "Narrative stage", "Album track");
    for (const source of e.sources)
      connect(
        e.key,
        source.song,
        `Source song: ${source.part}`,
        "Used in track",
      );
    if (e.song) connect(e.key, e.song, "Song", e.type);
    if (e.group === "stages" && /^[1-7]-/.test(e.id)) {
      connect("albums/album-1", e.key, "Stage", "Album");
      connect(e.key, `essays/${e.id}`, "Companion essay", "Album stage");
    }
    if (e.group === "essays" && /^[0-7]-/.test(e.id))
      connect(
        "albums/album-1",
        e.key,
        e.id.startsWith("0-") ? "Introduction" : "Essay",
        "Album",
      );
    if (!Array.isArray(e.references))
      throw new Error(`related must be an array in ${e.source}`);
    for (const target of e.references)
      connect(e.key, target, "Related", "Related");
  }
  return entities;
}

export function selectPublished(entities, allowlist, includeDrafts = false) {
  const keys = new Set(entities.map((e) => e.key));
  for (const key of allowlist)
    if (!keys.has(key)) throw new Error(`Unknown public entity: ${key}`);
  return entities.filter(
    (e) =>
      includeDrafts || e.visibility === "public" || allowlist.includes(e.key),
  );
}

export function getCatalog() {
  const allowlist = JSON.parse(
    readFileSync(join(root, "explore.public.json"), "utf8"),
  ).entities;
  let entities = Object.keys(kinds).flatMap((group) =>
    readdirSync(join(root, group))
      .filter((f) => f.endsWith(".md") && f !== "README.md")
      .sort()
      .map((filename) => {
        const e = parseEntity(
          readFileSync(join(root, group, filename), "utf8"),
          group,
          filename,
        );
        let updated = "";
        try {
          updated = execFileSync(
            "git",
            ["log", "-1", "--format=%cI", "--", e.source],
            { cwd: join(root, "../.."), encoding: "utf8" },
          ).trim();
        } catch {
          /* Source archives may have no Git history. */
        }
        return {
          ...e,
          updated: updated || null,
          sourceUrl: `${repo}/blob/main/${e.source}`,
          historyUrl: `${repo}/commits/main/${e.source}`,
        };
      }),
  );
  const keys = entities.map((e) => e.key);
  if (new Set(keys).size !== keys.length)
    throw new Error("Duplicate catalog ID");
  for (const e of entities) {
    for (const target of [
      e.album,
      e.narrativeStage,
      ...e.sources.map((s) => s.song),
    ].filter(Boolean))
      if (!keys.includes(target))
        throw new Error(`Unknown track reference in ${e.source}: ${target}`);
    if (e.song && !keys.includes(e.song))
      throw new Error(`Unknown song for ${e.key}: ${e.song}`);
    if (
      !Array.isArray(e.references) ||
      e.references.some((k) => !keys.includes(k))
    )
      throw new Error(`Invalid related reference in ${e.source}`);
  }
  entities = selectPublished(entities, allowlist, preview);
  return connectEntities(entities).sort(
    (a, b) => a.title.localeCompare(b.title) || a.type.localeCompare(b.type),
  );
}
