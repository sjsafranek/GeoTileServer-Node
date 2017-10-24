#!/usr/bin/env node

// TMS Node Server - Mapnik
// =============================================================================

// vector tile server
// https://www.npmjs.com/package/tilesplash

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

// START THE SERVER
// =============================================================================
app.listen(config.PORT, function () {
    console.log('Starting', PROJECT.getVersion())
    console.log('Magic happens on port ' + config.PORT + '!');
    log.info('Running');
});
