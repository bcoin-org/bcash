/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const Address = require('../lib/primitives/address');
const Script = require('../lib/script/script');
const assert = require('./util/assert');

describe('Address', function() {
  it('should match mainnet p2pkh address', () => {
    const raw = 'e34cce70c86373273efcc54ce7d2a491bb4a0e84';
    const p2pkh = Buffer.from(raw, 'hex');
    const addr = Address.fromPubkeyhash(p2pkh);
    const expectedAddr = '1MirQ9bwyQcGVJPwKUgapu5ouK2E2Ey4gX';
    assert.strictEqual(addr.toBase58('main'), expectedAddr);
  });

  it('should match mainnet p2pkh address 2', () => {
    const raw = '0ef030107fd26e0b6bf40512bca2ceb1dd80adaa';
    const p2pkh = Buffer.from(raw, 'hex');
    const addr = Address.fromPubkeyhash(p2pkh);
    const expectedAddr = '12MzCDwodF9G1e7jfwLXfR164RNtx4BRVG';
    assert.strictEqual(addr.toBase58('main'), expectedAddr);
  });

  it('should match testnet p2pkh address', () => {
    const raw = '78b316a08647d5b77283e512d3603f1f1c8de68f';
    const p2pkh = Buffer.from(raw, 'hex');
    const addr = Address.fromPubkeyhash(p2pkh);
    const expectedAddr = 'mrX9vMRYLfVy1BnZbc5gZjuyaqH3ZW2ZHz';
    assert.strictEqual(addr.toBase58('testnet'), expectedAddr);
  });

  it('should handle wrong p2pkh hash length', () => {
    const raw = '000ef030107fd26e0b6bf40512bca2ceb1dd80adaa';
    const p2pkh = Buffer.from(raw, 'hex');
    assert.throws(() => Address.fromPubkeyhash(p2pkh));
  });

  it('should handle empty p2pkh hash length', () => {
    const raw = '';
    const p2pkh = Buffer.from(raw, 'hex');
    assert.throws(() => Address.fromPubkeyhash(p2pkh));
  });

  it('should match mainnet p2sh address obtained from script', () => {
    const p2sh = Buffer.from(''
                          + '52410491bba2510912a5bd37da1fb5b1673010e4'
                          + '3d2c6d812c514e91bfa9f2eb129e1c183329db55'
                          + 'bd868e209aac2fbc02cb33d98fe74bf23f0c235d'
                          + '6126b1d8334f864104865c40293a680cb9c020e7'
                          + 'b1e106d8c1916d3cef99aa431a56d253e69256da'
                          + 'c09ef122b1a986818a7cb624532f062c1d1f8722'
                          + '084861c5c3291ccffef4ec687441048d2455d240'
                          + '3e08708fc1f556002f1b6cd83f992d085097f997'
                          + '4ab08a28838f07896fbab08f39495e15fa6fad6e'
                          + 'dbfb1e754e35fa1c7844c41f322a1863d4621353ae','hex');
    const script = Script.fromRaw(p2sh);
    const addr = Address.fromScript(script);
    const expectedAddr = '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC';
    assert.strictEqual(addr.toBase58('main'), expectedAddr);
  });

  it('should match mainnet p2sh address obtained from script hash', () => {
    const raw = 'f815b036d9bbbce5e9f2a00abd1bf3dc91e95510';
    const p2sh = Buffer.from(raw, 'hex');
    const addr = Address.fromScripthash(p2sh);
    const expectedAddr = '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC';
    assert.strictEqual(addr.toBase58('main'), expectedAddr);
  });

  it('should match mainnet p2sh address obtained from script 2', () => {
    const raw = 'e8c300c87986efa84c37c0519929019ef86eb5b4';
    const p2sh = Buffer.from(raw, 'hex');
    const addr = Address.fromScripthash(p2sh);
    const expectedAddr = '3NukJ6fYZJ5Kk8bPjycAnruZkE5Q7UW7i8';
    assert.strictEqual(addr.toBase58('main'), expectedAddr);
  });

  it('should match testnet p2sh address', () => {
    const raw = 'c579342c2c4c9220205e2cdc285617040c924a0a';
    const p2sh = Buffer.from(raw, 'hex');
    const addr = Address.fromScripthash(p2sh);
    const expectedAddr = '2NBFNJTktNa7GZusGbDbGKRZTxdK9VVez3n';
    assert.strictEqual(addr.toBase58('testnet'), expectedAddr);
  });

  // cashaddr
  it('should match mainnet p2pkh cashaddr', () => {
    const raw = 'e34cce70c86373273efcc54ce7d2a491bb4a0e84';
    const p2pkh = Buffer.from(raw, 'hex');
    const addr = Address.fromPubkeyhash(p2pkh);
    assert.strictEqual(
      addr.toString('main'),
      'bitcoincash:qr35ennsep3hxfe7lnz5ee7j5jgmkjswssk2puzvgv'
    );
  });

  it('should match mainnet p2pkh cashaddr 2', () => {
    const raw = '0ef030107fd26e0b6bf40512bca2ceb1dd80adaa';
    const p2pkh = Buffer.from(raw, 'hex');
    const addr = Address.fromPubkeyhash(p2pkh);
    assert.strictEqual(
      addr.toString('main'),
      'bitcoincash:qq80qvqs0lfxuzmt7sz3909ze6camq9d4gxau4gyg4'
    );
  });

  it('should match testnet p2pkh cashaddr', () => {
    const raw = '78b316a08647d5b77283e512d3603f1f1c8de68f';
    const p2pkh = Buffer.from(raw, 'hex');
    const addr = Address.fromPubkeyhash(p2pkh);
    const expectedAddr = 'mrX9vMRYLfVy1BnZbc5gZjuyaqH3ZW2ZHz';
    assert.strictEqual(addr.toBase58('testnet'), expectedAddr);
  });

  it('should match mainnet p2sh cashaddr obtained from script', () => {
    const p2sh = Buffer.from(''
                          + '52410491bba2510912a5bd37da1fb5b1673010e4'
                          + '3d2c6d812c514e91bfa9f2eb129e1c183329db55'
                          + 'bd868e209aac2fbc02cb33d98fe74bf23f0c235d'
                          + '6126b1d8334f864104865c40293a680cb9c020e7'
                          + 'b1e106d8c1916d3cef99aa431a56d253e69256da'
                          + 'c09ef122b1a986818a7cb624532f062c1d1f8722'
                          + '084861c5c3291ccffef4ec687441048d2455d240'
                          + '3e08708fc1f556002f1b6cd83f992d085097f997'
                          + '4ab08a28838f07896fbab08f39495e15fa6fad6e'
                          + 'dbfb1e754e35fa1c7844c41f322a1863d4621353ae','hex');
    const script = Script.fromRaw(p2sh);
    const addr = Address.fromScript(script);
    assert.strictEqual(
      addr.toString('main'),
      'bitcoincash:pruptvpkmxamee0f72sq40gm70wfr624zq0yyxtycm'
    );
  });

  it('should match mainnet p2sh address obtained from script hash', () => {
    const raw = 'f815b036d9bbbce5e9f2a00abd1bf3dc91e95510';
    const p2sh = Buffer.from(raw, 'hex');
    const addr = Address.fromScripthash(p2sh);
    assert.strictEqual(
      addr.toString('main'),
      'bitcoincash:pruptvpkmxamee0f72sq40gm70wfr624zq0yyxtycm'
    );
  });

  it('should match mainnet p2sh address obtained from script 2', () => {
    const raw = 'e8c300c87986efa84c37c0519929019ef86eb5b4';
    const p2sh = Buffer.from(raw, 'hex');
    const addr = Address.fromScripthash(p2sh);
    assert.strictEqual(
      addr.toString('main'),
      'bitcoincash:pr5vxqxg0xrwl2zvxlq9rxffqx00sm44ks62zuqyrj'
    );
  });

  it('should match testnet p2sh address', () => {
    const raw = 'c579342c2c4c9220205e2cdc285617040c924a0a';
    const p2sh = Buffer.from(raw, 'hex');
    const addr = Address.fromScripthash(p2sh);

    assert.strictEqual(
      addr.toString('testnet'),
      'bchtest:przhjdpv93xfygpqtckdc2zkzuzqeyj2pg4x8klehh'
    );
  });

  it('should match p2sh address without prefix', () => {
    const raw = 'c579342c2c4c9220205e2cdc285617040c924a0a';
    const p2sh = Buffer.from(raw, 'hex');
    const addrstr = 'przhjdpv93xfygpqtckdc2zkzuzqeyj2pg4x8klehh';
    const addr = Address.fromString(addrstr, 'testnet');

    assert.strictEqual(addr.type, 1, 'Incorrect type.');
    assert.bufferEqual(addr.hash, p2sh, 'Incorrect hash.');
  });

  it('should match mainnet p2pkh cashaddr without prefix', () => {
    const raw = 'e34cce70c86373273efcc54ce7d2a491bb4a0e84';
    const p2pkh = Buffer.from(raw, 'hex');
    const addrstr = 'qr35ennsep3hxfe7lnz5ee7j5jgmkjswssk2puzvgv';
    const addr = Address.fromString(addrstr, 'main');

    assert.strictEqual(addr.type, 0, 'Incorrect address type.');
    assert.bufferEqual(addr.hash, p2pkh, 'Incorrect hash.');
  });

  it('should handle invalid cashaddr prefix', () => {
    const addr = 'bitcoincas:qrzhjdpv93xfygpqtckdc2zkzuzqeyj2pgkm0jl23k';
    assert.throws(() => Address.fromString(addr, 'main'));

    let err;

    try {
      Address.fromCashAddr(addr, 'main');
    } catch (e) {
      err = e;
    }

    assert.strictEqual(
      err.message,
      'Invalid cashaddr checksum.'
    );
  });

  it('should handle invalid cashaddr checksum', () => {
    const addr = 'bitcoincash:pr5vxqxg0xrwl2zvxlq9rxffqx00sm44ks62zuqyrr';
    assert.throws(() => Address.fromString(addr, 'main'));

    let err;

    try {
      Address.fromCashAddr(addr, 'main');
    } catch (e) {
      err = e;
    }

    assert.strictEqual(
      err.message,
      'Invalid cashaddr checksum.'
    );
  });

  it('should handle invalid cashaddr type', () => {
    const addr = 'bitcoincash:zzhgrdtkaz370lfrlx7fc8rvj5yd5nrn7qq3srezys';
    assert.throws(() => Address.fromString(addr, 'main'));

    let err;

    try {
      Address.fromCashAddr(addr, 'main');
    } catch (e) {
      err = e;
    }

    assert.strictEqual(
      err.message,
      'Not a valid address type.'
    );
  });

  it('should handle invalid cashaddr data length', () => {
    const addr = 'bitcoincash:qpg4nt2nwm9mm2a6s6gmcmjx2yr7c9kvta';
    assert.throws(() => Address.fromString(addr, 'main'));

    let err;

    try {
      Address.fromCashAddr(addr, 'main');
    } catch (e) {
      err = e;
    }

    assert.strictEqual(
      err.message,
      'Invalid cashaddr data length.'
    );
  });

  it('should handle cashaddr mixed case', () => {
    const addr = 'bitcoincash:pruptvpkmxamee0f7'
               + '2Sq40gm70wfr624zq0yyxtycm';
    assert.throws(() => Address.fromString(addr, 'main'));

    let err;

    try {
      Address.fromCashAddr(addr, 'main');
    } catch (e) {
      err = e;
    }

    assert(err, 'Exception error missing.');
    assert.strictEqual(
      err.message,
      'Invalid cashaddr casing.'
    );
  });

  it('should handle cashaddr zero padding of more than 4 bits', () => {
    const addr = 'bitcoincash:pruptvpkmxamee0f72sq40gm70wfr624zqqn4vewfdw';
    assert.throws(() => Address.fromString(addr, 'main'));

    let err;

    try {
      Address.fromCashAddr(addr, 'main');
    } catch (e) {
      err = e;
    }

    assert(err, 'Exception error missing.');
    assert.strictEqual(
      err.message,
      'Invalid padding in data.'
    );
  });

  it('should handle segwit non-zero padding in 8-to-5 conversion', () => {
    const addr = 'bitcoincash:pruptvpkmxamee0f72sq40gm70wfr624zpu8adj8t6';
    assert.throws(() => Address.fromString(addr, 'main'));

    let err;

    try {
      Address.fromCashAddr(addr, 'main');
    } catch (e) {
      err = e;
    }

    assert(err, 'Exception error missing.');
    assert.strictEqual(
      err.message,
      'Non zero padding.'
    );
  });
});
