'use strict';

// v6 (Ironwood) txid computation - the BLAKE2b/ZIP-244-style digest tree
// TreasureChest's dev-ironwood branch uses for this version, traced to
// exact byte level from the vendored zcash_primitives/orchard crates
// (transaction/txid.rs, bundle/commitments.rs). This is only reachable
// for version 6; v1-v4 keep the existing legacy double-SHA256 hash
// (Transaction.prototype._getHash), and v5 (Orchard) never occurs on
// this chain's real history (rejected outright at parse time).
//
// Root: one BLAKE2b-256 call, personal = "ZcashTxHash_" (12B) +
// consensusBranchId as LE u32 (4B), input = 5 concatenated 32-byte
// branch digests in order: header, transparent, sapling(-or-empty),
// orchard-placeholder(-or-empty), ironwood(-or-empty).
//
// Not implemented: auth_commitment()/wtxid - a separate, parallel
// output from the same tx data (confirmed independent of txid
// computation), not consumed anywhere in this project's actual call
// paths.

var BufferUtil = require('../../util/buffer');
var BufferWriter = require('../../encoding/bufferwriter');
var blake2b256 = require('../../crypto/blake2b244');

function u32le(n) {
  var buf = Buffer.alloc(4);
  buf.writeUInt32LE(n >>> 0, 0);
  return buf;
}

function i64le(bn) {
  // Accepts a BN (unsigned) or BigInt (signed) - both produce the same
  // raw 8-byte LE pattern for any realistic (well below 2^63) value,
  // which is all that's ever relayed/stored as an actual valueBalance.
  var buf = Buffer.alloc(8);
  if (typeof bn === 'bigint') {
    buf.writeBigInt64LE(bn, 0);
  } else {
    new BufferWriter().writeUInt64LEBN(bn).toBuffer().copy(buf);
  }
  return buf;
}

function headerDigest(tx) {
  // fOverwintered is always true for a v6 tx (it's the only way to reach
  // this branch at all), so bit 31 is always set.
  var versionHeader = u32le(0x80000000 + tx.version);
  return blake2b256('ZTxIdHeadersHash', [
    versionHeader,
    u32le(tx.nVersionGroupId),
    u32le(tx.nConsensusBranchID),
    u32le(tx.nLockTime),
    u32le(tx.nExpiryHeight)
  ]);
}

function prevoutsDigest(inputs) {
  var bufs = [];
  inputs.forEach(function(input) {
    // input.prevTxId is stored reversed (bitcore's display-oriented
    // convention, see Input.fromBufferReader) - the digest needs the
    // real wire-order bytes, same as what toBufferWriter physically
    // serializes via writeReverse().
    bufs.push(BufferUtil.reverse(input.prevTxId));
    bufs.push(u32le(input.outputIndex));
  });
  return blake2b256('ZTxIdPrevoutHash', bufs);
}

function sequenceDigest(inputs) {
  return blake2b256('ZTxIdSequencHash', inputs.map(function(input) {
    return u32le(input.sequenceNumber);
  }));
}

function outputsDigest(outputs) {
  return blake2b256('ZTxIdOutputsHash', outputs.map(function(output) {
    return output.toBufferWriter().toBuffer();
  }));
}

function transparentDigest(tx) {
  if (tx.inputs.length === 0 && tx.outputs.length === 0) {
    return blake2b256('ZTxIdTranspaHash');
  }
  return blake2b256('ZTxIdTranspaHash', [
    prevoutsDigest(tx.inputs),
    sequenceDigest(tx.inputs),
    outputsDigest(tx.outputs)
  ]);
}

function saplingSpendsDigest(spendDescs) {
  if (spendDescs.length === 0) {
    return blake2b256('ZTxIdSSpendsHash');
  }
  var compact = blake2b256('ZTxIdSSpendCHash', spendDescs.map(function(s) {
    return s.nullifier;
  }));
  // v6: anchor is dropped from the noncompact spend hash entirely
  // (present pre-v6, moved to the auth digest for v6 - see txid.rs's
  // `write_anchor = false` for TxVersion::V6). Personalization also
  // changes for v6 specifically ("ZTxIdSSpendNH_v6" vs pre-v6's
  // "ZTxIdSSpendNHash").
  var noncompact = blake2b256('ZTxIdSSpendNH_v6', spendDescs.map(function(s) {
    return Buffer.concat([s.cv, s.rk]);
  }));
  return blake2b256('ZTxIdSSpendsHash', [compact, noncompact]);
}

function saplingOutputsDigest(outputDescs) {
  if (outputDescs.length === 0) {
    return blake2b256('ZTxIdSOutputHash');
  }
  var compact = blake2b256('ZTxIdSOutC__Hash', outputDescs.map(function(o) {
    return Buffer.concat([o.cmu, o.ephemeralKey, o.encCipherText.slice(0, 52)]);
  }));
  var memos = blake2b256('ZTxIdSOutM__Hash', outputDescs.map(function(o) {
    return o.encCipherText.slice(52, 564);
  }));
  var noncompact = blake2b256('ZTxIdSOutN__Hash', outputDescs.map(function(o) {
    return Buffer.concat([o.cv, o.encCipherText.slice(564), o.outCipherText]);
  }));
  return blake2b256('ZTxIdSOutputHash', [compact, memos, noncompact]);
}

function saplingDigest(tx) {
  if (tx.spendDescsV5.length === 0 && tx.outputDescsV5.length === 0) {
    return blake2b256('ZTxIdSaplingHash');
  }
  return blake2b256('ZTxIdSaplingHash', [
    saplingSpendsDigest(tx.spendDescsV5),
    saplingOutputsDigest(tx.outputDescsV5),
    i64le(tx.valueBalance)
  ]);
}

// Shared by both the Orchard placeholder slot and the real Ironwood
// bundle - both use the identical action layout/3-way split, just under
// different personalization strings (see ORCHARD_V6/IRONWOOD_V6 tables
// below).
function bundleDigest(bundle, personalizations) {
  if (!bundle || bundle.actions.length === 0) {
    return blake2b256(personalizations.bundle);
  }
  var compact = blake2b256(personalizations.compact, bundle.actions.map(function(a) {
    return Buffer.concat([a.nullifier, a.cmx, a.ephemeralKey, a.encCipherText.slice(0, 52)]);
  }));
  var memos = blake2b256(personalizations.memos, bundle.actions.map(function(a) {
    return a.encCipherText.slice(52, 564);
  }));
  var noncompact = blake2b256(personalizations.noncompact, bundle.actions.map(function(a) {
    return Buffer.concat([a.cv, a.rk, a.encCipherText.slice(564), a.outCipherText]);
  }));
  return blake2b256(personalizations.bundle, [
    compact,
    memos,
    noncompact,
    bundle.flags,
    i64le(bundle.valueBalance)
    // no anchor - moved to the auth digest for v6 (not computed here,
    // see module header comment)
  ]);
}

var IRONWOOD_V6_PERSONALIZATIONS = {
  bundle: 'ZTxIdIronwd_H_v6',
  compact: 'ZTxIdIrnActCH_v6',
  memos: 'ZTxIdIrnActMH_v6',
  noncompact: 'ZTxIdIrnActNH_v6'
};

var ORCHARD_V6_PERSONALIZATIONS = {
  bundle: 'ZTxIdOrchardH_v6',
  compact: 'ZTxIdOrcActCHash',
  memos: 'ZTxIdOrcActMHash',
  noncompact: 'ZTxIdOrcActNHash'
};

function orchardPlaceholderDigest(tx) {
  if (tx.orchardPlaceholder && tx.orchardPlaceholder.actions.length > 0) {
    // Never observed non-empty on this chain (the real Orchard pool
    // slot is mandatory-but-always-empty for Ironwood transactions) -
    // rather than compute an untested code path with no ground truth
    // to validate against, fail loudly instead of silently risking a
    // wrong txid.
    throw new Error('Non-empty Orchard placeholder bundle is not supported');
  }
  return bundleDigest(null, ORCHARD_V6_PERSONALIZATIONS);
}

function ironwoodDigest(tx) {
  return bundleDigest(tx.ironwoodBundle, IRONWOOD_V6_PERSONALIZATIONS);
}

module.exports = function computeTxIdV6(tx) {
  var personal = Buffer.alloc(16);
  Buffer.from('ZcashTxHash_', 'ascii').copy(personal, 0);
  personal.writeUInt32LE(tx.nConsensusBranchID >>> 0, 12);

  return blake2b256(personal, [
    headerDigest(tx),
    transparentDigest(tx),
    saplingDigest(tx),
    orchardPlaceholderDigest(tx),
    ironwoodDigest(tx)
  ]);
};
