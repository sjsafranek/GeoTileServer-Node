#!/usr/bin/env node

// TMS Node Server - Mapnik
// =============================================================================

// vector tile server
// https://www.npmjs.com/package/tilesplash

var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');

var logger = require('./logger.js').logger;
log = logger('server');

// call the local packages
var router = require('./router.js').router;
var config = require('./settings.js').config;

var PROJECT = {
    name: 'GeoTileServer',
    major: 0,
    minor: 0,
    patch: 1,
    getVersion: function() {
        return this.name
            + '-' + this.major
            + '.' + this.minor
            + '.' + this.patch;
    }
}

const app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/tms', router);
app.use(
    '/static',
    express.static('static', {
        dotfiles: 'ignore',
        etag: false,
        extensions: ['htm', 'html'],
        index: false,
        maxAge: '1d',
        redirect: false,
        setHeaders: function (res, path, stat) {
            res.set('x-timestamp', Date.now())
        }
    })
);
app.use(
    '/cache',
    express.static('cache', {
        maxAge: '1d',
        redirect: false,
        setHeaders: function (res, path, stat) {
            res.set('x-timestamp', Date.now())
        }
    })
);


// MapView for datasources
// app.use(express.staticProvider(__dirname + '/templates'));
// app.engine('html'
app.get('/map', function (req, res) {
    log.info({
        request: {
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            path: req.path,
            userAgent: req.headers['user-agent']
        }
    });
    fs.readFile(__dirname + '/templates/map.html', 'utf8', function(err, text){
        res.send(text);
    });
});



// START THE SERVER
// =============================================================================
app.listen(config.PORT, function () {
    console.log('Starting', PROJECT.getVersion())
    console.log('Magic happens on port ' + config.PORT + '!');
    log.info('Running');
});
