/* Elementary, Dear Doodle — UI & game state. */
'use strict';

var STARTERS = LEXICON.STARTERS, ENTRIES = LEXICON.ENTRIES, BADGES = LEXICON.BADGES, SPECIALS = LEXICON.SPECIALS;
var resolver = AlchemyEngine.makeResolver(ENTRIES, SPECIALS);
var byId = {};
STARTERS.concat(ENTRIES).forEach(function (c) { byId[c.id] = c; });

var SAVE_KEY = 'everyday-alchemy-save-v1';
var starterIds = STARTERS.map(function (c) { return c.id; });

/* ── State ─────────────────────────────────────────────── */
var defaultState = function () {
  return {
    discovered: starterIds.slice(),
    badges: [],
    energy: 100,
    hints: 0,
    presses: 0,
    fizzles: 0,
    journal: [],
    startTs: Date.now(),
    winSeen: false,
    slots: [null, null],
    slotQty: [1, 1],
    activeSlot: 0
  };
};
var state = load() || defaultState();
var discovered = new Set(state.discovered);

function load() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    var s = JSON.parse(raw);
    if (!Array.isArray(s.discovered)) return null;
    var merged = defaultState();
    Object.keys(merged).forEach(function (k) { if (s[k] !== undefined) merged[k] = s[k]; });
    return merged;
  } catch (e) { return null; }
}
function save() {
  state.discovered = Array.from(discovered);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* quota? whatever */ }
}
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
function entryById(id) { return byId[id] || null; }

/* ── Audio (tiny WebAudio blips, no assets) ────────────── */
var audioCtx = null;
function tone(freq, dur, type, gain, delay) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime + (delay || 0));
    g.gain.exponentialRampToValueAtTime(gain || 0.08, audioCtx.currentTime + (delay || 0) + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (delay || 0) + (dur || 0.3));
    o.connect(g); g.connect(audioCtx.destination);
    o.start(audioCtx.currentTime + (delay || 0)); o.stop(audioCtx.currentTime + (delay || 0) + (dur || 0.3) + 0.05);
  } catch (e) { /* audio unavailable — fine */ }
}
function sfxDiscovery() { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.09, i * 0.09); }); }
function sfxBadge() { [880, 1175, 1568].forEach(function (f, i) { tone(f, 0.25, 'square', 0.06, i * 0.1); }); }
function sfxFizzle() { tone(110, 0.35, 'sawtooth', 0.07, 0); }
function sfxClick() { tone(660, 0.05, 'square', 0.03, 0); }

/* ── HUD & render ──────────────────────────────────────── */
function renderHUD() {
  $('#energyFill').style.width = clamp(state.energy, 0, 100) + '%';
  $('#energyText').textContent = Math.floor(state.energy);
  $('#benchCount').textContent = discovered.size;
  $('#collectionProgress').textContent = ENTRIES.filter(function (e) { return discovered.has(e.id); }).length + '/' + ENTRIES.length;
}

function gradientFor(card) {
  return '--card-c1:' + card.color + ';--card-c2:' + shade(card.color, -0.45) + ';';
}
function shade(hex, amt) {
  var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  var f = function (n) { n = parseInt(n, 16) + Math.round(255 * amt); return clamp(n, 0, 255).toString(16).padStart(2, '0'); };
  return '#' + f(m[1]) + f(m[2]) + f(m[3]);
}

function renderBench() {
  var grid = $('#benchGrid'); grid.innerHTML = '';
  var known = STARTERS.concat(ENTRIES.filter(function (e) { return discovered.has(e.id); }));
  known.forEach(function (card) {
    var btn = document.createElement('button');
    btn.className = 'card' + (card.kind === 'starter' ? ' starter-card' : '');
    btn.style.cssText = gradientFor(card);
    btn.setAttribute('data-id', card.id);
    btn.innerHTML = '<span class="card-symbol">' + escapeHtml(card.symbol) + '</span>' +
      '<span class="card-name">' + escapeHtml(card.name) + '</span>' +
      (card.kind === 'starter' ? '<span class="card-infinity">∞</span>' : '');
    btn.addEventListener('click', function () { sfxClick(); placeInActiveSlot(card.id); });
    grid.appendChild(btn);
  });
}

function renderSlots() {
  [0, 1].forEach(function (i) {
    var slot = i === 0 ? $('#slotA') : $('#slotB');
    var qtyEl = i === 0 ? $('#qtyA') : $('#qtyB');
    var id = state.slots[i];
    qtyEl.textContent = state.slotQty[i];
    if (id) {
      var card = entryById(id);
      slot.classList.add('filled');
      slot.style.cssText = gradientFor(card);
      slot.innerHTML = '<span class="slot-card"><span class="card-emoji">' + escapeHtml(card.emoji) + '</span>' +
        '<span class="card-symbol">' + escapeHtml(card.symbol) + '</span>' +
        '<span class="card-name">' + escapeHtml(card.name) + '</span></span>';
    } else {
      slot.classList.remove('filled'); slot.style.cssText = '';
      slot.innerHTML = '<span class="slot-placeholder">Slot ' + (i + 1) + '<br><small>' + (i === 0 ? 'click a bench card' : 'optional') + '</small></span>';
    }
  });
}

function renderCollection() {
  var grid = $('#collectionGrid'); grid.innerHTML = '';
  ENTRIES.forEach(function (card) {
    var isOpen = discovered.has(card.id);
    var div = document.createElement('div');
    if (isOpen) {
      div.className = 'collect-card unlocked';
      div.style.cssText = gradientFor(card);
      div.innerHTML = '<span class="card-symbol">' + escapeHtml(card.symbol) + '</span><span class="card-name">' + escapeHtml(card.name) + '</span>';
      div.addEventListener('click', function () { openCardModal(card); });
    } else {
      div.className = 'collect-card locked';
      div.innerHTML = '<span class="card-symbol">?</span><span class="card-name">undiscovered</span>';
    }
    grid.appendChild(div);
  });
}

function renderJournal() {
  var list = $('#journalList'); list.innerHTML = '';
  if (!state.journal.length) {
    list.innerHTML = '<p class="vent-idle">Nothing yet. The Crucible awaits its first miracle.</p>';
    return;
  }
  state.journal.slice().reverse().forEach(function (entry) {
    var btn = document.createElement('button');
    btn.className = 'journal-entry';
    btn.innerHTML = '<b>' + escapeHtml(entry.title) + '</b><small>' + escapeHtml(entry.when) + '</small>';
    btn.addEventListener('click', function () { openJournalModal(entry); });
    list.appendChild(btn);
  });
}

function renderBadges() {
  var list = $('#badgeList'); list.innerHTML = '';
  BADGES.forEach(function (badge) {
    var earned = state.badges.indexOf(badge.id) !== -1;
    var div = document.createElement('div');
    div.className = 'badge' + (earned ? ' earned' : '');
    div.innerHTML = '<span class="badge-emoji">' + badge.emoji + '</span>' +
      '<span><span class="badge-name">' + escapeHtml(badge.name) + '</span><br>' +
      '<span class="badge-desc">' + escapeHtml(badge.desc) + '</span></span>';
    list.appendChild(div);
  });
}

function renderAll() { renderHUD(); renderBench(); renderSlots(); renderCollection(); renderJournal(); renderBadges(); }

/* ── Slots & reacting ──────────────────────────────────── */
function placeInActiveSlot(id) {
  var i = state.activeSlot;
  state.slots[i] = id;
  state.activeSlot = (i === 0 && !state.slots[1]) ? 1 : (i === 1 && !state.slots[0]) ? 0 : i;
  save(); renderSlots();
}
function clearSlot(i) { state.slots[i] = null; sfxClick(); save(); renderSlots(); }

$('#slotA').addEventListener('click', function () { clearSlot(0); });
$('#slotB').addEventListener('click', function () { clearSlot(1); });
$('#swapBtn').addEventListener('click', function () {
  sfxClick();
  var s = state.slots, q = state.slotQty;
  state.slots = [s[1], s[0]]; state.slotQty = [q[1], q[0]];
  save(); renderSlots();
});
$$('.qty-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var wrap = btn.closest('.qty-ctrl');
    var i = Number(wrap.getAttribute('data-slot'));
    var delta = Number(btn.getAttribute('data-delta'));
    state.slotQty[i] = clamp(state.slotQty[i] + delta, 1, 9);
    sfxClick(); save(); renderSlots();
  });
});

function formatVecSymbol(vec) {
  var parts = [];
  Object.keys(vec).forEach(function (k) {
    if (vec[k] > 0) parts.push(vec[k] + capEl(k));
  });
  return parts.join(' ');
}
function capEl(k) {
  var map = { h: 'H', c: 'C', n: 'N', o: 'O', na: 'Na', cl: 'Cl', ca: 'Ca', fe: 'Fe', si: 'Si' };
  return map[k] || k.toUpperCase();
}

function toast(text, kind) {
  var el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind + '-toast' : '');
  el.textContent = text;
  $('#toasts').appendChild(el);
  setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
}

function isSpecialPress(picks, tiles) {
  var ids = picks.map(function (p) { return p.id; });
  if (ids.length === 1 && ids[0] === 'sugar' && tiles.indexOf('ethanol') !== -1) return 'fermentation';
  var co2 = 0, water = 0;
  picks.forEach(function (p) { if (p.id === 'co2') co2 += p.qty; if (p.id === 'water') water += p.qty; });
  if (co2 >= 6 && water >= 6 && tiles.indexOf('sugar') !== -1) return 'photosynthesis';
  return null;
}

function react() {
  var picks = [];
  for (var i = 0; i < 2; i++) {
    var id = state.slots[i];
    if (!id) continue;
    picks.push({ id: id, qty: state.slotQty[i], card: entryById(id) });
  }
  if (!picks.length) { toast('The Crucible glares at the empty slots.', 'fizzle'); return; }
  state.presses++;
  var inv = AlchemyEngine.sumPicks(picks);
  var inputIds = picks.map(function (p) { return p.id; });
  var rawPicks = picks.map(function (p) { return { id: p.id, qty: p.qty }; });
  var res = resolver.resolve(inv, { inputIds: inputIds, picks: rawPicks });

  var vent = $('#ventArea'); vent.innerHTML = '';

  if (!res.tiles.length) {
    state.energy = clamp(state.energy - 5, 0, 100);
    state.fizzles++;
    sfxFizzle();
    vent.innerHTML = '<div class="vent-line">💨 <span>The Crucible *fzzzt* — nothing takes.</span></div>' +
      '<div class="vent-junk">A sad little puff of junk. (−5⚡)</div>';
    toast('It fizzles…', 'fizzle');
    save(); renderHUD(); return;
  }

  var newIds = res.tiles.filter(function (id) { return !discovered.has(id); });
  var uniqueNew = Array.from(new Set(newIds));
  var special = isSpecialPress(rawPicks, res.tiles);

  uniqueNew.forEach(function (id) { discovered.add(id); state.discovered = Array.from(discovered); });
  state.energy = clamp(state.energy + (uniqueNew.length ? 10 : 2), 0, 100);

  // result line
  var tileCounts = {};
  res.tiles.forEach(function (id) { tileCounts[id] = (tileCounts[id] || 0) + 1; });
  var line = document.createElement('div');
  line.className = 'vent-line';
  line.innerHTML = '<span>⚗️</span> <span class="vent-arrow">→</span> ';
  Object.keys(tileCounts).forEach(function (id) {
    var card = entryById(id);
    var chip = document.createElement('span');
    chip.className = 'vent-chip' + (uniqueNew.indexOf(id) !== -1 ? ' new' : '') + (special ? ' special' : '');
    chip.textContent = (tileCounts[id] > 1 ? tileCounts[id] + '× ' : '') + card.name;
    line.appendChild(chip);
  });
  vent.appendChild(line);

  var ventedAtoms = AlchemyEngine.atomCount(res.vented);
  var ventNote = document.createElement('div');
  if (ventedAtoms > 0) {
    ventNote.className = 'vent-junk';
    ventNote.textContent = 'Vented: ' + formatVecSymbol(res.vented) + ' (atoms shrugged off)';
  } else {
    ventNote.className = 'vent-complete';
    ventNote.textContent = 'Complete reaction. The Crucible purrs like a cat.';
  }
  vent.appendChild(ventNote);

  if (special) {
    var spNote = document.createElement('div');
    spNote.className = 'vent-complete';
    spNote.textContent = special === 'photosynthesis' ? '✨ Photosynthesis!! Somewhere, a leaf applauds.' : '✨ Fermentation!! Yeast does the heavy lifting.';
    vent.appendChild(spNote);
  }

  if (uniqueNew.length) {
    sfxDiscovery();
    uniqueNew.forEach(function (id) { toast('New discovery: ' + entryById(id).name + '!', 'badge'); });
    state.journal.push({
      ts: Date.now(),
      title: uniqueNew.map(function (id) { return entryById(id).name; }).join(' + '),
      when: new Date().toLocaleString(),
      picks: rawPicks,
      tiles: res.tiles.slice(),
      special: special
    });
    if (state.journal.length > 300) state.journal = state.journal.slice(-300);
  } else {
    toast('…everything you made, you already knew.');
  }

  checkBadges(uniqueNew.length);
  save();
  renderAll();
  checkWin();
}
$('#reactBtn').addEventListener('click', react);

/* ── Badges & win ──────────────────────────────────────── */
function badgeTest(badge) {
  var t = badge.test || {};
  if (t.all) return t.all.every(function (id) { return discovered.has(id); });
  if (t.allNoHints) return state.hints === 0 && ENTRIES.every(function (e) { return discovered.has(e.id); });
  return false;
}
function checkBadges(newDiscoveriesThisPress) {
  var newlyEarned = [];
  BADGES.forEach(function (badge) {
    if (state.badges.indexOf(badge.id) !== -1) return;
    var earned = false;
    if (badge.test && badge.test.pressDistinct) earned = newDiscoveriesThisPress >= badge.test.pressDistinct;
    else earned = badgeTest(badge);
    if (earned) { state.badges.push(badge.id); newlyEarned.push(badge); }
  });
  newlyEarned.forEach(function (badge, i) {
    setTimeout(function () { toast('🏅 Badge earned: ' + badge.name, 'badge'); sfxBadge(); }, 400 + i * 350);
  });
}
function checkWin() {
  var remaining = ENTRIES.filter(function (e) { return !discovered.has(e.id); });
  if (remaining.length === 0 && !state.winSeen) {
    state.winSeen = true;
    if (state.hints === 0 && state.badges.indexOf('speedrunner') === -1) state.badges.push('speedrunner');
    save();
    $('#winBanner').hidden = false;
    renderBadges();
  }
}

/* ── Oracle ─────────────────────────────────────────────── */
$('#oracleBtn').addEventListener('click', function () {
  var remaining = ENTRIES.filter(function (e) { return !discovered.has(e.id); });
  if (!remaining.length) { toast('The Oracle knows everything you know. It is bored.'); return; }
  if (state.energy < 10) { toast('Not enough energy for the Oracle (need 10⚡).', 'fizzle'); return; }
  state.energy -= 10; state.hints++;
  var pick = remaining[Math.floor(Math.random() * remaining.length)];
  sfxClick();
  openModal('<div class="modal-emoji">🔮</div><h3 id="modalTitle">The Oracle whispers…</h3>' +
    '<p class="modal-flavor">“' + escapeHtml(pick.hint) + '”</p>' +
    '<p class="modal-real">— something involving ' + escapeHtml(guessTheme(pick)) + ' stirs in the Crucible, undiscovered.</p>');
  save(); renderHUD();
});
function guessTheme(card) {
  if (card.tier === 1) return 'simple molecules';
  if (card.tier === 3) return 'carbon and stubbornness';
  return 'everyday chemistry';
}

/* ── Modals ─────────────────────────────────────────────── */
function openModal(html) {
  $('#modalBody').innerHTML = html;
  $('#modal').hidden = false;
}
function closeModal() { $('#modal').hidden = true; }
$('#modalClose').addEventListener('click', closeModal);
$('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeModal(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

function openCardModal(card) {
  var atomLines = Object.keys(card.vector).map(function (k) {
    return (card.vector[k] > 1 ? card.vector[k] + '× ' : '') + capEl(k);
  }).join(' + ');
  openModal('<div class="modal-emoji">' + escapeHtml(card.emoji) + '</div>' +
    '<div class="modal-big-symbol">' + escapeHtml(card.symbol) + '</div>' +
    '<h3 id="modalTitle">' + escapeHtml(card.name) + '</h3>' +
    '<div class="modal-equation">' + escapeHtml(atomLines) + '</div>' +
    '<p class="modal-flavor">' + escapeHtml(card.flavor) + '</p>' +
    '<p class="modal-real">Kind: ' + escapeHtml(card.kind) + ' · Tier ' + card.tier + '</p>');
}
function openJournalModal(entry) {
  var picksHtml = entry.picks.map(function (p) {
    var card = entryById(p.id);
    return (p.qty > 1 ? p.qty + '× ' : '') + '<b>' + escapeHtml(card.name) + '</b>';
  }).join(' + ');
  var tileCounts = {};
  entry.tiles.forEach(function (id) { tileCounts[id] = (tileCounts[id] || 0) + 1; });
  var out = Object.keys(tileCounts).map(function (id) {
    return (tileCounts[id] > 1 ? tileCounts[id] + '× ' : '') + '<b>' + escapeHtml(entryById(id).name) + '</b>';
  }).join(' + ');
  openModal('<h3 id="modalTitle">📖 ' + escapeHtml(entry.title) + '</h3>' +
    '<p class="modal-real">' + escapeHtml(entry.when) + '</p>' +
    '<div class="modal-equation">' + picksHtml + ' &nbsp;→&nbsp; ' + out + '</div>' +
    (entry.special ? '<p class="modal-flavor">✨ A special reaction: ' + escapeHtml(entry.special) + '</p>' : '') +
    '<p class="modal-flavor">The Crucible remembers.</p>');
}

/* ── Stats ──────────────────────────────────────────────── */
$('#statsBtn').addEventListener('click', function () {
  var found = ENTRIES.filter(function (e) { return discovered.has(e.id); }).length;
  var mins = Math.floor((Date.now() - state.startTs) / 60000);
  openModal('<h3 id="modalTitle">📊 Your Alchemy, By the Numbers</h3>' +
    '<div class="modal-equation">Discoveries: ' + found + '/' + ENTRIES.length + ' (' + Math.round(found / ENTRIES.length * 100) + '%)<br>' +
    'Presses: ' + state.presses + ' · Fizzles: ' + state.fizzles + '<br>' +
    'Oracle hints used: ' + state.hints + ' · Badges: ' + state.badges.length + '/' + BADGES.length + '<br>' +
    'Time in the lab: ' + mins + ' min</div>' +
    '<p class="modal-flavor">Scientists would call this “messing around with reagents”. You call it progress.</p>');
});
$('#winStatsBtn').addEventListener('click', function () { $('#winBanner').hidden = true; $('#statsBtn').click(); });
$('#winCloseBtn').addEventListener('click', function () { $('#winBanner').hidden = true; });

/* ── Export / Import / Reset ────────────────────────────── */
$('#exportBtn').addEventListener('click', function () {
  state.discovered = Array.from(discovered);
  var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'everyday-alchemy-save.json';
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  toast('Save exported. Guard it with your life.');
});
$('#importFile').addEventListener('change', function (e) {
  var file = e.target.files && e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var s = JSON.parse(reader.result);
      if (!Array.isArray(s.discovered)) throw new Error('not a save');
      s.discovered = s.discovered.filter(function (id) { return entryById(id); });
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      toast('Save loaded. The Crucible stirs…');
      setTimeout(function () { location.reload(); }, 600);
    } catch (err) {
      toast('That file is not a save of this game.', 'fizzle');
    }
  };
  reader.readAsText(file);
});
$('#resetBtn').addEventListener('click', function () {
  if (confirm('Burn your save and start over? Your discoveries will be smelted into slag.')) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
});

/* ── Tabs ───────────────────────────────────────────────── */
$$('.tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    $$('.tab').forEach(function (t) { t.classList.remove('active'); });
    $$('.tab-pane').forEach(function (p) { p.classList.remove('active'); });
    tab.classList.add('active');
    $('#tab-' + tab.getAttribute('data-tab')).classList.add('active');
  });
});

/* ── Energy regen ───────────────────────────────────────── */
setInterval(function () {
  if (state.energy < 100) { state.energy = clamp(state.energy + 1, 0, 100); save(); renderHUD(); }
}, 1000);

/* ── Boot ───────────────────────────────────────────────── */
renderAll();
$('#collectionProgress').textContent = ENTRIES.filter(function (e) { return discovered.has(e.id); }).length + '/' + ENTRIES.length;

/* Debug handle for automated smoke tests (harmless in production). */
window.AlchemyDebug = {
  react: react,
  state: function () { return { discovered: Array.from(discovered), energy: state.energy, presses: state.presses }; }
};
