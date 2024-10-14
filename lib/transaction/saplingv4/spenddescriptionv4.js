'use strict';

var _ = require('lodash');
var $ = require('../util/preconditions');
var BN = require('../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../encoding/bufferwriter');
var BufferUtil = require('../util/buffer');
var JSUtil = require('../util/js');

function SpendDescriptionV4(params) {
  if (!(this instanceof SpendDescriptionV4)) {
    return new SpendDescriptionV4(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

SpendDescriptionV4.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var spenddesc = new SpendDescriptionV4();
  return spenddesc._fromObject(obj);
};

SpendDescriptionV4.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

SpendDescriptionV4.prototype.toObject = SpendDescriptionV4.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

SpendDescriptionV4.fromBufferReader = function(br) {
  var obj = new SpendDescriptionV4();
  obj.cv = br.read(32);
  obj.anchor = br.read(32);
  obj.nullifier = br.read(32);
  obj.rk = br.read(32);
  obj.proof = br.read(48 + 96 + 48);
  obj.spendAuthSig = br.read(64);
  return obj;
};

SpendDescriptionV4.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.cv);
  writer.write(this.anchor);
  writer.write(this.nullifier);
  writer.write(this.rk);
  writer.write(this.proof);
  writer.write(this.spendAuthSig);
  return writer;
};

module.exports = SpendDescriptionV4;
