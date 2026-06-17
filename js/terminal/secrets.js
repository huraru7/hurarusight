/* =============================================================
   secrets.js — 隠しコンテンツ（最深部）
   ★ ルール:
     - _secrets は外部 export しない（このファイル内に閉じる）
     - 解放は tryUnlock(key, conditions) 経由のみ
     - 条件チェックはこの関数内で完結させる
   vβ1.0: 隠し要素は未実装。_secrets は空で tryUnlock は常に null。
   ============================================================= */

// 外部 export 禁止。将来ここに隠しコンテンツを追加する。
const _secrets = {
  // 例) "sigil-name": { reveal: () => [...lines], conditions: {...} },
};

/** 解放条件を満たすか（この関数内で完結） */
function meetsConditions(/* conditions */) {
  // vβ1.0: 解放条件は未定義 → 常に未達
  return false;
}

/**
 * 条件を満たした時だけ隠しコンテンツを返す。満たさなければ null。
 * @returns {null | object}
 */
export function tryUnlock(key, conditions) {
  if (!meetsConditions(conditions)) return null;
  return _secrets[key] ?? null;
}
