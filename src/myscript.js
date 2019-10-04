const videoWidth = 490;
const videoHeight = 350;
const video_test = document.getElementById('webCamera');
video_test.width = videoWidth;
video_test.height = videoHeight;
const color = "#FFFF";
const image_label = document.getElementById('hand');

var n_image = 1

async function setupWebcam() {
  return new Promise((resolve, reject) => {
    const navigatorAny = navigator;
    navigator.getUserMedia = navigator.getUserMedia ||
        navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
        navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia({video: true},
          stream => {
            video_test.srcObject = stream;
            video_test.addEventListener('loadeddata', () => resolve(), false);
          },
          error => reject());
    } else {
      reject();
    }
  });
}

const nextLabel = () => {
  n_image = n_image + 1
  image_label.src = "../images/Front/"+n_image+".png"
}

const takeSnapShot = () => {
  //Captura elemento de vídeo
  var video = document.querySelector("#webCamera");

  //Criando um canvas que vai guardar a imagem temporariamente
  var canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  var ctx = canvas.getContext('2d');

  //Desenhando e convertendo as dimensões
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //Criando o JPG
  var dataURI = canvas.toDataURL('image/jpeg'); //O resultado é um BASE64 de uma imagem.

  download(dataURI); //Gerar Imagem e Salvar Caminho no Banco
}

const download = (imageUrl) => {

  var link = document.createElement('a');
  link.href = imageUrl;
  link.download = "mao_"+n_image+"_"+document.getElementById('input_name').value+".jpg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function app() {

  await setupWebcam();
  const canvas = document.getElementById('output');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  
  const modelHandTrackParams = {
    flipHorizontal: false,   // flip e.g for video
    imageScaleFactor: 0.7,  // reduce input image size .
    maxNumBoxes: 1,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.35,    // confidence threshold for predictions.
  };
  const model = await handTrack.load(modelHandTrackParams);

  const update = () => {
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video_test, 0, 0, videoWidth, videoHeight);
    model.detect(video_test).then(predictions => {
      
      ctx.strokeStyle = 'green';
      ctx.beginPath();
      const test = predictions[0] ? predictions[0].bbox : [0,0,videoWidth,videoHeight];

      radio_improve = 25
      ctx.rect(test[0]-radio_improve, test[1]-radio_improve, test[2]+radio_improve*2, test[3]+radio_improve*2);
      
    });
    ctx.stroke();

    requestAnimationFrame(update)
  }
  update();

}

window.onload = () => {
  app();
};
