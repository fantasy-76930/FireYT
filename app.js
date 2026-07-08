const quickSearches = [
  {
    title: "台灣熱門歌",
    description: "華語、台語、獨立新歌一起找",
    query: "台灣 熱門 音樂 現在最多人在聽",
    tone: "red",
  },
  {
    title: "全球流行",
    description: "Pop、K-pop、Billboard 感的熱門播放",
    query: "global top songs popular music",
    tone: "cyan",
  },
  {
    title: "開車歌單",
    description: "節奏清楚、適合長時間播放",
    query: "開車 好聽 音樂 播放清單",
    tone: "amber",
  },
  {
    title: "讀書工作",
    description: "lofi、jazz、輕電子與無人聲",
    query: "lofi study music playlist",
    tone: "green",
  },
  {
    title: "夜晚情歌",
    description: "慢歌、R&B、抒情歌集中搜尋",
    query: "夜晚 情歌 R&B 熱門",
    tone: "cyan",
  },
  {
    title: "派對節奏",
    description: "舞曲、EDM、嘻哈與高能量音樂",
    query: "party music hits playlist",
    tone: "red",
  },
  {
    title: "新歌速找",
    description: "最近上架與本週熱門新歌",
    query: "本週 新歌 熱門 音樂",
    tone: "green",
  },
  {
    title: "日韓熱門",
    description: "J-pop、K-pop、韓劇原聲帶",
    query: "J-pop K-pop 熱門 音樂",
    tone: "amber",
  },
];

const intentText = {
  popular: "現在最多人在聽 熱門",
  fresh: "最新 新歌 this week",
  playlist: "播放清單 playlist mix",
};

const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const quickGrid = document.querySelector("#quickGrid");
const resultGrid = document.querySelector("#resultGrid");
const caption = document.querySelector("#resultCaption");
const installButton = document.querySelector("#installButton");

let deferredInstallPrompt = null;

function encode(value) {
  return encodeURIComponent(value.trim().replace(/\s+/g, " "));
}

function getIntent() {
  const selected = form.querySelector("input[name='intent']:checked");
  return selected?.value ?? "popular";
}

function buildLinks(rawQuery, intent = getIntent()) {
  const query = rawQuery.trim() || "熱門 音樂";
  const weightedQuery = `${query} ${intentText[intent]}`;
  const encoded = encode(weightedQuery);
  const cleanEncoded = encode(query);

  return [
    {
      badge: "Music",
      title: "YouTube Music 搜尋",
      description: "直接進 YouTube Music 搜尋歌曲、專輯、歌手與官方播放清單。",
      href: `https://music.youtube.com/search?q=${encoded}`,
      source: "music.youtube.com",
    },
    {
      badge: "Search",
      title: "YouTube 熱門搜尋",
      description: "用目前關鍵字加上熱門、最多人在聽等條件找影片與音樂內容。",
      href: `https://www.youtube.com/results?search_query=${encoded}`,
      source: "youtube.com",
    },
    {
      badge: "Playlist",
      title: "只找播放清單",
      description: "適合想要一鍵連續播放，不想一首一首挑的時候。",
      href: `https://www.youtube.com/results?search_query=${encode(`${query} playlist 播放清單`)}`,
      source: "youtube.com",
    },
    {
      badge: "Charts",
      title: "YouTube Charts",
      description: "查看 YouTube 官方排行榜，再用你的關鍵字縮小類型或地區。",
      href: `https://charts.youtube.com/`,
      source: "charts.youtube.com",
    },
    {
      badge: "Live",
      title: "現正直播音樂",
      description: "找 live radio、lofi 或連續播放直播，適合背景音樂。",
      href: `https://www.youtube.com/results?search_query=${encode(`${query} live radio music`)}`,
      source: "youtube.com",
    },
    {
      badge: "Mix",
      title: "找相似推薦",
      description: "用 mix、radio、similar songs 幫你延伸同風格音樂。",
      href: `https://www.youtube.com/results?search_query=${encode(`${query} mix radio similar songs`)}`,
      source: "youtube.com",
    },
  ];
}

function renderQuickSearches() {
  quickGrid.innerHTML = quickSearches
    .map(
      (item) => `
        <button class="quick-card" type="button" data-query="${item.query}" data-tone="${item.tone}">
          <span>${item.description}</span>
          <strong>${item.title}</strong>
        </button>
      `,
    )
    .join("");
}

function renderResults(query, intent = getIntent()) {
  const links = buildLinks(query, intent);
  caption.textContent = `關鍵字：${query.trim() || "熱門 音樂"}`;
  resultGrid.innerHTML = links
    .map(
      (link) => `
        <a class="result-card" href="${link.href}" target="_blank" rel="noreferrer">
          <span class="card-top">
            <span class="badge">${link.badge}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17 17 7"></path>
              <path d="M8 7h9v9"></path>
            </svg>
          </span>
          <span>
            <strong>${link.title}</strong>
            <p>${link.description}</p>
          </span>
          <small>${link.source}</small>
        </a>
      `,
    )
    .join("");
}

function submitSearch(event) {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  renderResults(query);
  resultGrid.querySelector("a")?.focus({ preventScroll: true });
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

quickGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".quick-card");
  if (!button) return;
  input.value = button.dataset.query;
  renderResults(button.dataset.query);
  document.querySelector(".results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

form.addEventListener("submit", submitSearch);
form.addEventListener("change", () => renderResults(input.value || "熱門 音樂"));

renderQuickSearches();
renderResults("熱門 音樂");
registerServiceWorker();
