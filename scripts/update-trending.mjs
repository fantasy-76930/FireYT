import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(new URL("../data/auto-picks.json", import.meta.url));
const API_KEY = process.env.YOUTUBE_API_KEY;
const VIDEO_API_URL = "https://www.googleapis.com/youtube/v3/videos";
const SEARCH_API_URL = "https://www.googleapis.com/youtube/v3/search";

function cleanTitle(title) {
  return title
    .replace(/\s*\|\s*.*/g, "")
    .replace(/\s*\[[^\]]*(official|music|video|mv|audio)[^\]]*\]\s*/gi, " ")
    .replace(/\s*\([^)]*(official|music|video|mv|audio)[^)]*\)\s*/gi, " ")
    .replace(/\s*official\s*(music\s*)?video\s*/gi, " ")
    .replace(/\s*official\s+mv\s*/gi, " ")
    .replace(/\s*M\/V\s*/gi, " ")
    .replace(/[-–—:：\s]+$/g, "")
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

async function fetchJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed: ${response.status} ${body}`);
  }
  return response.json();
}

function parseIsoDuration(duration) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration ?? "");
  if (!match) return 0;
  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function recentPublishedAfter(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function toSong(item, index, tagPrefix) {
  const id = typeof item.id === "string" ? item.id : item.id?.videoId;
  const snippet = item.snippet ?? {};
  return {
    id,
    title: cleanTitle(snippet.title ?? "") || snippet.title || "YouTube music pick",
    artist: snippet.channelTitle || "YouTube Music",
    tag: `${tagPrefix} #${index + 1}`,
  };
}

function hasUsableMusicTitle(title) {
  const cleaned = cleanTitle(title);
  if (!cleaned || cleaned.length > 90) return false;
  return !/(合集|合輯|歌單|排行榜|必聽|冥想|靜心|睡眠|放鬆|白噪音|八段錦|Zen Trip-Hop)/i.test(cleaned);
}

async function fetchTaiwanMusicTrending() {
  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    chart: "mostPopular",
    regionCode: "TW",
    videoCategoryId: "10",
    maxResults: "8",
    key: API_KEY,
  });

  const data = await fetchJson(`${VIDEO_API_URL}?${params}`, "YouTube mostPopular request");
  if (!Array.isArray(data.items) || data.items.length < 3) {
    throw new Error(`Expected at least 3 YouTube music videos, found ${data.items?.length ?? 0}.`);
  }

  return data.items
    .filter((item) => {
      const duration = parseIsoDuration(item.contentDetails?.duration);
      return duration >= 90 && duration <= 1200 && hasUsableMusicTitle(item.snippet?.title ?? "");
    })
    .map((item, index) => toSong(item, index, "台灣音樂熱門"));
}

async function fetchVideoDetails(ids) {
  if (!ids.length) return [];

  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    id: ids.join(","),
    key: API_KEY,
  });
  const data = await fetchJson(`${VIDEO_API_URL}?${params}`, "YouTube video detail request");
  return Array.isArray(data.items) ? data.items : [];
}

async function fetchRecentTaiwanMusic() {
  const queries = ["台灣 華語 新歌", "華語 音樂 新歌", "台灣 KPOP 新歌"];
  const publishedAfter = recentPublishedAfter(30);
  const ids = [];
  const seen = new Set();

  for (const query of queries) {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      order: "viewCount",
      regionCode: "TW",
      relevanceLanguage: "zh",
      videoCategoryId: "10",
      publishedAfter,
      maxResults: "6",
      q: query,
      key: API_KEY,
    });
    const data = await fetchJson(`${SEARCH_API_URL}?${params}`, `YouTube recent music search: ${query}`);
    for (const item of data.items ?? []) {
      const id = item.id?.videoId;
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  const details = await fetchVideoDetails(ids);
  return details
    .filter((item) => {
      const duration = parseIsoDuration(item.contentDetails?.duration);
      return (
        duration >= 90 &&
        duration <= 1200 &&
        item.snippet?.liveBroadcastContent !== "live" &&
        hasUsableMusicTitle(item.snippet?.title ?? "")
      );
    })
    .sort((a, b) => Number(b.statistics?.viewCount ?? 0) - Number(a.statistics?.viewCount ?? 0))
    .slice(0, 8)
    .map((item, index) => toSong(item, index, "近30天高觀看新歌"));
}

function mergeSongLists(lists, limit) {
  const songs = [];
  const seen = new Set();
  const maxLength = Math.max(...lists.map((list) => list.length));

  for (let index = 0; index < maxLength && songs.length < limit; index += 1) {
    for (const list of lists) {
      const song = list[index];
      if (song?.id && !seen.has(song.id)) {
        seen.add(song.id);
        songs.push(song);
      }
      if (songs.length >= limit) break;
    }
  }

  return songs;
}

requireApiKey();

const popularSongs = await fetchTaiwanMusicTrending();
const recentSongs = await fetchRecentTaiwanMusic();
const songs = mergeSongLists([recentSongs, popularSongs], 8);

if (songs.length < 3) {
  throw new Error(`Expected at least 3 combined YouTube music videos, found ${songs.length}.`);
}

const payload = {
  meta: {
    updatedAt: new Date().toISOString(),
    updatedLabel: todayTaipeiLabel(),
    source: "YouTube Data API v3 / Taiwan recent high-view music + mostPopular",
    sourceUrl: "https://developers.google.com/youtube/v3/docs",
    sourceTimestamp:
      "YouTube Data API v3 search.list publishedAfter=30d order=viewCount + videos.list chart=mostPopular regionCode=TW videoCategoryId=10",
  },
  songs,
};

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(
  `Updated ${OUTPUT_PATH} with ${songs.length} songs from YouTube Data API v3. ` +
    `recent=${recentSongs.length}, popular=${popularSongs.length}.`,
);
