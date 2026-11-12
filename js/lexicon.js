/* Elementary, Dear Doodle — lexicon.
 * The entire game's content. Every entry is matched by atom-vector tiling.
 * Atom keys are lowercase element symbols; quantities are integers.
 * This file is UMD so the Node reachability validator (tools/validate.cjs)
 * can load it without a browser.
 *
 * ENTRY ORDER IS THE TIE-BREAK: when two solutions score identically on
 * (atoms, novelty, input tiles, tile count, weight), the engine prefers
 * tiles from entries listed EARLIER here. Keep "big useful everyday
 * compounds" ahead of "confetti alternatives". */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.LEXICON = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  var STARTERS = [
    { id: 'h',  kind: 'starter', name: 'Hydrogen', symbol: 'H',  vector: { h: 1 },  color: '#7dd3fc', emoji: '⚛️', flavor: 'The lightest thing that exists.', hint: '' },
    { id: 'c',  kind: 'starter', name: 'Carbon',   symbol: 'C',  vector: { c: 1 },  color: '#94a3b8', emoji: '⬛', flavor: 'Life’s backbone, coal’s cousin.', hint: '' },
    { id: 'n',  kind: 'starter', name: 'Nitrogen', symbol: 'N',  vector: { n: 1 },  color: '#a5b4fc', emoji: '🌬️', flavor: 'Five breaths out of every ten.', hint: '' },
    { id: 'o',  kind: 'starter', name: 'Oxygen',   symbol: 'O',  vector: { o: 1 },  color: '#fca5a5', emoji: '🫁', flavor: 'The reason fire and lungs work.', hint: '' },
    { id: 'na', kind: 'starter', name: 'Sodium',   symbol: 'Na', vector: { na: 1 }, color: '#fcd34d', emoji: '🧂', flavor: 'Soft, silvery, hates water.', hint: '' },
    { id: 'cl', kind: 'starter', name: 'Chlorine', symbol: 'Cl', vector: { cl: 1 }, color: '#bef264', emoji: '🏞️', flavor: 'The pool water’s sharp smell.', hint: '' },
    { id: 'ca', kind: 'starter', name: 'Calcium',  symbol: 'Ca', vector: { ca: 1 }, color: '#fdba74', emoji: '🦴', flavor: 'Bones, cliffs, and chalk.', hint: '' },
    { id: 'fe', kind: 'starter', name: 'Iron',     symbol: 'Fe', vector: { fe: 1 }, color: '#d4d4d8', emoji: '🔩', flavor: 'Blood, bridges, and blades.', hint: '' },
    { id: 'si', kind: 'starter', name: 'Silicon',  symbol: 'Si', vector: { si: 1 }, color: '#c4b5fd', emoji: '🏖️', flavor: 'Sand, chips, and glass.', hint: '' }
  ];

  /* kind: molecule | everyday | special
   * base vectors are MINIMAL; any integer multiple tiles. */
  var ENTRIES = [
    { id: 'h2',  kind: 'molecule', name: 'Hydrogen gas', symbol: 'H₂',  vector: { h: 2 }, color: '#38bdf8', emoji: '💨', tier: 1, flavor: 'The fuel of stars and dirigibles.', hint: 'Two hydrogen atoms decide to hold hands.' },
    { id: 'o2',  kind: 'molecule', name: 'Oxygen gas',   symbol: 'O₂',  vector: { o: 2 }, color: '#f87171', emoji: '🔥', tier: 1, flavor: 'Two atoms, minimum for fire.', hint: 'Oxygen refuses to go alone. It pairs up.' },
    { id: 'n2',  kind: 'molecule', name: 'Nitrogen gas', symbol: 'N₂',  vector: { n: 2 }, color: '#818cf8', emoji: '🪁', tier: 1, flavor: '78% of the air, politely inert.', hint: 'Nitrogen twins, bonded for life.' },
    { id: 'cl2', kind: 'molecule', name: 'Chlorine gas', symbol: 'Cl₂', vector: { cl: 2 }, color: '#a3e635', emoji: '☢️', tier: 1, flavor: 'Yellow-green, vicious, useful.', hint: 'Chlorine atoms pair up too. Unfortunately.' },

    { id: 'water',     kind: 'everyday', name: 'Water', symbol: 'H₂O', vector: { h: 2, o: 1 }, color: '#60a5fa', emoji: '💧', tier: 2, flavor: 'The universal solvent; you are a bag of this.', hint: 'Two parts hydrogen, one part oxygen.' },
    { id: 'h2o2',      kind: 'everyday', name: 'Hydrogen peroxide', symbol: 'H₂O₂', vector: { h: 2, o: 2 }, color: '#93c5fd', emoji: '🩹', tier: 2, flavor: 'Stings the scrape, bleaches the hair.', hint: 'Water that bites back.' },
    { id: 'co2',       kind: 'everyday', name: 'Carbon dioxide', symbol: 'CO₂', vector: { c: 1, o: 2 }, color: '#a8a29e', emoji: '🥤', tier: 2, flavor: 'Your breath, bottled.', hint: 'A carbon atom asks two oxygens for a ride. Also the fizz in everything.' },
    { id: 'co',        kind: 'everyday', name: 'Carbon monoxide', symbol: 'CO', vector: { c: 1, o: 1 }, color: '#78716c', emoji: '🛑', tier: 2, flavor: 'Silent, invisible, unforgiving.', hint: 'CO₂’s two-timing cousin with one oxygen short.' },
    { id: 'salt',      kind: 'everyday', name: 'Table salt', symbol: 'NaCl', vector: { na: 1, cl: 1 }, color: '#fde68a', emoji: '🧂', tier: 2, flavor: 'Makes food edible. That is its whole job.', hint: 'Two elements walk into a kitchen.' },
    { id: 'isopropanol', kind: 'everyday', name: 'Rubbing alcohol', symbol: 'C₃H₈O', vector: { c: 3, h: 8, o: 1 }, color: '#fda4af', emoji: '🧼', tier: 2, flavor: 'Disinfects, cools, evaporates fast.', hint: 'Acetone drinks hydrogen and sobers up.' },
    { id: 'acetone',   kind: 'everyday', name: 'Acetone', symbol: 'C₃H₆O', vector: { c: 3, h: 6, o: 1 }, color: '#e879f9', emoji: '💅', tier: 2, flavor: 'That nail-polish-remover smell.', hint: 'Propane meets oxygen and sheds water.' },
    { id: 'sugar',     kind: 'everyday', name: 'Sugar (glucose)', symbol: 'C₆H₁₂O₆', baseNote: 'base unit CH₂O, ×6', vector: { c: 1, h: 2, o: 1 }, full: { c: 6, h: 12, o: 6 }, color: '#fbcfe8', emoji: '🍬', tier: 2, flavor: 'A plant’s savings account.', hint: 'Air and water, held together by a leaf. Patience and sunlight optional.' },
    { id: 'ethanol',   kind: 'everyday', name: 'Ethanol', symbol: 'C₂H₆O', vector: { c: 2, h: 6, o: 1 }, color: '#f0abfc', emoji: '🍷', tier: 2, flavor: 'Wine’s whole personality.', hint: 'Let sugar sit alone and nature does the rest.' },
    { id: 'vinegar',   kind: 'everyday', name: 'Vinegar (acetic acid)', symbol: 'C₂H₄O₂', vector: { c: 2, h: 4, o: 2 }, color: '#fcd34d', emoji: '🥒', tier: 2, flavor: 'Wine that stayed out too long in the air.', hint: 'Ethanol exposed to oxygen turns sharp. Ask any cook.' },
    { id: 'methane',   kind: 'everyday', name: 'Methane', symbol: 'CH₄', vector: { c: 1, h: 4 }, color: '#5eead4', emoji: '🔥', tier: 2, flavor: 'Your stove’s favorite molecule.', hint: 'One carbon’s quest for four hydrogens.' },
    { id: 'propane',   kind: 'everyday', name: 'Propane', symbol: 'C₃H₈', vector: { c: 3, h: 8 }, color: '#fb923c', emoji: '🍖', tier: 2, flavor: 'The barbecue’s jet fuel.', hint: 'A longer chain: three carbons, eight hydrogens.' },
    { id: 'ammonia',   kind: 'everyday', name: 'Ammonia', symbol: 'NH₃', vector: { n: 1, h: 3 }, color: '#bef264', emoji: '🧽', tier: 2, flavor: 'Window cleaner, fertilizer, poor choices.', hint: 'Nitrogen courts three hydrogens.' },
    { id: 'urea',      kind: 'everyday', name: 'Urea', symbol: 'CO(NH₂)₂', vector: { c: 1, n: 2, o: 1, h: 4 }, color: '#86efac', emoji: '🌾', tier: 2, flavor: 'Fertilizer. Also other things, biologically speaking.', hint: 'Two ammonias and a carbon dioxide become tomorrow’s crops.' },
    { id: 'sodawater', kind: 'everyday', name: 'Soda water (carbonic acid)', symbol: 'H₂CO₃', vector: { h: 2, c: 1, o: 3 }, color: '#7dd3fc', emoji: '🫧', tier: 2, flavor: 'The fizz itself, bottled by nobody.', hint: 'Water and carbon dioxide reach an uncomfortable truce.' },
    { id: 'nh4hco3',   kind: 'everyday', name: 'Ammonium bicarbonate (hartshorn)', symbol: 'NH₄HCO₃', vector: { n: 1, h: 5, c: 1, o: 3 }, color: '#d9f99d', emoji: '👃', tier: 2, flavor: 'Grandma’s leavener; a.k.a. smelling salts.', hint: 'Ammonia and soda water make a very weird salt.' },
    { id: 'nh4cl',     kind: 'everyday', name: 'Sal ammoniac', symbol: 'NH₄Cl', vector: { n: 1, h: 4, cl: 1 }, color: '#a7f3d0', emoji: '⚗️', tier: 2, flavor: 'Medieval flux for smelting copper.', hint: 'The price you pay when the Solvay process gives something up.' },
    { id: 'cacl2',     kind: 'everyday', name: 'Calcium chloride', symbol: 'CaCl₂', vector: { ca: 1, cl: 2 }, color: '#fde68a', emoji: '🧊', tier: 2, flavor: 'Road salt and self-melting ice packs.', hint: 'Sal ammoniac and slaked lime trade souvenirs.' },
    { id: 'bakingsoda', kind: 'everyday', name: 'Baking soda', symbol: 'NaHCO₃', vector: { na: 1, h: 1, c: 1, o: 3 }, color: '#fef08a', emoji: '🧁', tier: 2, flavor: 'Volcanoes and rising cakes.', hint: 'Ammonia salt meets table salt. The Solvay process’s true love.' },
    { id: 'sodaash',   kind: 'everyday', name: 'Soda ash (washing soda)', symbol: 'Na₂CO₃', vector: { na: 2, c: 1, o: 3 }, color: '#e7e5e4', emoji: '🧺', tier: 2, flavor: 'Laundry’s hardcore elder statesman.', hint: 'Two caustic sodas meet one carbon dioxide.' },
    { id: 'naoh',      kind: 'everyday', name: 'Caustic soda', symbol: 'NaOH', vector: { na: 1, o: 1, h: 1 }, color: '#fecaca', emoji: '🕳️', tier: 2, flavor: 'Drain-cleaner bravery. Respect it.', hint: 'Shock salt brine with current and it splits three ways.' },
    { id: 'bleach',    kind: 'everyday', name: 'Bleach (sodium hypochlorite)', symbol: 'NaOCl', vector: { na: 1, cl: 1, o: 1 }, color: '#f5f5f4', emoji: '👕', tier: 2, flavor: 'Laundry’s great white hope.', hint: 'Caustic soda meets chlorine. NEVER mix with vinegar.' },
    { id: 'cao',       kind: 'everyday', name: 'Quicklime', symbol: 'CaO', vector: { ca: 1, o: 1 }, color: '#fed7aa', emoji: '🔥', tier: 2, flavor: 'Burns ferociously, slakes like wrath.', hint: 'Calcium demands oxygen directly.' },
    { id: 'caoh2',     kind: 'everyday', name: 'Slaked lime', symbol: 'Ca(OH)₂', vector: { ca: 1, o: 2, h: 2 }, color: '#fff7ed', emoji: '🖌️', tier: 2, flavor: 'Whitewash, plaster, aquarium pH.', hint: 'Quicklime and water make a violent, useful paste.' },
    { id: 'limestone', kind: 'everyday', name: 'Limestone / chalk', symbol: 'CaCO₃', vector: { ca: 1, c: 1, o: 3 }, color: '#e7e5e4', emoji: '🪨', tier: 2, flavor: 'Seashells, cliffs, the White Cliffs.', hint: 'Bubble carbon dioxide through limewater and watch it cloud.' },
    { id: 'rust',      kind: 'everyday', name: 'Rust', symbol: 'Fe₂O₃', vector: { fe: 2, o: 3 }, color: '#c2410c', emoji: '🧲', tier: 2, flavor: 'Metal’s slow surrender.', hint: 'Iron meets oxygen and gives up. It was inevitable.' },
    { id: 'sand',      kind: 'everyday', name: 'Sand (silica)', symbol: 'SiO₂', vector: { si: 1, o: 2 }, color: '#fde68a', emoji: '🏖️', tier: 2, flavor: 'Every beach, ground into architecture.', hint: 'Silicon asks oxygen politely.' },
    { id: 'glass',     kind: 'everyday', name: 'Glass (sodium silicate)', symbol: 'Na₂SiO₃', vector: { na: 2, si: 1, o: 3 }, color: '#bfdbfe', emoji: '🪟', tier: 2, flavor: 'Windows, bottles, phone screens.', hint: 'Sand falls for caustic soda.' },
    { id: 'cement',    kind: 'everyday', name: 'Cement (calcium silicate)', symbol: 'CaSiO₃', vector: { ca: 1, si: 1, o: 3 }, color: '#d6d3d1', emoji: '🏢', tier: 2, flavor: 'The stuff cities stand on.', hint: 'Quicklime plus sand hardens into forever.' },
    { id: 'hotice',    kind: 'everyday', name: 'Hot ice (sodium acetate)', symbol: 'CH₃COONa', vector: { na: 1, c: 2, h: 3, o: 2 }, color: '#bae6fd', emoji: '🧊', tier: 2, flavor: 'Liquid in the bottle, crystal on your palm.', hint: 'The volcano press yields a crystal that freezes when you touch it.' },
    { id: 'diamond',   kind: 'special', name: 'Diamond', symbol: 'C', vector: { c: 4 }, color: '#e0f2fe', emoji: '💎', tier: 3, flavor: 'Carbon with delusions of grandeur.', hint: 'Carbon four times over. No pressure needed. Game logic.' }
  ];

  /* Specials — the ONLY expressly non-tiling rules in the game.
   * Photosynthesis: six CO₂ + six H₂O in one press = one glucose + 6 O₂.
   * (The lightest mass action a Crucible cannot hand-wave, so we hand-wave it anyway.) */
  var SPECIALS = [
    {
      id: 'photosynthesis',
      name: 'Photosynthesis',
      apply: function (picks, working) {
        var co2q = 0, waterq = 0;
        picks.forEach(function (p) {
          if (p.id === 'co2') co2q += p.qty;
          if (p.id === 'water') waterq += p.qty;
        });
        var groups = Math.min(Math.floor(co2q / 6), Math.floor(waterq / 6));
        if (groups < 1) return null;
        var remaining = {};
        for (var k in working) remaining[k] = working[k];
        remaining.c = (remaining.c || 0) - 6 * groups;
        remaining.h = (remaining.h || 0) - 12 * groups;
        remaining.o = (remaining.o || 0) - 6 * groups;
        var tiles = [];
        for (var i = 0; i < groups; i++) tiles.push('sugar');
        return { tiles: tiles, remaining: remaining };
      }
    },
    {
      /* Fermentation: sugar alone in the Crucible = ethanol + CO₂.
       * (Biochemistry does the heavy lifting; the Crucible claims the credit.) */
      id: 'fermentation',
      name: 'Fermentation',
      apply: function (picks, working, inv, inputIds) {
        if (!picks.length || picks.length !== 1) return null;
        var p = picks[0];
        if (p.id !== 'sugar' || inputIds.indexOf('sugar') === -1) return null;
        // picks may carry [{id,qty}] twice on same id — never happens via our UI, but be safe
        var qty = 0;
        picks.forEach(function (x) {
          if (x.id === 'sugar') qty += x.qty;
        });
        if (qty < 1) return null;
        var remaining = {};
        for (var k in working) remaining[k] = working[k];
        remaining.c = (remaining.c || 0) - 6 * qty;
        remaining.h = (remaining.h || 0) - 12 * qty;
        remaining.o = (remaining.o || 0) - 6 * qty;
        var tiles = [];
        for (var i = 0; i < qty; i++) { tiles.push('ethanol', 'ethanol', 'co2', 'co2'); }
        return { tiles: tiles, remaining: remaining };
      }
    }
  ];

  var BADGES = [
    { id: 'kitchen',       name: 'Kitchen Chemist', emoji: '🍳', desc: 'Discover sugar, ethanol, vinegar and baking soda', test: { all: ['sugar', 'ethanol', 'vinegar', 'bakingsoda'] } },
    { id: 'janitor',       name: 'Janitor',         emoji: '🧹', desc: 'Discover baking soda, soda ash and bleach',       test: { all: ['bakingsoda', 'sodaash', 'bleach'] } },
    { id: 'alchemist',     name: 'Classical Alchemist', emoji: '⚗️', desc: 'Discover diamond, glass and rust',             test: { all: ['diamond', 'glass', 'rust'] } },
    { id: 'deity',         name: 'Deity',           emoji: '☀️', desc: 'Photosynthesize sugar (6× CO₂ + 6× H₂O in one press)', test: { all: ['sugar'] } },
    { id: 'dontmix',       name: 'DO NOT MIX',      emoji: '☠️', desc: 'Discover bleach and vinegar. Chemistry teachers weep.', test: { all: ['bleach', 'vinegar'] } },
    { id: 'barelybalanced', name: 'Barely Balanced', emoji: '⚖️', desc: 'Three or more discoveries from one press',        test: { pressDistinct: 3 } },
    { id: 'speedrunner',   name: 'Speedrunner',     emoji: '⚡', desc: 'Complete the collection without a single Oracle hint', test: { allNoHints: true } }
  ];

  return { STARTERS: STARTERS, ENTRIES: ENTRIES, BADGES: BADGES, SPECIALS: SPECIALS };
});
