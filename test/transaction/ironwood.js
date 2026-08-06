'use strict';

var should = require('chai').should();
var fs = require('fs');
var path = require('path');

var bitcore = require('../..');
var Transaction = bitcore.Transaction;

// Ground-truth fixtures: real v6 (Ironwood) transactions constructed and
// serialized by TreasureChest's actual vendored Rust zcash_primitives/
// orchard crates (BranchId::Nu6_3 - the Ironwood/NU6.3 network upgrade),
// with their real tx.txid() captured alongside. Not hand-derived - if
// bitcore's parsing, serialization, or txid computation disagrees with
// these by even one byte, that's a real incompatibility with the actual
// chain, not a fixture-authoring mistake to paper over.
//
// Generated via a throwaway (uncommitted, already reverted) test added
// to librustzcash/zcash_primitives/src/transaction/tests.rs, reusing
// that crate's own existing v6 test helpers (test_ironwood_bundle,
// test_sapling_bundle, TransactionData::from_parts_v6) rather than
// hand-rolling Rust construction code.
function loadFixture(name) {
  var contents = fs.readFileSync(path.join(__dirname, '..', 'data', 'ironwood', name), 'utf8');
  var lines = contents.trim().split('\n');
  var bytes = Buffer.from(lines[0].split('=')[1], 'hex');
  var txid = lines[1].split('=')[1];
  return {bytes: bytes, txid: txid};
}

var FIXTURES = {
  'empty (no transparent/shielded data)': loadFixture('fixture-empty.txt'),
  'transparent-only (2 inputs, 1 output)': loadFixture('fixture-transparent.txt'),
  'Sapling bundle (29 spends, 15 outputs)': loadFixture('fixture-sapling.txt'),
  'Ironwood bundle (1 action)': loadFixture('fixture-ironwood.txt')
};

describe('Transaction (v6 / Ironwood)', function() {

  Object.keys(FIXTURES).forEach(function(name) {
    describe(name, function() {
      var fixture = FIXTURES[name];

      it('parses without error and recognizes version 6', function() {
        var tx = new Transaction(fixture.bytes);
        tx.version.should.equal(6);
        tx.fOverwintered.should.equal(true);
      });

      it('round-trips to the exact original bytes', function() {
        var tx = new Transaction(fixture.bytes);
        tx.toBuffer().equals(fixture.bytes).should.equal(true);
      });

      it('computes the real chain txid', function() {
        var tx = new Transaction(fixture.bytes);
        tx.hash.should.equal(fixture.txid);
        tx.id.should.equal(fixture.txid);
      });
    });
  });

  describe('Sapling bundle fixture', function() {
    it('parses the expected number of spends/outputs', function() {
      var tx = new Transaction(FIXTURES['Sapling bundle (29 spends, 15 outputs)'].bytes);
      tx.spendDescsV5.length.should.equal(29);
      tx.outputDescsV5.length.should.equal(15);
      tx.orchardPlaceholder.isEmpty().should.equal(true);
      tx.ironwoodBundle.isEmpty().should.equal(true);
    });
  });

  describe('Ironwood bundle fixture', function() {
    it('parses one action and the always-empty Orchard placeholder', function() {
      var tx = new Transaction(FIXTURES['Ironwood bundle (1 action)'].bytes);
      tx.ironwoodBundle.actions.length.should.equal(1);
      tx.ironwoodBundle.actions[0].cv.length.should.equal(32);
      tx.ironwoodBundle.actions[0].encCipherText.length.should.equal(580);
      tx.ironwoodBundle.actions[0].outCipherText.length.should.equal(80);
      tx.spendDescsV5.length.should.equal(0);
      tx.orchardPlaceholder.isEmpty().should.equal(true);
    });
  });

  describe('transparent-only fixture', function() {
    it('parses inputs/outputs with correct prevout byte order', function() {
      var tx = new Transaction(FIXTURES['transparent-only (2 inputs, 1 output)'].bytes);
      tx.inputs.length.should.equal(2);
      tx.outputs.length.should.equal(1);
      // The wire-order prevout hash was 0x11 repeated 32 times; bitcore
      // stores prevTxId reversed (display order) - if the digest code's
      // own un-reversal were wrong, the txid check above would already
      // have failed, but this pins the parsed representation too.
      tx.inputs[0].prevTxId.toString('hex').should.equal('11'.repeat(32));
      tx.inputs[0].outputIndex.should.equal(0);
      tx.inputs[1].prevTxId.toString('hex').should.equal('22'.repeat(32));
      tx.inputs[1].outputIndex.should.equal(3);
      tx.outputs[0].satoshis.should.equal(123456789);
    });
  });

});
