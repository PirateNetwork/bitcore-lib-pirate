'use strict';
var _ = require('lodash');

var BufferUtil = require('./util/buffer');
var JSUtil = require('./util/js');
var networks = [];
var networkMaps = {};

/**
 * A network is merely a map containing values that correspond to version
 * numbers for each bitcoin network. Currently only supporting "livenet"
 * (a.k.a. "mainnet") and "testnet".
 * @constructor
 */
function Network() {}

Network.prototype.toString = function toString() {
  return this.name;
};

/**
 * @function
 * @member Networks#get
 * Retrieves the network associated with a magic number or string.
 * @param {string|number|Network} arg
 * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
 * @return Network
 */
function get(arg, keys) {
  if (~networks.indexOf(arg)) {
    return arg;
  }
  if (keys) {
    if (!_.isArray(keys)) {
      keys = [keys];
    }
    var containsArg = function(key) {
      return networks[index][key] === arg;
    };
    for (var index in networks) {
      if (_.some(keys, containsArg)) {
        return networks[index];
      }
    }
    return undefined;
  }
  return networkMaps[arg];
}

/**
 * @function
 * @member Networks#add
 * Will add a custom Network
 * @param {Object} data
 * @param {string} data.name - The name of the network
 * @param {string} data.alias - The aliased name of the network
 * @param {Number} data.pubkeyhash - The publickey hash prefix
 * @param {Number} data.privatekey - The privatekey prefix
 * @param {Number} data.scripthash - The scripthash prefix
 * @param {Number} data.xpubkey - The extended public key magic
 * @param {Number} data.xprivkey - The extended private key magic
 * @param {Number} data.zaddr - The Pirate payment address prefix
 * @param {Number} data.zkey - The Pirate spending key prefix
 * @param {Number} data.networkMagic - The network magic number
 * @param {Number} data.port - The network port
 * @param {Array}  data.dnsSeeds - An array of dns seeds
 * @return Network
 */
function addNetwork(data) {

  var network = new Network();

  JSUtil.defineImmutable(network, {
    name: data.name,
    alias: data.alias,
    xpubkey: data.xpubkey,
    xprivkey: data.xprivkey,
    zaddr: data.zaddr,
    zkey: data.zkey
  });

  // pubkeyhash/privatekey/scripthash are conditional (like networkMagic/
  // port/dnsSeeds below) so a network can instead define them as
  // regtestEnabled-aware getters afterward - see testnet/regtest below,
  // where real testnet and real regtest use different address prefixes.
  if (!_.isUndefined(data.pubkeyhash)) {
    JSUtil.defineImmutable(network, {
      pubkeyhash: data.pubkeyhash
    });
  }

  if (!_.isUndefined(data.privatekey)) {
    JSUtil.defineImmutable(network, {
      privatekey: data.privatekey
    });
  }

  if (!_.isUndefined(data.scripthash)) {
    JSUtil.defineImmutable(network, {
      scripthash: data.scripthash
    });
  }

  if (data.networkMagic) {
    JSUtil.defineImmutable(network, {
      networkMagic: BufferUtil.integerAsBuffer(data.networkMagic)
    });
  }

  if (data.port) {
    JSUtil.defineImmutable(network, {
      port: data.port
    });
  }

  if (data.dnsSeeds) {
    JSUtil.defineImmutable(network, {
      dnsSeeds: data.dnsSeeds
    });
  }
  _.each(network, function(value) {
    if (!_.isUndefined(value) && !_.isObject(value)) {
      networkMaps[value] = network;
    }
  });

  networks.push(network);

  return network;

}

/**
 * @function
 * @member Networks#remove
 * Will remove a custom network
 * @param {Network} network
 */
function removeNetwork(network) {
  for (var i = 0; i < networks.length; i++) {
    if (networks[i] === network) {
      networks.splice(i, 1);
    }
  }
  for (var key in networkMaps) {
    if (networkMaps[key] === network) {
      delete networkMaps[key];
    }
  }
}

addNetwork({
  name: 'livenet',
  alias: 'mainnet',
  // Matches TreasureChest's CMainParams::base58Prefixes (src/chainparams.cpp):
  // single-byte PUBKEY_ADDRESS/SCRIPT_ADDRESS/SECRET_KEY, producing the real
  // "R..." transparent address format - not Zcash's own inherited 2-byte
  // prefixes this used to carry.
  pubkeyhash: 60,
  privatekey: 188,
  scripthash: 85,
  xpubkey: 0x0488b21e,
  xprivkey: 0x0488ade4,
  zaddr: 0x169a,
  zkey: 0xab36,
  networkMagic: 0x24e92764,
  port: 8233,
  dnsSeeds: [
    'dnsseed.z.cash',
    'dnsseed.str4d.xyz',
    'dnsseed.znodes.org'
  ]
});

/**
 * @instance
 * @member Networks#livenet
 */
var livenet = get('livenet');

// pubkeyhash/scripthash/privatekey are deliberately omitted here (unlike
// livenet's) and defined further below as regtestEnabled-aware getters,
// mirroring the existing port/networkMagic/dnsSeeds pattern - real testnet
// and real regtest use different single-byte address prefixes in
// CTestNetParams vs CRegTestParams (src/chainparams.cpp), so a single
// static value can't represent both.
addNetwork({
  name: 'testnet',
  alias: 'regtest',
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  zaddr: 0x16b6,
  zkey: 0xac08,
});

/**
 * @instance
 * @member Networks#testnet
 */
var testnet = get('testnet');

// Add configurable values for testnet/regtest

var TESTNET = {
  PORT: 18233,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xfa1af9bf),
  DNS_SEEDS: [
    'dnsseed.testnet.z.cash',
  ],
  // Matches CTestNetParams::base58Prefixes (src/chainparams.cpp): real
  // testnet deliberately reuses Bitcoin's own single-byte values.
  PUBKEY_ADDRESS: 0,
  SCRIPT_ADDRESS: 5,
  SECRET_KEY: 128
};

for (var key in TESTNET) {
  if (!_.isObject(TESTNET[key])) {
    networkMaps[TESTNET[key]] = testnet;
  }
}

var REGTEST = {
  PORT: 18444,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xaae83f5f),
  DNS_SEEDS: [],
  // Matches CRegTestParams::base58Prefixes (src/chainparams.cpp): same
  // single-byte values as livenet.
  PUBKEY_ADDRESS: 60,
  SCRIPT_ADDRESS: 85,
  SECRET_KEY: 188
};

for (var key in REGTEST) {
  if (!_.isObject(REGTEST[key])) {
    networkMaps[REGTEST[key]] = testnet;
  }
}

Object.defineProperty(testnet, 'port', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.PORT;
    } else {
      return TESTNET.PORT;
    }
  }
});

Object.defineProperty(testnet, 'networkMagic', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.NETWORK_MAGIC;
    } else {
      return TESTNET.NETWORK_MAGIC;
    }
  }
});

Object.defineProperty(testnet, 'dnsSeeds', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.DNS_SEEDS;
    } else {
      return TESTNET.DNS_SEEDS;
    }
  }
});

Object.defineProperty(testnet, 'pubkeyhash', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.PUBKEY_ADDRESS;
    } else {
      return TESTNET.PUBKEY_ADDRESS;
    }
  }
});

Object.defineProperty(testnet, 'scripthash', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.SCRIPT_ADDRESS;
    } else {
      return TESTNET.SCRIPT_ADDRESS;
    }
  }
});

Object.defineProperty(testnet, 'privatekey', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.SECRET_KEY;
    } else {
      return TESTNET.SECRET_KEY;
    }
  }
});

/**
 * @function
 * @member Networks#enableRegtest
 * Will enable regtest features for testnet
 */
function enableRegtest() {
  testnet.regtestEnabled = true;
}

/**
 * @function
 * @member Networks#disableRegtest
 * Will disable regtest features for testnet
 */
function disableRegtest() {
  testnet.regtestEnabled = false;
}

/**
 * @namespace Networks
 */
module.exports = {
  add: addNetwork,
  remove: removeNetwork,
  defaultNetwork: livenet,
  livenet: livenet,
  mainnet: livenet,
  testnet: testnet,
  get: get,
  enableRegtest: enableRegtest,
  disableRegtest: disableRegtest
};
