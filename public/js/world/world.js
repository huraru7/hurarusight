/* =============================================================
   world/world.js — 世界観レイヤーのエントリポイント
   各ページが initWorld(tendingCount) を呼ぶだけで全層が起動する。
   ============================================================= */

import { initParticles }   from "./particles.js";
import { initScrollWorld } from "./scroll-world.js";
import { getBaseHue }      from "./time.js";

export function initWorld(tendingCount = 0) {
  const baseHue = getBaseHue();
  initParticles(tendingCount);
  initScrollWorld(baseHue);
}
