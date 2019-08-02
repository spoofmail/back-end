exports.up = function(knex) {
    return knex.schema.createTable('messages', messages => {
      messages.increments();
  
        messages
        .string('html', 50000)

        messages
        .string('subject', 5000)

        messages
        .string('text', 50000)

        messages
        .string('from', 5000)
        .notNullable()

        messages
        .string('to', 5000)
        .notNullable()

        messages
        .integer('address_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('addresses')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  };
  
  exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('messages');
  };
