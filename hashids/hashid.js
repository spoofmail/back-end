const HashIds = require('hashids')

const userHash = new HashIds(
    'users' + (process.env.HASH_ID_SALT || 'spoofmail'), 
    parseInt(process.env.HASH_ID_LENGTH) || 9
)

const addressHash = new HashIds(
    'addresses' + (process.env.HASH_ID_SALT || 'spoofmail'), 
    parseInt(process.env.HASH_ID_LENGTH) || 9
)

const emailHash = new HashIds(
    'messages' + (process.env.HASH_ID_SALT || 'spoofmail'), 
    parseInt(process.env.HASH_ID_LENGTH) || 9
)

module.exports = {
    userHash: {
        encode: (id) => userHash.encode(parseInt(id)),
        decode: (id) => userHash.decode(id)[0]
    },
    addressHash: {
        encode: (id) => addressHash.encode(parseInt(id)),
        decode: (id) => addressHash.decode(id)[0]
    },
    emailHash: {
        encode: (id) => emailHash.encode(parseInt(id)),
        decode: (id) => emailHash.decode(id)[0]
    },
}