'use strict';

var blake2b = require('blake2b');
var $ = require('../util/preconditions');

// Thin wrapper around the `blake2b` npm package for the personalized
// BLAKE2b-256 hashing ZIP-244 (and this fork's Ironwood extension of it)
// uses throughout its txid digest tree - every call in that tree is
// "32-byte output, no key, no salt, exactly one 16-byte personalization
// string," so this only exposes that one shape rather than the
// underlying package's full API.
var OUTPUT_LENGTH = 32;
var PERSONAL_LENGTH = 16;

/**
 * @param {Buffer|string} personal - exactly 16 bytes (a literal ASCII
 *   personalization string, e.g. 'ZTxIdIronwd_H_v6', or a Buffer already
 *   built from one, e.g. a 12-byte prefix + 4-byte branch id)
 * @param {Buffer[]} [buffers] - concatenated (in array order) as the hash
 *   input; omit/empty for a personalization-only ("empty bundle") digest
 * @returns {Buffer} 32-byte digest
 */
function blake2b256 (personal, buffers) {
  if (typeof personal === 'string') {
    personal = Buffer.from(personal, 'ascii');
  }
  $.checkArgument(Buffer.isBuffer(personal) && personal.length === PERSONAL_LENGTH,
    'personal must be exactly ' + PERSONAL_LENGTH + ' bytes');

  var hasher = blake2b(OUTPUT_LENGTH, null, null, personal);
  (buffers || []).forEach(function(buf) {
    $.checkArgument(Buffer.isBuffer(buf), 'each input must be a Buffer');
    hasher.update(buf);
  });
  return Buffer.from(hasher.digest());
}

module.exports = blake2b256;
