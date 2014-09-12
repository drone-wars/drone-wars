'use strict';

var express = require('express');
var busboy = require('connect-busboy');
var hoganHelper = require('./lib/hoganHelper');
var uploadRobot = require('./middleware/uploadRobot');
var getRobotIds = require('./middleware/getRobotIds');
var getRobotsData = require('./middleware/getRobotsData');

var app = express();

app.use(express.static('frontend', { 'index': ['index.html'] }));
app.use(busboy());
app.use(express.static(__dirname + '/uploads'));

app.set('view engine', 'template');
app.set('views', __dirname +  '/views');
app.engine('template', hoganHelper);

hoganHelper.configure(app);

app.get('/', getRobotsData, function(req, res){
    res.render('index.template', {robots: JSON.stringify(req.robots)});
});

app.post('/upload-robot', uploadRobot);
app.get('/robot-ids', getRobotIds);
app.get('/upload', function(req, res){
    res.render('uploads.template');
});

app.listen(process.env.OPENSHIFT_NODEJS_PORT || 3000, function(){
  console.log('Listening on port 3000...');
});
