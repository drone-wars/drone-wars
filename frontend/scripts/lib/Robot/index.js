'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var getAngle = require('../getAngle');
var constants = require('./constants');
var sendBattleStatus = require('./sendBattleStatus');
var sendPassable = require('./sendPassable');
var handleMessage = require('./handleMessage');
var draw = require('./draw');

var id = 0;

function Robot(options) {
  var battlefield = options.battlefield;
  var robot = this;

  EventEmitter.call(robot);

  robot.lastTime = options.t;
  robot.id = id.toString();
  robot.hp = constants.maxHealth;
  robot.position = options.position || { x: 200, y: 200 };
  robot.velocity = options.velocity || { x: 0, y: 0 };
  robot.acceleration = { x: 0, y: 0 };
  robot.src = options.src || 'scripts/brains/avoider.js';
  robot.name = options.name;
  robot.rearmDuration = options.rearmDuration || 500;
  robot.maxAcceleration = options.maxAcceleration || 0.00002;

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

  var previousAngle = robot.angle;

  robot.angle = getAngle(velocity);
  robot.turretAngle += previousAngle - robot.angle;

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

    robot.hit(
      Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) * constants.collisionDamage
    );
  }
};

Robot.prototype.render = function (canvasContext) {
  draw(this, canvasContext);
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
