var AWS = require("aws-sdk");
const cheerio = require('cheerio');
var request = require('request');

// Test locally
/*AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});*/
// Remote endpoint info
AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

// This is the URL for positions
const url='http://estadisticas-deportes.tycsports.com/html/v3/htmlCenter/data/deportes/futbol/primeraa/pages/es/fixture.html';
//const url='http://localhost/fa_football/fixture.html'


module.exports = {

	fa_write_games : function(){

	console.log("Importing games from URL: " + url);

	// This makes the request and does the parsing
	request(url, function (error, response, html) {
	  if (!error) {
	    const $ = cheerio.load(html)
	    const schedule = $(".fecha").map((i, fe) => ({

	      fecha: i,
	      games: $(fe).find(".match").map((i, element) => ({ 
			home_team: toLongName($(element).find(".local").find(".equipo").text().trim().toLowerCase()),
			away_team: toLongName($(element).find(".visitante").find(".equipo").text().trim().toLowerCase()),
			goals_away: $(element).find(".visitante").find(".resultado").text().trim(),
			penalties_away:  $(element).find(".visitante").find(".penales").text().trim(),
			goals_home: $(element).find(".local").find(".resultado").text().trim(),
			penalties_home:  $(element).find(".local").find(".penales").text().trim(),
			date_time: $(element).attr('data-originaldate'),
			match_gmt: $(element).attr('data-stadiumgmtn'),
			data_channel: $(element).attr('data-channel'),
			referee: $(element).find('.detalles').find('.arbitro').text().trim(),
			live_data:{
			  date: toDate($(element).find('.detalles').find('.dia').text().trim()),
			  time: $(element).find('.detalles').find('.hora').text().trim().slice(0,-2), // removes the hs at the end
			  status: $(element).find('.detalles').find('.estado').text().trim(),  
			}
	      })).get()
	    })).get()
	    
	    //
	    // console.log("Total file: "+html);
	    // Display if for debug purposes
	    //console.log("parsed: " + JSON.stringify(schedule, null, 2));
	    var gamesPerTeam = {};

	    for (var k = 0; k<schedule.length ; k++){
	      //console.log("games:" + JSON.stringify(schedule[k],null,2));
	      // Loop through all the games for that week
	      for (var g = 0; g < schedule[k].games.length ; g++){
		
		var ht = schedule[k].games[g].home_team;
		var at = schedule[k].games[g].away_team;
		//console.log("Game "+ g+", home: "+ht+", away:"+at);

		// Clean-up the object
		var og = schedule[k].games[g];
		var cleanGame = {};

		cleanGame.home_team = ht;
		cleanGame.away_team = at;
		if (og.goals_home != ""){
		  cleanGame.goals_home = og.goals_home;
		}
		if (og.goals_away != ""){
		  cleanGame.goals_away = og.goals_away;
		}
		if(og.live_data != ""){
		  cleanGame.live_data = og.live_data;  
		  cleanGame.live_data.date = dateToString(og.live_data.date);
		  cleanGame.date = cleanGame.live_data.date;
		}
		
		if (og.referee!= ""){
		  cleanGame.referee = og.referee.split(":")[1];
		}

		// Check if the team already has an array
		if (typeof gamesPerTeam[ht] !== 'undefined'){
		  gamesPerTeam[ht].push(cleanGame)
		} else {
		  gamesPerTeam[ht] = [cleanGame];
		}

		// Check if the team already has an array
		if (typeof gamesPerTeam[at] !== 'undefined'){
		  gamesPerTeam[at].push(cleanGame)
		} else {
		  gamesPerTeam[at] = [cleanGame];
		}
	      }
	    }

	    //console.log("Writing results to the DB");
	    // The date of the update
	    var d = new Date();
	    //console.log("parsed: " + JSON.stringify(gamesPerTeam, null, 2));

	    // Write all the games to the database. 
	    // Each team name is the key
	    for (var teamName in gamesPerTeam){
	      updateGamesInfo(d, teamName, gamesPerTeam[teamName]);
	    }

	    // Also save the date of the latest update in another table
	    var p={
	      TableName:'fa_latest_update',
	      Item:{
		'update_id':'fa_schedule_arg_primera_a',
		"date":  d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate(),
	      }
	    }
	    docClient.put(p, function(err, data) {
	    if (err) {
	       console.error("Unable to add the latest update for table ", p.Item.update_id, ". Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	       console.log("PutItem succeeded: date:", p.Item.date + ", table: " + p.Item.update_id);
	    }
	    });
	    
	  }
	})
	
}
};

/**
* Writes the DB with all the games for one team.
*
* @param d the date of the game
* @param teamName the team 
* @games array with all the games for that team
*/
function updateGamesInfo(d, teamName, games){
  
  console.log("Updating " + teamName);
      //console.log(gamesPerTeam[teamName]);
      
      var params = {
          TableName: "fa_schedule_arg_primera_a",
          Item: {
              "date":  dateToString(d),
              "time": d.getTime(),
              "team": teamName,
              "games" : games,
          }
      };
      //console.log("TO WRITE: " + JSON.stringify(params, null, 2));
      
      // persist it to the db
      docClient.put(params, function(err, data) {
      if (err) {
         console.error("Unable to add games for team ", params.Item.team, ". Error JSON:", JSON.stringify(err, null, 2));
      } else {
         console.log("PutItem succeeded: date:", params.Item.date + ", team: " + params.Item.team);
      }
      });
}


/**
* Takes a string in the format dd-mm-yyyy and returns a Date object.
*/
function toDate(dateStr) {
    var parts = dateStr.split("-");
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

/**
* Converts a date into a string. 
* The format is: YYYY-MM-DD
*/
function dateToString(d){
  return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
}

/**
* These are used to convert from the names that the data provider uses, 
* and the ones that Alexa can actually pronounce.
*/
var abbreviations = {
  "s. martín sj": "san martín de san juan",
  "r. central": "rosario central",
  "atl. tucumán": "atlético tucumán",
}

/**
 * Gets the long name of a team that has it's team name abbreviated.
 * It used the abbreviations variable to check that. 
 *
 * @param input the name to check
 *
 * return the long name of the team
*/
function toLongName(input){
  if (abbreviations.hasOwnProperty(input)){
    return abbreviations[input];
  } 
  return input;
}
