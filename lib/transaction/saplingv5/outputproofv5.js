'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

function OutputProofV5(params) {
  if (!(this instanceof OutputProofV5)) {
    return new OutputProofV5(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

OutputProofV5.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var outproof = new OutputProofV5();
  return outproof._fromObject(obj);
};

OutputProofV5.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

OutputProofV5.prototype.toObject = OutputProofV5.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

OutputProofV5.fromBufferReader = function(br) {
  var obj = new OutputProofV5();
  obj.proof = br.read(192);
  return obj;
};

OutputProofV5.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.proof);
  return writer;
};

module.exports = OutputProofV5;
