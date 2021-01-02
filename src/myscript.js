const videoWidth = 490;
const videoHeight = 350;
const video_test = document.getElementById('webCamera');
video_test.width = videoWidth;
video_test.height = videoHeight;
const color = "#FFFF";
const image_label_front = document.getElementById('hand_front');
const image_label_side = document.getElementById('hand_side');

const modelHandTrackParams = {
  flipHorizontal: false,   // flip e.g for video
  imageScaleFactor: 0.7,  // reduce input image size .
  maxNumBoxes: 1,        // maximum number of boxes to detect
  iouThreshold: 0.5,      // ioU threshold for non-max suppression
  scoreThreshold: 0.35,    // confidence threshold for predictions.
};

function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

// Converts canvas to an image
function convertCanvasToImage(canvas) {
	var image = new Image();
  image.src = canvas.toDataURL("image/png");
	return image;
}

async function setupWebcam() {
  return new Promise((resolve, reject) => {
    const navigatorAny = navigator;
    navigator.getUserMedia = navigator.getUserMedia ||
      navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
      navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia({ video: true },
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

async function app() {

  await setupWebcam();

  const mediapipe = await handpose.load();

  let isThreadLocked = false;
  let lastResult;
  const useTracking = async (video_test) => {
    if (isThreadLocked) return lastResult;
    isThreadLocked = true;

    // Limita a execução do handtrack a 500 milisegundos por vez
    setTimeout(async () => {

      const predictions = await mediapipe.estimateHands(video_test);

      for (let i = 0; i < predictions.length; i++) {
        const keypoints = predictions[i].landmarks;
        lastResult = keypoints;
   
        // // Log hand keypoints.
        // for (let i = 0; i < keypoints.length; i++) {
        //   const [x, y, z] = keypoints[i];
        //   console.log(`Keypoint ${i}: [${x}, ${y}, ${z}]`);
        // }
      }

      // lastResult = predictions;

      isThreadLocked = false;
    }, 100);
    return lastResult;
  }

  const canvas = document.getElementById('output');
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  const update = async () => {
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video_test, 0, 0, videoWidth, videoHeight);

    let keypoints = await useTracking(convertCanvasToImage(canvas));

    if (keypoints) {
      // Log hand keypoints.
      for (let i = 0; i < keypoints.length; i++) {
        const [x, y, z] = keypoints[i];
        // console.log(`Keypoint ${i}: [${x}, ${y}, ${z}]`);
        drawPoint(ctx, y, x, 6, 'red')
      }
    }

    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.scale(-1, 1);
    ctx.drawImage(video_test, 0, 0, videoWidth, videoHeight);

    let keypoints2 = await useTracking(convertCanvasToImage(canvas));

    if (keypoints2) {
      // Log hand keypoints.
      for (let i = 0; i < keypoints2.length; i++) {
        const [x, y, z] = keypoints2[i];
        // console.log(`Keypoint ${i}: [${x}, ${y}, ${z}]`);
        drawPoint(ctx, y, x, 3, 'aqua')
      }
    }

    // ctx.stroke();

    requestAnimationFrame(update)
  }
  update();

}

window.onload = () => {
  app();
};