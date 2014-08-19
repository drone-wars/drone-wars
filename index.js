'use strict';

var BattleField = require('battleField');

var canvas = document.getElementById('canvas');
var battleField = new BattleField(canvas);

// The sprites are animated using this function.
function draw(t) {
    // Render sprites for this time.
    battleField.render(t);

    // Next frame.
    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);
