'use strict';

var browserify = require('browserify');
var path = require('path');
var fs = require('fs');
var log = require('bole')('getBundle');
var bundle;

function watch() {
  var scriptsDir = path.resolve(__dirname, '..', 'frontend', 'scripts');

  var watcher = fs.watch(scriptsDir, { persistent: false }, function () {
    watcher.close();

    exports.setup(function (err) {
      if (err) {
        log.error(err);
      }
    });
  });
}

exports.setup = function (callback) {
  log.info('Compiling bundle.');

  var b = browserify();

  b.add(path.resolve(__dirname, '..', 'frontend', 'scripts', 'main.js'));

  b.bundle(function (err, buffer) {
    watch();

    if (err) {
      return callback(err);
    }

    bundle = buffer;

    log.info('Bundle compiled.');
    callback();
  });
};

exports.middleware = function (req, res) {
  res.set('Content-Type', 'text/javascript');
  res.send(bundle);
};
