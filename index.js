'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { WebhookClient, Card, Suggestion } = require('dialogflow-fulfillment');
const { dialogflow } = require('actions-on-google');
const app = dialogflow();
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

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
        var visualRecognition = new VisualRecognitionV3({
            version: '2018-03-19',
            iam_apikey: 'Ae8wfpNwYI-OU88zzvem1L7iH0LzfUxdK1SElGV5VZQa'
        });
   
        var params = {
            //url: "https://www.t-mobile.com/content/dam/t-mobile/en-p/cell-phones/apple/apple-iphone-x/silver/Apple-iPhoneX-Silver-1-3x.jpg"
            url: agent.parameters.url
        };
   
        return new Promise((resolve,reject)=>{
            visualRecognition.classify(params, function (err, response) {
            if (err){
                console.log(err);
                reject("Bad");
            }
            else {
                //Store the response into a string
                var result = JSON.stringify(response, null, 2);
                var class_col = response.images[0].classifiers[0].classes;
                class_col.sort(function(a,b){return b.score > a.score;});
                var i=0, str ="The image has ";
                for (i = 0; i < class_col.length; i++) {
                    if( class_col[i].score > 0.7 &&
                        class_col[i].type_hierarchy !=null){//show iff score > 0.8
                            if(i>0) str +=", ";
                            str += class_col[i].class + " ";
                            //str += class_col[i].score + "\n ";
                    }
                }
                str += ".";
                //agent.add(str);
                agent.add(new Card({
                    title: "Image Details",
                    imageUrl: params.url,
                    text: str
                }));
                console.log(result);
                resolve("Good");
            }
        });
        });       
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

