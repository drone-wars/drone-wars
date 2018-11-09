'use strict';

const fs = require('fs');
const path = require('path');
const robotIds = require('../lib/robotIds');
const config = require('../lib/config');

const uploadPath = path.join(__dirname, '..', config['upload-path']);

async function readRobotDir(robotId) {
  const dirContents = await fs.promises.readdir(path.join(uploadPath, robotId));
  const robot = {
    id: robotId,
    src: 'src.js',
    body: null,
    turret: null
  };

  for (const item of dirContents) {
    if (item.startsWith('body')) {
      robot.body = item;
    } else if (item.startsWith('turret')) {
      robot.turret = item;
    }

    if (robot.body && robot.turret) {
      break;
    }
  }

  return robot;
}

async function getRobotsData(req, res) {
  let robots;

  try {
    robots = await Promise.all(robotIds.robotIds.map(readRobotDir));
  } catch (err) {
    return res.end(500, 'Could not read robots.');
  }

  const templateData = {
    robots: JSON.stringify(robots),
    numAggressors: req.query['num-aggressors'] || '0',
    numAvoiders: req.query['num-avoiders'] || '0',
    numWanderers: req.query['num-wanderers'] || '0'
  };

  res.render('index.template', templateData);
}

module.exports = getRobotsData;
