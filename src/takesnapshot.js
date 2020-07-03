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
    link.download = "example.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }