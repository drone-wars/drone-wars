define(['EventEmitter', 'inherits'], function (EventEmitter, inherits) {
  'use strict';

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

    shell.range = options.range;
    shell.canvasContext = options.canvasContext;
    shell.startTime = options.t;

    shell.velocity = {
      x: Math.cos(options.angle) * options.speed,
      y: Math.sin(options.angle) * options.speed
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
  };

  return Shell;
});
