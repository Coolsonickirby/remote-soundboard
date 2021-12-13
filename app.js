var portAudio = require('naudiodon');
const wav = require('wav');
const fs = require('fs');
var express = require('express');
var cors = require('cors');
const app = express();
const MAX_SOUNDS = 10;
var current_sound_count = 0;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(cors());

const port = 3000;

var devices = portAudio.getDevices();
var sounds = JSON.parse(fs.readFileSync("./sounds.json", { encoding: "utf-8" }))["sounds"];

app.get('/', (req, res) => {
    res.send("Hello!");
});

app.get('/devices', (req, res) => {
    refreshDevices();
    res.send(JSON.stringify(devices));
});

app.get('/sounds', (req, res) => {
    refreshSounds();
    res.send(JSON.stringify(sounds));
});

app.post('/playSound', (req, res) => {
    let data = res.req.body;
    console.log(current_sound_count);
    if (current_sound_count >= MAX_SOUNDS) {
        console.log("did not play");
        res.send("did not play sound [max sounds already playing]");
        return;
    }
    current_sound_count++;
    playSound(data["sound_id"], data["device_id"]);
    res.send("played sound");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

function refreshDevices() {
    devices = portAudio.getDevices();
}

function refreshSounds() {
    sounds = JSON.parse(fs.readFileSync("./sounds.json", { encoding: "utf-8" }))["sounds"];
}

function playSound(songID, deviceID) {
    try {
        let reader = new wav.Reader();
        const file = fs.createReadStream(sounds[songID]["sound"]);
        reader.on('format', function(format) {
            console.log("info");
            console.log(devices[deviceID].maxInputChannels);
            console.log(format.channels);
            var ao = new portAudio.AudioIO({
                outOptions: {
                    channelCount: format.channels,
                    sampleFormat: portAudio.SampleFormat16Bit,
                    sampleRate: format.sampleRate,
                    deviceId: parseInt(deviceID),
                }
            });

            reader.on('end', () => {});

            reader.pipe(ao);
            ao.start();
        });

        setTimeout(() => current_sound_count--, 2000);

        file.pipe(reader, {
            end: false
        });
    } catch (error) {
        return error;
    }
}

function passthroughAudio() {
    // Create an instance of AudioIO with inOptions (defaults are as below), which will return a ReadableStream
    var ao = new portAudio.AudioIO({
        outOptions: {
            channelCount: 2,
            sampleFormat: portAudio.SampleFormat16Bit,
            sampleRate: 44100,
            deviceId: 10
        }
    });

    var ai = new portAudio.AudioIO({
        inOptions: {
            channelCount: 2,
            sampleFormat: portAudio.SampleFormat16Bit,
            sampleRate: 44100,
            deviceId: 1, // Use -1 or omit the deviceId to select the default device
            closeOnError: true // Close the stream if an audio error is detected, if set false then just log the error
        }
    });

    console.log(devices[1]);
    console.log(devices[10]);

    //Start streaming
    ao.start();
    ai.start();

    ai.on('data', (chunk) => {
        ao.write(chunk);
    })



    // ai.pipe(ao);
    // ao.start();
}

// Figure this out later
// passthroughAudio();