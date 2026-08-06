'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BufferWriter = require('../../encoding/bufferwriter');
var IronwoodAction = require('./ironwoodaction');

// Full Ironwood bundle wire layout (see TreasureChest's vendored
// zcash_primitives/orchard crates, dev-ironwood branch):
//
//   COMPACTSIZE numActions
//   numActions * IronwoodAction                (820 bytes each)
//   -- if numActions == 0, nothing further --
//   flags          1 byte
//   valueBalance   8 bytes, SIGNED i64 LE
//   anchor         32 bytes
//   COMPACTSIZE proof-length, then proof bytes (variable)
//   numActions * spendAuthSig                  (64 bytes each)
//   bindingSig     64 bytes
//
// valueBalance is genuinely signed (net shielded pool inflow/outflow) and
// used as raw signed-LE bytes in the txid digest, so it's read/written as
// a native BigInt (via Buffer's readBigInt64LE/writeBigInt64LE) rather
// than the unsigned BN this codebase's existing Sapling valueBalance
// fields use elsewhere - this is new code, not a change to those.
function IronwoodBundle(params) {
  if (!(this instanceof IronwoodBundle)) {
    return new IronwoodBundle(params);
  }
  this.actions = [];
  this.flags = null;
  this.valueBalance = 0n;
  this.anchor = null;
  this.proof = null;
  this.spendAuthSigs = [];
  this.bindingSig = null;
  if (params) {
    return this._fromObject(params);
  }
}

IronwoodBundle.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var bundle = new IronwoodBundle();
  return bundle._fromObject(obj);
};

IronwoodBundle.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

IronwoodBundle.prototype.toObject = IronwoodBundle.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

IronwoodBundle.prototype.isEmpty = function() {
  return this.actions.length === 0;
};

IronwoodBundle.fromBufferReader = function(br) {
  var obj = new IronwoodBundle();
  var numActions = br.readVarintNum();
  for (var i = 0; i < numActions; i++) {
    obj.actions.push(IronwoodAction.fromBufferReader(br));
  }
  if (numActions > 0) {
    obj.flags = br.read(1);
    obj.valueBalance = br.read(8).readBigInt64LE(0);
    obj.anchor = br.read(32);
    var proofLen = br.readVarintNum();
    obj.proof = br.read(proofLen);
    for (var j = 0; j < numActions; j++) {
      obj.spendAuthSigs.push(br.read(64));
    }
    obj.bindingSig = br.read(64);
  }
  return obj;
};

IronwoodBundle.prototype.toBufferWriter = function(writer) {
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.writeVarintNum(this.actions.length);
  for (var i = 0; i < this.actions.length; i++) {
    this.actions[i].toBufferWriter(writer);
  }
  if (this.actions.length > 0) {
    writer.write(this.flags);
    var valueBalanceBuf = Buffer.alloc(8);
    valueBalanceBuf.writeBigInt64LE(BigInt(this.valueBalance), 0);
    writer.write(valueBalanceBuf);
    writer.write(this.anchor);
    writer.writeVarintNum(this.proof.length);
    writer.write(this.proof);
    for (var j = 0; j < this.spendAuthSigs.length; j++) {
      writer.write(this.spendAuthSigs[j]);
    }
    writer.write(this.bindingSig);
  }
  return writer;
};

module.exports = IronwoodBundle;
