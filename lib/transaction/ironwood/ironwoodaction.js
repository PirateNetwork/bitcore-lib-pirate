'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

// Per-action wire layout, byte-identical to ../orchard/orchardaction.js -
// Ironwood reuses the real Zcash Orchard action wire format unmodified
// (confirmed against TreasureChest's vendored zcash_primitives/orchard
// crates), just under this chain's own v6 transaction version/bundle.
function IronwoodAction(params) {
  if (!(this instanceof IronwoodAction)) {
    return new IronwoodAction(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

IronwoodAction.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var action = new IronwoodAction();
  return action._fromObject(obj);
};

IronwoodAction.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

IronwoodAction.prototype.toObject = IronwoodAction.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

IronwoodAction.fromBufferReader = function(br) {
  var obj = new IronwoodAction();
  obj.cv = br.read(32);
  obj.nullifier = br.read(32);
  obj.rk = br.read(32);
  obj.cmx = br.read(32);
  obj.ephemeralKey = br.read(32);
  obj.encCipherText = br.read(580);
  obj.outCipherText = br.read(80);
  return obj;
};

IronwoodAction.prototype.toBufferWriter = function(writer) {
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.cv);
  writer.write(this.nullifier);
  writer.write(this.rk);
  writer.write(this.cmx);
  writer.write(this.ephemeralKey);
  writer.write(this.encCipherText);
  writer.write(this.outCipherText);
  return writer;
};

module.exports = IronwoodAction;
