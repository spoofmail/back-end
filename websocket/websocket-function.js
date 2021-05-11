const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid')

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
    const jwt = decodeJWT(req.query.token)

    if(!jwt) {
        ws.close()
        return
    }

    const websocketUUID = uuidv4()
    ws.customUUID = websocketUUID

    addClient(jwt.user_id, ws)

    ws.on("message", function (msg) {
        console.log(msg)
    })

    ws.on("close", function(close) {
        console.log(close)
        removeClient(jwt.user_id, ws)
    })

    ws.send("Successfully connected")
}

function broadcast(user_id, message) {
    const clients = websocketClients[user_id]
    for(const client of clients) {
        client.send(JSON.stringify(message))
    }
}

module.exports = {
    webSocketConnect,
    addClient,
    removeClient,
    broadcast,
}