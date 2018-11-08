import processDecision from '/scripts/lib/robot/process-decision.js';

export default function handleMessage(robot, battlefield, message) {
  switch (message.type) {
  case 'decision':
    return processDecision(robot, battlefield, message.data);

  case 'error':
    return console.error(message.data); // eslint-disable-line no-console

  case 'debug':
    return console.log(message.data); // eslint-disable-line no-console

  default:
    return console.log('Message from robot worker ', `${robot.id}:${message}`); // eslint-disable-line no-console
  }
}
