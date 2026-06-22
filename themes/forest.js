/* =============================================================
   forest.js — 最初のテーマ「森」
   現在のサイトの見た目（配色・粒子・コピー）をそのまま抽出したもの。
   新しいテーマを作るときは、このファイルをコピーして値を変えるだけでOK。
   ============================================================= */

export const theme = {
  id: "forest",
  name: "森",

  colors: {
    base: {
      text: "#2a3640",
      textSecondary: "#5a6b78",
      borderSecondary: "rgba(58, 72, 82, 0.35)",
    },
    hero: {
      skyTop: "#dceffb",
      skyMid: "#a8d6f5",
      skyBottom: "#79bce8",
      skyHighlight: "rgba(255, 251, 235, 0.5)",
      heroGlow: "rgba(245, 250, 255, 0.45)",
      tagline: "#5a6b78",
      scrollHint: "#7d8b96",
    },
    about: {
      title: "#2a3640",
      subtitle: "#5a6b78",
      boardBg: "#a9784f",
      boardSpeckleDark: "rgba(0, 0, 0, 0.18)",
      boardSpeckleLight: "rgba(255, 255, 255, 0.06)",
      cardBg: "#f5efe1",
      nameCardBg: "#fbf6ea",
      pinHighlight: "#e0d0b0",
      pinShadow: "#8a7a5a",
      aliasText: "#8c7a5a",
      infoLabel: "#8c98a3",
      infoValue: "#2a3640",
      memoBg: "#fff7c2",
      memoTape: "rgba(255, 255, 255, 0.55)",
      memoText: "#4a3f2a",
    },
    links: {
      title: "#2a3640",
      subtitle: "#5a6b78",
      iconColor: "#5a6b78",
      labelColor: "#2a3640",
      sublabelColor: "#8c98a3",
      gateAccent: "#a78bfa",
      gateAccentGlow: "rgba(167, 139, 250, 0.55)",
      stoneAccent: "#94a3b8",
      stoneAccentGlow: "rgba(148, 163, 184, 0.45)",
      popupBg: "rgba(255, 255, 255, 0.92)",
      popupText: "#2a3640",
      popupSubtext: "#8c98a3",
      copiedAccent: "#4ade80",
    },
    fragments: {
      toastBg: "rgba(20, 16, 12, 0.92)",
      toastBorder: "#4a3f2f",
      toastText: "#e8dcc4",
      toastLabel: "#a8957a",
      modalBg: "#f1e6c9",
      modalBorder: "#b8a571",
      modalText: "#3b2f1e",
      modalSubtext: "#6b5a3c",
      progressFill: "#8a6a3a",
      lockedNum: "#8a7a5a",
      lockedBody: "#3b2f1e",
      stage3Glow: "#d8b85a",
    },
  },

  /* 粒子アニメ（ファーストビュー背景）。data/settings.js の現行値と同じ */
  particle: {
    shapes: ["sphere", "blackHole", "lorenz"],
    randomOrder: true,
    density: 13000, // → settings.particles.count
    colorEdge: "#2456c8",
    colorCore: "#5b9bf0",
    colorGlow: "#eaffff",
    haloColor: "#040611",
    haloAlpha: 0.2,
  },

  // 現状サイトに専用の背景テクスチャ層はない（空のグラデーションのみ）。
  // フィールドは将来のテーマのために用意しておく。
  texture: { type: "none" },

  // 既にGoogle Fontsで読込済みのフォント
  font: { accent: "Cinzel" },

  // BGM再生エンジンはまだ存在しない（vβ1.0はプラグ穴のみ）。
  // 音源が用意できたら js/theme.js の applyAudio() に再生機構を実装する。
  audio: { bgm: null, volume: 0.5, loop: true },

  // 自由配置の装飾画像は現状なし
  images: [],

  copy: {
    tagline: "Wanderer of Worlds",
  },
};
