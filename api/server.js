const express = require('express');
const expressWS = require("express-ws")
const helmet = require('helmet');
const cors = require('cors');

const authRouter = require('../auth/auth-router.js');
const usersRouter = require('../models/users/users-router.js');
const messagesRouter = require('../models/messages/message-router.js');
const addressesRouter = require('../models/addresses/address-router.js');
const websocketFunction = require("../websocket/websocket-function")

const server = express();
const serverWS = expressWS(server).app

serverWS.use(helmet());
serverWS.use(express.json());
serverWS.use(cors());

serverWS.use('/api/auth', authRouter);
serverWS.use('/api/users', usersRouter);
serverWS.use('/api/messages', messagesRouter);
serverWS.use('/api/addresses', addressesRouter);

serverWS.get('/', (req, res) => {
    res.send("Welcome to the Spoofmail Backend!");
});

serverWS.ws("/ws", websocketFunction)

/*serverWS.ws("/ws", (ws, req) => {
    ws.
})*/

global.WebsocketClients = {}

module.exports = serverWS;
