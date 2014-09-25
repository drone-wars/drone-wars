'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var getAngle = require('./getAngle');

function Shell(options) {
  var shell = this;
  EventEmitter.call(shell);

  shell.origin = {
    x: options.position.x,
    y: options.position.y
  };

  shell.position = {
    x: options.position.x,
    y: options.position.y
  };

  var gap = {
    x: options.targetPosition.x - options.position.x,
    y: options.targetPosition.y - options.position.y
  };

  var angle = getAngle(gap);

  shell.range = Math.sqrt(gap.x * gap.x + gap.y * gap.y);
  shell.canvasContext = options.canvasContext;
  shell.startTime = options.t;

  shell.velocity = {
    x: Math.cos(angle) * options.speed,
    y: Math.sin(angle) * options.speed
  };
}

inherits(Shell, EventEmitter);

Shell.prototype.calculate = function (t) {
  var shell = this;
  var dt = t - shell.startTime;
  var xMove = dt * shell.velocity.x;
  var yMove = dt * shell.velocity.y;

  shell.position = {
    x: shell.origin.x + xMove,
    y: shell.origin.y + yMove
  };

  if (Math.sqrt(xMove * xMove + yMove * yMove) >= shell.range) {
    shell.emit('explode');
  }
};

Shell.prototype.render = function () {
  var shell = this;

  shell.canvasContext.fillStyle = 'black';
  shell.canvasContext.beginPath();
  shell.canvasContext.arc(shell.position.x, shell.position.y, 5, 0, 2 * Math.PI);
  shell.canvasContext.fill();

  shell.canvasContext.strokeStyle = 'white';
  shell.canvasContext.beginPath();
  shell.canvasContext.arc(shell.position.x, shell.position.y, 5, 0, 2 * Math.PI, true);
  shell.canvasContext.stroke();
};

Shell.prototype.getPublicData = function () {
  return {
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

module.exports = Shell;
