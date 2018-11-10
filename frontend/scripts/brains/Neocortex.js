/* global cortex */

(function (self) {
  // Import cortex for helpers.
  importScripts('/scripts/brains/cortex.js');

  function moveTo(location) {
    let startLocation;
    let startTime;
    let timeToLocation;
    let dx;
    let dy;
    let distance;
    let accelerate;
    let decelerate;

    return function (data, callback) {
      const timeNow = self.performance.now();

      if (!startLocation) {
        startTime = timeNow;
        startLocation = data.robot.position;

        dx = location.x - startLocation.x;
        dy = location.y - startLocation.y;

        distance = Math.sqrt(dx * dx + dy * dy);

        timeToLocation = 2 * Math.sqrt(distance / data.robot.maxAcceleration);

        accelerate = {
          x: data.robot.maxAcceleration * dx / distance,
          y: data.robot.maxAcceleration * dy / distance
        };

        decelerate = {
          x: -accelerate.x,
          y: -accelerate.y
        };
      }

      const message = { token: data.token };

      if (timeNow - startTime >= timeToLocation) {
        message.acceleration = { x: 0, y: 0 };

        return callback(null, message, true);
      }

      if ((timeNow - startTime) < (timeToLocation / 2)) {
        message.acceleration = accelerate;
      } else {
        message.acceleration = decelerate;
      }

      return callback(null, message, false);
    };
  }

  function fireAtLocation(location) {
    return function (data, callback) {
      const robot = data.robot;
      const message = { token: data.token };

      if (robot.timeSinceLastShot < robot.rearmDuration) {
        return callback(null, message, false);
      }

      message.fire = location;

      return callback(null, message, true);
    };
  }

  function fireAtClosestEnemy(data, callback) {
    const robot = data.robot;
    const robots = data.status.robots;
    const message = { token: data.token };

    // I haven't reloaded yet.
    if (robot.timeSinceLastShot < robot.rearmDuration) {
      return callback(null, message, false);
    }

    // Make a list of enemy IDs my splicing my ID out of all robot IDs.
    const enemyIds = Object.keys(robots);
    enemyIds.splice(enemyIds.indexOf(robot.id), 1);

    // No enemies to shoot at. Move on to the next action.
    if (enemyIds.length === 0) {
      return callback(null, message, true);
    }

    function calculateGap(enemy) {
      const dx = enemy.position.x - robot.position.x;
      const dy = enemy.position.y - robot.position.y;

      return Math.sqrt(dx * dx + dy * dy);
    }

    // Figure out who the closest enemy is.
    const closestEnemy = enemyIds.reduce((closest, enemyId) => {
      if (!closest) {
        return null;
      }

      const enemy = robots[enemyId];

      return calculateGap(closest) < calculateGap(enemy) ? closest : enemy;
    }, robots[enemyIds[0]]);

    if (closestEnemy) {
      message.fire = { x: closestEnemy.position.x, y: closestEnemy.position.y };
    }

    callback(null, message, true);
  }

  function Neocortex() {
    const neocortex = this;

    if (!(neocortex instanceof Neocortex)) {
      return new Neocortex();
    }

    const queue = new cortex.Queue();

    neocortex.queue = queue;

    neocortex.addMove = function (type, location) {
      switch (type) {
      case 'moveTo':
        return neocortex.queue.add(moveTo(location));
      case 'fireAtLocation':
        return neocortex.queue.add(fireAtLocation(location));
      case 'fireAtClosestEnemy':
        return neocortex.queue.add(fireAtClosestEnemy);
      default:
        return;
      }
    };

    neocortex.start = function (done) {
      neocortex.queue.add((data, callback) => {
        done();

        callback(null, { token: data.token }, true);
      });

      cortex.init(queue.decider);
    };
  }

  self.Neocortex = Neocortex;
}(self));
