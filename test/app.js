var express = require("express");
var fs = require('fs');
var bing = require('bingspeech-api-client');
const LUISClient = require('luis-sdk');

var subscriptionKey = '5cb2a3f59d724165958d473025c8a31f';

var LUISoutputValue = {"error":"No audio file found"};

 console.log("1");
 var count =0;
 var app = express();
 
 var assignLUISoutput = function(obj){
	 LUISoutputValue = obj;
 }
 
 var funcBing = function(audio){
	return new Promise(function(resolve, reject) {
		 
	 //var resp = "No audio file found";
	 if(audio)
	 {
		 audioStream = audio;
	 }
	 else{
		 if(count%2 == 0)
		{
			audioStream = fs.createReadStream('whatstheweatherlike.wav'); 
		}
		else{
			audioStream = fs.createReadStream('youve-been-acting.wav'); 
		}
		count++;
		 
	 }
	 
	var client = new bing.BingSpeechClient(subscriptionKey);
	
	
	client.recognizeStream(audioStream).then(
		response => funcLUIS(response)).then(response => resolve(response))
		
	});
 }
 
 var funcLUIS =  function(response){
	 return new Promise(function(resolve, reject) {
	var APPID = '605ae73d-d349-41d3-a639-87c48a3f238f';
	var APPKEY = 'f70081ac7af946bd8de16c657259f9fd';
	var LUISclient = LUISClient({
		appId: APPID,
		appKey: APPKEY,
		verbose: true
	});
	console.log("response ------>" + response);
	var returnResponse = LUISclient.predict(response.results[0].name, {

		//On success of prediction
		onSuccess: function (responseLUIS) {
			console.log(responseLUIS);
			resolve(responseLUIS);
		},

		//On failure of prediction
		onFailure: function (err) {
			console.error(err);
			return "Sorry try again after some time";
			resolve("Sorry try again after some time");
		}
	})
	 });
 }
 
 var funcTest = function(test){
	 console.log("inside test func");
	 console.log(test);
 }
 

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
    'use strict';
    
		var resp = "No audio file found",
        audioStream = null,
        audioCall = null,
        temp = null;
    if (req.params.audio) {
        funcBing(req.params.audio).then(res.send(LUISoutputValue));
    } else {
         funcBing().then(response => res.send(response));
    }
	
});
 