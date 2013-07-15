#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://sleepy-beach-2707.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLExists = function(inurl) {
    var instr = inurl.toString();

    restler.get(inurl).on('complete', function(result) {
        if (result instanceof Error) {
            console.log("%s does not work. Exiting.", instr);
            process.exit(1);
        }
    });

    return instr;
};

var cheerioHtmlFile = function(htmlfile, checksfile, sourcetype) {
    var sourcedata;

    if (sourcetype == "file") {
        checkHtmlFile(cheerio.load(fs.readFileSync(htmlfile)), checksfile);
    } else if (sourcetype == "url") {
        restler.get(htmlfile).on('complete', function(result) {
            if (result instanceof Error) {
                console.log("%s does not work. Exiting.", instr);
                process.exit(1);
            } else {
                //console.log("%s:\n%s", htmlfile, result);
                checkHtmlFile(cheerio.load(result), checksfile);
            }
        });
    }
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function($, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    
    console.log(JSON.stringify(out, null, 4));
    
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), null)
        .option('-u, --url <url>', 'URL to index.html')
        .parse(process.argv);

    var datasource;
    var sourcetype;
    if (program.file) {
        datasource =  program.file;
        sourcetype = "file";
    } else if (program.url) {
        datasource = program.url;
        sourcetype = "url";
    }
    //console.log(program.url);

    var checkJson = cheerioHtmlFile(datasource, program.checks, sourcetype);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
