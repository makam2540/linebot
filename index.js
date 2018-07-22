'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
var bodyParser = require('body-parser');
var request = require('request');
var sql = require('mssql');
var sqlInstance = require("mssql");
var ffmpeg = require('ffmpeg');
var ffprobe = require('ffprobe');
var getDuration = require('get-audio-duration');
var http = require('http');
var pipe = require('pipe');
const lenaBuffer = require('audio-lena/mp3-base64');
const context = require('audio-context')();


 var dbConfig = {
                      user: 'linebot',
                      password: 'p@ssw0rd',
                      server: 'mgtfs.southeastasia.cloudapp.azure.com', 
                      database: 'LineBotChat',
                      port:1433,
                      options: {
                          encrypt: true // Use this if you're on Windows Azure
                      }                      
    };

   

// create LINE SDK config from env variables
const config = {
  channelAccessToken: 'Rz8z1ee8jjPGKgYsiVruxdBDpWA4ryYEh5QKu7KLtb4o1HN3h38LHyWUEoWYOGVolNmGP1fFw7UbxocelHU/0Y/j+b2/jch/cpqEW6dhyi8smlFI+vsQVttuzLtCZPHm5K7MNg39sFK7Z8jWxhv7ngdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'cfb81693a3484b47003facfd2ba88b38',
};

// base URL for webhook server
const baseURL = 'https://sangster-bot.herokuapp.com';

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// serve static and downloaded files
app.use('/static', express.static('static'));
app.use('/downloaded', express.static('downloaded'));

// webhook callback
app.post('/callback', line.middleware(config), (req, res) => {
  // req.body.events should be an array of events

  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  // handle events separately
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

// callback function to handle a single event
function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      // return replyText(event.replyToken, message.type);
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        case 'image':
          return handleImage(message, event.replyToken, event.source);
        case 'video':
         return handleVideo(message, event.replyToken, event.source);
        case 'audio':
          return handleAudio(message, event.replyToken);
        case 'location':
          return handleLocation(message, event.replyToken);
        case 'sticker':
          return handleSticker(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case 'follow':
                client.getProfile(event.source.userId)
                .then((profile) =>{


                  return client.replyMessage(
                    event.replyToken,
                    {
                      type: 'text',
                      text : "Got followed " +profile.displayName
                    }
                  );

                })


    case 'unfollow':
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case 'join':
      return replyText(event.replyToken, `Joined ${event.source.type}`);

    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);

    case 'postback':
      let data = event.postback.data;
      if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
        data += `(${JSON.stringify(event.postback.params)})`;
      }
      return replyText(event.replyToken, `Got postback: ${data}`);

    case 'beacon':
      return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function handleText(message, replyToken, source) {
  const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;

  switch (message.text) {
    case 'profile':
      if (source.userId) {
        return client.getProfile(source.userId)
          .then((profile) => replyText(
            replyToken,
            [
              `Display name: ${profile.displayName}`,
              `Status message: ${profile.statusMessage}`,
            ]
          ));
      } else {
        return replyText(replyToken, 'Bot can\'t use profile API without user ID');
      }
    case 'buttons':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Buttons alt text',
          template: {
            type: 'buttons',
            thumbnailImageUrl: buttonsImageURL,
            title: 'My button sample',
            text: 'Hello, my button',
            actions: [
              { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
              { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
              { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
              { label: 'Say message', type: 'message', text: 'Rice=米' },
            ],
          },
        }
      );
    case 'confirm':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Confirm alt text',
          template: {
            type: 'confirm',
            text: 'Do it?',
            actions: [
              { label: 'Yes', type: 'message', text: 'Yes!' },
              { label: 'No', type: 'message', text: 'No!' },
            ],
          },
        }
      )
    case 'carousel':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Carousel alt text',
          template: {
            type: 'carousel',
            columns: [
              {
                thumbnailImageUrl: buttonsImageURL,
                title: 'hoge',
                text: 'fuga',
                actions: [
                  { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
                  { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
                ],
              },
              {
                thumbnailImageUrl: buttonsImageURL,
                title: 'hoge',
                text: 'fuga',
                actions: [
                  { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
                  { label: 'Say message', type: 'message', text: 'Rice=米' },
                ],
              },
            ],
          },
        }
      );
    case 'image carousel':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Image carousel alt text',
          template: {
            type: 'image_carousel',
            columns: [
              {
                imageUrl: buttonsImageURL,
                action: { label: 'Go to LINE', type: 'uri', uri: 'https://line.me' },
              },
              {
                imageUrl: buttonsImageURL,
                action: { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
              },
              {
                imageUrl: buttonsImageURL,
                action: { label: 'Say message', type: 'message', text: 'Rice=米' },
              },
              {
                imageUrl: buttonsImageURL,
                action: {
                  label: 'datetime',
                  type: 'datetimepicker',
                  data: 'DATETIME',
                  mode: 'datetime',
                },
              },
            ]
          },
        }
      );
    case 'datetime':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Datetime pickers alt text',
          template: {
            type: 'buttons',
            text: 'Select date / time !',
            actions: [
              { type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
              { type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
              { type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
            ],
          },
        }
      );
    case 'imagemap':
      return client.replyMessage(
        replyToken,
        {
          type: 'imagemap',
          baseUrl: `${baseURL}/static/rich`,
          altText: 'Imagemap alt text',
          baseSize: { width: 1040, height: 1040 },
          actions: [
            { area: { x: 0, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/manga/en' },
            { area: { x: 520, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/music/en' },
            { area: { x: 0, y: 520, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/play/en' },
            { area: { x: 520, y: 520, width: 520, height: 520 }, type: 'message', text: 'URANAI!' },
          ],
        }
      );
    case 'bye':
      switch (source.type) {
        case 'user':
          return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
        case 'group':
          return replyText(replyToken, 'Leaving group')
            .then(() => client.leaveGroup(source.groupId));
        case 'room':
          return replyText(replyToken, 'Leaving room')
            .then(() => client.leaveRoom(source.roomId));
      }
      
    default:
    
    var text = message.text
    var uid = source.userId
     
    var gid = source.groupId

    var conn = new sql.ConnectionPool(dbConfig);
        conn.connect().then(function() {
              var req = new sql.Request(conn); 

              req.query("SELECT * FROM message").then(function (result){
                              for(var i=0;i<result.rowsAffected;i++){
                                if(result.recordset[i].text != message.text)
                                {
                                  req.query("INSERT INTO [dbo].[message] ([text], [u_id], [q_id]) VALUES ('"+text+"', '"+uid+"' ,'"+gid+"')")
                                  return replyText(replyToken,"คำถามของท่านถูกบันทึกไว้แล้ว") ;
                                }
                              }
              }) // end select
  })  //end conn

    // console.log(`Echo message to ${replyToken}: ${message.text}`);
    //   return replyText(replyToken,message.text) ;

  }
}

// //////////////////////// image
function handleImage(message, replyToken, source) {

  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);
  const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

  
  return downloadContent(message.id, downloadPath)
    .then((downloadPath) => {
      // ImageMagick is needed here to run 'convert'
      // Please consider about security and performance by yourself
      cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);

      var original = baseURL + '/downloaded/' + path.basename(downloadPath);
      var preview = baseURL + '/downloaded/' + path.basename(previewPath);
      var Uid = source.userId
     
        // var conn = new sql.ConnectionPool(dbConfig);
        // conn.connect().then(function() {
        //       var req = new sql.Request(conn); 
                  
        //         req.query("INSERT INTO [dbo].[Image] ([Image_id], [oridinal], [preview], [user_id]) VALUES ('"+message.id+"', '"+original+"' ,'"+preview+"','"+Uid+"')")
              
        //         req.query('SELECT * FROM Image').then(function (result){
        //               for(var i=0;i<result.rowsAffected;i++){
        //                 if(result.recordset[i].Image_id == message.id)
        //                 {
        //                   var dPath = result.recordset[i].oridinal;
        //                   var pPath = result.recordset[i].preview;
        //                 }
        //               }

                      return client.replyMessage(
                      replyToken,
                      { 
                        // type: 'text',
                        // text : 'id = '+downloadPath

                        type: 'image',
                        originalContentUrl: original,
                        previewImageUrl: preview,


                        // originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
                        // previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
                      }
                    );  //end replyMessage
 
                // })// end query select
    
        // });  //end connect
 
    }); // then((downloadPath)
}  // end function




function handleVideo(message, replyToken, source) {
  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp4`);
  const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

  return downloadContent(message.id, downloadPath)
    .then((downloadPath) => {
      // FFmpeg and ImageMagick is needed here to run 'convert'
      // Please consider about security and performance by yourself
      cp.execSync(`convert mp4:${downloadPath} jpeg:${previewPath}`);
          var original = baseURL + '/downloaded/' + path.basename(downloadPath)
          var preview = baseURL + '/downloaded/' + path.basename(previewPath)

      return client.replyMessage(
        replyToken,
        {
          type: 'text',
          text : original +'\n'+ preview
          // originalContentUrl: 'https://www.facebook.com/FantasmasTV/videos/377003622810012/?t=5',
          // previewImageUrl: 'https://www.facebook.com/FantasmasTV/videos/377003622810012/?t=5',

          // type: 'video',
          // originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          // previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
        }
      );
    });
}


function handleAudio(message, replyToken) {

  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp3`);

  return downloadContent(message.id, downloadPath)
    .then((downloadPath) => {
      
      // var originalUrl = baseURL + '/downloaded/' + path.basename(downloadPath)

      
          let buf = fs.readFileSync('_39084165.mp3')
          console.log(buf.toString('base64'))



          return client.replyMessage(
            replyToken,
            {

              type: 'text',
              text : result

              // type: 'audio',
              // originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
              // duration: 1000
              // duration: duration * 1000,
            }
          );
        
    });
}

function downloadContent(messageId, downloadPath) {
  return client.getMessageContent(messageId)
    .then((stream) => new Promise((resolve, reject) => {
      const writable = fs.createWriteStream(downloadPath);
      stream.pipe(writable);
      stream.on('end', () => resolve(downloadPath));
      stream.on('error', reject);
    }));
}

function handleLocation(message, replyToken) {
  var latitude =message.latitude
  var longitude = message.longitude
  var title = message.title
  var  address = message.address
  return client.replyMessage(
    replyToken,
    {
      type: 'text',
      text : 'latitude = '+latitude + '\n longitude = '+ longitude +'\n title = '+ title +'\n address = '+ address 

      // type: 'location',
      // title: message.title,
      // address: message.address,
      // latitude: message.latitude,
      // longitude: message.longitude,
    }
  );
}

function handleSticker(message, replyToken) {
  return client.replyMessage(
    replyToken,
    {
      type: 'sticker',
      packageId: message.packageId,
     // stickerId: message.stickerId,
    }
  );
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
