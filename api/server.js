const express = require('express');
const expressWS = require("express-ws")
const helmet = require('helmet');
const cors = require('cors');
const cookies = require("cookie-parser");
const { v4: uuidv4 } = require('uuid');

const authRouter = require('../auth/auth-router.js');
const usersRouter = require('../models/users/users-router.js');
const mfaRequestsRouter = require('../models/mfa_requests/mfa_requests-router.js');
const messagesRouter = require('../models/messages/message-router.js');
const addressesRouter = require('../models/addresses/address-router.js');
const { webSocketConnect } = require("../websocket/websocket-function")

const server = express();
const serverWS = expressWS(server).app

serverWS.use(function(req, res, next) {
    req.uuid = uuidv4()
    res.setHeader('x-req-uuid', req.uuid)
    next()
})

serverWS.use(helmet());
serverWS.use(express.json());
serverWS.use(cors());
serverWS.use(cookies(process.env.JWT_SECRET));

serverWS.use('/api/auth', authRouter);
serverWS.use('/api/users', usersRouter);
serverWS.use('/api/mfa', mfaRequestsRouter);
serverWS.use('/api/messages', messagesRouter);
serverWS.use('/api/addresses', addressesRouter);

serverWS.get('/', (req, res) => {
    res.send("Welcome to the Spoofmail Backend!");
});

serverWS.ws("/ws", webSocketConnect)

module.exports = serverWS;
