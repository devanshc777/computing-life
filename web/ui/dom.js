// Small DOM + storage helpers shared by every screen.

import { TARGETS } from "../../engine/patterns.js";

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "style" && typeof v === "object") {
      for (const [p, val] of Object.entries(v)) p.startsWith("--") ? node.style.setProperty(p, val) : (node.style[p] = val);
    }
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c instanceof Node ? c : String(c));
  return node;
}

export function frame(title, ...children) {
  return el("section", { class: "frame" },
    title ? el("div", { class: "titlebar" }, title, el("span", { class: "sq" }, el("i"), el("i"), el("i"))) : null,
    ...children);
}

let toastTimer = 0;
export function toast(text) {
  const t = document.getElementById("toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

export const go = (route) => { location.hash = route; };

// Browser storage is a convenience only: every read/write survives it being unavailable.
export const store = {
  get(key, fallback) { try { const v = localStorage.getItem(`lifega.${key}`); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(`lifega.${key}`, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

// Built-in targets plus shapes drawn on the custom page.
export function allTargets() {
  const list = Object.entries(TARGETS).map(([id, t]) => ({ id, ...t }));
  for (const c of store.get("custom", [])) list.push({ ...c, custom: true });
  return list;
}
export const targetById = (id) => allTargets().find((t) => t.id === id);

// A job's `custom` field: built-in targets are looked up by id inside the worker; drawn ones travel with the job.
export const customField = (t) => (t.custom ? { cells: t.cells, period: t.period || 1 } : null);

export function backButton(route = "#/menu") {
  return el("button", { class: "btn ghost back", onclick: () => go(route), title: "Back (Esc)" }, "◀ BACK");
}
