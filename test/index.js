'use strict';

var should = require('chai').should();
var bitcore = require('../');

describe('#versionGuard', function() {
  it('global._bitcore should be defined', function() {
    should.equal(global._bitcore, bitcore.version);
  });

  // The actual throw in index.js's versionGuard() is currently commented
  // out ("put this back if we start versioning again"), so this only
  // checks the guard doesn't error out on its own, not that it enforces
  // anything yet.
  it('does not throw while version enforcement is disabled', function() {
    (function() {
      bitcore.versionGuard('version');
    }).should.not.throw();
  });
});
