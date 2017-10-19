#!/usr/bin/env node

var bunyan = require('bunyan');

exports.logger = function(name, dir) {
    return bunyan.createLogger({
        name: name,
        streams: [
            {
                level: 'info',
                stream: process.stdout            // log INFO and above to stdout
            },
            {
                level: 'error',
                path: 'log/error.log'  // log ERROR and above to a file
            }
        ]
    });
}
