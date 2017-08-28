var express = require('express');
var multer  = require('multer');
var fs = require('fs');
var bing = require('bingspeech-api-client');
const LUISClient = require('luis-sdk');
var session = require('express-session');

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

var app = express();
app.use(session({secret: "Shh, its a secret!"}));

 var funcBing = function(audio,lastObj){
	 
	return new Promise(function(resolve, reject) {
	
	 if(audio)
	 {
		 audioStream = fs.createReadStream('./uploads/test.wav'); 
	 }
	 else{
		resolve("Please speak out something, we are happily willing to hear you ");
		 
	 } 
	 
	var client = new bing.BingSpeechClient(subscriptionKey);
	
	
	client.recognizeStream(audioStream).then(
		response => funcLUIS(response,lastObj))
			.then(response => deltaApiCall(response,lastObj))
			.then(response => resolve(response));
	});
 }
 
 var deltaRetrieveData =  function(flightNumber){
	 return new Promise(function(resolve, reject) {
		 var deltaResponse = {},
		d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;

    today =  [year, month, day].join('-');
					
					var body = '<flightStatusRequest><flightStatus><airlineCode>DL</airlineCode><flightNumber>'+flightNumber+'</flightNumber><flightOriginDate>'+today+'</flightOriginDate></flightStatus></flightStatusRequest>';

console.log(body);
					
					var postRequest = {
					host: "api.delta.com",
					path: "/api/mobile/getFlightStatus",
					method: "POST",
					headers: {
					'api-version':'1.0',
					'content-Type': 'application/xml',
					'content-length': Buffer.byteLength(body),
					'response-json':true
					}
					};
					
					var req = https.request( postRequest, function( res )    {   
					 var JsonResponse = "";
					res.on( "data", function( chunk ) { 
					JsonResponse += chunk;					
					} );
					res.on( "end", function( resp ) {
						 deltaResponse = JSON.parse(JsonResponse);
						 resolve(deltaResponse);
						// console.log(LUISresponse);
						//data.deltaResponse = LUISresponse;
						// console.log(data.deltaResponse);
					} );

					});
					req.write( body );
					req.on('error', function(e) {
					console.log('problem with request: ' + e.message);
					resolve({"error":"Sorry the delta service is currently unavailable"});
					});
					req.end();
	 });
 }
 
 
 var deltaApiCall = function(data,lastObj){
	return new Promise(function(resolve, reject) {
		if(!data.error)
		{
			console.log("api call");
		console.log(data.topScoringIntent.intent);
		
		if(data.topScoringIntent.intent == 'greeting')
		{
			data.flightNumber = "Hi User";
			resolve(data);
		}
		else if(data.topScoringIntent.intent == 'repeat')
		{
			resolve(lastObj);
		}
		else if(data.topScoringIntent.intent == 'fligh_status_intent')
		{
			var s = data.query;
			console.log(s);
			var m = s.match(/([^\?]*)\DL (\d*)/);
			console.log(m);
			if(m!=null && m!=undefined && m.length>0)
			{
				if(m[2]!="" && m[2]!=null && m[2]!=undefined && m[2]!='')
				{
					data.flightNumber = m[2];
					
					deltaRetrieveData(data.flightNumber).then(response => {
						data.deltaResponse = response;
						//console.log(JSON.stringify(data.deltaResponse));
						if(data.deltaResponse.flightStatusResponse != null && data.deltaResponse.flightStatusResponse != undefined)
						{
							//console.log("after success");
							if(data.deltaResponse.flightStatusResponse.status == "SUCCESS")
							{
								//console.log(data.deltaResponse.flightStatusResponse);
								if(data.deltaResponse.flightStatusResponse.statusResponse != null && data.deltaResponse.flightStatusResponse.statusResponse != undefined)
								{
									var statusResponse = data.deltaResponse.flightStatusResponse.statusResponse;
									if(statusResponse.flightStatusTO.flightStatusLegTOList.length==undefined)
									{
										var  tempObj = statusResponse.flightStatusTO.flightStatusLegTOList;
										statusResponse.flightStatusTO.flightStatusLegTOList =[];
										statusResponse.flightStatusTO.flightStatusLegTOList.push(tempObj);
									}
									var depart = statusResponse.flightStatusTO.flightStatusLegTOList[0].departureAirportName;
									var arrive = statusResponse.flightStatusTO.flightStatusLegTOList[0].arrivalAirportName;
									var status = statusResponse.flightStatusTO.flightStatusLegTOList[0].flightStateDescription;
									
									var date = new Date(statusResponse.flightStatusTO.flightStatusLegTOList[0].departureLocalTimeScheduled);


									var temp =statusResponse.flightStatusTO.flightStatusLegTOList[0].departureLocalTimeScheduled;
									 
									var offset=temp.slice(-6);
									var mins = offset.slice(-2);
									var ar = offset.substring(1,3);
									var minsOffsetVal = parseInt(ar*60)+ parseInt(mins);
									var sign = offset.substring(0,1);
									offsetVal = parseInt(sign+minsOffsetVal);

									date.setMinutes(date.getMinutes()+(offsetVal));
									console.log(date.toGMTString());
									var timeVal = date.toGMTString().substring(17,22);
									
									switch(status)
									{
										case "On Time":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" is on time and departs at " + timeVal;
										break;
										case "Planned":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" is on time and departs at " + timeVal;
										break;
										case "Behind Schedule":
										data.deltaResponse.voice = 	"Sorry for the inconvenience but the flight scheduled from "+ 	depart + " to "+arrive+" is behind schedule.";
										break;
										case "Early":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" is supposed to arrive early than expected.";
										break;
										case "At Gate":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" is at gate and expected to depart at " + timeVal;
										break;
										case "Boarding":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" is currently open for boarding in "+depart+" and departs at " + timeVal;
										break;
										case "Awaiting Takeoff":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" is awaiting to takeoff from "+depart;
										break;
										case "In flight":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" has departed from "+depart + " and is currently in flight";
										break;
										case "Landed":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" has landed on "+arrive;
										break;
										case "Flight Complete":
										data.deltaResponse.voice = 	"The flight scheduled from "+ 	depart + " to "+arrive+" has completed the journey ";
										break;
										case "Cancelled":
										data.deltaResponse.voice = 	"Sorry for the inconvenience but the flight scheduled from "+ 	depart + " to "+arrive+" is cancelled";
										break;
										case "Diverted":
										data.deltaResponse.voice = 	"Sorry for the inconvenience but the flight scheduled from "+ 	depart + " to "+arrive+" is diverted";
										break;
									}
									
								}
								else{
									data.deltaResponse.voice = 	"Please provide a valid delta flight number and try again";
								}
								
							}
						}
						else{
							data.deltaResponse.voice = 	"Please provide a valid delta flight number and try again";
						}
						
						resolve(data);
					})
					
								
				}
				else{
					data.deltaResponse.voice = 	"Please provide a valid delta flight number and try again";
					resolve(data);
				}
				
			}
			else{
				data.deltaResponse.voice = 	"Please provide a valid delta flight number and try again";
				resolve(data);
			}
			
		}
		else{
			data.flightNumber = "Please provide a valid flight number to get the status";
			resolve(data);
			
		}
			
		}
		else{
			data.flightNumber = data.error;
			resolve(data);
		}
		
		
		
	});
 }
 
 var funcLUIS =  function(response,lastObj){
	 return new Promise(function(resolve, reject) {
	var APPKEY = 'f70081ac7af946bd8de16c657259f9fd';
	var APPID = '605ae73d-d349-41d3-a639-87c48a3f238f';
	var LUISclient = LUISClient({
		appId: APPID,
		appKey: APPKEY,
		verbose: true
	});
	console.log("LUIS INSIDE");
	console.log(response);
	//console.log(response);
	if(response.results)
	{
	var returnResponse = LUISclient.predict(response.results[0].name, {

		//On success of prediction
		onSuccess: function (responseLUIS) {
			console.log("LUIS SUCCESS RESPONSE");
			//console.log(responseLUIS);
			resolve(responseLUIS);
		},

		//On failure of prediction
		onFailure: function (err) {
			console.error(err);
		resolve({"error":"Sorry try again after some time"});
		}
	})
	 }
	 else{
		 resolve({"error":"Sorry we cant recognize what you said.Please try again."});
	 }
	 });
 }

app.post('/profile', upload.single('test.wav'), function (req, res, next) {
	console.log("inside profile");
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  
  if(req.session.lastObj){
      req.session.lastObj = req.session.lastObj;
   } else {
      req.session.lastObj = "Sorry please try search again";
   }
  
  funcBing(req.file,req.session.lastObj).then(response => {req.session.lastObj = response; res.send(response)});
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
 // console.log(req.files);
   funcBing(req.files['test.wav'][0]).then(response => res.send(response));
})

var server = app.listen(3000, function () {
	console.log("Lisening in port 3000");
})