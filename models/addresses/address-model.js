const db = require('../../database/dbConfig.js');
const { addressHash, userHash } = require('../../hashids/hashid.js');

module.exports = {
  add,
  find,
  findBy,
  findById,
  findByAddress,
  findByUserId,
  remove,
  update
};

function find() {
  return db('addresses').select('id', 'addressname');
}

function findByUserId(userId) {
  return new Promise(function(resolve, reject) {
    const decodedId = userHash.decode(userId)
    
    const query = db('addresses').where('user_id', decodedId)

    query.then(result => {
      resolve(result.map(address => ({
        ...address,
        id: addressHash.encode(address.id),
        user_id: userId,
      })))
    })
    .catch(err => {
      reject(err)
    })
  })
}

function findBy(filter) {
  if (filter.id) {
    filter.id = addressHash.decode(filter.id)
  }
  if (filter.user_id) {
    filter.user_id = userHash.decode(filter.user_id)
  }
  return new Promise(function(resolve, reject) {
    const query = db('addresses').where(filter);

    query.then(result => {
      resolve({
        ...result,
        id: addressHash.encode(result.id),
        user_id: userHash.encode(result.user_id)
      })
    })
    .catch(err => {
      reject(err)
    })
  })
}

function findByAddress(address) {
  return new Promise(function(resolve, reject) {
    const query = db('addresses')
      .where('addressname', address)
      .first();

    query.then(result => {
      if (!result || !result.id) return resolve(null)

      resolve({
        ...result,
        id: addressHash.encode(result.id),
        user_id: userHash.encode(result.user_id)
      })
    })
    .catch(err => {
      reject(err)
    })
  })
}

async function add(address) {
  address.user_id = userHash.decode(address.user_id)

  const [result] = await db('addresses').insert(address, 'id');

  return findById(addressHash.encode(result.id));
}

function findById(id) {
  return new Promise(function(resolve, reject) {
    const query = db('addresses')
      .where('id', addressHash.decode(id))
      .first();

    query.then(result => {
      resolve({
        ...result,
        id: addressHash.encode(result.id),
        user_id: userHash.encode(result.user_id)
      })
    })
    .catch(err => {
      reject(err)
    })
  })
}

function remove(id) {
    return db('addresses')
      .where('id', addressHash.decode(id))
      .del();
  }

  function update(id, changes) {
    return db('addresses')
      .where('id', addressHash.decode(id))
      .update(changes, '*');
  }