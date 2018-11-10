import EventEmitter from 'https://unpkg.com/vertebrate-event-emitter?module';
import getAngle from './get-angle.js';

export default class Shell extends EventEmitter {
  constructor(options) {
    super();

    this.origin = {
      x: options.position.x,
      y: options.position.y
    };

    this.position = {
      x: options.position.x,
      y: options.position.y
    };

    const gap = {
      x: options.targetPosition.x - options.position.x,
      y: options.targetPosition.y - options.position.y
    };

    const angle = getAngle(gap);

    this.range = Math.sqrt(gap.x * gap.x + gap.y * gap.y);
    this.startTime = options.t;

    this.velocity = {
      x: Math.cos(angle) * options.speed,
      y: Math.sin(angle) * options.speed
    };
  }

  calculate(t) {
    const dt = t - this.startTime;
    const xMove = dt * this.velocity.x;
    const yMove = dt * this.velocity.y;

    this.position = {
      x: this.origin.x + xMove,
      y: this.origin.y + yMove
    };

    if (Math.sqrt(xMove * xMove + yMove * yMove) >= this.range) {
      this.emit('explode');
    }
  }

  render(canvasContext) {
    canvasContext.fillStyle = 'black';
    canvasContext.beginPath();
    canvasContext.arc(this.position.x, this.position.y, 5, 0, 2 * Math.PI);
    canvasContext.fill();

    canvasContext.strokeStyle = 'white';
    canvasContext.beginPath();
    canvasContext.arc(this.position.x, this.position.y, 5, 0, 2 * Math.PI, true);
    canvasContext.stroke();
  }

  getPublicData() {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity }
    };
  }
}
