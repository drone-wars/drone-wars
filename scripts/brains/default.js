/* global postMessage */

var targetId = null;

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

function getAngle(obj) {
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

  var enemies = Object.keys(robots).reduce(function (enemies, id) {
    if (id !== robot.id) {
      enemies.push(robots[id]);
    }

    robots[id].id = id;

    return enemies;
  }, []);

  var target = robots[targetId];

  if (!target) {
    target = enemies[Math.floor(Math.random() * enemies.length)];
    targetId = target && target.id;
  }

  enemies.forEach(function (enemy) {
    var gap = direction(robot.position, enemy.position);
    var range = Math.sqrt(gap.x * gap.x + gap.y * gap.y);

    if (calcDist(robot.position, enemy.position) < 250) {
      message.acceleration.x -= gap.x * 0.00001 / range;
      message.acceleration.y -= gap.y * 0.00001 / range;
    }

    if (enemy.id !== target.id) {
      return;
    }

    var turretAngle = getAngle(gap);
    var robotAngle = getAngle(robot.velocity);

    if (robot.timeSinceLastShot >= robot.rearmDuration) {
      message.fire = { range: range, angle: turretAngle - robotAngle };
    }
  });

  postMessage(message);
}

addEventListener('message', handleMessage, false);

