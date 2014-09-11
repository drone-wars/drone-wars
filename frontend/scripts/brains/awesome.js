/* globals importScripts, cortex */
importScripts('/scripts/brains/cortex.js');
var count = 0;

function decider (data, done) {
  var message = {
    acceleration : { x: 0, y: 0 },
    token: data.token
  };

  /////////////////////////////////////////////////////

  var buffer = 150;
  var field = {
    x: [
      buffer,
      data.status.field.width - buffer
    ],
    y: [
      buffer,
      data.status.field.height - buffer
    ]
  };
/*
  var center = {
    x: data.status.field.width / 2,
    y: data.status.field.height / 2
  };

  var radius = 750;

  var vector = {
    x: data.robot.position.x - center.x,
    y: data.robot.position.y - center.y
  };

  var dR = Math.sqrt(Math.pow(vector.x, 2), Math.pow(vector.y, 2));
  var scalar = radius / dR;

  var aim = {
    x: scalar * vector.x,
    y: scalar * vector.y
  };
  
 */  

  var center = {
    x: data.status.field.width / 2,
    y: data.status.field.height / 2
  };

  var position = data.robot.position;

  if (count < 10000) {
    message.acceleration = {
      x: center.x - position.y,
      y: center.y - position.x
    };
  } else {
    message.acceleration = {
      x: center.x - position.x,
      y: center.y - position.y
    };
  }

  count ++;

/*
  var closeToWall = isCloseToWall(data.robot.position, field);
  if (closeToWall[0] || closeToWall[1]) {
    message.log = 'Close to wall!!!!';
    if (closeToWall[0]) {
      message.acceleration.x *= -1.5;
    }
    if (closeToWall[1]) {
      message.acceleration.y *= -1.5;
    }
  }
*/
  done(null, message);
}

function isCloseToWall (position, field) {
  var closeToVertical = position.x < field.x[0] || position.x > field.x[1];
  var closeToHorizontal = position.y < field.y[1] || position.y > field.y[0];

  var returnVal = [];
  if (closeToVertical) {
    returnVal[0] = true;
  }
  if (closeToHorizontal) {
    returnVal[1] = true;
  }
  return returnVal;
}

cortex.init(decider);
