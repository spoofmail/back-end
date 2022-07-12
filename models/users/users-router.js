const router = require('express').Router();
const npmlog = require('npmlog')

const Users = require('./users-model.js');
const restricted = require('../../auth/restricted-middleware.js');
const { userHash } = require('../../hashids/hashid.js');

router.get('/session', restricted, (req, res) => {
  res.status(200).json(req.jwt)
});

router.put('/', async (req, res) => {
  try {
    const user = await Users.update(req.jwt.user_id, req.body);
    if (user) {
      res.status(200).json({ status: 'success', message: 'Successfully updated the user', user });
    } else {
      res.status(404).json({ status: 'error', message: 'The user could not be found' });
    }
  } catch (error) {
    npmlog.error(req.uuid, `An error occurred in ${req.path} while trying to update user`, {
      uuid: req.uuid,
      path: '/',
      data: {
        body: req.body,
      },
      error: error,
    })
    res.status(500).json({ status: 'error', message: 'An error occurred while trying to update the user' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const count = await Users.remove(req.jwt.user_id);
    if (count > 0) {
      res.status(200).json({ status: 'success', message: 'The user has been deleted' });
    } else {
      res.status(404).json({ status: 'error', message: 'The user could not be found' });
    }
  } catch (error) {
    npmlog.error(req.uuid, `An error occurred in ${req.path} while trying to delete the user`, {
      uuid: req.uuid,
      path: '/',
      data: {
        hashedUserId: req.jwt.user_id,
        userId: userHash.decode(req.jwt.user_id),
      },
      error: error,
    })
    res.status(500).json({ status: 'error', message: 'An error occurred while trying to delete the user' });
  }
});

router.get('/mfa/active', restricted, async (req, res) => {
  try {
    const user = await Users.findById(req.jwt.user_id);
    if (user) {
      if (user.mfa_base32 && user.mfa_base32.length > 1) {
        res.status(200).json({ status: 'success', message: 'MFA is active for this user', hasMFA: true });
      } else {
        res.status(200).json({ status: 'success', message: 'MFA is inactive for this user', hasMFA: false });
      }
    } else {
      res.status(404).json({ status: 'error', message: 'The user could not be found' });
    }
  } catch (error) {
    npmlog.error(req.uuid, `An error occurred in ${req.path} while trying to retrieve the user's mfa status`, {
      uuid: req.uuid,
      path: '/',
      data: {
        hashedUserId: req.jwt.user_id,
        userId: userHash.decode(req.jwt.user_id),
      },
      error: error,
    })
    res.status(500).json({ status: 'error', message: 'An error occurred while trying to retrieve the users mfa status' });
  }
})

module.exports = router;
