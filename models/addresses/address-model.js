const db = require('../../database/dbConfig.js');

module.exports = {
  add,
  find,
  findBy,
  findById,
  remove,
  update
};

function find() {
  return db('addresses').select('id', 'addressname', 'password');
}

function findBy(filter) {
  return db('addresses').where(filter);
}

async function add(address) {
  const [id] = await db('addresses').insert(address, 'id');

  return findById(id);
}

function findById(id) {
  return db('addresses')
    .where({ id })
    .first();
}

function remove(id) {
    return db('addresses')
      .where({ id })
      .del();
  }

  function update(id, changes) {
    return db('addresses')
      .where({ id })
      .update(changes, '*');
  }