'use strict';

var should = require('chai').should();
var bitcore = require('../../..');
var Transaction = bitcore.Transaction;
var PrivateKey = bitcore.PrivateKey;

describe('PublicKeyInput', function() {

  // address/scriptPubKey below are derived together from privateKey two
  // lines down (a fresh testnet key under this fork's real network
  // prefixes - see lib/networks.js): address = privateKey.toAddress(),
  // scriptPubKey = P2PK output paying privateKey.toPublicKey(). The
  // original upstream Bitcoin fixture had an unrelated Bitcoin-testnet
  // WIF/address/scriptPubKey trio that no longer decodes under this
  // fork's real prefixes, and whose scriptPubKey pubkey didn't match its
  // own privateKey to begin with.
  var utxo = {
    txid: '7f3b688cb224ed83e12d9454145c26ac913687086a0a62f2ae0bc10934a4030f',
    vout: 0,
    address: '1NxC45s5q1PiKFVjAxpTpXre2ZisNVLcFV',
    scriptPubKey: '2103574f14b2938567d23d48ede193b08a26cc48be88ffabf0d55ad0ba66209da6a2ac',
    amount: 50,
    confirmations: 104,
    spendable: true
  };
  var privateKey = PrivateKey.fromWIF('Ky67dqs3JxVUHZ7BLJ8JZbkNPANmdPmvUMSX21Qx88sYRNurSh5h');
  var address = privateKey.toAddress();
  utxo.address.should.equal(address.toString());

  var destKey = new PrivateKey();

  it('will correctly sign a publickey out transaction', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    tx.sign(privateKey);
    tx.inputs[0].script.toBuffer().length.should.be.above(0);
  });

  it('count can count missing signatures', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    input.isFullySigned().should.equal(false);
    tx.sign(privateKey);
    input.isFullySigned().should.equal(true);
  });

  it('it\'s size can be estimated', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    input._estimateSize().should.equal(73);
  });

  it('it\'s signature can be removed', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    tx.sign(privateKey);
    input.isFullySigned().should.equal(true);
    input.clearSignatures();
    input.isFullySigned().should.equal(false);
  });

  it('returns an empty array if private key mismatches', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    var signatures = input.getSignatures(tx, new PrivateKey(), 0);
    signatures.length.should.equal(0);
  });

});
