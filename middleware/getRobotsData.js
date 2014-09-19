'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var robotIds = require('../lib/robotIds');
var config = require('../lib/config');

var uploadPath = path.join(__dirname, '..', config['upload-path']);

function readRobotDir(robotId, callback) {
  fs.readdir(path.join(uploadPath, robotId), function (err, dirContents) {
    if (err) {
      return callback(err);
    }

    var body;
    var turret;

    for (var i = 0, len = dirContents.length; i < len && !(body && turret); i++) {
      var item = dirContents[i];

      if (item.indexOf('body') === 0) {
        body = item;
      } else if (item.indexOf('turret') === 0) {
        turret = item;
      }
    }

    var robot = {
      id: robotId,
      src: 'src.js',
      body: body,
      turret: turret
    };

    callback(null, robot);
  });
}

function getRobotsData(req, res) {
  async.map(robotIds.robotIds, readRobotDir, function (err, robots) {
    if (err) {
      return res.end(500, 'Could not read robots.');
    }

    var templateData = {
      robots: JSON.stringify(robots),
      numAggressors: req.query['num-aggressors'] || '0',
      numAvoiders: req.query['num-avoiders'] || '0',
      numWanderers: req.query['num-wanderers'] || '0'
    };

    res.render('index.template', templateData);
  });
}

module.exports = getRobotsData;
