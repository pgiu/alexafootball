/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';
const Alexa = require('alexa-sdk');

// For dynamo
const AWS = require('aws-sdk');

const AWSregion = 'us-east-1'; // us-east-1

const params_positions = {
    TableName: 'fa_positions',
    Key:{ "date": '2017-10-09'  }
};

const params_strikers = {
    TableName: 'fa_strikers',
    Key:{ "date": '2017-10-09'  }
};

const myteam_params = {
    TableName: 'fa_schedule_arg_primera_a',
    Key:{ "team": 'argentinos'  }
};

AWS.config.update({
    region: AWSregion
});


//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = 'amzn1.ask.skill.855a0f61-f697-4182-b340-0ad5c0d26375';

const SKILL_NAME = 'Argentina Soccer';
const HELP_MESSAGE = 'You can say: Alexa, ask argentina soccer what are the positions';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

//=========================================================================================================================================
//Easter Egg - Ask about Jessica and Alexa will tell you the truth
//=========================================================================================================================================
const data = [
    'Jessica is the prettiest girl in the world.',
    'Jessica is from Colombia, a beautiful Country in Southamerica. Colombia and Argentina are both going to the world cup.<say-as interpret-as=\"interjection\">hooray</say-as>',
    'Jessica has the most beautiful eyes in the world. They are only comparable to her smile.',
    'Jessica lives in Berkeley, and Pablo loves to visit her there.',
    'Jessica is always sweet but sometimes Pablo has to wear his helmet. <say-as interpret-as=\"interjection\">harump</say-as>',
    'Jessica loves to dance and she is great at it. Did someone mention Colombian music?',
    'Jessica is not only gorgeous but also very smart. Did I mention she will be getting two degrees from Berkeley? <say-as interpret-as=\"interjection\">Bravo</say-as>!',
];

//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.dynamoDBTableName = 'fa_customer_data'; // That's it!

    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetNewFactIntent');
    },
    'GetPositionsIntent': function () {

        getTimeLatestUpdatePositions(params_positions.TableName, last=>{
            
            if(!last){
                this.tellErrorWithService();
                return;
            }
            // update the date in the params
            params_positions.Key.date=last.date;
            
            // this reads the positions table 
            readDynamoItem(params_positions, po=>{
    
                const speechOutput = "These are the results for the superleague up to "+ po.date_speak + 
                ". First is "+ po.positions[0].team + " with "+po.positions[0].points + " points."+ 
                " Second is " + po.positions[1].team + " with " + po.positions[1].points + " points."+
                " Third is " + po.positions[2].team + " with " + po.positions[2].points + " points. "+
                " Fourth is " + po.positions[3].team + " with " + po.positions[3].points + " points. "+
                " Last team is " + po.positions[po.positions.length-1].team + " with " + po.positions[po.positions.length-1]. points + " points.";
    
                var textOutput = '';
                for (var k = 0; k<po.positions.length ; k++){
                    textOutput += (k+1) + ": " + po.positions[k].team + " ("+po.positions[k].points+" pts)\n";
                }
    
                this.response.speak(speechOutput);
                this.response.cardRenderer(SKILL_NAME, textOutput);
                this.emit(':responseReady');
    
            });
        });
        
    },
    'GetStrikers': function () {

        getTimeLatestUpdatePositions(params_strikers.TableName, last=>{
            
            // update the date in the params
            params_strikers.Key.date=last.date;
            
            // this reads the positions table 
            readDynamoStrikers(params_strikers, s=>{
                
                if(!s){
                    this.tellErrorWithService();
                    return;
                }
                
               
                const speechOutput = "These are the top strikers up to "+ s.date_speak+". "+
                "Top striker is "+ s.strikers.s1.name + " with "+ s.strikers.s1.goals + " goals. " +
                "Second is " + s.strikers.s2.name + " with " + s.strikers.s2.goals +" goals";
                
                this.response.speak(speechOutput);
                this.response.cardRenderer(SKILL_NAME, speechOutput);
                this.emit(':responseReady');
    
            });
        });
        
    },'RememberMyTeam': function(){

        console.log("RememberMyTeam");
        var myTeamName = "";
        
        var intentObj = this.event.request.intent;
        console.log("Request info: " + JSON.stringify(intentObj, null, 2));

        // Check if there's a 'team' in the message
        if (intentObj.slots.team.hasOwnProperty('value') ){
            var newName = intentObj.slots.team.value.toLowerCase();
            if (this.attributes.hasOwnProperty('myTeamName')){
                //if (newName != this.attributes['myTeamName']){
                //    this.emit(':confirmSlot', slotToConfirm, speechOutput, 'Looks like your team is '+ this.attributes.myTeamName +" are you sure you want to update it to "+ newName);
                //}
                
            }
            // Save it to the db
            this.attributes['myTeamName'] = newName;
            
            var speechOutput = "OK, I will remember your favorite team is " + newName;
            this.response.speak(speechOutput);
            var textOutput = speechOutput;
            this.response.cardRenderer(SKILL_NAME, textOutput);
            this.emit(':responseReady');
            
            
            console.log("Retrieving fav name from request");
        } else {
            var errOutput = "I couldn't understand your favorite team. I know about only about the teams in the first division. ";
            this.response.speak(errOutput);
            this.response.cardRenderer(SKILL_NAME, errOutput);
            this.emit(':responseReady');
        }
        
    },
    'MyTeamUpdate': function(){

        console.log("Getting info for team. ");
        console.log("Request info: " + JSON.stringify(this.event.request.intent, null, 2));
        // The user's team
        var myTeamName = '';
        var intentObj = this.event.request.intent;
        
        // Check if the user mentioned the team in the request
        if (intentObj.slots.team.hasOwnProperty('value') ){
            myTeamName = intentObj.slots.team.value;
            console.log("Retrieving fav name from request");
        } else if (this.attributes.hasOwnProperty('myTeamName')){
            // Check if I know the user's default team from previous interactions
            myTeamName = this.attributes['myTeamName'];
            console.log("Retrieving fav name from db");
        } else {
            this.emit(':ask', "I'm sorry but I don't remember what your team is. Could you tell me what's your favorite team?");
            return;
        }
        
        console.log("Team name: " + JSON.stringify(myTeamName, null,2));
       
        myteam_params.Key.team = myTeamName;

        // this reads the positions table 
        readDynamoItem(myteam_params, item=>{
            
            if (!item){
                this.tellErrorWithService();
                return;
            }
            
            var myTeamName = item.team;
            console.log("Got info for " + myTeamName);
            var prevDate = null;
            var nextDate = null;
            // Today
            var today = new Date();
            var game = {};
            var nextGame = {};
            var currentlyPlaying = false;

            var games = item.games;
    
            for (var k = 0; k<games.length ; k++){
                //console.log(k+"-"+JSON.stringify(games[k], null, 2));
                var gameDate = new Date(games[k].date);
                //console.log("Today is " + today.toString() + ", this game is on: " + gameDate.toString()+", parts:"+parts);
                if (gameDate<today){
                    
                    if (prevDate!==null){
                        if (gameDate> prevDate){
                            prevDate = gameDate;
                            game = games[k];
                        }
                    } else {
                        prevDate = gameDate;    
                        game = games[k];
                    }
                    
                } else if ( gameDate>today){
                    if (nextDate !== null){
                        if (gameDate<nextDate){
                            nextDate = gameDate;
                            nextGame = games[k];
                        }
                    } else {
                        nextDate = gameDate;
                        nextGame = games[k];
                    }
                } else {
                    // same day!
                    currentlyPlaying = true;
                    game = games[k];
                }
            }

            var speechOutput = "";
            if (!game){
                speechOutput = "I'm sorry but I don't have info about " + myTeamName + " games.";
            
            } else {

                var myTeamGoals = 0;
                var otherTeamGoals = 0;
                var otherTeamName = "";
                // 
                if (game.home_team == myTeamName){
                    // 
                    myTeamGoals = game.goals_home;
                    otherTeamGoals = game.goals_away;
                    otherTeamName = capitalizeFirstLetter(game.away_team);
                } else {
                    // away game
                    myTeamGoals = game.goals_away;
                    otherTeamGoals = game.goals_home;
                    otherTeamName = capitalizeFirstLetter(game.home_team);
                }
    
                // Make it look nicer
                myTeamName = capitalizeFirstLetter(myTeamName);

                speechOutput = myTeamName + " " ;
    
                if (currentlyPlaying){
                    if (myTeamGoals > otherTeamGoals){
                        speechOutput += " defeated " + otherTeamName + " " + myTeamGoals + " to "+ otherTeamGoals;
                    } else if (myTeamGoals < otherTeamGoals ){
                        speechOutput += " lost against "+ otherTeamName + " " + otherTeamGoals + " to "+ myTeamGoals;
                    } else {
                        speechOutput += " draw with "+ otherTeamName + " " + otherTeamGoals + " to "+ myTeamGoals;
                    }  
                    speechOutput+= " on "+prevDate;
    
                } else {
                    // If the game is today, check if it has ended or not
                    if (game.live_data.status == "Finalizado"){
                         speechOutput += " played today against " + otherTeamName + ". ";
                         speechOutput += " The final score is "  +myTeamName + " " + myTeamGoals;
                         speechOutput += ", " + otherTeamName + " " + otherTeamGoals + ". ";  
                    } else {
                        speechOutput += " is playing today against "+ otherTeamName;
                        if (myTeamGoals > otherTeamGoals){
                            speechOutput += " is wining " + myTeamGoals + " to "+ otherTeamGoals;
                        } else if (myTeamGoals < otherTeamGoals ){
                            speechOutput += " is losing "+ otherTeamGoals + " to "+ myTeamGoals;
                        } else {
                            speechOutput += " is drawing "+ otherTeamGoals + " , "+ myTeamGoals;
                        }  
                    }
                }
                
                if (nextDate!==null){
                    
                    // Get the other team's name from the nextgame info
                    if (nextGame.home_team == myTeamName){
                        otherTeamName = nextGame.away_team;
                    } else {
                        otherTeamName = nextGame.home_team;
                    }
                    
                    console.log("Next date: " + nextDate);
                    speechOutput += " The next game will be on "+ datetimeToSpeech(nextDate, nextGame.live_data.time) + " against " + otherTeamName +". ";    
                    if (nextGame.home_team == myTeamName){
                        speechOutput += "It's a home game and ";
                    } else {
                        speechOutput += "It's an away game and "
                    }
                    if (nextGame.referee){
                        speechOutput += " the referee will be " + nextGame.referee;
                    } else {
                        speechOutput += " the referee hasn't been assigned yet.";
                    }
                    
                } else {
                    speechOutput += " I don't have information about the upcoming games.";
                }
                
            }

            this.response.speak(speechOutput);
            var textOutput = speechOutput;
            this.response.cardRenderer(SKILL_NAME, textOutput);
            this.emit(':responseReady');

        });
        
    },
    'JessicaFacts': function(){
        const factArr = data;
        const factIndex = Math.floor(Math.random() * factArr.length);
        const randomFact = factArr[factIndex];
        const speechOutput = "This is what I know about Jessica. " + randomFact;

        this.response.cardRenderer(SKILL_NAME, randomFact);
        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        const speechOutput = HELP_MESSAGE;

        this.response.speak(speechOutput);
        this.emit(':responseReady');
    }, 
    'tellErrorWithService': function(){
        var speechOutput = "I'm sorry but there was an error accessing the service";
        this.response.speak(speechOutput);
        var textOutput = speechOutput;
        this.response.cardRenderer(SKILL_NAME, textOutput);
        this.emit(':responseReady');
    }
};

// 3. Helper Function  =================================================================================================


function readDynamoItem(params, callback) {

    var AWS = require('aws-sdk');
    AWS.config.update({region: AWSregion});

    var docClient = new AWS.DynamoDB.DocumentClient();

    console.log('reading item from DynamoDB table: '+ params.TableName);

    docClient.get(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            callback(null);
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

            callback(data.Item);

        }
    });
}

function readDynamoStrikers(params, callback) {

    var AWS = require('aws-sdk');
    AWS.config.update({region: AWSregion});

    var docClient = new AWS.DynamoDB.DocumentClient();

    console.log('reading item from Strikers table');

    docClient.get(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            callback(null);
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

            callback(data.Item);

        }
    });
}

function getTimeLatestUpdatePositions(table_name, callback) {

    var AWS = require('aws-sdk');
    AWS.config.update({region: AWSregion});

    var docClient = new AWS.DynamoDB.DocumentClient();

    console.log('reading item from last update table.');

    var params = {
        TableName: "fa_latest_update",
        Key:{ 'update_id': table_name }
    }

    docClient.get(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            callback(data.Item);
        }
    });
}

var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function dateToSpeech(d){
    return daysOfWeek[d.getDay()]+" "+months[d.getMonth()]+" "+(d.getDate()+1)+ " "+d.getFullYear();
}

function datetimeToSpeech(d, time){
    return daysOfWeek[d.getDay()]+" "+months[d.getMonth()]+" "+(d.getDate()+1)+ " "+d.getFullYear() + " at <say-as interpret-as=\"time\">"+ time +"</say-as> ";
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
