/* jshint worker: true */
/* global cortex */

/**
 * Avoider uses a decider function directly to fluidly determine its actions. It is simple, and
 * entirely reactive, accelerating to avoid other robots and the boundaries of the battlefield.
 */

// Import cortex for helpers.
importScripts('/scripts/brains/cortex.js');

// Cache the current target ID.
var targetId = null;

function makeDecision(data, callback) {
  'use strict';

  // My default decision is to do nothing. I'll add things to this depending on what I see going on
  // around me. The token must be used in the message.
  var message = {
    acceleration: { x: 0, y: 0 },
    token: data.token
  };

  var field = data.status.field;
  var position = data.robot.position;
  var robots = data.status.robots;
  var robot = data.robot;
  var maxAcceleration = robot.maxAcceleration;

  // If I'm getting too close to the western boundary. Move away from it.
  if (position.x < 100) {
    message.acceleration.x += maxAcceleration;
  }

  // If I'm getting too close to the eastern boundary. Move away from it.
  if (position.x > field.width - 100) {
    message.acceleration.x -= maxAcceleration;
  }

  // If I'm getting too close to the northern boundary. Move away from it.
  if (position.y < 100) {
    message.acceleration.y += maxAcceleration;
  }

  // If I'm getting too close to the southern boundary. Move away from it.
  if (position.y > field.height - 100) {
    message.acceleration.y -= maxAcceleration;
  }

  // Make a list of enemy IDs.
  var ids = Object.keys(robots);

  // Remove my ID from the list.
  ids.splice(ids.indexOf(robot.id), 1);

  // If the cached ID doesn't belong to a robot, pick a new index.
  if (!targetId || !robots[targetId]) {
    targetId = ids[Math.floor(Math.random() * ids.length)];
  }

  var target = robots[targetId];

  // If this is our target and I have reloaded, fire at it.
  if (target && robot.timeSinceLastShot >= robot.rearmDuration) {
    message.fire = { x: target.position.x, y: target.position.y };
  }

  // Iterate over all enemies in the battlefield.
  ids.forEach(function (id) {
    var dx = robots[id].position.x - robot.position.x;
    var dy = robots[id].position.y - robot.position.y;
    var range = Math.sqrt(dx * dx + dy * dy);

    // Move away from other robots that are close. If this number exceeds the maxAcceleration, then
    // my body will normalize it.
    if (range < 250) {
      message.acceleration.x -= dx * maxAcceleration / range;
      message.acceleration.y -= dy * maxAcceleration / range;
    }
  });

  // Send my decision to my body.
  callback(null, message);
}

cortex.init(makeDecision);

