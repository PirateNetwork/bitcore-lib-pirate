'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

function OrchardProofs(params) {
  if (!(this instanceof OrchardProofs)) {
    return new OrchardProofs(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

OrchardProofs.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var proofs = new OrchardProofs();
  return proofs._fromObject(obj);
};

OrchardProofs.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

OrchardProofs.prototype.toObject = OrchardProofs.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

OrchardProofs.fromBufferReader = function(br, n) {
  var obj = new OrchardProofs();
  obj.orchardproofs = br.read(n);
  return obj;
};

OrchardProofs.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.orchardproofs);
  return writer;
};

module.exports = OrchardProofs;
