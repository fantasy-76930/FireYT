const AUTO_PICKS_URL = "./data/auto-picks.json";
const AUTO_PICKS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const fallbackSongs = {
  cosmosNoOne: {
    id: "dRSZhZT6r-Y",
    visualId: "Z2Pym3k9CvI",
    title: "沒有人像我一樣",
    artist: "宇宙人 Cosmos People",
    tag: "台灣 #1 音樂趨勢",
  },
  idleGimme: {
    id: "FFjDEkZg-54",
    visualId: "nCIfydOldxI",
    title: "Gimme Dat Love",
    artist: "i-dle",
    tag: "台灣/全球趨勢",
  },
  babyMonster: {
    id: "9cS2wv6AfHk",
    visualId: "p9XYm7b3yzA",
    title: "I LIKE IT",
    artist: "BABYMONSTER",
    tag: "K-pop 熱門",
  },
  loveIsPain: {
    id: "Bkqk196gGOc",
    visualId: "VGh7JxBs3aM",
    title: "Love Is Pain",
    artist: "Trending track",
    tag: "情緒流行",
  },
  diorGirl: {
    id: "lpPccyGOPOU",
    visualId: "3rB3n_XR23o",
    title: "她已不再是那個女孩",
    artist: "DIOR 大穎",
    tag: "華語新歌",
  },
  morning: {
    id: "MnPQxn20BRM",
    visualId: "cw4GnaYYjH4",
    title: "Morning",
    artist: "Trending track",
    tag: "清爽流行",
  },
  ateezBad: {
    id: "-q_S27LbNKU",
    visualId: "HsBWmc8y0h0",
    title: "BAD",
    artist: "ATEEZ",
    tag: "K-pop 高能量",
  },
  liviaBrave: {
    id: "U4h0MiIcVWY",
    visualId: "179K9wQB6wo",
    title: "其實我沒有比較勇敢",
    artist: "林知夏 Livia Lin",
    tag: "華語情緒歌",
  },
  raining: {
    id: "LW5ROCc5SEw",
    visualId: "07Sfixrv39k",
    title: "一直下",
    artist: "Trending track",
    tag: "夜晚循環",
  },
  bansanka: {
    id: "UOKLtaE2U90",
    visualId: "AtPkUCqkbUM",
    title: "Bansanka",
    artist: "Trending track",
    tag: "日韓熱聽",
  },
  strayKidsRun: {
    id: "Q7IFjVUUb_E",
    visualId: "QTVlYd8Jdro",
    title: "RUN IT",
    artist: "Stray Kids",
    tag: "K-pop 新鮮",
  },
  courtesy: {
    id: "CADmiI5tdbc",
    visualId: "CGQl2xW-7tk",
    title: "客客氣氣 COURTESY",
    artist: "The Crane",
    tag: "台灣獨立",
  },
  nineOneOne: {
    id: "BFAuO-mrhcA",
    visualId: "8ki1Y5wpjiA",
    title: "有你有我",
    artist: "玖壹壹 春風 feat. 王識賢",
    tag: "台味合唱",
  },
  xiaoYuDream: {
    id: "gjbG_zhsH5o",
    visualId: "EIiC8gIAMgE",
    title: "我還有個夢",
    artist: "小宇 宋念宇",
    tag: "華語 R&B",
  },
};

let songs = { ...fallbackSongs };

const fallbackSongPacks = [
  {
    key: "today",
    title: "今天台灣在聽",
    subtitle: "不用想，先從台灣音樂趨勢前段開始",
    mark: "TW",
    tone: "red",
    source: "YouTube Data API v3 / Taiwan Music mostPopular",
    coverId: "w3r6Cru8e_4",
    heroId: "wY8n1ExAN-s",
    songKeys: ["cosmosNoOne", "idleGimme", "babyMonster", "loveIsPain", "diorGirl", "morning"],
  },
  {
    key: "mandarin",
    title: "華語新鮮感",
    subtitle: "中文、台灣、R&B、獨立歌一起換口味",
    mark: "華語",
    tone: "green",
    source: "Taiwan trending picks",
    coverId: "yM3jz8xVEqo",
    heroId: "rNpeCVWahkY",
    songKeys: ["cosmosNoOne", "diorGirl", "liviaBrave", "courtesy", "nineOneOne", "xiaoYuDream"],
  },
  {
    key: "kpop",
    title: "K-pop 熱門",
    subtitle: "i-dle、BABYMONSTER、ATEEZ、Stray Kids",
    mark: "KPOP",
    tone: "cyan",
    source: "YouTube music trending",
    coverId: "hJMGlRTzxLo",
    heroId: "5_6GRFK13vc",
    songKeys: ["idleGimme", "babyMonster", "ateezBad", "strayKidsRun", "bansanka", "morning"],
  },
  {
    key: "night",
    title: "夜晚循環",
    subtitle: "比較適合放空、滑手機、洗澡後慢慢聽",
    mark: "NITE",
    tone: "violet",
    source: "Mood edit",
    coverId: "KcF1cQmvbj4",
    heroId: "f6masGOa75Q",
    songKeys: ["loveIsPain", "raining", "liviaBrave", "xiaoYuDream", "courtesy", "cosmosNoOne"],
  },
  {
    key: "drive",
    title: "開車有精神",
    subtitle: "節奏明顯一點，聽起來不會太懶",
    mark: "DRIVE",
    tone: "amber",
    source: "Energy edit",
    coverId: "5ki3c8Szt7Y",
    heroId: "hQUVIT8m-c0",
    songKeys: ["babyMonster", "ateezBad", "strayKidsRun", "idleGimme", "nineOneOne", "morning"],
  },
  {
    key: "shuffle",
    title: "我真的聽膩了",
    subtitle: "華語、K-pop、流行混著來，直接洗掉舊歌單",
    mark: "MIX",
    tone: "blue",
    source: "Fantasy Tune mix",
    coverId: "w1v3Zwy622Q",
    heroId: "OA3coTpbDfw",
    songKeys: [
      "cosmosNoOne",
      "babyMonster",
      "diorGirl",
      "ateezBad",
      "liviaBrave",
      "bansanka",
      "nineOneOne",
      "strayKidsRun",
    ],
  },
];

let songPacks = fallbackSongPacks.map((pack) => ({ ...pack, songKeys: [...pack.songKeys] }));

const ambientRooms = [
  {
    title: "亞洲街食直播",
    subtitle: "到 YouTube 搜尋公開直播，優先選官方或原創頻道",
    kind: "平台搜尋",
    href: "https://www.youtube.com/results?search_query=asia+street+food+live+stream+official",
    image: "./assets/ambient-street-market.webp",
    tone: "teal",
  },
  {
    title: "中國市集散步",
    subtitle: "搜尋白天市場、買菜人聲、攤位移動感的公開內容",
    kind: "平台搜尋",
    href: "https://www.youtube.com/results?search_query=%E4%B8%AD%E5%9C%8B+%E5%B8%82%E9%9B%86+%E6%95%A3%E6%AD%A5+4K+%E5%8E%9F%E5%89%B5",
    image: "./assets/ambient-china-market.webp",
    tone: "cloud",
  },
  {
    title: "夜市人潮聲景",
    subtitle: "找夜市、街食、人群背景聲，避開重傳或來源不明影片",
    kind: "平台搜尋",
    href: "https://www.youtube.com/results?search_query=%E5%A4%9C%E5%B8%82+%E8%A1%97%E9%A3%9F+%E4%BA%BA%E7%BE%A4+%E8%81%B2%E6%99%AF+%E5%8E%9F%E5%89%B5",
    image: "./assets/ambient-night-market.webp",
    tone: "mahogany",
  },
  {
    title: "城市夜間漫遊",
    subtitle: "搜尋夜晚城市、市集燈光、走路視角的公開影片",
    kind: "平台搜尋",
    href: "https://www.youtube.com/results?search_query=%E5%9F%8E%E5%B8%82+%E5%A4%9C%E9%96%93+%E6%BC%AB%E9%81%8A+4K+%E5%8E%9F%E5%89%B5",
    image: "./assets/ambient-city-walk.webp",
    tone: "violet",
  },
  {
    title: "計程車窗外",
    subtitle: "找現正開車直播，像坐在後座看城市流動",
    kind: "直播搜尋",
    href: "https://www.youtube.com/results?search_query=taxi+driver+live+stream+night+drive+city",
    image: "./assets/ambient-taxi-window.webp",
    tone: "blue",
  },
  {
    title: "市集白噪音備用",
    subtitle: "沒直播時找市集背景聲，留在 YouTube 平台內播放",
    kind: "平台搜尋",
    href: "https://www.youtube.com/results?search_query=market+ambience+walking+tour+no+music+original",
    image: "./assets/ambient-market-noise.webp",
    tone: "amber",
  },
];

const packGrid = document.querySelector("#packGrid");
const songGrid = document.querySelector("#songGrid");
const songTitle = document.querySelector("#songTitle");
const songEyebrow = document.querySelector("#songEyebrow");
const playAll = document.querySelector("#playAll");
const heroPlay = document.querySelector("#heroPlay");
const featuredImage = document.querySelector("#featuredImage");
const nowTitle = document.querySelector("#nowTitle");
const nowMeta = document.querySelector("#nowMeta");
const miniList = document.querySelector("#miniList");
const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const resultGrid = document.querySelector("#resultGrid");
const installButton = document.querySelector("#installButton");
const shareButton = document.querySelector("#shareButton");
const shareButtonLabel = document.querySelector("#shareButtonLabel");
const visitorBadge = document.querySelector("#visitorBadge");
const tickerTrack = document.querySelector("#tickerTrack");
const signalCount = document.querySelector("#signalCount");
const signalSource = document.querySelector("#signalSource");
const signalMode = document.querySelector("#signalMode");
const ambientGrid = document.querySelector("#ambientGrid");
const ambientPlayAll = document.querySelector("#ambientPlayAll");
const updateLabel = document.querySelector("#updateLabel");

let deferredInstallPrompt = null;
let selectedPackKey = "today";

const toneColors = {
  red: "#0b4f86",
  cyan: "#25d0c0",
  amber: "#f1b642",
  green: "#39c979",
  violet: "#9f7aea",
  blue: "#5aa7ff",
};
const SONG_CARD_DISPLAY_LIMIT = 24;

function getPack(key) {
  return songPacks.find((pack) => pack.key === key) ?? songPacks[0];
}

function getSongs(pack) {
  return pack.songKeys.map((key) => songs[key]).filter(Boolean);
}

function youtubeWatch(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

function youtubeMusicWatch(id) {
  return `https://music.youtube.com/watch?v=${id}`;
}

function playlistUrl(songList) {
  return `https://www.youtube.com/watch_videos?video_ids=${songList.map((song) => song.id).join(",")}`;
}

function thumbnail(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function visualThumbnail(item) {
  return thumbnail(item.visualId ?? item.id);
}

function ambientHref(room) {
  return room.href ?? youtubeWatch(room.id);
}

function ambientImage(room) {
  return room.image ?? thumbnail(room.imageId ?? room.id);
}

function encode(value) {
  return encodeURIComponent(value.trim().replace(/\s+/g, " "));
}

function makeScopedAutoSongKey(scope, song, index) {
  return `${scope}${index + 1}${song.id.replace(/[^a-zA-Z0-9]/g, "")}`;
}

function isFreshAutoPickData(data) {
  const updatedAt = Date.parse(data?.meta?.updatedAt ?? "");
  if (!Number.isFinite(updatedAt)) return false;
  return Date.now() - updatedAt <= AUTO_PICKS_MAX_AGE_MS;
}

function applyAutoPicks(data) {
  if (!data || !Array.isArray(data.songs) || data.songs.length < 3) return;
  if (!isFreshAutoPickData(data)) return;

  const normalizeAutoSongs = (songList, scope) =>
    songList
      .filter((song) => /^[\w-]{8,}$/.test(song.id ?? ""))
      .map((song, index) => {
        const key = makeScopedAutoSongKey(scope, song, index);
        return {
          key,
          id: song.id,
          visualId: song.visualId ?? song.id,
          title: song.title || "今日趨勢歌曲",
          artist: song.artist || "YouTube Trending",
          tag: song.tag || `台灣音樂趨勢 #${index + 1}`,
        };
      });

  const autoSongs = normalizeAutoSongs(data.songs, "daily");

  if (autoSongs.length < 3) return;

  songs = { ...fallbackSongs };
  autoSongs.forEach((song) => {
    songs[song.key] = song;
  });

  const countryPacks = Array.isArray(data.packs)
    ? data.packs
        .map((pack, index) => {
          const packSongs = normalizeAutoSongs(pack.songs ?? [], `pack${index}`);
          packSongs.forEach((song) => {
            songs[song.key] = song;
          });
          if (packSongs.length < 3) return null;
          return {
            key: pack.key || `country${index + 1}`,
            title: pack.title || "各國 Top 100",
            subtitle: pack.subtitle || "台灣地區觀看量排序，各類取前 100 首",
            mark: pack.mark || "TOP",
            tone: pack.tone || "blue",
            source: pack.source || "YouTube Data API v3 / Taiwan viewCount search",
            coverId: packSongs[1]?.id || packSongs[0].id,
            heroId: packSongs[0].id,
            songKeys: packSongs.map((song) => song.key),
          };
        })
        .filter(Boolean)
    : [];

  songPacks = [
    ...fallbackSongPacks.map((pack) => {
      if (pack.key !== "today") return { ...pack, songKeys: [...pack.songKeys] };
      return {
        ...pack,
        title: "20 小時不重複",
        subtitle: "用 20 小時估算每日播放量，盡量同一天不重複",
        mark: `${autoSongs.length}`,
        source: data.meta?.source || "YouTube Data API v3 / Taiwan daily pool",
        coverId: autoSongs[1]?.id || autoSongs[0].id,
        heroId: autoSongs[0].id,
        songKeys: autoSongs.map((song) => song.key),
      };
    }),
    ...countryPacks,
  ];

  if (updateLabel && data.meta?.updatedLabel) {
    updateLabel.textContent = `更新 ${data.meta.updatedLabel} · Taiwan auto`;
  }
}

async function loadAutoPicks() {
  try {
    const response = await fetch(`${AUTO_PICKS_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    applyAutoPicks(await response.json());
  } catch {
    // Keep the hand-picked fallback list when the daily update file is unavailable.
  }
}

function renderPacks() {
  packGrid.innerHTML = songPacks
    .map((pack) => {
      const isActive = pack.key === selectedPackKey;
      return `
        <button class="pack-card ${isActive ? "is-active" : ""}" type="button" data-pack="${pack.key}" data-tone="${pack.tone}">
          <span class="pack-thumb" style="background-image: url('${thumbnail(pack.coverId)}')"></span>
          <span class="pack-copy">
            <strong>${pack.title}</strong>
            <span>${pack.subtitle}</span>
          </span>
          <span class="play-chip">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7Z"></path>
            </svg>
            播
          </span>
        </button>
      `;
    })
    .join("");
}

function renderHero(pack) {
  const packSongs = getSongs(pack);
  const featured = packSongs[0];
  document.documentElement.style.setProperty("--accent", toneColors[pack.tone] ?? toneColors.red);
  heroPlay.href = playlistUrl(packSongs);
  featuredImage.src = thumbnail(pack.heroId);
  featuredImage.alt = `${featured.artist} - ${featured.title}`;
  nowTitle.textContent = featured ? featured.title : pack.title;
  nowMeta.textContent = `${pack.title} · ${pack.source} · ${packSongs.length} 首`;
  signalCount.textContent = packSongs.length;
  signalSource.textContent = pack.mark;
  signalMode.textContent = pack.key === "shuffle" ? "MIX" : "LIVE";
  miniList.innerHTML = packSongs
    .slice(0, 4)
    .map(
      (song, index) => `
        <a href="${youtubeWatch(song.id)}" target="_blank" rel="noreferrer">
          <span>${index + 1}</span>
          <strong>${song.title}</strong>
          <small>${song.artist}</small>
        </a>
      `,
    )
    .join("");
}

function renderSongs(pack) {
  const packSongs = getSongs(pack);
  const visibleSongs = packSongs.slice(0, SONG_CARD_DISPLAY_LIMIT);
  songEyebrow.textContent = pack.source;
  songTitle.textContent = "完整歌單";
  playAll.href = playlistUrl(packSongs);
  songGrid.innerHTML = visibleSongs
    .map(
      (song, index) => `
        <article class="song-card" style="--delay: ${index * 55}ms">
          <a class="song-art" href="${youtubeWatch(song.id)}" target="_blank" rel="noreferrer">
            <img src="${visualThumbnail(song)}" alt="${song.artist} - ${song.title}" loading="lazy" />
            <span class="rank">${String(index + 1).padStart(2, "0")}</span>
            <span class="play-overlay">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7Z"></path>
              </svg>
            </span>
          </a>
          <div class="song-body">
            <p>${song.tag}</p>
            <h3>${song.title}</h3>
            <span>${song.artist}</span>
            <small>音樂資料與縮圖來源：YouTube</small>
          </div>
          <div class="song-actions">
            <a href="${youtubeWatch(song.id)}" target="_blank" rel="noreferrer">YouTube</a>
            <a href="${youtubeMusicWatch(song.id)}" target="_blank" rel="noreferrer">Music</a>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTicker() {
  const tickerSongs = [
    ...getSongs(getPack("today")),
    ...getSongs(getPack("mandarin")).slice(1, 4),
    ...getSongs(getPack("kpop")).slice(2, 5),
  ];
  const items = tickerSongs
    .map((song) => `<span><strong>${song.title}</strong> ${song.artist}</span>`)
    .join("");
  tickerTrack.innerHTML = `${items}${items}`;
}

function renderAmbientRooms() {
  ambientPlayAll.href = ambientHref(ambientRooms[0]);
  ambientGrid.innerHTML = ambientRooms
    .map(
      (room, index) => `
        <a class="ambient-card" href="${ambientHref(room)}" target="_blank" rel="noreferrer" data-tone="${room.tone}" style="--delay: ${index * 70}ms">
          <span class="ambient-thumb">
            <img src="${ambientImage(room)}" alt="${room.title}" loading="lazy" decoding="async" />
            <span class="live-pill">${room.kind}</span>
            <span class="ambient-pulse" aria-hidden="true"></span>
          </span>
          <span class="ambient-copy">
            <strong>${room.title}</strong>
            <span>${room.subtitle}</span>
          </span>
        </a>
      `,
    )
    .join("");
}

function selectPack(key, shouldScroll = false) {
  selectedPackKey = key;
  const pack = getPack(key);
  renderPacks();
  renderHero(pack);
  renderSongs(pack);
  if (shouldScroll) {
    document.querySelector(".song-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function enablePointerGlow() {
  document.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
  });
}

function renderSearchLinks(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    resultGrid.innerHTML = "";
    return;
  }

  const links = [
    {
      title: "YouTube Music 找同類型",
      href: `https://music.youtube.com/search?q=${encode(`${cleanQuery} 新歌 熱門`)}`,
      label: "Music",
    },
    {
      title: "YouTube 找播放清單",
      href: `https://www.youtube.com/results?search_query=${encode(`${cleanQuery} playlist 2026`)}`,
      label: "Playlist",
    },
  ];

  resultGrid.innerHTML = links
    .map(
      (link) => `
        <a class="result-card" href="${link.href}" target="_blank" rel="noreferrer">
          <span>${link.label}</span>
          <strong>${link.title}</strong>
        </a>
      `,
    )
    .join("");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The app still works as a normal website if registration is unavailable.
    });
  }
}

function setupVisitorCounter() {
  if (!visitorBadge) return;

  if (!location.hostname.includes("fantasy-76930.github.io")) {
    visitorBadge.alt = "上線後開始記錄今日 / 總到訪";
    visitorBadge.replaceWith(document.createTextNode("上線後開始記錄"));
    return;
  }

  const path = encodeURIComponent("fantasy-tune-home");
  const label = encodeURIComponent("TODAY/TOTAL");
  visitorBadge.src = `https://api.visitorbadge.io/api/combined?path=${path}&label=${label}&labelColor=%230b4f86&countColor=%23ff6f32&style=flat-square`;
}

async function copyShareLink() {
  const url = "https://fantasy-76930.github.io/Fantasy-Tune/";
  const title = "Fantasy Tune - 你不用找，我先挑好了";
  const text = "近期熱門歌單、K-pop、華語新歌、療癒直播聲景，一鍵直接播放。";

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      shareButtonLabel.textContent = "已複製";
      window.setTimeout(() => {
        shareButtonLabel.textContent = "分享";
      }, 1800);
    }
  } catch {
    shareButtonLabel.textContent = "再試一次";
    window.setTimeout(() => {
      shareButtonLabel.textContent = "分享";
    }, 1800);
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

shareButton.addEventListener("click", copyShareLink);

packGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".pack-card");
  if (!button) return;
  selectPack(button.dataset.pack, true);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderSearchLinks(input.value);
});

async function init() {
  await loadAutoPicks();
  renderTicker();
  renderAmbientRooms();
  selectPack(selectedPackKey);
  setupVisitorCounter();
  enablePointerGlow();
  registerServiceWorker();
}

init();
