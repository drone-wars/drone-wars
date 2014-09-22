'use strict';

var browserify = require('browserify');
var path = require('path');
var watch = require('watch');
var log = require('bole')('getBundle');
var callbacks = [];

// Until the bundle is built, collect callbacks.
var handleBundleRequest = function(callback) {
  callbacks.push(callback);
};

function logError(err) {
  if (err) {
    log.error(err);
  }
}

function watchDir() {
  var scriptsDir = path.resolve(__dirname, '..', 'frontend', 'scripts');

  watch.watchTree(scriptsDir, { ignoreDorFiles: true }, function (f, curr, prev) {
    if (prev === null) {
      return;
    }

    watch.unwatchTree(scriptsDir);

    setup(logError);
  });
}

function setup(callback) {
  log.info('Compiling bundle.');

  var b = browserify();

  b.add(path.resolve(__dirname, '..', 'frontend', 'scripts', 'main.js'));

  b.bundle(function (err, bundle) {
    watchDir();

    if (err) {
      return callback(err);
    }

    handleBundleRequest = function(callback) {
      callback(bundle);
    };

    // Call any callbacks that have been stored.
    callbacks.forEach(handleBundleRequest);
    callbacks = [];

    log.info('Bundle compiled.');
    callback();
  });
}

setup(logError);

function getBundle(req, res) {
  handleBundleRequest(function (bundle) {
    res.set('Content-Type', 'text/javascript');
    res.send(bundle);
  });
}

module.exports = getBundle;
