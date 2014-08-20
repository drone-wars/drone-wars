/* global Battlefield */

(function (Battlefield) {
  'use strict';

  var canvas = document.getElementById('canvas');
  var battlefield = new Battlefield(canvas);

  // The sprites are animated using this function.
  function draw(t) {
    battlefield.calculate(t);
    battlefield.render();

    // Next frame.
    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);
}(Battlefield));
