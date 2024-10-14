'use strict';

var _ = require('lodash');
var $ = require('../../util/preconditions');
var BN = require('../../crypto/bn');
var buffer = require('buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var BufferUtil = require('../../util/buffer');
var JSUtil = require('../../util/js');

// Sapling note magic values, copied from src/zcash/Zcash.h
var NOTEENCRYPTION_AUTH_BYTES = 16;
var ZC_NOTEPLAINTEXT_LEADING = 1;
var ZC_V_SIZE = 8;
var ZC_RHO_SIZE = 32;
var ZC_R_SIZE = 32;
var ZC_MEMO_SIZE = 512;
var ZC_DIVERSIFIER_SIZE = 11;
var ZC_JUBJUB_POINT_SIZE = 32;
var ZC_JUBJUB_SCALAR_SIZE = 32;
var ZC_NOTEPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_V_SIZE + ZC_RHO_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
var ZC_SAPLING_ENCPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_DIVERSIFIER_SIZE + ZC_V_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
var ZC_SAPLING_OUTPLAINTEXT_SIZE = ZC_JUBJUB_POINT_SIZE + ZC_JUBJUB_SCALAR_SIZE;
var ZC_SAPLING_ENCCIPHERTEXT_SIZE = ZC_SAPLING_ENCPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
var ZC_SAPLING_OUTCIPHERTEXT_SIZE = ZC_SAPLING_OUTPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;

function OutputDescriptionV5(params) {
  if (!(this instanceof OutputDescriptionV5)) {
    return new OutputDescriptionV5(params);
  }
  if (params) {
    return this._fromObject(params);
  }
}

OutputDescriptionV5.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var outputdesc = new OutputDescriptionV5();
  return outputdesc._fromObject(obj);
};

OutputDescriptionV5.prototype._fromObject = function(params) {
  // TODO: Populate from parameters, but for now it's ok to do nothing.
  return this;
};

OutputDescriptionV5.prototype.toObject = OutputDescriptionV5.prototype.toJSON = function toObject() {
  // TODO: Populate JSON object, but for now it's ok to return a placeholder.
  var obj = {};
  return obj;
};

OutputDescriptionV5.fromBufferReader = function(br) {
  var obj = new OutputDescriptionV5();
  obj.cv = br.read(32);
  obj.cmu = br.read(32);
  obj.ephemeralKey = br.read(32);
  obj.encCipherText = br.read(ZC_SAPLING_ENCCIPHERTEXT_SIZE);
  obj.outCipherText = br.read(ZC_SAPLING_OUTCIPHERTEXT_SIZE);
  return obj;
};

OutputDescriptionV5.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.write(this.cv);
  writer.write(this.cmu);
  writer.write(this.ephemeralKey);
  writer.write(this.encCipherText);
  writer.write(this.outCipherText);
  return writer;
};

module.exports = OutputDescriptionV5;
