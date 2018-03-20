const fs = require('fs');
const storagePath = './storage/remindList.json';
const remindFile = require('../../' + storagePath);

function saveStorage(res, text) {
    fs.writeFile(storagePath, JSON.stringify(remindFile, null, '\t'), (err) => {
        if (err) {
            console.log(err);
            process.exit(1);
        } else 
            res.send({ response_type: 'ephemeral', text: text });
        console.log('파일 작성 완료');
    });
}

function viewList ( req, res ) {
    const { channel_id } = req.body;
    let text = '| 순서 | 포스트 | 리마인드 타임 | 만든 시간 | 만든 사람 |\n|-----|-----|-----|-----|-----|\n';
    remindFile.channelList.filter( (List) => {
        if ( List.channelId === channel_id ) {
            return List;
        }
    })
        .map( ( List ) => {
            List.remindList.map((remind, index) => {
                text += `| ${index + 1} | ${remind.post} | ${new Date(remind.remindTime).toLocaleString()} | ${new Date(remind.creationTime).toLocaleString()} | ${remind.createdBy} |\n`;
            });
        });

    if (text.length !== 71) 
        res.send({ response_type: 'ephemeral', text: text });
    else 
        res.send({ response_type: 'ephemeral', text: '해당 채널에 등록 된 리스트가 없습니다. 등록해주세요!' });
}

function remindDelete(req, res) {
    const index = req.body.text;
    const { channel_id } = req.body;

    for( let i = 0; i < remindFile.channelList.length; i++) {
        const List = remindFile.channelList[i];
        if ( List.channelId === channel_id && List.remindList.length >= index && index !== '0') { 
            remindFile.channelList[i].remindList.splice(`${index - 1}`, 1);
            saveStorage(res, index + '번째 리마인드 포스트를 삭제하였습니다.');
            break;
        } else {
            res.send({ response_type: 'ephemeral', text: '해당 채널에 삭제 할 리마인드 포스트가 없습니다.' });
            break;
        }
    }
}

module.exports = (app) => {
    app.post('/remind', (req, res) => {
        const { text } = req.body;

        if ( text === 'list') {
            viewList(req, res);
            return;
        }  

        const outputText = text.split(' ');

        if ( outputText[0] === 'delete' ) {
            remindDelete(req, res);
            return;
        }
     
        const remindDate = new Date(outputText[0]); // Year, Month, Day 입력
        outputText.splice(0, 1);
        
        let outputTime =  [];
        try {
            outputTime = outputText[0].split(':');
            outputText.splice(0, 1);
        } catch (error) {
            res.send({ response_type: 'ephemeral', text: '입력한 형식이 틀렸습니다. ex) 2018/01/01 12:35 {remind Text}' });
            return new Error('날짜 형식이 틀렸습니다.');
        }

        // Hours, Minutes 입력
        remindDate.setHours(outputTime[0]);
        remindDate.setMinutes(outputTime[1]);

        if ( isNaN(remindDate) ) {
            res.send({ response_type: 'ephemeral', text: '입력한 형식이 틀렸습니다. ex) 2018/01/01 12:35 {remind Text}' });
            return new Error('날짜 형식이 틀렸습니다.');
        }

        if ( remindDate.getTime() < Date.now() ) {
            res.send({ response_type: 'ephemeral', text: '이미 지난 시간은 입력 할 수 없습니다. 다시 입력해 주세요.' });
            return new Error('날짜 형식이 틀렸습니다.');
        }

        let remindText = '';
        outputText.map(
            (text) => { 
                remindText += text + ' ';
            }
        );

        const { channel_id } = req.body;
        for( let index = 0; index < remindFile.channelList.length; index++) {
            const remind = remindFile.channelList[index];
            if ( remind.channelId === channel_id ) {
                console.log('이미 존재하는 채널');
                remind.remindList.push({
                    'post': remindText,
                    'creationTime': new Date().getTime(),
                    'remindTime': remindDate.getTime(),
                    'createdBy': req.body.user_name
                });
                saveStorage(res, '리마인드가 등록되었습니다');
                break;
            } else if ( remind.channelId === '' ) {
                console.log('초기화');
                remindFile.channelList[0] = {
                    'channelId': channel_id,
                    'remindList': [
                        {
                            'post': remindText,
                            'creationTime': Date.now(),
                            'remindTime': remindDate.getTime(),
                            'createdBy': req.body.user_name
                        }
                    ]
                };
                saveStorage(res, '리마인드가 등록되었습니다');
                break;
            } else if ( remindFile.channelList.length - 1 === index ) {
                console.log('없는 값 재생성');
                remindFile.channelList.push({
                    'channelId': channel_id,
                    'remindList': [
                        {
                            'post': remindText,
                            'creationTime': Date.now(),
                            'remindTime': remindDate.getTime(),
                            'createdBy': req.body.user_name
                        }
                    ]
                });
                saveStorage(res, '리마인드가 등록되었습니다');
                break;
            }
        }
    });
};