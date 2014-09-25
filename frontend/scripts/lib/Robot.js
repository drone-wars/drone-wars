'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var getAngle = require('./getAngle');

var id = 0;

var MAX_HEALTH = 250;
var HEALTH_BAR_WIDTH = 50;
var HEALTH_BAR_X_OFFSET = 25;
var HEALTH_BAR_Y_OFFSET = 40;
var HEALTH_BAR_HEIGHT = 10;
var COLLISION_DAMAGE = 100;

function shoot(robot, targetPosition) {
  if (!targetPosition.hasOwnProperty('x') || !targetPosition.hasOwnProperty('y')) {
    return;
  }

  robot.lastShot = window.performance.now();
  robot.turretAngle = getAngle({
    x: targetPosition.x - robot.position.x,
    y: targetPosition.y - robot.position.y
  });

  robot.emit('shoot', robot.position, targetPosition);
}

function sendBattleStatus(robot, status) {
  robot.token = Math.random().toFixed(5).slice(2, 7);

  var battleData = {
    type: 'status',
    robot: {
      id: robot.id,
      hp: robot.hp,
      position: robot.position,
      velocity: robot.velocity,
      acceleration: robot.acceleration,
      maxAcceleration: robot.maxAcceleration,
      width: robot.body.width,
      height: robot.body.height,
      rearmDuration: robot.rearmDuration,
      timeSinceLastShot: window.performance.now() - robot.lastShot
    },
    status: status,
    token: robot.token
  };

  robot.worker.postMessage(battleData);
}

function processDecision(robot, battlefield, message) {
  if (!message || message.token !== robot.token) {
    return;
  }

  var acceleration = message.acceleration;

  // Default to previous acceleration.
  if (acceleration) {
    if (acceleration.hasOwnProperty('x')) {
      robot.acceleration.x = acceleration.x;
    }

    if (acceleration.hasOwnProperty('y')) {
      robot.acceleration.y = acceleration.y;
    }
  }

  if (message.fire) {
    var isArmed = window.performance.now() - robot.lastShot > robot.rearmDuration;

    if (isArmed) {
      shoot(robot, message.fire);
    }
  }

  sendBattleStatus(robot, battlefield.status);
}

function sendPassable(robot, passable) {
  var copy = passable.buffer.slice(0);

  robot.worker.postMessage({ type: 'passable', data: copy }, [copy]);
}

function handleMessage(robot, battlefield, message) {
  switch (message.type) {
  case 'decision':
    return processDecision(robot, battlefield, message.data);

  case 'error':
    return console.error(message.data);

  case 'debug':
    return console.log(message.data);

  default:
    return console.log('Message from robot worker ', robot.id + ':', message);
  }
}

function drawRobot(robot) {
  // Save the initial origin and angle.
  robot.canvasContext.save();

  // Translate the canvas to the middle of the robot.
  robot.canvasContext.translate(robot.position.x, robot.position.y);

  // Use the velocity to calculate the orientation of the robot.
  robot.canvasContext.rotate(robot.angle);

  // Draw the robot body around the midpoint.
  robot.canvasContext.drawImage(robot.body, -robot.body.width / 2, -robot.body.height / 2);

  // Rotate the canvas to the turret angle.
  robot.canvasContext.rotate(robot.turretAngle - robot.angle);

  // Draw the turret.
  robot.canvasContext.drawImage(robot.turret, -robot.turret.width / 2, -robot.turret.height / 2);

  // Restore the canvas origin and angle.
  robot.canvasContext.restore();
}

function drawHealthBar(robot) {
  var healthLeftWidth = robot.hp / MAX_HEALTH * HEALTH_BAR_WIDTH;
  var xPos = robot.position.x - HEALTH_BAR_X_OFFSET;
  var yPos = robot.position.y - HEALTH_BAR_Y_OFFSET;

  robot.canvasContext.strokeStyle = 'black';
  robot.canvasContext.strokeRect(xPos, yPos, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

  robot.canvasContext.fillStyle = 'green';
  robot.canvasContext.fillRect(xPos, yPos, healthLeftWidth, HEALTH_BAR_HEIGHT);

  robot.canvasContext.fillStyle = 'yellow';
  robot.canvasContext.fillRect(
    xPos + healthLeftWidth, yPos,
    HEALTH_BAR_WIDTH - healthLeftWidth,
    HEALTH_BAR_HEIGHT
  );
}

function drawName(robot) {
  if (!robot.name) {
    return;
  }

  robot.canvasContext.fillStyle = 'white';
  robot.canvasContext.fillText(robot.name, robot.position.x - 20, robot.position.y + 45);
}

function Robot(options) {
  var battlefield = options.battlefield;
  var robot = this;

  EventEmitter.call(robot);

  robot.lastTime = options.t;
  robot.id = id.toString();
  robot.hp = MAX_HEALTH;
  robot.position = options.position || { x: 200, y: 200 };
  robot.velocity = { x: 0, y: 0 };
  robot.acceleration = { x: 0, y: 0 };
  robot.src = options.src || 'scripts/brains/avoider.js';
  robot.name = options.name;
  robot.canvasContext = options.canvasContext;
  robot.rearmDuration = options.rearmDuration || 500;
  robot.maxAcceleration = 0.00002;

  robot.body = document.createElement('img');
  robot.body.src = options.body || 'img/robots/body.png';

  robot.turret = document.createElement('img');
  robot.turret.src = options.turret || 'img/robots/turret.png';
  robot.turretAngle = 0;
  robot.lastShot = window.performance.now();

  robot.worker = new Worker(robot.src);

  robot.worker.onmessage = function (e) {
    handleMessage(robot, battlefield, e.data);
  };

  robot.worker.onerror = function (error) {
    console.error(error);
  };

  robot.token = null;

  sendPassable(robot, battlefield.passable);
  sendBattleStatus(robot, battlefield.status);

  id += 1;
}

inherits(Robot, EventEmitter);

Robot.prototype.calculate = function (t, battlefield) {
  var robot = this;
  var dt = t - robot.lastTime;
  var position = robot.position;
  var velocity = robot.velocity;
  var rawAcc = robot.acceleration;

  var rawScalarAcc = Math.sqrt(rawAcc.x * rawAcc.x + rawAcc.y * rawAcc.y);

  if (rawScalarAcc > robot.maxAcceleration) {
    robot.acceleration.x = robot.acceleration.x * robot.maxAcceleration / rawScalarAcc;
    robot.acceleration.y = robot.acceleration.y * robot.maxAcceleration / rawScalarAcc;
  }

  robot.lastTime = t;
  robot.battleStatus = battlefield.status;

  for (var i = battlefield.explosions.length - 1; i >= 0; i--) {
    var dead = robot.hit(battlefield.explosions[i].intensity(robot.position) * dt);

    if (dead) {
      return;
    }
  }

  velocity.x += robot.acceleration.x * dt;
  velocity.y += robot.acceleration.y * dt;

  var dx = velocity.x * dt;
  var dy = velocity.y * dt;

  position.x += dx;
  position.y += dy;

  robot.angle = getAngle(velocity);

  var width = robot.body.width;
  var height = robot.body.height;
  var cosAngle = Math.cos(robot.angle);
  var sinAngle = Math.sin(robot.angle);

  var frontLeft = {
    x: position.x + cosAngle * height / 2 - sinAngle * width / 2,
    y: position.y + sinAngle * height / 2 + cosAngle * width / 2
  };

  var frontRight = {
    x: position.x + cosAngle * height / 2 + sinAngle * width / 2,
    y: position.y + sinAngle * height / 2 - cosAngle * width / 2
  };

  if (battlefield.outOfBounds(frontLeft) || battlefield.outOfBounds(frontRight)) {
    velocity.x *= -1;
    velocity.y *= -1;

    position.x -= 2 * dx;
    position.y -= 2 * dy;

    robot.angle = getAngle(velocity);

    robot.hit(Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) * COLLISION_DAMAGE);
  }
};

Robot.prototype.render = function () {
  drawRobot(this);
  drawHealthBar(this);
  drawName(this);
};

Robot.prototype.hit = function (amount) {
  this.hp -= amount;

  if (this.hp > 0) {
    return false;
  }

  this.emit('destroyed');
  this.removeAllListeners();
  this.worker.terminate();
  this.worker = null;

  return true;
};

Robot.prototype.getPublicData = function () {
  return {
    hp: this.hp,
    position: {
      x: this.position.x,
      y: this.position.y
    },
    velocity: {
      x: this.velocity.x,
      y: this.velocity.y
    }
  };
};

module.exports = Robot;
