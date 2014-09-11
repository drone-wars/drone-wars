'use strict';

var fs = require('fs');
var hogan = require('hogan.js');
var viewDir;

function compileTemplate(fullPath, callback) {
  fs.readFile(fullPath, 'utf8', function (err, str) {
    if (err) {
      return callback(err);
    }

    var template;

    try {
      template = hogan.compile(str);
    } catch (e) {
      return callback(e);
    }

    callback(null, template);
  });
}

function renderTemplate(name, data, callback) {
  compileTemplate(name, function (err, template) {
    if (err) {
      return callback(err);
    }

    var result;

    try {
      result = template.render(data);
    } catch (e) {
      return callback(e);
    }

    callback(null, result);
  });
}

module.exports = renderTemplate;

module.exports.configure = function (app) {
  viewDir = app.set('views');
};
