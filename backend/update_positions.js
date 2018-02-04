/**
* This updates the 'fa_positions' table 
* This is part of the Alexa Argentina Soccer skill
* (c) Pablo Giudice 2017
*/
var AWS = require("aws-sdk");

const cheerio = require('cheerio');

var request = require('request');

// Test locally
/*
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});*/
AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

module.exports = {

  update_fa_positions: function(){

    var docClient = new AWS.DynamoDB.DocumentClient();

    // This is the URL for positions
    const url = 'http://estadisticas-deportes.tycsports.com/html/v3/htmlCenter/data/deportes/futbol/primeraa/pages/es/posiciones.html';

    console.log("Importing positions from URL"+url);

    // This makes the request and does the parsing
    request(url, function (error, response, html) {
      if (!error) {
        const $ = cheerio.load(html)
        const result = $(".linea").map((i, element) => ({  
          pos: $(element).children().eq(0).text().trim(), // for some magic reason 1 isn't present
          team: $(element).children().eq(2).text().trim(),
          points: $(element).children().eq(3).text().trim(),
          pj: $(element).children().eq(4).text().trim(),
          pg: $(element).children().eq(5).text().trim(),
          pe: $(element).children().eq(6).text().trim(),
          pp: $(element).children().eq(7).text().trim(),
          gf: $(element).children().eq(8).text().trim(),
          gc: $(element).children().eq(9).text().trim(),
          df: $(element).children().eq(10).text().trim(),

        })).get()
        
        // Original file
        // console.log("Total file: "+html);
        // Parsed file
        //console.log("parsed: " + JSON.stringify(result, null, 2));

        // Get the current time
        var d = new Date();

        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        // this is what gets written to the DB
        var params = {
            TableName: "fa_positions",
            Item: {
                "date":  d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate(),
                "date_speak": months[d.getMonth()] + " " + d.getDate() + " " + d.getFullYear(),
                "time": d.getTime(),
                "positions": result
            }
        };

        // persist it to the db
        docClient.put(params, function(err, data) {
        if (err) {
           console.error("Unable to add positions for date ", params.Item.date, ". Error JSON:", JSON.stringify(err, null, 2));
        } else {
           console.log("PutItem succeeded: date:", params.Item.date + ", time: " + params.Item.time);
        }
        });

        // Also, save the date of the latest update in another table
        var p={
          TableName:'fa_latest_update',
          Item:{
            'update_id':'fa_positions',
            "date":  d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate(),
          }
        }
        docClient.put(p, function(err, data) {
        if (err) {
           console.error("Unable to add positions for date ", p.Item.date, ". Error JSON:", JSON.stringify(err, null, 2));
        } else {
           console.log("PutItem succeeded: date:", p.Item.date + ", table: " + p.Item.update_id);
        }
        });
      }
    })

  }
};

