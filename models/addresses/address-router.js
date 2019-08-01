const router = require('express').Router();

const Addresses = require('./address-model.js');
const Users = require('../users/users-model.js');
const restricted = require('../../auth/restricted-middleware.js');

function generateRandomName(length) {
    let a = "abcdefghijklmnopqrstuvwxyz"

    let name = ""

    for (let i = 0; i < length; i++) {
        name += a.charAt(Math.random() * a.length);
    }

    return name;
}

router.get('/', restricted, (req, res) => {
  
    let user_id = 0;
    console.log(req.jwt)
    console.log(req.jwt.username)

  Users.findBy({ username: req.jwt.username }).first().then(user => {
    user_id = user.id
    
    Addresses.findBy({ user_id })
    .then(addresses => {
      res.json(addresses);
    })
    .catch(err => res.send(err));
  })
});

router.post('/', restricted, (req, res) => {
    let checker = false;
    let tag = req.body.addresstag
    let user_id = 0
    Users.findBy({ username: req.jwt.username }).first().then(user => {
        console.log('user ID from findBy: ', user.id)
        let user_id = user.id
        console.log(user_id)
        let addressname = ''
        while(!checker) {
            addressname = generateRandomName(7) + '@servicetechlink.com'
            let alreadyExists = Addresses.findBy( {addressname: addressname} )
            if (!alreadyExists.length) {checker = true}
        }
        let address = { addressname: addressname, addresstag: tag, user_id: user_id }
        console.log(address)
        Addresses.add(address)
        .then(saved => {
            res.status(200).json({
            message: `${address.addressname} has been added to the user`
            });
        })
        .catch(error => {
            res.status(500).json(error);
        });
    
    })
    console.log(user_id)
    
  });

  router.delete('/:id', restricted, async (req, res) => {
    try {
      const count = await Addresses.remove(req.params.id);

      console.log(count)
      if (count > 0) {
        res.status(200).json({ message: 'The address has been nuked' });
      } else {
        res.status(404).json({ message: 'The address could not be found' });
      }
    } catch (error) {
      // log error to server
      console.log(error);
      res.status(500).json({
        message: 'Error removing the address',
      });
    }
  });

module.exports = router;