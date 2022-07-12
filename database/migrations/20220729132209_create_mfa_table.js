exports.up = function(knex) {
    return knex.schema.createTable('mfa_requests', mfa_requests => {
      mfa_requests.increments();
  
      mfa_requests
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');

      mfa_requests.string('mfa_base32', 256).defaultTo(null);
      mfa_requests.bigInteger('mfa_code_expiry').defaultTo(null);
    });
  };
  
  exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('mfa_requests');
  };
