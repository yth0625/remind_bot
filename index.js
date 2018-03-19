const express = require('express');
const app = express();

const bodyparser = require('body-parser');
const port = 8825;

app.use(bodyparser.urlencoded({'extended':'true'}));
app.use(bodyparser.json());
require('./app/router')(app);

const remindCheck = require('./app/remind');

setInterval(
    () => {
        remindCheck();
    }, 20000
);

app.listen(port, () => console.log('app listening on port ' + port));
