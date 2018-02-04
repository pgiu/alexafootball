// This script is what the lambda function may call to update the 'fa_positions' table
var update_positions = require('./update_positions')
var fa_write_games = require('./fa_write_games')

exports.handler = function(event, context, callback){
	console.log("Updating positions");
	update_positions.update_fa_positions();
	console.log("Done");
}

exports.handler_games = function(event, context, callback){
	console.log("Updating games");
	fa_write_games.fa_write_games();
	console.log("Done");
}
