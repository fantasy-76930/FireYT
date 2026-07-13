import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dataPath = fileURLToPath(new URL("../data/auto-picks.json", import.meta.url));
const data = JSON.parse(await readFile(dataPath, "utf8"));
const batchSize = Number(data.meta?.rotationBatchSize ?? 300);
const pool = Array.isArray(data.rotationSongs) ? data.rotationSongs : [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function batchAt(index) {
  return Array.from({ length: batchSize }, (_, offset) => pool[(index * batchSize + offset) % pool.length]);
}

assert(batchSize === 300, `Expected a 300-song batch, received ${batchSize}.`);
assert(pool.length >= batchSize * 2, `Rotation pool requires at least ${batchSize * 2} songs, received ${pool.length}.`);
assert(new Set(pool.map((song) => song.id)).size === pool.length, "Rotation pool contains duplicate video IDs.");
assert(Array.isArray(data.songs) && data.songs.length === batchSize, "Published daily fallback batch is not 300 songs.");
assert(new Set(data.songs.map((song) => song.id)).size === batchSize, "Published daily batch contains duplicate video IDs.");
assert(data.songs.every((song) => pool.some((candidate) => candidate.id === song.id)), "Daily batch contains a song outside the rotation pool.");

for (let index = 0; index < 20; index += 1) {
  const currentIds = new Set(batchAt(index).map((song) => song.id));
  const nextIds = batchAt(index + 1).map((song) => song.id);
  assert(currentIds.size === batchSize, `Batch ${index + 1} contains duplicate songs.`);
  assert(
    nextIds.every((id) => !currentIds.has(id)),
    `Batch ${index + 1} overlaps with batch ${index + 2}.`,
  );
}

console.log(`Verified ${pool.length} rotation songs and 20 consecutive non-overlapping 300-song batches.`);
