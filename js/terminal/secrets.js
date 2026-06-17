/* =============================================================
   secrets.js — 隠しコンテンツ（最深部）
   ★ ルール:
     - _secrets は外部 export しない（このファイル内に閉じる）
     - 解放は tryUnlock(key, conditions) 経由のみ
     - 条件チェックはこの関数内で完結させる
   断片収集システムの「システム解放」キーをここに置く。
   秘匿性はキー文字列自体（ユーザーが正しい文字列を打てるか）が担保する。
   ============================================================= */

import { activateSystem } from "../fragments/state.js";

// 外部 export 禁止。
const _secrets = {
  achievement: {
    reveal: () => {
      activateSystem();
      return ["[CLASSIFIED] the system awakens.", "[CLASSIFIED] run fragments to proceed."];
    },
  },
};

/** 解放条件を満たすか（この関数内で完結） */
function meetsConditions(/* conditions */) {
  // キー自体が秘匿値なので、キーが一致した時点で条件は満たされている
  return true;
}

/**
 * 条件を満たした時だけ隠しコンテンツを返す。満たさなければ null。
 * @returns {null | object}
 */
export function tryUnlock(key, conditions) {
  if (!meetsConditions(conditions)) return null;
  return _secrets[key] ?? null;
}
