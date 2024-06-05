const carbone = require('carbone');
const express = require('express');
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
  template = request.body.template;
  filename = template.replace(/^.*[\\\/]/, '');    //extract template filename to use as download file name
  console.log(`start gen. template: ${template}, filename: ${filename}`)
  if (template.startsWith(/http.[s]:\/\//)) {
    filename = '/data/' + template.substring(template.lastIndexOf('/') + 1)
    await downloadFile(template, filename)
  }
  data = JSON.parse(request.body.json);
  options = JSON.parse(request.body.options);

  if (options.convertTo) {
    filename = filename.replace(/\.[^/.]+$/, "");   //change filename extension of converted (ie to PDF)
    filename = filename+'.'+options.convertTo;
  }

  carbone.render(template, data, options, function(err, result){
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
  try {
    // 发送GET请求
    const response = await fetch(url);
    if (!response.ok ) {
      throw new Error(`HTTP error! Status: ${response.status }`);
    }
    // 获取响应体作为流
    const body = response.body ;
    // 将流转换为Node.js 的fs流
    const reader = body.getReader ();
    const writer = fs.createWriteStream (destinationPath);
    for (;;) {
      const { done, value } = await reader.read ();
      if (done) break;
      writer.write (value);
    }
    console.log ('File downloaded and saved');
  } catch (error) {
    console.error ('An error occurred:', error);
  }
}

