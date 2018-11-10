'use strict';

const fs = require('fs');
const path = require('path');
const robotIds = require('../lib/robotIds');

const uploadPath = path.join(__dirname, '..', 'uploads');

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

  res.send({ robots });
}

module.exports = getRobotsData;
