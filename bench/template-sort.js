'use strict';

const random = require('bcrypto/lib/random');
const BlockTemplate = require('../lib/mining/template');
const util = require('../lib/utils/util');
const bench = require('./bench');

class MockTX {
  constructor() {
    this._hash = random.randomBytes(32);
    this._hhash = null;
  }

  hash() {
    return this._hash;
  }

  txid() {
    let h = this._hhash;

    if (!h) {
      h = util.revHex(this._hash);
      this._hhash = h;
    }

    return h;
  }

  getPriority() {
    return 0;
  }

  getSigopsCount() {
    return 0;
  }

  getFee() {
    return 0;
  }

  getRate() {
    return 0;
  }

  getSize() {
    return 32;
  }
}

const N = 100000;
const template = new BlockTemplate();
const transactions = [];

for (let i = 0; i < N; i++)
  transactions.push(new MockTX());

{
  const end = bench('create-push-entries');
  for (let i = 0; i < N; i++)
    template.pushTX(transactions[i]);

  end(N);
}

{
  const end = bench('sort-transactions');

  template.sort();

  end(N);
}
