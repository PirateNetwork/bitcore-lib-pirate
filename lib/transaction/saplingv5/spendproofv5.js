'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

function SpendProofV5(params) {
  if (!(this instanceof SpendProofV5)) {
    return new SpendProofV5(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

SpendProofV5.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var spendproof = new SpendProofV5();
  return spendproof._fromObject(obj);
};

SpendProofV5.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

SpendProofV5.prototype.toObject = SpendProofV5.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

SpendProofV5.fromBufferReader = function(br) {
  var obj = new SpendProofV5();
  obj.proof = br.read(192);
  return obj;
};

SpendProofV5.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.proof);
  return writer;
};

module.exports = SpendProofV5;
