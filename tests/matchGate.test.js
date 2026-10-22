/**
 * The red line, as an executable invariant (Docs/DESIGN.md §1).
 *
 * If this file ever fails, the app is capable of showing the player match
 * data while they are playing — exactly what the project promises it will
 * not do.
 *
 * This runs against the COMPILED main-process output in dist/, not the
 * TypeScript source, so it tests the artifact that actually ships.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

// --- stub electron ------------------------------------------------------
// matchGate pulls ipcMain from electron. Swap in a recorder so the gate can
// be exercised without launching Electron.
const registered = new Map();
const electronStub = {
  ipcMain: {
    handle(channel, fn) {
      registered.set(channel, fn);
    },
  },
};

const STUB_ID = path.resolve(__dirname, '__electron_stub__.js');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'electron') return STUB_ID;
  return originalResolve.call(this, request, ...rest);
};
require.cache[STUB_ID] = new Module(STUB_ID, null);
require.cache[STUB_ID].exports = electronStub;
require.cache[STUB_ID].loaded = true;

const gate = require('../dist/main/ipc/matchGate.js');

test.beforeEach(() => {
  registered.clear();
  gate.__resetForTests();
});

test('gate is open before a match starts', () => {
  assert.equal(gate.isMatchInProgress(), false);
});

test('match_in_progress closes the gate', () => {
  gate.setGameState('match_in_progress');
  assert.equal(gate.isMatchInProgress(), true);
});

test('every other game state leaves the gate open', () => {
  for (const s of [
    'loading_screen_start',
    'game_loaded',
    'role_select_screen_start',
    'role_select_screen_end',
    'match_ended',
    'not_running',
  ]) {
    gate.setGameState(s);
    assert.equal(gate.isMatchInProgress(), false, `gate closed on ${s}`);
  }
});

test('a match-data handler refuses to return data mid-match', async () => {
  gate.handleMatchData('test:matchData', () => ({ kills: 11, damage: 9321 }));
  const handler = registered.get('test:matchData');
  assert.ok(handler, 'handler was registered');

  gate.setGameState('match_in_progress');
  const during = await handler({});
  assert.equal(during.ok, false, 'returned match data while a match was running');
  assert.equal(during.error.code, 'matchInProgress');

  // ...and releases it once the match is over.
  gate.setGameState('match_ended');
  const after = await handler({});
  assert.equal(after.ok, true);
  assert.equal(after.data.kills, 11);
});

test('leaving a match counts it as recorded', () => {
  gate.setGameState('match_in_progress');
  gate.setGameState('match_ended');
  assert.equal(gate.getCaptureState().recordedThisSession, 1);
});

test('capture state carries no match data', () => {
  gate.setGameState('match_in_progress');
  const keys = Object.keys(gate.getCaptureState()).sort();
  assert.deepEqual(keys, [
    'gameRunning',
    'gameState',
    'matchInProgress',
    'recordedThisSession',
  ]);
});
