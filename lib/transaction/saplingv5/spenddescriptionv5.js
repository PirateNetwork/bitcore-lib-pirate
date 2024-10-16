'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

function SpendDescriptionV5(params) {
  if (!(this instanceof SpendDescriptionV5)) {
    return new SpendDescriptionV5(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

SpendDescriptionV5.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var spenddesc = new SpendDescriptionV5();
  return spenddesc._fromObject(obj);
};

SpendDescriptionV5.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

SpendDescriptionV5.prototype.toObject = SpendDescriptionV5.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

SpendDescriptionV5.fromBufferReader = function(br) {
  var obj = new SpendDescriptionV5();
  obj.cv = br.read(32);
  obj.nullifier = br.read(32);
  obj.rk = br.read(32);
  return obj;
};

SpendDescriptionV5.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.cv);
  writer.write(this.nullifier);
  writer.write(this.rk);
  return writer;
};

module.exports = SpendDescriptionV5;
