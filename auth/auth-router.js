const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const Users = require('../models/users/users-model.js');

// for endpoints beginning with /api/auth
router.post('/register', (req, res) => {
    let user = req.body;
    const hash = bcrypt.hashSync(user.password, 10); // 2 ^ n
    user.password = hash;

    Users.findBy({ username: user.username }).first()
        .then(user1 => {
            if (user1) {
                res.status(409).json({ message: "A user with that name already exists" })
            } else {
                Users.add(user)
                    .then(saved => {
                        Users.findBy({ username: user.username }).first()
                            .then(user2 => {
                                const token = generateToken(user2)
                                console.log(token)
                                res.status(201).json({
                                    message: `Welcome ${user2.username}!`, token
                                });
                            })
                            .catch(error => {
                                res.status(500).json(error);
                            });
                    })
                    .catch(error => {
                        res.status(500).json(error);
                    });
            }
        })
        .catch(err => {
            res.status(500).json(err);
        })
});

router.post('/login', (req, res) => {
    let { username, password } = req.body;

    Users.findBy({ username })
        .first()
        .then(user => {
            if (user && bcrypt.compareSync(password, user.password)) {
                const token = generateToken(user)
                console.log(token)
                res.status(200).json({
                    message: `Welcome ${user.username}!`, token
                });
            } else {
                res.status(401).json({ message: 'Invalid Credentials' });
            }
        })
        .catch(error => {
            res.status(500).json(error);
        });
});

function generateToken(user) {
    console.log("user: ", user)
    const jwtPayload = {
        subject: user.id,
        username: user.username,
    };

    const jwtSecret = process.env.JWT_SECRET || 'Spoofmail Secret!';
    const jwtOptions = {
        expiresIn: '1d'
    }

    return jwt.sign(jwtPayload, jwtSecret, jwtOptions)
}

module.exports = router;
