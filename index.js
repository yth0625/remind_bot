const express = require('express');
const app = express();

const bodyparser = require('body-parser');
const port = process.env['REMIND_PORT'];

app.use(bodyparser.urlencoded({'extended':'true'}));
app.use(bodyparser.json());
require('./app/router')(app);

const remindCheck = require('./app/remind');

setInterval(
    () => {
        remindCheck();
    }, 30000 
);

app.listen(port, () => console.log('app listening on port ' + port));
