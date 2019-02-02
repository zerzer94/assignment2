'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { WebhookClient, Card, Suggestion } = require('dialogflow-fulfillment');
const { dialogflow } = require('actions-on-google');
const app = dialogflow();

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function testImage(agent) {
        agent.add(`It is working!`);
    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('GetImageDetailIntent', testImage);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});
const exapp = express().use(bodyParser.json());
exapp.post('/fulfillment', app.dialogflowFirebaseFulfillment());
var listener = exapp.listen(process.env.PORT, process.env.IP, function () {
    console.log("server has started");
    console.log('Listening on port ' + listener.address().port);
});

