define(['Robot', 'Shell', 'Explosion'], function (Robot, Shell, Explosion) {
  'use strict';

  function Battlefield(canvas) {
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

    battlefield.robots.push(robot);

    robot.once('destroyed', function () {
      battlefield.robots.splice(battlefield.robots.indexOf(robot), 1);

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

      battlefield.explosions.push(explosion);

      explosion.once('cleared', function () {
        battlefield.explosions.splice(battlefield.explosions.indexOf(explosion), 1);
      });
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

    battlefield.explosions.push(explosion);

    explosion.once('cleared', function () {
      battlefield.explosions.splice(battlefield.explosions.indexOf(explosion), 1);
    });
  };

  Battlefield.prototype.calculate = function (t) {
    this.t = t;

    var i;

    // Calculate positions of robots.
    for (i = this.robots.length - 1; i >= 0; i--) {
      this.robots[i].calculate(t, this);
    }

    // Calculate new shell positions.
    for (i = this.shells.length - 1; i >= 0; i--) {
      this.shells[i].calculate(t);
    }

    // Calculate progress of explosions.
    for (i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].calculate(t);
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

    var i, len;

    // Render robots.
    for (i = 0, len = this.robots.length; i < len; i++) {
      this.robots[i].render();
    }

    // Render shells.
    for (i = 0, len = this.shells.length; i < len; i++) {
      this.shells[i].render();
    }

    // Render explosions.
    for (i = 0, len = this.explosions.length; i < len; i++) {
      this.explosions[i].render();
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

    var i, len;

    // Get the HP, position and velocity of robots.
    for (i = 0, len = this.robots.length; i < len; i++) {
      var robot = this.robots[i];

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
    for (i = 0, len = this.shells.length; i < len; i++) {
      var shell = this.shells[i];

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
    for (i = 0, len = this.explosions.length; i < len; i++) {
      var explosion = this.explosions[i];

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

  Battlefield.prototype.outOfBounds = function (position) {
    // TODO - This will need to be updated when the battlefield is more than just an empty
    //        rectangle.
    var x = position.x;
    var y = position.y;

    return x < 0 || y < 0 || x > this.width || y > this.height;
  };

  return Battlefield;
});

