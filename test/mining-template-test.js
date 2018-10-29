/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('./util/assert');
const random = require('bcrypto/lib/random');
const BlockTemplate = require('../lib/mining/template');
const CoinView = require('../lib/coins/coinview');
const MTX = require('../lib/primitives/mtx');
const Address = require('../lib/primitives/address');

describe('Block Template', function () {
  it('should sort transactions', () => {
    const attempt = new BlockTemplate({});

    for (let i = 0; i < 20; i++) {
      const tx = getRandomTX();
      attempt.addTX(tx, new CoinView());
    }

    // sort items in block template
    attempt.sort();

    // setup coinbase
    attempt.refresh();

    // dirty block
    const block = attempt.toBlock();

    for (let i = 2; i < block.txs.length; i++) {
      const prevTX = block.txs[i - 1];
      const curTX = block.txs[i];

      assert(prevTX.txid() < curTX.txid(),
        `TX: ${prevTX.txid()} and ${curTX.txid()} are not in order.`
      );
    }
  });
});

function getRandomTX() {
  const mtx = new MTX();

  // random input
  mtx.addInput({
    prevout: {
      hash: random.randomBytes(32),
      index: 0
    }
  });

  mtx.addOutput({
    address: Address.fromHash(random.randomBytes(20)),
    value: 0
  });

  return mtx.toTX();
}
