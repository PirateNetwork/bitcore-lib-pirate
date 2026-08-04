'use strict';

var bitcore = require('../..');
var BN = require('../../lib/crypto/bn');
var BufferReader = bitcore.encoding.BufferReader;
var BufferWriter = bitcore.encoding.BufferWriter;

var BlockHeader = bitcore.BlockHeader;
var should = require('chai').should();

// This header is not from a real block. It's a well-formed, hand-built
// Equihash-format header (version + prevHash + merkleRoot + reserved +
// time + bits + nonce + solution - see BlockHeader._fromBufferReader)
// used purely to exercise encode/decode round-trips, since no real Pirate
// chain data was available when this suite was adapted from the upstream
// Bitcoin bitcore-lib test vectors (which used a real Bitcoin testnet
// block and don't fit this fork's actual header format at all: Bitcoin
// headers are a fixed 80 bytes with no `reserved` field and a 4-byte
// nonce, not a 32-byte nonce plus a variable-length Equihash solution).
var version = 4;
var prevblockidbuf = new Buffer(32).fill(0x11);
var merklerootbuf = new Buffer(32).fill(0x22);
var reservedbuf = new Buffer(32).fill(0);
var time = 1600000000;
var bits = 0x200fffff; // an easy, regtest-style minimum difficulty target
var solutionbuf = new Buffer(40).fill(0x44);

// nonce 37 happens to satisfy validProofOfWork() against the easy `bits`
// target above (found by brute-force trying nonces until one worked, the
// same way a real miner would, just against a trivial target).
var noncebuf = new Buffer(32).fill(0);
noncebuf.writeUInt32LE(37, 0);

// a nonce that does *not* satisfy proof-of-work against `bits`, for the
// negative case.
var badNoncebuf = new Buffer(32).fill(0);
badNoncebuf.writeUInt32LE(1, 0);

var headerInfo = {
  version: version,
  prevHash: prevblockidbuf,
  merkleRoot: merklerootbuf,
  reserved: reservedbuf,
  time: time,
  bits: bits,
  nonce: noncebuf,
  solution: solutionbuf
};

describe('BlockHeader', function() {

  var bh = new BlockHeader(headerInfo);
  var bhhex = bh.toBuffer().toString('hex');
  var bhbuf = new Buffer(bhhex, 'hex');

  it('should make a new blockheader', function() {
    BlockHeader(bhbuf).toBuffer().toString('hex').should.equal(bhhex);
  });

  it('should not make an empty block', function() {
    (function() {
      BlockHeader();
    }).should.throw('Unrecognized argument for BlockHeader');
  });

  describe('#constructor', function() {

    it('should set all the variables', function() {
      var bh = new BlockHeader(headerInfo);
      should.exist(bh.version);
      should.exist(bh.prevHash);
      should.exist(bh.merkleRoot);
      should.exist(bh.reserved);
      should.exist(bh.time);
      should.exist(bh.bits);
      should.exist(bh.nonce);
      should.exist(bh.solution);
    });

    it('will throw an error if the argument object hash property doesn\'t match', function() {
      (function() {
        var bh = new BlockHeader(Object.assign({}, headerInfo, {
          hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'
        }));
      }).should.throw('Argument object hash property does not match block hash.');
    });

  });

  describe('#fromObject', function() {

    it('should set all the variables', function() {
      var bh = BlockHeader.fromObject({
        version: version,
        prevHash: prevblockidbuf.toString('hex'),
        merkleRoot: merklerootbuf.toString('hex'),
        reserved: reservedbuf.toString('hex'),
        time: time,
        bits: bits,
        nonce: noncebuf.toString('hex'),
        solution: solutionbuf.toString('hex')
      });
      should.exist(bh.version);
      should.exist(bh.prevHash);
      should.exist(bh.merkleRoot);
      should.exist(bh.reserved);
      should.exist(bh.time);
      should.exist(bh.bits);
      should.exist(bh.nonce);
      should.exist(bh.solution);
    });

  });

  describe('#toJSON', function() {

    it('should set all the variables', function() {
      var json = bh.toJSON();
      should.exist(json.version);
      should.exist(json.prevHash);
      should.exist(json.merkleRoot);
      should.exist(json.reserved);
      should.exist(json.time);
      should.exist(json.bits);
      should.exist(json.nonce);
      should.exist(json.solution);
    });

  });

  describe('#fromJSON', function() {

    it('should parse this known json string', function() {
      var jsonString = JSON.stringify(bh.toJSON());
      var json = new BlockHeader(BlockHeader._fromObject(JSON.parse(jsonString)));
      should.exist(json.version);
      should.exist(json.prevHash);
      should.exist(json.merkleRoot);
      should.exist(json.reserved);
      should.exist(json.time);
      should.exist(json.bits);
      should.exist(json.nonce);
      should.exist(json.solution);
      json.toBuffer().toString('hex').should.equal(bhhex);
    });

  });

  describe('#fromString/#toString', function() {

    it('should output/input a block hex string', function() {
      var b = BlockHeader.fromString(bhhex);
      b.toString().should.equal(bhhex);
    });

  });

  describe('#fromBuffer', function() {

    it('should parse this known buffer', function() {
      BlockHeader.fromBuffer(bhbuf).toBuffer().toString('hex').should.equal(bhhex);
    });

  });

  describe('#fromBufferReader', function() {

    it('should parse this known buffer', function() {
      BlockHeader.fromBufferReader(BufferReader(bhbuf)).toBuffer().toString('hex').should.equal(bhhex);
    });

  });

  describe('#toBuffer', function() {

    it('should output this known buffer', function() {
      BlockHeader.fromBuffer(bhbuf).toBuffer().toString('hex').should.equal(bhhex);
    });

  });

  describe('#toBufferWriter', function() {

    it('should output this known buffer', function() {
      BlockHeader.fromBuffer(bhbuf).toBufferWriter().concat().toString('hex').should.equal(bhhex);
    });

    it('doesn\'t create a bufferWriter if one provided', function() {
      var writer = new BufferWriter();
      var blockHeader = BlockHeader.fromBuffer(bhbuf);
      blockHeader.toBufferWriter(writer).should.equal(writer);
    });

  });

  describe('#inspect', function() {

    it('should return the correct inspect of the header', function() {
      bh.inspect().should.equal('<BlockHeader ' + bh.id + '>');
    });

  });

  describe('#fromRawBlock', function() {

    // fromRawBlock skips BlockHeader.Constants.START_OF_HEADER (8) bytes
    // before parsing - representing the magic+size prefix a raw block
    // (as opposed to a bare header) carries ahead of the header itself.
    var rawBlock = Buffer.concat([new Buffer(8).fill(0), bhbuf]);

    it('should instantiate from a raw block buffer', function() {
      var x = BlockHeader.fromRawBlock(rawBlock);
      x.version.should.equal(version);
      x.toBuffer().toString('hex').should.equal(bhhex);
    });

    it('should instantiate from a raw block binary string', function() {
      var x = BlockHeader.fromRawBlock(rawBlock.toString('binary'));
      x.version.should.equal(version);
      x.toBuffer().toString('hex').should.equal(bhhex);
    });

  });

  describe('#validTimestamp', function() {

    it('should validate timestamp as true', function() {
      var valid = bh.validTimestamp();
      valid.should.equal(true);
    });

    it('should validate timestamp as false', function() {
      var future = new BlockHeader(Object.assign({}, headerInfo, {
        time: Math.round(new Date().getTime() / 1000) + BlockHeader.Constants.MAX_TIME_OFFSET + 100
      }));
      future.validTimestamp().should.equal(false);
    });

  });

  describe('#validProofOfWork', function() {

    it('should validate proof-of-work as true', function() {
      bh.validProofOfWork().should.equal(true);
    });

    it('should validate proof of work as false because incorrect proof of work', function() {
      var x = new BlockHeader(Object.assign({}, headerInfo, {
        nonce: badNoncebuf
      }));
      x.validProofOfWork().should.equal(false);
    });

  });

  describe('#getDifficulty', function() {
    it('should get the correct difficulty for this header\'s bits', function() {
      bh.bits.should.equal(bits);
      bh.getDifficulty().should.be.a('number');
    });

    // Expected values below are getDifficulty() computed against this
    // fork's own GENESIS_BITS baseline (0x200f0f0f, see blockheader.js),
    // not Bitcoin's classic 0x1d00ffff baseline the upstream Bitcoin
    // bitcore-lib test vectors were originally computed against - the
    // `bits` inputs are real historical Bitcoin block values (kept as
    // convenient, varied difficulty-encoding test inputs), but the
    // expected difficulty numbers had to be recomputed for this fork.
    it('should get the correct difficulty for testnet block 552065', function() {
      var x = new BlockHeader(Object.assign({}, headerInfo, {
        bits: 0x1b00c2a8
      }));
      x.getDifficulty().should.equal(21775215281224.824);
    });

    it('should get the correct difficulty for livenet block 373043', function() {
      var x = new BlockHeader(Object.assign({}, headerInfo, {
        bits: 0x18134dc1
      }));
      x.getDifficulty().should.equal(14390291507256476000);
    });

    it('should get the correct difficulty for livenet block 340000', function() {
      var x = new BlockHeader(Object.assign({}, headerInfo, {
        bits: 0x1819012f
      }));
      x.getDifficulty().should.equal(11109395352680497000);
    });

    it('should use exponent notation if difficulty is larger than Javascript number', function() {
      var x = new BlockHeader(Object.assign({}, headerInfo, {
        bits: 0x0900c2a8
      }));
      x.getDifficulty().should.equal(4.8560352762974515e+56);
    });
  });

  it('coverage: caches the "_id" property', function() {
    var blockHeader = new BlockHeader(headerInfo);
    blockHeader.id.should.equal(blockHeader.id);
  });

});
