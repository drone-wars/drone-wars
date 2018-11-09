'use strict';

const path = require('path');
const express = require('express');
const busboy = require('connect-busboy');
const hoganHelper = require('./lib/hoganHelper');
const uploadRobot = require('./middleware/uploadRobot');
const getRobotIds = require('./middleware/getRobotIds');
const getRobotsData = require('./middleware/getRobotsData');

const app = express();

app.use(express.static('frontend'));
app.use(express.static(path.join(__dirname, 'uploads')));

app.use(busboy());

app.set('view engine', 'template');
app.set('views', path.join(__dirname, '/views'));
app.engine('template', hoganHelper.render);

hoganHelper.configure(app);

app.get('/', getRobotsData);
app.post('/upload-robot', uploadRobot);
app.get('/robot-ids', getRobotIds);
app.get('/upload', (req, res) => {
  res.render('uploads.template');
});

app.listen(8080, () => console.log('Listening on port:', 8080)); // eslint-disable-line no-console
