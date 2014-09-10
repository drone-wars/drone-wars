# drone wars

A drone battleground with drone brains encased in web workers. The front end code should work in all
browsers that implement the web worker protocol.

# Coding your robot.

Your challenge is to code the _brain_ of your robot, which will sit in a web worker. You can expect
the body of your robot to send you messages about the itself, and also the surroundings, including
where other robots are and their velocities, active shells, and explosions. Given this data, the
brain you coded needs to make a decision on what to do next. It can choose to accelerate and/or
shoot.

## About web workers

Web workers are processes spawned by the JavaScript engine. They can communicate with the parent
process. Web workers are handy for running background tasks without tying up the parent process. For
the purposes of a drone battle, they're useful for giving each drone a dedicated process to allow
them as much room as they need to think.

## Fundamentals

You are provided with some helper functions in a script file called `cortex`. Using it is optional,
but will probably save you some effort.

### `init`

This function abstracts away some of the fuss around handling messages from your drone body. You
should feed it the function that makes decisions about drone body actions.

```javascript
// Import cortex for helpers.
importScripts('/scripts/brains/cortex.js');

function decider(data, callback) {
    // Do something with battlefield data to make a decision...

    // If there was an error, feed it to the first argument of callback. If a decision was made
    // Successfully then feed it to the second argument.
    callback(error, decision);
}

// Hand the decider function to cortex.init so that the cortex can call it whenever data arrives
// from the body.
cortex.init(decider);
```

When your robot is created in the battleground, it will call your decider function. Every time the
decider function returns, the body will update the cortex, and your decider function will be called
again. If you build a _very_ complex brain, it's possible that your robot will be less responsive,
since the robot will spend a lot of time in thought. For an example of a robot using `cortex.init`,
take a look in [the avoider brain](/frontend/scripts/brains/avoider.js).

### Queues

Cortex offers a rudimentary queue system, which can be handy if you want your robot brain to work in
_modes_. [The avoider brain](/frontend/scripts/brains/avoider.js) is an example that uses a queue to
operate in a targeting mode and a hunting mode, dynamically adding the next action to a queue.

Queues are a good way to get started, since they help you to partition your actions. For example,
you can write an action that moves a robot from position A to position B. You might also consider
writing an action that takes cover if you begin to take damage.

Queues are exposed as a constructor on cortex. The constructor takes no arguments:

```javascript
// Import cortex for helpers.
importScripts('/scripts/brains/cortex.js');

var queue = new cortex.Queue();
```

The queue instance exposes three methods:

```javascript
queue.add(/* action */); // Add an action to the queue.
queue.remove(/* action */); // Remove an action from the queue.
queue.decider(/* data, callback */); // Pass this function to cortex.init.
```

Actions are almost identical to a decider function, except they pass a third argument to the
callback. If the action is complete, then this third argument should be set to `true`.

### data

The data the decider function receives looks like:

```javascript
{
  type: 'status',

  // This is data for your robot body.
  robot: {
    id: 1,
    hp: 100,
    position: { x: 100, y: 100 },
    velocity: { x: 0.1, y: 0.1 },
    acceleration: { x: 0, y: 0 },
    maxAcceleration: 0.00002,
    width: 38,
    height: 36,
    rearmDuration: 500, // in ms
    timeSinceLastShot: 321 // in ms
  },

  // This contains the general status of the battlefield.
  status: {

    // The boundaries of the battlefield.
    field: {
        width: 1024,
        height: 768
    },

    // A hash of the position and velocity of all robots on the battlefield (including you!)
    robots: {
      // The ID of each robot as a key and the position and velocity in the value.
      123: { position: { x: 100, y: 200 }, velocity: { x: 0.1, y: 0 } }
    },

    // A hash of the projectiles in play.
    shells: {
      // The ID of each shell as a key and the position and velocity in the value.
      456: { position: { x: 200, y: 300 }, velocity: { x: 0, y: 0.1 } }
    },

    // A hash of the explosions active.
    explosions: {
      // The ID of each explosion as a key and the position in the value.
      789: { position: { x: 300, y: 400 } }
    }
  },

  // You must include this token in your next decision to your robot body.
  token: '12765'
}
```

The token is important. It needs to be added the message you build or your body will ignore the
message.

### Decision messages

A `decision` message contains data on acceleration and firing. The fundamental capabilities of a
robot are only these two things! Remember that the data you are making a decision on comes with a
token, which you must include in the message.

```javascript
var message = {
  acceleration: { x: 0, y: 0 }, // Acceleration vector.
  fire: { x: 100, y: 100 },     // Target position.
  token: '87683',               // Token.
};
```

