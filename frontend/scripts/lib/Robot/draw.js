var constants = require('./constants');

function drawRobot(robot, canvasContext) {
  // Save the initial origin and angle.
  canvasContext.save();

  // Translate the canvas to the middle of the robot.
  canvasContext.translate(robot.position.x, robot.position.y);

  // Use the velocity to calculate the orientation of the robot.
  canvasContext.rotate(robot.angle);

  // Draw the robot body around the midpoint.
  canvasContext.drawImage(robot.body, -robot.body.width / 2, -robot.body.height / 2);

  // Rotate the canvas to the turret angle.
  canvasContext.rotate(robot.turretAngle - robot.angle);

  // Draw the turret.
  canvasContext.drawImage(robot.turret, -robot.turret.width / 2, -robot.turret.height / 2);

  // Restore the canvas origin and angle.
  canvasContext.restore();
}

function drawHealthBar(robot, canvasContext) {
  var healthLeftWidth = robot.hp / constants.maxHealth * constants.healthBarWidth;
  var xPos = robot.position.x - constants.healthBarXOffset;
  var yPos = robot.position.y - constants.healthBarYOffset;

  canvasContext.strokeStyle = 'black';
  canvasContext.strokeRect(xPos, yPos, constants.healthBarWidth, constants.healthBarHeight);

  canvasContext.fillStyle = 'green';
  canvasContext.fillRect(xPos, yPos, healthLeftWidth, constants.healthBarHeight);

  canvasContext.fillStyle = 'yellow';
  canvasContext.fillRect(
    xPos + healthLeftWidth, yPos,
    constants.healthBarWidth - healthLeftWidth,
    constants.healthBarHeight
  );
}

function drawName(robot, canvasContext) {
  if (!robot.name) {
    return;
  }

  canvasContext.fillStyle = 'white';
  canvasContext.fillText(robot.name, robot.position.x - 20, robot.position.y + 45);
}

function draw(robot, canvasContext) {
  drawRobot(robot, canvasContext);
  drawHealthBar(robot, canvasContext);
  drawName(robot, canvasContext);
}

module.exports = draw;
