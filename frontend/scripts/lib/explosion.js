import EventEmitter from 'https://unpkg.com/vertebrate-event-emitter?module';

export default class Explosion extends EventEmitter {
  constructor(options) {
    super();

    this.duration = options.duration;
    this.radius = options.radius;
    this.strength = options.strength;
    this.startTime = options.t;
    this.position = {
      x: options.position.x,
      y: options.position.y
    };
    this.state = 1;
  }

  intensity(position) {
    const dx = this.position.x - position.x;
    const dy = this.position.y - position.y;
    const intensity =  Math.sqrt(dx * dx + dy * dy) < this.radius ? this.strength * this.state : 0;

    return intensity;
  }

  calculate(t) {
    this.now = t;
    this.state = (this.duration - (this.now - this.startTime)) / this.duration;

    if (this.state <= 0) {
      this.emit('cleared');
      return;
    }
  }

  render(canvasContext) {
    const alpha = 1 - (this.now - this.startTime) / this.duration;

    canvasContext.fillStyle = `rgba(255, 75, 0, ${alpha})`;
    canvasContext.beginPath();
    canvasContext.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
    canvasContext.fill();
  }

  getPublicData() {
    return {
      position: { ...this.position },
      radius: this.radius,
      strength: this.strength
    };
  }
}
