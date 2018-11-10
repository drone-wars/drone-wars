const bodyFile = document.getElementById('bodyFile');
const turretFile = document.getElementById('turretFile');
const generateBody = document.getElementById('generateBody');
const generatedBody = document.getElementById('generatedBody');
const generateTurret = document.getElementById('generateTurret');
const generatedTurret = document.getElementById('generatedTurret');
const bodyCanvas = document.getElementById('bodyCanvas');
const turretCanvas = document.getElementById('turretCanvas');
const submitButton = document.getElementById('submit');

function getRandomColor() {
  function shade() {
    return Math.floor(Math.random() * 255)
      .toString(16)
      .toUpperCase();
  }

  return `#${shade()}${shade()}${shade()}`;
}

bodyFile.addEventListener('click', () => {
  bodyCanvas.parentElement.classList.add('hidden');
  generatedBody.value = '';
}, false);

turretFile.addEventListener('click', () => {
  turretCanvas.parentElement.classList.add('hidden');
  generatedTurret.value = '';
}, false);

submitButton.addEventListener('click', e => {
  if (!bodyFile.value && !generatedBody.value) {
    alert('Please upload or generate a body'); // eslint-disable-line no-alert
    e.preventDefault();
  } else if (!turretFile.value && !generatedTurret.value) {
    alert('Please upload or generate a turret'); // eslint-disable-line no-alert
    e.preventDefault();
  }
}, false);

function generateRandomTankBody() {
  const canvas = bodyCanvas;
  const context = canvas.getContext('2d');
  const mainBodyColor = getRandomColor();
  const bodyTrimColor = getRandomColor();

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
  const canvas = turretCanvas;
  const context = canvas.getContext('2d');
  const mainTurretColor = getRandomColor();
  const turretTrimColor = getRandomColor();

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
