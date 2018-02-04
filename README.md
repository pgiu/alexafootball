# Football Argentina Alexa Skill

(c) Pablo Giudice 2018

This will teach Alexa about the most recent scores of Argentine soccer first division. 

I made this because I wanted to know how my team was doing in the league, and Alexa wasn't helping me much.
This can be extended to different leagues and tournaments. 

This is a serverless application, meaning there isn't a server always running the program. This is based on Amazon Lambda, DynamoDB, and the Amazon Alexa API Gateway. 

It has two parts: 
- the front-end (alexa configuration + lambda function)
- the back-end (writes to a dynamodb database the values of last weeks positions)

## Features

- Alexa can remember your team preferences. Just ask 'when is my team playing' and she will answer.
- You can ask 'When is X playing Y'. 
- You can ask for the current standings

For a detailed description go to the file alexa/alexa_code for a configuration file.

## Building

## Use NPM

npm install

## Setting up the alexa Skill.
 
Follow the sample tutorial. 
Create two intents: 
	GetPositionsIntent
	GetStrikers

Copy content of the file `alexa/alexa_code.txt` and paste it in the Code Editor view in the Alexa skill builder application.

## Setting up Lambda

In AWS create a function called `alexaFootballArgentina`. Upload the code inside the lambda directory.
Add alexa skills as a trigger.

## Setting up the database

We need three databases: 

- fa_positions
	- key: date
- fa_latest_update
	- update_id: [fa_positions, fa_strikers]
- fa_strikers
	- key: date

Run the scripts `create_X` to create each of them.

## Setting up the backend

The backend is also a lambda function that scrapes the remote website. 

It runs using cron: 
From Saturday to Monday at 3am (UTC time)

	3 3 ? * FRI-MON *	
