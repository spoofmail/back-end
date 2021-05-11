const router = require('express').Router();

const Messages = require('./message-model.js');
const Addresses = require('../addresses/address-model')
const restricted = require('../../auth/restricted-middleware.js');

let axios = require('axios')

let activateLink = (code) => {

    let array = code.split('href=')

    console.log(array)

    array.forEach((string) => {
        if (string.includes('</a>')) {
            let sub = string.substring(1, string.search('>') - 1)

            console.log(sub)

            axios.get(sub)
        }
    })

}

router.get('/:id', restricted, (req, res) => {
    const address_id = req.params.id

    Messages.findBy({ address_id })
        .then(messages => {
            res.status(200).json(messages);
        })
        .catch(err => res.send(err));
});

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

    Addresses.findBy({ addressname: address }).first().then(addressRes => {
        if (addressRes) {
            let address_id = addressRes.id
            finalMessage.address_id = address_id;

            Messages.add(finalMessage)
                .then(() => {
                    const websocketClient = global.WebsocketClients[addressRes.user_id]

                    if(websocketClient) {
                        console.log(websocketClient)
                        websocketClient.send(JSON.stringify({ finalMessage }))
                    }

                    res.status(200).json({
                        message: `Message from ${finalMessage.from} has been added to inbox ID: ${address_id}`
                    });

                    Messages.findBy({ address_id }).then((messages) => {
                        if (messages.length < 3) {
                            activateLink(finalMessage.html)
                        }
                    })
                })
                .catch(error => {
                    res.status(500).json(error);
                });
        } 
        else { 
            res.status(401).json({ message: "That address doesn't exist" }) 
        }
    })

});

router.delete('/:id', async (req, res) => {
    try {
        const count = await Messages.remove(req.params.id);
        if (count > 0) {
            res.status(200).json({ message: 'The message has been nuked' });
        } else {
            res.status(404).json({ message: 'The message could not be found' });
        }
    } catch (error) {
        // log error to server
        console.log(error);
        res.status(500).json({
            message: 'Error removing the message',
        });
    }
});

module.exports = router;