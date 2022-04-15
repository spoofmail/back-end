const router = require('express').Router();
const npmlog = require('npmlog')

const crypto = require('crypto')

const Addresses = require('./address-model.js');

const restricted = require('../../auth/restricted-middleware.js');
const { userHash } = require('../../hashids/hashid.js');

function generateRandomName(length) {
  let a = "abcdefghijklmnopqrstuvwxyz"

  let name = ""

  for (let i = 0; i < length; i++) {
    name += a.charAt(crypto.randomInt(a.length));
  }

  return name;
}

router.get('/', restricted, (req, res) => {
  Addresses.findByUserId(req.jwt.user_id)
    .then(addresses => {
      res.json({
        status: 'success',
        message: 'Successfully retrieved addresses',
        addresses,
      });
    })
    .catch(error => {
      npmlog.error(req.uuid, `An error occurred in ${req.path} while fetching user's addresses`, {
        uuid: req.uuid,
        path: '/',
        data: {
          hashedUserId: req.jwt.user_id,
          user_id: userHash.decode(req.jwt.user_id),
        },
        error: error,
      })
      res.status(500).json({ status: 'error', message: 'An error occurred while trying to get user addresses' });
    });
});

router.post('/', restricted, async (req, res) => {
  const { addresstag } = req.body

  const generatedAddressName = await generateAddressName()

  const newAddress = {
    addresstag,
    addressname: generatedAddressName,
    user_id: req.jwt.user_id,
  }

  Addresses.add(newAddress)
    .then(saved => {
      res.status(200).json({
        message: `${generatedAddressName} has been added to the user`,
        saved
      });
    })
    .catch(error => {
      npmlog.error(req.uuid, `An error occurred in ${req.path} while adding address to db`, {
        uuid: req.uuid,
        path: '/',
        data: {
          newAddress,
        },
        error: error,
      })
      res.status(500).json({ status: 'error', message: 'An error occurred while trying to create an address' });
    });
});

router.delete('/:id', restricted, async (req, res) => {
  const { id } = req.params

  try {
    const address = await Addresses.findById(id)

    if (address.user_id !== req.jwt.user_id) {
      return res.status(403).json({ status: 'error', message: 'You are not authorized to delete this resource' })
    }

    const count = await Addresses.remove(id);

    if (count > 0) {
      res.status(200).json({ status: 'success', message: 'The address has been deleted' });
    } else {
      res.status(404).json({ message: 'The address could not be found' });
    }
  } catch (error) {
    npmlog.error(req.uuid, `An error occurred in ${req.path} while trying to delete an address`, {
      uuid: req.uuid,
      path: '/',
      data: {
        id: req.jwt.user_id,
      },
      error: error,
    })
    res.status(500).json({ status: 'error', message: 'An error occurred while trying to delete an address' });
  }
});

router.put('/:id', restricted, async (req, res) => {
  const { id } = req.params
  const body = req.body

  try {
    const queryAddress = await Addresses.findById(id)

    if (queryAddress.user_id !== req.jwt.user_id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to modify this resource',
      })
    }

    const address = await Addresses.update(id, body);
    if (address) {
      res.status(200).json(address);
    } else {
      res.status(404).json({ message: 'The address could not be found' });
    }
  } catch (error) {
    npmlog.error(req.uuid, `An error occurred in ${req.path} while trying to update an address`, {
      uuid: req.uuid,
      path: '/',
      data: {
        hashedUserId: req.jwt.user_id,
        userId: userHash.decode(req.jwt.user_id),
        id,
        body,
      },
      error: error,
    })
    res.status(500).json({ status: 'error', message: 'An error occurred while trying to update an address' });
  }
});

async function generateAddressName() {
  let tries = 0

  while (tries < 10) {
    const newName = generateRandomName(7) + '@spoofmail.us'

    const result = await Addresses.findByAddress(newName)
    if (result && result.id) {
      tries += 1
      continue
    } else {
      return newName
    }
  }

  return newName
}

module.exports = router;