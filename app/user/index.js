const fetch = require('node-fetch');
let userToken = 'test';

const options = {
    method: 'POST',
    body: JSON.stringify(
        {
            'login_id': 'remind_bot',
            'password': 'snix123%'
        }
    ),
    headers: { 'Content-Type': 'application/json' }
};

function updateToken() {
    return fetch('https://chat.architectgroup.com/api/v4/users/login', options)
        .then(res => {
            userToken = res.headers.raw().token[0];
        });
}

function getUserToken() {
    return userToken;
}


module.exports = {
    getUserToken,
    updateToken
};