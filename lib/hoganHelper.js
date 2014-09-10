'use strict';

var fs = require('fs');
var hogan = require('hogan.js');
var viewDir;

function compileTemplate(name, fn){
    var fullPath = name,
        tmpl;

    fs.readFile(fullPath, 'utf8', function(err, str){
        if (err) {
            return fn(err);
        }
        try {
            tmpl = hogan.compile(str);
        } catch (e) {
            fn(e);
        }
        fn(null, tmpl);
    });
}

function renderTemplate(name, data, fn){
    compileTemplate(name, function(err, tmpl){
        var result;

        if(err) {
            return fn(err);
        }

        try {
            result = tmpl.render(data);
        } catch (e) {
            err = e;
        }

        fn(err, result);
    });
}

module.exports = renderTemplate;
module.exports.configure = function(app){
    viewDir = app.set('views');
};
