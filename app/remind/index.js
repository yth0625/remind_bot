const fs = require('fs');
const fetch = require('node-fetch');
const storagePath = './storage/remindList.json';
let remindFile = require('../../' + storagePath);

//use personal accesstoken
const token = 'personal access token of remind bot account';

//if you do not use personal access token. use user/index.js

module.exports = () => {
    const currentTime = Date.now();

    remindFile.channelList = remindFile.channelList.map((List)=>{
        List.remindList = List.remindList.map((remind) => {
            if ( currentTime >= remind.remindTime && currentTime <= remind.remindTime + 59999) {
                const options = {
                    method: 'POST',
                    body: JSON.stringify({
                        'channel_id': List.channelId,
                        'message': remind.post
                    }),
                    headers: {
                        'Authorization' : `Bearer ${token}`, 
                        'Content-Type': 'application/json'
                    }
                };

                fetch(`${process.env['MatterMost_SERVER_URL']}/api/v4/posts`, options)
                    .then( () => console.log('포스트가 성공적으로 등록되었습니다.') )
                    .catch(err => console.error(err));
                
                if ( remind.remindType === 'week') {remind.remindTime += 86400000 * 7; return remind}
                else if ( remind.remindType === 'day') {remind.remindTime += 86400000; return remind}
                else return;
            }
            return remind;
        });

        List.remindList =  List.remindList.filter( (list) => {return list !== undefined; });
        return List;
    });

    fs.writeFile(storagePath, JSON.stringify(remindFile, null, '\t'), (err) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
    });

};
