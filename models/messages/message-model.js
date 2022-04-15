const db = require('../../database/dbConfig.js');
const { emailHash, addressHash, userHash } = require('../../hashids/hashid.js');

module.exports = {
  add,
  find,
  findBy,
  findById,
  remove,
  paginateFindByUserId,
};

function find() {
  return db('messages').select('id', 'messagename', 'password');
}

function findBy(filter) {
  return db('messages').where(filter);
}

async function add(message) {
  message.address_id = addressHash.decode(message.address_id)
  message.user_id = userHash.decode(message.user_id)

  const [result] = await db('messages').insert(message, 'id');

  return findById(emailHash.encode(result.id));
}

function findById(id) {
  const decodedId = emailHash.decode(id)

  return new Promise(function(resolve, reject) {
    const query = db('messages')
      .where('id', decodedId)
      .first();

    query.then(result => {
      resolve({
        ...result,
        id: id,
        user_id: userHash.encode(result.user_id),
        address_id: addressHash.encode(result.address_id),
      })
    })
    .catch(err => {
      reject(err)
    })
  })
}

function remove(id) {
    return db('messages')
      .where('id', emailHash.decode(id))
      .del();
  }

function paginateFindByUserId({
  userId,
  page = 1,
  perPage = 25,
}) {
  const userIdDecoded = userHash.decode(userId)

  return new Promise(async function(resolve, reject) {
    const total = await db('messages').where('user_id', userIdDecoded).count('id')
    const query = db('messages')
      .where('user_id', userIdDecoded)
      .orderBy('id', 'desc')
      .offset(perPage * (page - 1))
      .limit(perPage)

    query.then(messages => {
      resolve({
        total: parseInt((total[0] || { count: '0' }).count),
        messages: messages.map(message => ({
          ...message,
          id: emailHash.encode(message.id),
          address_id: addressHash.encode(message.address_id),
          user_id: userHash.encode(message.user_id),
        }))
      })
    })
    .catch(err => {
      reject(err)
    })
  })
}