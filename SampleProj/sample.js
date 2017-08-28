console.log("Hello");
var date = new Date();
 var year = date.getFullYear();
 var month = date.getMonth()+1;
 month = (month < 10 ? "0" : "") + month;
  var day  = date.getDate();
  var todayDate = year + "-"+ month + "-"+ day;
  
console.log("year" +year+ "-"+ "month" + month + "-"+ "day" + day);
console.log("todayDate"+todayDate);
var fs = require('fs');
fs.readFile('jsonResponse.json', 'utf8', function (err,data) {
    var i;
	
	var jsonObject = JSON.parse(data);
	console.log(data[0].statusResponse.flightStatusTO.flightStatusLegTOList);
	

});