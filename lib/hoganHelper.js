'use strict';

var fs = require('fs');
var hogan = require('hogan.js');
var viewDir;

function compileTemplate(fullPath, callback) {
  fs.readFile(fullPath, 'utf8', function (err, str) {
    if (err) {
      return callback(err);
    }

    try {
      callback(null, hogan.compile(str));
    } catch (e) {
      callback(e);
    }
  });
}

function renderTemplate(name, data, callback) {
  compileTemplate(name, function (err, template) {
    if (err) {
      return callback(err);
    }

    try {
      callback(null, template.render(data));
    } catch (e) {
      callback(e);
    }
  });
}

exports.render = renderTemplate;

exports.configure = function (app) {
  viewDir = app.set('views');
};
