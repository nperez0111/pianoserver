#!/usr/local/bin/node

const ipc = require('node-ipc'),
    serverName = 'pianobar-server'

ipc.config.id = 'pianobar-stdin'
ipc.config.retry = 1500
ipc.config.silent = true



    ipc.connectTo(serverName, () => {
        //console.log('yet to connect')
        ipc.of[serverName].on('connect', () => {
            //console.log('connected')
            ipc.of[serverName].emit('getCurrentTime');

        });

        ipc.of[serverName].on('getCurrentTime', (currentTime) => {
            console.log(currentTime)
            ipc.of[serverName].emit('getStatus', "Dope");
            //ipc.disconnect(serverName)
        })

        ipc.of[serverName].on('getStatus', (current) => {
            console.log(current)
            //ipc.of[serverName].emit('nowPlaying', "Dope");
            ipc.disconnect(serverName)
        })
    })
let lastConnection=null  

class Connector{
        connectToServer(cb){
            return new Promise((resolve, reject) => {
                ipc.connectTo(serverName,function(){

                    lastConnection=Promise.resolve([ipc.of[serverName],ipc])
                    resolve([ipc.of[serverName],ipc])

                })
            })

        }
        callAndResponse(eventName,once=true,connected=false){
            return new Promise((resolve, reject) => {
                (connected||lastConnection||this.connectToServer()).then(([client,ipc])=>{
                    if(connected===false){
                        client.on('connect', () => {
                            client.emit(eventName)
                        })
                    }
                    let timeout=setTimeout(()=>{reject("Too Long To Respond")},2000)
                    client.on(eventName, (response) => {
                        if(once){
                            ipc.disconnect()
                        }
                        clearTimeout(timeout)
                        resolve([response,client,ipc])
                    })
                    
                })
            })
        }
        getCurrentTime(once=true){
            return this.callAndResponse('getCurrentTime',once)
        }
        getCurrentStatus(once=true){
            return this.callAndResponse('getStatus',once)
        }
        getStatusAndTime(once=true){
            return this.getCurrentStatus(false).then((status,client,ipc)=>{
                const resp= this.callAndResponse('getCurrentTime',once,Promise.resolve([client,ipc]))
                client.emit('getCurrentTime')
                return resp.then((currentTime,client,ipc)=>{
                    return [status,currentTime,client,ipc]
                })
            })
        }
        on(eventName, cb, alreadyConnected){
            ( alreadyConnected || lastConnection || this.connectToServer() ).then(([client,ipc])=>{
                client.on(eventName,cb)
            })
        }
    }
    module.exports=Connector