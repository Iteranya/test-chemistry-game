# Elementary, Dear Doodle

*Everyday alchemy: the Doodle God loop, aimed at the chemistry of your kitchen.*

One magical **Crucible**. Two ingredient slots. Any quantity per slot (1–9). Press **REACT** and the Crucible does the most chemistry it can with what you gave it — real atoms, real balances, occasionally a miracle in a tracksuit (photosynthesis). Discover all **35 everyday compounds**, from water to baking soda to diamonds.

No build step. No framework. No dependencies. Open `index.html` in a browser, or serve the folder statically:

```bash
# any static server works; e.g.
npx serve .
```

## How to play

1. You start with **9 atomic cards**: H, C, N, O, Na, Cl, Ca, Fe, Si.
2. Click cards to load the two Crucible slots. Use the steppers to dial quantities (needed for anything with subscripts — water is `2× H₂ + 1× O₂`).
3. Press **🔥 REACT**. New compounds pop out as discoveries; leftover atoms vent as junk.
4. Some press **mechanisms are special**: `6× CO₂ + 6× H₂O → glucose` (photosynthesis), and *isolated* sugar ferments (`sugar alone → 2× ethanol + 2× CO₂`). These are the only rules that ignore atom tiling, and they're documented in `js/lexicon.js`.
5. Stuck? The **🔮 Oracle** will whisper a cryptic hint for 10⚡ (energy refills slowly; discoveries grant +10).

## Content & engine layout

| File | Role |
|---|---|
| `js/lexicon.js` | ALL game content (UMD): starters, 35 entries, specials, badges. **Entry order breaks exact score ties.** |
| `js/engine.js` | Atom accounting + backtracking partition solver. Pure, UMD, shared with the validators. |
| `js/app.js` | UI, state, localStorage save, badges, Oracle, toasts, WebAudio blips. |
| `tools/validate.cjs` | Greedy reachability BFS: fails if any entry is unreachable from the starters. |
| `tools/plays.cjs` | Exact verification of one winning press per entry via the real engine. |
| `tools/build-single.cjs` | Inlines everything into `elementary-dear-doodle-single.html` — the whole game as one file. |

```bash
node tools/validate.cjs   # reachability sweep (~2s)
node tools/plays.cjs      # exact winning plays (~1s)
```

## Save system

Progress lives in `localStorage` (`everyday-alchemy-save-v1`). Export/Import as JSON from the top bar. **New Game** wipes it. Nothing leaves your machine; there's no telemetry because there's no backend.

## Status / scope

MVP as per `design.md`: 9 starters, 4 diatomic molecules, 35 discoveries, badges, journal, win banner. Deliberately NOT in scope: multiplayer, accounts, 118 elements, translations, process cards (the Crucible is the only mechanic).
