'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const bodyParser = require('body-parser')
const request = require('request')
var sql = require('mssql');
var sqlInstance = require("mssql");
const image2base64 = require('image-to-base64');
var time = require('time')(Date);


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

    // var date = Date.UTC()
    var date = new Date();
  
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

      switch (message.type) {

        case 'text':

          return handleText(message, event.replyToken, event.source);

        case 'image':

          return handleImage(message, event.replyToken, event.source);

        case 'video':

          return handleVideo(message, event.replyToken, event.source);

        case 'audio':

          return handleAudio(message, event.replyToken, event.source);

        case 'location':

          return handleLocation(message, event.replyToken, event.source);

        case 'sticker':

          return handleSticker(message, event.replyToken);

        default:

          throw new Error(`Unknown message: ${JSON.stringify(message)}`);

      }

    case 'join':

        var  GrID = event.source.groupId

        var conn = new sql.ConnectionPool(dbConfig);

            conn.connect().then(function () {

                var req = new sql.Request(conn);

                req.query('SELECT * FROM [dbo].[Group]').then(function (rows) {

                  var num=0;

                  if(rows.rowsAffected == 0) {

                    req.query("INSERT INTO [dbo].[Group] ([groupId]) VALUES ('" + GrID + "')")

                    return replyText(event.replyToken,"สวัสดีครับ ผมคือระบบอัตโนมัติ \nบทสนทนาที่เกิดขึ้นภายในกลุ่มนี้จะถูกบันทึกเพื่อนำไปปรับปรุงและพัฒนาระบบต่อไป \nข้อมูลทุกอย่างจะถูกเก็บเป็นความลับและไม่มีการเปิดเผยต่อสาธารณะ \nขอบคุณครับ");

                  }

                  else{

                    for(var i=0;i<rows.rowsAffected;i++){

                      if(GrID == rows.recordset[i].groupId)

                          {

                            num=1;

                            return replyText(event.replyToken,"สวัสดีครับ ผมคือระบบอัตโนมัติ \nบทสนทนาที่เกิดขึ้นภายในกลุ่มนี้จะถูกบันทึกเพื่อนำไปปรับปรุงและพัฒนาระบบต่อไป \nข้อมูลทุกอย่างจะถูกเก็บเป็นความลับและไม่มีการเปิดเผยต่อสาธารณะ \nขอบคุณครับ");                                        

                          }

                      else num+=2

                    }  

                    if(num > 1){

                      req.query("INSERT INTO [dbo].[Group] ([groupId]) VALUES ('" + GrID + "')")

                      return replyText(event.replyToken,"สวัสดีครับ ผมคือระบบอัตโนมัติ \nบทสนทนาที่เกิดขึ้นภายในกลุ่มนี้จะถูกบันทึกเพื่อนำไปปรับปรุงและพัฒนาระบบต่อไป \nข้อมูลทุกอย่างจะถูกเก็บเป็นความลับและไม่มีการเปิดเผยต่อสาธารณะ \nขอบคุณครับ");                                        

                    }

                  }

                });  

            })



    case 'follow':

      return client.getProfile(event.source.userId)

            .then((profile) => {

              var UsID = event.source.userId

              var UsName = profile.displayName

              var conn = new sql.ConnectionPool(dbConfig);

                  conn.connect().then(function () {

                      var req = new sql.Request(conn);

                      req.query('SELECT * FROM [dbo].[User]').then(function (rows) {

                        var num=0;

                        if(rows.rowsAffected == 0){

                            req.query("INSERT INTO [dbo].[User] ([userId],[userName]) VALUES ('" + UsID + "','" + UsName + "')")              

                            return replyText(event.replyToken,"สวัสดีครับ " + UsName +" \nผมคือระบบอัตโนมัติ บทสนทนาที่เกิดขึ้นภายในกลุ่มนี้จะถูกบันทึกเพื่อนำไปปรับปรุงและพัฒนาระบบต่อไป \nข้อมูลทุกอย่างจะถูกเก็บเป็นความลับและไม่มีการเปิดเผยต่อสาธารณะ \nขอบคุณครับ");

                        }else{

                          for(var i=0;i<rows.rowsAffected;i++){

                            if(UsID == rows.recordset[i].userId)

                                {

                                  num=1;

                                  var ID = rows.recordset[i].Id

                                  if(UsName != rows.recordset[i].userName){ 

                                    req.query("UPDATE [dbo].[User] SET [userName] = '"+ UsName +"' WHERE Id ="+ ID)  

                                    return replyText(event.replyToken,"สวัสดีครับ"+ UsName +" \nผมคือระบบอัตโนมัติ บทสนทนาที่เกิดขึ้นภายในกลุ่มนี้จะถูกบันทึกเพื่อนำไปปรับปรุงและพัฒนาระบบต่อไป \nข้อมูลทุกอย่างจะถูกเก็บเป็นความลับและไม่มีการเปิดเผยต่อสาธารณะ \nขอบคุณครับ");                 

                                }}

                            else num+=2

                          }  

                          if(num > 1){

                            req.query("INSERT INTO [dbo].[User] ([userId],[userName]) VALUES ('" + UsID + "','" + UsName + "')")              

                            return replyText(event.replyToken,"สวัสดีครับ"+ UsName +" \nผมคือระบบอัตโนมัติ บทสนทนาที่เกิดขึ้นภายในกลุ่มนี้จะถูกบันทึกเพื่อนำไปปรับปรุงและพัฒนาระบบต่อไป \nข้อมูลทุกอย่างจะถูกเก็บเป็นความลับและไม่มีการเปิดเผยต่อสาธารณะ \nขอบคุณครับ");                           

                          }

                      }

                      })      

                });  

              

                })

    default:

      throw new Error(`Unknown event: ${JSON.stringify(event)}`);

  }

}



function handleText(message, replyToken, source) {

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

    case 'goodbye BOT':

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

      var UsID = source.userId

      var  GrID = source.groupId

      if (GrID == null) GrID = 'direct user'

      var conn = new sql.ConnectionPool(dbConfig);

          conn.connect().then(function () {

              var req = new sql.Request(conn);

              req.query('SELECT * FROM [dbo].[User]').then(function (rows) {

                var num=0;

                for(var i=0;i<rows.rowsAffected;i++){

                  if(UsID == rows.recordset[i].userId)

                    {

                      var d = new Date();

                      var date = '' + d.setTimezone('Asia/Bangkok')

                      num=1;

                      req.query("INSERT INTO [dbo].[Message] ([text],[userId],[groupId],[date]) VALUES ('" + message.text + "','" + UsID + "','" + GrID + "','" + date + "')")                                     

                      return client.getProfile(source.userId)

                      .then((profile) => {                  

                        var UsName = profile.displayName

                        req.query('SELECT * FROM [dbo].[User]').then(function (rows) {

                          for(var i=0;i<rows.rowsAffected;i++){

                            if(UsID == rows.recordset[i].userId)

                              {

                                var ID = rows.recordset[i].Id

                                if(UsName != rows.recordset[i].userName){ 

                                  req.query("UPDATE [dbo].[User] SET [userName] = '"+ UsName +"' WHERE Id ="+ ID)}

                              }

                          }

                        })        

                      }); 

                    }

                  else num+=2

                }  

                if(num > 1){

                    var d = new Date();

                    var date = '' + d.setTimezone('Asia/Bangkok')

                    req.query("INSERT INTO [dbo].[User] ([userId],[userName]) VALUES ('" + UsID + "','Unknow')")

                    req.query("INSERT INTO [dbo].[Message] ([text],[userId],[groupId],[date]) VALUES ('" + message.text + "','" + UsID + "','" + GrID + "','" + date + "')")                    

                    

                    return client.getProfile(source.userId)

                    .then((profile) => {                  

                      var UsName = profile.displayName

                      req.query('SELECT * FROM [dbo].[User]').then(function (rows) {

                        for(var i=0;i<rows.rowsAffected;i++){

                          if(UsID == rows.recordset[i].userId)

                            {

                              var ID = rows.recordset[i].Id

                              if(UsName != rows.recordset[i].userName){ 

                                req.query("UPDATE [dbo].[User] SET [userName] = '"+ UsName +"' WHERE Id ="+ ID)}

                            }

                        } 

                      })        

                    });  

                  }

              })

          })               

    }//END Switch

}//END Function



function handleImage(message, replyToken, source) {

  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);



  return downloadContent(message.id, downloadPath)

    .then((downloadPath) => {

      var  originalContentUrl = baseURL + '/downloaded/' + path.basename(downloadPath)

      var  UsID = source.userId

      var  GrID = source.groupId

      if (GrID == null) GrID = 'direct user'

      var  image64

       image2base64(originalContentUrl)

                .then(

                    (response) => {

                      image64 = 'data:image/jpeg;base64,'+ response

                      var d = new Date();

                      var date = '' + d.setTimezone('Asia/Bangkok')

                      var conn = new sql.ConnectionPool(dbConfig);

                      conn.connect().then(function () {

                            var req = new sql.Request(conn);

                            req.query("INSERT INTO [dbo].[Image] ([image64],[userId],[groupId],[date]) VALUES ('" + image64 + "','" + UsID + "','" + GrID + "','" + date + "')")

                        });

                    }

                )

    });

}



function handleVideo(message, replyToken, source) {

  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp4`);

  //const previewPath = path.join(__dirname, 'downloaded', `${message.id}-pw.jpg`);

  

  var originalContentUrl = baseURL + '/downloaded/' + path.basename(downloadPath)

  return downloadContent(message.id, downloadPath)

    .then((downloadPath) => {

        return client.replyMessage(

            replyToken,

            {

            type: 'text',

            text:  originalContentUrl

            })

    });

    

}



function handleAudio(message, replyToken, source) {

  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp3`);



  return downloadContent(message.id, downloadPath)

    .then((downloadPath) => {

      var getDuration = require('get-audio-duration');

      var audioDuration;

      getDuration(downloadPath)

        .then((duration) => { audioDuration = duration; })

        .catch((error) => { audioDuration = 1; })

        .finally(() => {

          return client.replyMessage(

            replyToken,

            {

                type: 'text',

                text:  baseURL + '/downloaded/' + path.basename(downloadPath)

            }

          );

        });

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



function handleLocation(message, replyToken, source) {

  var  UsID = source.userId

  var  GrID = source.groupId

  if (GrID == null) GrID = 'direct user'

  var d = new Date();

  var date = '' + d.setTimezone('Asia/Bangkok')

  var conn = new sql.ConnectionPool(dbConfig);

      conn.connect().then(function () {

          var req = new sql.Request(conn);

          req.query("INSERT INTO [dbo].[Location] ([address],[userId],[groupId],[date]) VALUES ('" + message.address + "','" + UsID + "','" + GrID + "','" + date + "')")

      });

}



function handleSticker(message, replyToken) {

  // return client.replyMessage(
  //   replyToken,
  //   {
  //     type: 'sticker',
  //     packageId: message.packageId,
  //     stickerId: message.stickerId,
  //   }
  // );

}


// listen on port

const port = process.env.PORT || 3000;

app.listen(port, () => {

  console.log(`listening on ${port}`);

});
