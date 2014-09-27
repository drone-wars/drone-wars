var processDecision = require('./processDecision');

function handleMessage(robot, battlefield, message) {
  switch (message.type) {
  case 'decision':
    return processDecision(robot, battlefield, message.data);

  case 'error':
    return console.error(message.data);

  case 'debug':
    return console.log(message.data);

  default:
    return console.log('Message from robot worker ', robot.id + ':', message);
  }
}

module.exports = handleMessage;
