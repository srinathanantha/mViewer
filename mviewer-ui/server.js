var express = require('express');
var app = express();
const path = require('path');

app.use(express.static(__dirname +'/build'));

app.get('*', function (request, response){
  response.sendFile(path.resolve(__dirname, 'build', 'index.html'))
})


app.listen(3000, function(err)
{
     if (err) throw err;

     console.log('server is running on port 3000');
});
