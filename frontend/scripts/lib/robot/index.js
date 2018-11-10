import EventEmitter from 'https://unpkg.com/vertebrate-event-emitter?module';
import getAngle from '/scripts/lib/get-angle.js';
import constants from './constants.js';
import sendBattleStatus from './send-battle-status.js';
import sendPassable from './send-passable.js';
import handleMessage from './handle-message.js';
import draw from './draw.js';

let id = 0;

function setupBody(path) {
  const body = document.createElement('img');
  body.src = path || 'img/robots/body.png';
  return body;
}

function setupTurret(path) {
  const turret = document.createElement('img');
  turret.src = path || 'img/robots/turret.png';
  return turret;
}

function setupWorker(robot, battlefield) {
  const worker = new Worker(robot.src);
  worker.onmessage = e => handleMessage(robot, battlefield, e.data);
  worker.onerror = error => console.error(error); // eslint-disable-line no-console
  robot.worker = worker;
}

export default class Robot extends EventEmitter {
  constructor(options) {
    super();

    this.lastTime = options.t;
    this.id = id.toString();
    this.hp = constants.maxHealth;
    this.position = options.position || { x: 200, y: 200 };
    this.velocity = options.velocity || { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.src = options.src || 'scripts/brains/avoider.js';
    this.name = options.name;
    this.rearmDuration = options.rearmDuration || 500;
    this.maxAcceleration = options.maxAcceleration || 0.00002;

    this.body = setupBody(options.body);
    this.turret = setupTurret(options.turret);

    this.turretAngle = 0;
    this.lastShot = window.performance.now();

    setupWorker(this, options.battlefield);

    this.token = null;

    sendPassable(this, options.battlefield.passable);
    sendBattleStatus(this, options.battlefield.status);

    id += 1;
  }

  calculate(t, battlefield) { // eslint-disable-line max-statements
    const dt = t - this.lastTime;
    const position = this.position;
    const velocity = this.velocity;
    const rawAcc = this.acceleration;
    const rawScalarAcc = Math.sqrt(rawAcc.x * rawAcc.x + rawAcc.y * rawAcc.y);

    if (rawScalarAcc > this.maxAcceleration) {
      this.acceleration.x = this.acceleration.x * this.maxAcceleration / rawScalarAcc;
      this.acceleration.y = this.acceleration.y * this.maxAcceleration / rawScalarAcc;
    }

    this.lastTime = t;
    this.battleStatus = battlefield.status;

    for (let i = battlefield.explosions.length - 1; i >= 0; i--) {
      const dead = this.hit(battlefield.explosions[i].intensity(this.position) * dt);

      if (dead) {
        return;
      }
    }

    velocity.x += this.acceleration.x * dt;
    velocity.y += this.acceleration.y * dt;

    const dx = velocity.x * dt;
    const dy = velocity.y * dt;

    position.x += dx;
    position.y += dy;

    const previousAngle = this.angle;

    this.angle = getAngle(velocity);
    this.turretAngle += previousAngle - this.angle;

    const width = this.body.width;
    const height = this.body.height;
    const cosAngle = Math.cos(this.angle);
    const sinAngle = Math.sin(this.angle);

    const frontLeft = {
      x: position.x + cosAngle * height / 2 - sinAngle * width / 2,
      y: position.y + sinAngle * height / 2 + cosAngle * width / 2
    };

    const frontRight = {
      x: position.x + cosAngle * height / 2 + sinAngle * width / 2,
      y: position.y + sinAngle * height / 2 - cosAngle * width / 2
    };

    if (battlefield.outOfBounds(frontLeft) || battlefield.outOfBounds(frontRight)) {
      velocity.x *= -1;
      velocity.y *= -1;

      position.x -= 2 * dx;
      position.y -= 2 * dy;

      this.angle = getAngle(velocity);

      this.hit(
        Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) * constants.collisionDamage
      );
    }
  }

  render(canvasContext) {
    draw(this, canvasContext);
  }

  hit(amount) {
    this.hp -= amount;

    if (this.hp > 0) {
      return false;
    }

    this.emit('destroyed');
    this.allOff();
    this.worker.terminate();
    this.worker = null;

    return true;
  }

  getPublicData() {
    return {
      hp: this.hp,
      position: { ...this.position },
      velocity: { ...this.velocity }
    };
  }
}
