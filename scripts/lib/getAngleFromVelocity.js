define(function(){
  'use strict';

  function getAngle(velocity) {
    // Basic arctangent only gives the right answer for +ve x.
    var angle = Math.atan(velocity.y / velocity.x);

    // If you don't believe me, draw the four quadrants out on paper.
    if (velocity.x < 0) {
      angle += Math.PI;
    }

    // Not strictly necessary, but nice to normalize.
    return angle < 0 ? 2 * Math.PI + angle : angle;
  }

  return getAngle;
});
