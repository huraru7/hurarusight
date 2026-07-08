/* =============================================================
   world/particles.js — Canvas粒子システム
   水が上から下へ流れるような、非常に遅く微細な粒子の層。
   ============================================================= */

const MAX_PARTICLES = 400;
const CURSOR_RADIUS = 100;
const CURSOR_PULL   = 0.02;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function initParticles(tendingCount = 0) {
  const count = Math.min(200 + tendingCount * 15, MAX_PARTICLES);

  const canvas = document.createElement("canvas");
  canvas.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:0",
    "pointer-events:none",
    "width:100%",
    "height:100%",
  ].join(";");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  /* --- 粒子の初期化 --- */
  const particles = Array.from({ length: count }, () => ({
    x:    rand(0, W || window.innerWidth),
    y:    rand(0, H || window.innerHeight),
    vx:   rand(-0.05, 0.05),        // 横方向ほぼゼロ
    vy:   rand(0.1, 0.3),           // 下方向へ流れる
    size: rand(0.5, 1.5),
    // 透明度は個別にランダム
    alpha: rand(0.15, 0.35),
    // 背景 #0C100C より 5〜8% 明るい緑系
    r: Math.round(rand(24, 30)),
    g: Math.round(rand(30, 38)),
    b: Math.round(rand(24, 30)),
  }));

  /* --- カーソル追跡 --- */
  const mouse = { x: -9999, y: -9999 };
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  /* --- アニメーションループ --- */
  let rafId = null;
  let stopped = false;

  function tick() {
    if (stopped) return;
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      // カーソル吸引(半径100px以内のみ)
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CURSOR_RADIUS && dist > 0) {
        p.vx += (dx / dist) * CURSOR_PULL;
        p.vy += (dy / dist) * CURSOR_PULL;
      }

      // 速度減衰(ドリフトを抑える)
      p.vx *= 0.98;
      p.vy = p.vy * 0.98 + rand(0.1, 0.3) * 0.02; // 下方向バイアスを維持

      p.x += p.vx;
      p.y += p.vy;

      // 画面端でループ
      if (p.x < 0)  p.x = W;
      if (p.x > W)  p.x = 0;
      if (p.y < 0)  p.y = H;
      if (p.y > H)  p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
      ctx.fill();
    }

    rafId = requestAnimationFrame(tick);
  }

  // prefers-reduced-motion: 粒子を止める
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.matches) {
    stopped = true;
    return;
  }
  motionQuery.addEventListener("change", (e) => {
    if (e.matches) {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
    } else {
      stopped = false;
      tick();
    }
  });

  tick();
}
