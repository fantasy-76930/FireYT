import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(new URL("../data/auto-picks.json", import.meta.url));
const API_KEY = process.env.YOUTUBE_API_KEY;
const API_URL = "https://www.googleapis.com/youtube/v3/videos";

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

function requireApiKey() {
  if (!API_KEY) {
    throw new Error("Missing YOUTUBE_API_KEY. Add it in GitHub repo Settings > Secrets and variables > Actions.");
  }
}

async function fetchTaiwanMusicTrending() {
  const params = new URLSearchParams({
    part: "snippet",
    chart: "mostPopular",
    regionCode: "TW",
    videoCategoryId: "10",
    maxResults: "8",
    key: API_KEY,
  });

  const response = await fetch(`${API_URL}?${params}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube Data API request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.items) || data.items.length < 3) {
    throw new Error(`Expected at least 3 YouTube music videos, found ${data.items?.length ?? 0}.`);
  }

  return data.items.map((item, index) => ({
    id: item.id,
    title: cleanTitle(item.snippet?.title ?? "") || item.snippet?.title || "今日趨勢歌曲",
    artist: item.snippet?.channelTitle || "YouTube Music",
    tag: `台灣音樂趨勢 #${index + 1}`,
  }));
}

requireApiKey();

const songs = await fetchTaiwanMusicTrending();
const payload = {
  meta: {
    updatedAt: new Date().toISOString(),
    updatedLabel: todayTaipeiLabel(),
    source: "YouTube Data API v3 / Taiwan Music mostPopular",
    sourceUrl: "https://developers.google.com/youtube/v3/docs/videos/list",
    sourceTimestamp: "YouTube Data API v3 videos.list chart=mostPopular regionCode=TW videoCategoryId=10",
  },
  songs,
};

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Updated ${OUTPUT_PATH} with ${songs.length} songs from YouTube Data API v3.`);
