/* =============================================================
   world/time.js — 時刻連動の色温度
   深夜(22〜5時): 背景の基準色相をわずかに暖色寄りに
   ============================================================= */

const BASE_HUE_DAY   = 140; // 昼間・デフォルト
const BASE_HUE_NIGHT = 135; // 深夜: わずかに暖色(赤寄り)

export function getBaseHue() {
  const hour = new Date().getHours();
  return (hour >= 22 || hour <= 5) ? BASE_HUE_NIGHT : BASE_HUE_DAY;
}
