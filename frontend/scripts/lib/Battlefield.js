'use strict';

var Robot = require('./Robot');
var Shell = require('./Shell');
var Explosion = require('./Explosion');

function Battlefield(options) {
  var canvas = options.canvas;

  this.showNames = options.showNames;
  this.background = options.background;
  this.passable = options.passable;
  this.width = canvas.width;
  this.height = canvas.height;
  this.canvas = canvas;
  this.canvasContext = canvas.getContext('2d');
  this.robots = [];
  this.shells = [];
  this.explosions = [];
  this.status = {};
  this.t = window.performance.now();
}

Battlefield.prototype.makeRobot = function (options) {
  var battlefield = this;
  var name = options.name || 'bot-' + battlefield.idInc;

  var robot = new Robot({
    position: options.position,
    id: battlefield.idInc,
    name: battlefield.showNames ? name : undefined,
    src: options.src,
    body: options.body,
    turret: options.turret,
    canvasContext: battlefield.canvasContext,
    t: window.performance.now(),
    battlefield: battlefield
  });

  battlefield.robots.push(robot);

  robot.once('destroyed', function () {
    battlefield.robots.splice(battlefield.robots.indexOf(robot), 1);
    battlefield.makeExplosion(robot.position, 100, 25 / 1000, 6000);

    robot.removeAllListeners();
  });

  robot.on('shoot', function (position, targetPosition) {
    battlefield.makeShell(position, targetPosition);
  });

  battlefield.idInc += 1;
};

Battlefield.prototype.robotReady = function (robot) {
  robot.sendBattleStatus(this.status);
};

Battlefield.prototype.makeShell = function (position, targetPosition) {
  var battlefield = this;

  var shell = new Shell({
    position: {
      x: position.x,
      y: position.y
    },
    targetPosition: {
      x: targetPosition.x,
      y: targetPosition.y
    },
    speed: 0.75,
    canvasContext: this.canvasContext,
    t: window.performance.now()
  });

  battlefield.shells.push(shell);

  shell.once('explode', function () {
    battlefield.shells.splice(battlefield.shells.indexOf(shell), 1);
    battlefield.makeExplosion(shell.position, 20, 10 / 1000, 4000);

    shell.removeAllListeners();
  });
};

Battlefield.prototype.makeExplosion = function (position, radius, strength, duration) {
  var battlefield = this;

  var explosion = new Explosion({
    position: {
      x: position.x,
      y: position.y
    },
    canvasContext: battlefield.canvasContext,
    radius: radius,
    strength: strength,
    duration: duration,
    t: window.performance.now()
  });

  battlefield.explosions.push(explosion);

  explosion.once('cleared', function () {
    battlefield.explosions.splice(battlefield.explosions.indexOf(explosion), 1);

    explosion.removeAllListeners();
  });
};

Battlefield.prototype.calculate = function (t) {
  var battlefield = this;
  battlefield.t = t;

  function calculate(entity) {
    entity.calculate(t, battlefield);
  }

  battlefield.robots.forEach(calculate);
  battlefield.shells.forEach(calculate);
  battlefield.explosions.forEach(calculate);

  battlefield.updateStatus();
};

Battlefield.prototype.render = function () {
  var battlefield = this;

  // Clear the canvas.
  battlefield.canvasContext.clearRect(0, 0, battlefield.width, battlefield.height);

  // Render background.
  battlefield.canvasContext.putImageData(battlefield.background, 0, 0);

  function render(entity) {
    entity.render();
  }

  battlefield.robots.forEach(render);
  battlefield.shells.forEach(render);
  battlefield.explosions.forEach(render);
};

Battlefield.prototype.updateStatus = function () {
  var status = {
    field: {
      width: this.width,
      height: this.height
    },
    robots: {},
    shells: {},
    explosions: {}
  };

  this.robots.forEach(function (robot) {
    status.robots[robot.id] = robot.getPublicData();
  });

  this.shells.forEach(function (shell) {
    status.shells[shell.id] = shell.getPublicData();
  });

  this.explosions.forEach(function (explosion) {
    status.explosions[explosion.id] = explosion.getPublicData();
  });

  this.status = status;
};

Battlefield.prototype.outOfBounds = function (position) {
  // TODO - This will need to be updated when the battlefield is more than just an empty
  //        rectangle.
  var x = Math.round(position.x);
  var y = Math.round(position.y);

  if (isNaN(x) || isNaN(y)) {
    return;
  }

  if (x < 0 || y < 0 || x > this.width || y > this.height) {
    return true;
  }

  return !this.passable[x + y * this.width];
};

module.exports = Battlefield;
