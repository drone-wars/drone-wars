/* jshint worker: true, latedef: false */
/* global cortex */

/**
 * Aggressor uses the cortex queue system to organize actions.
 */

// Import cortex for helpers.
importScripts('/scripts/brains/cortex.js');

function hunt(id) {
  'use strict';

  return function (data, callback) {
    var robot = data.robot;
    var enemy = data.status.robots[id];

    var message = {
      acceleration: { x: 0, y: 0 },
      token: data.token
    };

    // If there is no enemy with this ID, then this action is finished.
    if (!enemy) {

      // I need a new target.
      queue.add(target);

      // This action is done.
      return callback(null, message, true);
    }

    var dx = enemy.position.x - robot.position.x;
    var dy = enemy.position.y - robot.position.y;
    var dh = Math.sqrt(dx * dx + dy * dy);

    // Accelerate toward the enemy as quickly as possible.
    message.acceleration.x = dx / dh * robot.maxAcceleration;
    message.acceleration.y = dy / dh * robot.maxAcceleration;

    // If I have reloaded, fire at the enemy.
    if (robot.timeSinceLastShot >= robot.rearmDuration) {
      message.fire = { x: enemy.position.x, y: enemy.position.y };
    }

    callback(null, message, false);
  };
}

function target(data, callback) {
  'use strict';

  var message = {
    acceleration: { x: 0, y: 0 },
    token: data.token
  };

  var robots = data.status.robots;
  var robot = data.robot;

  // Make a list of enemy IDs.
  var ids = Object.keys(robots);

  // Remove my ID from the list.
  ids.splice(ids.indexOf(robot.id), 1);

  // Select a random target.
  var targetId = ids[Math.floor(Math.random() * ids.length)];

  // No target was selected, so I'm the only one left in the battlefield. Someone may arrive later
  // though, so continue to target.
  if (!targetId) {
    return callback(null, message, false);
  }

  // A new target has been acquired. Time to go hunting.
  queue.add(hunt(targetId));

  // This action is now done.
  callback(null, message, true);
}

// Create the queue.
var queue = new cortex.Queue();

// The first action is to target an enemy.
queue.add(target);

// Feed the queue to cortex.init to begin listening for data from my body.
cortex.init(queue.decider);
