const router = require('express').Router();
const restricted = require('../../auth/restricted-middleware.js');

const speakeasy = require('speakeasy');

const Users = require('../users/users-model.js');
const MFARequests = require('./mfa_requests-model.js');
const { userHash, mfaRequestHash } = require('../../hashids/hashid.js');

router.post('/activate/begin', restricted, async (req, res) => {
    const currentUser = await Users.findById(req.jwt.user_id)

    if (currentUser.mfa) {
        return res.status(400).json({
            status: 'error',
            message: 'MFA is already enabled for this user'
        })
    }

    const mfa_request = await MFARequests.findByUserId(req.jwt.user_id)

    if (mfa_request) {
        if (Number(mfa_request.mfa_code_expiry) > Date.now()) {
            return res.status(400).json({
                status: 'error',
                message: 'MFA is already in progress for this user, please try again in 5 minutes',
            })
        }
    }

    const secret = speakeasy.generateSecret({
        name: `Spoofmail [${currentUser.username}]`,
    })

    let result

    if (mfa_request && mfa_request.id) {
        result = await MFARequests.update(mfa_request.id, {
            mfa_code_expiry: Date.now() + (60 * 1000 * 5),
            mfa_base32: secret.base32,
        })

        result = result[0]
        result.user_id = userHash.encode(req.jwt.user_id)
        result.id = mfaRequestHash.encode(result.id)
    } else {
        result = await MFARequests.add({
            user_id: req.jwt.user_id,
            mfa_code_expiry: Date.now() + (60 * 1000 * 5),
            mfa_base32: secret.base32,
        })
    }

    return res.status(200).json({
        status: 'success',
        message: 'MFA secret generated',
        otpauth_url: secret.otpauth_url,
        base32: secret.base32,
        mfaRequestId: result.id,
        expiresIn: result.mfa_code_expiry,
    })
})

router.post('/activate/verify', restricted, async (req, res) => {
    const { token, mfaRequestId } = req.body

    if (!token || typeof token !== 'string' || !mfaRequestId || typeof mfaRequestId !== 'string') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid request'
        })
    }

    const hasMFA = await MFARequests.findById(mfaRequestId)

    if (!hasMFA) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid request'
        })
    }

    if (hasMFA.mfa_code_expiry < Date.now()) {
        return res.status(400).json({
            status: 'error',
            message: 'MFA code has expired'
        })
    }
  
    const verified = speakeasy.totp.verify({
        secret: hasMFA.mfa_base32,
        encoding: 'base32',
        token,
    })

    if (!verified) {
        return res.status(200).json({
            status: 'error',
            message: 'Invalid token'
        })
    }

    await Users.update(req.jwt.user_id, {
        mfa_base32: hasMFA.mfa_base32,
    })

    await MFARequests.remove(hasMFA.id)

    return res.status(200).json({
        status: 'success',
        message: 'MFA token verified',
    })
})

module.exports = router;