/* =============================================================
   void-ui.js — 神威空間（Origin Library）の DOM 生成・演出・本モーダル
   js/terminal/ 配下に閉じた、サイト本体から完全に独立したレイヤー。
   `run effect[shapez] void` を打った時だけ commands.js から呼ばれる。
   CSS・Webフォントはここで動的に <link> を注入する（index.html は無関係）。
   ============================================================= */

import { voidContent } from "../../data/hidden/void.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let built = false;
let overlayEl = null;
let glowEl = null;
let tsTimer = null;
let sequenceRunning = false; // 二重起動防止（連打・再入力対策）

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------- 資産の動的注入（トリガー時の1回限り）。
   読み込み完了を待ってから DOM を挿入することで、未スタイル状態が一瞬映る FOUC を防ぐ。 ---------- */
function injectAssets() {
  return new Promise((resolve) => {
    const existing = document.getElementById("void-style-link");
    if (existing) {
      resolve();
      return;
    }

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap";
    document.head.appendChild(fontLink);

    const cssLink = document.createElement("link");
    cssLink.id = "void-style-link";
    cssLink.rel = "stylesheet";
    cssLink.href = "css/void.css";
    cssLink.addEventListener("load", () => resolve(), { once: true });
    cssLink.addEventListener("error", () => resolve(), { once: true }); // 失敗時も先に進める
    document.head.appendChild(cssLink);
  });
}

/* ---------- DOM構築（一度だけ） ---------- */
function starsHTML() {
  let html = "";
  const count = 100;
  for (let i = 0; i < count; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = (1 + Math.random() * 2).toFixed(1);
    const duration = (2 + Math.random() * 4).toFixed(1);
    const delay = (Math.random() * 4).toFixed(1);
    const peak = (0.05 + Math.random() * 0.35).toFixed(2);
    html += `<span class="void-star" style="top:${top}%;left:${left}%;width:${size}px;height:${size}px;animation-duration:${duration}s;animation-delay:${delay}s;--peak:${peak};"></span>`;
  }
  return html;
}

// 固定パターンのジグザグ配置（縦一列にならないよう、本ごとに位置・傾きを変える）
const BOOK_LAYOUT = [
  { top: "0vh", left: "46%", rot: -1.6 },
  { top: "24vh", left: "64%", rot: 1.3 },
  { top: "48vh", left: "32%", rot: -1.1 },
  { top: "73vh", left: "58%", rot: 1.7 },
  { top: "97vh", left: "40%", rot: -0.9 },
];
function bookHTML(doc, index) {
  const layout = BOOK_LAYOUT[index % BOOK_LAYOUT.length];
  return `
    <div class="void-book" data-doc-id="${doc.id}" style="top:${layout.top};left:${layout.left};--rot:${layout.rot}deg" tabindex="0" role="button">
      <p class="void-book__id">${doc.id}</p>
      <p class="void-book__title">${doc.title}</p>
      <p class="void-book__preview">${doc.preview}</p>
      <p class="void-book__hint">[ 開く → ]</p>
    </div>`;
}

// 断章は本の並びと重ならない左右の余白帯に配置し、それぞれ違う経路・周期でゆっくり巡回させる
const FRAGMENT_POS = [
  { top: "6%", left: "5%" },
  { top: "22%", left: "90%" },
  { top: "40%", left: "4%" },
  { top: "58%", left: "91%" },
  { top: "78%", left: "6%" },
];
function fragmentsHTML() {
  return voidContent.fragments
    .map((text, i) => {
      const pos = FRAGMENT_POS[i % FRAGMENT_POS.length];
      const rot = (i % 2 === 0 ? 1 : -1) * (1 + (i % 3));
      const dx1 = (i % 2 === 0 ? 1 : -1) * (20 + ((i * 7) % 30));
      const dy1 = ((i * 5) % 30) - 10;
      const dx2 = (i % 2 === 0 ? -1 : 1) * (15 + ((i * 11) % 25));
      const dy2 = ((i * 9) % 30) - 15;
      const dx3 = (i % 2 === 0 ? 1 : -1) * (10 + ((i * 13) % 20));
      const dy3 = ((i * 3) % 24) - 8;
      const duration = 18 + ((i * 4) % 13); // 18〜30秒程度、要素ごとに違う固定周期
      const delay = -(i * 2.4); // 開始タイミングをずらして同期しないようにする
      const style = [
        `top:${pos.top}`,
        `left:${pos.left}`,
        `--rot:${rot}deg`,
        `--dx1:${dx1}px`,
        `--dy1:${dy1}px`,
        `--dx2:${dx2}px`,
        `--dy2:${dy2}px`,
        `--dx3:${dx3}px`,
        `--dy3:${dy3}px`,
        `--roam-duration:${duration}s`,
        `animation-delay:${delay}s`,
      ].join(";");
      return `<p class="void-fragment" style="${style}">${text}</p>`;
    })
    .join("");
}

async function ensureBuilt() {
  if (built) return;
  await injectAssets(); // CSSの読み込みが終わるまでDOMを挿入しない（未スタイル状態の一瞬表示を防ぐ）

  overlayEl = document.createElement("div");
  overlayEl.className = "void-overlay";
  overlayEl.innerHTML = `
    <div class="void-stars" aria-hidden="true">${starsHTML()}</div>
    <div class="void-scroll">
      <header class="void-header">
        <p class="void-coord">COORD — <span data-void-coord></span></p>
        <p class="void-libtitle">ORIGIN LIBRARY</p>
        <p class="void-zero" aria-hidden="true">0</p>
        <p class="void-subtitle">// the root of all worlds</p>
        <p class="void-scrollhint">▼ scroll to explore ▼</p>
      </header>
      <div class="void-books" data-void-books>
        ${voidContent.docs.map(bookHTML).join("")}
        ${fragmentsHTML()}
      </div>
      <button class="void-exit" type="button" data-void-exit>return to surface</button>
    </div>
    <div class="void-modal" data-void-modal>
      <div class="void-modal__sheet">
        <div class="void-modal__head">
          <span class="void-modal__id" data-void-modal-id></span>
          <button class="void-modal__close" type="button" aria-label="閉じる">[x]</button>
        </div>
        <h3 class="void-modal__title" data-void-modal-title></h3>
        <div class="void-modal__diagram" data-void-modal-diagram></div>
        <pre class="void-modal__body" data-void-modal-body></pre>
      </div>
    </div>`;
  document.body.appendChild(overlayEl);

  bindBooks();
  bindModal();
  bindExit();

  built = true;
}

/* ---------- 本クリック・スクロール演出 ---------- */
function bindBooks() {
  overlayEl.querySelectorAll(".void-book").forEach((el) => {
    el.addEventListener("click", () => openBook(el.dataset.docId));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openBook(el.dataset.docId);
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target); // 表示済みは監視をやめて軽量化
        }
      }
    },
    { threshold: 0.2 }
  );
  overlayEl.querySelectorAll(".void-book, .void-fragment").forEach((el) => io.observe(el));
}

/* ---------- 本モーダル ---------- */
function coordinatesText() {
  const c = voidContent.coordinates;
  const ts = new Date().toLocaleString("ja-JP", { hour12: false });
  return [
    `AXIS-X    ${c.x}`,
    `AXIS-Y    ${c.y}`,
    `AXIS-Z    ${c.z}`,
    `DEPTH     ${c.depth}`,
    `TIMESTAMP ${ts}`,
    `OBSERVER  ${c.observer}`,
  ].join("\n");
}

function renderConnectionDiagram(host, nodes) {
  const cx = 150;
  const cy = 30;
  const r = 85;
  const lines = nodes
    .map((name, i) => {
      const angle = (-90 + (i - (nodes.length - 1) / 2) * 26) * (Math.PI / 180);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r + 70;
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#3a4a6a" stroke-width="1" stroke-dasharray="3,3" />
              <text x="${x.toFixed(1)}" y="${(y + 14).toFixed(1)}" text-anchor="middle" fill="#7a8aaa" font-size="11" font-family="JetBrains Mono, monospace">${name}</text>`;
    })
    .join("");
  host.innerHTML = `
    <svg viewBox="0 0 300 150" width="100%" height="150" role="img" aria-label="接続図">
      ${lines}
      <circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#1a2040" stroke-width="1.5" />
      <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#6a7aaa" font-size="12" font-family="Cinzel, serif">0</text>
    </svg>`;
  host.classList.add("is-visible");
}

function openBook(id) {
  const doc = voidContent.docs.find((d) => d.id === id);
  if (!doc) return;

  const modal = overlayEl.querySelector("[data-void-modal]");
  const diagramHost = modal.querySelector("[data-void-modal-diagram]");
  diagramHost.innerHTML = "";
  diagramHost.classList.remove("is-visible");
  stopTimestampTicker();

  modal.querySelector("[data-void-modal-id]").textContent = doc.id;
  modal.querySelector("[data-void-modal-title]").textContent = doc.title;

  if (doc.id === "DOC-003") renderConnectionDiagram(diagramHost, doc.nodes);

  const bodyEl = modal.querySelector("[data-void-modal-body]");
  if (doc.isCoordinates) {
    bodyEl.textContent = coordinatesText();
    tsTimer = setInterval(() => {
      bodyEl.textContent = coordinatesText();
    }, 1000);
  } else {
    bodyEl.textContent = doc.body;
  }

  modal.classList.add("is-open");
}

function stopTimestampTicker() {
  if (tsTimer) clearInterval(tsTimer);
  tsTimer = null;
}

function closeBook() {
  const modal = overlayEl?.querySelector("[data-void-modal]");
  modal?.classList.remove("is-open");
  stopTimestampTicker();
}

function bindDrag(sheet, handle) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const onMove = (e) => {
    if (!dragging) return;
    const maxLeft = window.innerWidth - sheet.offsetWidth;
    const maxTop = window.innerHeight - sheet.offsetHeight;
    const left = Math.min(Math.max(0, startLeft + (e.clientX - startX)), Math.max(0, maxLeft));
    const top = Math.min(Math.max(0, startTop + (e.clientY - startY)), Math.max(0, maxTop));
    sheet.style.left = `${left}px`;
    sheet.style.top = `${top}px`;
  };
  const onUp = () => {
    dragging = false;
    sheet.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };

  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".void-modal__close")) return;
    const rect = sheet.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    sheet.style.position = "fixed";
    sheet.style.left = `${rect.left}px`;
    sheet.style.top = `${rect.top}px`;
    sheet.style.margin = "0";
    dragging = true;
    sheet.classList.add("is-dragging");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    e.preventDefault();
  });
}

function bindModal() {
  const modal = overlayEl.querySelector("[data-void-modal]");
  const sheet = modal.querySelector(".void-modal__sheet");
  const head = modal.querySelector(".void-modal__head");

  modal.querySelector(".void-modal__close").addEventListener("click", closeBook);
  modal.addEventListener("pointerdown", (e) => {
    if (e.target === modal) closeBook();
  });
  bindDrag(sheet, head);

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) {
        e.stopImmediatePropagation();
        closeBook();
      }
    },
    true
  );
}

/* ---------- 退場 ---------- */
function exitVoid() {
  closeBook();
  const field = window.huraruParticles;
  if (field) {
    field.resetScale();
    field.unfreeze();
    field._voidActive = false;
    field.start();
  }
  overlayEl.classList.remove("is-open", "is-content-hidden", "is-instant");
}

function bindExit() {
  overlayEl.querySelector("[data-void-exit]").addEventListener("click", exitVoid);
}

/* ---------- 入場直前の演出（粒子の収束→円→クリック→崩壊） ---------- */

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
  const radius = 18 * vmin; // .void-glow(40vmin)の外周5マークに合わせた半径
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

/** 円の位置から画面全体を覆っていく「裏側へ抜ける」ポータル拡大演出 */
function createPortal() {
  const hero = document.querySelector(".hero");
  if (!hero) return null;
  const portal = document.createElement("div");
  portal.className = "void-portal";
  hero.appendChild(portal);
  return portal;
}

/** ポータルが画面を覆っている間に表示する、何かを読み込んでいるような気配の演出 */
function createLoading() {
  const hero = document.querySelector(".hero");
  if (!hero) return null;
  const el = document.createElement("div");
  el.className = "void-loading";
  el.innerHTML = `
    <span class="void-loading__core"></span>
    <span class="void-loading__ring"></span>
    <span class="void-loading__ring"></span>
    <span class="void-loading__ring"></span>`;
  hero.appendChild(el);
  return el;
}

/** 魔法陣を発動させ、ポータルで裏側へ抜けてから神威空間を表示する（reduced-motionでは簡略化） */
async function revealVoid(field) {
  if (REDUCED) {
    field.resetScale();
    removeGlow();
    field._voidActive = true;
    field.stop();
    overlayEl.classList.add("is-open");
    return;
  }

  const runes = createRunes();

  // 1) 外周5つの印が、間を置きながら一つずつ光っていく
  await wait(200);
  runes?.querySelectorAll(".void-rune").forEach((r) => r.classList.add("is-lit"));
  await wait(1700); // 5つ点灯し終えて、しばらく魔法陣そのものを見せる

  // 2) 魔法陣全体がゆっくり起動し、回転が増していく（巻き上がっていく感じ）
  glowEl?.classList.add("is-activating");
  await wait(900);

  // 3) さらに加速し、最高潮へ
  glowEl?.classList.add("is-climax");
  await wait(400);

  // 4) クライマックス: フラッシュ＋画面シェイク
  flashAndShake();
  await wait(320);

  removeGlow();
  await field.shrink(1.1);

  // 5) 背景（黒）をここで即座に・確実に画面全体に敷く。以後この上に重ねる演出
  //    （ポータルの拡大・ローディング・コンテンツのズーム等）は全て装飾であり、
  //    途中状態がどうであれ背景の不透明性そのものには影響しない
  //    （ポータル自身が小さい間に表側が透けて見えていた、というバグの根本対策）。
  overlayEl.classList.add("is-open", "is-content-hidden", "is-instant");
  requestAnimationFrame(() => overlayEl.classList.remove("is-instant"));
  field._voidActive = true;
  field.stop();

  // 6) ポータルが裏側へ向けてゆっくり広がっていく（黒背景の上に重なる装飾）
  const portal = createPortal();
  requestAnimationFrame(() => portal?.classList.add("is-expanding"));
  await wait(1900);

  // 7) 画面が完全に覆われた後、何かが読み込まれているような気配を少し見せる
  const loading = createLoading();
  await wait(2400);
  loading?.remove();

  // 8) 奥から出てきてゆっくり止まるように、空間のコンテンツ（星・本文）が現れる
  overlayEl.classList.remove("is-content-hidden");
  await wait(1700);

  portal?.classList.add("is-fading");
  await wait(900);
  portal?.remove();
  runes?.remove();
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

/** `run effect[shapez] void` から呼ばれる入場シーケンス全体 */
export async function beginVoidSequence() {
  // 連打・再入力での二重起動を防ぐ（進行中、またはすでに空間内なら無視）
  if (sequenceRunning || window.huraruParticles?._voidActive) return;
  sequenceRunning = true;

  try {
    await ensureBuilt();
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
    await revealVoid(field); // 魔法陣の発動→ポータルで裏側へ抜ける演出→空間表示

    const coordEl = overlayEl.querySelector("[data-void-coord]");
    const c = voidContent.coordinates;
    if (coordEl) coordEl.textContent = `${c.x} / ${c.y} / ${c.z}`;
  } finally {
    sequenceRunning = false;
  }
}
