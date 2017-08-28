var express = require('express');
var multer  = require('multer');
var fs = require('fs');
var bing = require('bingspeech-api-client');
const LUISClient = require('luis-sdk');

var https = require('https');

var subscriptionKey = '5cb2a3f59d724165958d473025c8a31f';

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname)
  }
})

var upload = multer({ storage: storage })

var app = express()

 var funcBing = function(audio){
	 
	return new Promise(function(resolve, reject) {
		
		//audioStream = fs.createReadStream('youve-been-acting.wav'); 

		
	// var resp = "No audio file found";
	  if(audio)
	 {
		 audioStream = fs.createReadStream('./uploads/test.wav'); 
	 }
	 else{
		/* if(count%2 == 0)
		{
			audioStream = fs.createReadStream('whatstheweatherlike.wav'); 
		}
		else{
			audioStream = fs.createReadStream('youve-been-acting.wav'); 
		}
		count++;
		audioStream = fs.createReadStream('whatstheweatherlike.wav'); */
		resolve("Sorry the service is currently unavailabe please try again later");
		 
	 } 
	 
	var client = new bing.BingSpeechClient(subscriptionKey);
	
	
	client.recognizeStream(audioStream).then(
		response => funcLUIS(response))
			.then(response => apiCall(response))
			.then(response => resolve(response.flightNumber));
		
	});
 }
 
 var apiCall = function(data){
	return new Promise(function(resolve, reject) {
		console.log("api call");
		console.log(data.topScoringIntent.intent);
		
		if(data.topScoringIntent.intent == 'fligh_status_intent')
		{
			var s = data.query;
			console.log(s);
			var m = s.match(/([^\?]*)\DL (\d*)/);
			console.log(m);
			if(m!=null)
			{
				if(m[2]!="")
				{
					data.flightNumber = m[2];
					var date = new Date();
					var year = date.getFullYear();
					var month = date.getMonth()+1;
					month = (month < 10 ? "0" : "") + month;
					var day  = date.getDate();
					var todayDate = year + "-"+ month + "-"+ day;
					var body = '<?xml version="1.0" encoding="utf-8"?>' + '<flightStatusRequest><flightStatus><airlineCode>DL</airlineCode><flightNumber>'+data.flightNumber+'</flightNumber><flightOriginDate>'+todayDate+'</flightOriginDate></flightStatus></flightStatusRequest>';
					console.log("body:"+body);

					var postRequest = {
					host: "stg-api.delta.com",
					path: "/api/mobile/getFlightStatus",
					//port: 80,
					method: "POST",
					headers: {
					'Cookie': "cookie",
					'Content-Type': 'text/xml',
					'Content-Length': Buffer.byteLength(body),
					'response-json':true
					}
					};
					console.log("before https call");
					var req = https.request( postRequest, function( res )    {
					console.log("---- status code"+ res.statusCode );
					//console.log( res.flightStatusResponse.statusResponse.faultDO.flightStatusTO.flightStatusLegTOList.flightStateDescription);
					console.log("++++statusResponse ==>"+res.statusResponse.flightStatusTO.flightNumber);	
					var buffer = "";
					var flightstatus = '';
					res.on( "data", function( resp ) { 
					buffer = buffer + resp; 
					
					} );
					res.on( "end", function( resp ) {
						console.log(buffer);
						console.log(" --- inside ---");
						console.log("response-------"+buffer);
						resolve(resp)
					} );

					});
					
					req.on('error', function(e) {
					console.log('problem with request: ' + e.message);
					});

					req.write( body );
					req.end();
					
				/* 	resolve(data);	 */				
				}
				else{
					data.flightNumber = "Sorry please provide a valid flight number";
				}
				
			}
			else{
				data.flightNumber = "Sorry please provide a flight number";
			}
			resolve(data);
			
		}
		else{
			data.flightNumber = "Please provide a valid flight number to get the status";
			resolve(data);
		}
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
	console.log("LUIS INSIDE");
	console.log(response);
	var returnResponse = LUISclient.predict(response.results[0].name, {

		//On success of prediction
		onSuccess: function (responseLUIS) {
			console.log("LUIS SUCCESS RESPONSE");
			console.log(responseLUIS);
			resolve(responseLUIS);
		},

		//On failure of prediction
		onFailure: function (err) {
			console.error(err);
			resolve("Sorry try again after some time");
		}
	})
	 });
 }

app.post('/profile', upload.single('test.wav'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  console.log(req.file);
   funcBing(req.file).then(response => res.send(response));
  // res.send("success");
})

app.get('/', function (req, res, next) {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
   res.send("success");
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
   res.send("success");
})

var cpUpload = upload.fields([{ name: 'test.wav', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
  console.log(req.files);
   funcBing(req.files['test.wav'][0]).then(response => res.send(response));
})

var server = app.listen(3000, function () {
	console.log("Lisening in port 3000");
})