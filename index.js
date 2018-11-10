'use strict';

const path = require('path');
const express = require('express');
const formidable = require('express-formidable');
const uploadRobot = require('./middleware/uploadRobot');
const getRobotIds = require('./middleware/getRobotIds');
const getRobotsData = require('./middleware/getRobotsData');

const app = express();

app.use(express.static('frontend'));
app.use(express.static(path.join(__dirname, 'uploads')));

app.get('/robots-data', getRobotsData);
app.post('/upload-robot', formidable(), uploadRobot);
app.get('/robot-ids', getRobotIds);

app.listen(8080, () => console.log('Listening on port:', 8080)); // eslint-disable-line no-console
