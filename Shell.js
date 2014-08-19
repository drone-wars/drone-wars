'use strict';

var EventEmitter = require('EventEmitter');
var util = require('util');

function Shell(options) {
  EventEmitter.call(this);

  this.origin = options.position;
  this.position = options.position;
  this.range = options.range;
  this.startTime = options.t;

  this.velocity = {
    x: Math.cos(options.angle) * options.speed,
    y: Math.sin(options.angle) * options.speed
  };
}

util.inherits(Shell, EventEmitter);

Shell.prototype.calculate = function (t) {
  var dt = t - this.startTime;
  var xMove = dt * this.velocity.x;
  var yMove = dt * this.velocity.y;

  var newPosition = {
    x: this.origin.x + xMove,
    y: this.origin.y + yMove
  };

  this.position = newPosition;

  if (Math.sqrt(xMove * xMove + yMove * yMove) >= this.range) {
    this.emit('explode', t);
  }
};

module.exports = Shell;
