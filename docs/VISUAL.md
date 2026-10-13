# Visual identity + page flow

Refs in `docs/visual-refs/`: CRT magenta/purple panel UI (@dei.septentrion), NES title screen (Warwolf, Takara
1991), pixel pause menu with ornamented panels (Arcane Pigeon). Items marked **(open)** are in `decisions.md` round 2.

## Look
- **8-bit / CRT.** Deep purple-black background, hot magenta + lilac panels, pixel font, ▶ cursor menus like an NES
  title screen. Optional subtle scanlines **(open)**.
- **Cells are Block Blast blocks, not flat squares:** every live cell is a bevelled tile — light top-left edge,
  dark bottom-right edge, a face colour. Dead cells show a faint grid only.
- **Panels** framed with pixel borders (stepped corners), title bars like the CRT ref.
- **One colour per searcher**, used everywhere that searcher appears (pane frame, chart line, legend, history).
  Proposed in decisions.md.

## Page flow
```
TITLE (NES style: logo, ▶ START / ▶ AISC PROJECT)
 └─ MENU
     ├─ LEARN ............ 8-bit info cards: the 4 rules (one card each, animated mini-grid), a brief history
     │                     (Conway 1970, Gardner's column, Turing-complete, Catagolue), → into SANDBOX
     ├─ SANDBOX .......... the full big grid: draw, random seed, run/pause/step, speed, clear
     ├─ GALLERY .......... "limited demonstration": the target shapes running live (glider, LWSS…HWSS, pulsar,
     │                     pentadecathlon, figure eight) + "makes copies" exhibits + a few cool ones, each with a card
     └─ AISC PROJECT
         ├─ SINGLE RUN ... pick searcher → pick target (incl. CUSTOM) → watch it search on the 64×64 grid
         ├─ RACE ......... pick target + participants (2–5; default HC, SA, GA-block; "more" adds GA-uniform
         │                 + random pane) → one pane per searcher showing its best seed live, shared chart
         │                 with random as the baseline line
         ├─ HISTORY ...... past runs: shipped benchmark results ("then") vs runs on this browser ("now")
         └─ CUSTOM SHAPE . draw a shape → it becomes a selectable target → see how fast each searcher reaches it
```
Every page: a back control, a one-line "what am I looking at" card, keyboard (arrows + Enter, Esc = back).

## Grid sizes
- Sandbox + gallery: big world sized to the screen.
- Single run + race: the **scoped 64×64 world** the experiments use, so what you watch is what was measured.
