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
    }).map( ( List ) => {
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
        const outputText = text.split(' ');

        switch( outputText[0] ) {
            case '-d':
                remindDelete(channel_id, outputText[1], res);
            return;
            case '-f':
                if( outputText[1] === 'week' || outputText[1] === 'day' ) {
                    remindType = outputText[1];
                    outputText.splice(0, 2);
                } else {
                    res.send({ response_type: 'ephemeral', text: '입력한 옵션 형식이 틀렸습니다. week 또는 day 를 설정해주세요 ex) -f {week or day}' });
                    return new Error('옵션 형식이 틀렸습니다.');
                }
            break;
            case '-l':
                viewList( channel_id, '현재 리스트를 출력합니다.\n\n', res);
            return;
            case '-h':
                res.send({ response_type: 'ephemeral', text: '사용 가능 옵션:\n-h: 사용 방법 보기\n-f: 매일, 매주 반복하는 옵션 day, week ex) -f {week or day}\n-l: 현재 채널의 리스트 확인\n-d: 리마인드 삭제 ex) -d {삭제 할 리마인드 인덱스(-l 로 확인 가능)}\n\n기본 사용 방법:\n날짜와 시간 함께 설정 ex) 2018/01/01 12:35 {remind Text}\n시간만 설정(날짜는 오늘로) ex) 21:45 {remind Text}' });
            return;
        }

        let remindDate;
        if ( outputText.length >= 3) {
            remindDate = new Date(outputText[0]); // Year, Month, Day 입력
            outputText.splice(0, 1);
        } else {
            remindDate = new Date();
        }
        
        let outputTime =  [];
        try {
            outputTime = outputText[0].split(':');
            outputText.splice(0, 1);
        } catch (error) {
            res.send({ response_type: 'ephemeral', text: '입력한 형식이 틀렸습니다. -h 옵션을 사용하세요.' });
            return new Error('날짜 형식이 틀렸습니다.');
        }

        // Hours, Minutes 입력
        remindDate.setHours(outputTime[0]);
        remindDate.setMinutes(outputTime[1]);

        if ( isNaN(remindDate) ) {
            res.send({ response_type: 'ephemeral', text: '입력한 형식이 틀렸습니다. -h 옵션을 사용하세요.' });
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