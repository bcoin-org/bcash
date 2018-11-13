/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('./util/assert');
const Chain = require('../lib/blockchain/chain');
const ChainEntry = require('../lib/blockchain/chainentry');
const Network = require('../lib/protocol/network');
const consensus = require('../lib/protocol/consensus');

const network = Network.get('main');

function random(max) {
  return Math.floor(Math.random() * max);
}

function getEntry(prev, time, bits) {
  const entry = new ChainEntry();
  entry.height = prev.height + 1;
  entry.time = prev.time + time;
  entry.bits = bits;
  entry.chainwork = entry.getProof().add(prev.chainwork);
  return entry;
}

const chain = new Chain({
  memory: true,
  network
});

describe('Difficulty', function() {
  it('should open chain', async () => {
    await chain.open();
  });

  it('should get next work', async () => {
    const prev = new ChainEntry();
    prev.time = 1262152739;
    prev.bits = 0x1d00ffff;
    prev.height = 32255;
    const first = new ChainEntry();
    first.time = 1261130161;
    assert.strictEqual(chain.retarget(prev, first), 0x1d00d86a);
  });

  it('should get next work pow limit', async () => {
    const prev = new ChainEntry();
    prev.time = 1233061996;
    prev.bits = 0x1d00ffff;
    prev.height = 2015;
    const first = new ChainEntry();
    first.time = 1231006505;
    assert.strictEqual(chain.retarget(prev, first), 0x1d00ffff);
  });

  it('should get next work lower limit actual', async () => {
    const prev = new ChainEntry();
    prev.time = 1279297671;
    prev.bits = 0x1c05a3f4;
    prev.height = 68543;
    const first = new ChainEntry();
    first.time = 1279008237;
    assert.strictEqual(chain.retarget(prev, first), 0x1c0168fd);
  });

  it('should get next work upper limit actual', async () => {
    const prev = new ChainEntry();
    prev.time = 1269211443;
    prev.bits = 0x1c387f6f;
    prev.height = 46367;
    const first = new ChainEntry();
    first.time = 1263163443;
    assert.strictEqual(chain.retarget(prev, first), 0x1d00e1fd);
  });

  it('should get block proof equivalent time', async () => {
    const blocks = [];
    for (let i = 0; i < 10000; i++) {
      const prev = new ChainEntry();
      prev.height = i;
      prev.time = 1269211443 + i * network.pow.targetSpacing;
      prev.bits = 0x207fffff;
      if (i > 0)
        prev.chainwork = prev.getProof().addn(blocks[i-1].chainwork.toNumber());
      blocks[i] = prev;
    }

    chain.tip = blocks[blocks.length - 1];
    for (let j = 0; j < 1000; j++) {
      const p1 = blocks[random(blocks.length)];
      const p2 = blocks[random(blocks.length)];

      const tdiff = chain.getProofTime(p1, p2);
      assert.ok(tdiff ===  p1.time - p2.time);
    }
  });

  it('should get retargeting', async () => {
    let target = network.pow.limit.ushrn(1);
    let bits = consensus.toCompact(target);

    const blocks = {};
    blocks[0] = new ChainEntry();
    blocks[0].height = 0;
    blocks[0].time = 1269211443;
    blocks[0].bits = bits;
    blocks[0].chainwork = blocks[0].getProof();

    chain.getAncestor = async(entry, height) => {
      return blocks[height];
    };

    chain.getPrevious = async(entry) => {
      return blocks[entry.height-1];
    };

    // Pile up some blocks.
    for (let i = 1; i < 100; i++) {
      blocks[i] = getEntry(blocks[i-1], network.pow.targetSpacing, bits);
    }

    // We start getting 2h blocks time. For the first 5 blocks, it doesn't
    // matter as the MTP is not affected. For the next 5 block, MTP difference
    // increases but stays below 12h.
    for (let i = 100; i < 110; i++) {
      blocks[i] = getEntry(blocks[i-1], 2 * 3600, bits);
      assert.strictEqual(bits,
        await chain.getTarget(blocks[0].time, blocks[i]));
    }

    // Now we expect the difficulty to decrease.
    blocks[110] = getEntry(blocks[109], 2 * 3600, bits);
    target.iadd(target.ushrn(2));
    bits = consensus.toCompact(target);
    assert.strictEqual(bits,
      await chain.getTarget(blocks[0].time, blocks[110]));

    // As we continue with 2h blocks, difficulty continue to decrease.
    blocks[111] = getEntry(blocks[110], 2 * 3600, bits);
    target = consensus.fromCompact(bits);
    target.iadd(target.ushrn(2));
    bits = consensus.toCompact(target);
    assert.strictEqual(bits,
      await chain.getTarget(blocks[0].time, blocks[111]));

    // We decrease again.
    blocks[112] = getEntry(blocks[111], 2 * 3600, bits);
    target = consensus.fromCompact(bits);
    target.iadd(target.ushrn(2));
    bits = consensus.toCompact(target);
    assert.strictEqual(bits,
      await chain.getTarget(blocks[0].time, blocks[112]));

    // We check that we do not go below the minimal difficulty.
    blocks[113] = getEntry(blocks[112], 2 * 3600, bits);
    assert.strictEqual(network.pow.bits,
      await chain.getTarget(blocks[0].time, blocks[113]));

    // Once we reached the minimal difficulty, we stick with it.
    blocks[114] = getEntry(blocks[113], 2 * 3600, bits);
    assert.strictEqual(network.pow.bits,
      await chain.getTarget(blocks[0].time, blocks[114]));
  });

  it('should test cash difficulty', async () => {
    const target = network.pow.limit.ushrn(4);
    let bits = consensus.toCompact(target);

    const blocks = {};

    blocks[0] = new ChainEntry();
    blocks[0].height = 0;
    blocks[0].time = 1269211443;
    blocks[0].bits = bits;
    blocks[0].chainwork = blocks[0].getProof();

    chain.getAncestor = async(entry, height) => {
      return blocks[height];
    };

    chain.getPrevious = async(entry) => {
      return blocks[entry.height-1];
    };

    // Block counter.
    let i;

    // Pile up some blocks every 10 mins to establish some history.
    for (i = 1; i < 2050; i++) {
      blocks[i] = getEntry(blocks[i-1], 600, bits);
    }

    bits = await chain.getTarget(blocks[0].time, blocks[2049]);

    // Difficulty stays the same as long as we produce a block every 10 mins.
    for (let j = 0; j < 10; i++, j++) {
      blocks[i] = getEntry(blocks[i-1], 600, bits);
      assert.strictEqual(bits,
        await chain.getTarget(blocks[0].time, blocks[i]));
    }

    // Make sure we skip over blocks that are out of wack. To do so, we produce
    // a block that is far in the future, and then produce a block with the
    // expected timestamp.
    blocks[i] = getEntry(blocks[i-1], 6000, bits);
    assert.strictEqual(bits,
      await chain.getTarget(blocks[0].time, blocks[i++]));
    blocks[i] = getEntry(blocks[i-1], 2 * 600 - 6000, bits);
    assert.strictEqual(bits,
      await chain.getTarget(blocks[0].time, blocks[i++]));

    // The system should continue unaffected by the block with a bogous
    // timestamps.
    for (let j = 0; j < 20; i++, j++) {
      blocks[i] = getEntry(blocks[i-1], 600, bits);
      assert.strictEqual(bits,
        await chain.getTarget(blocks[0].time, blocks[i]));
    }

    // We start emitting blocks slightly faster. The first block has no impact.
    blocks[i] = getEntry(blocks[i-1], 550, bits);
    assert.strictEqual(bits,
      await chain.getTarget(blocks[0].time, blocks[i++]));

    // Now we should see difficulty increase slowly.
    for (let j = 0; j < 10; i++, j++) {
      blocks[i] = getEntry(blocks[i-1], 550, bits);
      const nextBits =
          await chain.getCashTarget(blocks[0].time, blocks[i]);

      const currentTarget = consensus.fromCompact(bits);
      const nextTarget = consensus.fromCompact(nextBits);

      // Make sure that difficulty increases very slowly.
      assert.strictEqual(nextTarget.cmp(currentTarget), -1);
      assert.strictEqual(
        currentTarget.sub(nextTarget).cmp(currentTarget.iushrn(10)), -1);
      bits = nextBits;
    }

    // Check the actual value.
    assert.strictEqual(bits, 0x1c0fe7b1);

    // If we dramatically shorten block production, difficulty increases faster.
    for (let j = 0; j < 20; i++, j++) {
      blocks[i] = getEntry(blocks[i-1], 10, bits);
      const nextBits =
          await chain.getCashTarget(blocks[0].time, blocks[i]);

      const currentTarget = consensus.fromCompact(bits);
      const nextTarget = consensus.fromCompact(nextBits);

      // Make sure that difficulty increases very slowly.
      assert.strictEqual(nextTarget.cmp(currentTarget), -1);
      assert.strictEqual(
        currentTarget.sub(nextTarget).cmp(currentTarget.iushrn(4)), -1);
      bits = nextBits;
    }

    // Check the actual value.
    assert.strictEqual(bits, 0x1c0db19f);

    // We start to emit blocks significantly slower. The first block has no
    // impact.
    blocks[i] = getEntry(blocks[i-1], 6000, bits);
    bits =  await chain.getCashTarget(blocks[0].time, blocks[i++]);

    // Check the actual value.
    assert.strictEqual(bits, 0x1c0d9222);

    // If we dramatically slow down block production, difficulty decreases.
    for (let j = 0; j < 93; i++, j++) {
      blocks[i] = getEntry(blocks[i-1], 6000, bits);
      const nextBits =
          await chain.getCashTarget(blocks[0].time, blocks[i]);

      const currentTarget = consensus.fromCompact(bits);
      const nextTarget = consensus.fromCompact(nextBits);

        // Check the difficulty decreases.
      assert.ok(nextTarget.lte(network.pow.limit));
      assert.strictEqual(nextTarget.cmp(currentTarget), 1);
      assert.strictEqual(
        nextTarget.sub(currentTarget).cmp(currentTarget.iushrn(3)), -1);
      bits = nextBits;
    }

    // Check the actual value.
    assert.strictEqual(bits, 0x1c2f13b9);

    // Due to the window of time being bounded, next block's difficulty actually
    // gets harder.
    blocks[i] = getEntry(blocks[i-1], 6000, bits);
    bits =  await chain.getCashTarget(blocks[0].time, blocks[i++]);
    assert.strictEqual(bits, 0x1c2ee9bf);

    // And goes down again. It takes a while due to the window being bounded and
    // the skewed block causes 2 blocks to get out of the window.
    for (let j = 0; j < 192; i++, j++) {
      blocks[i] = getEntry(blocks[i-1], 6000, bits);
      const nextBits =
        await chain.getCashTarget(blocks[0].time, blocks[i]);

      const currentTarget = consensus.fromCompact(bits);
      const nextTarget = consensus.fromCompact(nextBits);

      // Check the difficulty decreases.
      assert.ok(nextTarget.lte(network.pow.limit));
      assert.strictEqual(nextTarget.cmp(currentTarget), 1);
      assert.strictEqual(
        nextTarget.sub(currentTarget).cmp(currentTarget.iushrn(3)), -1);
      bits = nextBits;
    }

    // Check the actual value.
    assert.strictEqual(bits, 0x1d00ffff);

    // Once the difficulty reached the minimum allowed level, it doesn't get any
    // easier.
    for (let j = 0; j < 5; i++, j++) {
      blocks[i] = getEntry(blocks[i-1], 6000, bits);
      const nextBits =
        await chain.getTarget(blocks[0].time, blocks[i]);

      // Check the difficulty stays constant.
      assert.strictEqual(nextBits, network.pow.bits);
      bits = nextBits;
    }
  });
});
