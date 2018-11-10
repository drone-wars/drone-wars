/* global cortex */

/**
 * Avoider uses a decider function directly to fluidly determine its actions. It is simple, and
 * entirely reactive, accelerating to avoid other robots and the boundaries of the battlefield.
 */

// Import cortex for helpers.
importScripts('/scripts/brains/cortex.js');

// Cache the current target ID.
let targetId = null;

function makeDecision(data, callback) { // eslint-disable-line complexity, max-statements
  // My default decision is to do nothing. I'll add things to this depending on what I see going on
  // around me. The token must be used in the message.
  const message = {
    acceleration: { x: 0, y: 0 },
    token: data.token
  };

  const field = data.status.field;
  const position = data.robot.position;
  const robots = data.status.robots;
  const robot = data.robot;
  const maxAcceleration = robot.maxAcceleration;

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
  const ids = Object.keys(robots);

  // Remove my ID from the list.
  ids.splice(ids.indexOf(robot.id), 1);

  // If the cached ID doesn't belong to a robot, pick a new index.
  if (!targetId || !robots[targetId]) {
    targetId = ids[Math.floor(Math.random() * ids.length)];
  }

  const target = robots[targetId];

  // If this is our target and I have reloaded, fire at it.
  if (target && robot.timeSinceLastShot >= robot.rearmDuration) {
    message.fire = { x: target.position.x, y: target.position.y };
  }

  // Iterate over all enemies in the battlefield.
  for (const id of ids) {
    const dx = robots[id].position.x - robot.position.x;
    const dy = robots[id].position.y - robot.position.y;
    const range = Math.sqrt(dx * dx + dy * dy);

    // Move away from other robots that are close. If this number exceeds the maxAcceleration, then
    // my body will normalize it.
    if (range < 250) {
      message.acceleration.x -= dx * maxAcceleration / range;
      message.acceleration.y -= dy * maxAcceleration / range;
    }
  }

  // Send my decision to my body.
  callback(null, message);
}

cortex.init(makeDecision);
