let net;

const webcamElement = document.getElementById('webcam');
const classifier = knnClassifier.create();
const modelHandTrackParams = {
    flipHorizontal: false,   // flip e.g for video 
    imageScaleFactor: 0.7,  // reduce input image size .
    maxNumBoxes: 1,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.35,    // confidence threshold for predictions.
  }

async function setupWebcam() {
    return new Promise((resolve, reject) => {
      const navigatorAny = navigator;
      navigator.getUserMedia = navigator.getUserMedia ||
          navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
          navigatorAny.msGetUserMedia;
      if (navigator.getUserMedia) {
        navigator.getUserMedia({video: true},
          stream => {
            webcamElement.srcObject = stream;
            webcamElement.addEventListener('loadeddata',  () => resolve(), false);
          },
          error => reject());
      } else {
        reject();
      }
    });
  }

async function app() {
    console.log('Loading mobilenet..');

    // Load the model.
    net = await mobilenet.load();
    console.log('Successfully loaded model');

    await setupWebcam();

    // Reads an image from the webcam and associates it with a specific class
    // index.
    const addExample = classId => {
        // Get the intermediate activation of MobileNet 'conv_preds' and pass that
        // to the KNN classifier.
        const activation = net.infer(webcamElement, 'conv_preds');

        // Pass the intermediate activation to the classifier.
        classifier.addExample(activation, classId);
    };

    const hand_rect = classId => {
        handTrack.load(modelHandTrackParams).then(model => { 
            model.detect(webcamElement).then(predictions => {
                console.log('Predictions: ', predictions) // bbox predictions
                var c = document.getElementById("hand_track");
                var ctx = c.getContext("2d");
                ctx.drawImage(webcamElement, 10, 10);

                ctx.beginPath();
                const test = predictions[0] ? predictions[0].bbox : [0,0,560,560];
                
                ctx.strokeStyle = 'green';
                ctx.rect(test[0], test[1], 10, 10);
                if(test.length != 0){
                    ctx.rect(test[0]+50, test[1]-80, test[2]+10, test[3]+10);
                }
               
                ctx.stroke();
            });
        });
    };

    // When clicking a button, add an example for that class.
    // document.getElementById('class-a').addEventListener('click', () => addExample(0));
    // document.getElementById('class-b').addEventListener('click', () => addExample(1));
    // document.getElementById('class-c').addEventListener('click', () => addExample(2));

    document.getElementById('take_picture').addEventListener('click', () => hand_rect(0));

    while (true) {
        if (classifier.getNumClasses() > 0) {
        // Get the activation from mobilenet from the webcam.
        const activation = net.infer(webcamElement, 'conv_preds');
        // Get the most likely class and confidences from the classifier module.
        const result = await classifier.predictClass(activation);

        const classes = ['A', 'B', 'C'];
        document.getElementById('console').innerText = `
            prediction: ${classes[result.classIndex]}\n
            probability: ${result.confidences[result.classIndex]}
        `;
        }

        await tf.nextFrame();
    }
}

app();