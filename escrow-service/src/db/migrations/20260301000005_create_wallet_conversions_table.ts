import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wallet_conversions', (table) => {
    table.string('conversion_id', 36).primary();
    table.string('freelancer_id', 36).notNullable();
    table.integer('internal_amount').notNullable();
    table.integer('real_amount').notNullable();
    table.enum('status', ['pending', 'processed', 'cancelled']).defaultTo('pending');
    table.decimal('conversion_rate', 10, 4).defaultTo(1.0);
    table.integer('fees').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('processed_at').nullable();

    table.foreign('freelancer_id').references('user_id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wallet_conversions');
}
