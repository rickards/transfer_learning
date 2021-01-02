// var video = document.getElementById("video");
// var canvas = document.getElementById("canvas");
// var ctx = canvas.getContext("2d");
// var pose = estimatePoseOnImage(video);

const videoWidth = 820;
const videoHeight = 500;

/**
 * Calcula a distância euclidiana entre duas posições
 * @param {'position' de keypoint, objeto de pose} position1 
 * @param {'position' de keypoint, objeto de pose} position2 
 */
function euclidianDistance(position1, position2) {
  squareX = Math.pow(position1.x - position2.x, 2);
  squareY = Math.pow(position1.y - position2.y, 2);

  return Math.sqrt(squareX+squareY);
}

/**
 * Calcula as coordenadas de um quadrado centralizado em um ponto no centro da mão
 * estimado.
 * @param {Parte 1 do objeto pose} keypoint1 
 * @param {Parte 2 do objeto pose} keypoint2 
 * @param {Largura do quadrado} width 
 * @param {Altura do quadrado} height 
 * @param {Constante usada na estimativa do centro da mão} t 
 */
function calculateCenteredHandSquare(keypoint1, keypoint2, width, height, t) {
  let corners = {
      "leftCorner": {
          "x": null,
          "y": null
      },
      "rightCorner": {
          "x": null,
          "y": null
      }
  };

  // estimar centro da palma da mão
  dx = keypoint2.position.x - keypoint1.position.x;
  dy = keypoint2.position.y - keypoint1.position.y;

  centerX = keypoint1.position.x + (t*dx);
  centerY = keypoint1.position.y + (t*dy);

  // quina esquerda
  corners.leftCorner.x = centerX - (width/2);
  corners.leftCorner.y = centerY - (height/2);

  if (corners.leftCorner.x < 0) {
      corners.leftCorner.x = 0;
  }
  if (corners.leftCorner.y < 0) {
      corners.leftCorner.y = 0;
  }

  // quina direita
  corners.rightCorner.x = centerX + (width/2);
  corners.rightCorner.y = centerY + (height/2);

  if (corners.rightCorner.x > videoWidth) {
      corners.rightCorner.x = videoWidth;
  }
  if (corners.rightCorner.y > videoHeight) {
      corners.rightCorner.y = videoHeight;
  }

  return corners;
}

/**
 * Calcula as coordenadas dos quadrados das mãos esquerda e direita.
 * @param {Resultado do objeto 'pose'} keypoints 
 */
function calculateHandsSquares(keypoints) {
  let leftWrist = keypoints[9];
  let rightWrist = keypoints[10];
  console.debug("leftWrist:", leftWrist);
  console.debug("rightWrist:", rightWrist);

  let leftShoulder = keypoints[5];
  let rightShoulder = keypoints[6];

  let leftElbow = keypoints[7];
  let rightElbow = keypoints[8];

  let shoulderSize = euclidianDistance(leftShoulder.position, rightShoulder.position);
  let width = shoulderSize*1.4;
  let height = shoulderSize*1.4;
  
  /*let leftHandDown = Boolean(leftElbow.position.y < leftWrist.position.y);
  let rightHandDown = Boolean(rightElbow.position.y < rightWrist.position.y);*/

  // console.debug("Shoulder size:", shoulderSize);
  console.debug("width size:", width);
  console.debug("height size:",height);

  return {
      "leftHandSquare": calculateCenteredHandSquare(leftElbow, leftWrist, width, height,  1.45),
      "rightHandSquare": calculateCenteredHandSquare(rightElbow, rightWrist, width, height,  1.45)
  };
}

// Monta um quadrado a ser desenhado em um canvas
function makeSquare(context, corner, color) {
  width = Math.abs(corner.rightCorner.x - corner.leftCorner.x);
  height = Math.abs(corner.rightCorner.y - corner.leftCorner.y);

  console.debug("corner.leftCorner", corner.leftCorner);
  console.debug("corner.rightCorner", corner.rightCorner);
  console.debug("width", width);
  console.debug("height", height);

  context.beginPath();
  context.lineWidth = "2";
  context.strokeStyle = color;
  context.rect(corner.leftCorner.x, corner.leftCorner.y, width, height);
  context.stroke();
  // ctx.drawImage(imageElement, corners.leftCorner.x, corners.leftCorner.y, swidth, yheight, corners.leftCorner.x, corners.leftCorner.y, swidth, yheight);
}

// Desenha os quadrados das mãos esquerda e direita no canvas
function drawSquares(handSquars, context) {
  console.debug("left Hand Square");
  makeSquare(context, handSquars.leftHandSquare, "red");
  console.debug("Right Hand Square");
  makeSquare(context, handSquars.rightHandSquare, "blue");
}

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;

  // const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: videoWidth,
      height: videoHeight
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

function detectHandInRealTime(video) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function handDetectionFrame() {
    const net = await posenet.load();

    const pose = await net.estimateSinglePose(video,
      {
        architecture: 'MobileNetV1',
        outputStride: 16,
        // quantBytes: 4,
        flipHorizontal: false,
        decodingMethod: 'single-person'
      });

    let handSquarsDict = calculateHandsSquares(pose.keypoints);

    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.drawImage(video, 0, 0);
    drawSquares(handSquarsDict, ctx);

    requestAnimationFrame(handDetectionFrame);
  }

  handDetectionFrame();
}

async function makePage() {
  let video = await loadVideo();
  detectHandInRealTime(video);
}

makePage();

//-------------------------------
/*async function funcao() {
  var video = document.getElementById("video");
  let v = await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });

  const net = await posenet.load();

  const pose = await net.estimateSinglePose(v, {
    architecture: 'MobileNetV1',
    outputStride: 16,
    // quantBytes: 4,
    flipHorizontal: false,
    decodingMethod: 'single-person'
  });

  console.log(pose);
}

funcao();*/
//-------------------------------

/*(function loop() {
  var pose = estimatePoseOnImage(video);
  ctx.drawImage(video, 0, 0);
  pose.then(function(pose) {
      console.log("Oi");
  })
  setTimeout(loop, 1000 / 30); // drawing at 30fps
})()*/

/*video.addEventListener('play', function() {
  var $this = this; //cache
  (function loop() {
    var pose = estimatePoseOnImage($this);
    if (!$this.paused && !$this.ended) {
      ctx.drawImage($this, 0, 0);
      // pose.then(function(pose) {
        // let handSquarsDict = calculateHandsSquares(pose.keypoints)
      console.log("oi");
      // })
      setTimeout(loop, 1000 / 30); // drawing at 30fps
    }
  })();
}, 0);*/