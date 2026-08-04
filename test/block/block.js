'use strict';

var bitcore = require('../..');
var BN = require('../../lib/crypto/bn');
var BufferReader = bitcore.encoding.BufferReader;
var BufferWriter = bitcore.encoding.BufferWriter;
var BlockHeader = bitcore.BlockHeader;
var Block = bitcore.Block;
var chai = require('chai');
var should = chai.should();
var Transaction = bitcore.Transaction;

// None of the fixtures in this file are from a real Pirate (or Bitcoin)
// block. They're hand-built, well-formed Equihash-format blocks (see
// BlockHeader._fromBufferReader for the format: version + prevHash +
// merkleRoot + reserved + time + bits + nonce + solution, followed by a
// varint tx count and the transactions themselves) used purely to
// exercise encode/decode/merkle-root round-trips. This suite was adapted
// from the upstream Bitcoin bitcore-lib test vectors, which embedded
// several real historical Bitcoin blocks (including the actual Bitcoin
// genesis block) that don't fit this fork's actual block format at all -
// Bitcoin headers are a fixed 80 bytes with no `reserved` field and a
// 4-byte nonce, not a 32-byte nonce plus a variable-length solution - and
// no real Pirate chain data was available when this suite was adapted.

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

function makeHeader(merkleRoot) {
  return new BlockHeader({
    version: 4,
    prevHash: new Buffer(32).fill(0x11),
    merkleRoot: merkleRoot,
    reserved: new Buffer(32).fill(0),
    time: 1600000000,
    bits: 0x200fffff, // an easy, regtest-style minimum difficulty target
    nonce: new Buffer(32).fill(0),
    solution: new Buffer(40).fill(0x44)
  });
}

// Computing a real merkle root requires knowing the transactions first,
// so build a throwaway block against a zero-filled header purely to
// borrow Block's merkle-tree logic, then build the real header fresh.
function makeBlock(txs) {
  var scratchBlock = new Block({header: makeHeader(new Buffer(32).fill(0)), transactions: txs});
  var header = makeHeader(scratchBlock.getMerkleRoot());
  return new Block({header: header, transactions: txs});
}

describe('Block', function() {

  var tx = makeTx(0);
  var block = makeBlock([tx]);
  var blockhex = block.toBuffer().toString('hex');
  var blockbuf = new Buffer(blockhex, 'hex');
  var bh = block.header;
  var json = JSON.stringify(block.toObject());

  it('should make a new block', function() {
    var b = Block(blockbuf);
    b.toBuffer().toString('hex').should.equal(blockhex);
  });

  it('should not make an empty block', function() {
    (function() {
      return new Block();
    }).should.throw('Unrecognized argument for Block');
  });

  describe('#constructor', function() {

    it('should set these known values', function() {
      var b = new Block({
        header: bh,
        transactions: [tx]
      });
      should.exist(b.header);
      should.exist(b.transactions);
    });

    it('should properly deserialize blocks with varying transaction counts', function() {
      [1, 2, 3].forEach(function(n) {
        var txs = [];
        for (var i = 0; i < n; i++) {
          txs.push(makeTx(i));
        }
        var b = makeBlock(txs);
        var parsed = Block.fromBuffer(b.toBuffer());
        parsed.transactions.length.should.equal(n);
      });
    });

  });

  describe('#fromRawBlock', function() {

    // fromRawBlock skips Block.Values.START_OF_BLOCK (8) bytes before
    // parsing - the magic+size prefix a raw block carries ahead of the
    // header+transactions.
    var rawBlock = Buffer.concat([new Buffer(8).fill(0), blockbuf]);

    it('should instantiate from a raw block binary string', function() {
      var x = Block.fromRawBlock(rawBlock.toString('binary'));
      x.header.version.should.equal(4);
      x.toBuffer().toString('hex').should.equal(blockhex);
    });

    it('should instantiate from raw block buffer', function() {
      var x = Block.fromRawBlock(rawBlock);
      x.header.version.should.equal(4);
      x.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#fromJSON', function() {

    it('should set these known values', function() {
      var b = Block.fromObject(JSON.parse(json));
      should.exist(b.header);
      should.exist(b.transactions);
    });

    it('should set these known values', function() {
      var b = new Block(JSON.parse(json));
      should.exist(b.header);
      should.exist(b.transactions);
    });

  });

  describe('#toJSON', function() {

    it('should recover these known values', function() {
      var b = Block.fromObject(JSON.parse(json));
      var obj = b.toJSON();
      should.exist(obj.header);
      should.exist(obj.transactions);
    });

  });

  describe('#fromString/#toString', function() {

    it('should output/input a block hex string', function() {
      var b = Block.fromString(blockhex);
      b.toString().should.equal(blockhex);
    });

  });

  describe('#fromBuffer', function() {

    it('should make a block from this known buffer', function() {
      var b = Block.fromBuffer(blockbuf);
      b.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#fromBufferReader', function() {

    it('should make a block from this known buffer', function() {
      var b = Block.fromBufferReader(BufferReader(blockbuf));
      b.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#toBuffer', function() {

    it('should recover a block from this known buffer', function() {
      var b = Block.fromBuffer(blockbuf);
      b.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#toBufferWriter', function() {

    it('should recover a block from this known buffer', function() {
      var b = Block.fromBuffer(blockbuf);
      b.toBufferWriter().concat().toString('hex').should.equal(blockhex);
    });

    it('doesn\'t create a bufferWriter if one provided', function() {
      var writer = new BufferWriter();
      var b = Block.fromBuffer(blockbuf);
      b.toBufferWriter(writer).should.equal(writer);
    });

  });

  describe('#toObject', function() {

    it('should recover a block from its own buffer', function() {
      var b = Block.fromBuffer(blockbuf);
      b.id.should.equal(block.id);
      b.toBuffer().toString('hex').should.equal(blockhex);
    });

    it('roundtrips correctly', function() {
      var b = Block.fromBuffer(blockbuf);
      var obj = b.toObject();
      var b2 = Block.fromObject(obj);
      b2.toObject().should.deep.equal(b.toObject());
    });

  });

  describe('#_getHash', function() {

    it('should return the same hash as the header', function() {
      var b = Block.fromBuffer(blockbuf);
      b._getHash().toString('hex').should.equal(b.header._getHash().toString('hex'));
    });
  });

  describe('#id', function() {

    it('should return the correct id', function() {
      var b = Block.fromBuffer(blockbuf);
      b.id.should.equal(block.id);
    });
    it('"hash" should be the same as "id"', function() {
      var b = Block.fromBuffer(blockbuf);
      b.id.should.equal(b.hash);
    });

  });

  describe('#inspect', function() {

    it('should return the correct inspect string', function() {
      var b = Block.fromBuffer(blockbuf);
      b.inspect().should.equal('<Block ' + block.id + '>');
    });

  });

  describe('#merkleRoot', function() {

    it('should describe as valid merkle root', function() {
      var x = Block.fromBuffer(blockbuf);
      var valid = x.validMerkleRoot();
      valid.should.equal(true);
    });

    it('should describe as invalid merkle root', function() {
      var x = Block.fromBuffer(blockbuf);
      x.transactions.push(new Transaction());
      var valid = x.validMerkleRoot();
      valid.should.equal(false);
    });

    it('should get a null hash merkle root', function() {
      var x = Block.fromBuffer(blockbuf);
      x.transactions = []; // empty the txs
      var mr = x.getMerkleRoot();
      mr.should.deep.equal(Block.Values.NULL_HASH);
    });

  });

});
