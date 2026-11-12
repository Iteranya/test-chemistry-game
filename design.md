# Elementary, Dear Doodle — Design Doc
Working title TBD (candidates in §9). Doodle God, but the "god" discovers the chemistry of **everyday life**.

## STATUS — MVP web build SHIPPED 2026-11-12 (`C:\Project\Hermes\everyday-alchemy`)
Vanilla JS single-page app, no build step. **35 discoveries, 100% reachability-validated.**
Verification: `node tools/validate.cjs` (greedy BFS sweep, ~2s, fails build on unreachable entries) and
`node tools/plays.cjs` (exact engine verification of one winning press per entry — all PASS).

Deviations from the original plan (all forced by engine math, all good):
- **Limestone** is reached from elemental **Ca + O₂ → quicklime → slaked lime → CaCO₃** (the old "limestone alone" route was a circular deadlock).
- **Sugar** cannot partition from CO₂ + H₂O (6× soda water tiles tighter); shipped as the **photosynthesis SPECIAL** (`6×CO₂ + 6×H₂O` one press → glucose + O₂), and **fermentation** as a second special (isolated sugar → 2× ethanol + 2× CO₂). Exactly two specials exist; everything else is atom tiling.
- **Acetone/isopropanol** chain reordered: propane + O₂ → acetone + water; acetone + H₂ → isopropanol (the old route lost score ties to ethanol+methane).
- **Graphite allotrope dropped** — allotrope vectors overlapped, breaking the "no overlapping minimal vectors" rule. Diamond stays.
- **Salt #29 brine duplicate dropped** — salt + water already tiles via search; no duplicate entries.
- **Scoring order in the engine:** atoms consumed desc → solution contains a non-input tile → fewest input tiles → fewest tiles → weight (everyday 3 > molecule 2 > starter 0; input tiles −1000) → **lexicon order** (entry order is the tie-break).
- **Flagged-but-accepted:** baking soda's Solvay route via ammonium bicarbonate is markedly harder than the kitchen-fudge route would be — deliberate, it's the "educational arc" of the game and the Oracle hints point at it.

## 1. Pitch
You start with nine atoms and no knowledge. Through a single magical chemistry instrument — The Crucible — you react materials in correct proportions and discover the compounds that make up the world around you: water, salt, sugar, rust, glass, bleach, vinegar. Fill your collection of ~40 everyday compounds. That's the game.

Design pillars:
1. **One mechanic, total.** No combination grids, no process cards (no "Ferment"/"Electrolyze"/"Bake" cards). Just the Crucible.
2. **Learn real chemistry by playing.** Every recipe is a real (or hand-waved-with-a-wink) reaction. The journal shows the actual balanced equation.
3. **Surprise discoveries.** Multiple valid outcomes per experiment; byproducts and bonus discoveries pop out unannounced, Doodle God-style.

## 2. Core mechanic: The Crucible
**UI:** two ingredient slots, each holding **any quantity (1–9)** of one discovered card type + a big REACT button. That is the entire control scheme.

**Resolution pipeline (every press):**
1. Build the atom inventory: sum `quantity × card.atomVector` for both slots.
2. Run the **partition solver** against the discovery lexicon (§6): greedily/backtracking tile the inventory with known compounds (minimal-vector matching; each lexicon entry has a base vector, any integer multiple matches).
3. Matched tiles → discoveries (new ones unlock + toast; repeats do nothing).
4. Leftover atoms vent as **byproduct cards** (they enter your inventory as free discoveries — see §5 multi-discovery).
5. No match at all → **fizzle**: nothing created, small Energy penalty.

**Rules:**
- Two *types* max per reaction. Any quantities. No third slot, ever.
- Single-ingredient presses are legal (slot 1 filled, slot 2 empty): pure substances decompose/transform/allotrope. This is how sugar ferments and how limestone calcinates.
- Partial matches are allowed; remainder vents (see §5).
- Everything is instant. No timers, no waiting.

**Why this instead of 400 hardcoded A+B→C recipes:** the lexicon *is* the game data. Adding a new discovery = one JSON entry. The engine (inventory sum + partition match) never changes. This scales to v2 content for free.

## 3. Progression tiers
**Tier 0 — Atoms (the starters, 9 cards):** H, C, N, O, Na, Cl, Ca, Fe, Si. Handed to the player at game start, journal included.

**Tier 1 — Molecules (discovered, not given):** H₂, O₂, N₂, Cl₂ via 2× same atom in the Crucible (`{H:2}` etc.). Metals and metalloids are monatomic — no molecule step. Tier 1 doubles as the tutorial: the player learns the quantity dials exist here.

**Tier 2 — Everyday compounds (the collection, ~40):** see §7. Chained discoveries: water → soda water → baking soda → hot ice; salt → caustic soda → glass/bleach; sugar → ethanol → vinegar; limestone → quicklime → slaked lime / cement.

**Tier 3 — Milestones & bonus (badge fodder):** Diamond (pure carbon allotrope, `≥4× C`), "Volcano" (Baking soda + Vinegar → Hot Ice + CO₂ + Water, three discoveries one press), Chlor-Alkali press (brine → caustic + chlorine + hydrogen), "Deity" badge (photosynthesis: 6× CO₂ + 6× H₂O → Sugar + 6× O₂), the infamous "**Do NOT Mix**" bathroom badge (bleach adjacent discoveries).

## 4. Why only two slots (and how chemistry survives that)
Stoichiometry in the real world is n-ary; the Crucible is binary over *card types*, unlimited in *count*. Any balanced reaction between two reactant species fits — e.g. `2H₂ + O₂ → 2H₂O` is "H₂ (2) + O₂ (1)". Reactions needing three *distinct* reactants are either (a) decomposed into chain steps (the intended puzzle path), or (b) routed through a byproduct of an earlier press. The one place this hurts — baking soda's true industrial path — is solved by chaining through the actual Solvay process (see §7), which is the honest route anyway.

**Decision (locked, 2026-11-12): Option A — two card *types* per press, forever.** n-species chemistry happens as chains of pairwise presses; the quantity dial covers all same-type stoichiometry. A third-slot "Grand Crucible" is a parked v2 escape hatch, only if playtesting shows players bouncing off obscure intermediates. Never unlimited slots in the core loop — it degenerates into brute-force discovery and kills the "wait, *why* did that work?" moment. The vacated third reactant in n-species reactions is handled as: (a) chained steps (the main path), or (b) byproduct of an earlier press, or (c) v2 content.

Known sharp edge: **isomers.** `C₂H₆O` is ethanol *and* dimethyl ether. Policy: MVP ships **no overlapping minimal vectors**. Alcohols win every food/drink pair. (v2 can add an isomer-family badge instead of engine-level disambiguation.)

## 5. Key systems
**Byproducts.** Leftover atoms after a successful match vent as cards. If the leftover is exactly a known vector, it's *discovered*, not trash. This single rule manufactures the best moments in the game:
- Brine press (2× NaCl + 2× H₂O): inventory `{Na₂,Cl₂,H₄,O₂}` partitions into **Caustic Soda + Chlorine + Hydrogen** — three discoveries from one press, and it's the real chlor-alkali process.
- Volcano press (NaHCO₃ + CH₃COOH): partitions into **Hot Ice (sodium acetate) + CO₂ + Water** — real chemistry, party trick.

**Partition solver policy:**
- A lexicon entry matches if the inventory contains an integer multiple of its base vector.
- Find the *maximal tiling* (all-or-nothing not required — partial matches allowed, remainder vents as junk; energy cost is what keeps this honest).
- Multi-compound outcomes (3+ new cards from one press) grant a "barely balanced" badge.

**Energy / fizzle.** Failed press: −5 Energy. Max 100. +1 per second passive, +10 per successful discovery. Never blocks progress, only spam.

**Oracle (hints).** Each lexicon entry ships with a one-line cryptic hint ("bones, chalk and seashells are the same thing"). Button shows a random undiscovered entry's hint. Costs 10 Energy. Zero hints used = speedrun bragging rights.

**Discovery journal.** Per discovery: name, formula, **auto-balanced equation regenerated from the winning vectors** (the solver knows exactly how much of each side was used), flavor text, "real chemistry" note, gif-worthy trivia. This is the educational payload and it should be genuinely good writing.

**Save/load.** `localStorage`: inventory, discoveries, badges, stats, settings. Export/import save as file (nice for backups, free).

**Stats screen.** Discoveries found/total, % complete, presses, fizzles, hints used, time played, badges.

**Badges (starters set):** Kitchen Chemist (food cluster), Janitor (cleaning cluster), Classical Alchemist (diamond/allotropes), Deity (photosynthesis), Barely Balanced (3+ multi-discovery), Do NOT Mix (bleach + acid pair), Speedrunner (100%, no hints).

## 6. Data model
`lexicon.json` (the whole game):
```json
{
  "id": "sugar",
  "name": "Sugar (Glucose)",
  "base": {"C": 1, "H": 2, "O": 1},
  "real": {"display": "C₆H₁₂O₆", "note": "6× base unit; Crucible doesn't round"},
  "tier": "everyday",
  "flavor": "The plant's savings account.",
  "hint": "Air and water, held together by a leaf.",
  "badge": "kitchen"
}
```
Atom starters are lexicon entries with `"starter": true`. Special recipes (allotropes) use `"match": {"singleType": "C", "minQuantity": 4}` instead of vector matching — a tiny second matcher, flagged as the *only* exception to one-mechanic purity.

**Validation build-step (non-negotiable):** a script that, starting from the 9 starters, does BFS over reachable states (any inventory → any subset partition that's fully consumed) and **fails the build if any lexicon entry is unreachable**. No orphan recipes, ever. This is the test suite.

## 7. Content: the everyday collection (~40 entries)
Vector in braces as multiset; chains listed. Verify every line here before coding.

**Molecules (Tier 1):** H₂ `{H:2}` · O₂ `{O:2}` · N₂ `{N:2}` · Cl₂ `{Cl:2}`

**Tier 2 — everyday compounds:**

| # | Discovery | Vector / route | Chain to reach |
|---|-----------|---------------|----------------|
| 1 | Water | `{H:2,O:1}` | 2×H₂ + 1×O₂ |
| 2 | Hydrogen peroxide | `{H:2,O:2}` | H₂ + O₂ |
| 3 | Carbon dioxide | `{C:1,O:2}` | C + 2×O₂ |
| 4 | Carbon monoxide | `{C:1,O:1}` | 2×C + O₂ |
| 5 | Salt | `{Na:1,Cl:1}` | Na + ½Cl₂ |
| 6 | Sugar (glucose) | base `{C:1,H:2,O:1}` ×6 · full card vector `{C:6,H:12,O:6}` | **Photosynthesis SPECIAL**: `6×CO₂ + 6×H₂O` → glucose + 6×O₂ (one press; Deity badge) |
| 7 | Ethanol | `{C:2,H:6,O:1}` | **Fermentation SPECIAL**: isolated sugar → 2× ethanol + 2× CO₂ |
| 8 | Vinegar (acetic acid) | `{C:2,H:4,O:2}` | Ethanol + O₂ → vinegar + **Water** (byproduct) |
| 9 | Methane | `{C:1,H:4}` | C + 2×H₂ |
| 9a | Propane | `{C:3,H:8}` | 3×C + 4×H₂ (the barbecue’s jet fuel) |
| 10 | Acetone | `{C:3,H:6,O:1}` | Propane + O₂ → acetone + **Water** (propane’s uncontrolled burn, gently catalyzed) |
| 10a | Isopropyl alcohol | `{C:3,H:8,O:1}` | Acetone + H₂ → isopropanol (reduction; nail-polish remover’s tamer cousin) |
| 11 | Ammonia | `{N:1,H:3}` | N₂ + 3×H₂ (Haber-Bosch) |
| 12 | Urea | `{C:1,N:2,O:1,H:4}` | Ammonia + CO₂ → urea + **Water** (fertilizer) |
| 13 | Soda water / carbonic acid | `{H:2,C:1,O:3}` | Water + CO₂ |
| 14 | Ammonium bicarbonate (hartshorn) | `{N:1,H:5,C:1,O:3}` | Soda water + Ammonia (NH₃ + H₂CO₃; the pre-baking-soda leavener, a.k.a. smelling salts) |
| 14a | Sal ammoniac (NH₄Cl) | `{N:1,H:4,Cl:1}` | Byproduct of #15 — **the real Solvay process, step 1** |
| 14b | Calcium chloride | `{Ca:1,Cl:2}` | Sal ammoniac + Slaked lime → NH₃ + CaCl₂ + H₂O (**Solvay ammonia-recovery loop, recreated in-game**) |
| 15 | Baking soda | `{Na:1,H:1,C:1,O:3}` | Ammonium bicarbonate + **Salt → baking soda + Sal ammoniac** (`NH₄HCO₃ + NaCl → NaHCO₃ + NH₄Cl`, exact Solvay step — precipitate just falls out) |
| 16 | Hot ice (sodium acetate) | `{Na:1,C:2,H:3,O:2}` | **Baking soda + Vinegar** (Volcano press) + CO₂ + Water |
| 17 | Caustic soda (NaOH) | `{Na:1,O:1,H:1}` | **2×Salt + 2×Water → caustic + Cl₂ + H₂** (chlor-alkali press) |
| 18 | Bleach (sodium hypochlorite) | `{Na:1,Cl:1,O:1}` | Caustic soda + Cl₂ → **Salt + Bleach + Water** (all three!) |
| 19 | Limestone / chalk | `{Ca:1,C:1,O:3}` | **Slaked lime + CO₂ → limestone + Water** (the limewater cloud test, in reverse) |
| 20 | Quicklime (CaO) | `{Ca:1,O:1}` | Calcium + O₂ (the metal burns); alternate partition: limestone **alone** → quicklime + CO₂ |
| 21 | Slaked lime (Ca(OH)₂) | `{Ca:1,O:2,H:2}` | Quicklime + Water |
| 22 | Rust | `{Fe:2,O:3}` | 4×Fe + 3×O₂ (partial match OK) |
| 23 | Sand / silica | `{Si:1,O:2}` | Si + 2×O₂ |
| 24 | Glass (sodium silicate/waterglass) | `{Na:2,Si:1,O:3}` | 2×Caustic soda + Sand → glass + **Water** |
| 25 | Cement (calcium silicate) | `{Ca:1,Si:1,O:3}` | Quicklime + Sand |
| 26 | Soda ash (Na₂CO₃, washing soda) | `{Na:2,C:1,O:3}` | 2×Caustic soda + CO₂ → soda ash + **Water** |
| 27 | Diamond | allotrope (vector match `{C:4}`) | ≥4×C in slot A, REACT — only shipped allotrope (graphite removed: overlapping vectors) |

Tier 3 / v2 aspiration (out of MVP): Soap (needs fat chain), Aspirin (C₉H₈O₄ — needs a benzene step; design as v2 multi-step quest), Caffeine (the final boss), Citric acid (lemons), Epsom salt (needs Mg + S starter expansion pack), matches (S, P expansion pack).

Final shipped lexicon: **35 discoveries + 9 starters = 44 cards** — every entry reachability-validated (`tools/validate.cjs`) with exact winning plays verified (`tools/plays.cjs`).

## 8. Build plan (MVP) — SHIPPED 2026-11-12
1. Single-file `index.html` + `app.js` + `lexicon.json` (vanilla JS, no framework, no build step).
2. Engine: inventory sum → minimal-vector partition matcher with backtracking → maximal tiling. ~150 lines.
3. UI: left = 9-tile starter grid (grouped by chemistry: metals/nonmetals... actually group by "daily life" categories: Kitchen, Bathroom, Garden, Workshop — cuts across chemistry, that's the charm); center = The Crucible (two slots + steppers + REACT + vent animation); right = collection journal grid (locked silhouettes).
4. Toast + sound on discovery; the "barely balanced" jingle for multi-discovery.
5. localStorage save; export/import buttons.
6. Reachability validator script (Node, run pre-commit).
7. Playtest pass: a friend (or you) tries to "break" it for an hour. Fix dead ends.

**Explicitly NOT in MVP:** multiplayer, accounts, 118 elements, monetization, mobile packaging, any process cards \o/

## 9. Naming candidates
**Everyday Alchemy** · **The Crucible** · **Mendeleev's Kitchen** · **Homebrew Chemistry** · **Elementary, Dear Doodle** · **Kitchen-Grade Alchemy**

(tr: pick one; doc refers to it as "the game" like a coward.)

## 10. Open decisions (need user)
~~0. Slot model~~ **DECIDED 2026-11-12: Option A** — two card types per press, chained reactions, quantities unlimited; 3rd-slot Grand Crucible parked as v2 escape hatch (see §4).
1. **Endgame shape.** (A) Collection completion — fill all ~30 everyday tiles, win screen with stats. Simple, done. (B) Genesis speedrun — after N discoveries unlock, chain Water + Sugar + … → **Life** ending. More soul, more work. **Recommendation: A for MVP, B as v2.**
2. **Name.** See §9.
3. **Quantity cap 1–9 OK?** (Glucose needs 6, fine.)
4. **Isomer policy OK?** (ship no overlapping vectors in MVP)
5. **Allotrope exception** (Diamond/Graphite single-type special matcher) OK?
6. **Art style** — flat icons? Hand-drawn doodle? Placeholder emoji for MVP?

## 11. Why this will be fun (and what kills it)
Fun: discovering that sugar alone ferments; the volcano press giving you three discoveries at once; "wait, vinegar + baking soda — obviously"; the journal's real balanced equations smuggling in actual chemistry education.
Kills it: any recipe the reachability validator can't prove; 30 cryptic hints nobody writes well; a partition matcher that's too clever and hands out three discoveries on every press. Balance test: target ~2 unintended multi-discoveries per full playthrough.
