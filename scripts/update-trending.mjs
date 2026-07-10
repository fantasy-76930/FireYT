import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(new URL("../data/auto-picks.json", import.meta.url));
const API_KEY = process.env.YOUTUBE_API_KEY;
const VIDEO_API_URL = "https://www.googleapis.com/youtube/v3/videos";
const SEARCH_API_URL = "https://www.googleapis.com/youtube/v3/search";
const TARGET_LISTENING_HOURS = 20;
const ASSUMED_AVERAGE_SONG_MINUTES = 4;
const TARGET_SONG_COUNT = Math.ceil((TARGET_LISTENING_HOURS * 60) / ASSUMED_AVERAGE_SONG_MINUTES);
const POPULAR_TARGET_COUNT = 100;
const COUNTRY_TARGET_COUNT = 100;
const SEARCH_QUERIES = [
  "台灣 華語 新歌",
  "華語 音樂 新歌",
  "台灣 音樂 MV",
  "台灣 KPOP 新歌",
  "台灣 流行音樂",
  "台灣 獨立音樂",
];
const COUNTRY_MUSIC_PACKS = [
  { key: "mandarin-top", title: "華語 Top 100", mark: "華語", tone: "green", query: "華語 音樂" },
  { key: "kpop-top", title: "韓國 Top 100", mark: "KPOP", tone: "cyan", query: "韓國 KPOP 音樂" },
  { key: "jpop-top", title: "日本 Top 100", mark: "JPOP", tone: "violet", query: "日本 JPOP 音樂" },
  { key: "western-top", title: "歐美 Top 100", mark: "POP", tone: "blue", query: "歐美 流行音樂" },
  { key: "thai-top", title: "泰國 Top 100", mark: "THAI", tone: "amber", query: "泰國 流行音樂" },
  { key: "latin-top", title: "拉丁 Top 100", mark: "LATIN", tone: "red", query: "Latin pop music" },
];

function cleanTitle(title) {
  return title
    .replace(/\s*\|\s*.*/g, "")
    .replace(/\s*\[[^\]]*(official|music|video|mv|audio|lyrics?)[^\]]*\]\s*/gi, " ")
    .replace(/\s*\([^)]*(official|music|video|mv|audio|lyrics?)[^)]*\)\s*/gi, " ")
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

function isUsableMusicVideo(item) {
  const title = item.snippet?.title ?? "";
  const cleaned = cleanTitle(title);
  const text = `${title} ${cleaned}`.toLowerCase();
  const duration = parseIsoDuration(item.contentDetails?.duration);

  if (!cleaned || cleaned.length > 90) return false;
  if (duration < 90 || duration > 1200) return false;
  if (item.snippet?.liveBroadcastContent === "live") return false;
  return !/(合集|合輯|歌單|排行榜|必聽|冥想|靜心|睡眠|放鬆|白噪音|八段錦|zen trip-hop|playlist|mix|hour|hours)/i.test(text);
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

function uniqueSongs(items, tagPrefix) {
  const seen = new Set();
  return items
    .filter((item) => {
      const id = typeof item.id === "string" ? item.id : item.id?.videoId;
      if (!id || seen.has(id) || !isUsableMusicVideo(item)) return false;
      seen.add(id);
      return true;
    })
    .map((item, index) => toSong(item, index, tagPrefix));
}

async function fetchVideoDetails(ids) {
  const details = [];
  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    if (!batch.length) continue;

    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      id: batch.join(","),
      key: API_KEY,
    });
    const data = await fetchJson(`${VIDEO_API_URL}?${params}`, "YouTube video detail request");
    if (Array.isArray(data.items)) details.push(...data.items);
  }
  return details;
}

async function fetchSearchVideoIds({ query, limit, publishedAfter }) {
  const ids = [];
  const seen = new Set();
  let pageToken = "";

  while (ids.length < limit) {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      order: "viewCount",
      regionCode: "TW",
      relevanceLanguage: "zh",
      videoCategoryId: "10",
      maxResults: "50",
      q: query,
      key: API_KEY,
    });
    if (publishedAfter) params.set("publishedAfter", publishedAfter);
    if (pageToken) params.set("pageToken", pageToken);

    const data = await fetchJson(`${SEARCH_API_URL}?${params}`, `YouTube music search: ${query}`);
    for (const item of data.items ?? []) {
      const id = item.id?.videoId;
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
      if (ids.length >= limit) break;
    }

    pageToken = data.nextPageToken ?? "";
    if (!pageToken) break;
  }

  return ids;
}

async function fetchTaiwanMusicPopular(limit) {
  const items = [];
  let pageToken = "";

  while (items.length < limit) {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      chart: "mostPopular",
      regionCode: "TW",
      videoCategoryId: "10",
      maxResults: "50",
      key: API_KEY,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await fetchJson(`${VIDEO_API_URL}?${params}`, "YouTube mostPopular request");
    if (!Array.isArray(data.items) || !data.items.length) break;

    items.push(...data.items);
    pageToken = data.nextPageToken ?? "";
    if (!pageToken) break;
  }

  return uniqueSongs(items, "台灣前排熱門").slice(0, limit);
}

async function fetchRecentTaiwanMusic(limit) {
  const publishedAfter = recentPublishedAfter(30);
  const ids = [];
  const seen = new Set();

  for (const query of SEARCH_QUERIES) {
    const queryIds = await fetchSearchVideoIds({ query, limit: 50, publishedAfter });
    for (const id of queryIds) {
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  const details = await fetchVideoDetails(ids);
  return uniqueSongs(
    details.sort((a, b) => Number(b.statistics?.viewCount ?? 0) - Number(a.statistics?.viewCount ?? 0)),
    "近30天高觀看新歌",
  ).slice(0, limit);
}

async function fetchCountryMusicPack(pack) {
  const ids = await fetchSearchVideoIds({ query: pack.query, limit: COUNTRY_TARGET_COUNT });
  const details = await fetchVideoDetails(ids);
  const songs = uniqueSongs(
    details.sort((a, b) => Number(b.statistics?.viewCount ?? 0) - Number(a.statistics?.viewCount ?? 0)),
    pack.title,
  ).slice(0, COUNTRY_TARGET_COUNT);

  return {
    key: pack.key,
    title: pack.title,
    subtitle: `台灣地區觀看量排序，取前 ${COUNTRY_TARGET_COUNT} 首`,
    mark: pack.mark,
    tone: pack.tone,
    source: `YouTube Data API v3 / Taiwan viewCount search / ${pack.query}`,
    targetSongCount: COUNTRY_TARGET_COUNT,
    actualSongCount: songs.length,
    songs,
  };
}

function mergeUniqueSongLists(lists, limit) {
  const songs = [];
  const seen = new Set();

  for (const list of lists) {
    for (const song of list) {
      if (song?.id && !seen.has(song.id)) {
        seen.add(song.id);
        songs.push(song);
      }
      if (songs.length >= limit) return songs;
    }
  }

  return songs;
}

requireApiKey();

const popularSongs = await fetchTaiwanMusicPopular(POPULAR_TARGET_COUNT);
const recentSongs = await fetchRecentTaiwanMusic(TARGET_SONG_COUNT);
const songs = mergeUniqueSongLists([popularSongs, recentSongs], TARGET_SONG_COUNT);
const packs = [];

for (const pack of COUNTRY_MUSIC_PACKS) {
  packs.push(await fetchCountryMusicPack(pack));
}

if (songs.length < 50) {
  throw new Error(`Expected at least 50 combined YouTube music videos, found ${songs.length}.`);
}

const payload = {
  meta: {
    updatedAt: new Date().toISOString(),
    updatedLabel: todayTaipeiLabel(),
    source: "YouTube Data API v3 / Taiwan top music + 20-hour no-repeat daily pool",
    sourceUrl: "https://developers.google.com/youtube/v3/docs",
    sourceTimestamp:
      "YouTube Data API v3 videos.list chart=mostPopular regionCode=TW videoCategoryId=10 + search.list publishedAfter=30d order=viewCount",
    targetListeningHours: TARGET_LISTENING_HOURS,
    assumedAverageSongMinutes: ASSUMED_AVERAGE_SONG_MINUTES,
    targetSongCount: TARGET_SONG_COUNT,
    actualSongCount: songs.length,
    noRepeatWithinDay: true,
    countryTargetSongCount: COUNTRY_TARGET_COUNT,
  },
  songs,
  packs,
};

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(
  `Updated ${OUTPUT_PATH} with ${songs.length} songs. ` +
    `popular=${popularSongs.length}, recent=${recentSongs.length}, ` +
    `countryPacks=${packs.length}, target=${TARGET_SONG_COUNT}.`,
);
