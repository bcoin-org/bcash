/*!
 * address.js - address object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('assert');
const bio = require('bufio');
const {base58, cashaddr} = require('bstring');
const hash160 = require('bcrypto/lib/hash160');
const hash256 = require('bcrypto/lib/hash256');
const Network = require('../protocol/network');
const consensus = require('../protocol/consensus');

/*
 * Constants
 */

const ZERO_HASH160 = Buffer.alloc(20, 0x00);

/**
 * Address
 * Represents an address.
 * @alias module:primitives.Address
 * @property {Buffer} hash
 * @property {AddressPrefix} type
 */

class Address {
  /**
   * Create an address.
   * @constructor
   * @param {Object?} options
   */

  constructor(options, network) {
    this.type = Address.types.PUBKEYHASH;
    this.hash = ZERO_HASH160;

    if (options)
      this.fromOptions(options, network);
  }

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   */

  fromOptions(options, network) {
    if (typeof options === 'string')
      return this.fromString(options, network);

    assert(options);

    const {hash, type} = options;

    return this.fromHash(hash, type);
  }

  /**
   * Insantiate address from options.
   * @param {Object} options
   * @returns {Address}
   */

  static fromOptions(options, network) {
    return new this().fromOptions(options, network);
  }

  /**
   * Get the address hash.
   * @param {String?} enc - Can be `"hex"` or `null`.
   * @returns {Hash|Buffer}
   */

  getHash(enc) {
    if (enc === 'hex')
      return this.hash.toString(enc);
    return this.hash;
  }

  /**
   * Test whether the address is null.
   * @returns {Boolean}
   */

  isNull() {
    if (this.hash.length === 20)
      return this.hash.equals(ZERO_HASH160);

    if (this.hash.length === 32)
      return this.hash.equals(consensus.ZERO_HASH);

    for (let i = 0; i < this.hash.length; i++) {
      if (this.hash[i] !== 0)
        return false;
    }

    return true;
  }

  /**
   * Test equality against another address.
   * @param {Address} addr
   * @returns {Boolean}
   */

  equals(addr) {
    assert(addr instanceof Address);

    return this.type === addr.type
      && this.hash.equals(addr.hash);
  }

  /**
   * Get the address type as a string.
   * @returns {String}
   */

  getType() {
    return Address.typesByVal[this.type].toLowerCase();
  }

  /**
   * Get a network address prefix for the address.
   * @param {Network?} network
   * @returns {Number}
   */

  getPrefix(network) {
    network = Network.get(network);

    const prefixes = network.addressPrefix;

    switch (this.type) {
      case Address.types.PUBKEYHASH:
        return prefixes.pubkeyhash;
      case Address.types.SCRIPTHASH:
        return prefixes.scripthash;
    }

    return -1;
  }

  /**
   * Calculate size of serialized address.
   * @returns {Number}
   */

  getSize() {
    return 5 + this.hash.length;
  }

  /**
   * Compile the address object to its raw serialization.
   * @param {{NetworkType|Network)?} network
   * @returns {Buffer}
   * @throws Error on bad hash/prefix.
   */

  toRaw(network) {
    const size = this.getSize();
    const bw = bio.write(size);
    const prefix = this.getPrefix(network);

    assert(prefix !== -1, 'Not a valid address prefix.');

    bw.writeU8(prefix);

    bw.writeBytes(this.hash);
    bw.writeChecksum(hash256.digest);

    return bw.render();
  }

  /**
   * Compile the address object to a base58 address.
   * @param {{NetworkType|Network)?} network
   * @returns {AddressString}
   * @throws Error on bad hash/prefix.
   */

  toBase58(network) {
    return base58.encode(this.toRaw(network));
  }

  /**
   * Compile the address object to a cashaddr address.
   * @param {{NetworkType|Network)?} network
   * @returns {String}
   * @throws Error on bad hash/prefix.
   */

  toCashAddr(network) {
    const type = this.type;
    const hash = this.hash;

    network = Network.get(network);

    const prefix = network.addressPrefix.cashaddr;

    return cashaddr.encode(prefix, type, hash);
  }

  /**
   * Inject properties from string.
   * @private
   * @param {String} addr
   * @param {(Network|NetworkType)?} network
   * @returns {Address}
   */

  fromString(addr, network) {
    assert(typeof addr === 'string');
    assert(addr.length > 0);
    assert(addr.length <= 100);

    // If the address is mixed case,
    // it can only ever be base58.
    if (isMixedCase(addr))
      return this.fromBase58(addr, network);

    // Otherwise, it's most likely cashaddr.
    try {
      return this.fromCashAddr(addr, network);
    } catch (e) {
      return this.fromBase58(addr, network);
    }
  }

  /**
   * Instantiate address from string.
   * @param {String} addr
   * @param {(Network|NetworkType)?} network
   * @returns {Address}
   */

  static fromString(addr, network) {
    return new this().fromString(addr, network);
  }

  /**
   * Return cashaddr by default
   * @param {(Network|NetworkType)?} network
   * @returns {AddressString}
   */

  toString(network) {
    return this.toCashAddr(network);
  }

  /**
   * Inspect the Address.
   * @returns {Object}
   */

  inspect() {
    return '<Address:'
      + ` type=${this.getType()}`
      + ` str=${this.toString()}`
      + '>';
  }

  /**
   * Inject properties from serialized data.
   * @private
   * @param {Buffer} data
   * @throws Parse error
   */

  fromRaw(data, network) {
    const br = bio.read(data, true);
    const prefix = br.readU8();

    network = Network.fromAddress(prefix, network);

    const type = Address.getType(prefix, network);

    if (data.length !== 25)
      throw new Error('Address is too long.');

    const hash = br.readBytes(br.left() - 4);

    br.verifyChecksum(hash256.digest);

    return this.fromHash(hash, type);
  }

  /**
   * Create an address object from a serialized address.
   * @param {Buffer} data
   * @returns {Address}
   * @throws Parse error.
   */

  static fromRaw(data, network) {
    return new this().fromRaw(data, network);
  }

  /**
   * Inject properties from base58 address.
   * @private
   * @param {AddressString} data
   * @param {Network?} network
   * @throws Parse error
   */

  fromBase58(data, network) {
    assert(typeof data === 'string');

    if (data.length > 55)
      throw new Error('Address is too long.');

    return this.fromRaw(base58.decode(data), network);
  }

  /**
   * Create an address object from a base58 address.
   * @param {AddressString} data
   * @param {Network?} network
   * @returns {Address}
   * @throws Parse error.
   */

  static fromBase58(data, network) {
    return new this().fromBase58(data, network);
  }

  /**
   * Inject properties from cashaddr address.
   * @private
   * @param {String} data
   * @param {Network?} network
   * @throws Parse error
   */

  fromCashAddr(data, network) {
    assert(typeof data === 'string');

    network = Network.get(network);

    const prefix = network.addressPrefix.cashaddr;
    const addr = cashaddr.decode(data, prefix);

    Network.fromCashAddr(addr.prefix, network);

    return this.fromHash(addr.hash, addr.type);
  }

  /**
   * Create an address object from a cashaddr address.
   * @param {String} data
   * @param {Network?} network
   * @returns {Address}
   * @throws Parse error.
   */

  static fromCashAddr(data, network) {
    return new this().fromCashAddr(data, network);
  }

  /**
   * Inject properties from output script.
   * @private
   * @param {Script} script
   */

  fromScript(script) {
    const pk = script.getPubkey();

    if (pk) {
      this.hash = hash160.digest(pk);
      this.type = Address.types.PUBKEYHASH;
      return this;
    }

    const pkh = script.getPubkeyhash();

    if (pkh) {
      this.hash = pkh;
      this.type = Address.types.PUBKEYHASH;
      return this;
    }

    const sh = script.getScripthash();

    if (sh) {
      this.hash = sh;
      this.type = Address.types.SCRIPTHASH;
      return this;
    }

    // Put this last: it's the slowest to check.
    if (script.isMultisig()) {
      this.hash = script.hash160();
      this.type = Address.types.SCRIPTHASH;
      return this;
    }

    return null;
  }

  /**
   * Inject properties from input script.
   * @private
   * @param {Script} script
   */

  fromInputScript(script) {
    const [, pk] = script.getPubkeyhashInput();

    if (pk) {
      this.hash = hash160.digest(pk);
      this.type = Address.types.PUBKEYHASH;
      return this;
    }

    const redeem = script.getScripthashInput();

    if (redeem) {
      this.hash = hash160.digest(redeem);
      this.type = Address.types.SCRIPTHASH;
      return this;
    }

    return null;
  }

  /**
   * Create an Address from an input script.
   * Attempt to extract address
   * properties from an input script.
   * @param {Script}
   * @returns {Address|null}
   */

  static fromInputScript(script) {
    return new this().fromInputScript(script);
  }

  /**
   * Create an Address from an output script.
   * Parse an output script and extract address
   * properties. Converts pubkey and multisig
   * scripts to pubkeyhash and scripthash addresses.
   * @param {Script}
   * @returns {Address|null}
   */

  static fromScript(script) {
    return new this().fromScript(script);
  }

  /**
   * Inject properties from a hash.
   * @private
   * @param {Buffer|Hash} hash
   * @param {AddressPrefix} type
   * @throws on bad hash size
   */

  fromHash(hash, type) {
    if (typeof hash === 'string')
      hash = Buffer.from(hash, 'hex');

    if (typeof type === 'string') {
      type = Address.types[type.toUpperCase()];
      assert(type != null, 'Not a valid address type.');
    }

    if (type == null)
      type = Address.types.PUBKEYHASH;

    assert(Buffer.isBuffer(hash));
    assert((type >>> 0) === type);

    assert(type >= Address.types.PUBKEYHASH && type <= Address.types.SCRIPTHASH,
      'Not a valid address type.');

    assert(hash.length === 20, 'Hash is the wrong size.');

    this.hash = hash;
    this.type = type;

    return this;
  }

  /**
   * Create a naked address from hash/type/version.
   * @param {Hash} hash
   * @param {AddressPrefix} type
   * @param {Number} [version=-1]
   * @returns {Address}
   * @throws on bad hash size
   */

  static fromHash(hash, type, version) {
    return new this().fromHash(hash, type, version);
  }

  /**
   * Inject properties from pubkeyhash.
   * @private
   * @param {Buffer} hash
   * @returns {Address}
   */

  fromPubkeyhash(hash) {
    const type = Address.types.PUBKEYHASH;
    assert(hash.length === 20, 'P2PKH must be 20 bytes.');
    return this.fromHash(hash, type, -1);
  }

  /**
   * Instantiate address from pubkeyhash.
   * @param {Buffer} hash
   * @returns {Address}
   */

  static fromPubkeyhash(hash) {
    return new this().fromPubkeyhash(hash);
  }

  /**
   * Inject properties from scripthash.
   * @private
   * @param {Buffer} hash
   * @returns {Address}
   */

  fromScripthash(hash) {
    const type = Address.types.SCRIPTHASH;
    assert(hash && hash.length === 20, 'P2SH must be 20 bytes.');
    return this.fromHash(hash, type, -1);
  }

  /**
   * Instantiate address from scripthash.
   * @param {Buffer} hash
   * @returns {Address}
   */

  static fromScripthash(hash) {
    return new this().fromScripthash(hash);
  }

  /**
   * Test whether the address is pubkeyhash.
   * @returns {Boolean}
   */

  isPubkeyhash() {
    return this.type === Address.types.PUBKEYHASH;
  }

  /**
   * Test whether the address is scripthash.
   * @returns {Boolean}
   */

  isScripthash() {
    return this.type === Address.types.SCRIPTHASH;
  }

  /**
   * Get the hash of a base58 address or address-related object.
   * @param {String|Address|Hash} data
   * @param {String?} enc
   * @param {Network?} network
   * @returns {Hash}
   */

  static getHash(data, enc, network) {
    if (!data)
      throw new Error('Object is not an address.');

    let hash;

    if (typeof data === 'string') {
      if (data.length === 40)
        return enc === 'hex' ? data : Buffer.from(data, 'hex');

      hash = Address.fromString(data, network).hash;
    } else if (Buffer.isBuffer(data)) {
      if (data.length !== 20)
        throw new Error('Object is not an address.');
      hash = data;
    } else if (data instanceof Address) {
      hash = data.hash;
    } else {
      throw new Error('Object is not an address.');
    }

    return enc === 'hex'
      ? hash.toString('hex')
      : hash;
  }

  /**
   * Get an address type for a specified network address prefix.
   * @param {Number} prefix
   * @param {Network} network
   * @returns {AddressType}
   */

  static getType(prefix, network) {
    const prefixes = network.addressPrefix;

    switch (prefix) {
      case prefixes.pubkeyhash:
        return Address.types.PUBKEYHASH;
      case prefixes.scripthash:
        return Address.types.SCRIPTHASH;
      default:
        throw new Error('Unknown address prefix.');
    }
  }
}

/**
 * Address types.
 * @enum {Number}
 */

Address.types = {
  PUBKEYHASH: 0,
  SCRIPTHASH: 1
};

/**
 * Address types by value.
 * @const {Object}
 */

Address.typesByVal = [
  'PUBKEYHASH',
  'SCRIPTHASH'
];

/*
 * Helpers
 */

function isMixedCase(str) {
  let lower = false;
  let upper = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);

    if (ch >= 0x30 && ch <= 0x39)
      continue;

    // skip :
    if (ch === 0x3a)
      continue;

    if (ch & 32) {
      assert(ch >= 0x61 && ch <= 0x7a);
      lower = true;
    } else {
      assert(ch >= 0x41 && ch <= 0x5a);
      upper = true;
    }

    if (lower && upper)
      return true;
  }

  return false;
}

/*
 * Expose
 */

module.exports = Address;
