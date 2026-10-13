import { el, go, frame, backButton } from "../dom.js";

const ITEMS = [
  ["learn", "Learn the rules", "Four rules, one grid, and a short history."],
  ["sandbox", "Sandbox", "The full universe. Draw, seed at random, run it."],
  ["gallery", "Gallery", "Spaceships, oscillators, a gun that never stops, and a pattern that copies itself."],
  ["aisc", "AISC project", "Search algorithms race to build a target shape from scratch."],
];

export default function menu(root) {
  root.append(backButton("#/title"),
    el("div", { class: "wrap", style: { maxWidth: "760px", paddingTop: "12vh" } },
      frame("Main menu",
        el("div", { class: "pad" },
          el("ul", { class: "menu rise" },
            ITEMS.map(([route, label, hint]) =>
              el("li", {}, el("button", { onclick: () => go(`#/${route}`) },
                el("span", {}, label, el("div", { class: "hint" }, hint)))))))),
      el("p", { class: "muted", style: { textAlign: "center", marginTop: "28px" } },
        "↑ ↓ to move · ENTER to choose · ESC to go back")));

  const buttons = [...root.querySelectorAll(".menu button")];
  buttons[0].focus();
  const onKey = (e) => {
    const i = buttons.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { buttons[(i + 1) % buttons.length].focus(); e.preventDefault(); }
    if (e.key === "ArrowUp") { buttons[(i - 1 + buttons.length) % buttons.length].focus(); e.preventDefault(); }
  };
  addEventListener("keydown", onKey);
  return () => removeEventListener("keydown", onKey);
}
