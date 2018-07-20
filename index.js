function initSound(arrayBuffer) {
    var base64String = bufferToBase64(arrayBuffer);
    var audioFromString = base64ToBuffer(base64String);
    document.getElementById("audio1").value=base64String;
    context.decodeAudioData(audioFromString, function (buffer) {
        // audioBuffer is global to reuse the decoded audio later.
        audioBuffer = buffer;
        var buttons = document.querySelectorAll('button');
        buttons[0].disabled = false;
        buttons[1].disabled = false;
    }, function (e) {
        console.log('Error decoding file', e);
    });
}

function handleAudio(message, replyToken) {

    const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp3`);

    return downloadContent(message.id, downloadPath)
      .then((downloadPath) => {
  
        var originalUrl = baseURL + '/downloaded/' + path.basename(downloadPath)


        originalUrl.addEventListener('change', function (e) {
            var reader = new FileReader();
            reader.onload = function (e) {

                return client.replyMessage(
                    replyToken,
                    {
        
                      type: 'text',
                      text : oinitSound(this.result)
        
                    }
                  );

                
            };
            reader.readAsArrayBuffer(this.files[0]);
        }, false);
  
      

          
      });
  }
