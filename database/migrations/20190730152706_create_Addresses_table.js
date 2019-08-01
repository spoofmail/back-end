exports.up = function(knex) {
    return knex.schema.createTable('addresses', addresses => {
      addresses.increments();
  
      addresses
        .string('addressname', 128)
        .notNullable()
      
      addresses
        .string('addresstag', 128)
        .notNullable();

      addresses
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  };
  
  exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('addresses');
  };
