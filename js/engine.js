/* Elementary, Dear Doodle — engine.
 * Inventory = atom multiset. A press picks up to two card types with
 * quantities 1..9, sums their vectors, then tiles the remainder with
 * lexicon entries (any integer multiple of a minimal vector matches).
 * Pure functions, UMD-wrapped so the reachability validator can require() it.
 *
 * Partial matches are legal: leftover atoms vent as junk. There is no
 * requirement to fully consume the inventory — that keeps presses forgiving. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.AlchemyEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  var KEYS = ['h', 'c', 'n', 'o', 'na', 'cl', 'ca', 'fe', 'si'];

  function emptyInv() {
    var v = {}; KEYS.forEach(function (k) { v[k] = 0; }); return v;
  }
  function addInto(inv, vec, qty) {
    for (var k in vec) inv[k] = (inv[k] || 0) + vec[k] * (qty || 1);
    return inv;
  }
  function cloneVec(v) { var o = {}; for (var k in v) o[k] = v[k]; return o; }
  function isZero(v) { for (var k in v) if (v[k] !== 0) return false; return true; }
  function fits(entryVec, inv) {
    for (var k in entryVec) if ((inv[k] || 0) < entryVec[k]) return false;
    return true;
  }
  function subtract(inv, entryVec) {
    var o = cloneVec(inv);
    for (var k in entryVec) o[k] -= entryVec[k];
    return o;
  }
  function invKey(v) {
    var parts = [];
    KEYS.forEach(function (k) { if (v[k]) parts.push(k + ':' + v[k]); });
    return parts.length ? parts.join(',') : '0';
  }
  function atomCount(v) { var s = 0; for (var k in v) s += v[k]; return s; }

  var MAX_PARTIALS = 48;   // partial solutions kept per state — caps blowup
  var MAX_DEPTH = 24;

  var KIND_WEIGHT = { molecule: 2, everyday: 3, special: 3, starter: 0 };

  function scoreSolution(tiles, byId, inputSet) {
    var distinct = {}, total = tiles.length, atoms = 0, weight = 0, novel = false, inputTiles = 0;
    tiles.forEach(function (id) {
      if (inputSet.indexOf(id) === -1) novel = true;
      else inputTiles++;
    });
    tiles.forEach(function (id) {
      distinct[id] = 1;
      var e = byId[id];
      if (e) {
        for (var k in e.vector) atoms += e.vector[k];
        weight += KIND_WEIGHT[e.kind] || 0;
        if (inputSet.indexOf(id) !== -1) weight -= 1000; // re-tiling the input back into itself is never the answer
      }
    });
    return { atoms: atoms, weight: weight, distinct: Object.keys(distinct).length, total: total, novel: novel, inputTiles: inputTiles };
  }
  /* Scoring context — set per resolve() call (single-threaded, fine). */
  var scoreCtx = { byId: {}, input: [] };

  /* atoms consumed desc -> solution containing a NON-input tile desc
   * -> FEWER tiles asc (compounds over confetti)
   * -> weight desc -> distinct breadth desc */
  function betterThan(a, b) {
    var sa = scoreSolution(a, scoreCtx.byId, scoreCtx.input), sb = scoreSolution(b, scoreCtx.byId, scoreCtx.input);
    if (sa.atoms !== sb.atoms) return sa.atoms - sb.atoms;
    if (sa.novel !== sb.novel) return (sa.novel ? 1 : 0) - (sb.novel ? 1 : 0);
    if (sa.inputTiles !== sb.inputTiles) return sb.inputTiles - sa.inputTiles;
    if (sa.total !== sb.total) return sb.total - sa.total;
    if (sa.weight !== sb.weight) return sa.weight - sb.weight;
    return sa.distinct - sb.distinct;
  }
  /* Keep only the best partial solutions — atoms & weight are monotone
   * nondecreasing, so pruning by them never hides a better final tiling. */
  function keepBest(sols) {
    if (sols.length <= MAX_PARTIALS) return sols;
    sols.sort(betterThan);
    return sols.slice(sols.length - MAX_PARTIALS);
  }

  function makeResolver(lexEntries, specials) {
    specials = specials || [];
    var MEMO_MAX = 20000;
    var pool = lexEntries.slice();
    var byId = {};
    pool.forEach(function (e) { byId[e.id] = e; });
    var memo = {};
    var memoSize = 0;

    function search(inv, depth) {
    var key = invKey(inv);
    if (depth >= MAX_DEPTH) return [[]];
    if (memo[key]) return memo[key];
    if (memoSize > MEMO_MAX) { memo = {}; memoSize = 0; }
    memoSize++;

    var sols = [[]]; // the "stop here" (vent) option
    for (var i = 0; i < pool.length; i++) {
      var e = pool[i];
      if (!fits(e.vector, inv)) continue;
      var sub = search(subtract(inv, e.vector), depth + 1);
      for (var j = 0; j < sub.length; j++) {
        sols.push([e.id].concat(sub[j]));
      }
      sols = keepBest(sols);
    }
    memo[key] = sols;
    return sols;
  }

  function resetMemo() { /* memo is shared across resolves — states are global */ }

    /* Resolve a press. inv: atom multiset. opts.inputIds: ids placed in the slots,
     * used to penalize tiling an input back into itself. opts.picks: [{id, qty}],
     * lets specials match on the raw pick combination (e.g. photosynthesis). */
    function resolve(inv, opts) {
      opts = opts || {};
      var inputIds = opts.inputIds || [];
      scoreCtx.byId = byId;
      scoreCtx.input = inputIds;

      // Specials run first and may consume part of the inventory.
      var specialTiles = [];
      var working = cloneVec(inv);
      for (var s = 0; s < specials.length; s++) {
        var res = specials[s].apply ? specials[s].apply(opts.picks || [], working, inv, inputIds) : null;
        if (res && res.tiles && res.tiles.length) {
          specialTiles = specialTiles.concat(res.tiles);
          working = res.remaining;
        }
      }
      var sols = search(working, 0);
      if (!sols.length) sols = [[]];
      if (specialTiles.length) {
        sols = sols.map(function (sol) { return specialTiles.concat(sol); });
      }
      // consume the most atoms, win ties by weight/tiles/breadth
      var best = sols[0];
      for (var i = 1; i < sols.length; i++) {
        if (betterThan(sols[i], best) > 0) best = sols[i];
      }
      // leftover after the best tiling
      var remaining = cloneVec(inv);
      best.forEach(function (id) { remaining = subtract(remaining, byId[id].vector); });

      var counts = {};
      best.forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });

      return {
        tiles: best.slice(),          // entry ids with repetitions
        counts: counts,               // { entryId: nTiles }
        distinct: Object.keys(counts),
        vented: remaining,            // atoms vented as junk
        vendAtoms: atomCount(remaining),
        allSolutions: sols            // capped — validator unions over these
      };
    }

    return { resolve: resolve };
  }

  function sumPicks(picks) {
    var inv = emptyInv();
    picks.forEach(function (p) { if (p && p.card) addInto(inv, p.card.full || p.card.vector, p.qty || 1); });
    return inv;
  }

  return {
    KEYS: KEYS,
    emptyInv: emptyInv,
    sumPicks: sumPicks,
    atomCount: atomCount,
    invKey: invKey,
    fits: fits,
    makeResolver: makeResolver
  };
});
