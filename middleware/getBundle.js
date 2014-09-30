'use strict';

var browserify = require('browserify');
var watchify = require('watchify');
var path = require('path');
var log = require('bole')('getBundle');

var bundle;

function setup(callback) {
  var b = browserify({
    cache: {},
    packageCache: {},
    fullPaths: true,
    debug: true
  });

  b.add(path.resolve(__dirname, '..', 'frontend', 'scripts', 'main.js'));

  var w = watchify(b);

  w.on('bundle', function (bundleStream) {
    log.info('Compiling bundle.');

    var temp = '';
    var t0 = Date.now();

    bundleStream.on('data', function (data) {
      temp += data;
    });

    bundleStream.on('end', function () {
      log.info('New bundle made in ' + (Date.now() - t0) + 'ms.');
      bundle = temp;
    });

    bundleStream.on('error', function (err) {
      log.error(err, 'Bundle error.');
    });
  });

  w.on('update', function () {
    w.bundle();
  });

  w.bundle(function () {
    callback();
  });
}

function getBundle(req, res) {
  res.set('Content-Type', 'text/javascript');
  res.send(bundle);
}

exports.setup = setup;
exports.middleware = getBundle;
