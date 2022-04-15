const db = require('../../database/dbConfig.js');
const { userHash } = require('../../hashids/hashid.js');

module.exports = {
  add,
  find,
  findByUsername,
  findById,
  remove,
  update
};

function find() {
  return db('users').select('id', 'username', 'password');
}

function findByUsername(username) {
  return new Promise(function(resolve, reject) {
    const query = db('users').where('username', username).first();

    query.then(user => {
      if (!user) return resolve(null)

      resolve({
        ...user,
        id: userHash.encode(user.id)
      })
    })
    .catch(err => {
      reject(err)
    })
  })
}

async function add(user) {
  const [result] = await db('users').insert(user, "id");

  return findById(userHash.encode(result.id));
}

function findById(id) {
  return new Promise(function(resolve, reject) {
    const query = db('users')
      .where('id', userHash.decode(id))
      .first();

    query.then(result => {
      resolve({
        ...result,
        id: userHash.encode(result.id),
      })
    })
    .catch(err => {
      reject(err)
    })
  })
}

function remove(id) {
  return db('users')
    .where('id', userHash.decode(id))
    .del();
}

function update(id, changes) {
  return db('users')
    .where('id', userHash.decode(id))
    .update(changes, '*');
}
