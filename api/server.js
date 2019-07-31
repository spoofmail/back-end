const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authRouter = require('../auth/auth-router.js');
const usersRouter = require('../models/users/users-router.js');
const messagesRouter = require('../models/messages/message-router.js');
const addressesRouter = require('../models/addresses/address-router.js');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.use('/api/auth', authRouter);
server.use('/api/users', usersRouter);
server.use('/api/messages', messagesRouter);
server.use('/api/addresses', addressesRouter);

server.get('/', (req, res) => {
  res.send("Welcome to the Spoofmail Backend!");
});

module.exports = server;
