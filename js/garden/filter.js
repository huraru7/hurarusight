/* =============================================================
   garden/filter.js — ジャンルタブのクリック処理
   タブをクリックすると一致しない記事を hidden にする（再描画なし）。
   アクティブなタブをもう一度クリックすると解除して全件表示に戻る。
   ============================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const tabHost = document.querySelector("[data-garden-tabs]");
  const listHost = document.querySelector("[data-garden-list]");
  if (!tabHost || !listHost) return;

  tabHost.addEventListener("click", (e) => {
    const btn = e.target.closest(".garden-tab");
    if (!btn) return;

    const alreadyActive = btn.classList.contains("is-active");
    tabHost.querySelectorAll(".garden-tab").forEach((t) => t.classList.remove("is-active"));

    if (alreadyActive) {
      listHost.querySelectorAll(".garden-list__item").forEach((item) => {
        item.hidden = false;
      });
      return;
    }

    btn.classList.add("is-active");
    const genre = btn.dataset.genre;
    listHost.querySelectorAll(".garden-list__item").forEach((item) => {
      item.hidden = item.dataset.genre !== genre;
    });
  });
});
