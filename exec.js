/*                                                                             *                                       *
 *  liri-node-js :                                                             *                                                                                                *
 *    (exec.js) - methods for obtaining user intent and executing the correct  *
 *                  command.                                                   *                                                                          *
 * ------------------------------------>8--------------------------------------*/

// import the modules that will be used for each command
    var clc = require('cli-color')
    , reader = require('line-by-line')
    , request = require('request')
    , Twitter = require('twitter')
    , keyring = require('./keys.js')
    , spotify = require('node-spotify-api')
    , fs = require('fs');
    var delay = 0;
// announce this file
console.log(clc.blue.bold(' +') + clc.italic(' exec.js'));

/* ------------------------------------8<--------------------------------------*/

// A function for appending to a text file...
function logAppend(data) {
    var filepath="./log.txt"
    fs.appendFile(filepath, data + '\n', (err) => {
        if (err) {
            throw Error(err);
        }
    });
}
// omdb-this-movie, spotify-this-song, parse-batch, get-twitter-timeline
function parseBatch(file) {
    console.log(clc.magenta.bold('> ' + file + '...'));
    logAppend('  > Parsing file for commands... (' + file + ')');
    lr = new reader(file);
    lr.on('error', (err) => {
        throw Error(err);
    });
    lr.on('line', (line) => {
        line = line.trim();
        if (line.slice(0,1) !== "#") {
            var pcs = line.split('=');
            if (!isCommand(pcs[0])) {
                logAppend('  !> Batch file has an unrecognized command...');
                logAppend('  !  "' + line + '"');
                throw Error('Found invalid command in batch file.');
            } else {
                setTimeout(function() {
                    execCommand(pcs[0], pcs[1]);
                }, delay);
                delay += 2000;
            }
        } else {
            console.log(clc.magenta(line));
            logAppend('  ' + line);
        }
    });
    lr.on('end', () => {
        console.log(clc.magenta('> END BATCH'));
        logAppend('  > END BATCH.');
    });
}
function spotifyThis(song) {
    if (song == null) song = "MMMbop";
    var client = new spotify(keyring.spotify);
    client.search({ type: "track", query: song }, (err, data) => {
        if (! err) {
            logAppend('#### Spotify Results: ####');
            for (var i = 0; i < data.tracks.items.length; i++) {
                var num = i + 1;
                if (num < 10) num = "0" + num;
                console.log('  [#' + num + ']: ' + data.tracks.items[i].artists[0].name + " - " + data.tracks.items[i].name);
                console.log('  + From the album: ' + data.tracks.items[i].album.name);
                console.log('  + Link: ' + data.tracks.items[i].href);
                console.log(' ');
                
                logAppend('    [#' + num + ']: ' + data.tracks.items[i].artists[0].name + ' - ' + data.tracks.items[i].name);
                logAppend('    + From the album: ' + data.tracks.items[i].album.name);
                logAppend('    + Link: ' + data.tracks.items[i].href + '\n');
            }
        }
    });
}
function isCommand(cmd) {
    var validOpts = [ 'do-what-it-says', 'movie-this', 'my-tweets', 'spotify-this-song' ];
    if (validOpts.indexOf(cmd) !== -1) {
        return true;
    } else {
        return false;
    }
}
function fetchOmdb(title) {
    logAppend('  ##> MOVIE INFO:')
    var qstring = "http://www.omdbapi.com/?t="
    qstring += escape(title);
    qstring += "&plot=full&apikey=40e9cece";
    request(qstring, function(err, resp, body) {
        if (! err && resp.statusCode === 200) {
            // Status code is good, no obvious errors
            var parsed = JSON.parse(body);
            console.log(clc.green('Movie info:'));
            console.log(clc.greenBright('  Title: ' + parsed.Title));
            console.log(clc.greenBright('  Year: ' + parsed.Year));
            console.log(clc.greenBright('  Country: ' + parsed.Country));
            console.log(clc.greenBright('  Language: ' + parsed.Language));
            console.log(clc.greenBright('  Rating: ' + parsed.Rating));
            console.log(clc.greenBright('  Actors: ' + parsed.Actors));
            console.log(clc.greenBright('  Runtime: ' + parsed.Runtime));
            console.log(clc.greenBright('  Plot: ' + parsed.Plot));
            logAppend('    > title:\t' + parsed.Title);
            logAppend('    > year:\t\t' + parsed.Year);
            logAppend('    > country:\t' + parsed.Country);
            logAppend('    > language:\t' + parsed.Language);
            logAppend('    > rating:\t' + parsed.Rating);
            logAppend('    > actors:\t' + parsed.Actors);
            logAppend('    > runtime:\t' + parsed.Runtime);
            logAppend('    > plot:\t\t' + parsed.Plot);

        } else {
            // Either status or error was an unexpected value
            throw Error(err + ' & scode = ' + resp.statusCode);
        }
    });
}
function myTweets(user=null) {
    if (user === null) user = 'realDonaldTrump';
    var client = new Twitter(keyring.twitter);
    var params = {
        screen_name: user,
        count: 20
    };
    client.get('statuses/user_timeline', params, (err, tweets, rsp) => {
        console.log(clc.blue('### realDonaldTrump\'s Timeline ###'));
        logAppend('  ######## Twitter timeline: ##################################')
        for (var i = 0; i < tweets.length; i++) {
            var name = tweets[i].user.name;
            var screenname = tweets[i].user.screen_name;
            var time = tweets[i].created_at;
            var content = tweets[i].text;
            var msgid = i + 1;
            if (msgid < 10) {
                msgid = "0" + msgid;
            }
            logAppend('    >## ' + msgid + ': ');
            logAppend(`      ${name} (${screenname}) @ ${time}:`);
            logAppend(`        ` + content.slice(0,70));
            logAppend('        ' + content.slice(70, ));
            console.log(clc.blue('  >## ' + clc.blueBright(msgid) + ' ###########################################'));
            console.log(clc.red('      ' + name + ' (') + '@' + screenname + clc.red(') @ ') + clc.red.italic(time) + clc.red(': '));
            console.log(clc.italic('        ' + content.slice(0, 70)));
            console.log(clc.italic('        ' + content.slice(70, )));
            
        }
        console.log(clc.blue('  fin.'));
        logAppend('  # tweets fin.')
    });
}
function execCommand(cmd, args=null) {
    console.log(clc.green(' >') + clc.italic(' execCommand' + clc.red('(') + cmd + ', ' + args + clc.red(')')));
    logAppend('  > execCommand(' + cmd + ', ' + args + ')...');
    switch (cmd) {
        case "do-what-it-says":
            parseBatch(args);
            break;
        case "movie-this":
            fetchOmdb(args);
            break;
        case "my-tweets":
            myTweets();
            break;
        case "spotify-this-song":
            spotifyThis(args);
            break;
        default:
            console.log(clc.green(' > ') + clc.italic(clc.underline('execCommand:') + 'Unrecognized command, no action taken.'));
            break;
    }
}
function init() {

    if (process.argv.length < 3) {
        throw Error('No arguments supplied');
    } else if (process.argv.kength == 3) {
        if (process.argv[2] == "my-tweets") {
            logAppend('\n\r#### LOG: ' + Date() + ' ##########');
            execCommand('my-tweets');
        } else {
            throw Error('Command was given without arguments...');
        }
    } else {
        logAppend('\n\r#### LOG: ' + Date() + ' ##########');        
        execCommand(process.argv[2], process.argv[3]);
    }
}
exports.init = init;