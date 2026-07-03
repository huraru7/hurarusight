/* =============================================================
   garden/filter.js — ジャンルタブのクリック処理
   タブをクリックすると一致しない記事を hidden にする（再描画なし）。
   「すべて」タブはデフォルトで選択され、全件表示に戻す。
   ============================================================= */

const ALL_GENRE = "すべて";

document.addEventListener("DOMContentLoaded", () => {
  const tabHost = document.querySelector("[data-garden-tabs]");
  const listHost = document.querySelector("[data-garden-list]");
  if (!tabHost || !listHost) return;

  tabHost.addEventListener("click", (e) => {
    const btn = e.target.closest(".garden-tab");
    if (!btn) return;

    tabHost.querySelectorAll(".garden-tab").forEach((t) => t.classList.remove("is-active"));
    btn.classList.add("is-active");

    const genre = btn.dataset.genre;
    listHost.querySelectorAll(".garden-card").forEach((item) => {
      item.hidden = genre !== ALL_GENRE && item.dataset.genre !== genre;
    });
  });
});
