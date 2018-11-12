/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('./util/assert');
const common = require('../lib/script/common');
const Script = require('../lib/script/script');
const Stack = require('../lib/script/stack');
const Keyring = require('../lib/primitives/keyring');
const secp256k1 = require('bcrypto/lib/secp256k1');
const sha256 = require('bcrypto/lib/sha256');

const EMPTY = Buffer.alloc(0);

let flags = [
  common.flags.VERIFY_NONE,
  common.flags.STANDARD_VERIFY_FLAGS,
  common.flags.MANDATORY_VERIFY_FLAGS
];

// TODO: update standard flags
flags = flags.map(flag => flag & ~common.flags.VERIFY_COMPRESSED_PUBKEYTYPE);

const priv = '0000000000000000000000000000000000000000000000000000000000000001';
const key = Keyring.fromPrivate(Buffer.from(priv, 'hex'));

function isSuccess(stack, script, expected) {
  for (const flag of flags) {
    const input = stack.clone();
    script.execute(input, flag | common.flags.VERIFY_CHECKDATASIG);
    assert.deepEqual(input.items, expected);
  }
}

function isError(stack, script, error) {
  for (const flag of flags) {
    const input = stack.clone();
    let err;
    try {
      script.execute(input, flag | common.flags.VERIFY_CHECKDATASIG);
    } catch (e) {
      err = e;
    }
    assert.typeOf(err, 'error');
    assert.strictEqual(err.code, error);
  }
}

// TODO: add sigop count, activation tests
describe('Magnetic', function() {
  it('should fail datasig on invalid stack', async () => {
    for (const op of ['OP_CHECKDATASIG', 'OP_CHECKDATASIGVERIFY']) {
      const stack = new Stack();
      const script = Script.fromString(op);

      const zero = Buffer.from('00', 'hex');

      isError(stack, script, 'INVALID_STACK_OPERATION');
      stack.push(zero);
      isError(stack, script, 'INVALID_STACK_OPERATION');
      stack.push(zero);
      isError(stack, script, 'INVALID_STACK_OPERATION');
    }
  });

  it('should match datasig on empty stack', async () => {
    const stack = new Stack();
    stack.push(EMPTY);
    stack.push(EMPTY);
    stack.push(key.publicKey);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[]]);
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'),
      'CHECKDATASIGVERIFY');
  });

  it('should match datasig on various pubkey encoding', async () => {
    const stack = new Stack();
    stack.push(EMPTY);
    stack.push(EMPTY);
    stack.push(key.publicKey);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[]]);
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'),
      'CHECKDATASIGVERIFY');

    const uncompressed = secp256k1.publicKeyConvert(key.publicKey, false);

    stack.clear();
    stack.push(EMPTY);
    stack.push(EMPTY);
    stack.push(uncompressed);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[]]);
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'),
      'CHECKDATASIGVERIFY');
  });

  it('should match datasig on valid signature', async () => {
    const msg = EMPTY;
    const hash = sha256.digest(msg);
    const sig = key.sign(hash);

    const stack = new Stack();
    stack.push(sig);
    stack.push(msg);
    stack.push(key.publicKey);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[1]]);
    isSuccess(stack, Script.fromString('OP_CHECKDATASIGVERIFY'), []);
  });

  it('should fail datasig on hybrid key with strictenc', async () => {
    flags = flags.map(flag => flag | common.flags.VERIFY_STRICTENC);

    const hybrid = secp256k1.publicKeyConvert(key.publicKey, false);
    hybrid[0] = 0x06 | (hybrid[64] & 0x01);

    const stack = new Stack();
    stack.push(EMPTY);
    stack.push(EMPTY);
    stack.push(hybrid);

    isError(stack, Script.fromString('OP_CHECKDATASIG'), 'PUBKEYTYPE');
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'), 'PUBKEYTYPE');
  });

  it('should match datasig on hybrid key w/o strictenc', async () => {
    flags = flags.map(flag => flag & ~common.flags.VERIFY_STRICTENC);

    const hybrid = secp256k1.publicKeyConvert(key.publicKey, false);
    hybrid[0] = 0x06 | (hybrid[64] & 0x01);

    const stack = new Stack();
    stack.push(EMPTY);
    stack.push(EMPTY);
    stack.push(hybrid);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[]]);
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'),
      'CHECKDATASIGVERIFY');
  });

  it('should fail datasig on invalid signature with nullfail', async () => {
    flags = flags.map(flag => flag | common.flags.VERIFY_NULLFAIL);

    const msg = EMPTY;
    const minimal = Buffer.from('3006020101020101', 'hex');

    const stack = new Stack();
    stack.push(minimal);
    stack.push(msg);
    stack.push(key.publicKey);

    isError(stack, Script.fromString('OP_CHECKDATASIG'), 'NULLFAIL');
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'), 'NULLFAIL');

    stack.clear();
    stack.push(minimal);
    stack.push(Buffer.from([1]));
    stack.push(key.publicKey);

    isError(stack, Script.fromString('OP_CHECKDATASIG'), 'NULLFAIL');
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'), 'NULLFAIL');
  });

  it('should match datasig on signature w/o nullfail', async () => {
    flags = flags.map(flag => flag & ~common.flags.VERIFY_NULLFAIL);

    const msg = EMPTY;
    const minimal = Buffer.from('3006020101020101', 'hex');

    const stack = new Stack();
    stack.push(minimal);
    stack.push(msg);
    stack.push(key.publicKey);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[]]);
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'),
      'CHECKDATASIGVERIFY');

    stack.clear();
    stack.push(minimal);
    stack.push(Buffer.from([1]));
    stack.push(key.publicKey);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[]]);
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'),
      'CHECKDATASIGVERIFY');
  });

  it('should fail datasig on high_s signature with low_s', async () => {
    flags = flags.map(flag => flag | common.flags.VERIFY_LOW_S);

    const msg = EMPTY;
    const highS = Buffer.from(
      '304502203e4516da7253cf06' +
      '8effec6b95c41221c0cf3a8e' +
      '6ccb8cbf1725b562e9afde2c' +
      '022100ab1e3da73d67e32045' +
      'a20e0b999e049978ea8d6ee5' +
      '480d485fcf2ce0d03b2ef0', 'hex');

    const stack = new Stack();
    stack.push(highS);
    stack.push(msg);
    stack.push(key.publicKey);

    isError(stack, Script.fromString('OP_CHECKDATASIG'), 'SIG_HIGH_S');
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'), 'SIG_HIGH_S');
  });

  it('should match datasig on high_s signature w/o low_s', async () => {
    flags = flags.map(flag => flag & ~common.flags.VERIFY_LOW_S);

    const msg = EMPTY;
    const highS = Buffer.from(
      '304502203e4516da7253cf06' +
      '8effec6b95c41221c0cf3a8e' +
      '6ccb8cbf1725b562e9afde2c' +
      '022100ab1e3da73d67e32045' +
      'a20e0b999e049978ea8d6ee5' +
      '480d485fcf2ce0d03b2ef0', 'hex');

    const stack = new Stack();
    stack.push(highS);
    stack.push(msg);
    stack.push(key.publicKey);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[]]);
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'),
      'CHECKDATASIGVERIFY');
  });

  it('should fail datasig on non dersig signature with dersig', async () => {
    flags = flags.map(flag => flag | common.flags.VERIFY_DERSIG);
    flags = flags.map(flag => flag | common.flags.VERIFY_LOW_S);
    flags = flags.map(flag => flag | common.flags.VERIFY_STRICTENC);

    const msg = EMPTY;
    const nondersig = Buffer.from('308006020101020101', 'hex');

    const stack = new Stack();
    stack.push(nondersig);
    stack.push(msg);
    stack.push(key.publicKey);

    isError(stack, Script.fromString('OP_CHECKDATASIG'), 'SIG_DER');
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'), 'SIG_DER');
  });

  it('should match datasig on non dersig signature w/o dersig', async () => {
    flags = flags.map(flag => flag & ~common.flags.VERIFY_DERSIG);
    flags = flags.map(flag => flag & ~common.flags.VERIFY_LOW_S);
    flags = flags.map(flag => flag & ~common.flags.VERIFY_STRICTENC);

    const msg = EMPTY;
    const nondersig = Buffer.from('308006020101020101', 'hex');

    const stack = new Stack();
    stack.push(nondersig);
    stack.push(msg);
    stack.push(key.publicKey);

    isSuccess(stack, Script.fromString('OP_CHECKDATASIG'), [[]]);
    isError(stack, Script.fromString('OP_CHECKDATASIGVERIFY'),
      'CHECKDATASIGVERIFY');
  });
});
