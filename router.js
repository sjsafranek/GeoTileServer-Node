#!/usr/bin/env node

// router.js
var xml = require('xml');
var express = require('express');
var logger = require('./logger.js').logger;

log = logger('router');

// call the local packages
var utils = require('./utils');
var config = require('./settings.js').config;
var TileWorker = require('./worker.js').TileWorker;

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router


// https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic

// ApiRoot
router.get('/', function (req, res) {
    log.info({
        request: {
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            path: req.path,
            userAgent: req.headers['user-agent']
        }
    });
    res.json({
        Services: [
            {
                type: "TileMapService",
                title: "Tile Map Service",
                version: "1.0.0",
                href: "/tms/1.0.0/"
            }
        ]
    });

    return;

    res.set('Content-Type', 'text/xml');
    res.send(xml(
        '<?xml version="1.0" encoding="UTF-8" ?>'
        +'<Services>'
        +    '<TileMapService title="Example Tile Map Service" version="1.0.0" href="/tms/1.0.0/" />'
        // +    '<TileMapService title="New Example Tile Map Service" version="1.1.0" href="http://tms.osgeo.org/1.1.0/" />'
        // +    '<FancyFeatureService title="Features!" version="0.9" href="http://ffs.osgeo.org/0.9/" />'
        +'</Services>'
    ));
});

// TileMapService Resource
router.get('/1.0.0', function (req, res) {
    log.info({
        request: {
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            path: req.path,
            userAgent: req.headers['user-agent']
        }
    });
    var tileMaps = [];
    var datasources = utils.getDirectories('data');
    for (var i=0; i<datasources.length; i++) {
        tileMaps.push({
            title: datasources[i],
            srs: "EPSG:4326",
            profile: "global-geodetic",
            href: "/tms/1.0.0/" + datasources[i]
        });
    }
    res.json({
        TileMapService: {
            Title: "Tile Map Service",
            Abstract: "This is a longer description of the example tiling map service.",
            TileMaps: tileMaps
        }
    });

    return;

    res.set('Content-Type', 'text/xml');
    res.send(xml(
        '<?xml version="1.0" encoding="UTF-8" ?>'
        + '<TileMapService version="1.0.0" services="http://tms.osgeo.org">'
        +   '<Title>Tile Map Service</Title>'
        +   '<Abstract>This is a longer description of the example tiling map service.</Abstract>'
        //  | <KeywordList>example tile service</KeywordList>
        //  | <ContactInformation>
        //  |   <ContactPersonPrimary>
        //  |     <ContactPerson>Paul Ramsey</ContactPerson>
        //  |     <ContactOrganization>Refractions Research</ContactOrganization>
        //  |   </ContactPersonPrimary>
        //  |   <ContactPosition>Manager</ContactPosition>
        //  |   <ContactAddress>
        //  |     <AddressType>postal</AddressType>
        //  |     <Address>300 - 1207 Douglas Street</Address>
        //  |     <City>Victoria</City>
        //  |     <StateOrProvince>British Columbia</StateOrProvince>
        //  |     <PostCode>V8W2E7</PostCode>
        //  |     <Country>Canada</Country>
        //  |   </ContactAddress>
        //  |   <ContactVoiceTelephone>12503833022</ContactVoiceTelephone>
        //  |   <ContactFacsimileTelephone>12503832140</ContactFacsimileTelephone>
        //  |   <ContactElectronicMailAddress>pramsey@refractions.net</ContactElectronicMailAddress>
        //  | </ContactInformation>
         + '<TileMaps>'
            //  <TileMap
            //    title="VMAP0 World Map"
            //    srs="EPSG:4326"
            //    profile="global-geodetic"
            //    href="http://tms.osgeo.org/1.0.0/vmap0" />
         +  '</TileMaps>'
         +'</TileMapService>'
    ));
});


// TileMap Resource
router.get('/1.0.0/:ds', function (req, res) {
    log.info({
        request: {
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            path: req.path,
            userAgent: req.headers['user-agent']
        }
    });
    var MAX_ZOOM_LEVEL = 22;
    var tileSets = [];
    for (var i=0; i<=MAX_ZOOM_LEVEL; i++) {
        tileSets.push({
            href: '/tms/1.0.0/'+req.params.ds+'/'+i,
            units_per_pixel: 0.703125 / Math.pow(2, i),
            order: i,
            profile: 'global-geodetic'
        })
    }

    res.json({
        TileMap: {
            Title: req.params.ds,
            Abstract: "A map of the world built from the NGA VMAP0 vector data set",
            SRS: 'EPSG:4326',
            BoundingBox: {
                minx: -180,
                miny: -90,
                maxx: 180,
                maxy: 90
            },
            Origin: {
                x: -180,
                y: -90
            },
            TileFormat: {
                width: 256,
                height: 256,
                mime_type: "image/png",
                extension: "png"
            },
            TileSets: tileSets
        }
    });

    return;

    res.set('Content-Type', 'text/xml');
    res.send(xml(
        '<?xml version="1.0" encoding="UTF-8" ?>'
        +'<TileMap version="1.0.0" tilemapservice="http://tms.osgeo.org/1.0.0">'
        +    '<Title>VMAP0 World Map</Title>'
        +    '<Abstract>A map of the world built from the NGA VMAP0 vector data set.</Abstract>'
            // | <KeywordList></KeywordList>
            // | <Metadata type="TC211" mime-type="text/xml" href="http://www.org" />
            // | <Attribution>
            // |   <Title>National Geospatial Intelligence Agency</Title>
            // |   <Logo width="10" height="10" href="http://nga.mil/logo.gif" mime-type="image/gif" />
            // | </Attribution>
            // | <WebMapContext href="http://wms.org" />
            // | <Face>0</Face>
        +    '<SRS>EPSG:4326</SRS>'
        +    '<BoundingBox minx="-180" miny="-90" maxx="180" maxy="90" />'
        +    '<Origin x="-180" y="-90" />'
        +    '<TileFormat width="256" height="256" mime-type="image/png" extension="png" />'
        +    '<TileSets profile=global-geodetic">'
        +        '<TileSet href="http://tms.osgeo.org/1.0.0/vmap0/0" units-per-pixel="0.703125" order="0" />'
        +        '<TileSet href="http://tms.osgeo.org/1.0.0/vmap0/1" units-per-pixel="0.3515625" order="1" />'
        +        '<TileSet href="http://tms.osgeo.org/1.0.0/vmap0/2" units-per-pixel="0.17578125" order="2" />'
        +        '<TileSet href="http://tms.osgeo.org/1.0.0/vmap0/3" units-per-pixel="0.08789063" order="3" />'
        +    '</TileSets>'
        +'</TileMap>'
    ));
});


router.get('/1.0.0/:ds/:z/:x/:y.:ext', function(req, res) {
    log.info({
        request: {
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            path: req.path,
            userAgent: req.headers['user-agent'],
            status: 'opened'
        }
    });

    var worker = TileWorker();

    // handle canceled requests
    req.on("close", function() {
        log.info({
            request: {
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                path: req.path,
                userAgent: req.headers['user-agent'],
                status: 'closed'
            }
        });
        worker.kill();
    });

    // handle response on separate thread
    worker
        .send({
            ds: req.params.ds,
            x: req.params.x,
            y: req.params.y,
            z: req.params.z,
            ext: req.params.ext,
            cache: config.CACHE_DIR,
            size: config.TILE_SIZE,
            stylesheet: 'data/' + req.params.ds + '/stylesheet.xml'
        })
        .on('message', function(response) {
            res.set('Cache-Control', 'max-age=86400, must-revalidate');
            res.sendFile(response.tile);
            worker.kill();
        })
        .on('error', function(error) {
            log.error({
                error: {
                    data: error
                }
            });
            res.status(500).send(error);
        });
});

// exports
exports.router = router;
