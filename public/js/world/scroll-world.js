/* =============================================================
   world/scroll-world.js — スクロール連動の背景色相シフト
   上端: hsl(baseHue, 13%, 4.7%)  →  下端: hsl(baseHue - 20, 13%, 4.7%)
   差は非常に微細。「気づくか気づかないか」が正しい。
   ============================================================= */

export function initScrollWorld(baseHue = 140) {
  function updateBg() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress   = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    const hue = baseHue - progress * 20;
    document.body.style.background = `hsl(${hue.toFixed(1)}, 13%, 4.7%)`;
  }

  window.addEventListener("scroll", updateBg, { passive: true });
  updateBg();
}
