/*!
 * layout.js - blockchain data layout for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const bdb = require('bdb');

/*
 * Database Layout:
 *   V -> db version
 *   O -> chain options
 *   R -> tip hash
 *   D -> versionbits deployments
 *   e[hash] -> entry
 *   h[hash] -> height
 *   H[height] -> hash
 *   n[hash] -> next hash
 *   p[hash] -> tip index
 *   b[hash] -> block
 *   c[hash] -> coins
 *   u[hash] -> undo coins
 *   v[bit][hash] -> versionbits state
 */

const layout = {
  V: bdb.key('V'),
  O: bdb.key('O'),
  R: bdb.key('R'),
  D: bdb.key('D'),
  e: bdb.key('e', ['hhash256']),
  h: bdb.key('h', ['hhash256']),
  H: bdb.key('H', ['uint32']),
  n: bdb.key('n', ['hhash256']),
  p: bdb.key('p', ['hhash256']),
  b: bdb.key('b', ['hhash256']),
  c: bdb.key('c', ['hhash256', 'uint32']),
  u: bdb.key('u', ['hhash256']),
  v: bdb.key('v', ['uint8', 'hhash256'])
};

/*
 * Expose
 */

module.exports = layout;
