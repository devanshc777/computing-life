# Target ladder: GoL objects by rarity

Research for the Game of Life search-race project (GA vs hill climbing vs simulated annealing vs random, 16x16 seed, target object). No code.

## 0. Data provenance and honesty notes

- Census used: Catagolue `b3s23 / C1` (Conway's Life, asymmetric random soups, 16x16, density 0.5). Page header read **2026-10-13** ("Last modified at 2026-10-13 06:37-06:48" on the sub-census pages). Totals on https://catagolue.hatsya.com/census/b3s23/C1 at that time: **338,799,095,852,722 soups** (3.388e14), **7,401,023,740,454,938 objects** (7.401e15), 4,544,906 committed hauls. That is **21.84 objects per soup** on average.
- Counts per object come from the per-class sub-census pages (e.g. https://catagolue.hatsya.com/census/b3s23/C1/xq4, `/xp2`, `/xp3`, `/xp8`, `/xp15`). The main census page itself lists only apgcodes, no counts.
- Rank and "1 in N" relative frequency come from LifeWiki "Most common objects on Catagolue". `conwaylife.com` returned HTTP 403 to my fetcher, so I read the LifeWiki mirror https://conwaylife.njohnston.ca/wiki/Most_common_objects_on_Catagolue (same page; mirror shows last edit 27 April 2026; page states "last audited for accuracy in March, 2022"; top-100 ranks unchanged since July 2017). The canonical page is https://conwaylife.com/wiki/Most_common_objects_on_Catagolue (search snippet confirmed it exists with the same top-13 order).
- **What the two frequency numbers mean (do not mix them):**
  - **Per object occurrence** = count / total objects (7.401e15). This is what LifeWiki's "1/N" means. "1/3.24" for the block = about 31% of all objects counted are blocks.
  - **Per soup** = count / total soups (3.388e14) = *expected number of that object per soup*. For common objects this is above 1 (a soup contains several blocks). For rare objects (<0.01) it is also approximately the probability that a random soup contains at least one. Per-soup figures are **my arithmetic** from the Catagolue counts, not numbers printed on either site.
- Consistency check I ran: count / 7.401e15 reproduced LifeWiki's ratio for blinker (1/3.49), glider (1/11.4), toad (1/457), beacon (1/1,461), LWSS (1/7,784), MWSS (1/29,547), HWSS (1/170K), pulsar (1/14,180), pentadecathlon (1/1.32M), clock (1/2.26M). Counts for block, beehive, loaf, boat, ship, tub, pond, long boat, barge were not fetched directly; their per-soup values are **derived** from LifeWiki's 1/N times 21.84 objects/soup.
- Caveat on method: pages were read through a summarising fetch tool, so every number was cross-checked as above, but the Catagolue counts for xp4, xp5, xp6, xp14 were not independently cross-checked.

## 1. Frequency table (C1, snapshot 2026-10-13)

| Object | apgcode | LifeWiki rank | Per object (1 in N) | Raw count (C1) | Per soup (expected count) |
|---|---|---|---|---|---|
| Block | xs4_33 | 1 | 1/3.24 | n/f (derived) | ~6.7 (derived) |
| Blinker | xp2_7 | 2 | 1/3.49 | 2,123,190,832,272,632 | 6.27 |
| Beehive | xs6_696 | 3 | 1/6.11 | n/f | ~3.6 (derived) |
| Glider | xq4_153 | 4 | 1/11.4 | 650,704,546,403,641 | 1.92 |
| Loaf | xs7_2596 | 5 | 1/20.7 | n/f | ~1.06 (derived) |
| Boat | xs5_253 | 6 | 1/22.4 | n/f | ~0.98 (derived) |
| Ship | xs6_356 | 7 | 1/32.5 | n/f | ~0.67 (derived) |
| Tub | xs4_252 | 8 | 1/103 | n/f | ~0.21 (derived) |
| Pond | xs8_6996 | 9 | 1/106 | n/f | ~0.21 (derived) |
| Long boat | xs7_25ac | 10 | 1/319 | n/f | ~0.069 (derived) |
| Toad | xp2_7e | 11 | 1/457 | 16,199,036,232,350 | 0.048 |
| Beacon | xp2_318c | 13 | 1/1,461 | 5,065,736,686,744 | 0.015 |
| Barge | xs6_25a4 | 14 | 1/1,520 | n/f | ~0.014 (derived) |
| Lightweight spaceship (LWSS) | xq4_6frc | 18 | 1/7,784 | 950,712,314,262 | 2.8e-3 |
| Pulsar | xp3_co9nas0san9oczgoldlo0oldlogz1047210127401 | 21 | 1/14,180 | 521,914,435,112 | 1.5e-3 |
| Middleweight spaceship (MWSS) | xq4_27dee6 | 23 | 1/29,547 | 250,470,610,583 | 7.4e-4 |
| Heavyweight spaceship (HWSS) | xq4_27deee6 | 35 | 1/170K | 43,527,866,804 | 1.3e-4 |
| Pentadecathlon | xp15_4r4z4r4 | 52 | 1/1.32M | 5,618,485,016 | 1.7e-5 |
| Clock | xp2_2a54 | 62 | 1/2.26M | 3,274,874,903 | 9.7e-6 |
| Great on-off | xp2_g8gid1e8z1226 | >100 | 1/1.75e7 (computed) | 422,149,744 | 1.25e-6 |
| **Figure eight** | xp8_gk2gb3z11 | >100 | 1/3.68e7 (computed) | 201,187,385 | **5.9e-7** |
| Mold (p4) | xp4_37bkic | >100 | 1/6.4e7 (computed) | 115,100,429 | 3.4e-7 |
| Blocker (p8) | xp8_g3jgz1ut | >100 | 1/4.8e8 (computed) | 15,290,676 | 4.5e-8 |
| Octagon 2 (p5) | xp5_idiidiz01w1 | >100 | 1/2.1e9 (computed) | 3,455,016 | 1.0e-8 |
| Unix (p6) | xp6_ccb7w66z066 | >100 | 1/2.2e9 (computed) | 3,408,014 | 1.0e-8 |
| Tumbler (p14) | xp14_j9d0d9j | >100 | 1/3.3e9 (computed) | 2,270,481 | 6.7e-9 |
| Coe's p8 | xp8_wgovnz234z33 | >100 | 1/1.5e10 (computed) | 501,774 | 1.5e-9 |
| Coe ship (c/... xq16) | xq16_gcbgzvgg826frc | >100 | 1/4.1e13 (computed) | 181 | 5.3e-13 |
| Schick engine (xq12) | xq12_fh1i0i1hfzw8sms8zxfjf | >100 | 1/1.2e15 (computed) | 6 | 1.8e-14 |
| Loafer (xq7) | xq7_3nw17862z6952 | >100 | 1/3.7e15 (computed) | 2 | 5.9e-15 |
| **Gosper glider gun** | yl30_1_5_74055a5f5e513fd2e62fb8d6117d3f03 | none | **never in C1** | 0 | 0 |

"n/f" = count not fetched. "computed" = count / 7.401e15, my arithmetic; the object is outside LifeWiki's top 100 so there is no printed ratio.

Other facts from the same pages:
- Figure eight is "the most common period-8 oscillator on Catagolue, being more common than blocker" (https://conwaylife.com/wiki/Figure_eight, read via mirror).
- Gosper gun: the C1 census lists linear-growth classes yl72 ... yl4608 and no `yl30`, so the gun has zero occurrences in C1. LifeWiki says its first known semi-natural occurrence was a tetramer variant found by Open Science Grid in a **symmetric** soup on 9 November 2022 (https://conwaylife.com/wiki/Gosper_glider_gun). Treat the Gosper gun as unreachable in our setting.
- Loafer: first appeared in a soup on 1 April 2020, first non-standard-speed spaceship seen in an **asymmetric** soup; 10 loafer-producing soups known as of October 2024, three of them symmetric (https://conwaylife.com/wiki/Loafer). C1 shows 2 occurrences.
- Figure eight, pentadecathlon, pulsar, tumbler etc. also occur in symmetric censuses; nothing in my sources restricts them to symmetric soups. Only the Gosper gun (and effectively Loafer) is flagged symmetric-only or near-never.

## 2. Shortlist properties

Source for each: LifeWiki page via mirror https://conwaylife.njohnston.ca/wiki/<Name> (canonical https://conwaylife.com/wiki/<Name>). Period of still lifes is 1 by definition (the pages did not state it). "Pop" = live cells.

| Object | Type | Period | Pop (cells) | Bounding box | apgcode | LifeWiki URL |
|---|---|---|---|---|---|---|
| Block | still life | 1 | 4 | 2x2 | xs4_33 | https://conwaylife.com/wiki/Block |
| Blinker | oscillator | 2 | 3 (both phases) | 3x3 across both phases (3x1 each) | xp2_7 | https://conwaylife.com/wiki/Blinker |
| Beehive | still life | 1 | 6 | 4x3 | xs6_696 | https://conwaylife.com/wiki/Beehive |
| Loaf | still life | 1 | 7 | 4x4 | xs7_2596 | https://conwaylife.com/wiki/Loaf |
| Boat | still life | 1 | 5 | 3x3 | xs5_253 | https://conwaylife.com/wiki/Boat |
| Ship | still life | 1 | 6 | 3x3 | xs6_356 | https://conwaylife.com/wiki/Ship |
| Tub | still life | 1 | 4 | 3x3 | xs4_252 | https://conwaylife.com/wiki/Tub |
| Pond | still life | 1 | 8 | 4x4 | xs8_6996 | https://conwaylife.com/wiki/Pond |
| Long boat | still life | 1 | 7 | 4x4 | xs7_25ac | https://conwaylife.com/wiki/Long_boat |
| Barge | still life | 1 | 6 | 4x4 | xs6_25a4 | https://conwaylife.com/wiki/Barge |
| Toad | oscillator | 2 | 6 (page gives 6; other phase not stated, LifeWiki describes it as two banana sparks) | 4x4 | xp2_7e | https://conwaylife.com/wiki/Toad |
| Beacon | oscillator | 2 | 6 and 8 (page states 6; the 8 is implied by "two diagonally touching blocks") | 4x4 | xp2_318c | https://conwaylife.com/wiki/Beacon |
| Clock | oscillator | 2 | 6 (page does not split by phase) | 4x4 | xp2_2a54 | https://conwaylife.com/wiki/Clock |
| Glider | spaceship | 4 (c/4 diagonal) | 5 | 3x3 | xq4_153 | https://conwaylife.com/wiki/Glider |
| LWSS | spaceship | 4 (c/2 orthogonal) | 9 | 5x4 | xq4_6frc | https://conwaylife.com/wiki/Lightweight_spaceship |
| MWSS | spaceship | 4 (c/2) | 11 | 6x4 | xq4_27dee6 | https://conwaylife.com/wiki/Middleweight_spaceship |
| HWSS | spaceship | 4 (c/2) | 13 | 7x4 | xq4_27deee6 | https://conwaylife.com/wiki/Heavyweight_spaceship |
| Pulsar | oscillator | 3 | 48 / 56 / 72 (phase populations from name "CP 48-56-72") | 15x15 | xp3_co9nas0san9oczgoldlo0oldlogz1047210127401 | https://conwaylife.com/wiki/Pulsar |
| Pentadecathlon | oscillator | 15 | 12 (smallest phase; others not listed) | 16x9 | xp15_4r4z4r4 | https://conwaylife.com/wiki/Pentadecathlon |
| Figure eight | oscillator | 8 | 12 (smallest phase; others not listed) | 10x10 | xp8_gk2gb3z11 | https://conwaylife.com/wiki/Figure_eight |
| Great on-off | oscillator | 2 | 18 | 8x8 | xp2_g8gid1e8z1226 | https://conwaylife.com/wiki/Great_on-off |
| Mold | oscillator | 4 | 12 (smallest phase) | 6x6 | xp4_37bkic | https://conwaylife.com/wiki/Mold |
| Tumbler | oscillator | 14 | 16 (smallest phase) | 9x7 | xp14_j9d0d9j | https://conwaylife.com/wiki/Tumbler |
| Loafer | spaceship (c/7) | 7 | 20 | 9x9 | xq7_3nw17862z6952 | https://conwaylife.com/wiki/Loafer |
| Gosper glider gun | gun (linear growth) | 30 | 36 | 36x9 | yl30_1_5_74055a5f5e513fd2e62fb8d6117d3f03 | https://conwaylife.com/wiki/Gosper_glider_gun |

Note: the pentadecathlon's 16x9 bounding box is the whole 16-cell width of our seed, but the seed only has to *evolve into* it, so that is not a hard constraint.

## 3. Proposed 5-rung ladder (budget about 1,000 to 5,000 evaluations)

Back-of-envelope used throughout: a *pure random* baseline over N evaluations finds a target with expected hits ~ N x (per-soup rate). That is a first-order guide to how hard each rung is for the Random racer; guided searchers should beat it by an unknown factor (not measured here).

| Rung | Target | Per soup | Random-search expected hits in 1,000 / 5,000 evals | Why this rung |
|---|---|---|---|---|
| 1 (easy) | **Glider** (xq4_153) | 1.92 expected per soup (1 in 11.4 objects; rank 4) | essentially every soup; about 1,900 / 9,600 | Moving target, visually obvious, 5 cells. Every method should hit it in the first handful of evaluations, which validates the harness and the any-step detector. Use **Beehive or Block** instead if a still-life sanity rung is wanted (6.7 and 3.6 per soup). |
| 2 | **Pulsar** (xp3, 48-72 cells, 15x15) | 1.5e-3 | ~1.5 / ~7.7 | Rare enough that Random is slow but nonzero within budget; large, symmetric, high-recognition. Gives the first visible gap between racers. The alternative with the same band is LWSS (2.8e-3; ~2.8 / ~14). |
| 3 | **HWSS** (xq4_27deee6, 13 cells) | 1.3e-4 | ~0.13 / ~0.64 | Random will usually miss within 1,000 and hit about half the time at 5,000. Still a Catagolue top-35 object, so reachable. A moving, non-trivial specific spaceship (MWSS, 7.4e-4, is the half-step if rung 3 proves too hard). |
| 4 | **Pentadecathlon** (xp15, 16x9) | 1.7e-5 | ~0.017 / ~0.08 | Random effectively never hits. Only informed search is expected to succeed; period 15 and a 16x9 footprint make it a distinctive "hard but real" target. Rank 52. |
| 5 (very rare) | **Figure eight** (xp8, 10x10) | 5.9e-7 | ~0.0006 / ~0.003 | At Catagolue-scale it is a one-in-2-million-soups event; essentially out of reach for Random; success for GA/SA/HC would be a genuine result. It is the most common p8 oscillator, so it is real in C1, unlike rung-6 candidates. Fallback if nothing solves it: Great on-off (1.25e-6) or Mold (3.4e-7) are the same order of magnitude; Tumbler (6.7e-9) is a stretch goal. |

Flags:
- **Gosper glider gun: never in C1** (zero occurrences); first semi-natural occurrence was a variant in a symmetric soup (2022). Do not use it as a target.
- **Loafer** (2 in C1, 5.9e-15 per soup) and **Coe ship / Schick engine** (1e-13 to 1e-14) are far beyond any 5,000-evaluation budget under a random-soup-like prior.
- Oscillators and spaceships other than the above are not flagged as symmetric-only by the sources I read.
- These per-soup figures describe *random density-0.5 soups*, so a rung's real difficulty for an optimiser depends on fitness design. Guided search can exploit partial matches (e.g. 3 of 4 phases) that random sampling cannot.

## 4. Caveats comparing Catagolue numbers with our setup

1. **Plane vs torus.** Catagolue soups sit on an infinite plane; debris and escaping gliders fly away. On a 64x64 torus gliders and spaceships wrap and can collide with the original soup or each other, creating or destroying objects that Catagolue would never see. Spaceship rungs (1, 3) are the most affected.
2. **Object counted after stabilisation vs at any step.** Catagolue's apgsearch censuses objects in the final stabilised debris (separating them into still lifes, oscillators, spaceships and so on). Our "appears at any step up to 1000" counts transient objects too. This should make our target hit rate **higher** than the Catagolue rate for all targets, most strongly for short-lived intermediates. It also needs a defined detector: what counts as "appears" (exact cell match of any phase, in any translation or orientation?). A glider has 8 orientations/phases, an oscillator has multiple phases, and Catagolue's apgcode is canonical under symmetry; our match must be as well or the effective frequency changes.
3. **Isolation.** Catagolue classifies each connected component as a distinct object; a pulsar touching a blinker still counts as the pulsar only if the census separates them (apgsearch also reports compound objects such as "pulsar-on-pentadecathlon" separately). A naive exact-match detector on a 64x64 grid would miss targets with neighbours unless it matches a window.
4. **Soup size and density.** C1 soups are 16x16 at density 0.5 (matches our seed size, good). Fitness-guided search is *not* sampling that distribution: after a few generations the seeds drift to other densities and structures, so Catagolue frequencies are a prior for difficulty, not a prediction of success.
5. **Per-object vs per-soup.** For rungs with expected count above about 0.1 per soup (block, glider, boat, tub, etc.), "per soup" is an expectation, not a probability: a soup can contain several. Do not read 6.7 per soup for blocks as a probability.
6. **Counts change daily.** The census grows continuously; the ratios of top objects are stable (LifeWiki says the top-100 ranks haven't changed since 2017) but absolute counts above are a 2026-10-13 snapshot.
7. **Symmetric-soup contamination.** C1 is asymmetric only; objects frequent in symmetric censuses (some guns, some spaceships) are not indicative of C1. Always quote C1 for our setup.
8. **Evaluation count is not independent samples.** 1,000-5,000 evaluations of a searcher are correlated; the Random racer is the only one whose hit rate equals N x per-soup rate to first order.

## 5. Source list

- https://conwaylife.com/wiki/Most_common_objects_on_Catagolue (direct fetch returned 403; read via mirror https://conwaylife.njohnston.ca/wiki/Most_common_objects_on_Catagolue)
- https://catagolue.hatsya.com/census/b3s23/C1 (totals, class list)
- https://catagolue.hatsya.com/census/b3s23/C1/xp2 , /xp3 , /xp4 , /xp5 , /xp6 , /xp8 , /xp14 , /xp15 , /xp16 , /xq4 , /xq7 , /xq12 , /xq16 (counts)
- LifeWiki object pages via mirror https://conwaylife.njohnston.ca/wiki/{Glider, Lightweight_spaceship, Middleweight_spaceship, Heavyweight_spaceship, Pulsar, Pentadecathlon, Tumbler, Mold, Figure_eight, Great_on-off, Gosper_glider_gun, Loafer, Block, Blinker, Beehive, Loaf, Boat, Ship, Tub, Pond, Toad, Beacon, Clock, Barge, Long_boat}
- Not fetched: https://catagolue.hatsya.com/textcensus/b3s23/C1 (exceeded 10 MB size limit); the xp16 Rob's p16 count was blank on the page.
