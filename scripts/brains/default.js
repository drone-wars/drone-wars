/* global postMessage */
//var start = Date.now();
//var lastFire = start;

function calcDist(positionA, positionB) {
  'use strict';

  var dx = positionA.x - positionB.x;
  var dy = positionA.y - positionB.y;

  return Math.sqrt(dy * dy + dx * dx);
}

function direction(positionA, positionB) {
  'use strict';

  return {
    x: positionB.x - positionA.x,
    y: positionB.y - positionA.y
  };
}

function angle(robot) {
  'use strict';

  return Math.atan(robot.velocity.y / robot.velocity.x) || 0;
}

function handleMessage(e) {
  'use strict';

  if (!e.data) {
    return postMessage({
      type: 'decision',
      acceleration: { x: 0, y: 0 }
    });
  }

  var message = {
    type: 'decision',
    acceleration: { x: 0, y: 0 }
  };

  if (e.data.type !== 'status') {
    return postMessage(message);
  }

  var field = e.data.status.field;
  var position = e.data.robot.position;
  var robot = e.data.robot;

  if (position.x < 100) {
    message.acceleration.x += 0.00001;
  }

  if (position.x > field.width - 100) {
    message.acceleration.x -= 0.00001;
  }

  if (position.y < 100) {
    message.acceleration.y += 0.00001;
  }

  if (position.y > field.height - 100) {
    message.acceleration.y -= 0.00001;
  }

  var robots = e.data.status.robots;

  for (var id of Object.keys(robots)) {
    if (parseInt(id, 10) === robot.id) {
      continue;
    }

    if (calcDist(robot.position, robots[id].position) < 250) {
      var gap = direction(robot.position, robots[id].position);

      var range = Math.sqrt(gap.x * gap.x + gap.y * gap.y);

      message.acceleration.x -= gap.x * 0.00001 / range;
      message.acceleration.y -= gap.y * 0.00001 / range;

      if (robot.timeSinceLastShot >= robot.rearmDuration) {
        message.fire = { range: range, angle: (Math.atan(gap.y / gap.x) || 0) - angle(robot) };
      }
    }
  }

  // if (now - lastFire > 1000) {
  //   lastFire = now;

  //   message.fire = {
  //     target: { x: 250, y: 250 }
  //   };
  // }

  postMessage(message);
}

addEventListener('message', handleMessage, false);

