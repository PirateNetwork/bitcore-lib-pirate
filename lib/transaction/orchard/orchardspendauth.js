'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

function OrchardSpendAuth(params) {
  if (!(this instanceof OrchardSpendAuth)) {
    return new OrchardSpendAuth(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

OrchardSpendAuth.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var spendauth = new OrchardSpendAuth();
  return spendauth._fromObject(obj);
};

OrchardSpendAuth.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

OrchardSpendAuth.prototype.toObject = OrchardSpendAuth.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

OrchardSpendAuth.fromBufferReader = function(br) {
  var obj = new OrchardSpendAuth();
  obj.spendauthsig = br.read(64);
  return obj;
};

OrchardSpendAuth.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.spendauthsig);
  return writer;
};

module.exports = OrchardSpendAuth;
