var constants = require('./constants');

function drawRobot(robot) {
  // Save the initial origin and angle.
  robot.canvasContext.save();

  // Translate the canvas to the middle of the robot.
  robot.canvasContext.translate(robot.position.x, robot.position.y);

  // Use the velocity to calculate the orientation of the robot.
  robot.canvasContext.rotate(robot.angle);

  // Draw the robot body around the midpoint.
  robot.canvasContext.drawImage(robot.body, -robot.body.width / 2, -robot.body.height / 2);

  // Rotate the canvas to the turret angle.
  robot.canvasContext.rotate(robot.turretAngle - robot.angle);

  // Draw the turret.
  robot.canvasContext.drawImage(robot.turret, -robot.turret.width / 2, -robot.turret.height / 2);

  // Restore the canvas origin and angle.
  robot.canvasContext.restore();
}

function drawHealthBar(robot) {
  var healthLeftWidth = robot.hp / constants.maxHealth * constants.healthBarWidth;
  var xPos = robot.position.x - constants.healthBarXOffset;
  var yPos = robot.position.y - constants.healthBarYOffset;

  robot.canvasContext.strokeStyle = 'black';
  robot.canvasContext.strokeRect(xPos, yPos, constants.healthBarWidth, constants.healthBarHeight);

  robot.canvasContext.fillStyle = 'green';
  robot.canvasContext.fillRect(xPos, yPos, healthLeftWidth, constants.healthBarHeight);

  robot.canvasContext.fillStyle = 'yellow';
  robot.canvasContext.fillRect(
    xPos + healthLeftWidth, yPos,
    constants.healthBarWidth - healthLeftWidth,
    constants.healthBarHeight
  );
}

function drawName(robot) {
  if (!robot.name) {
    return;
  }

  robot.canvasContext.fillStyle = 'white';
  robot.canvasContext.fillText(robot.name, robot.position.x - 20, robot.position.y + 45);
}

function draw(robot) {
  drawRobot(robot);
  drawHealthBar(robot);
  drawName(robot);
}

module.exports = draw;
