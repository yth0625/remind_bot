const fs = require('fs');
const storagePath = './storage/remindList.json';
const remindFile = require('../../' + storagePath);

function saveStorage() {
    fs.writeFile(storagePath, JSON.stringify(remindFile, null, '\t'), (err) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
    });
}

function viewList ( channelId, printText, res ) {
    let text = printText + '| 순서 | 포스트 | 리마인드 타임 | 만든 시간 | 만든 사람 | 리마인드 타입 |\n|-----|-----|-----|-----|-----|\n';
    remindFile.channelList.filter( (List) => {
        if ( List.channelId === channelId ) {
            return List;
        }
    })
        .map( ( List ) => {
            List.remindList.map((remind, index) => {
                text += `| ${index + 1} | ${remind.post} | ${new Date(remind.remindTime).toLocaleString()} | ${new Date(remind.creationTime).toLocaleString()} | ${remind.createdBy} | ${remind.remindType} |\n`;
            });
        });

    if (text.length !== 71 + printText.length) 
        res.send({ response_type: 'ephemeral', text: text });
    else 
        res.send({ response_type: 'ephemeral', text: printText + '해당 채널에 등록 된 리스트가 없습니다. 등록해주세요!' });
}

function remindDelete(channelId, index, res) {
    for( let i = 0; i < remindFile.channelList.length; i++) {
        const List = remindFile.channelList[i];
        if ( List.channelId === channelId && List.remindList.length >= index && index !== '0') {
            remindFile.channelList[i].remindList.splice(`${index - 1}`, 1);
            viewList( channelId, index + '번째 리마인드 포스트를 삭제하였습니다.\n\n', res);
            saveStorage();
            return;
        }
    }
    res.send({ response_type: 'ephemeral', text: '해당 채널에 삭제 할 리마인드 포스트가 없습니다.' });
}

module.exports = (app) => {
    app.post('/remind', (req, res) => {
        const { text } = req.body;
        const { channel_id } = req.body;
        let remindType = 'once'; //true run once, false run forever

        if ( text === 'list') {
            viewList( channel_id, '현재 리스트를 출력합니다.\n\n', res);
            return;
        }  

        const outputText = text.split(' ');

        if ( outputText[0] === 'delete' ) {
            console.log(outputText);
            remindDelete(channel_id, outputText[1], res);
            return;
        }

        if ( outputText[0] === '-f') {
            if(outputText[1] === 'week' || outputText[1] === 'day') {
                remindType = outputText[1];
                outputText.splice(0, 2);
            } else {
                res.send({ response_type: 'ephemeral', text: '입력한 옵션 형식이 틀렸습니다. week 또는 day 를 설정해주세요 ex) -f {week or day}' });
                return new Error('옵션 형식이 틀렸습니다.');
            }
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

        for( let index = 0; index < remindFile.channelList.length; index++) {
            const remind = remindFile.channelList[index];
            if ( remind.channelId === channel_id ) {
                remind.remindList.push({
                    'post': remindText,
                    'creationTime': new Date().getTime(),
                    'remindTime': remindDate.getTime(),
                    'createdBy': req.body.user_name,
                    'remindType': remindType
                });
                viewList( channel_id, '리마인드가 등록되었습니다.\n\n', res);
                saveStorage();
                break;
            } else if ( remind.channelId === '' ) {
                remindFile.channelList[0] = {
                    'channelId': channel_id,
                    'remindList': [
                        {
                            'post': remindText,
                            'creationTime': Date.now(),
                            'remindTime': remindDate.getTime(),
                            'createdBy': req.body.user_name,
                            'remindType': remindType
                        }
                    ]
                };
                viewList( channel_id, '리마인드가 등록되었습니다.\n\n', res);
                saveStorage();
                break;
            } else if ( remindFile.channelList.length - 1 === index ) {
                remindFile.channelList.push({
                    'channelId': channel_id,
                    'remindList': [
                        {
                            'post': remindText,
                            'creationTime': Date.now(),
                            'remindTime': remindDate.getTime(),
                            'createdBy': req.body.user_name,
                            'remindType': remindType
                        }
                    ]
                });
                viewList( channel_id, '리마인드가 등록되었습니다.\n\n', res);
                saveStorage();
                break;
            }
        }
    });
};