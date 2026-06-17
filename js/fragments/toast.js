/* =============================================================
   toast.js — 断片発見トースト（右上・フェードイン→自動フェードアウト）
   ============================================================= */

let host = null;

function ensureHost() {
  if (host) return host;
  host = document.createElement("div");
  host.className = "frag-toast-host";
  host.setAttribute("aria-live", "polite");
  document.body.appendChild(host);
  return host;
}

export function showToast(fragment) {
  if (!fragment) return;
  const root = ensureHost();

  const el = document.createElement("div");
  el.className = "frag-toast";
  el.innerHTML = `
    <span class="frag-toast__label">fragment discovered</span>
    <span class="frag-toast__name">#${fragment.id} — ${fragment.name}</span>`;
  root.appendChild(el);

  requestAnimationFrame(() => el.classList.add("is-visible"));

  const remove = () => {
    el.classList.remove("is-visible");
    setTimeout(() => el.remove(), 400);
  };
  setTimeout(remove, 3600);
}
