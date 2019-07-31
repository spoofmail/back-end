exports.up = function(knex) {
    return knex.schema.createTable('messages', messages => {
      messages.increments();
  
        messages
        .string('html', 5000)

        messages
        .string('subject', 128)

        messages
        .string('text', 5000)

        messages
        .string('from', 128)
        .notNullable()

        messages
        .string('to', 128)
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
