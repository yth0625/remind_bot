const fetch = require('node-fetch');
let userToken = '';

const options = {
    method: 'POST',
    body: JSON.stringify(
        {
            'login_id': `${userId}`,
            'password': `${userPassword}`
        }
    ),
    headers: { 'Content-Type': 'application/json' }
};

function updateToken() {
    return fetch(`${process.env['MatterMost_SERVER_URL']}/api/v4/users/login`, options)
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