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

var nImage = 1;
const nMaxImage = 58;

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
    if (nImage >= 0 && nImage < nMaxImage) {
        nImage = nImage + 1;
        image_label_front.src = "../images/Front/" + nImage + ".png";
        image_label_side.src = "../images/Side/" + nImage + ".png";
    } else {
        showDialogMessage('Você já finalizou obrigado!!')
    }
    updateProgressBar()
};
const previousLabel = () => {
    if (nImage > 0 && nImage <= nMaxImage) {
        nImage = nImage - 1;
        image_label_front.src = "../images/Front/" + nImage + ".png";
        image_label_side.src = "../images/Side/" + nImage + ".png";
    }
    updateProgressBar()
};

const updateProgressBar = () => {

    const nPercent = (nImage / nMaxImage) * 100;
    if (nPercent <= 100 && nPercent >= 0) {
        const progressBarElement = document.getElementById('progBar');

        progressBarElement.style.width = `${nPercent.toFixed(2)}%`;
        progressBarElement.setAttribute('aria-valuenow', nPercent);
        progressBarElement.innerText = `${nPercent.toFixed(2)}%`;
    }
};

const showDialogMessage = (message, classOfAlert = 'alert-light') => {
    document.getElementById('alertResponse').setAttribute('class', 'alert shadow '.concat(classOfAlert));
    document.getElementById('msgResponse').innerText = message;
    $('#responseModal').modal('show');
};

const takeSnapShot = () => {
    const inputElement = document.getElementById('input_name');
    if (!inputElement.value) {
        showDialogMessage("Necessário informar seu nome");
        inputElement.focus();
    } else {
        nextLabel();
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

}

const download = (imageUrl) => {

    var link = document.createElement('a');
    link.href = imageUrl;
    link.download = "mao_" + nImage + "_" + document.getElementById('input_name').value + ".jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function app() {

    await setupWebcam();

    const model = await handTrack.load(modelHandTrackParams);

    let isHandTrackLocked = false;
    let lastResult;
    const useHandTracking = async (video_test) => {
        if (isHandTrackLocked) return lastResult;
        isHandTrackLocked = true;

        // Limita a execução do handtrack a 500 milisegundos por vez
        setTimeout(async () => {
            let test = [0, 0, videoWidth, videoHeight];
            const predictions = await model.detect(video_test);
            test = predictions[0] ? predictions[0].bbox : [0, 0, videoWidth, videoHeight];
            lastResult = test;
            isHandTrackLocked = false;
        }, 100);
        return lastResult;
    }

    const canvas = document.getElementById('output');
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const update = async () => {
        const ctx = canvas.getContext('2d');

        ctx.drawImage(video_test, 0, 0, videoWidth, videoHeight);

        let test = await useHandTracking(video_test);
        if (test) {
            ctx.strokeStyle = 'green';
            ctx.beginPath();

            radio_improve = 25
            ctx.rect(test[0] - radio_improve, test[1] - radio_improve, test[2] + radio_improve * 2, test[3] + radio_improve * 2);
        }

        ctx.stroke();

        requestAnimationFrame(update)
    }
    update();

}

window.onload = () => {
    app();
};
