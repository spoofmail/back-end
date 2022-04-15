const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { userHash } = require('../hashids/hashid');

let websocketClients = {}

/*
user_id: [ws, ws, ws],
user_id: [ws, ws, ws],
user_id: [ws, ws, ws],
*/

function addClient(client_id, websocket) {
    if (!websocketClients[client_id]) {
        websocketClients[client_id] = [websocket]
    } else {
        websocketClients[client_id].push(websocket)
    }
}

function removeClient(client_id, websocket) {
    const websocketUUID = websocket.customUUID

    if (websocketClients[client_id]) {
        websocketClients[client_id] = websocketClients[client_id].filter(socket => socket.customUUID !== websocketUUID)
    }
}

function decodeJWT(token) {
    if(!token) return null

    const secret = process.env.JWT_SECRET || 'Spoofmail Secret!';

    try {
        const decoded = jwt.verify(token, secret, {})

        return { username: decoded.username, user_id: decoded.subject }
    }
    catch(e) {
        return null
    }
}

function webSocketConnect(ws, req) {
    const userId = userHash.decode(req.query.userId)

    const websocketUUID = uuidv4()
    ws.customUUID = websocketUUID
    ws.customMessageQueue = new Array()
    ws.customAuthenticated = false

    addClient(userId, ws)

    ws.on("message", function (msg) {
        const message = JSON.parse(msg)
        console.log(message)
        switch(message.type) {
            case 'auth':
                const jwt = decodeJWT(message.token)

                if (!jwt) {
                    ws.send(JSON.stringify({
                        type: 'auth-fail',
                        message: 'Token could not be decoded'
                    }))
                    return
                }

                ws.customAuthenticated = true
                ws.customMessageQueue = []
                ws.send(JSON.stringify({
                    type: 'auth-success',
                    message: 'You are now authenticated',
                }))

                // begin sending messages from queue

                break
        }
        console.log(msg)
    })

    ws.on("close", function(close) {
        console.log(close)
        removeClient(jwt.user_id, ws)
    })

    ws.send({
        type: 'connection-success',
        uuid: websocketUUID,
        message: 'In your next message to the server, please send your token'
    })
}

function broadcast(user_id, message) {
    const clients = websocketClients[user_id]
    if (Array.isArray(clients)) {
        const stringMessage = JSON.stringify(message)
        for(const client of clients) {

            if (!client.customAuthenticated) {
                if (client.customAuthenticated.length < 100)
                    client.customMessageQueue.push(stringMessage)
                else {
                    client.customOverflowQueue = true
                }
            } else {
                client.send(stringMessage)
            }
        }
    }
}

module.exports = {
    webSocketConnect,
    addClient,
    removeClient,
    broadcast,
}