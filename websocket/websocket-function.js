const jwt = require('jsonwebtoken');

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

    global.WebsocketClients[jwt.user_id] = ws

    ws.on("message", function (msg) {
        console.log(msg)
    })

    ws.on("close", function(close) {
        console.log(close)
    })
}

module.exports = webSocketConnect