const db = require('../../database/dbConfig.js');
const { mfaRequestHash, userHash } = require('../../hashids/hashid.js');

module.exports = {
    add,
    findById,
    findByUserId,
    remove,
    update,
};

async function add(mfa_request) {
    console.log(mfa_request)
    mfa_request.user_id = userHash.decode(mfa_request.user_id)

    console.log(mfa_request)

    const [result] = await db('mfa_requests').insert(mfa_request, "id");

    return findById(mfaRequestHash.encode(result.id));
}

function findById(id) {
    return new Promise(function (resolve, reject) {
        const query = db('mfa_requests')
            .where('id', mfaRequestHash.decode(id))
            .first();

        query.then(result => {
            resolve({
                ...result,
                id: mfaRequestHash.encode(result.id),
                user_id: userHash.encode(result.user_id)
            })
        })
            .catch(err => {
                reject(err)
            })
    })
}

function findByUserId(user_id) {
    return new Promise(function (resolve, reject) {
        const query = db('mfa_requests')
            .where('user_id', userHash.decode(user_id))
            .first();

        query.then(result => {
            if (!result) {
                return resolve(null)
            }

            resolve({
                ...result,
                id: mfaRequestHash.encode(result.id),
                user_id: userHash.encode(result.user_id),
            })
        })
            .catch(err => {
                reject(err)
            })
    })
}

function remove(id) {
    return db('mfa_requests')
        .where('id', mfaRequestHash.decode(id))
        .del();
}

function update(id, changes) {
    return db('mfa_requests')
        .where('id', mfaRequestHash.decode(id))
        .update(changes, '*');
}
