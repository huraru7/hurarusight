/* =============================================================
   garden/filter.js — フィルター操作
   TOPICS横スクロール矢印 / Typeチェックボックス（複数選択）/ AND絞り込み / 0件表示
   ============================================================= */

const ALL = "all";
const selectedTypes = new Set(); // 空 = すべて表示
let selectedTopic = ALL;

/* --- フィルター適用 --- */

function applyFilter() {
  const cards = document.querySelectorAll(".garden-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const typeMatch = selectedTypes.size === 0 || selectedTypes.has(card.dataset.genre);
    const cardTopics = card.dataset.topics ? card.dataset.topics.split(",") : [];
    const topicMatch = selectedTopic === ALL || cardTopics.includes(selectedTopic);
    const visible = typeMatch && topicMatch;
    card.hidden = !visible;
    if (visible) visibleCount++;
  });

  const emptyEl = document.querySelector("[data-garden-empty]");
  if (emptyEl) emptyEl.hidden = visibleCount > 0;
}

/* --- トリガーラベル更新 --- */

function updateTriggerLabel(filtersHost) {
  const labelEl = filtersHost.querySelector("[data-type-label]");
  if (!labelEl) return;
  if (selectedTypes.size === 0) {
    labelEl.textContent = "All Types";
  } else if (selectedTypes.size === 1) {
    labelEl.textContent = [...selectedTypes][0];
  } else {
    const first = [...selectedTypes][0];
    labelEl.textContent = `${first} +${selectedTypes.size - 1}`;
  }
}

/* --- ドロップダウン開閉 --- */

function closeDropdown(filtersHost) {
  const menu = filtersHost.querySelector("[data-type-menu]");
  const trigger = filtersHost.querySelector("[data-type-trigger]");
  if (menu) menu.hidden = true;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
}

/* --- 初期化 --- */

document.addEventListener("DOMContentLoaded", () => {
  const filtersHost = document.querySelector("[data-garden-filters]");
  if (!filtersHost) return;

  /* 横スクロール矢印 */
  filtersHost.addEventListener("click", (e) => {
    const scrollBtn = e.target.closest("[data-scroll-dir]");
    if (scrollBtn) {
      const container = filtersHost.querySelector("[data-topics-scroll]");
      if (container) {
        const dir = scrollBtn.dataset.scrollDir === "left" ? -1 : 1;
        container.scrollBy({ left: dir * 180, behavior: "smooth" });
      }
      return;
    }

    /* トピックチップ */
    const topicBtn = e.target.closest("[data-topic]");
    if (topicBtn) {
      filtersHost.querySelectorAll("[data-topic]").forEach((b) => b.classList.remove("is-active"));
      topicBtn.classList.add("is-active");
      selectedTopic = topicBtn.dataset.topic;
      applyFilter();
      return;
    }

    /* Typeドロップダウン トリガー */
    const trigger = e.target.closest("[data-type-trigger]");
    if (trigger) {
      const menu = filtersHost.querySelector("[data-type-menu]");
      if (!menu) return;
      const isOpen = !menu.hidden;
      menu.hidden = isOpen;
      trigger.setAttribute("aria-expanded", String(!isOpen));
    }
  });

  /* チェックボックスの変更（changeはbubbleする） */
  filtersHost.addEventListener("change", (e) => {
    const checkbox = e.target.closest(".garden-type-checkbox");
    if (!checkbox) return;

    if (checkbox.checked) {
      selectedTypes.add(checkbox.value);
    } else {
      selectedTypes.delete(checkbox.value);
    }

    updateTriggerLabel(filtersHost);
    applyFilter();
    /* ドロップダウンは閉じない（複数選択のため） */
  });

  /* ドロップダウン外クリックで閉じる */
  document.addEventListener("click", (e) => {
    if (!filtersHost.contains(e.target)) {
      closeDropdown(filtersHost);
    }
  });
});
