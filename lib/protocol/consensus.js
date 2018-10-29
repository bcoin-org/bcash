/*!
 * consensus.js - consensus constants and helpers for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

/**
 * @module protocol/consensus
 */

const assert = require('bsert');
const BN = require('bcrypto/lib/bn.js');

/**
 * One bitcoin in satoshis.
 * @const {Amount}
 * @default
 */

exports.COIN = 100000000;

/**
 * Maximum amount of money in satoshis:
 * `21million * 1btc` (consensus).
 * @const {Amount}
 * @default
 */

exports.MAX_MONEY = 21000000 * exports.COIN;

/**
 * Base block subsidy (consensus).
 * Note to shitcoin implementors: if you
 * increase this to anything greater than
 * 33 bits, getReward will have to be
 * modified to handle the shifts.
 * @const {Amount}
 * @default
 */

exports.BASE_REWARD = 50 * exports.COIN;

/**
 * Half base block subsidy. Required to
 * calculate the reward properly (with
 * only 32 bit shifts available).
 * @const {Amount}
 * @default
 */

exports.HALF_REWARD = Math.floor(exports.BASE_REWARD / 2);

/**
 * Maximum block base size (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_BLOCK_SIZE = 1000000;

/**
 * Maximum block base size (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_FORK_BLOCK_SIZE = 32000000;

/**
 * Maximum transaction size (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_TX_SIZE = 1000000;

/**
 * Minimum transaction size (consensus)
 * @const {Number}
 * @see https://bitslog.wordpress.com/2018/06/09/leaf-node-weakness-in-bitcoin-merkle-tree-design/
 * @default
 */

exports.MIN_TX_SIZE = 100;

/**
 * Maximum block serialization size (protocol).
 * @const {Number}
 * @default
 */

exports.MAX_RAW_BLOCK_SIZE = 32000000;

/**
 * Maximum block sigops per mb (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_BLOCK_SIGOPS_PER_MB = 20000;

/**
 * Maximum transaction sigops
 * @const {Number}
 * @default
 */

exports.MAX_TX_SIGOPS = 20000;

/**
 * Maximum block sigops cost (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_BLOCK_SIGOPS_COST = 80000;

/**
 * Maximum size for coinbase script sig
 * @const {Number}
 * @default
 */
exports.MAX_COINBASE_SCRIPTSIG_SIZE = 100;

/**
 * Size of set to pick median time from.
 * @const {Number}
 * @default
 */

exports.MEDIAN_TIMESPAN = 11;

/**
 * What bits to set in version
 * for versionbits blocks.
 * @const {Number}
 * @default
 */

exports.VERSION_TOP_BITS = 0x20000000;

/**
 * What bitmask determines whether
 * versionbits is in use.
 * @const {Number}
 * @default
 */

exports.VERSION_TOP_MASK = 0xe0000000;

/**
 * Number of blocks before a coinbase
 * spend can occur (consensus).
 * @const {Number}
 * @default
 */

exports.COINBASE_MATURITY = 100;

/**
 * nLockTime threshold for differentiating
 * between height and time (consensus).
 * Tue Nov 5 00:53:20 1985 UTC
 * @const {Number}
 * @default
 */

exports.LOCKTIME_THRESHOLD = 500000000;

/**
 * Highest nSequence bit -- disables
 * sequence locktimes (consensus).
 * @const {Number}
 */

exports.SEQUENCE_DISABLE_FLAG = (1 << 31) >>> 0;

/**
 * Sequence time: height or time (consensus).
 * @const {Number}
 * @default
 */

exports.SEQUENCE_TYPE_FLAG = 1 << 22;

/**
 * Sequence granularity for time (consensus).
 * @const {Number}
 * @default
 */

exports.SEQUENCE_GRANULARITY = 9;

/**
 * Sequence mask (consensus).
 * @const {Number}
 * @default
 */

exports.SEQUENCE_MASK = 0x0000ffff;

/**
 * Max serialized script size (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_SCRIPT_SIZE = 10000;

/**
 * Max stack size during execution (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_SCRIPT_STACK = 1000;

/**
 * Max script element size (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_SCRIPT_PUSH = 520;

/**
 * Max opcodes executed (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_SCRIPT_OPS = 201;

/**
 * Max `n` value for multisig (consensus).
 * @const {Number}
 * @default
 */

exports.MAX_MULTISIG_PUBKEYS = 20;

/**
 * The date bip16 (p2sh) was activated (consensus).
 * @const {Number}
 * @default
 */

exports.BIP16_TIME = 1333238400;

/**
 * A hash of all zeroes.
 * @const {Buffer}
 * @default
 */

exports.ZERO_HASH = Buffer.alloc(32, 0x00);

/**
 * A hash of all zeroes.
 * @const {String}
 * @default
 */

exports.NULL_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Anti replay commitment.
 * @const {String}
 * @default
 */

exports.ANTI_REPLAY_COMMITMENT =
  'Bitcoin: A Peer-to-Peer Electronic Cash System';

/**
 * Convert a compact number to a big number.
 * Used for `block.bits` -> `target` conversion.
 * @param {Number} compact
 * @returns {BN}
 */

exports.fromCompact = function fromCompact(compact) {
  if (compact === 0)
    return new BN(0);

  const exponent = compact >>> 24;
  const negative = (compact >>> 23) & 1;

  let mantissa = compact & 0x7fffff;
  let num;

  if (exponent <= 3) {
    mantissa >>>= 8 * (3 - exponent);
    num = new BN(mantissa);
  } else {
    num = new BN(mantissa);
    num.iushln(8 * (exponent - 3));
  }

  if (negative)
    num.ineg();

  return num;
};

/**
 * Convert a big number to a compact number.
 * Used for `target` -> `block.bits` conversion.
 * @param {BN} num
 * @returns {Number}
 */

exports.toCompact = function toCompact(num) {
  if (num.isZero())
    return 0;

  let exponent = num.byteLength();
  let mantissa;

  if (exponent <= 3) {
    mantissa = num.toNumber();
    mantissa <<= 8 * (3 - exponent);
  } else {
    mantissa = num.ushrn(8 * (exponent - 3)).toNumber();
  }

  if (mantissa & 0x800000) {
    mantissa >>= 8;
    exponent++;
  }

  let compact = (exponent << 24) | mantissa;

  if (num.isNeg())
    compact |= 0x800000;

  compact >>>= 0;

  return compact;
};

/**
 * Verify proof-of-work.
 * @param {Hash} hash
 * @param {Number} bits
 * @returns {Boolean}
 */

exports.verifyPOW = function verifyPOW(hash, bits) {
  const target = exports.fromCompact(bits);

  if (target.isNeg() || target.isZero())
    return false;

  if (target.bitLength() > 256)
    return false;

  const num = new BN(hash, 'le');

  if (num.gt(target))
    return false;

  return true;
};

/**
 * Calculate block subsidy.
 * @param {Number} height - Reward era by height.
 * @returns {Amount}
 */

exports.getReward = function getReward(height, interval) {
  assert(height >= 0, 'Bad height for reward.');

  const halvings = Math.floor(height / interval);

  // BIP 42 (well, our own version of it,
  // since we can only handle 32 bit shifts).
  // https://github.com/bitcoin/bips/blob/master/bip-0042.mediawiki
  if (halvings >= 33)
    return 0;

  // We need to shift right by `halvings`,
  // but 50 btc is a 33 bit number, so we
  // cheat. We only start halving once the
  // halvings are at least 1.
  if (halvings === 0)
    return exports.BASE_REWARD;

  return exports.HALF_REWARD >>> (halvings - 1);
};

/**
 * Test version bit.
 * @param {Number} version
 * @param {Number} bit
 * @returns {Boolean}
 */

exports.hasBit = function hasBit(version, bit) {
  const TOP_MASK = exports.VERSION_TOP_MASK;
  const TOP_BITS = exports.VERSION_TOP_BITS;
  const bits = (version & TOP_MASK) >>> 0;
  const mask = 1 << bit;
  return bits === TOP_BITS && (version & mask) !== 0;
};

/**
 * Calculate max block sigops.
 * @param {Number} size
 * @returns {Number}
 */

exports.maxBlockSigops = function maxBlockSigops(size) {
  const mb = 1 + ((size - 1) / 1e6 | 0);
  return mb * exports.MAX_BLOCK_SIGOPS_PER_MB;
};
