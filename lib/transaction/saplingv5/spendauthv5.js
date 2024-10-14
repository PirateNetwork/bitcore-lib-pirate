'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

function SpendAuthV5(params) {
  if (!(this instanceof SpendAuthV5)) {
    return new SpendAuthV5(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

SpendAuthV5.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var spendauth = new SpendAuthV5();
  return spendauth._fromObject(obj);
};

SpendAuthV5.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

SpendAuthV5.prototype.toObject = SpendAuthV5.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

SpendAuthV5.fromBufferReader = function(br) {
  var obj = new SpendAuthV5();
  obj.spendauthsig = br.read(64);
  return obj;
};

SpendAuthV5.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.spendauthsig);
  return writer;
};

module.exports = SpendAuthV5;
