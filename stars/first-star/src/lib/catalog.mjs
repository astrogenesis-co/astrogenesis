import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { marked } from "marked";
import sanitize from "sanitize-html";

export const kinds = {
  songs: "Song",
  albums: "Album",
  stages: "Stage",
  essays: "Essay",
};
// npm runs these scripts from this package root; import.meta.url moves when
// Astro bundles the module into its temporary prerender directory.
const root = process.cwd();
const repo = "https://github.com/tbutler1132/astrogenesis";
export const preview = process.env.EXPLORE_PREVIEW === "1";
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
    visibility: data.visibility || "private",
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
