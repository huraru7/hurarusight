/* =============================================================
   void-gate.js — 神威空間「ゲート」演出（表側 / index.html 上で動く部分）
   `run effect[shapez] void` を打った時だけ commands.js から呼ばれる。
   粒子の収束→魔法陣の発動→暗転までを担当し、暗転が完了したら
   実際のページ遷移で void/index.html（裏側）へ移動する。
   CSSはここで動的に <link> を注入する（index.html は無関係）。
   ============================================================= */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let glowEl = null;
let sequenceRunning = false; // 二重起動防止（連打・再入力対策）

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------- CSSの動的注入（トリガー時の1回限り）。
   読み込み完了を待ってから演出を始めることで、未スタイル状態が一瞬映るFOUCを防ぐ。 ---------- */
function injectAssets() {
  return new Promise((resolve) => {
    const existing = document.getElementById("void-gate-style-link");
    if (existing) {
      resolve();
      return;
    }
    const cssLink = document.createElement("link");
    cssLink.id = "void-gate-style-link";
    cssLink.rel = "stylesheet";
    cssLink.href = "css/void-gate.css";
    cssLink.addEventListener("load", () => resolve(), { once: true });
    cssLink.addEventListener("error", () => resolve(), { once: true }); // 失敗時も先に進める
    document.head.appendChild(cssLink);
  });
}

/* ---------- 魔法陣の装飾SVG ---------- */

/** 半径rOuter〜rInnerを結ぶ短い目盛り線をcount本、中心(cx,cy)を軸に均等配置したSVG文字列 */
function tickMarksSVG(cx, cy, rOuter, rInner, count) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x1 = (cx + Math.cos(angle) * rOuter).toFixed(1);
    const y1 = (cy + Math.sin(angle) * rOuter).toFixed(1);
    const x2 = (cx + Math.cos(angle) * rInner).toFixed(1);
    const y2 = (cy + Math.sin(angle) * rInner).toFixed(1);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }
  return s;
}

/** 中心(cx,cy)・半径rの六芒星（二つの三角形）のSVGパス文字列 */
function hexagramSVG(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  const toPath = (idx) =>
    "M" + idx.map((n) => pts[n].map((v) => v.toFixed(1)).join(",")).join(" L") + " Z";
  return `<path d="${toPath([0, 2, 4])}" /><path d="${toPath([1, 3, 5])}" />`;
}

/** クリアな線で描く魔法陣のSVG装飾（粒子だけでは出せない緻密な文様を補う） */
function sigilSVG() {
  return `
    <svg class="void-sigil" viewBox="0 0 200 200" aria-hidden="true">
      <g class="void-sigil__outer">
        <circle cx="100" cy="100" r="92" />
        <circle cx="100" cy="100" r="78" stroke-dasharray="1.5 5" />
        ${tickMarksSVG(100, 100, 86, 80, 24)}
      </g>
      <g class="void-sigil__mid">
        <circle cx="100" cy="100" r="58" stroke-dasharray="5 4" />
      </g>
      <g class="void-sigil__inner">
        <circle cx="100" cy="100" r="46" />
        ${hexagramSVG(100, 100, 38)}
      </g>
    </svg>`;
}

/* ---------- 演出パーツ ---------- */

function createGlow() {
  const hero = document.querySelector(".hero");
  if (!hero) return null;
  const glow = document.createElement("div");
  glow.className = "void-glow";
  const rays = document.createElement("div");
  rays.className = "void-rays";
  glow.appendChild(rays);
  glow.insertAdjacentHTML("beforeend", sigilSVG());
  hero.appendChild(glow);
  glowEl = glow;
  return glow;
}
function removeGlow() {
  glowEl?.remove();
  glowEl = null;
}

/** クリックで崩壊が始まる瞬間の一瞬のフラッシュ＋画面シェイク */
function flashAndShake() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const flash = document.createElement("div");
  flash.className = "void-flash";
  hero.appendChild(flash);
  hero.classList.add("void-shake");
  requestAnimationFrame(() => flash.classList.add("is-flashing"));
  setTimeout(() => {
    flash.remove();
    hero.classList.remove("void-shake");
  }, 500);
}

/** 魔法陣の外周5箇所に対応する「印」を光らせる装飾（円相＝魔法陣の発動演出用） */
function createRunes() {
  const hero = document.querySelector(".hero");
  if (!hero) return null;
  const wrap = document.createElement("div");
  wrap.className = "void-runes";
  const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
  const radius = 18.5 * vmin; // .void-glow(41vmin)の外周5マークに合わせた半径
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const rune = document.createElement("span");
    rune.className = "void-rune";
    rune.style.setProperty("--rx", `${(Math.cos(angle) * radius).toFixed(1)}px`);
    rune.style.setProperty("--ry", `${(Math.sin(angle) * radius).toFixed(1)}px`);
    rune.style.transitionDelay = `${i * 0.3}s`;
    wrap.appendChild(rune);
  }
  hero.appendChild(wrap);
  return wrap;
}

/** 円の位置から画面全体を覆っていくブラックアウト（裏側ページへ抜ける直前の演出） */
function createPortal() {
  const hero = document.querySelector(".hero");
  if (!hero) return null;
  const portal = document.createElement("div");
  portal.className = "void-portal";
  hero.appendChild(portal);
  return portal;
}

function waitForHotspotClick() {
  return new Promise((resolve) => {
    const hero = document.querySelector(".hero");
    if (!hero) {
      resolve();
      return;
    }
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = "void-hotspot";
    hotspot.setAttribute("aria-label", "enter");
    hero.appendChild(hotspot);
    hotspot.addEventListener(
      "click",
      () => {
        hotspot.remove();
        resolve();
      },
      { once: true }
    );
  });
}

/** `run effect[shapez] void` から呼ばれるゲート演出全体。最後に void/index.html へ遷移する。 */
export async function beginVoidGate() {
  // 連打・再入力での二重起動を防ぐ
  if (sequenceRunning) return;
  sequenceRunning = true;

  try {
    await injectAssets();
    const field = window.huraruParticles;
    if (!field) return;

    window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
    field.freeze();
    await field.goToShape("void");

    const glow = REDUCED ? null : createGlow();
    if (glow) {
      requestAnimationFrame(() => glow.classList.add("is-bright"));
      await wait(1700);
    }

    await wait(REDUCED ? 200 : 2400);
    window.hurarunium?.terminal?.print(["[INFO] something is here."]);

    if (glow) {
      glow.classList.remove("is-bright");
      glow.classList.add("is-dim");
      await wait(1500);
    }

    await waitForHotspotClick();

    if (REDUCED) {
      window.location.href = "void/index.html";
      return;
    }

    const runes = createRunes();

    // 1) 外周5つの印が、間を置きながら一つずつ光っていく
    await wait(200);
    runes?.querySelectorAll(".void-rune").forEach((r) => r.classList.add("is-lit"));
    await wait(1700);

    // 2) 魔法陣全体がゆっくり起動し、回転が増していく
    glowEl?.classList.add("is-activating");
    await wait(900);

    // 3) さらに加速し、最高潮へ
    glowEl?.classList.add("is-climax");
    await wait(400);

    // 4) クライマックス: フラッシュ＋画面シェイク
    flashAndShake();
    await wait(320);

    removeGlow();
    runes?.remove();
    await field.shrink(1.1);

    // 5) 円の位置から画面全体を覆うブラックアウト
    const portal = createPortal();
    requestAnimationFrame(() => portal?.classList.add("is-expanding"));
    await wait(1900); // is-expanding の transition 時間ぶん待ち、画面全体が覆われてから遷移する

    // 完全に暗転した状態で、裏側（神威空間そのもの）へページ遷移する。
    // 読み込み演出・粒子状態のリセットは不要（遷移先・遷移後にindex.htmlが作り直されるため）。
    window.location.href = "void/index.html";
  } finally {
    sequenceRunning = false;
  }
}
