'use strict';

const fs = require('fs');
const hogan = require('hogan.js');

async function compileTemplate(fullPath) {
  const str = await fs.promises.readFile(fullPath, 'utf8');

  return hogan.compile(str);
}

exports.render = async function render(name, data, callback) {
  try {
    const template = await compileTemplate(name);
    callback(null, template.render(data));
  } catch (err) {
    callback(err);
  }
};

exports.configure = app => app.set('views');
