/* Reachability sweep for the lexicon — worklist BFS from the starters.
 * Greedy tilings in two orders (largest-first, smallest-first), unioned.
 * Each newly discovered card only presses against cards already known,
 * so total work is linear in (entries x known x 9 x 9), not passes^2.
 * The authoritative per-path check is tools/plays.cjs. This file fails
 * the build if any entry can never be reached at all. */
const lex = require('../js/lexicon.js');
const engine = require('../js/engine.js');

const ALL = lex.ENTRIES.slice();
const byId = {};
lex.STARTERS.concat(ALL).forEach(c => { byId[c.id] = c; });
const starterIds = new Set(lex.STARTERS.map(c => c.id));
const discovered = new Set(starterIds);

const atomic = v => Object.values(v).reduce((s, n) => s + n, 0);
const desc = ALL.slice().sort((a, b) => atomic(b.vector) - atomic(a.vector));
const asc = ALL.slice().sort((a, b) => atomic(a.vector) - atomic(b.vector));

function greedyTile(inv, order) {
  const remaining = Object.assign({}, inv);
  const placed = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const e of order) {
      if (engine.fits(e.vector, remaining)) {
        for (const k in e.vector) remaining[k] -= e.vector[k];
        placed.push(e.id);
        progressed = true;
      }
    }
  }
  return placed;
}
function greedyBoth(inv) {
  const out = new Set(greedyTile(inv, desc));
  greedyTile(inv, asc).forEach(id => out.add(id));
  return out;
}

const MAX_QTY = 9;
function pressAndDiscover(card, qty, pair) {
  // returns list of entry ids discoverable by this press
  let found = new Set();
  const picks = pair
    ? [{ card: byId[card], qty }, { card: byId[pair.id], qty: pair.qty }]
    : [{ card: byId[card], qty }];
  for (const id of greedyBoth(engine.sumPicks(picks))) found.add(id);
  // mirror the engine's specials
  if (pair) {
    const qa = qty, qb = pair.qty;
    const a = card, b = pair.id;
    if (a === 'co2' && b === 'water' && qa >= 6 && qb >= 6) found.add('sugar');
    if (a === 'water' && b === 'co2' && qa >= 6 && qb >= 6) found.add('sugar');
  } else if (card === 'sugar' && qty >= 1) {
    found.add('ethanol');
  }
  return found;
}

const queue = [...starterIds];
const enqueued = new Set(queue);
const t0 = Date.now();

function addKnown(id) {
  if (discovered.has(id)) return false;
  discovered.add(id);
  if (!enqueued.has(id)) { queue.push(id); enqueued.add(id); }
  return true;
}

while (queue.length) {
  const id = queue.shift();
  const known = [...discovered];
  // single-slot press with this new card
  for (let q = 1; q <= MAX_QTY; q++) {
    pressAndDiscover(id, q, null).forEach(x => addKnown(x));
  }
  // pair with every known card, both qty orders covered by scanning both directions
  for (const other of known) {
    for (let qa = 1; qa <= MAX_QTY; qa++) {
      for (let qb = 1; qb <= MAX_QTY; qb++) {
        pressAndDiscover(id, qa, { id: other, qty: qb }).forEach(x => addKnown(x));
      }
    }
  }
}

const missing = ALL.filter(e => !discovered.has(e.id)).map(e => e.id);
console.log(`Discovered ${discovered.size - starterIds.size}/${ALL.length} entries in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('Missing entries:', missing.length ? missing.join(', ') : '(none)');
process.exit(missing.length ? 1 : 0);
