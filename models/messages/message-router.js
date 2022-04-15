const router = require('express').Router();
const npmlog = require('npmlog')

const Messages = require('./message-model.js');
const Addresses = require('../addresses/address-model')
const restricted = require('../../auth/restricted-middleware.js');

const { broadcast } = require('../../websocket/websocket-function');
const { userHash } = require('../../hashids/hashid.js');

const { elasticEmail } = require('../../elastic/client')

/*const wordsJSON = require('../../data.json')
const words = Object.keys(wordsJSON)*/

router.get('/all/:page', restricted, (req, res) => {
    const { page } = req.params
    const { perPage } = req.query

    Messages.paginateFindByUserId({
        userId: req.jwt.user_id,
        page,
        perPage: perPage || 25,
    })
        .then(pageInfo => {
            res.status(200).json({
                messages: pageInfo.messages,
                total: pageInfo.total,
            });
        })
        .catch(error => {
            npmlog.error(req.uuid, `An error occurred in ${req.path} while paginating user's emails`, {
                uuid: req.uuid,
                path: '/all/:page',
                data: {
                    hashedUserId: req.jwt.user_id,
                    userId: userHash.decode(req.jwt.user_id),
                    page,
                    perPage,
                },
                error: error,
            })
            res.status(500).json({ status: 'error', message: 'An error occurred while trying to paginate user email list' });
        });
})

router.post('/', (req, res) => {
    let received = req.body;

    let finalMessage = {
        from: received.from[0].address,
        html: received.html,
        to: received.to[0].address,
        text: received.text,
        subject: received.subject
    }

    const address = finalMessage.to

    Addresses.findByAddress(address).then(addressRes => {
        if (addressRes) {
            const newMessage = {
                ...finalMessage,
                address_id: addressRes.id,
                user_id: addressRes.user_id,
            }

            Messages.add(newMessage)
                .then((saved) => {
                    broadcast(addressRes.user_id, { finalMessage: saved })

                    elasticEmail.indexEmail(saved)
                        .then(result => {
                            console.log({result})
                        })
                        .catch(err => {
                            npmlog.error('Failed to index email', err)
                        })

                    res.status(200).json({
                        status: 'success',
                        message: `Message from ${newMessage.from} has been added to inbox ID: ${addressRes.id}`,
                        saved,
                    });
                })
                .catch(error => {
                    npmlog.error(req.uuid, `An error occurred in ${req.path} while trying to insert an email`, {
                        uuid: req.uuid,
                        path: '/',
                        data: {
                            body: req.body,
                        },
                        error: error,
                    })
                    res.status(500).json({ status: 'error', message: 'An error occurred while trying to insert an email' });
                });
        } 
        else { 
            res.status(401).json({ status: 'error', message: "That address doesn't exist" }) 
        }
    })

});

router.delete('/:id', restricted, async (req, res) => {
    const { id } = req.params
    try {
        const message = await Messages.findById(id)

        if (message.user_id !== req.jwt.user_id) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to delete this resource'
            })
        }

        const count = await Messages.remove(id);
        if (count > 0) {
            res.status(200).json({ status: 'success', message: 'The message has been deleted', id: id });
        } else {
            res.status(404).json({ status: 'error', message: 'The message could not be found' });
        }
    } catch (error) {
        npmlog.error(req.uuid, `An error occurred in ${req.path} while deleting an email`, {
            uuid: req.uuid,
            path: '/:id',
            data: {
                id,
            },
            error: error,
        })
        res.status(500).json({ status: 'error', message: 'An error occurred while trying to delete an email' });
    }
});

function generateRandomSentence(length) {
    let str = ''

    for(let i = 0; i < length; i++) {
        str += words[parseInt(Math.random() * words.length)] + ' '
    }

    return str
}

/*
router.post('/secret/', restricted, async (req, res) => {
    const { address, amount } = req.body

    let amountGenerated = 0

    Addresses.findByAddress(address)
        .then(async addressRes => {
            const amountToGenerate = parseInt(amount)

            const resultsToIndex = []

            const decodedUserId = userHash.decode(addressRes.user_id)

            for(let i = 0; i < amountToGenerate; i++) {
                const randomText = generateRandomSentence(10)
                const newEmail = {
                    from: 'random_generator@spoofmail.us',
                    to: address,
                    text: randomText,
                    html: randomText,
                    subject: 'Random Gen' + i,
                    address_id: addressRes.id,
                    user_id: addressRes.user_id,
                }
                
                const result = await Messages.add(newEmail)
                amountGenerated++
                result.user_id = decodedUserId
                resultsToIndex.push(result)
                console.log('generating progress: ', Number(amountGenerated / amount) * 100)
                if (amountGenerated === amount) {
                    console.log({resultsToIndex})
                    elasticEmail.indexEmailBulk(resultsToIndex)
                    return res.status(200).json({
                        status: 'success',
                        message: `Successfully generated ${amount} random emails`,
                    })
                }
            }
        })
        .catch(error => {
            /*npmlog.error(req.uuid, `An error occurred in ${req.path} while generating random data`, {
                uuid: req.uuid,
                path: '/:id',
                data: {
                    address,
                    amountGenerated,
                },
                error: error,
            })
            res.status(500).json({ status: 'error', message: 'An error occurred while generating random data', generatedBeforeError: amountGenerated });
        })
})
*/

router.post('/search', restricted, async (req, res) => {
    const { query, from, size } = req.body

    if (!query) {
        return res.status(400).json({
            status: 'error',
            message: 'You must provide a query'
        })
    }
    if (typeof from !== 'number' || from < 0) {
        return res.status(400).json({
            status: 'error',
            message: 'You must provide a starting from index'
        })
    }
    if (typeof size !== 'number' || size < 0) {
        return res.status(400).json({
            status: 'error',
            message: 'You must provide a size'
        })
    }

    elasticEmail.searchEmailsByText({ 
        user_id: req.jwt.user_id ,
        text: query, 
        from: parseInt(from),
        size: parseInt(size),
    })
        .then(result => {
            res.status(200).json({
                status: 'success',
                message: `Successfully searched emails`,
                emails: result.hits.hits.map(emailResult => ({
                    ...emailResult._source,
                    user_id: userHash.encode(emailResult._source.user_id),
                })),
                total: result.hits.total.value,
            });
        })
        .catch(error => {
            npmlog.error(req.uuid, `An error occurred in ${req.path} while searching for emails`, {
                uuid: req.uuid,
                path: '/search',
                data: {
                    query,
                },
                error: error,
            })
            res.status(500).json({ status: 'error', message: 'An error occurred while trying to search for emails' });
        })
})

router.get('/elastic/count', restricted, (req, res) => {
    elasticEmail.countEmails()
        .then(result => {
            res.status(200).json({
                status: 'success',
                message: `Successfully counted emails`,
                count: result.count,
            });
        })
        .catch(err => {
            npmlog.error(req.uuid, `An error occurred in ${req.path} while counting emails`, {
                uuid: req.uuid,
                path: '/elastic/count',
                data: {},
                error: err,
            })
            res.status(500).json({ status: 'error', message: 'An error occurred while trying to count emails' });
        })
})

module.exports = router;