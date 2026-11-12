/* Exact verification of one known winning press per lexicon entry,
 * using the real engine resolver. If the game can produce these outcomes,
 * the intended discovery path works in-app. Run: node tools/plays.cjs */
const lex = require('../js/lexicon.js');
const engine = require('../js/engine.js');

const ALL = lex.ENTRIES.slice();
const byId = {};
lex.STARTERS.concat(ALL).forEach(c => { byId[c.id] = c; });
const resolver = engine.makeResolver(ALL, lex.SPECIALS);

/* press = [ [cardId, qty], ...(0..2) ], expect = ids that must appear in the best solution */
const PLAYS = [
  ['h2',  [['h', 2]],                          ['h2']],
  ['o2',  [['o', 2]],                          ['o2']],
  ['n2',  [['n', 2]],                          ['n2']],
  ['cl2', [['cl', 2]],                         ['cl2']],
  ['water', [['h2', 2], ['o2', 1]],            ['water']],
  ['h2o2',[['h2', 1], ['o2', 1]],              ['h2o2']],
  ['co2', [['c', 1], ['o2', 2]],               ['co2']],
  ['co',  [['c', 2], ['o2', 1]],               ['co']],
  ['salt',[['na', 1], ['cl2', 1]],             ['salt']],
  ['sugar',[['co2', 6], ['water', 6]],         ['sugar']],
  ['ethanol',[['sugar', 1]],                   ['ethanol']],
  ['vinegar',[['ethanol', 1], ['o2', 1]],      ['vinegar']],
  ['methane',[['c', 1], ['h2', 2]],            ['methane']],
  ['propane',[['c', 3], ['h2', 4]],            ['propane']],
  ['acetone',[['propane', 1], ['o2', 1]],          ['acetone']],
  ['isopropanol',[['acetone', 1], ['h2', 1]],      ['isopropanol']],
  ['ammonia',[['n2', 1], ['h2', 3]],           ['ammonia']],
  ['urea',[['ammonia', 2], ['co2', 1]],        ['urea']],
  ['sodawater',[['water', 1], ['co2', 1]],     ['sodawater']],
  ['nh4hco3',[['sodawater', 1], ['ammonia', 1]],['nh4hco3']],
  ['nh4cl',[['nh4hco3', 1], ['salt', 1]],      ['nh4cl']],
  ['cacl2',[['nh4cl', 2], ['caoh2', 1]],       ['cacl2']],
  ['bakingsoda',[['nh4hco3', 1], ['salt', 1]], ['bakingsoda']],
  ['sodaash',[['naoh', 2], ['co2', 1]],        ['sodaash']],
  ['naoh',[['salt', 2], ['water', 2]],         ['naoh']],
  ['bleach',[['naoh', 2], ['cl2', 1]],         ['bleach', 'salt']],
  ['cao', [['ca', 1], ['o2', 1]],              ['cao']],
  ['caoh2',[['cao', 1], ['water', 1]],         ['caoh2']],
  ['limestone',[['caoh2', 1], ['co2', 1]],     ['limestone']],
  ['rust',[['fe', 4], ['o2', 3]],              ['rust']],
  ['sand',[['si', 1], ['o2', 2]],              ['sand']],
  ['glass',[['naoh', 2], ['sand', 1]],         ['glass']],
  ['cement',[['cao', 1], ['sand', 1]],         ['cement']],
  ['hotice',[['bakingsoda', 1], ['vinegar', 1]],['hotice']],
  ['diamond',[['c', 4]],                       ['diamond']],
];

let failures = 0;
for (const [entry, rawPress, expect] of PLAYS) {
  const picks = rawPress.map(([id, qty]) => ({ card: byId[id], qty }));
  const inv = engine.sumPicks(picks);
  const res = resolver.resolve(inv, {
    inputIds: rawPress.map(([id]) => id),
    picks: rawPress.map(([id, qty]) => ({ id, qty }))
  });
  const got = new Set(res.distinct);
  const ok = expect.every(id => got.has(id));
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${entry.padEnd(12)} press[${rawPress.map(([i, q]) => q + '×' + i).join(' + ')}] -> ${[...got].join(', ')}`);
  if (!ok) failures++;
}

console.log(failures ? `\n${failures} failing play(s)` : '\nALL PLAYS PASS');
process.exit(failures ? 1 : 0);
