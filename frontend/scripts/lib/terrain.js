/* global noise */

function calculateValue(scales, x, y, depth) {
  let value = 0;

  for (const scale of scales) {
    value += noise.simplex3(x / scale.freq, y / scale.freq, depth) * scale.amp;
  }

  return Math.abs(value);
}

function setupCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  return canvas.getContext('2d').createImageData(width, height);
}

export default class Terrain {
  constructor(options) {
    const depth = Math.random();
    const scales = [
      { freq: 30 * options.granularity, amp: 4 },
      { freq: 60 * options.granularity, amp: 8 },
      { freq: 120 * options.granularity, amp: 16 },
      { freq: 240 * options.granularity, amp: 32 },
      { freq: 480 * options.granularity, amp: 64 },
      { freq: 960 * options.granularity, amp: 128 }
    ];

    this.image = setupCanvas(options.width, options.height);
    this.passable = new Uint8ClampedArray(options.width * options.height);

    for (let x = 0; x < options.width; x++) {
      for (let y = 0; y < options.height; y++) {
        const value = calculateValue(scales, x, y, depth);
        const cell = (x + y * options.width) * 4;

        if (value > 128) {
          this.image.data[cell] = 100;
          this.image.data[cell + 1] = 100;
          this.image.data[cell + 2] = 100;
        } else if (value > 8) {
          this.image.data[cell] = 52 / 32 * value;
          this.image.data[cell + 1] = 122 / 32 * value;
          this.image.data[cell + 2] = 48 / 32 * value;
        } else {
          this.image.data[cell] = 34 / 16 * value;
          this.image.data[cell + 1] = 56 / 16 * value;
          this.image.data[cell + 2] = 162 / 16 * value;
        }

        // Opacity.
        this.image.data[cell + 3] = 255;

        this.passable[x + y * options.width] = value < options.threshold ? 1 : 0;
      }
    }
  }
}
