/* global postMessage */

// Cache the current target ID.
var targetId = null;

function distance(positionA, positionB) {
  'use strict';

  return {
    x: positionB.x - positionA.x,
    y: positionB.y - positionA.y
  };
}

function getAngle(obj) {
  'use strict';

  // Basic arctangent only gives the right answer for +ve x.
  var angle = Math.atan(obj.y / obj.x);

  // If you don't believe me, draw the four quadrants out on paper.
  if (obj.x < 0) {
    angle += Math.PI;
  }

  // Not strictly necessary, but nice to normalize.
  return angle < 0 ? 2 * Math.PI + angle : angle;
}

function handleMessage(e) {
  'use strict';

  // This is probably me waking up.
  if (!e.data || e.data.type !== 'status') {
    return postMessage({
      type: 'decision',
      acceleration: { x: 0, y: 0 }
    });
  }

  // My default decision is to do nothing. I'll add things to this depending on what I see going on
  // around me.
  var message = {
    type: 'decision',
    acceleration: { x: 0, y: 0 }
  };

  var field = e.data.status.field;
  var position = e.data.robot.position;
  var robot = e.data.robot;

  // If I'm getting too close to the western boundary. Move away from it.
  if (position.x < 100) {
    message.acceleration.x += 0.00001;
  }

  // If I'm getting too close to the eastern boundary. Move away from it.
  if (position.x > field.width - 100) {
    message.acceleration.x -= 0.00001;
  }

  // If I'm getting too close to the northern boundary. Move away from it.
  if (position.y < 100) {
    message.acceleration.y += 0.00001;
  }

  // If I'm getting too close to the southern boundary. Move away from it.
  if (position.y > field.height - 100) {
    message.acceleration.y -= 0.00001;
  }

  var robots = e.data.status.robots;
  var targetIndex;

  var ids = Object.keys(robots);

  // If the cached ID doesn't belong to a robot, pick a new index.
  if (!robots[targetId]) {
    targetIndex = Math.floor(Math.random() * (ids.length - 1));
  }

  // Iterate over all robots in the battlefield.
  for (var i = 0, j = 0, ilen = ids.length; i < ilen; i++) {
    var id = ids[i];

    // Do nothing if this is me.
    if (id === robot.id) {
      continue;
    }

    var gap = distance(robot.position, robots[id].position);
    var range = Math.sqrt(gap.x * gap.x + gap.y * gap.y);

    // Move away from other robots that are close.
    if (range < 250) {
      message.acceleration.x -= gap.x * 0.00001 / range;
      message.acceleration.y -= gap.y * 0.00001 / range;
    }

    // If there is a new target index, convert it into a target ID.
    if (j === targetIndex) {
      targetId = id;
    }

    j += 1;

    // If this id is not the target, skip the rest.
    if (id !== targetId) {
      continue;
    }

    var turretAngle = getAngle(gap);
    var robotAngle = getAngle(robot.velocity);

    // If this is our target and I have reloaded, fire at it.
    if (robot.timeSinceLastShot >= robot.rearmDuration) {
      message.fire = { range: range, angle: turretAngle - robotAngle };
    }
  }

  // Send my decision to my body.
  postMessage(message);
}

addEventListener('message', handleMessage, false);

