/* global cortex */

/**
 * Aggressor uses the cortex queue system to organize actions.
 */

// Import cortex for helpers.
importScripts('/scripts/brains/cortex.js');

// Create the queue.
const queue = new cortex.Queue();

function hunt(id) {
  return function (data, callback) {
    const robot = data.robot;
    const enemy = data.status.robots[id];

    const message = {
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

    const dx = enemy.position.x - robot.position.x;
    const dy = enemy.position.y - robot.position.y;
    const dh = Math.sqrt(dx * dx + dy * dy);

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
  const message = {
    acceleration: { x: 0, y: 0 },
    token: data.token
  };

  const robots = data.status.robots;
  const robot = data.robot;

  // Make a list of enemy IDs.
  const ids = Object.keys(robots);

  // Remove my ID from the list.
  ids.splice(ids.indexOf(robot.id), 1);

  // Select a random target.
  const targetId = ids[Math.floor(Math.random() * ids.length)];

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

// The first action is to target an enemy.
queue.add(target);

// Feed the queue to cortex.init to begin listening for data from my body.
cortex.init(queue.decider);
