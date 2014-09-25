var uploadForm = document.getElementById('uploadForm');
var bodyFile = document.getElementById('bodyFile');
var turretFile = document.getElementById('turretFile');
var generateBody = document.getElementById('generateBody');
var generateTurret = document.getElementById('generateTurret');
var bodyCanvas = document.getElementById('bodyCanvas');
var generatedBody = document.getElementById('generatedBody');
var turretCanvas = document.getElementById('turretCanvas');
var submitButton = document.getElementById('submit');

function getRandomColor() {
  'use strict';

  function shade() {
    return Math.floor(Math.random() * 255).toString(16).toUpperCase();
  }

  return '#' + shade() + shade() + shade();
}

bodyFile.addEventListener('click', function () {
  'use strict';

  bodyCanvas.parentElement.classList.add('hidden');
  generatedBody.value = '';
}, false);

turretFile.addEventListener('click', function () {
  'use strict';

  turretCanvas.parentElement.classList.add('hidden');
  generatedTurret.value = '';
}, false);

submitButton.addEventListener('click', function (e) {
  'use strict';

  if(!bodyFile.value && !generatedBody.value){
    alert('Please upload or generate a body');
    e.preventDefault();
  } else if(!turretFile.value && !generatedTurret.value){
    alert('Please upload or generate a turret');
    e.preventDefault();
  }

}, false);

function generateRandomTankBody() {
  'use strict';

  var canvas = bodyCanvas;
  var context = canvas.getContext('2d');
  var mainBodyColor = getRandomColor();
  var bodyTrimColor = getRandomColor();

  canvas.parentElement.classList.remove('hidden');

  context.fillStyle = mainBodyColor;
  context.fillRect(5, 5, 45, 40);
  context.strokeRect(5, 5, 45, 40);

  context.fillStyle = bodyTrimColor;
  context.fillRect(45, 5, 5, 40);
  context.strokeRect(45, 5, 5, 40);

  generatedBody.value = canvas.toDataURL();
  bodyFile.value = '';
}

function generateRandomTankTurret() {
  'use strict';

  var canvas = turretCanvas;
  var context = canvas.getContext('2d');
  var mainTurretColor = getRandomColor();
  var turretTrimColor = getRandomColor();

  canvas.parentElement.classList.remove('hidden');

  context.fillStyle = mainTurretColor;
  context.fillRect(5, 15, 40, 20);
  context.strokeRect(5, 15, 40, 20);

  context.fillStyle = turretTrimColor;
  context.fillRect(40, 15, 5, 20);
  context.strokeRect(40, 15, 5, 20);

  generatedTurret.value = canvas.toDataURL();
  turretFile.value = '';
}

generateBody.addEventListener('click', generateRandomTankBody, false);
generateTurret.addEventListener('click', generateRandomTankTurret, false);
