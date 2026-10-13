import { el, go, frame, backButton } from "../dom.js";
import { SEARCHERS } from "../../../search/index.js";

export default function aisc(root) {
  const card = (route, title, text, badge) =>
    el("section", { class: "frame clickable", tabindex: 0, role: "button",
      onclick: () => go(`#/${route}`), onkeydown: (e) => e.key === "Enter" && go(`#/${route}`) },
      el("div", { class: "titlebar" }, title),
      el("div", { class: "pad stack-s" }, badge ? el("span", { class: "badge alt", style: { justifySelf: "start" } }, badge) : null, el("p", {}, text)));

  root.append(backButton("#/menu"),
    el("div", { class: "wrap" },
      el("div", { class: "stack-s rise", style: { margin: "40px 0 28px" } },
        el("h3", {}, "AI & soft computing · project"),
        el("h1", {}, "Can a search algorithm build a shape?"),
        el("p", { class: "lede" },
          "Every search starts from a 16×16 patch of cells in a 64×64 world. A searcher proposes a patch, the world runs ",
          "for up to 1000 steps, and it scores how close the world came to containing the target shape. ",
          "Every searcher gets the same number of tries. Who gets there first?")),
      el("div", { class: "grid cols-2 rise" },
        card("race", "Race", "Pick a target and 2–5 searchers. Watch them search side by side, with random seeds as the baseline.", "the main event"),
        card("single", "Single run", "One searcher, one target. See its best attempt evolve and its score climb."),
        card("history", "Results", "The benchmark (20 runs each) next to the runs made on this machine."),
        card("custom", "Custom target", "Draw your own shape and send the searchers after it.")),
      el("div", { style: { marginTop: "28px" } }, frame("The searchers",
        el("div", { class: "pad grid cols-2" },
          Object.values(SEARCHERS).map((s) => el("div", { style: { "--c": s.colour } },
            el("div", { class: "legend" }, el("span", {}, el("i"), s.name)),
            el("p", { class: "muted", style: { margin: "6px 0 0" } }, s.blurb))))))));
}
