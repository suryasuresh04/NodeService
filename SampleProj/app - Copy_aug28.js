var express = require("express");
var fs = require('fs');
var bing = require('bingspeech-api-client');
var LUISClient = require('luis-sdk');

var subscriptionKey = '5cb2a3f59d724165958d473025c8a31f';
var count = 0;
var app = express();
var APPID = '605ae73d-d349-41d3-a639-87c48a3f238f',
        APPKEY = 'f70081ac7af946bd8de16c657259f9fd',
        LUISclient = new LUISClient({
            appId: APPID,
            appKey: APPKEY,
            verbose: true
        });

var printOnSuccess = function (response) {
    'use strict';
    var i = null;
    /*console.log(response);
    console.log("-------------------");
    console.log("Query: " + response.query);
    console.log("Top Intent: " + response.topScoringIntent.intent);
    console.log("Entities:");*/
    for (i = 1; i <= response.entities.length; i++) {
        console.log(i + "- " + response.entities[i - 1].entity);
    }
    if (typeof response.dialog !== "undefined" && response.dialog !== null) {
        console.log("Dialog Status: " + response.dialog.status);
        if (!response.dialog.isFinished()) {
            console.log("Dialog Parameter Name: " + response.dialog.parameterName);
            console.log("Dialog Prompt: " + response.dialog.prompt);
        }
    }
};

//const speech = require('./speech.1.0.0.js');

var LuisCall = function (text) {
    'use strict';
	LUISclient.predict(text, {
    //On success of prediction
        onSuccess: function (response) {
            printOnSuccess(response);
            return response;
        },

    //On failure of prediction
        onFailure: function (err) {
            console.log(err);
            return "Sorry try again after some time";
        }
    });
	
};

var requestCall = function (audio) {
    'use strict';
    var temp =  null, client = new bing.BingSpeechClient(subscriptionKey),
        respon = null,
        final = null;
    respon = client.recognizeStream(audio)
        .then(response => function(){
            temp = LuisCall(response.results[0].name);
            console.log("inside request call ----->" + temp);
            return temp;
    });
    /*console.log(respon);
    final = new LuisCall(respon.results[0].name);*/
/*        .then(response => function(){
            temp = LuisCall(response.results[0].name);
            console.log("inside request call ----->" + temp);
            return temp;
    });*/
    
};

var server = app.listen(3000, function () {
    'use strict';
	console.log("Lisening in port 3000");
});

app.get("/", function (req, res) {
    'use strict';
    res.send("<h1>hello<h1>");

});

app.get("/test/:id", function (req, res) {
    'use strict';
	console.log(req.params.id);
    res.send("<h1>" + req.params.id + "<h1>");

});

app.get("/speechRecog", function (req, res) {
    /*	res.socket.setTimeout(300,res.socket.destroy());
    res.socket.destroy();
    var test = speechtoTxt(req,res.send());
    console.log(res.socket.destroyed);
    res.socket.unref(); */
    'use strict';
    var resp = "No audio file found",
        audioStream = null,
        audioCall = null,
        temp = null;
    if (req.params.audio) {
        temp = requestCall(req.params.audio);/*.then(response => res.send(response))*/
    } else {
        if (count % 2 === 0) {
            audioStream = fs.createReadStream('whatstheweatherlike.wav');
        } else {
            audioStream = fs.createReadStream('youve-been-acting.wav');
        }
        audioCall = requestCall(audioStream);
        //.then (resposne => function(){
        //console.log("else temp value --------------------------" + temp);
        //	res.send(response);
        //	})
        //.then(response => res.send(response));
        //promise.done();

        count = count + 1;
        console.log("else temp value --------------------------" + count);
        //requestCall(audioStream).then(response => console.log("speechRecog ----->" + response));
        //res.send(resp);
    }
    /* else{
    resp = requestCall(audioStream);
    } */

});