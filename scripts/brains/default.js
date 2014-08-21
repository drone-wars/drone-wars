var start = Date.now();
var lastFire = start;

onmessage = function () {
  var now = Date.now();

  var message = {
    type: 'decision',
    acceleration: {
      x: 0.00001 * Math.sin((now - start) / 1000),
      y: 0.00001 * Math.cos((now - start) / 1000)
    }
  };

  if (now - lastFire > 1000) {
    lastFire = now;

    message.fire = {
      target: { x: 250, y: 250 }
    };
  }

  postMessage(message);
};
