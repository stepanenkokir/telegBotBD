const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const config = require('config')

const token = config.get('bot_token');
const bot = new TelegramBot(token, {polling: true});
let setTimeSend = false
let setFIOSend = false

const readLists = (type)=>{
    const fileContent = fs.readFileSync("events.txt", "utf8");
    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth()+1
    const year = today.getFullYear()
    const ffD = fileContent.split('\r\n')       
    let strForSend="Сегодня день рождения у \n"
    for (let i=0;i<ffD.length;i++){
        const strD = ffD[i].split('  ')      
        const ddmmyy = strD[0].split('/')      
        if (type===0){
            if (month === +ddmmyy[1] && day === +ddmmyy[0]){
                console.log(ffD[i],"исполняется ",year - +ddmmyy[2])
                strForSend+=ffD[i]+" исполняется "+(year - +ddmmyy[2])+"\r\n"
            }
        }
        if (type===1){
            if (month === +ddmmyy[1]){
                console.log(ffD[i],"исполняется ",year - +ddmmyy[2])
                strForSend+=ffD[i]+" исполняется "+(year - +ddmmyy[2])+"\r\n"
            } 
        }
        
    }
    if (strForSend.length<27)
        strForSend="Сегодня, "+day+"."+month+"."+year+" ни у кого из списка нет дня рождения :о("
    return strForSend
}

const subscribeUser = (cId, type, hour=9)=>{
    const fileContent = fs.readFileSync("users.txt", "utf8");
    const listUsers = fileContent.split('\n')        
    let indx = -1
    for (let i=0;i<listUsers.length;i++){
        const spL = listUsers[i].split(':')       
        if (+spL[0] === +cId.id){
            indx = i
            break
        }
    }

    if (type==0){        
        if (indx==-1)
            return "Вас и так нет в списках рассылки уведомлений :o("

        let dataForSave="";
        for (let i=0;i<listUsers.length;i++){
            if (i!=indx){
                if (i>0) dataForSave+='\n'
                dataForSave+=listUsers[i]
            }                
        }
        fs.writeFileSync("users.txt", dataForSave)    
        return "Вы успешно отписаны от рассылки"                
    }

    if (type==1){
        console.log("Indx = ",indx)
        if (indx>=0)
            return "Вы и так уже подписаны на рассылку уведомлений в "+listUsers[indx].split(':')[1]+":00"
        
        const dataForSave=fileContent+"\n"+cId.id+":9:"+cId.first_name+"_"+cId.last_name            
        fs.writeFileSync("users.txt", dataForSave)                  
        return "Вы успешно подписаны на рассылку уведомлений в 9:00"        
    }

    if (type==2){
        console.log("Indx = ",indx)
        if (indx==-1)
            return "Вас нет в списках рассылки. Сначала нужно подписаться :o) "
                
        let dataForSave="";
        for (let i=0;i<listUsers.length;i++){
            if (i>0) dataForSave+='\n'
            if (i!=indx){                
                dataForSave+=listUsers[i]
            }
            else{
                const lineStr = listUsers[i].split(":")                
                dataForSave+=lineStr[0]+":"+hour+":"+lineStr[2]
            }                
        }
        fs.writeFileSync("users.txt", dataForSave) 
        console.log("New users:",dataForSave)

        return "Подписка изменена на рассылку уведомлений в "+hour+":00"
    }
    
}

const findText = (strFind)=>{    
    const strF = strFind.slice(1)
    const fileContent = fs.readFileSync("events.txt", "utf8"); 
    const ffD = fileContent.split('\r\n')       
    let strForSend="Найдено:\n"
    console.log("Find ",strF)    
    for (let i=0;i<ffD.length;i++){    
        
        if (ffD[i].toUpperCase().includes(strF.toUpperCase())>0){
            console.log(ffD[i])
            strForSend+=ffD[i]+"\r\n"
        }
    }
    return strForSend
}

const checkForSend = ()=>{
    const today = new Date()
   
    const hr = today.getHours()
    const min = today.getMinutes()

    const fileContent = fs.readFileSync("users.txt", "utf8");
    const listUsers = fileContent.split('\n')            
    for (let i=0;i<listUsers.length;i++){
        if (listUsers[i].length<2) continue
        const spL = listUsers[i].split(':')       
        
        if (+spL[1]===hr && min==0){
            
            const strForSend=readLists(0)
            if (!strForSend.includes("ни у кого из")){
                console.log("send to ", spL[0],strForSend)
                bot.sendMessage(spL[0], strForSend);
            }
                

        }
    }
    
    
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;        
    console.log(chatId+" ==> "+msg.text);
    let strForSend=""
    const nDate = new Date()
    const log= nDate+" "+chatId+" ( "+msg.chat.first_name+" "+msg.chat.last_name+" ): "+msg.text+"\n";

    fs.appendFileSync("log.txt",log);

    switch (msg.text) {        
        case '/today':
            strForSend=readLists(0)
            break;   
            
        case '/month':
            strForSend=readLists(1)
            break;  

        case '/subscribe':
            strForSend=subscribeUser(msg.chat,1)
            break;             
        case '/unsubscribe':
            strForSend = subscribeUser(msg.chat,0)
            break;             
        case '/change':
            setTimeSend = true
            strForSend="Введите новое время отправки уведомлений (от 0 до 23 Мск)"
            break;             
            
        case '/find':           
            bot.sendMessage(chatId, "Для поиска наберите: *строка_поиска");
            break; 

        case '/start':           
            bot.sendMessage(chatId, "Бот для уведомлений о днях рождения.")
            break; 

        case '/add': 
            setFIOSend = true
            bot.sendMessage(chatId, "Добавиить новую запись в формате:\n dd/mm/yyyy Фамилия Имя Отчество");
        break;
    
        default: 
        
            if (setTimeSend){
                const newHrSend = +msg.text
                if (newHrSend>0 && newHrSend<24){
                    //strForSend="Установлено новое время отправки уведомлений: "+newHrSend+" часов 00 минут"
                    strForSend=subscribeUser(msg.chat,2,newHrSend)
                }
                else
                    strForSend="Некорректное время("+newHrSend+"). Нужно вести число от 0 до 23.\n Время не изменено."
                setTimeSend = false
                break;
            }
            
            if (setFIOSend){
                const newREC = msg.text.split(" ")
                
                const ddmmyy = newREC[0].split('/')

                if (newREC.length <3 || ddmmyy.length != 3)
                    strForSend="Некорректная запись! Нужно вести dd/mm/yyyy Фамилия Имя Отчество"
                else{
                    strForSend="Добавлена запись для "+newREC[2]+" "+newREC[1]+" : "+newREC[0] 
                    const strS = "\r\n"+newREC[0]+"  "+newREC[1]+" "+newREC[2] + (newREC[3]?(" "+newREC[3]):"")
                    console.log("Add ",strS)
                    fs.appendFileSync("events.txt",strS);
                }

                setFIOSend = false
                break;
            }

            if (msg.text[0]==='*'){
                
                strForSend=findText(msg.text)
            }
            else        
                console.log("Wrong messages", msg.text)
            
            break;
    }  

    if (strForSend.length>20)
  	    bot.sendMessage(chatId, strForSend);         
});


setInterval(checkForSend,60000)