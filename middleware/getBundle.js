'use strict';

var browserify = require('browserify');
var watchify = require('watchify');
var path = require('path');
var log = require('bole')('getBundle');

var bundle;

function setup(callback) {
  log.info('Compiling bundle.');

  var b = browserify({
    cache: {},
    packageCache: {},
    fullPaths: true,
    debug: true
  });

  b.add(path.resolve(__dirname, '..', 'frontend', 'scripts', 'main.js'));

  var w = watchify(b);

  w.on('bundle', function (bundleStream) {
    var temp = '';

    bundleStream.on('data', function (data) {
      temp += data;
    });

    bundleStream.on('end', function () {
      log.info('New bundle made.');
      bundle = temp;
    });

    bundleStream.on('error', function (err) {
      log.error(err, 'Bundle error.');
    });
  });

  w.on('update', function () {
    log.info('Making new bundle.');
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
