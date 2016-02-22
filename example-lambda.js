var http = require('http');
var AWS = require('aws-sdk');

AWS.config.region = 'us-east-1';

var config = {
    dynamoTableName: 'SALDAAL1-learnjs'
};

exports.dynamodb = new AWS.DynamoDB.DocumentClient();

function reduceItems(memo, items) {
    items.forEach(function(item) {
        memo[item.answer] = (memo[item.answer] || 0) + 1;
    });
    return memo;
}

function byCount(e1, e2) {
    return e2[0] - e1[0];
}

function filterItems(items) {
    var values = [];
    for (var i in items) {
        values.push([items[i], i]);
    }
    var topFive = [];
    values.sort(byCount).slice(0,5).forEach(function(e) {
        topFive.push({"count":e[0], "text":e[1]});
    });
    return topFive;
}

exports.popularAnswers = function(json, context) {
    exports.dynamodb.scan({
       FilterExpression: "problemId = :problemId",
       ExpressionAttributeValues: {
           ":problemId" : json.problemId
       },
       TableName: config.dynamoTableName
    }, function(err, data) {
        if (err) {
            context.fail(err);
        } else {
            context.succeed(filterItems(reduceItems({}, data.Items)))
        }
    });
}