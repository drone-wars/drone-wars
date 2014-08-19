'use strict';

var Robot = require('./Robot');
var Shell = require('./Shell');
var Explosion = require('./Explosion');

function Battlefield(canvas) {
  this.width = canvas.width;
  this.height = canvas.height;
  this.canvas = canvas;
  this.canvasContext = canvas.getContext('2d');
  this.robots = new Map();
  this.shells = new Set();
  this.explosions = new Set();
  this.status = {};
  this.t = window.performance.now();
}

Battlefield.prototype.makeRobot = function (src, t) {
  var battlefield = this;
  var id = battlefield.idInc;

  var robot = new Robot(id, src, this.canvas, t);

  battlefield.robots.add(robot);

  robot.once('destroyed', function () {
    battlefield.robots.remove(id);

    robot.removeAllListeners();
  });

  robot.on('ready', function () {
    robot.sendBattleStatus(battlefield.status);
  });

  robot.on('shoot', function (position, angle, range) {
    robot.makeShell(position, angle, range, robot.t);
  });

  battlefield.idInc += 1;
};

Battlefield.prototype.makeShell = function (position, angle, range, t) {
  var battlefield = this;
  var shell = new Shell({
    position: position,
    angle: angle,
    range: range,
    speed: 1 / 100,
    t: t
  });

  battlefield.shells.add(shell);

  shell.once('explode', function (t) {
    battlefield.shells.remove(shell);
    battlefield.makeExplosion(shell.position, t);

    delete battlefield.shells[shell.id];

    shell.removeAllListeners();
  });
};

Battlefield.prototype.makeExplosion = function (position, canvas, t) {
  var battlefield = this;
  var explosion = new Explosion(t, {
    position: position,
    canvas: battlefield.canvas,
    context: battlefield.canvasContext,
    radius: 20,
    strength: 1 / 1000
  });

  battlefield.explosions.add(explosion);

  explosion.once('cleared', function () {
    Battlefield.explosions.remove(explosion);
  });
};

Battlefield.prototype.calculate = function (t) {
  var battlefield = this;
  battlefield.t = t;

  // Calculate positions of robots.
  for (let robot of battlefield.robots) {
    robot.calculate(t, battlefield.status, battlefield.explosions);
  }

  // Calculate new shell positions.
  for (let shell of battlefield.shells) {
    shell.calculate(t);
  }

  // Calculate progress of explosions.
  for (let explosion of battlefield.explosions) {
    explosion.calculate(t);
  }

  battlefield.updateStatus();
};

Battlefield.prototype.render = function () {
  var battlefield = this;
  var width = battlefield.width;
  var height = battlefield.height;
  var canvasContext = battlefield.canvasContext;

  // Clear the canvas.
  canvasContext.clearRect(0, 0, width, height);

  // Render grass.
  canvasContext.fillStyle = 'rgba(0,0,0,0.1)';
  canvasContext.fillRect(0, 0, width, height);

  // Render robots.
  for (let robot of battlefield.robots) {
    robot.render();
  }

  // Render shells.
  for (let shell of battlefield.shells) {
    shell.render();
  }

  // Render explosions.
  for (let explosion of battlefield.explosions) {
    explosion.render();
  }
};

Battlefield.prototype.updateStatus = function () {
  var battlefield = this;

  var status = {
    robots: {},
    shells: {},
    explosions: {}
  };

  // Get the HP, position and velocity of robots.
  for (let robot of battlefield.robots) {
    status.robots[robot.id] = {
      hp: robot.hp,
      position: robot.position,
      velocity: robot.velocity
    };
  }

  // Get the position and velocity of fired shells.
  for (let shell of battlefield.shells) {
    status.shells[shell.id] = {
      position: shell.position,
      velocity: shell.velocity
    };
  }

  // Get the position and radius of explosions.
  for (let explosion of battlefield.explosions) {
    status.explosions[explosion.id] = {
      position: explosion.position,
      radius: explosion.radius
    };
  }

  battlefield.status = status;
};

module.exports = Battlefield;
