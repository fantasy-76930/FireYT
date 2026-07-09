import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TRENDING_URL = "https://kworb.net/youtube/trending/tw.html";
const OUTPUT_PATH = fileURLToPath(new URL("../data/auto-picks.json", import.meta.url));

function decodeHtml(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(x?[0-9a-fA-F]+);/g, (_, code) => {
      const radix = code.startsWith("x") || code.startsWith("X") ? 16 : 10;
      const number = Number.parseInt(code.replace(/^x/i, ""), radix);
      return Number.isFinite(number) ? String.fromCodePoint(number) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function parseMusicRows(html) {
  const musicStart = html.indexOf('<div class="music"');
  if (musicStart === -1) throw new Error("Could not find the music trending table.");

  const musicHtml = html.slice(musicStart);
  const tbodyEnd = musicHtml.indexOf("</tbody>");
  if (tbodyEnd === -1) throw new Error("Could not find the end of the music trending table.");

  const table = musicHtml.slice(0, tbodyEnd);
  const rowPattern =
    /<tr[^>]*>\s*<td>(\d+)<\/td>\s*<td>(.*?)<\/td>\s*<td class="text"><div><a href="https:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)"[^>]*>(.*?)<\/a>/gs;

  return [...table.matchAll(rowPattern)].map((match) => ({
    rank: Number(match[1]),
    movement: decodeHtml(match[2]),
    id: match[3],
    rawTitle: decodeHtml(match[4]),
  }));
}

async function getOEmbed(videoId) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}&format=json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function cleanTitle(title) {
  return title
    .replace(/\s*\|\s*.*/g, "")
    .replace(/\s*\[[^\]]*(official|music|video|mv|audio)[^\]]*\]\s*/gi, " ")
    .replace(/\s*\([^)]*(official|music|video|mv|audio)[^)]*\)\s*/gi, " ")
    .replace(/\s*official\s*(music\s*)?video\s*/gi, " ")
    .replace(/\s*official\s+mv\s*/gi, " ")
    .replace(/\s*M\/V\s*/gi, " ")
    .replace(/[-–—|:\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function todayTaipeiLabel() {
  const formatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()).replace(/\//g, ".");
}

const response = await fetch(TRENDING_URL);
if (!response.ok) throw new Error(`Kworb request failed: ${response.status}`);

const html = await response.text();
const sourceTimestamp = decodeHtml(html.match(/<span class="pagetitle"><strong>(.*?)<\/strong><\/span>/s)?.[1] ?? "");
const rows = parseMusicRows(html).slice(0, 10);
if (rows.length < 6) throw new Error(`Expected at least 6 music rows, found ${rows.length}.`);

const enriched = [];
for (const row of rows.slice(0, 8)) {
  const embed = await getOEmbed(row.id);
  const title = cleanTitle(embed?.title || row.rawTitle);
  enriched.push({
    id: row.id,
    title: title || row.rawTitle,
    artist: embed?.author_name || "YouTube Trending",
    tag: `台灣音樂趨勢 #${row.rank}`,
  });
}

const payload = {
  meta: {
    updatedAt: new Date().toISOString(),
    updatedLabel: todayTaipeiLabel(),
    source: "Kworb / YouTube Taiwan Music Trending",
    sourceUrl: TRENDING_URL,
    sourceTimestamp,
  },
  songs: enriched,
};

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Updated ${OUTPUT_PATH} with ${enriched.length} songs.`);
