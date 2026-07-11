import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(new URL("../data/auto-picks.json", import.meta.url));
const API_KEY = process.env.YOUTUBE_API_KEY;
const FORCE_FALLBACK = process.env.FORCE_FALLBACK === "1";
const VIDEO_API_URL = "https://www.googleapis.com/youtube/v3/videos";
const SEARCH_API_URL = "https://www.googleapis.com/youtube/v3/search";
const TARGET_LISTENING_HOURS = 20;
const ASSUMED_AVERAGE_SONG_MINUTES = 4;
const TARGET_SONG_COUNT = Math.ceil((TARGET_LISTENING_HOURS * 60) / ASSUMED_AVERAGE_SONG_MINUTES);
const POPULAR_TARGET_COUNT = 100;
const COUNTRY_TARGET_COUNT = 100;
const SEARCH_QUERIES = [
  "台灣 華語 新歌",
  "台灣 音樂 MV",
  "台灣 KPOP 新歌",
  "台灣 獨立音樂",
];
const COUNTRY_MUSIC_PACKS = [
  { key: "mandarin-top", title: "華語 Top 100", mark: "華語", tone: "green", queries: ["華語 音樂", "台灣 華語 歌曲", "中文 流行音樂"] },
  { key: "kpop-top", title: "韓國 Top 100", mark: "KPOP", tone: "cyan", queries: ["韓國 KPOP 音樂", "KPOP music", "韓國 流行音樂"] },
  { key: "jpop-top", title: "日本 Top 100", mark: "JPOP", tone: "violet", queries: ["日本 JPOP 音樂", "Japanese pop music", "日本 流行音樂"] },
  { key: "western-top", title: "歐美 Top 100", mark: "POP", tone: "blue", queries: ["western pop music", "english pop music", "billboard hot 100", "歐美 流行音樂"] },
  { key: "thai-top", title: "泰國 Top 100", mark: "THAI", tone: "amber", queries: ["泰國 流行音樂", "Thai pop music", "T-pop music"] },
  { key: "latin-top", title: "拉丁 Top 100", mark: "LATIN", tone: "red", queries: ["Latin pop music", "reggaeton music", "latin music hits"] },
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
  const ids = [];
  const seen = new Set();

  for (const query of pack.queries) {
    const queryIds = await fetchSearchVideoIds({ query, limit: 40 });
    for (const id of queryIds) {
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

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
    source: `YouTube Data API v3 / Taiwan viewCount search / ${pack.title}`,
    targetSongCount: COUNTRY_TARGET_COUNT,
    actualSongCount: songs.length,
    songs,
  };
}

function normalizeIdentity(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\b(official|music|channel|records|recordings|vevo|topic)\b/gi, "")
    .replace(/[\p{P}\p{S}\s]+/gu, "")
    .trim();
}

function artistIdentity(song) {
  return normalizeIdentity(song?.artist);
}

function titleIdentity(song) {
  return normalizeIdentity(
    String(song?.title ?? "")
      .replace(/\([^)]*\)|\[[^\]]*\]|（[^）]*）/g, " ")
      .replace(/\b(feat|ft|live|remix|cover|version|ver|sped up|slowed|lyrics?)\b.*$/gi, " "),
  );
}

function ensureTaiwanTopPack(popularSongs, packs) {
  const taiwanPack = {
    key: "taiwan-top",
    title: "台灣 Top 100",
    subtitle: `YouTube 台灣音樂熱門排行，取前 ${POPULAR_TARGET_COUNT} 首`,
    mark: "TW100",
    tone: "red",
    source: "YouTube Data API v3 / Taiwan Music mostPopular",
    targetSongCount: POPULAR_TARGET_COUNT,
    actualSongCount: popularSongs.length,
    songs: popularSongs,
  };

  return [taiwanPack, ...packs.filter((pack) => pack.key !== taiwanPack.key)];
}

function buildDiverseSongPool({ popularSongs, recentSongs, packs, limit }) {
  const bucketEntries = [
    ["popular", popularSongs],
    ["recent", recentSongs],
    ...packs.filter((pack) => pack.key !== "taiwan-top").map((pack) => [pack.key, pack.songs]),
  ];
  const buckets = new Map(bucketEntries.map(([key, songs]) => [key, [...(songs ?? [])]]));
  const schedule = [
    "popular",
    "recent",
    "kpop-top",
    "popular",
    "mandarin-top",
    "recent",
    "western-top",
    "jpop-top",
    "thai-top",
    "latin-top",
  ];
  const output = [];
  const seenIds = new Set();
  const seenTitles = new Set();
  const recentArtists = [];
  const artistSpacing = 8;

  const takeFromBucket = (bucket, enforceArtistSpacing) => {
    const candidateIndex = bucket.findIndex((song) => {
      const artist = artistIdentity(song);
      const title = titleIdentity(song);
      if (!song?.id || seenIds.has(song.id) || (title && seenTitles.has(title))) return false;
      return !enforceArtistSpacing || !artist || !recentArtists.includes(artist);
    });

    if (candidateIndex < 0) return null;
    return bucket.splice(candidateIndex, 1)[0];
  };

  const appendSong = (song) => {
    output.push(song);
    seenIds.add(song.id);
    const title = titleIdentity(song);
    const artist = artistIdentity(song);
    if (title) seenTitles.add(title);
    if (artist) {
      recentArtists.push(artist);
      if (recentArtists.length > artistSpacing) recentArtists.shift();
    }
  };

  while (output.length < limit) {
    let addedThisRound = false;

    for (const key of schedule) {
      const bucket = buckets.get(key);
      if (!bucket?.length || output.length >= limit) continue;
      const song = takeFromBucket(bucket, true) ?? takeFromBucket(bucket, false);
      if (!song) continue;
      appendSong(song);
      addedThisRound = true;
    }

    if (!addedThisRound) break;
  }

  if (output.length < limit) {
    for (const bucket of buckets.values()) {
      while (bucket.length && output.length < limit) {
        const song = bucket.shift();
        if (!song?.id || seenIds.has(song.id)) continue;
        appendSong(song);
      }
    }
  }

  return { songs: output.slice(0, limit), artistSpacing };
}

function rotateItems(items, offset) {
  if (items.length < 2) return [...items];
  const safeOffset = offset % items.length;
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)];
}

async function readExistingPayload() {
  return JSON.parse(await readFile(OUTPUT_PATH, "utf8"));
}

async function writePayload(payload) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildFallbackPayload(existing, reason) {
  const updatedLabel = todayTaipeiLabel();
  if (
    existing.meta?.updatedLabel === updatedLabel &&
    existing.meta?.diversityPolicy &&
    Array.isArray(existing.songs) &&
    existing.songs.length >= TARGET_SONG_COUNT
  ) {
    return existing;
  }

  const verifiedSongs = Array.isArray(existing.songs) ? existing.songs : [];
  const existingPacks = Array.isArray(existing.packs) ? existing.packs : [];
  const storedTaiwanPack = existingPacks.find((pack) => pack.key === "taiwan-top");
  const popularSongs = storedTaiwanPack?.songs?.length
    ? storedTaiwanPack.songs.slice(0, POPULAR_TARGET_COUNT)
    : verifiedSongs.filter((song) => String(song.tag).startsWith("台灣前排熱門")).slice(0, POPULAR_TARGET_COUNT);
  const popularIds = new Set(popularSongs.map((song) => song.id));
  const discoverySongs = verifiedSongs.filter((song) => !popularIds.has(song.id));
  const daySeed = Number(updatedLabel.replace(/\D/g, "")) * 37;
  const packs = ensureTaiwanTopPack(popularSongs, existingPacks);
  const diversePool = buildDiverseSongPool({
    popularSongs,
    recentSongs: rotateItems(discoverySongs, daySeed),
    packs,
    limit: TARGET_SONG_COUNT,
  });
  const rotatedSongs = diversePool.songs;

  if (rotatedSongs.length < 50) {
    throw new Error(`Fallback pool is too small: ${rotatedSongs.length} songs.`);
  }

  return {
    ...existing,
    meta: {
      ...existing.meta,
      updatedAt: new Date().toISOString(),
      updatedLabel,
      actualSongCount: rotatedSongs.length,
      updateMode: "quota-fallback",
      fallbackReason: reason,
      diversityPolicy: "Country and language interleave, similar-title dedupe, artist spacing",
      artistSpacing: diversePool.artistSpacing,
      sourceTimestamp: "Daily diverse order refreshed from the previous verified YouTube API pool while search quota resets.",
    },
    songs: rotatedSongs,
    packs,
  };
}

function isQuotaError(error) {
  const message = String(error?.message ?? error);
  return message.includes("429") || /quota exceeded/i.test(message);
}

async function buildLivePayload() {
  const popularSongs = await fetchTaiwanMusicPopular(POPULAR_TARGET_COUNT);
  const recentSongs = await fetchRecentTaiwanMusic(TARGET_SONG_COUNT);
  const countryPacks = [];

  for (const pack of COUNTRY_MUSIC_PACKS) {
    countryPacks.push(await fetchCountryMusicPack(pack));
  }

  const packs = ensureTaiwanTopPack(popularSongs, countryPacks);
  const diversePool = buildDiverseSongPool({
    popularSongs,
    recentSongs,
    packs,
    limit: TARGET_SONG_COUNT,
  });
  const songs = diversePool.songs;

  if (songs.length < 50) {
    throw new Error(`Expected at least 50 combined YouTube music videos, found ${songs.length}.`);
  }

  return {
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
      updateMode: "live-api",
      diversityPolicy: "Country and language interleave, similar-title dedupe, artist spacing",
      artistSpacing: diversePool.artistSpacing,
    },
    songs,
    packs,
  };
}

async function main() {
  if (FORCE_FALLBACK) {
    const fallback = buildFallbackPayload(await readExistingPayload(), "Manual daily refresh while API quota resets.");
    await writePayload(fallback);
    console.log(`Fallback refresh completed for ${fallback.meta.updatedLabel} with ${fallback.songs.length} songs.`);
    return;
  }

  requireApiKey();

  try {
    const payload = await buildLivePayload();
    await writePayload(payload);
    console.log(
      `Updated ${OUTPUT_PATH} with ${payload.songs.length} songs. ` +
        `countryPacks=${payload.packs.length}, target=${TARGET_SONG_COUNT}.`,
    );
  } catch (error) {
    if (!isQuotaError(error)) throw error;
    const fallback = buildFallbackPayload(await readExistingPayload(), "YouTube API search quota reached.");
    await writePayload(fallback);
    console.warn(`API quota reached. Published ${fallback.meta.updatedLabel} fallback rotation instead.`);
  }
}

await main();
