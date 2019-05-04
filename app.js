'use strict';

// Imports dependencies and set up http server

const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  // najax to replace jQuery Ajax
  najax = require('najax'),
  app = express().use(body_parser.json()), // creates express http server

  // news API
  NewsAPI = require('newsapi'),
  newsapi = new NewsAPI(process.env.NEWS_API_TOKEN);

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

      
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "feature_engineering_success";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

let lookup_keyword = "";

function getDate() {
  let date = new Date();
  let today = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
  return today;
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response = {
    "text": ""
  }

  // Check if the message contains text
  if (received_message.text) {    
    
    let message_catched = false;
    let lower_case = received_message.text.toLowerCase().trim();
    
    // test if greeting through NLP
    const greeting = firstEntity(received_message.nlp, 'greetings');
    if (greeting && greeting.confidence > 0.8) {
      // Create greeting feedback
      response.text = `hi! Welcome to Data-X Paradigm Team 2's Demo Bot`;
      message_catched  = true;
    }
    
    if (lower_case === "info") {
      // Create greeting feedback
      response.text = `This page is created for the demo chat bot for Data-X Paradigm Synthetic Features Engineering Team Spring 2019.`;
      message_catched  = true;
    }
    
    if (lower_case === "test") {
      // Create greeting feedback
      response.text = `If you see this message that means the test runs succesfully!`;
      message_catched  = true;
    }
    
    if (lower_case === "menu") {
      // Create greeting feedback
      response.text = `You can say something like 'bitcoin' and we will fetch some Bitcoin news for you!`;
      message_catched  = true;
    }
    
    if (lower_case === "help") {
      // Create greeting feedback
      response.text = `Our team has been notified, we will contact you about your problem shortly!`;
      message_catched  = true;
    } 
    
    // need to condense all those if statement into a for loop
    if (lower_case === "bitcoin") {
      response.text = `Do you want some news about bitcoin?`;
      lookup_keyword = "bitcoin";
      message_catched = true;
    }
    
    if (lower_case.includes("cryptocurrency")) {
      response.text = `Do you want some news about general cryptocurrency?`;
      lookup_keyword = "cryptocurrency";
      message_catched = true;
    }
    
    if (lower_case.includes("blockchain")) {
      response.text = `Do you want some news about blockchain?`;
      lookup_keyword = "blockchain";
      message_catched = true;
    }
    
    if (lower_case.includes("ethereum")) {
      response.text = `Do you want some news about Ethereum?`;
      lookup_keyword = "ethereum";
      message_catched = true;
    }
    
    if (lower_case.includes("litecoin")) {
      response.text = `Do you want some news about Litecoin?`;
      lookup_keyword = "litecoin";
      message_catched = true;
    }
    
    // need to condense all those if statement into a for loop ENDS
    
    if (lower_case.includes("no")) {
      response.text = `Okay, let me know what other cyptocurrency do you want news for?`;
      lookup_keyword = "";
      message_catched = true;
    }
    
    //testing python
    if (lower_case.includes("testpython")) {
      
      najax({
            type: "POST",
            url: "http://127.0.0.1:5001/getScore",
            data: { mydata: "barbie kills mansion"},
            complete: function(retString) {
              response.text = "returning: " + JSON.parse(retString).loss;
              // Sends the response message
              callSendAPI(sender_psid, response);
            }
        })
      // response.text = "returning: " + "hi";
      message_catched = true;
    }
    
    //testing python
    if (lower_case.includes("unusual score: ")) {
      
      var received_title = lower_case.slice(15).trim();
      
      var headline_title = received_title;
      var headline_title_test = "";
      
      console.error("The title of the headline is: " + headline_title_test);
      
      najax({
            type: "POST",
            url: "http://127.0.0.1:5001/getScore",
            data: { mydata: headline_title},
            complete: function(retString) {
              console.error(retString);
              var score = parseFloat(JSON.parse(retString).loss).toFixed(2);
              response.text = "The unusual score is  " + score.toString() + '. ';
              
              var analysis = "";
              if (score < 7.00) {
                analysis = " Our model thinks the headline is not unusual (not impactful). The article may not have any affect on cryptocurrency prices."
              } else if (score < 15.00) {
                analysis = " Our model thinks the headline is unusual (potentially impactful). The article may have an impact on future cryptocurrency prices. We recommend reading the article in detail!"
              } else {
                analysis = " Our model thinks that the unusual score is too high, which indicates that article is not related to cryptocurrency at all! If the headline does contain cyptocurrency then it should be highly impactful. "
              }
              
              // add analysis to the score
              response.text += analysis
              // Sends the response message
              callSendAPI(sender_psid, response);
            }
        })
      // response.text = "returning: " + "hi";
      message_catched = true;
    }
    
    if (lower_case.includes("yes")) {
      
      message_catched = true;
      
      if (lookup_keyword === null || lookup_keyword.length === 0) {
        response.text = `Please tell me a cyptocurrency to lookup first.`;
      }
      else {
        // var io = require('socket.io')(app);
        // var socket = io.connect('http://127.0.0.1:5000/');
        // socket.emit("message", "something");
        // var $ = require("jquery");
        let today = getDate();
        newsapi.v2.everything({
          q: lookup_keyword,
          from: today,
          to: today,
          language: 'en',
          sortBy: 'popularity',
          pageSize: '100',
        }).then(response => {
          message_catched = true;
          let bitcoin_response = {
            "text": response.articles[0].title
          }

          let query_response = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "list",
                "top_element_style": "compact",
                "elements": []
              }
            }
          }

          let bitcoin_article;
          let title;
          let subtitle;
          let image_url;
          let url;
          let lst_element;

          var i;
          for (i = 0; i < 4; i+=1) {
            bitcoin_article = response.articles[i];
            title = bitcoin_article.title;
            image_url = bitcoin_article.urlToImage;
            subtitle = bitcoin_article.description;
            url = bitcoin_article.url;

            lst_element = {
              "title": title,
              "subtitle": subtitle,
              "image_url": image_url,
              "default_action": {
                "type": "web_url",
                "url": url,
                "webview_height_ratio": "tall"
              }
            }

            query_response.attachment.payload.elements.push(lst_element);


          }
          console.log(query_response.attachment.payload.elements);
          callSendAPI(sender_psid, query_response);
          /*
            {
              status: "ok",
              articles: [...]
            }
          */
        });
      }

      
    }
      
    if (!message_catched) { 
      // Create catch all feedback
      response.text = `Sorry I do not understand your command`    
    }
  
  }  
  
  // Sends the response message
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// for Facebook NLP
function firstEntity(nlp, name) {
  return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
}