/* global Robot, Shell, Explosion */

(function (window, Robot, Shell, Explosion) {
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

  Battlefield.prototype.makeRobot = function (src) {
    var id = this.idInc;
    var battlefield = this;

    var robot = new Robot({
      id: this.idInc,
      src: src,
      canvas: this.canvas,
      canvasContext: this.canvasContext,
      t: window.performance.now()
    });

    battlefield.robots.add(robot);

    robot.once('destroyed', function () {
      battlefield.robots.delete(id);
      robot.removeAllListeners();
    });

    robot.on('ready', function () {
      robot.sendBattleStatus(battlefield.status);
    });

    robot.on('shoot', function (position, angle, range) {
      battlefield.makeShell(position, angle, range);
    });

    this.idInc += 1;
  };

  Battlefield.prototype.makeShell = function (location, angle, range) {
    var shell = new Shell({
      location: location,
      angle: angle,
      range: range,
      speed: 1 / 100,
      t: window.performance.now()
    });

    this.shells.add(shell);

    shell.once('explode', () => {
      this.shells.delete(shell);
      this.makeExplosion(shell.location);

      delete this.shells[shell.id];

      shell.removeAllListeners();
    });
  };

  Battlefield.prototype.makeExplosion = function (location) {
    var explosion = new Explosion({
      location: location,
      canvas: this.canvas,
      canvasContext: this.canvasContext,
      radius: 20,
      strength: 1 / 1000,
      duration: 4000,
      t: window.performance.now()
    });

    this.explosions.add(explosion);

    explosion.once('cleared', () => this.explosions.delete(explosion));
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
    var status = {
      robots: {},
      shells: {},
      explosions: {}
    };

    // Get the HP, position and velocity of robots.
    for (let robot of this.robots) {
      status.robots[robot.id] = {
        hp: robot.hp,
        position: robot.position,
        velocity: robot.velocity
      };
    }

    // Get the position and velocity of fired shells.
    for (let shell of this.shells) {
      status.shells[shell.id] = {
        position: shell.position,
        velocity: shell.velocity
      };
    }

    // Get the position and radius of explosions.
    for (let explosion of this.explosions) {
      status.explosions[explosion.id] = {
        position: explosion.position,
        radius: explosion.radius
      };
    }

    this.status = status;
  };

  window.Battlefield = Battlefield;
}(window, Robot, Shell, Explosion));

