'use strict';

var should = require('chai').should();

var bitcore = require('../..');
var BlockHeader = bitcore.BlockHeader;
var MerkleBlock = bitcore.MerkleBlock;
var BufferReader = bitcore.encoding.BufferReader;
var BufferWriter = bitcore.encoding.BufferWriter;
var Transaction = bitcore.Transaction;
var Hash = bitcore.crypto.Hash;
var transactionVector = require('../data/tx_creation');

// None of the fixtures below are from a real Pirate (or Bitcoin) block.
// They're hand-built partial merkle trees (BIP37-style hashes+flags,
// verified by construction against a real, well-formed BlockHeader) used
// purely to exercise validMerkleTree()/hasTransaction() round-trips. This
// suite was adapted from the upstream Bitcoin bitcore-lib test vectors,
// which embedded a real Bitcoin mainnet merkleblock that doesn't fit this
// fork's actual header format at all, and no real Pirate chain data was
// available when this suite was adapted.

function makeTx(outputIndex) {
  return new Transaction().fromObject({
    version: 1,
    inputs: [{
      prevTxId: '0000000000000000000000000000000000000000000000000000000000000000',
      outputIndex: outputIndex,
      sequenceNumber: 4294967295,
      script: '04ffff001d0104'
    }],
    outputs: [{
      satoshis: 5000000000,
      script: '410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c' +
        '52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac'
    }],
    nLockTime: 0
  });
}

function pairHash(a, b) {
  return Hash.sha256sha256(Buffer.concat([a, b]));
}

function makeHeader(merkleRoot, salt) {
  return new BlockHeader({
    version: 4,
    prevHash: new Buffer(32).fill(salt),
    merkleRoot: merkleRoot,
    reserved: new Buffer(32).fill(0),
    time: 1600000000,
    bits: 0x200fffff,
    nonce: new Buffer(32).fill(0),
    solution: new Buffer(40).fill(salt)
  });
}

// A 2-transaction tree where both leaves match (are "of interest"): a
// single root-level flag bit, then one flag bit per leaf, all set.
var tx0 = makeTx(0);
var tx1 = makeTx(1);
var hash0 = tx0._getHash();
var hash1 = tx1._getHash();
var merkleRoot2 = pairHash(hash0, hash1);
var header2 = makeHeader(merkleRoot2, 0x11);
var merkleBlock2 = {
  header: header2.toObject(),
  numTransactions: 2,
  hashes: [hash0.toString('hex'), hash1.toString('hex')],
  flags: [0x07] // bits: root=1, leaf0=1, leaf1=1
};

// A 4-transaction tree where every leaf matches, exercising a taller
// (height 2) tree.
var txs4 = [0, 1, 2, 3].map(makeTx);
var hashes4 = txs4.map(function(tx) { return tx._getHash(); });
var level1 = [pairHash(hashes4[0], hashes4[1]), pairHash(hashes4[2], hashes4[3])];
var merkleRoot4 = pairHash(level1[0], level1[1]);
var header4 = makeHeader(merkleRoot4, 0x22);
var merkleBlock4 = {
  header: header4.toObject(),
  numTransactions: 4,
  hashes: hashes4.map(function(h) { return h.toString('hex'); }),
  // visit order: root, left-subtree, leaf0, leaf1, right-subtree, leaf2, leaf3 - all matches
  flags: [0x7f]
};

describe('MerkleBlock', function() {
  var blockhex = new MerkleBlock(merkleBlock2).toBuffer().toString('hex');
  var blockbuf = new Buffer(blockhex, 'hex');
  var blockJSON = JSON.stringify(merkleBlock2);
  var blockObject = JSON.parse(JSON.stringify(merkleBlock2));

  describe('#constructor', function() {
    it('should make a new merkleblock from buffer', function() {
      var b = MerkleBlock(blockbuf);
      b.toBuffer().toString('hex').should.equal(blockhex);
    });

    it('should make a new merkleblock from object', function() {
      var b = MerkleBlock(blockObject);
      b.toObject().should.deep.equal(blockObject);
    });

    it('should make a new merkleblock from JSON', function() {
      var b = MerkleBlock(JSON.parse(blockJSON));
      JSON.stringify(b).should.equal(blockJSON);
    });

    it('should not make an empty block', function() {
      (function() {
        return new MerkleBlock();
      }).should.throw('Unrecognized argument for MerkleBlock');
    });
  });

  describe('#fromObject', function() {

    it('should set these known values', function() {
      var block = MerkleBlock.fromObject(JSON.parse(blockJSON));
      should.exist(block.header);
      should.exist(block.numTransactions);
      should.exist(block.hashes);
      should.exist(block.flags);
    });

    it('should set these known values', function() {
      var block = MerkleBlock(JSON.parse(blockJSON));
      should.exist(block.header);
      should.exist(block.numTransactions);
      should.exist(block.hashes);
      should.exist(block.flags);
    });

    it('accepts an object as argument', function() {
      var block = MerkleBlock(blockbuf);
      MerkleBlock.fromObject(block.toObject()).should.exist;
    });

  });

  describe('#toJSON', function() {

    it('should recover these known values', function() {
      var block = new MerkleBlock(JSON.parse(blockJSON));
      var b = JSON.parse(JSON.stringify(block));
      should.exist(block.header);
      should.exist(block.numTransactions);
      should.exist(block.hashes);
      should.exist(block.flags);
      should.exist(b.header);
      should.exist(b.numTransactions);
      should.exist(b.hashes);
      should.exist(b.flags);
    });

  });

  describe('#fromBuffer', function() {

    it('should make a block from this known buffer', function() {
      var block = MerkleBlock.fromBuffer(blockbuf);
      block.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#fromBufferReader', function() {

    it('should make a block from this known buffer', function() {
      var block = MerkleBlock.fromBufferReader(BufferReader(blockbuf));
      block.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#toBuffer', function() {

    it('should recover a block from this known buffer', function() {
      var block = MerkleBlock.fromBuffer(blockbuf);
      block.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#toBufferWriter', function() {

    it('should recover a block from this known buffer', function() {
      var block = MerkleBlock.fromBuffer(blockbuf);
      block.toBufferWriter().concat().toString('hex').should.equal(blockhex);
    });

    it('doesn\'t create a bufferWriter if one provided', function() {
      var writer = new BufferWriter();
      var block = MerkleBlock.fromBuffer(blockbuf);
      block.toBufferWriter(writer).should.equal(writer);
    });

  });


  describe('#validMerkleTree', function() {

    it('should validate good merkleblocks', function() {
      [merkleBlock2, merkleBlock4].forEach(function(data) {
        var b = MerkleBlock(data);
        b.validMerkleTree().should.equal(true);
      });
    });

    it('should not validate merkleblocks with too many hashes', function() {
      var b = MerkleBlock(blockObject);
      // Add too many hashes
      var i = 0;
      while (i <= b.numTransactions) {
        b.hashes.push('bad' + i++);
      }
      b.validMerkleTree().should.equal(false);
    });

    it('should not validate merkleblocks with too few bit flags', function() {
      var b = MerkleBlock(JSON.parse(blockJSON));
      b.flags.pop();
      b.validMerkleTree().should.equal(false);
    });

  });

  describe('#hasTransaction', function() {

    it('should find transactions via hash string', function() {
      var b = MerkleBlock(blockObject);
      var txId = hash1.toString('hex');
      b.hasTransaction(txId).should.equal(true);
      b.hasTransaction(txId + 'abcd').should.equal(false);
    });

    it('should find transactions via Transaction object', function() {
      var b = MerkleBlock(blockObject);
      b.hasTransaction(tx1).should.equal(true);
    });

    it('should not find non-existant Transaction object', function() {
      // Reuse another transaction already in data/ dir
      var serialized = transactionVector[0][7];
      var tx = new Transaction().fromBuffer(new Buffer(serialized, 'hex'));
      var b = MerkleBlock(blockObject);
      b.hasTransaction(tx).should.equal(false);
    });

    it('should not match with unrelated hashes', function() {
      var b = MerkleBlock(blockObject);
      var hashData = [
        [hash1.toString('hex'), true],
        ['00'.repeat(32), false],
        ['ff'.repeat(32), false],
        [hash1.toString('hex').replace(/^../, 'ab'), false]
      ];
      hashData.forEach(function check(d) {
        b.hasTransaction(d[0]).should.equal(d[1]);
      });
    });

  });

});
