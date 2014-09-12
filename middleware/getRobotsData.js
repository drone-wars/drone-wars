'use strict';

var fs = require('fs');
var path = require('path');
var string = require('string');
var async = require('async');
var find = require('lodash.find');
var robotIds = require('../lib/robotIds');
var config = require('../lib/config');

var uploadPath = path.join(__dirname, '..', config['upload-path']);

function readRobotDir(robotId, callback){
  fs.readdir(path.join(uploadPath, robotId), function(err, dirContents){
    if (err) {
      return callback(err);
    }

    callback(null, {
      id: robotId,
      src: 'src.js',
      body: find(dirContents, function(item) { return string(item).startsWith('body'); }),
      turret: find(dirContents, function(item) { return string(item).startsWith('turret'); })
    });
  });
}

function getRobotsData(req, res) {
  async.map(robotIds.robotIds, readRobotDir, function(err, robots){
    if (err) {
      console.error(err);
      return res.end(500, 'Could not read robots');
    }

    res.render('index.template', {robots: JSON.stringify(robots)});
  });
}

module.exports = getRobotsData;
