const db = require('../../database/dbConfig.js');

module.exports = {
  add,
  find,
  findBy,
  findById,
  remove
};

function find() {
  return db('messages').select('id', 'messagename', 'password');
}

function findBy(filter) {
  return db('messages').where(filter);
}

async function add(message) {
  const [id] = await db('messages').insert(message, 'id');

  return findById(id);
}

function findById(id) {
  return db('messages')
    .where({ id })
    .first();
}

function remove(id) {
    return db('messages')
      .where({ id })
      .del();
  }