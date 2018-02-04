/**
* Creates the fa_schedule_arg_primera_a table in DynamoDB.
*/

var AWS = require("aws-sdk");
// Create locally 
AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

// Remote endpoint info
/*AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});*/

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "fa_schedule_arg_primera_a",
    KeySchema: [       
        { AttributeName: "team", KeyType: "HASH"},  //Partition key
    ],
    AttributeDefinitions: [       
        { AttributeName: "team", AttributeType: "S" },
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

