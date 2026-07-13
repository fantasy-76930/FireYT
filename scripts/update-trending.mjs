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
const ROTATION_POOL_LIMIT = 2000;
const MIN_ROTATION_POOL_SIZE = TARGET_SONG_COUNT * 2;
const DIVERSITY_POLICY_VERSION = 4;
const ROTATION_POLICY_VERSION = 1;
const MAX_SINGLE_TRACK_SECONDS = 600;
const CURATED_DAILY_SONGS = [
  {
    id: "hfawljxgzPQ",
    title: "靜靜地，深深呼吸",
    artist: "Lanternwood Music",
    tag: "工作背景樂 · 輕吉他 Lo-fi",
    durationSeconds: 11025,
  },
];
const REPETITIVE_TITLE_PATTERN =
  /\b(?:loop(?:ed|ing)?|repeat(?:ed)?|extended|\d+\s*(?:hours?|minutes?|mins?)|(?:one|two|three|four|five|six|eight|ten)\s*hours?)\b|(?:\d+\s*(?:小時|小时|分鐘|分钟)|循環|循环|單曲循環|单曲循环|無限循環|无限循环|重複播放|重复播放|洗腦循環|洗脑循环|延長版|延长版)/i;
// Manually reviewed main-feed videos with long near-identical audio passages.
const REPETITIVE_AUDIO_BLOCKLIST = new Set([
  "ekr2nIex040",
  "bu7nU9Mhpyo",
  "JGwWNGJdvx8",
  "kJQP7kiw5Fk",
  "OPf0YbXqDm0",
  "DiItGE3eAyQ",
  "UbhiNvrPNa8",
]);
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
  if (duration < 90 || duration > MAX_SINGLE_TRACK_SECONDS) return false;
  if (item.snippet?.liveBroadcastContent === "live") return false;
  if (REPETITIVE_TITLE_PATTERN.test(text)) return false;
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
    durationSeconds: parseIsoDuration(item.contentDetails?.duration),
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

async function fetchVerifiedArchiveSongs(songs) {
  const ids = [...new Set(songs.map((song) => song?.id).filter(Boolean))];
  if (!ids.length) return [];
  const details = await fetchVideoDetails(ids);
  const detailsById = new Map(details.map((item) => [item.id, item]));
  return uniqueSongs(ids.map((id) => detailsById.get(id)).filter(Boolean), "輪替歌庫");
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

function isAllowedDailySong(song) {
  const text = `${song?.title ?? ""} ${song?.tag ?? ""}`;
  return Boolean(
    song?.id && !REPETITIVE_AUDIO_BLOCKLIST.has(song.id) && !REPETITIVE_TITLE_PATTERN.test(text),
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

function buildDiverseSongPool({ popularSongs, recentSongs, packs, archiveSongs = [], curatedSongs = [], limit }) {
  const bucketEntries = [
    ["curated", curatedSongs],
    ["popular", popularSongs],
    ["recent", recentSongs],
    ...packs.filter((pack) => pack.key !== "taiwan-top").map((pack) => [pack.key, pack.songs]),
    ["archive", archiveSongs],
  ];
  const buckets = new Map(bucketEntries.map(([key, songs]) => [key, [...(songs ?? [])]]));
  const schedule = [
    "curated",
    "popular",
    "recent",
    "kpop-top",
    "popular",
    "mandarin-top",
    "recent",
    "western-top",
    "jpop-top",
    "archive",
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
      if (
        !isAllowedDailySong(song) ||
        seenIds.has(song.id) ||
        (title && seenTitles.has(title))
      ) {
        return false;
      }
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
        const title = titleIdentity(song);
        if (
          !isAllowedDailySong(song) ||
          seenIds.has(song.id) ||
          (title && seenTitles.has(title))
        ) {
          continue;
        }
        appendSong(song);
      }
    }
  }

  return { songs: output.slice(0, limit), artistSpacing };
}

function circularBatch(items, offset, count) {
  if (!items.length) return [];
  const safeOffset = ((offset % items.length) + items.length) % items.length;
  return Array.from(
    { length: Math.min(count, items.length) },
    (_, index) => items[(safeOffset + index) % items.length],
  );
}

function ensureCuratedDailySongs(songList) {
  const curatedIds = new Set(CURATED_DAILY_SONGS.map((song) => song.id));
  const remainingSongs = songList.filter((song) => !curatedIds.has(song.id));
  const insertAt = Math.min(POPULAR_TARGET_COUNT, remainingSongs.length);
  return [
    ...remainingSongs.slice(0, insertAt),
    ...CURATED_DAILY_SONGS,
    ...remainingSongs.slice(insertAt),
  ].slice(0, TARGET_SONG_COUNT);
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
    existing.meta?.diversityPolicyVersion === DIVERSITY_POLICY_VERSION &&
    Array.isArray(existing.songs) &&
    existing.songs.length >= TARGET_SONG_COUNT &&
    existing.songs.every(isAllowedDailySong) &&
    Array.isArray(existing.rotationSongs) &&
    existing.rotationSongs.length >= MIN_ROTATION_POOL_SIZE &&
    existing.rotationSongs.every(isAllowedDailySong) &&
    CURATED_DAILY_SONGS.every(
      ({ id }) =>
        existing.songs.some((song) => song.id === id) &&
        existing.rotationSongs.some((song) => song.id === id),
    )
  ) {
    return existing;
  }

  const verifiedSongs = [
    ...(Array.isArray(existing.rotationSongs) ? existing.rotationSongs : []),
    ...(Array.isArray(existing.songs) ? existing.songs : []),
  ];
  const existingPacks = Array.isArray(existing.packs) ? existing.packs : [];
  const storedTaiwanPack = existingPacks.find((pack) => pack.key === "taiwan-top");
  const popularSongs = storedTaiwanPack?.songs?.length
    ? storedTaiwanPack.songs.slice(0, POPULAR_TARGET_COUNT)
    : verifiedSongs.filter((song) => String(song.tag).startsWith("台灣前排熱門")).slice(0, POPULAR_TARGET_COUNT);
  const popularIds = new Set(popularSongs.map((song) => song.id));
  const discoverySongs = verifiedSongs.filter((song) => !popularIds.has(song.id));
  const daySeed = Number(updatedLabel.replace(/\D/g, "")) * 37;
  const packs = ensureTaiwanTopPack(popularSongs, existingPacks);
  const rotationPool = buildDiverseSongPool({
    popularSongs,
    recentSongs: rotateItems(discoverySongs, daySeed),
    packs,
    archiveSongs: verifiedSongs,
    curatedSongs: CURATED_DAILY_SONGS,
    limit: ROTATION_POOL_LIMIT,
  });
  const rotationSongs = rotationPool.songs;
  const rotatedSongs = ensureCuratedDailySongs(circularBatch(rotationSongs, daySeed, TARGET_SONG_COUNT));

  if (rotationSongs.length < MIN_ROTATION_POOL_SIZE) {
    throw new Error(`Fallback rotation pool is too small: ${rotationSongs.length} songs.`);
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
      diversityPolicy: "Country and language interleave, similar-title dedupe, artist spacing, repetitive-audio exclusion",
      diversityPolicyVersion: DIVERSITY_POLICY_VERSION,
      repetitiveAudioExclusions: REPETITIVE_AUDIO_BLOCKLIST.size,
      artistSpacing: rotationPool.artistSpacing,
      rotationPolicyVersion: ROTATION_POLICY_VERSION,
      rotationPoolCount: rotationSongs.length,
      rotationBatchSize: TARGET_SONG_COUNT,
      consecutiveBatchesDoNotOverlap: rotationSongs.length >= MIN_ROTATION_POOL_SIZE,
      sourceTimestamp: "Daily diverse order refreshed from the previous verified YouTube API pool while search quota resets.",
    },
    songs: rotatedSongs,
    rotationSongs,
    packs,
  };
}

function isQuotaError(error) {
  const message = String(error?.message ?? error);
  return message.includes("429") || /quota exceeded/i.test(message);
}

async function buildLivePayload(existing) {
  const popularSongs = await fetchTaiwanMusicPopular(POPULAR_TARGET_COUNT);
  const recentSongs = await fetchRecentTaiwanMusic(TARGET_SONG_COUNT);
  const countryPacks = [];

  for (const pack of COUNTRY_MUSIC_PACKS) {
    countryPacks.push(await fetchCountryMusicPack(pack));
  }

  const packs = ensureTaiwanTopPack(popularSongs, countryPacks);
  const archiveCandidates = [
    ...(Array.isArray(existing?.rotationSongs) ? existing.rotationSongs : []),
    ...(Array.isArray(existing?.songs) ? existing.songs : []),
  ];
  const archiveSongs = await fetchVerifiedArchiveSongs(archiveCandidates);
  const rotationPool = buildDiverseSongPool({
    popularSongs,
    recentSongs,
    packs,
    archiveSongs,
    curatedSongs: CURATED_DAILY_SONGS,
    limit: ROTATION_POOL_LIMIT,
  });
  const rotationSongs = rotationPool.songs;
  const daySeed = Number(todayTaipeiLabel().replace(/\D/g, "")) * 37;
  const songs = ensureCuratedDailySongs(circularBatch(rotationSongs, daySeed, TARGET_SONG_COUNT));

  if (rotationSongs.length < MIN_ROTATION_POOL_SIZE) {
    throw new Error(`Expected at least ${MIN_ROTATION_POOL_SIZE} rotation songs, found ${rotationSongs.length}.`);
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
      diversityPolicy: "Country and language interleave, similar-title dedupe, artist spacing, repetitive-audio exclusion",
      diversityPolicyVersion: DIVERSITY_POLICY_VERSION,
      repetitiveAudioExclusions: REPETITIVE_AUDIO_BLOCKLIST.size,
      artistSpacing: rotationPool.artistSpacing,
      rotationPolicyVersion: ROTATION_POLICY_VERSION,
      rotationPoolCount: rotationSongs.length,
      rotationBatchSize: TARGET_SONG_COUNT,
      consecutiveBatchesDoNotOverlap: rotationSongs.length >= MIN_ROTATION_POOL_SIZE,
    },
    songs,
    rotationSongs,
    packs,
  };
}

async function main() {
  const existing = await readExistingPayload();
  if (FORCE_FALLBACK) {
    const fallback = buildFallbackPayload(existing, "Manual daily refresh while API quota resets.");
    await writePayload(fallback);
    console.log(`Fallback refresh completed for ${fallback.meta.updatedLabel} with ${fallback.songs.length} songs.`);
    return;
  }

  requireApiKey();

  try {
    const payload = await buildLivePayload(existing);
    await writePayload(payload);
    console.log(
      `Updated ${OUTPUT_PATH} with ${payload.songs.length} songs. ` +
        `countryPacks=${payload.packs.length}, target=${TARGET_SONG_COUNT}.`,
    );
  } catch (error) {
    if (!isQuotaError(error)) throw error;
    const fallback = buildFallbackPayload(existing, "YouTube API search quota reached.");
    await writePayload(fallback);
    console.warn(`API quota reached. Published ${fallback.meta.updatedLabel} fallback rotation instead.`);
  }
}

await main();
