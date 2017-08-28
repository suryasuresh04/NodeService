var express = require("express");
var fs = require('fs');
var bing = require('bingspeech-api-client');
const LUISClient = require('luis-sdk');


var subscriptionKey = '5cb2a3f59d724165958d473025c8a31f';

var count=0;

var app = express()

//const speech = require('./speech.1.0.0.js');



var server = app.listen(3000,function(){
	console.log("Lisening in port 3000");
});

app.get("/",function(req,res){
    res.send("<h1>hello<h1>")  ;

})

app.get("/test/:id",function(req,res){
	console.log(req.params.id);
    res.send("<h1>"+req.params.id+"<h1>")  ;

})

app.get("/speechRecog",function(req,res){
/*	res.socket.setTimeout(300,res.socket.destroy());
	res.socket.destroy();
	var test = speechtoTxt(req,res.send());
 	console.log(res.socket.destroyed);
	res.socket.unref(); */
	var resp = "No audio file found";
	var audioStream = null;
	if(req.params.audio)
	{
		requestCall(req.params.audio).then(response => res.send(response));
	}
	else{
		if(count%2 == 0)
		{
			audioStream = fs.createReadStream('whatstheweatherlike.wav'); 
		}
		else{
			audioStream = fs.createReadStream('youve-been-acting.wav'); 
		}
		//var temp = 
		var temp = requestCall(audioStream);
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
	
})
 

//requestCall(audioStream);

/* var speechtoTxt = function(request){
	var resp = "No audio file found";
	if(request.audio)
	{
		resp = requestCall(request.audio);
	}
	else{
		resp = requestCall(audioStream);
	}
}  */


var requestCall = function (audio){
	var temp =  null;
	var client = new bing.BingSpeechClient(subscriptionKey);
	client.recognizeStream(audio)
	  .then(response => function(){
		  temp = LuisCall(response.results[0].name);
		  console.log("inside request call ----->" + temp);
		return temp;
	  }); 
	  //.then(response => )
	  
      /* .then(response => console.log(response.results[0].name)); */
}



	  
var LuisCall = function (text) {
	
var APPID = '605ae73d-d349-41d3-a639-87c48a3f238f';
var APPKEY = 'f70081ac7af946bd8de16c657259f9fd';
	
/* 	console.log(text);
	console.log(APPID);
	console.log(APPKEY); */
	
	var LUISclient = LUISClient({
  appId: APPID,
  appKey: APPKEY,
  verbose: true
});
	
	LUISclient.predict(text, {

  //On success of prediction
  onSuccess: function (response) {
    printOnSuccess(response);
	return response;
  },

  //On failure of prediction
  onFailure: function (err) {
    console.error(err);
	return "Sorry try again after some time";
  }
});
	
}

var printOnSuccess = function (response) {
	console.log(response);
	console.log("-------------------");
  console.log("Query: " + response.query);
  console.log("Top Intent: " + response.topScoringIntent.intent);
  console.log("Entities:");
  for (var i = 1; i <= response.entities.length; i++) {
    console.log(i + "- " + response.entities[i-1].entity);
  }
  if (typeof response.dialog !== "undefined" && response.dialog !== null) {
    console.log("Dialog Status: " + response.dialog.status);
    if(!response.dialog.isFinished()) {
      console.log("Dialog Parameter Name: " + response.dialog.parameterName);
      console.log("Dialog Prompt: " + response.dialog.prompt);
    }
  }
};