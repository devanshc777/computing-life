// Hash router: each screen renders into #app and returns a cleanup function.

import { el, store, go } from "./dom.js";
import title from "./screens/title.js";
import menu from "./screens/menu.js";
import learn from "./screens/learn.js";
import sandbox from "./screens/sandbox.js";
import gallery from "./screens/gallery.js";
import aisc from "./screens/aisc.js";
import single from "./screens/single.js";
import race from "./screens/race.js";
import history from "./screens/history.js";
import custom from "./screens/custom.js";

const routes = { title, menu, learn, sandbox, gallery, aisc, single, race, history, custom };
const parents = { menu: "title", learn: "menu", sandbox: "menu", gallery: "menu", aisc: "menu",
  single: "aisc", race: "aisc", history: "aisc", custom: "aisc" };

const app = document.getElementById("app");
let cleanup = null;

function render() {
  const [name, ...rest] = (location.hash.replace(/^#\/?/, "") || "title").split("/");
  const screen = routes[name] || title;
  if (cleanup) { try { cleanup(); } catch { /* screen already gone */ } }
  app.replaceChildren();
  window.scrollTo(0, 0);
  cleanup = screen(app, rest) || null;
  app.focus({ preventScroll: true });
}

window.addEventListener("hashchange", render);
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || e.target.closest("input, select")) return;
  const name = (location.hash.replace(/^#\/?/, "") || "title").split("/")[0];
  if (parents[name]) go(`#/${parents[name]}`);
});

if (store.get("crt", true) === false) document.body.classList.add("no-crt");
document.body.append(el("div", { class: "footer-keys" },
  el("button", { onclick: () => { const off = document.body.classList.toggle("no-crt"); store.set("crt", !off); } }, "CRT ◐"),
  "  ·  ESC BACK"));

render();
