const carbone = require('carbone');
const express = require('express');
const axios = require('axios')
const fs = require('fs');
const app = express();


app.use(express.urlencoded({ extended: false }));
app.use(express.json({limit: '50mb'}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
});

app.get('/', function(request, response) {
  
  var html = `
    <html>
        <body>
            <form method="post" action="http://localhost:3000">
                Template: <input type="text" name="template" value="./node_modules/carbone/examples/simple.odt"/><br>
                JSON: <input type="textarea" name="json" rows="5" cols="50" wrap="soft" value='{"firstname":"John","lastname":"Doe"}'/><br>
                <input type="submit" value="Submit" />
            </form>
        </body>
    </html>`
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end(html);
})

app.post('/', async function(request, response) {
  const template = request.body.template;
  let filename = template.replace(/^.*[\\\/]/, '');    //extract template filename to use as download file name
  console.log(`start gen. template: ${template}, filename: ${filename}`)
  let templateFilePath = template
  if (template.startsWith('http')) {
    filename = template.substring(template.lastIndexOf('/') + 1)
    templateFilePath = './data/' + filename
    await downloadFile(templateFilePath, filename)
  }
  data = JSON.parse(request.body.json);
  options = JSON.parse(request.body.options);

  if (options.convertTo) {
    filename = filename.replace(/\.[^/.]+$/, "");   //change filename extension of converted (ie to PDF)
    filename = filename+'.'+options.convertTo;
  }

  carbone.render(templateFilePath, data, options, function(err, result){
    if (err) {
      return console.log(err);
    }
    response.setHeader('Content-Length', result.length);
    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader('Content-Disposition', 'attachment; filename="'+filename+'";');
    response.send(result);
  });
});

async function downloadFile(url, destinationPath) {
  console.log('downloadFile', url, destinationPath)
  try {
    // 发送GET请求
    const response = await axios({
      method: "get",
      url,
      responseType: "stream"
  });
    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status }`);
    }
    response.data.pipe(fs.createWriteStream ('./data/' + destinationPath));
    console.log ('File downloaded and saved');
  } catch (error) {
    console.error ('An error occurred:', error);
  }
}

