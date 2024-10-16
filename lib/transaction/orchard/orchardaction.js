'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

function OrchardAction(params) {
  if (!(this instanceof OrchardAction)) {
    return new OrchardAction(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

OrchardAction.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var outputdesc = new OrchardAction();
  return outputdesc._fromObject(obj);
};

OrchardAction.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

OrchardAction.prototype.toObject = OrchardAction.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

OrchardAction.fromBufferReader = function(br) {
  var obj = new OrchardAction();
  obj.cv = br.read(32);
  obj.nullifier = br.read(32);
  obj.rk = br.read(32);
  obj.cmx = br.read(32);
  obj.ephemeralKey = br.read(32);
  obj.encCipherText = br.read(580);
  obj.outCipherText = br.read(80);
  return obj;
};

OrchardAction.prototype.toBufferWriter = function(writer) {
  var i;
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

module.exports = OrchardAction;
