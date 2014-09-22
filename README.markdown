# drone wars

A drone battleground with drone brains encased in web workers. The front end code should work in all
browsers that implement the web worker protocol.

## Quick start

The only prerequisite is that Node.js is installed. Once that's done, clone this repo, and from the
directory of the repo run:

```bash
npm install
```

When that is done, enter

```bash
node .
```

to start the server. Finally, [click here](http://localhost:8080?num-avoiders=3).

For a quick demonstration you can initialise the battlefield with any number of example robots via
query parameters:

 - `num-wanderers` - The number of wanderer robots you want.
 - `num-aggressors` - The number of aggressor robots you want.
 - `num-avoiders` - The number of avoider robots you want.

## About web workers

Web workers are processes spawned by the JavaScript engine. They can communicate with the parent
process. Web workers are handy for running background tasks without tying up the parent process. For
the purposes of a drone battle, they're useful for giving each drone a dedicated process to allow
them as much room as they need to think.

## The Battlefield

The battlefield contains nearly everything in the game. It sits in the main JS thread, and controls
where robots are, where shells (projectiles) are, and where explosions are. It recalculates and
paints a representation of these to the canvas in a [`requestAnimationFrame`][requestAnimationFrame]
cycle.

## Robots

Each robot is made up of two parts. The _body_ lives in the battlefield. This is the physical
location, velocity and damage that it has taken. The _brain_ lives in a web worker. It receives
updates from the body about itself and the rest of the battlefield, and then makes decisions on what
it wants the body to do in response to the updates. The _brain_ can direct the body to
accelerate (a vector) and to fire at a location, _and nothing else!_

This separation is an effort to enforce realism in the battle. For example, think of what you do
when driving a car. You don't really control the velocity, you control the accelerator and the
breaks. It also prevents cheating because I know you were thinking of trying to adjust your own hit
points (HP).

The brain-body update cycle is not coupled to the animation frame cycle. If, for whatever reason,
your robot brain is really slow, then it won't slow down the battlefield. It'll only make your robot
body less responsive to what's going on around it.

## Designing your brain

### Communication

A worker brain should be a single JavaScript file. As it will be executed in a web worker, it will
have access to only a subset of what you may be used to. As such, there is no `window` object, and
the global scope should be referenced as `self`. Messages from the body are emitted into the brain.
You can use either of the usual event listener patterns to listen for these messages:

#### Vanilla

```javascript
// The old-school way:
self.onmessage = function (evt) {
  if (evt.data.type === 'status') {
    // Use `evt.data` to make decisions.
  }
}

// The more modern way:
self.addEventListener('message', function (evt) {
  if (evt.data.type === 'status') {
    // Use `evt.data` to make decisions.
  }
}, false);
```

To send a decision back to the robot body, you need to use the `postMessage` method:

```javascript
// Message is the decision itself.
self.postMessage({
  type: 'decision',
  data: message
});
```

The battlefield will start this cycle by sending you a message first.

#### `cortex.init`

There is a fair amount of fuss involved with writing these functions and passing messages around.
A helper library called [`cortex`][cortex] has been provided, which includes a method for handling
this for you so you can concentrate on the logic:

```javascript
importScripts('/scripts/brains/cortex.js');

cortex.init(function decider(data, callback) {
  // The data here is the same as `evt.data` in the examples above.

  // The message below is the same as the message in the example above. Use the optional
  // error parameter if you want to log an error to your console, otherwise pass it `null`.
  callback(error, message);
});
```

#### `cortex.Queue`

`cortex.Queue` offers a rudimentary queue system, which can be handy if you want your robot brain to
work in _modes_. [The aggressor brain][aggressor] is an example that uses a queue to
operate in a targeting mode and a hunting mode, dynamically adding the next action to a queue.

Queues are a good way to get started, since they help you to partition your actions. For example,
you can write an action that moves a robot from position A to position B. You might also consider
writing an action that takes cover if you begin to take damage.

Queues are exposed as a constructor on cortex. The constructor takes no arguments:

```javascript
// Import cortex for helpers.
importScripts('/scripts/brains/cortex.js');

// Create the queue.
var queue = new cortex.Queue();

// Add an action to the queue.
queue.add(/* ... */);

// Feed the queue to `cortex.init` to listen for updates from the body.
cortex.init(queue.decider);
```

The queue instance exposes three methods:

```javascript
queue.add(/* action */); // Add an action to the queue.
queue.remove(/* action */); // Remove an action from the queue.
queue.decider(/* data, callback */); // Pass this function to cortex.init.
```

Actions are almost identical to a function you would pass to `cortex.init`, except they take a third
argument to the `callback`. If the action is complete, then this third argument should be set to
`true`. This tells the queue to remove this action and proceed to the next in the queue. If the
third argument to `callback` is falsy, then the current action is kept to be executed on the next
message from the robot body.

#### `cortex.log`

You'll quickly find that debugging inside a web worker is problematic. To help out a little,
`cortex` provides a `console.log` analogue called `cortex.log`, which can be used in exactly the
same way, and will proxy arguments to a `console.log` the main thread.

#### Data from the body.

The `data` field on the event, or alternatively the `data` argument of the function you pass to
`cortex.init` contains everything your brain should need to make decisions:

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
      // The ID of each robot as a key and the position, velocity, and HP (hit points) in the
      // value.
      123: {
        position: { x: 100, y: 200 },
        velocity: { x: 0.1, y: 0 },
        hp: 100
      }
    },

    // A hash of the projectiles in play.
    shells: {
      // The ID of each shell as a key and the position and velocity in the value.
      456: {
        position: { x: 200, y: 300 },
        velocity: { x: 0, y: 0.1 }
      }
    },

    // A hash of the explosions active.
    explosions: {
      // The ID of each explosion as a key and the position, radius, and strength in the value.
      789: {
        position: { x: 300, y: 400 },
        radius: 20,
        strength: 0.01
      }
    }
  },

  // You must include this token in your next decision to your robot body.
  token: '12765'
}
```

All coordinates are in px.

The token is **important**. It needs to be added to the message you build or your body will ignore
the message. Also note that the robots hash includes your robot. Be careful not to shoot yourself!

This data includes information on shells and explosions too. You can use these to avoid explosions
(which linger and will cause damage if you travel through them).

#### Messages to the body

Messages sent to the body are referred to here as _decisions_. They look like:

```javascript
var message = {
  acceleration: { x: 0, y: 0 }, // Acceleration vector.
  fire: { x: 100, y: 100 },     // Target position.
  token: '87683',               // Token.
};
```

The token is **required**. `acceleration` is optional. If you omit this field, then the robot will
continue with whatever acceleration it had before (which you can see in the `data` object). The
`fire` field is also optional. If you have fired, and try to fire again before the `rearmDuration`
has elapsed then it will be ignored.

`acceleration` is bounded by `maxAcceleration` which can be found in data from the robot body. If
you use an acceleration above this value, then it will be normalized down to the maximum
acceleration in the same direction.

## Example brains

Three example brains are provided. Feel free to base your efforts upon these.

### [wanderer.js][wanderer]

The wanderer uses the highest level API available to robots, a _neocortex_. This allows it to use a
declarative manner of commanding the robot, which might be useful for navigating a maze, but turns
out to be limited in a battle scenario since you lose the ability to continuously adapt to your
surroundings.

### [aggressor.js][aggressor]

Aggressor uses a queue system provided by `cortex` to operate in two different modes. It will first
acquire a target, and then queue up a mode that hunts the target until the target is gone, at which
point it will acquire a new target. The `cortex.Queue` system is really handy if you want a balance
between reactive and declarative. Each mode can be programmed to queue up a new mode and exit itself
under specific conditions, so it can be very adaptable.

### [avoider.js][avoider]

Avoider is almost completely reactive. It will maintain a target until the target is gone, and then
acquire a new target. Whilst that is happening it tries to avoid other robots and barriers. Avoider
encodes all this functionality in one big function, which is good for addressing multiple concerns
simultaneously but makes for a confusing code base.

## Terrain

In the first session the entire battlefield will be passable, so you only need to worry about
avoiding the borders. In the second session terrain may come into play, depending on how advanced
things get. After calling `cortex.init`, you will have available a `Uint8ClampedArray` instance
on `cortex.passable`. It will be filled with zeros and ones in the place of `false` and `true`. This
is a copy of the TypedArray that the battlefield itself uses to detect collisions.

[requestAnimationFrame]: https://developer.mozilla.org/en/docs/Web/API/window.requestAnimationFrame
[avoider]: /frontend/scripts/brains/avoider.js
[aggressor]: /frontend/scripts/brains/aggressor.js
[wanderer]: /frontend/scripts/brains/wanderer.js
[cortex]: /frontend/scripts/brains/cortex.js
