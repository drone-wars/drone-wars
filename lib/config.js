'use strict';

const os = require('os');

module.exports = require('yargs')
  .options('processes', {
    default: os.cpus().length,
    describe: 'Number of worker processes to use.'
  })
  .options('upload-path', {
    default: './uploads',
    describe: 'Robot upload directory.'
  })
  .argv;
