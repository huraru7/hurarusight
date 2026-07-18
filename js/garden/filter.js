/* =============================================================
   garden/filter.js — フィルター操作
   TOPICS横スクロール矢印 / Typeドロップダウン / AND絞り込み / 0件表示
   ============================================================= */

const ALL = "すべて";
let selectedType = ALL;
let selectedTopic = ALL;

function applyFilter() {
  const cards = document.querySelectorAll(".garden-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const typeMatch = selectedType === ALL || card.dataset.genre === selectedType;
    const cardTopics = card.dataset.topics ? card.dataset.topics.split(",") : [];
    const topicMatch = selectedTopic === ALL || cardTopics.includes(selectedTopic);
    const visible = typeMatch && topicMatch;
    card.hidden = !visible;
    if (visible) visibleCount++;
  });

  const emptyEl = document.querySelector("[data-garden-empty]");
  if (emptyEl) emptyEl.hidden = visibleCount > 0;
}

function closeDropdown(filtersHost) {
  const menu = filtersHost.querySelector("[data-type-menu]");
  const trigger = filtersHost.querySelector("[data-type-trigger]");
  if (menu) menu.hidden = true;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
}

document.addEventListener("DOMContentLoaded", () => {
  const filtersHost = document.querySelector("[data-garden-filters]");
  if (!filtersHost) return;

  filtersHost.addEventListener("click", (e) => {
    /* --- 横スクロール矢印 --- */
    const scrollBtn = e.target.closest("[data-scroll-dir]");
    if (scrollBtn) {
      const container = filtersHost.querySelector("[data-topics-scroll]");
      if (container) {
        const dir = scrollBtn.dataset.scrollDir === "left" ? -1 : 1;
        container.scrollBy({ left: dir * 180, behavior: "smooth" });
      }
      return;
    }

    /* --- トピックチップ --- */
    const topicBtn = e.target.closest("[data-topic]");
    if (topicBtn) {
      filtersHost.querySelectorAll("[data-topic]").forEach((b) => b.classList.remove("is-active"));
      topicBtn.classList.add("is-active");
      selectedTopic = topicBtn.dataset.topic;
      applyFilter();
      return;
    }

    /* --- Typeドロップダウン トリガー --- */
    const trigger = e.target.closest("[data-type-trigger]");
    if (trigger) {
      const menu = filtersHost.querySelector("[data-type-menu]");
      if (!menu) return;
      const isOpen = !menu.hidden;
      menu.hidden = isOpen;
      trigger.setAttribute("aria-expanded", String(!isOpen));
      return;
    }

    /* --- Typeオプション選択 --- */
    const typeOption = e.target.closest("[data-type-option]");
    if (typeOption) {
      filtersHost.querySelectorAll("[data-type-option]").forEach((o) => o.classList.remove("is-active"));
      typeOption.classList.add("is-active");
      selectedType = typeOption.dataset.typeOption;

      const labelEl = filtersHost.querySelector("[data-type-label]");
      if (labelEl) labelEl.textContent = selectedType === ALL ? "すべてのType" : selectedType;

      closeDropdown(filtersHost);
      applyFilter();
    }
  });

  /* --- ドロップダウン外クリックで閉じる --- */
  document.addEventListener("click", (e) => {
    if (!filtersHost.contains(e.target)) {
      closeDropdown(filtersHost);
    }
  });
});
