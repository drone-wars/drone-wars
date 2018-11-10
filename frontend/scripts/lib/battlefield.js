import Robot from './robot/index.js';
import Shell from './shell.js';
import Explosion from './explosion.js';

export default class Battlefield {
  constructor(options) {
    const canvas = options.canvas;

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
  }

  makeRobot(options) {
    const name = options.name || `bot-${this.idInc}`;

    const robot = new Robot({
      position: options.position,
      velocity: options.velocity,
      maxAcceleration: options.maxAcceleration,
      id: this.idInc,
      name: this.showNames ? name : undefined,
      src: options.src,
      body: options.body,
      turret: options.turret,
      t: window.performance.now(),
      battlefield: this
    });

    this.robots.push(robot);

    robot.on('destroyed', () => {
      this.robots.splice(this.robots.indexOf(robot), 1);
      this.makeExplosion(robot.position, 100, 25 / 1000, 6000);

      robot.allOff();
    }, 1);

    robot.on('shoot', (position, targetPosition) => this.makeShell(position, targetPosition));

    this.idInc += 1;
  }

  makeShell(position, targetPosition) {
    const shell = new Shell({
      position: {
        x: position.x,
        y: position.y
      },
      targetPosition: {
        x: targetPosition.x,
        y: targetPosition.y
      },
      speed: 0.75,
      t: window.performance.now()
    });

    this.shells.push(shell);

    shell.on('explode', () => {
      this.shells.splice(this.shells.indexOf(shell), 1);
      this.makeExplosion(shell.position, 20, 10 / 1000, 4000);

      shell.allOff();
    }, 1);
  }

  makeExplosion(position, radius, strength, duration) {
    const explosion = new Explosion({
      position: {
        x: position.x,
        y: position.y
      },
      radius,
      strength,
      duration,
      t: window.performance.now()
    });

    this.explosions.push(explosion);

    explosion.on('cleared', () => {
      this.explosions.splice(this.explosions.indexOf(explosion), 1);

      explosion.allOff();
    }, 1);
  }

  calculate(t) {
    for (const robot of this.robots) {
      robot.calculate(t, this);
    }

    for (const shell of this.shells) {
      shell.calculate(t, this);
    }

    for (const explosion of this.explosions) {
      explosion.calculate(t, this);
    }

    this.updateStatus();
  }

  render() {
    // Clear the canvas.
    this.canvasContext.clearRect(0, 0, this.width, this.height);

    // Render background.
    if (this.background) {
      this.canvasContext.putImageData(this.background, 0, 0);
    }

    for (const robot of this.robots) {
      robot.render(this.canvasContext);
    }

    for (const shell of this.shells) {
      shell.render(this.canvasContext);
    }

    for (const explosion of this.explosions) {
      explosion.render(this.canvasContext);
    }
  }

  updateStatus() {
    const status = {
      field: {
        width: this.width,
        height: this.height
      },
      robots: {},
      shells: {},
      explosions: {}
    };

    for (const robot of this.robots) {
      status.robots[robot.id] = robot.getPublicData();
    }

    for (const shell of this.shells) {
      status.shells[shell.id] = shell.getPublicData();
    }

    for (const explosion of this.explosions) {
      status.explosions[explosion.id] = explosion.getPublicData();
    }

    this.status = status;
  }

  outOfBounds(position) {
    // TODO - This will need to be updated when the battlefield is more than just an empty
    //        rectangle.
    const x = Math.round(position.x);
    const y = Math.round(position.y);

    if (isNaN(x) || isNaN(y)) {
      return;
    }

    if (x < 0 || y < 0 || x > this.width || y > this.height) {
      return true;
    }

    return !this.passable[x + y * this.width];
  }
}
