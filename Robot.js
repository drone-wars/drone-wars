'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var id = 0;

function drawRotatedImage(image, x, y, angle, context) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.drawImage(image, -image.width / 2, -image.height / 2);
  context.restore();
}

function Robot(options, t) {
  var robot = this;

  robot.call(EventEmitter);
  robot.id = id;
  robot.src = options.src;
  robot.ctx = options.ctx;
  robot.lastTime = t;
  robot.rearmDuration = options.rearmDuration || 2500;

  robot.body = new Image();
  robot.body.src = options.bodySrc || 'img/robots/body.png';

  robot.radar = new Image();
  robot.radar.src = options.radarSrc || 'img/robots/turret.png';

  robot.worker = new Worker(options.src);

  robot.worker.onmessage = function (e) {
    robot.decision(e.data);
  };

  robot.worker.onerror = function (error) {
    console.error(error);
  };

  id += 1;
}

util.inherits(Robot, EventEmitter);

Robot.prototype.calculate = function (t, status, explosions) {
  var robot = this;
  var dt = t - robot.lastTime;

  robot.lastTime = t;
  robot.battleStatus = status;

  for (let explosion of explosions) {
    robot.damage(explosion.intensity(robot.location) * dt);

    if (robot.hp <= 0) {
      robot.emit('destroyed');
      robot.worker.terminate();
      return;
    }
  }

  robot.velocity.x += robot.acceleration.x * dt;
  robot.location.x += robot.velocity.x * dt;

  robot.velocity.y += robot.acceleration.y * dt;
  robot.location.y += robot.velocity.y * dt;
};

Robot.prototype.render = function () {
  var robot = this;
  var angle = Math.atan(robot.velocity.y / robot.velocity.x);
  var x = robot.position.x;
  var y = robot.position.y;

  drawRotatedImage(robot.body, x, y, angle, robot.context);
  drawRotatedImage(robot.turret, x, y, angle + robot.turretAngle, robot.context);
};

Robot.prototype.shoot = function (angle, range) {
  var robot = this;

  robot.lastShot = window.performance.now();
  robot.turretAngle = angle - Math.atan(robot.velocity.y / robot.velocity.x);
  robot.emit('shoot', robot.position, angle, range);
};

Robot.prototype.decision = function (message) {
  var robot = this;

  if (message.type !== 'decision') {
    return;
  }

  robot.acceleration.x = message.acceleration.x;
  robot.acceleration.y = message.acceleration.y;

  if (message.fire && robot.isArmed()) {
    let dy = message.fire.target.y - robot.position.y;
    let dx = message.fire.target.x - robot.position.x;

    robot.shoot(Math.atan(dy / dx), Math.sqrt(dy * dy + dx * dx));
  }

  robot.emit('ready');
};

Robot.prototype.isArmed = function () {
  return window.performance.now() - this.lastShot > this.rearmDuration;
};

Robot.prototype.sendBattleStatus = function (status) {
  this.worker.postMessage({ status: status });
};

module.exports = Robot;
