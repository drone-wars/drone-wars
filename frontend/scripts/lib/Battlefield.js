define(['Robot', 'Shell', 'Explosion'], function (Robot, Shell, Explosion) {
  'use strict';

  function displayWinMessage(battlefield){
    var robots = battlefield.robots;
    var canvasContext = battlefield.canvasContext;

    if(robots.size > 1){
      return;
    }

    canvasContext.font = "32px Helvetica";
    canvasContext.fillText('Robot ' + robots.values().next().value.id + ' wins!', 30, 30);
  }

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
      canvasContext: battlefield.canvasContext,
      t: window.performance.now(),
      battlefield: battlefield
    });

    battlefield.robots.add(robot);

    robot.once('destroyed', function () {
      battlefield.robots.delete(robot);

      var explosion = new Explosion({
        position: {
          x: robot.position.x,
          y: robot.position.y
        },
        canvasContext: battlefield.canvasContext,
        radius: 100,
        strength: 50 / 1000,
        duration: 6000,
        t: window.performance.now()
      });

      battlefield.explosions.add(explosion);

      explosion.once('cleared', function () {
        battlefield.explosions.delete(explosion);

        displayWinMessage(battlefield);
      });
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
      speed: 0.75,
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
      canvasContext: battlefield.canvasContext,
      radius: 20,
      strength: 10 / 1000,
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
    for (var robot of this.robots) {
      robot.calculate(t, this);
    }

    // Calculate new shell positions.
    for (var shell of this.shells) {
      shell.calculate(t);
    }

    // Calculate progress of explosions.
    for (var explosion of this.explosions) {
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
    for (var robot of this.robots) {
      robot.render();
    }

    // Render shells.
    for (var shell of this.shells) {
      shell.render();
    }

    // Render explosions.
    for (var explosion of this.explosions) {
      explosion.render();
    }
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

    // Get the HP, position and velocity of robots.
    for (var robot of this.robots) {
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
    for (var shell of this.shells) {
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
    for (var explosion of this.explosions) {
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

