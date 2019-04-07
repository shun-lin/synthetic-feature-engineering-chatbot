/*
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Remix this as the starting point for following the Messenger Platform
 * quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
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

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response = {
    "text": ""
  }

  // Check if the message contains text
  if (received_message.text) {    
    
    let message_catched = false;
    
    // test if greeting through NLP
    const greeting = firstEntity(received_message.nlp, 'greetings');
    if (greeting && greeting.confidence > 0.8) {
      // Create greeting feedback
      response.text = `hi! Welcome to Syntehtic Feature Engineering Team's Demo Bot`;
      message_catched  = true;
    }
    
    let lower_case = received_message.text.toLowerCase();
    // check if the message contains bitcoin
    
    if (lower_case.includes("info")) {
      // Create greeting feedback
      response.text = `This page is created for the demo chat bot for Data-X Paradigm Synthetic Features Engineering Team Spring 2019.`;
      message_catched  = true;
    }
    
    if (lower_case.includes("test")) {
      // Create greeting feedback
      response.text = `If you see this message that means the test runs succesfully!`;
      message_catched  = true;
    }
    
    if (lower_case.includes("menu")) {
      // Create greeting feedback
      response.text = `You can say something like 'bitcoin' and we will fetch some Bitcoin news for you!`;
      message_catched  = true;
    }
    
    if (lower_case.includes("help")) {
      // Create greeting feedback
      response.text = `Our team has been notified, we will contact you about your problem shortly!`;
      message_catched  = true;
    } 
    
    if (lower_case.includes("bitcoin")) {
      response.text = `Do you want some news about bitcoin?`;
      message_catched = true;
    }
    
    if (lower_case.includes("yes")) {
      message_catched = true;
      // callSendAPI(sender_psid, "let me gather some bitcoin news for you!");
      
      newsapi.v2.everything({
        q: 'bitcoin',
        from: '2019-04-06',
        to: '2019-04-06',
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
      
    if (!message_catched) { 
      // Create catch all feedback
      response.text = `Sorry I do not understand your commend`    
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