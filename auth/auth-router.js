const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const npmlog = require('npmlog');

const Users = require('../models/users/users-model.js');

// for endpoints beginning with /api/auth
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !username.length || typeof username !== 'string') {
        return res.status(400).json({ status: 'error', message: 'You must send a username' })
    }
    if (!password || !password.length || typeof password !== 'string') {
        return res.status(400).json({ status: 'error', message: 'You must send a password' })
    }

    Users.findByUsername(username)
        .then(async foundUser => {
            if (foundUser) {
                res.status(409).json({ message: "A user with that name already exists" })
            } else {
                const hashedPassword = await bcrypt.hash(password, 10)

                const newUser = {
                    username,
                    password: hashedPassword,
                }

                Users.add(newUser)
                    .then(saved => {
                        const token = generateToken(saved)

                        res.status(201).json({
                            message: `Welcome ${saved.username}!`,
                            token,
                            user: {
                                userId: saved.id,
                                username: saved.username,
                            },
                        });
                    })
                    .catch(error => {
                        npmlog.error(req.uuid, `An error occurred in ${req.path} while adding user to db`, {
                            uuid: req.uuid,
                            path: '/register',
                            data: {
                                username,
                            },
                            error: error,
                        })
                        res.status(500).json({ status: 'error', message: 'An error occurred while trying to register' });
                    });
            }
        })
        .catch(error => {
            npmlog.error(req.uuid, `An error occurred in ${req.path} while fetching by username`, {
                uuid: req.uuid,
                path: '/register',
                data: {
                    username,
                },
                error: error,
            })
            res.status(500).json({ status: 'error', message: 'An error occurred while trying to register' });
        })
});

router.post('/login', (req, res) => {
    let { username, password } = req.body;

    Users.findByUsername(username)
        .then(user => {
            if (user) {
                const result = bcrypt.compare(password, user.password)

                if (result) {
                    const token = generateToken(user)
    
                    res.status(200).json({
                        status: 'success',
                        message: `Welcome ${user.username}!`,
                        token,
                        user: {
                            userId: user.id,
                            username: user.username,
                        },
                    });
                } else {
                    res.status(401).json({ 
                        status: 'error',
                        message: 'Invalid Credentials' 
                    });
                }
            } else {
                res.status(401).json({ message: 'Invalid Credentials' });
            }
        })
        .catch(error => {
            npmlog.error(req.uuid, `An error occurred in ${req.path} while fetching by username`, {
                uuid: req.uuid,
                path: '/login',
                data: {
                    username,
                },
                error: error,
            })
            res.status(500).json({ status: 'error', message: 'An error occurred while trying to login' });
        });
});

function generateToken(user) {
    const jwtPayload = {
        subject: user.id,
        username: user.username,
    };

    const jwtSecret = process.env.JWT_SECRET || 'Spoofmail Secret!';
    const jwtOptions = {
        expiresIn: '1y',
    }

    return jwt.sign(jwtPayload, jwtSecret, jwtOptions)
}

module.exports = router;
