/* =============================================================
   theme.js — テーマ適用エンジン
   config/site-config.js の currentTheme を起動時に適用し、
   ターミナルの `set theme <name>` から一時的に再適用もできるようにする。
   ★ localStorage には何も書かない（リロードすると必ず config の既定に戻る）。
   ============================================================= */

import { getTheme } from "../themes/index.js";
import { siteConfig } from "../config/site-config.js";
import { settings } from "../data/settings.js";

let activeId = null;
let imagesHost = null;

/** CSS変数名 → テーマの colors.* への対応表。ここに1か所だけ書けばよい。 */
const CSS_VAR_MAP = [
  ["--color-text", (t) => t.colors.base.text],
  ["--color-text-secondary", (t) => t.colors.base.textSecondary],
  ["--color-border-secondary", (t) => t.colors.base.borderSecondary],

  ["--hero-sky-top", (t) => t.colors.hero.skyTop],
  ["--hero-sky-mid", (t) => t.colors.hero.skyMid],
  ["--hero-sky-bottom", (t) => t.colors.hero.skyBottom],
  ["--hero-sky-highlight", (t) => t.colors.hero.skyHighlight],
  ["--hero-glow", (t) => t.colors.hero.heroGlow],
  ["--hero-tagline", (t) => t.colors.hero.tagline],
  ["--hero-scroll-hint", (t) => t.colors.hero.scrollHint],

  ["--about-title", (t) => t.colors.about.title],
  ["--about-subtitle", (t) => t.colors.about.subtitle],
  ["--about-board-bg", (t) => t.colors.about.boardBg],
  ["--about-board-speckle-dark", (t) => t.colors.about.boardSpeckleDark],
  ["--about-board-speckle-light", (t) => t.colors.about.boardSpeckleLight],
  ["--about-card-bg", (t) => t.colors.about.cardBg],
  ["--about-name-card-bg", (t) => t.colors.about.nameCardBg],
  ["--about-pin-highlight", (t) => t.colors.about.pinHighlight],
  ["--about-pin-shadow", (t) => t.colors.about.pinShadow],
  ["--about-alias-text", (t) => t.colors.about.aliasText],
  ["--about-info-label", (t) => t.colors.about.infoLabel],
  ["--about-info-value", (t) => t.colors.about.infoValue],
  ["--about-memo-bg", (t) => t.colors.about.memoBg],
  ["--about-memo-tape", (t) => t.colors.about.memoTape],
  ["--about-memo-text", (t) => t.colors.about.memoText],

  ["--links-title", (t) => t.colors.links.title],
  ["--links-subtitle", (t) => t.colors.links.subtitle],
  ["--links-icon-color", (t) => t.colors.links.iconColor],
  ["--links-label-color", (t) => t.colors.links.labelColor],
  ["--links-sublabel-color", (t) => t.colors.links.sublabelColor],
  ["--links-gate-accent", (t) => t.colors.links.gateAccent],
  ["--links-gate-accent-glow", (t) => t.colors.links.gateAccentGlow],
  ["--links-stone-accent", (t) => t.colors.links.stoneAccent],
  ["--links-stone-accent-glow", (t) => t.colors.links.stoneAccentGlow],
  ["--links-popup-bg", (t) => t.colors.links.popupBg],
  ["--links-popup-text", (t) => t.colors.links.popupText],
  ["--links-popup-subtext", (t) => t.colors.links.popupSubtext],
  ["--links-copied-accent", (t) => t.colors.links.copiedAccent],

  ["--frag-toast-bg", (t) => t.colors.fragments.toastBg],
  ["--frag-toast-border", (t) => t.colors.fragments.toastBorder],
  ["--frag-toast-text", (t) => t.colors.fragments.toastText],
  ["--frag-toast-label", (t) => t.colors.fragments.toastLabel],
  ["--frag-modal-bg", (t) => t.colors.fragments.modalBg],
  ["--frag-modal-border", (t) => t.colors.fragments.modalBorder],
  ["--frag-modal-text", (t) => t.colors.fragments.modalText],
  ["--frag-modal-subtext", (t) => t.colors.fragments.modalSubtext],
  ["--frag-progress-fill", (t) => t.colors.fragments.progressFill],
  ["--frag-locked-num", (t) => t.colors.fragments.lockedNum],
  ["--frag-locked-body", (t) => t.colors.fragments.lockedBody],
  ["--frag-stage3-glow", (t) => t.colors.fragments.stage3Glow],

  ["--font-accent", (t) => `"${t.font.accent}"`],
];

function applyCssVars(theme) {
  const root = document.documentElement.style;
  for (const [varName, getValue] of CSS_VAR_MAP) {
    root.setProperty(varName, getValue(theme));
  }
}

/** 粒子設定を反映する。色だけの変更ならuniformを直接書き換え、
    密度（count）が変わる場合だけ dispose() して再構築する。 */
function applyParticles(theme) {
  const P = settings.particles;
  const field = window.huraruParticles;
  const densityChanged = P.count !== theme.particle.density;

  P.colorEdge = theme.particle.colorEdge;
  P.colorCore = theme.particle.colorCore;
  P.colorGlow = theme.particle.colorGlow;
  P.haloColor = theme.particle.haloColor;
  P.haloAlpha = theme.particle.haloAlpha;
  P.shapes = theme.particle.shapes;
  P.randomOrder = theme.particle.randomOrder;
  P.count = theme.particle.density;

  if (!field) return; // まだ ParticleField が構築されていない（初回ロード時はこちら）

  if (densityChanged) {
    const canvas = field.canvas;
    field.dispose();
    import("./particles.js").then(({ ParticleField }) => {
      const next = new ParticleField(canvas);
      window.huraruParticles = next;
      next.start();
    });
  } else {
    const mat = field.points.material;
    mat.uniforms.uColor.value.set(theme.particle.colorEdge);
    mat.uniforms.uCore.value.set(theme.particle.colorCore);
    mat.uniforms.uCoreGlow.value.set(theme.particle.colorGlow);
    if (field.haloPoints) {
      const haloMat = field.haloPoints.material;
      haloMat.uniforms.uHaloColor.value.set(theme.particle.haloColor);
      haloMat.uniforms.uHaloAlpha.value = theme.particle.haloAlpha;
    }
  }
}

/** BGM再生エンジンはvβ1.0では未実装。theme.audio.bgm がnullの間は何もしない。
    将来音源ファイルが用意できたら、ここに <audio> 生成・クロスフェードを実装する。 */
function applyAudio(theme) {
  if (!theme.audio?.bgm) return;
}

function ensureImageHosts() {
  if (imagesHost) return imagesHost;
  imagesHost = {};
  for (const layer of ["background", "midground", "foreground"]) {
    const host = document.createElement("div");
    host.className = `theme-images theme-images--${layer}`;
    host.setAttribute("aria-hidden", "true");
    document.body.prepend(host);
    imagesHost[layer] = host;
  }
  return imagesHost;
}

/** テーマの装飾画像を描き直す。about.js のコルクボード画像カードとは別系統。
    空配列でも正しく動作する（何も追加しない）。 */
function applyImages(theme) {
  const hosts = ensureImageHosts();
  for (const host of Object.values(hosts)) host.replaceChildren();
  for (const img of theme.images ?? []) {
    const host = hosts[img.layer] ?? hosts.midground;
    const el = document.createElement("img");
    el.src = img.src;
    el.alt = "";
    el.style.position = "absolute";
    el.style.left = img.position?.x ?? "0";
    el.style.top = img.position?.y ?? "0";
    host.appendChild(el);
  }
}

function applyCopy(theme) {
  const el = document.querySelector('[data-bind="profile.tagline"]');
  if (el && theme.copy?.tagline != null) el.textContent = theme.copy.tagline;
}

/**
 * テーマを適用する。初期ロードでも、ターミナルからの一時切り替えでも、
 * 何度呼んでもよい（localStorageには何も書かない）。
 */
export function applyTheme(themeOrId) {
  const theme = typeof themeOrId === "string" ? getTheme(themeOrId) : themeOrId;
  if (!theme) return false;
  applyCssVars(theme);
  applyParticles(theme);
  applyAudio(theme);
  applyImages(theme);
  applyCopy(theme);
  activeId = theme.id;
  return true;
}

export function getCurrentThemeId() {
  return activeId;
}

// 初期適用（ページ読み込みごとに必ず config の既定テーマへ。保存はしない）
applyTheme(siteConfig.currentTheme);
