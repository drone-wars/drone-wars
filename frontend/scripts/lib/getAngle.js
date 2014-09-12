'use strict';

function getAngle(gapOrVelocity) {
  // Basic arctangent only gives the right answer for +ve x.
  var angle = Math.atan(gapOrVelocity.y / gapOrVelocity.x);

  // If you don't believe me, draw the four quadrants out on paper.
  if (gapOrVelocity.x < 0) {
    angle += Math.PI;
  }

  // Not strictly necessary, but nice to normalize.
  return angle < 0 ? 2 * Math.PI + angle : angle;
}

module.exports = getAngle;
