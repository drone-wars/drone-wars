/* global Robot, Shell, Explosion */

define(['Robot', 'Shell', 'Explosion'], function (Robot, Shell, Explosion) {
  'use strict';

  function Battlefield(canvas) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvas = canvas;
    this.canvasContext = canvas.getContext('2d');
    this.robots = new Set();
    this.shells = new Set();
    this.explosions = new Set();
    this.status = {};
    this.t = window.performance.now();
  }

  Battlefield.prototype.makeRobot = function (position, src) {
    var battlefield = this;

    var robot = new Robot({
      position: position,
      id: battlefield.idInc,
      src: src,
      canvas: battlefield.canvas,
      canvasContext: battlefield.canvasContext,
      t: window.performance.now(),
      battlefield: battlefield
    });

    battlefield.robots.add(robot);

    robot.once('destroyed', function () {
      battlefield.robots.delete(robot.id);
      robot.removeAllListeners();
    });

    robot.on('shoot', function (position, angle, range) {
      battlefield.makeShell(position, angle, range);
    });

    battlefield.idInc += 1;
  };

  Battlefield.prototype.robotReady = function (robot) {
    robot.sendBattleStatus(this.status);
  };

  Battlefield.prototype.makeShell = function (position, angle, range) {
    var battlefield = this;

    var shell = new Shell({
      position: {
        x: position.x,
        y: position.y
      },
      angle: angle,
      range: range,
      speed: 1,
      canvasContext: this.canvasContext,
      t: window.performance.now()
    });

    battlefield.shells.add(shell);

    shell.once('explode', function () {
      battlefield.shells.delete(shell);
      battlefield.makeExplosion(shell.position);

      shell.removeAllListeners();
    });
  };

  Battlefield.prototype.makeExplosion = function (position) {
    var battlefield = this;

    var explosion = new Explosion({
      position: {
        x: position.x,
        y: position.y
      },
      canvas: battlefield.canvas,
      canvasContext: battlefield.canvasContext,
      radius: 20,
      strength: 1 / 1000,
      duration: 4000,
      t: window.performance.now()
    });

    battlefield.explosions.add(explosion);

    explosion.once('cleared', function () {
      battlefield.explosions.delete(explosion);
    });
  };

  Battlefield.prototype.calculate = function (t) {
    this.t = t;

    // Calculate positions of robots.
    for (let robot of this.robots) {
      robot.calculate(t, this);
    }

    // Calculate new shell positions.
    for (let shell of this.shells) {
      shell.calculate(t);
    }

    // Calculate progress of explosions.
    for (let explosion of this.explosions) {
      explosion.calculate(t);
    }

    this.updateStatus();
  };

  Battlefield.prototype.render = function () {
    var width = this.width;
    var height = this.height;
    var canvasContext = this.canvasContext;

    // Clear the canvas.
    canvasContext.clearRect(0, 0, width, height);

    // Render grass.
    canvasContext.fillStyle = 'rgba(0,0,0,0.1)';
    canvasContext.fillRect(0, 0, width, height);

    // Render robots.
    for (let robot of this.robots) {
      robot.render();
    }

    // Render shells.
    for (let shell of this.shells) {
      shell.render();
    }

    // Render explosions.
    for (let explosion of this.explosions) {
      explosion.render();
    }
  };

  Battlefield.prototype.updateStatus = function () {
    var battlefield = this;

    var status = {
      field: {
        width: battlefield.width,
        height: battlefield.height
      },
      robots: {},
      shells: {},
      explosions: {}
    };

    // Get the HP, position and velocity of robots.
    for (let robot of battlefield.robots) {
      status.robots[robot.id] = {
        hp: robot.hp,
        position: {
          x: robot.position.x,
          y: robot.position.y
        },
        velocity: {
          x: robot.velocity.x,
          y: robot.velocity.y
        }
      };
    }

    // Get the position and velocity of fired shells.
    for (let shell of battlefield.shells) {
      status.shells[shell.id] = {
        position: {
          x: shell.position.x,
          y: shell.position.y
        },
        velocity: {
          x: shell.velocity.x,
          y: shell.velocity.y
        }
      };
    }

    // Get the position and radius of explosions.
    for (let explosion of battlefield.explosions) {
      status.explosions[explosion.id] = {
        position: {
          x: explosion.position.x,
          y: explosion.position.y
        },
        radius: explosion.radius
      };
    }

    this.status = status;
  };

  return Battlefield;
});

