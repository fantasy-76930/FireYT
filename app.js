const songs = {
  cosmosNoOne: {
    id: "dRSZhZT6r-Y",
    title: "沒有人像我一樣",
    artist: "宇宙人 Cosmos People",
    tag: "台灣 #1 音樂趨勢",
  },
  idleGimme: {
    id: "FFjDEkZg-54",
    title: "Gimme Dat Love",
    artist: "i-dle",
    tag: "台灣/全球趨勢",
  },
  babyMonster: {
    id: "9cS2wv6AfHk",
    title: "I LIKE IT",
    artist: "BABYMONSTER",
    tag: "K-pop 熱門",
  },
  loveIsPain: {
    id: "Bkqk196gGOc",
    title: "Love Is Pain",
    artist: "Trending track",
    tag: "情緒流行",
  },
  diorGirl: {
    id: "lpPccyGOPOU",
    title: "她已不再是那個女孩",
    artist: "DIOR 大穎",
    tag: "華語新歌",
  },
  morning: {
    id: "MnPQxn20BRM",
    title: "Morning",
    artist: "Trending track",
    tag: "清爽流行",
  },
  ateezBad: {
    id: "-q_S27LbNKU",
    title: "BAD",
    artist: "ATEEZ",
    tag: "K-pop 高能量",
  },
  liviaBrave: {
    id: "U4h0MiIcVWY",
    title: "其實我沒有比較勇敢",
    artist: "林知夏 Livia Lin",
    tag: "華語情緒歌",
  },
  raining: {
    id: "LW5ROCc5SEw",
    title: "一直下",
    artist: "Trending track",
    tag: "夜晚循環",
  },
  bansanka: {
    id: "UOKLtaE2U90",
    title: "Bansanka",
    artist: "Trending track",
    tag: "日韓熱聽",
  },
  strayKidsRun: {
    id: "Q7IFjVUUb_E",
    title: "RUN IT",
    artist: "Stray Kids",
    tag: "K-pop 新鮮",
  },
  courtesy: {
    id: "CADmiI5tdbc",
    title: "客客氣氣 COURTESY",
    artist: "The Crane",
    tag: "台灣獨立",
  },
  nineOneOne: {
    id: "BFAuO-mrhcA",
    title: "有你有我",
    artist: "玖壹壹 春風 feat. 王識賢",
    tag: "台味合唱",
  },
  xiaoYuDream: {
    id: "gjbG_zhsH5o",
    title: "我還有個夢",
    artist: "小宇 宋念宇",
    tag: "華語 R&B",
  },
};

const songPacks = [
  {
    key: "today",
    title: "今天台灣在聽",
    subtitle: "不用想，先從台灣音樂趨勢前段開始",
    mark: "TW",
    tone: "red",
    source: "Kworb / YouTube Taiwan Music Trending",
    songKeys: ["cosmosNoOne", "idleGimme", "babyMonster", "loveIsPain", "diorGirl", "morning"],
  },
  {
    key: "mandarin",
    title: "華語新鮮感",
    subtitle: "中文、台灣、R&B、獨立歌一起換口味",
    mark: "華語",
    tone: "green",
    source: "Taiwan trending picks",
    songKeys: ["cosmosNoOne", "diorGirl", "liviaBrave", "courtesy", "nineOneOne", "xiaoYuDream"],
  },
  {
    key: "kpop",
    title: "K-pop 熱門",
    subtitle: "i-dle、BABYMONSTER、ATEEZ、Stray Kids",
    mark: "KPOP",
    tone: "cyan",
    source: "YouTube music trending",
    songKeys: ["idleGimme", "babyMonster", "ateezBad", "strayKidsRun", "bansanka", "morning"],
  },
  {
    key: "night",
    title: "夜晚循環",
    subtitle: "比較適合放空、滑手機、洗澡後慢慢聽",
    mark: "NITE",
    tone: "violet",
    source: "Mood edit",
    songKeys: ["loveIsPain", "raining", "liviaBrave", "xiaoYuDream", "courtesy", "cosmosNoOne"],
  },
  {
    key: "drive",
    title: "開車有精神",
    subtitle: "節奏明顯一點，聽起來不會太懶",
    mark: "DRIVE",
    tone: "amber",
    source: "Energy edit",
    songKeys: ["babyMonster", "ateezBad", "strayKidsRun", "idleGimme", "nineOneOne", "morning"],
  },
  {
    key: "shuffle",
    title: "我真的聽膩了",
    subtitle: "華語、K-pop、流行混著來，直接洗掉舊歌單",
    mark: "MIX",
    tone: "blue",
    source: "FireYT mix",
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

const ambientRooms = [
  {
    title: "亞洲街食 24/7",
    subtitle: "熱鍋、攤販、人聲、街邊節奏，當作有人陪的白噪音",
    kind: "直播",
    id: "K8Sz64VF0gU",
    tone: "teal",
  },
  {
    title: "中國市集散步",
    subtitle: "白天市場、買菜人聲、攤位移動感",
    kind: "直播/長片",
    id: "p-QAMn82huw",
    tone: "cloud",
  },
  {
    title: "北方夜市人潮",
    subtitle: "乾淨熱鬧的夜市、街食和人群背景",
    kind: "長時間",
    id: "WJqybSOdR-g",
    tone: "mahogany",
  },
  {
    title: "貴陽夜城漫遊",
    subtitle: "夜晚城市、市集燈光、走路視角",
    kind: "4K 夜景",
    id: "LkZh7mykMdw",
    tone: "violet",
  },
  {
    title: "計程車窗外",
    subtitle: "找現正開車直播，像坐在後座看城市流動",
    kind: "直播搜尋",
    href: "https://www.youtube.com/results?search_query=taxi+driver+live+stream+night+drive+city",
    imageId: "DWeiS6-r3Js",
    tone: "blue",
  },
  {
    title: "中國夜市備用",
    subtitle: "沒直播時就開這類市集長片，讓背景聲一直有人氣",
    kind: "白噪音",
    id: "7IRqQs-vr28",
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
const tickerTrack = document.querySelector("#tickerTrack");
const signalCount = document.querySelector("#signalCount");
const signalSource = document.querySelector("#signalSource");
const signalMode = document.querySelector("#signalMode");
const ambientGrid = document.querySelector("#ambientGrid");
const ambientPlayAll = document.querySelector("#ambientPlayAll");

let deferredInstallPrompt = null;
let selectedPackKey = "today";

const toneColors = {
  red: "#ff3131",
  cyan: "#25d0c0",
  amber: "#f1b642",
  green: "#39c979",
  violet: "#9f7aea",
  blue: "#5aa7ff",
};

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

function ambientHref(room) {
  return room.href ?? youtubeWatch(room.id);
}

function ambientImage(room) {
  return thumbnail(room.imageId ?? room.id);
}

function encode(value) {
  return encodeURIComponent(value.trim().replace(/\s+/g, " "));
}

function renderPacks() {
  packGrid.innerHTML = songPacks
    .map((pack) => {
      const firstSong = songs[pack.songKeys[0]];
      const isActive = pack.key === selectedPackKey;
      return `
        <button class="pack-card ${isActive ? "is-active" : ""}" type="button" data-pack="${pack.key}" data-tone="${pack.tone}">
          <span class="pack-thumb" style="background-image: url('${thumbnail(firstSong.id)}')"></span>
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
  featuredImage.src = thumbnail(featured.id);
  featuredImage.alt = `${featured.artist} - ${featured.title}`;
  nowTitle.textContent = pack.title;
  nowMeta.textContent = `${pack.source} · ${packSongs.length} 首`;
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
  songEyebrow.textContent = pack.source;
  songTitle.textContent = pack.title;
  playAll.href = playlistUrl(packSongs);
  songGrid.innerHTML = packSongs
    .map(
      (song, index) => `
        <article class="song-card" style="--delay: ${index * 55}ms">
          <a class="song-art" href="${youtubeWatch(song.id)}" target="_blank" rel="noreferrer">
            <img src="${thumbnail(song.id)}" alt="${song.artist} - ${song.title}" loading="lazy" />
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
  ambientPlayAll.href = youtubeWatch(ambientRooms[0].id);
  ambientGrid.innerHTML = ambientRooms
    .map(
      (room, index) => `
        <a class="ambient-card" href="${ambientHref(room)}" target="_blank" rel="noreferrer" data-tone="${room.tone}" style="--delay: ${index * 70}ms">
          <span class="ambient-thumb">
            <img src="${ambientImage(room)}" alt="${room.title}" loading="lazy" />
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

packGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".pack-card");
  if (!button) return;
  selectPack(button.dataset.pack, true);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderSearchLinks(input.value);
});

renderTicker();
renderAmbientRooms();
selectPack(selectedPackKey);
enablePointerGlow();
registerServiceWorker();
